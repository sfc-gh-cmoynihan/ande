"use client"
import { useState, useEffect } from "react"
import { Search, AlertCircle, Download } from "lucide-react"

interface Claim {
  CLAIM_ID: string
  MASTER_CUSTOMER_ID: string
  CUSTOMER_NAME: string
  CUSTOMER_EMAIL: string
  CLAIM_TYPE: string
  CLAIM_DATE: string
  CLAIM_AMOUNT: number
  STATUS: string
  DESCRIPTION: string
  RESOLUTION_DATE: string
  COUNTRY: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Approved: { bg: "#66bb6a20", text: "#66bb6a" },
  Pending: { bg: "#ffa72620", text: "#ffa726" },
  Rejected: { bg: "#ef535020", text: "#ef5350" },
}

const TYPE_COLORS: Record<string, string> = {
  "Private Motor Insurance": "#2196f3",
  "Commercial Motor Fleet": "#ff9800",
  "Payment Protection Insurance (PPI)": "#4caf50",
  "Reinsurance": "#9c27b0",
}

export function DocumentSearchPanel() {
  const [claimIdInput, setClaimIdInput] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [emailInput, setEmailInput] = useState("colm.moynihan@snowflake.com")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(false)

  const doSearch = async (overrides?: { email?: string }) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (claimIdInput) params.set("claimId", claimIdInput)
    if (nameInput) params.set("name", nameInput)
    const searchEmail = overrides?.email || emailInput
    if (searchEmail) params.set("email", searchEmail)
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    try {
      const res = await fetch(`/api/documents/search?${params.toString()}`)
      const data = await res.json()
      setClaims(Array.isArray(data) ? data : [])
    } catch {
      setClaims([])
    }
    setLoading(false)
  }

  useEffect(() => {
    doSearch({ email: "colm.moynihan@snowflake.com" })
  }, [])

  return (
    <div>
      <div className="page-header">
        <h2>Claims Search</h2>
        <p>Search and view insurance claims by Claim ID</p>
      </div>

      <div className="card">
        <div className="search-row">
          <div className="input-group">
            <label>Claim ID</label>
            <input
              type="text"
              placeholder="e.g. CLM-001"
              value={claimIdInput}
              onChange={(e) => setClaimIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
          </div>
          <div className="input-group">
            <label>Customer Name</label>
            <input
              type="text"
              placeholder="e.g. Colm Moynihan"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
          </div>
        </div>
        <div className="search-row" style={{ marginTop: "1rem", alignItems: "flex-end" }}>
          <div className="input-group">
            <label>Customer Email</label>
            <input
              type="text"
              placeholder="e.g. colm.moynihan@snowflake.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
          </div>
          <div className="input-group">
            <label>Claim Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
          </div>
          <div className="input-group">
            <label>Claim Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
          </div>
          <button className="btn btn-primary" onClick={doSearch} disabled={loading} style={{ alignSelf: "flex-end" }}>
            <Search size={14} /> {loading ? "Searching..." : "Claim Search"}
          </button>
        </div>
      </div>

      {loading && <div className="loading"><div className="spinner" /> Loading claims...</div>}

      {claims.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
            {claims.length} claim{claims.length !== 1 ? "s" : ""} found
          </div>

          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{claims.length}</div>
              <div className="stat-label">Total Claims</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">EUR {claims.reduce((s, c) => s + c.CLAIM_AMOUNT, 0).toLocaleString()}</div>
              <div className="stat-label">Total Value</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{claims.filter((c) => c.STATUS === "Approved").length}</div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{claims.filter((c) => c.STATUS === "Pending").length}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          {claims.map((c) => {
            const statusStyle = STATUS_COLORS[c.STATUS] || { bg: "#9e9e9e20", text: "#9e9e9e" }
            const typeColor = TYPE_COLORS[c.CLAIM_TYPE] || "#757575"
            return (
              <div key={c.CLAIM_ID} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <AlertCircle size={16} color={typeColor} />
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                    background: `${typeColor}20`, color: typeColor, textTransform: "uppercase", letterSpacing: "0.5px"
                  }}>
                    {c.CLAIM_TYPE}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                    {c.CLAIM_ID}
                  </span>
                  <span style={{
                    marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                    background: statusStyle.bg, color: statusStyle.text
                  }}>
                    {c.STATUS}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  EUR {c.CLAIM_AMOUNT.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                  {c.CUSTOMER_NAME}{c.CUSTOMER_EMAIL ? ` • ${c.CUSTOMER_EMAIL}` : ""} • {c.CLAIM_DATE} • {c.COUNTRY}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-secondary)", background: "var(--bg-secondary)", padding: 10, borderRadius: 6 }}>
                  {c.DESCRIPTION}
                </div>
                {c.RESOLUTION_DATE && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                    Resolution date: {c.RESOLUTION_DATE}
                  </div>
                )}
                <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                  <a
                    href={`/api/documents/pdf?claimId=${encodeURIComponent(c.CLAIM_ID)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600 }}
                  >
                    <Download size={13} /> Download PDF
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {claims.length === 0 && !loading && (
        <div className="card" style={{ marginTop: 20, textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
          No claims found. Try a different Claim ID.
        </div>
      )}
    </div>
  )
}
