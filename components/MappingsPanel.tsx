"use client"
import { useState, useRef, useEffect, useCallback } from "react"

interface DbtModel {
  name: string
  schema: string
  materialized: string
  description: string
  inputs: string[]
  outputs: string[]
  columns: ColumnLineage[]
}

interface ColumnLineage {
  column: string
  source_table: string
  source_column: string
  transformation: string
}

const DBT_MODELS: DbtModel[] = [
  {
    name: "stg_sap_customers",
    schema: "RAW",
    materialized: "view",
    description: "Staging model for SAP KNA1 customer master records",
    inputs: ["RAW.RAW_SAP_KNA1"],
    outputs: ["CLEANSED.cleansed_sap_customers"],
    columns: [
      { column: "source_id", source_table: "RAW_SAP_KNA1", source_column: "KUNNR", transformation: "Direct mapping" },
      { column: "full_name", source_table: "RAW_SAP_KNA1", source_column: "NAME2 + NAME1", transformation: "TRIM(COALESCE(NAME2,'') || ' ' || COALESCE(NAME1,''))" },
      { column: "first_name", source_table: "RAW_SAP_KNA1", source_column: "NAME2", transformation: "Direct mapping" },
      { column: "last_name", source_table: "RAW_SAP_KNA1", source_column: "NAME1", transformation: "Direct mapping" },
      { column: "email", source_table: "RAW_SAP_KNA1", source_column: "BAHNE", transformation: "LOWER(TRIM(BAHNE))" },
      { column: "phone", source_table: "RAW_SAP_KNA1", source_column: "TELF1", transformation: "REGEXP_REPLACE(TELF1, '[^0-9+]', '')" },
    ]
  },
  {
    name: "stg_sf_contacts",
    schema: "RAW",
    materialized: "view",
    description: "Staging model for Salesforce Contact records",
    inputs: ["RAW.RAW_SALESFORCE_CONTACT"],
    outputs: ["CLEANSED.cleansed_sf_contacts"],
    columns: [
      { column: "source_id", source_table: "RAW_SALESFORCE_CONTACT", source_column: "SF_ID", transformation: "Direct mapping" },
      { column: "full_name", source_table: "RAW_SALESFORCE_CONTACT", source_column: "FIRST_NAME + LAST_NAME", transformation: "TRIM(COALESCE(FIRST_NAME,'') || ' ' || COALESCE(LAST_NAME,''))" },
      { column: "email", source_table: "RAW_SALESFORCE_CONTACT", source_column: "EMAIL", transformation: "LOWER(TRIM(EMAIL))" },
      { column: "phone", source_table: "RAW_SALESFORCE_CONTACT", source_column: "MOBILE_PHONE / PHONE", transformation: "REGEXP_REPLACE(COALESCE(MOBILE_PHONE, PHONE), '[^0-9+]', '')" },
    ]
  },
  {
    name: "cleansed_sap_customers",
    schema: "CLEANSED",
    materialized: "view",
    description: "Cleansed SAP customers with standardised names, emails, and phone numbers",
    inputs: ["RAW.stg_sap_customers"],
    outputs: ["MATCHED.match_clusters_jaro"],
    columns: [
      { column: "full_name", source_table: "stg_sap_customers", source_column: "full_name", transformation: "INITCAP(TRIM(REGEXP_REPLACE(full_name, '\\s+', ' ')))" },
      { column: "email", source_table: "stg_sap_customers", source_column: "email", transformation: "LOWER(TRIM(email))" },
      { column: "phone_normalised", source_table: "stg_sap_customers", source_column: "phone", transformation: "Normalise to +353 format" },
    ]
  },
  {
    name: "cleansed_sf_contacts",
    schema: "CLEANSED",
    materialized: "view",
    description: "Cleansed Salesforce contacts with standardised names, emails, and phone numbers",
    inputs: ["RAW.stg_sf_contacts"],
    outputs: ["MATCHED.match_clusters_jaro"],
    columns: [
      { column: "full_name", source_table: "stg_sf_contacts", source_column: "full_name", transformation: "INITCAP(TRIM(REGEXP_REPLACE(full_name, '\\s+', ' ')))" },
      { column: "email", source_table: "stg_sf_contacts", source_column: "email", transformation: "LOWER(TRIM(email))" },
      { column: "phone_normalised", source_table: "stg_sf_contacts", source_column: "phone", transformation: "Normalise to +353 format" },
    ]
  },
  {
    name: "match_clusters_jaro",
    schema: "MATCHED",
    materialized: "table",
    description: "Cross-system fuzzy matching using JAROWINKLER_SIMILARITY. Matches SAP to Salesforce by name (30%), email (30%), phone (20%), address (20%).",
    inputs: ["CLEANSED.cleansed_sap_customers", "CLEANSED.cleansed_sf_contacts"],
    outputs: ["PUBLIC.customer_golden_record"],
    columns: [
      { column: "sap_name", source_table: "cleansed_sap_customers", source_column: "full_name", transformation: "Direct mapping" },
      { column: "sf_name", source_table: "cleansed_sf_contacts", source_column: "full_name", transformation: "Direct mapping" },
      { column: "name_score", source_table: "CROSS JOIN", source_column: "sap.full_name × sf.full_name", transformation: "JAROWINKLER_SIMILARITY(UPPER(sap.full_name), UPPER(sf.full_name))" },
      { column: "email_score", source_table: "CROSS JOIN", source_column: "sap.email × sf.email", transformation: "JAROWINKLER_SIMILARITY(sap.email, sf.email)" },
      { column: "phone_score", source_table: "CROSS JOIN", source_column: "sap.phone × sf.phone", transformation: "JAROWINKLER_SIMILARITY(sap.phone_normalised, sf.phone_normalised)" },
      { column: "weighted_score", source_table: "Computed", source_column: "name + email + phone + address", transformation: "(name×0.30) + (email×0.30) + (phone×0.20) + (address×0.20)" },
      { column: "match_type", source_table: "Computed", source_column: "scores", transformation: "EXACT_EMAIL / EXACT_PHONE / HIGH_CONFIDENCE / FUZZY_NAME" },
    ]
  },
  {
    name: "customer_golden_record",
    schema: "PUBLIC",
    materialized: "table",
    description: "Golden customer record - best record per matched cluster, selected by data completeness",
    inputs: ["MATCHED.match_clusters_jaro", "CLEANSED.cleansed_sap_customers", "CLEANSED.cleansed_sf_contacts"],
    outputs: [],
    columns: [
      { column: "master_customer_id", source_table: "Computed", source_column: "ROW_NUMBER()", transformation: "'MCR-' || LPAD(ROW_NUMBER(), 8, '0')" },
      { column: "full_name", source_table: "Best record in cluster", source_column: "full_name", transformation: "Selected by: email > phone > city > name length" },
      { column: "email", source_table: "Best record in cluster", source_column: "email", transformation: "Highest completeness record" },
      { column: "record_count", source_table: "Computed", source_column: "COUNT(*) OVER cluster", transformation: "COUNT(*) OVER (PARTITION BY cluster_key)" },
    ]
  },
]

const LAYER_COLORS: Record<string, string> = {
  RAW: "#6366f1",
  CLEANSED: "#0ea5e9",
  MATCHED: "#f59e0b",
  PUBLIC: "#16a34a",
}

const LAYER_ORDER = ["RAW", "CLEANSED", "MATCHED", "PUBLIC"]

export function MappingsPanel() {
  const [selectedModel, setSelectedModel] = useState<DbtModel | null>(null)
  const [arrows, setArrows] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const modelsByLayer = LAYER_ORDER.map(layer => ({
    layer,
    models: DBT_MODELS.filter(m => m.schema === layer)
  }))

  const DAG_EDGES = [
    { from: "stg_sap_customers", to: "cleansed_sap_customers" },
    { from: "stg_sf_contacts", to: "cleansed_sf_contacts" },
    { from: "cleansed_sap_customers", to: "match_clusters_jaro" },
    { from: "cleansed_sf_contacts", to: "match_clusters_jaro" },
    { from: "match_clusters_jaro", to: "customer_golden_record" },
  ]

  const calculateArrows = useCallback(() => {
    if (!containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const newArrows = DAG_EDGES.map(edge => {
      const fromEl = nodeRefs.current[edge.from]
      const toEl = nodeRefs.current[edge.to]
      if (!fromEl || !toEl) return null
      const fromRect = fromEl.getBoundingClientRect()
      const toRect = toEl.getBoundingClientRect()
      return {
        x1: fromRect.right - containerRect.left,
        y1: fromRect.top + fromRect.height / 2 - containerRect.top,
        x2: toRect.left - containerRect.left,
        y2: toRect.top + toRect.height / 2 - containerRect.top,
      }
    }).filter(Boolean) as { x1: number; y1: number; x2: number; y2: number }[]
    setArrows(newArrows)
  }, [])

  useEffect(() => {
    calculateArrows()
    window.addEventListener("resize", calculateArrows)
    return () => window.removeEventListener("resize", calculateArrows)
  }, [calculateArrows])

  useEffect(() => {
    const timer = setTimeout(calculateArrows, 100)
    return () => clearTimeout(timer)
  }, [selectedModel, calculateArrows])

  return (
    <div style={{ padding: "24px 32px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>dbt Transformation Pipeline</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>RAW → CLEANSED → MATCHED → GOLDEN — Column-level lineage for Customer 360</p>
      </div>

      <div ref={containerRef} style={{ position: "relative", marginBottom: 32, padding: 20, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible", zIndex: 0 }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
            </marker>
          </defs>
          {arrows.map((arrow, i) => {
            const midX = (arrow.x1 + arrow.x2) / 2
            return (
              <path
                key={i}
                d={`M ${arrow.x1} ${arrow.y1} C ${midX} ${arrow.y1}, ${midX} ${arrow.y2}, ${arrow.x2} ${arrow.y2}`}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeOpacity="0.6"
                markerEnd="url(#arrowhead)"
              />
            )
          })}
        </svg>

        <div style={{ display: "flex", gap: 40, position: "relative", zIndex: 1 }}>
          {modelsByLayer.map(({ layer, models }) => (
            <div key={layer} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: LAYER_COLORS[layer], marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: LAYER_COLORS[layer] }} />
                {layer}
              </div>
              {models.map(model => (
                <div
                  key={model.name}
                  ref={el => { nodeRefs.current[model.name] = el }}
                  onClick={() => setSelectedModel(model)}
                  style={{
                    padding: "10px 12px",
                    marginBottom: 14,
                    background: selectedModel?.name === model.name ? "#fff" : "#fff",
                    border: `2px solid ${selectedModel?.name === model.name ? LAYER_COLORS[layer] : "#e2e8f0"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: selectedModel?.name === model.name ? `0 0 0 3px ${LAYER_COLORS[layer]}20` : "none",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ background: selectedModel?.name === model.name ? LAYER_COLORS[layer] : "#e2e8f0", color: selectedModel?.name === model.name ? "#fff" : "#64748b", padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 600 }}>{model.materialized}</span>
                    {model.name}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {model.columns.slice(0, 5).map((col, ci) => (
                      <div key={ci} style={{ fontSize: 9, fontFamily: "monospace", color: "#64748b", padding: "2px 6px", background: "#f8fafc", borderRadius: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {col.column}
                      </div>
                    ))}
                    {model.columns.length > 5 && (
                      <div style={{ fontSize: 9, color: "#94a3b8", paddingLeft: 6 }}>+{model.columns.length - 5} more</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {LAYER_ORDER.map(layer => (
          <div key={layer} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: LAYER_COLORS[layer] }} />
            {layer}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b", marginLeft: 16 }}>
          <span style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: 3, fontSize: 10 }}>view</span> Ephemeral
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
          <span style={{ background: "#1e293b", color: "#fff", padding: "2px 6px", borderRadius: 3, fontSize: 10 }}>table</span> Persisted
        </div>
      </div>

      {selectedModel && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{selectedModel.name}</h3>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b" }}>{selectedModel.description}</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span style={{ background: `${LAYER_COLORS[selectedModel.schema]}18`, color: LAYER_COLORS[selectedModel.schema], padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{selectedModel.schema}</span>
              <span style={{ background: selectedModel.materialized === "table" ? "#1e293b" : "#e2e8f0", color: selectedModel.materialized === "table" ? "#fff" : "#475569", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{selectedModel.materialized}</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Inputs</div>
              {selectedModel.inputs.map((inp, i) => (
                <div key={i} style={{ fontSize: 12, color: "#1e293b", padding: "4px 8px", background: "#f1f5f9", borderRadius: 4, marginBottom: 4, fontFamily: "monospace" }}>← {inp}</div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Outputs</div>
              {selectedModel.outputs.length > 0 ? selectedModel.outputs.map((out, i) => (
                <div key={i} style={{ fontSize: 12, color: "#1e293b", padding: "4px 8px", background: "#f0fdf4", borderRadius: 4, marginBottom: 4, fontFamily: "monospace" }}>→ {out}</div>
              )) : (
                <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>★ Final output (Golden Record)</div>
              )}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Column-Level Lineage</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedModel.columns.map((col, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>{col.column}</span>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{col.source_table}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                    ← <span style={{ fontFamily: "monospace", color: "#6366f1" }}>{col.source_column}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", background: "#f1f5f9", padding: "3px 6px", borderRadius: 3, display: "inline-block" }}>
                    {col.transformation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!selectedModel && (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>
          Click a model above to view column-level lineage
        </div>
      )}
    </div>
  )
}
