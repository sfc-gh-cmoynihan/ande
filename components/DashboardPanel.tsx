"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface DashboardData {
  totalCustomers: number
  customersByCountry: { COUNTRY: string; CNT: number }[]
  revenue: { STATUS: string; CONTRACT_COUNT: number; TOTAL_VALUE: number }[]
  claims: { STATUS: string; CLAIM_COUNT: number; TOTAL_AMOUNT: number }[]
  claimTypes: { CLAIM_TYPE: string; CNT: number; TOTAL_AMOUNT: number }[]
  claimsByMonth: { MONTH: string; CNT: number; TOTAL_AMOUNT: number }[]
}

const COLORS = ["#3b82f6", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#e11d48"]

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", flex: 1 }}>
      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export function DashboardPanel() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [drilldown, setDrilldown] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading dashboard...</div>
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>Failed to load dashboard</div>

  const totalRevenue = data.revenue.reduce((sum, r) => sum + (r.TOTAL_VALUE || 0), 0)
  const totalClaims = data.claims.reduce((sum, c) => sum + (c.CLAIM_COUNT || 0), 0)
  const totalClaimAmount = data.claims.reduce((sum, c) => sum + (c.TOTAL_AMOUNT || 0), 0)

  return (
    <div style={{ padding: "24px 32px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>Dashboard</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Customer metrics, revenue, and claims overview</p>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Customers" value={data.totalCustomers.toLocaleString()} sub="Across all source systems" />
        <MetricCard label="Total Revenue" value={`€${(totalRevenue / 1000000).toFixed(1)}M`} sub={`${data.revenue.reduce((s, r) => s + r.CONTRACT_COUNT, 0)} contracts`} />
        <MetricCard label="Total Claims" value={totalClaims.toString()} sub={`€${totalClaimAmount.toLocaleString()} claimed`} />
        <MetricCard label="Countries" value={data.customersByCountry.length.toString()} sub="Top regions represented" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Customers by Country</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.customersByCountry.slice(0, 8)} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="COUNTRY" fontSize={10} tick={{ fill: "#64748b" }} />
              <YAxis fontSize={10} tick={{ fill: "#64748b" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Bar dataKey="CNT" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Revenue by Contract Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.revenue} dataKey="TOTAL_VALUE" nameKey="STATUS" cx="50%" cy="50%" outerRadius={90} label={({ STATUS, percent }) => `${STATUS} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={11}>
                {data.revenue.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `€${(v/1000000).toFixed(2)}M`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
            Claims by Type
            {drilldown && <span style={{ fontSize: 11, color: "#3b82f6", marginLeft: 8, cursor: "pointer" }} onClick={() => setDrilldown(null)}>← Back to all</span>}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.claimTypes}
                dataKey="TOTAL_AMOUNT"
                nameKey="CLAIM_TYPE"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ CLAIM_TYPE, CNT }) => `${CLAIM_TYPE} (${CNT})`}
                labelLine={true}
                fontSize={11}
                onClick={(entry) => setDrilldown(entry.CLAIM_TYPE)}
                style={{ cursor: "pointer" }}
              >
                {data.claimTypes.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          {drilldown && (
            <div style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Drilldown: {drilldown} Claims</div>
              {(() => {
                const typeData = data.claimTypes.find(t => t.CLAIM_TYPE === drilldown)
                if (!typeData) return null
                const approved = data.claims.find(c => c.STATUS === "Approved")
                const pending = data.claims.find(c => c.STATUS === "Pending")
                const rejected = data.claims.find(c => c.STATUS === "Rejected")
                return (
                  <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                    <div><span style={{ color: "#16a34a", fontWeight: 600 }}>Count:</span> {typeData.CNT}</div>
                    <div><span style={{ color: "#3b82f6", fontWeight: 600 }}>Total:</span> €{typeData.TOTAL_AMOUNT.toLocaleString()}</div>
                    <div><span style={{ color: "#64748b", fontWeight: 600 }}>Avg:</span> €{Math.round(typeData.TOTAL_AMOUNT / typeData.CNT).toLocaleString()}</div>
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
              <YAxis fontSize={10} tick={{ fill: "#64748b" }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="TOTAL_AMOUNT" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Claims by Status</h3>
        <div style={{ display: "flex", gap: 24 }}>
          {data.claims.map((c, i) => (
            <div key={i} style={{ flex: 1, padding: 16, background: "#f8fafc", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.STATUS === "Approved" ? "#16a34a" : c.STATUS === "Pending" ? "#f59e0b" : "#dc2626" }}>{c.CLAIM_COUNT}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{c.STATUS}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>€{c.TOTAL_AMOUNT?.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
