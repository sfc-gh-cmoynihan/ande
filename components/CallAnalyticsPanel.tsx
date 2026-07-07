"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface AnalyticsData {
  summary: { TOTAL_CALLS: number; AVG_DURATION: number; TOTAL_MINUTES: number; TOTAL_AGENTS: number; UNIQUE_CUSTOMERS: number }
  byAgent: { AGENT_NAME: string; CALL_COUNT: number; AVG_DURATION: number; POSITIVE: number; NEUTRAL: number; NEGATIVE: number }[]
  sentimentByAgent: { AGENT_NAME: string; SENTIMENT: string; CNT: number }[]
  byMonth: { MONTH: string; CALL_COUNT: number; AVG_DURATION: number; NEGATIVE_COUNT: number }[]
  byType: { CALL_TYPE: string; CNT: number; AVG_DURATION: number }[]
  churnRisk: { MASTER_CUSTOMER_ID: string; FULL_NAME: string; TOTAL_CALLS: number; NEGATIVE_CALLS: number; NEGATIVE_PCT: number; LAST_CALL: string }[]
}

type DrillView = "overview" | "sentiment" | "agent" | "churn"

const COLORS = ["#3b82f6", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4"]
const SENTIMENT_COLORS: Record<string, string> = { Positive: "#16a34a", Neutral: "#64748b", Negative: "#dc2626" }

function MetricCard({ label, value, sub, accent, onClick }: { label: string; value: string; sub?: string; accent?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 22px", flex: 1, borderTop: `3px solid ${accent || "#3b82f6"}`, cursor: onClick ? "pointer" : "default", transition: "box-shadow .15s" }} onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.08)")} onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function DrillNav({ view, setView }: { view: DrillView; setView: (v: DrillView) => void }) {
  const tabs: { id: DrillView; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "sentiment", label: "Sentiment" },
    { id: "agent", label: "Agent" },
    { id: "churn", label: "Churn Risk" },
  ]
  return (
    <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 8, padding: 3, marginBottom: 24 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setView(t.id)} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", background: view === t.id ? "#fff" : "transparent", color: view === t.id ? "#1e293b" : "#64748b", boxShadow: view === t.id ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>{t.label}</button>
      ))}
    </div>
  )
}

export function CallAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<DrillView>("overview")
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/calls/analytics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading call analytics...</div>
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>Failed to load analytics</div>

  const { summary } = data
  const sentimentTotal = data.byAgent.reduce((s, a) => s + a.POSITIVE + a.NEUTRAL + a.NEGATIVE, 0)
  const positiveTotal = data.byAgent.reduce((s, a) => s + a.POSITIVE, 0)
  const neutralTotal = data.byAgent.reduce((s, a) => s + a.NEUTRAL, 0)
  const negativeTotal = data.byAgent.reduce((s, a) => s + a.NEGATIVE, 0)

  const agentData = data.byAgent.map(a => ({
    name: a.AGENT_NAME.split(" ")[0],
    fullName: a.AGENT_NAME,
    Positive: a.POSITIVE,
    Neutral: a.NEUTRAL,
    Negative: a.NEGATIVE,
    total: a.CALL_COUNT,
    avgDuration: a.AVG_DURATION,
    satisfaction: a.CALL_COUNT > 0 ? Math.round(a.POSITIVE * 100 / a.CALL_COUNT) : 0,
  }))

  const sentimentPieData = [
    { name: "Positive", value: positiveTotal, color: "#16a34a" },
    { name: "Neutral", value: neutralTotal, color: "#64748b" },
    { name: "Negative", value: negativeTotal, color: "#dc2626" },
  ]

  return (
    <div style={{ padding: "24px 32px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
      {/* KPI Row - clickable */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Calls Completed" value={summary.TOTAL_CALLS.toString()} sub={`${summary.UNIQUE_CUSTOMERS} customers · ${summary.TOTAL_AGENTS} agents`} accent="#3b82f6" onClick={() => setView("overview")} />
        <MetricCard label="Avg Duration" value={`${Math.floor(summary.AVG_DURATION / 60)}m ${summary.AVG_DURATION % 60}s`} sub={`${summary.TOTAL_MINUTES} total minutes`} accent="#8b5cf6" onClick={() => setView("agent")} />
        <MetricCard label="Sentiment Score" value={`${sentimentTotal > 0 ? Math.round(positiveTotal * 100 / sentimentTotal) : 0}%`} sub={`${positiveTotal} positive · ${negativeTotal} negative`} accent="#16a34a" onClick={() => setView("sentiment")} />
        <MetricCard label="Churn Risk" value={data.churnRisk.length.toString()} sub={`${negativeTotal} negative calls total`} accent="#dc2626" onClick={() => setView("churn")} />
      </div>

      {/* Drill-down Navigation */}
      <DrillNav view={view} setView={setView} />

      {/* OVERVIEW VIEW */}
      {view === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Calls per Agent <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>(click to drill)</span></h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={agentData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} />
                  <YAxis fontSize={10} tick={{ fill: "#64748b" }} />
                  <Tooltip content={({ payload }) => { if (!payload?.length) return null; const d = payload[0].payload; return (<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, fontSize: 12 }}><div style={{ fontWeight: 700 }}>{d.fullName}</div><div>{d.total} calls · avg {Math.floor(d.avgDuration / 60)}m</div></div>) }} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} onClick={(entry) => { setSelectedAgent(entry.fullName); setView("agent") }} style={{ cursor: "pointer" }}>
                    {agentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Sentiment Distribution <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>(click to drill)</span></h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={sentimentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true} fontSize={11} onClick={(entry) => { setSelectedSentiment(entry.name); setView("sentiment") }} style={{ cursor: "pointer" }}>
                    {sentimentPieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} calls`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Call Volume & Negative Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.byMonth} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="MONTH" fontSize={10} tick={{ fill: "#64748b" }} />
                <YAxis fontSize={10} tick={{ fill: "#64748b" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="CALL_COUNT" name="Total Calls" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="NEGATIVE_COUNT" name="Negative" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* SENTIMENT DRILL-DOWN */}
      {view === "sentiment" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            {sentimentPieData.map(s => (
              <div key={s.name} onClick={() => setSelectedSentiment(selectedSentiment === s.name ? null : s.name)} style={{ background: selectedSentiment === s.name ? "#f0f9ff" : "#fff", border: `2px solid ${selectedSentiment === s.name ? s.color : "#e2e8f0"}`, borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer", transition: "all .15s" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 4 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{sentimentTotal > 0 ? Math.round(s.value * 100 / sentimentTotal) : 0}% of all calls</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Sentiment by Agent {selectedSentiment && <span style={{ color: SENTIMENT_COLORS[selectedSentiment], fontSize: 12 }}>— filtered to {selectedSentiment}</span>}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={agentData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} />
                <YAxis fontSize={10} tick={{ fill: "#64748b" }} />
                <Tooltip />
                <Legend />
                {(!selectedSentiment || selectedSentiment === "Positive") && <Bar dataKey="Positive" stackId="a" fill="#16a34a" />}
                {(!selectedSentiment || selectedSentiment === "Neutral") && <Bar dataKey="Neutral" stackId="a" fill="#94a3b8" />}
                {(!selectedSentiment || selectedSentiment === "Negative") && <Bar dataKey="Negative" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Agent Satisfaction Ranking</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...agentData].sort((a, b) => b.satisfaction - a.satisfaction).map((a, i) => (
                <div key={a.fullName} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: i % 2 === 0 ? "#f8fafc" : "#fff", borderRadius: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: a.satisfaction > 60 ? "#dcfce7" : a.satisfaction > 40 ? "#fef9c3" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: a.satisfaction > 60 ? "#166534" : a.satisfaction > 40 ? "#854d0e" : "#991b1b" }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.fullName}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{a.total} calls · avg {Math.floor(a.avgDuration / 60)}m {a.avgDuration % 60}s</div>
                  </div>
                  <div style={{ width: 120, height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${a.satisfaction}%`, height: "100%", background: a.satisfaction > 60 ? "#16a34a" : a.satisfaction > 40 ? "#f59e0b" : "#dc2626", borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, width: 40, textAlign: "right", color: a.satisfaction > 60 ? "#16a34a" : a.satisfaction > 40 ? "#f59e0b" : "#dc2626" }}>{a.satisfaction}%</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* AGENT DRILL-DOWN */}
      {view === "agent" && (
        <>
          {/* Agent selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            <button onClick={() => setSelectedAgent(null)} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, border: `2px solid ${!selectedAgent ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 8, background: !selectedAgent ? "#eff6ff" : "#fff", color: !selectedAgent ? "#1d4ed8" : "#475569", cursor: "pointer" }}>All Agents</button>
            {data.byAgent.map(a => (
              <button key={a.AGENT_NAME} onClick={() => setSelectedAgent(selectedAgent === a.AGENT_NAME ? null : a.AGENT_NAME)} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, border: `2px solid ${selectedAgent === a.AGENT_NAME ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 8, background: selectedAgent === a.AGENT_NAME ? "#eff6ff" : "#fff", color: selectedAgent === a.AGENT_NAME ? "#1d4ed8" : "#475569", cursor: "pointer" }}>{a.AGENT_NAME} ({a.CALL_COUNT})</button>
            ))}
          </div>

          {/* Agent detail cards */}
          {selectedAgent ? (() => {
            const agent = data.byAgent.find(a => a.AGENT_NAME === selectedAgent)
            if (!agent) return null
            const sat = agent.CALL_COUNT > 0 ? Math.round(agent.POSITIVE * 100 / agent.CALL_COUNT) : 0
            return (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{agent.AGENT_NAME}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                  <div style={{ background: "#fff", borderRadius: 8, padding: 16, textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800 }}>{agent.CALL_COUNT}</div><div style={{ fontSize: 10, color: "#64748b" }}>Total Calls</div></div>
                  <div style={{ background: "#fff", borderRadius: 8, padding: 16, textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800 }}>{Math.floor(agent.AVG_DURATION / 60)}m {agent.AVG_DURATION % 60}s</div><div style={{ fontSize: 10, color: "#64748b" }}>Avg Duration</div></div>
                  <div style={{ background: "#fff", borderRadius: 8, padding: 16, textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{agent.POSITIVE}</div><div style={{ fontSize: 10, color: "#64748b" }}>Positive</div></div>
                  <div style={{ background: "#fff", borderRadius: 8, padding: 16, textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#64748b" }}>{agent.NEUTRAL}</div><div style={{ fontSize: 10, color: "#64748b" }}>Neutral</div></div>
                  <div style={{ background: "#fff", borderRadius: 8, padding: 16, textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>{agent.NEGATIVE}</div><div style={{ fontSize: 10, color: "#64748b" }}>Negative</div></div>
                  <div style={{ background: "#fff", borderRadius: 8, padding: 16, textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: sat > 60 ? "#16a34a" : sat > 40 ? "#f59e0b" : "#dc2626" }}>{sat}%</div><div style={{ fontSize: 10, color: "#64748b" }}>Satisfaction</div></div>
                </div>
              </div>
            )
          })() : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Calls per Agent</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={agentData} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} />
                    <YAxis fontSize={10} tick={{ fill: "#64748b" }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} onClick={(entry) => setSelectedAgent(entry.fullName)} style={{ cursor: "pointer" }}>
                      {agentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Sentiment per Agent</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={agentData} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} />
                    <YAxis fontSize={10} tick={{ fill: "#64748b" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Positive" stackId="a" fill="#16a34a" />
                    <Bar dataKey="Neutral" stackId="a" fill="#94a3b8" />
                    <Bar dataKey="Negative" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Agent comparison table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>Agent</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>Calls</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>Avg Duration</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>Positive</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>Neutral</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>Negative</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {data.byAgent.map((a, i) => { const sat = a.CALL_COUNT > 0 ? Math.round(a.POSITIVE * 100 / a.CALL_COUNT) : 0; return (
                  <tr key={a.AGENT_NAME} style={{ background: selectedAgent === a.AGENT_NAME ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#fafbfc", cursor: "pointer" }} onClick={() => setSelectedAgent(a.AGENT_NAME)}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>{a.AGENT_NAME}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", borderBottom: "1px solid #f1f5f9", fontWeight: 700 }}>{a.CALL_COUNT}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>{Math.floor(a.AVG_DURATION / 60)}m {a.AVG_DURATION % 60}s</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", borderBottom: "1px solid #f1f5f9", color: "#16a34a", fontWeight: 600 }}>{a.POSITIVE}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>{a.NEUTRAL}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "center", borderBottom: "1px solid #f1f5f9", color: "#dc2626", fontWeight: 600 }}>{a.NEGATIVE}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}><span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: sat > 60 ? "#dcfce7" : sat > 40 ? "#fef9c3" : "#fef2f2", color: sat > 60 ? "#166534" : sat > 40 ? "#854d0e" : "#991b1b" }}>{sat}%</span></td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* CHURN DRILL-DOWN */}
      {view === "churn" && (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#dc2626" }}>{data.churnRisk.filter(c => c.NEGATIVE_PCT > 50).length}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>HIGH Risk</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>&gt;50% negative calls</div>
            </div>
            <div style={{ flex: 1, background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 12, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#d97706" }}>{data.churnRisk.filter(c => c.NEGATIVE_PCT > 25 && c.NEGATIVE_PCT <= 50).length}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#854d0e" }}>MEDIUM Risk</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>25-50% negative calls</div>
            </div>
            <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#16a34a" }}>{data.churnRisk.filter(c => c.NEGATIVE_PCT <= 25).length}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>LOW Risk</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>&lt;25% negative calls</div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Churn Risk Customers — Sorted by Risk</h3>
            </div>
            <div style={{ maxHeight: 450, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Customer</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Total Calls</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Negative</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Risk %</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Last Call</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {data.churnRisk.map((c, i) => (
                    <tr key={c.MASTER_CUSTOMER_ID} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                      <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>{c.FULL_NAME}</td>
                      <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>{c.TOTAL_CALLS}</td>
                      <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #f1f5f9", color: "#dc2626", fontWeight: 700 }}>{c.NEGATIVE_CALLS}</td>
                      <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 50, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${c.NEGATIVE_PCT}%`, height: "100%", background: c.NEGATIVE_PCT > 50 ? "#dc2626" : c.NEGATIVE_PCT > 25 ? "#f59e0b" : "#94a3b8", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontWeight: 600 }}>{c.NEGATIVE_PCT}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>{c.LAST_CALL}</td>
                      <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                        <span style={{ padding: "3px 12px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: c.NEGATIVE_PCT > 50 ? "#fef2f2" : c.NEGATIVE_PCT > 25 ? "#fef9c3" : "#f1f5f9", color: c.NEGATIVE_PCT > 50 ? "#991b1b" : c.NEGATIVE_PCT > 25 ? "#854d0e" : "#475569" }}>
                          {c.NEGATIVE_PCT > 50 ? "HIGH" : c.NEGATIVE_PCT > 25 ? "MEDIUM" : "LOW"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
