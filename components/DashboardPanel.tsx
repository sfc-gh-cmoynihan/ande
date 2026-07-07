"use client"
import { useState, useEffect, useMemo } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface ContractRow {
  CONTRACT_ID: string
  CUSTOMER_NAME: string
  CONTRACT_TITLE: string
  CONTRACT_DATE: string
  EXPIRY_DATE: string
  CONTRACT_VALUE: number
  STATUS: string
  MASTER_CUSTOMER_ID: string
}

interface CityRow {
  CITY: string
  CNT: number
}

interface DashboardData {
  totalCustomers: number
  totalMargin: number
  customersByCountry: { COUNTRY: string; CNT: number }[]
  revenue: { STATUS: string; CONTRACT_COUNT: number; TOTAL_VALUE: number }[]
  claims: { STATUS: string; CLAIM_COUNT: number; TOTAL_AMOUNT: number }[]
  claimTypes: { CLAIM_TYPE: string; CNT: number; TOTAL_AMOUNT: number }[]
  claimsByMonth: { MONTH: string; CNT: number; TOTAL_AMOUNT: number }[]
  topContracts: ContractRow[]
}

type SortKey = keyof ContractRow
type SortDir = "asc" | "desc"

const COLORS = ["#3b82f6", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#e11d48"]

const COUNTRY_COLORS: Record<string, string> = {
  "United Kingdom": "#1e40af",
  "Germany": "#dc2626",
  "Italy": "#16a34a",
  "Spain": "#f59e0b",
  "France": "#7c3aed",
  "Belgium": "#0891b2",
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", flex: 1, borderTop: `3px solid ${accent || "#3b82f6"}` }}>
      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span style={{ color: "#cbd5e1", marginLeft: 4 }}>⇅</span>
  return <span style={{ color: "#3b82f6", marginLeft: 4 }}>{dir === "asc" ? "↑" : "↓"}</span>
}

export function DashboardPanel() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [drilldown, setDrilldown] = useState<string | null>(null)
  const [countryDrilldown, setCountryDrilldown] = useState<string | null>(null)
  const [cityData, setCityData] = useState<CityRow[]>([])
  const [cityLoading, setCityLoading] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("CONTRACT_VALUE")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [filterText, setFilterText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null)
  const [view, setView] = useState<"overview" | "grid">("overview")

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filteredContracts = useMemo(() => {
    if (!data) return []
    let rows = [...data.topContracts]
    if (filterText) {
      const q = filterText.toLowerCase()
      rows = rows.filter(r =>
        r.CUSTOMER_NAME.toLowerCase().includes(q) ||
        r.CONTRACT_TITLE.toLowerCase().includes(q) ||
        r.CONTRACT_ID.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "All") {
      rows = rows.filter(r => r.STATUS === statusFilter)
    }
    rows.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return rows
  }, [data, filterText, statusFilter, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading dashboard...</div>
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>Failed to load dashboard</div>

  const totalRevenue = data.revenue.reduce((sum, r) => sum + (r.TOTAL_VALUE || 0), 0)
  const totalClaims = data.claims.reduce((sum, c) => sum + (c.CLAIM_COUNT || 0), 0)
  const totalClaimAmount = data.claims.reduce((sum, c) => sum + (c.TOTAL_AMOUNT || 0), 0)
  const statuses = ["All", ...Array.from(new Set(data.topContracts.map(c => c.STATUS)))]

  const thStyle: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none", background: "#f8fafc", position: "sticky", top: 0 }
  const tdStyle: React.CSSProperties = { padding: "10px 12px", fontSize: 12, borderBottom: "1px solid #f1f5f9", color: "#1e293b" }

  return (
    <div style={{ padding: "24px 32px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
      {/* Header with view toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>Dashboard</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Customer metrics, revenue, contracts, and claims overview</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 8, padding: 3 }}>
          <button onClick={() => setView("overview")} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", background: view === "overview" ? "#fff" : "transparent", color: view === "overview" ? "#1e293b" : "#64748b", boxShadow: view === "overview" ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>Overview</button>
          <button onClick={() => setView("grid")} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", background: view === "grid" ? "#fff" : "transparent", color: view === "grid" ? "#1e293b" : "#64748b", boxShadow: view === "grid" ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>Top Contracts</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Customers" value={data.totalCustomers.toLocaleString()} sub="Golden records across all sources" accent="#3b82f6" />
        <MetricCard label="Total Margin" value={`€${(data.totalMargin / 1000000).toFixed(1)}M`} sub={`${data.revenue.reduce((s, r) => s + r.CONTRACT_COUNT, 0)} active contracts`} accent="#16a34a" />
        <MetricCard label="Total Claims" value={totalClaims.toString()} sub={`€${(totalClaimAmount / 1000000).toFixed(2)}M total claimed`} accent="#f59e0b" />
        <MetricCard label="Top Contract" value={data.topContracts.length > 0 ? `€${(data.topContracts[0].CONTRACT_VALUE / 1000000).toFixed(1)}M` : "—"} sub={data.topContracts.length > 0 ? data.topContracts[0].CUSTOMER_NAME : ""} accent="#8b5cf6" />
      </div>

      {view === "overview" && (
        <>
          {/* Charts Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                {countryDrilldown ? `Customers in ${countryDrilldown} by Area` : "Customers by Country"}
                {countryDrilldown && <span style={{ fontSize: 11, color: "#3b82f6", marginLeft: 8, cursor: "pointer" }} onClick={() => { setCountryDrilldown(null); setCityData([]) }}>← Back</span>}
              </h3>
              {!countryDrilldown ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.customersByCountry} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="COUNTRY" fontSize={10} tick={{ fill: "#64748b" }} />
                    <YAxis fontSize={10} tick={{ fill: "#64748b" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => v.toLocaleString()} />
                    <Bar dataKey="CNT" radius={[4, 4, 0, 0]} onClick={(entry) => {
                      setCountryDrilldown(entry.COUNTRY)
                      setCityLoading(true)
                      fetch(`/api/dashboard?drilldown=${encodeURIComponent(entry.COUNTRY)}`)
                        .then(r => r.json())
                        .then(d => { setCityData(d.cities || []); setCityLoading(false) })
                        .catch(() => setCityLoading(false))
                    }} style={{ cursor: "pointer" }}>
                      {data.customersByCountry.map((entry, i) => (
                        <Cell key={i} fill={COUNTRY_COLORS[entry.COUNTRY] || COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : cityLoading ? (
                <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>Loading areas...</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={cityData.slice(0, 12)} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="CITY" fontSize={9} tick={{ fill: "#64748b" }} angle={-20} textAnchor="end" height={50} />
                    <YAxis fontSize={10} tick={{ fill: "#64748b" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => v.toLocaleString()} />
                    <Bar dataKey="CNT" radius={[4, 4, 0, 0]}>
                      {cityData.slice(0, 12).map((_, i) => (
                        <Cell key={i} fill={COUNTRY_COLORS[countryDrilldown] || COLORS[i]} opacity={1 - i * 0.05} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Revenue by Contract Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.revenue} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="STATUS" fontSize={11} tick={{ fill: "#64748b" }} />
                  <YAxis fontSize={10} tick={{ fill: "#64748b" }} tickFormatter={v => `€${(v/1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(v: number) => `€${(v/1000000).toFixed(2)}M`} />
                  <Legend />
                  <Bar dataKey="TOTAL_VALUE" name="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]}>
                    {data.revenue.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                Claims by Type
                {drilldown && <span style={{ fontSize: 11, color: "#3b82f6", marginLeft: 8, cursor: "pointer" }} onClick={() => setDrilldown(null)}>← Back to all</span>}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.claimTypes}
                    dataKey="TOTAL_AMOUNT"
                    nameKey="CLAIM_TYPE"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={0}
                    label={({ CLAIM_TYPE, CNT, x, y }) => (
                      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600} fill="#1e293b">
                        {`${CLAIM_TYPE} (${CNT})`}
                      </text>
                    )}
                    labelLine={true}
                    onClick={(entry) => setDrilldown(entry.CLAIM_TYPE)}
                    style={{ cursor: "pointer" }}
                  >
                    {data.claimTypes.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `€${(v / 1000000).toFixed(2)}M`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              {drilldown && (
                <div style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Drilldown: {drilldown} Claims</div>
                  {(() => {
                    const typeData = data.claimTypes.find(t => t.CLAIM_TYPE === drilldown)
                    if (!typeData) return null
                    return (
                      <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                        <div><span style={{ color: "#16a34a", fontWeight: 600 }}>Count:</span> {typeData.CNT}</div>
                        <div><span style={{ color: "#3b82f6", fontWeight: 600 }}>Total:</span> €{(typeData.TOTAL_AMOUNT / 1000000).toFixed(2)}M</div>
                        <div><span style={{ color: "#64748b", fontWeight: 600 }}>Avg:</span> €{(typeData.TOTAL_AMOUNT / typeData.CNT / 1000000).toFixed(2)}M</div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Claims Trend (Monthly)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.claimsByMonth} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="MONTH" fontSize={10} tick={{ fill: "#64748b" }} />
                  <YAxis fontSize={10} tick={{ fill: "#64748b" }} tickFormatter={v => `€${(v/1000000).toFixed(2)}M`} />
                  <Tooltip formatter={(v: number) => `€${(v / 1000000).toFixed(2)}M`} />
                  <Line type="monotone" dataKey="TOTAL_AMOUNT" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Claims by Status */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Claims by Status</h3>
            <div style={{ display: "flex", gap: 24 }}>
              {data.claims.map((c, i) => (
                <div key={i} style={{ flex: 1, padding: 16, background: "#f8fafc", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c.STATUS === "Approved" ? "#16a34a" : c.STATUS === "Pending" ? "#f59e0b" : "#dc2626" }}>{c.CLAIM_COUNT}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{c.STATUS}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>€{c.TOTAL_AMOUNT ? (c.TOTAL_AMOUNT / 1000000).toFixed(2) : '0.00'}M</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Top 5 Contracts Table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Top Contracts by Value</h3>
              <button onClick={() => setView("grid")} style={{ fontSize: 11, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View All →</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, position: "relative" }}>Customer</th>
                  <th style={{ ...thStyle, position: "relative" }}>Contract</th>
                  <th style={{ ...thStyle, position: "relative", textAlign: "right" }}>Value</th>
                  <th style={{ ...thStyle, position: "relative" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.topContracts.slice(0, 5).map((c, i) => (
                  <tr key={i} style={{ cursor: "pointer", background: i % 2 === 0 ? "#fff" : "#fafbfc" }} onClick={() => { setSelectedContract(c); setView("grid") }}>
                    <td style={tdStyle}><span style={{ fontWeight: 600 }}>{c.CUSTOMER_NAME}</span></td>
                    <td style={tdStyle}>{c.CONTRACT_TITLE}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>€{(c.CONTRACT_VALUE / 1000000).toFixed(2)}M</td>
                    <td style={tdStyle}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: c.STATUS === "Active" ? "#dcfce7" : c.STATUS === "Expired" ? "#fef2f2" : "#fef9c3", color: c.STATUS === "Active" ? "#166534" : c.STATUS === "Expired" ? "#991b1b" : "#854d0e" }}>{c.STATUS}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "grid" && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: 12, padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginRight: 8 }}>Top 100 Contracts</div>
            <input
              type="text"
              placeholder="Search customer, contract, ID..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, width: 240, outline: "none" }}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer" }}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}>{filteredContracts.length} contracts shown</div>
            <button onClick={() => setView("overview")} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#475569" }}>← Back to Overview</button>
          </div>

          {/* Contract Detail Drilldown */}
          {selectedContract && (
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#eff6ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{selectedContract.CONTRACT_TITLE}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                    <span style={{ fontWeight: 600 }}>{selectedContract.CUSTOMER_NAME}</span> · {selectedContract.CONTRACT_ID} · {selectedContract.MASTER_CUSTOMER_ID}
                  </div>
                  <div style={{ display: "flex", gap: 20, marginTop: 8, fontSize: 12, color: "#64748b" }}>
                    <div><span style={{ fontWeight: 600 }}>Value:</span> €{selectedContract.CONTRACT_VALUE.toLocaleString()}</div>
                    <div><span style={{ fontWeight: 600 }}>Start:</span> {selectedContract.CONTRACT_DATE}</div>
                    <div><span style={{ fontWeight: 600 }}>Expiry:</span> {selectedContract.EXPIRY_DATE}</div>
                    <div><span style={{ fontWeight: 600 }}>Status:</span> {selectedContract.STATUS}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedContract(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b" }}>✕</button>
              </div>
            </div>
          )}

          {/* Data Grid */}
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={thStyle} onClick={() => handleSort("CONTRACT_ID")}># ID <SortIcon active={sortKey === "CONTRACT_ID"} dir={sortDir} /></th>
                  <th style={thStyle} onClick={() => handleSort("CUSTOMER_NAME")}>Customer <SortIcon active={sortKey === "CUSTOMER_NAME"} dir={sortDir} /></th>
                  <th style={thStyle} onClick={() => handleSort("CONTRACT_TITLE")}>Contract Title <SortIcon active={sortKey === "CONTRACT_TITLE"} dir={sortDir} /></th>
                  <th style={{ ...thStyle, textAlign: "right" }} onClick={() => handleSort("CONTRACT_VALUE")}>Value <SortIcon active={sortKey === "CONTRACT_VALUE"} dir={sortDir} /></th>
                  <th style={thStyle} onClick={() => handleSort("CONTRACT_DATE")}>Start <SortIcon active={sortKey === "CONTRACT_DATE"} dir={sortDir} /></th>
                  <th style={thStyle} onClick={() => handleSort("EXPIRY_DATE")}>Expiry <SortIcon active={sortKey === "EXPIRY_DATE"} dir={sortDir} /></th>
                  <th style={thStyle} onClick={() => handleSort("STATUS")}>Status <SortIcon active={sortKey === "STATUS"} dir={sortDir} /></th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((c, i) => (
                  <tr
                    key={c.CONTRACT_ID}
                    onClick={() => setSelectedContract(c)}
                    style={{ cursor: "pointer", background: selectedContract?.CONTRACT_ID === c.CONTRACT_ID ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#fafbfc", transition: "background .1s" }}
                    onMouseEnter={e => { if (selectedContract?.CONTRACT_ID !== c.CONTRACT_ID) (e.currentTarget as HTMLElement).style.background = "#f0f9ff" }}
                    onMouseLeave={e => { if (selectedContract?.CONTRACT_ID !== c.CONTRACT_ID) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "#fff" : "#fafbfc" }}
                  >
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{c.CONTRACT_ID}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{c.CUSTOMER_NAME}</td>
                    <td style={tdStyle}>{c.CONTRACT_TITLE}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#1e293b" }}>€{(c.CONTRACT_VALUE / 1000000).toFixed(2)}M</td>
                    <td style={{ ...tdStyle, color: "#64748b" }}>{c.CONTRACT_DATE}</td>
                    <td style={{ ...tdStyle, color: "#64748b" }}>{c.EXPIRY_DATE}</td>
                    <td style={tdStyle}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: c.STATUS === "Active" ? "#dcfce7" : c.STATUS === "Expired" ? "#fef2f2" : "#fef9c3", color: c.STATUS === "Active" ? "#166534" : c.STATUS === "Expired" ? "#991b1b" : "#854d0e" }}>{c.STATUS}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredContracts.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No contracts match your filters</div>
            )}
          </div>

          {/* Footer summary */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", gap: 24, fontSize: 11, color: "#64748b" }}>
            <div><span style={{ fontWeight: 700 }}>Total Value:</span> €{(filteredContracts.reduce((s, c) => s + c.CONTRACT_VALUE, 0) / 1000000).toFixed(2)}M</div>
            <div><span style={{ fontWeight: 700 }}>Avg Value:</span> €{filteredContracts.length > 0 ? ((filteredContracts.reduce((s, c) => s + c.CONTRACT_VALUE, 0) / filteredContracts.length) / 1000000).toFixed(2) : "0"}M</div>
            <div><span style={{ fontWeight: 700 }}>Active:</span> {filteredContracts.filter(c => c.STATUS === "Active").length}</div>
            <div><span style={{ fontWeight: 700 }}>Expired:</span> {filteredContracts.filter(c => c.STATUS === "Expired").length}</div>
          </div>
        </div>
      )}
    </div>
  )
}
