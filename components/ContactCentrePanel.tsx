"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface KPIData {
  summary: { TOTAL_CALLS: number; AHT: number; AVG_WAIT: number; AVG_TALK: number; AVG_WRAP: number; FCR_RATE: number; AVG_CSAT: number; AVG_NPS: number; ABANDON_RATE: number; SERVICE_LEVEL: number; PROMOTERS: number; PASSIVES: number; DETRACTORS: number }
  byChannel: { CHANNEL: string; CNT: number; AVG_CSAT: number; AHT: number }[]
  hourly: { HOUR_OF_DAY: number; CALL_COUNT: number; AVG_WAIT: number }[]
  daily: { DAY_NAME: string; DAY_NUM: number; CALL_COUNT: number; AVG_WAIT: number }[]
  agentLeaderboard: { AGENT_NAME: string; TOTAL_CALLS: number; AHT: number; FCR_RATE: number; AVG_CSAT: number; AVG_NPS: number; AVG_WAIT: number; POSITIVE: number; NEUTRAL: number; NEGATIVE: number }[]
  keywords: { KEYWORD: string; CNT: number }[]
  monthlyTrends: { MONTH: string; CALL_COUNT: number; AHT: number; FCR_RATE: number; AVG_CSAT: number; ABANDON_RATE: number }[]
  sentimentTrend: { MONTH: string; SENTIMENT: string; CNT: number }[]
}

type Tab = "operational" | "speech" | "predictive" | "kpis"

const COLORS = ["#3b82f6", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"]
const SENTIMENT_COLORS: Record<string, string> = { Positive: "#16a34a", Neutral: "#94a3b8", Negative: "#dc2626" }

function KPICard({ label, value, sub, accent, large }: { label: string; value: string; sub?: string; accent?: string; large?: boolean }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: large ? "24px 28px" : "16px 20px", flex: 1, borderTop: `3px solid ${accent || "#3b82f6"}` }}>
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: large ? 32 : 24, fontWeight: 800, color: "#1e293b" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export function ContactCentrePanel() {
  const [data, setData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("operational")

  useEffect(() => {
    fetch("/api/calls/kpis")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading contact centre analytics...</div>
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>Failed to load data</div>

  const { summary } = data
  const tabs: { id: Tab; label: string }[] = [
    { id: "operational", label: "Operational" },
    { id: "speech", label: "Speech & Text" },
    { id: "predictive", label: "Predictive" },
    { id: "kpis", label: "Core KPIs" },
  ]

  return (
    <div style={{ padding: "24px 32px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>Contact Centre Analytics</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Operational performance, speech analytics, predictive insights & core KPIs</p>
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 8, padding: 3, marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 18px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? "#1e293b" : "#64748b", boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,.1)" : "none", transition: "all .15s" }}>{t.label}</button>
        ))}
      </div>

      {/* OPERATIONAL TAB */}
      {tab === "operational" && (
        <>
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            <KPICard label="Avg Wait Time" value={`${summary.AVG_WAIT}s`} sub="Time in queue" accent="#f59e0b" />
            <KPICard label="Abandon Rate" value={`${summary.ABANDON_RATE}%`} sub="Hung up before answer" accent="#dc2626" />
            <KPICard label="Service Level" value={`${summary.SERVICE_LEVEL}%`} sub="Answered within 20s" accent="#16a34a" />
            <KPICard label="Total Calls" value={summary.TOTAL_CALLS.toString()} sub="All channels combined" accent="#3b82f6" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Hourly Call Volume & Wait Times</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.hourly} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="HOUR_OF_DAY" fontSize={10} tick={{ fill: "#64748b" }} tickFormatter={v => `${v}:00`} />
                  <YAxis fontSize={10} tick={{ fill: "#64748b" }} />
                  <Tooltip labelFormatter={v => `${v}:00 - ${v}:59`} />
                  <Legend />
                  <Bar dataKey="CALL_COUNT" name="Calls" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="AVG_WAIT" name="Avg Wait (s)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Channel Breakdown</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={data.byChannel} dataKey="CNT" nameKey="CHANNEL" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={({ CHANNEL, percent }) => `${CHANNEL} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {data.byChannel.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {data.byChannel.map((ch, i) => (
                    <div key={ch.CHANNEL} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i] }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{ch.CHANNEL}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{ch.CNT} calls · CSAT {ch.AVG_CSAT}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Abandon Rate & Service Level Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.monthlyTrends} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="MONTH" fontSize={10} tick={{ fill: "#64748b" }} />
                <YAxis fontSize={10} tick={{ fill: "#64748b" }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="ABANDON_RATE" name="Abandon %" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="FCR_RATE" name="FCR %" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* SPEECH & TEXT TAB */}
      {tab === "speech" && (
        <>
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            {[
              { name: "Positive", count: data.agentLeaderboard.reduce((s, a) => s + a.POSITIVE, 0), color: "#16a34a" },
              { name: "Neutral", count: data.agentLeaderboard.reduce((s, a) => s + a.NEUTRAL, 0), color: "#64748b" },
              { name: "Negative", count: data.agentLeaderboard.reduce((s, a) => s + a.NEGATIVE, 0), color: "#dc2626" },
            ].map(s => (
              <div key={s.name} style={{ flex: 1, background: "#fff", border: `2px solid ${s.color}20`, borderRadius: 12, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{summary.TOTAL_CALLS > 0 ? Math.round(s.count * 100 / summary.TOTAL_CALLS) : 0}% of calls</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Top Keywords Detected (AI)</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.keywords.slice(0, 12).map((kw, i) => {
                  const maxCnt = data.keywords[0]?.CNT || 1
                  return (
                    <div key={kw.KEYWORD} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 80, fontSize: 11, fontWeight: 600, color: "#475569", textAlign: "right" }}>{kw.KEYWORD}</div>
                      <div style={{ flex: 1, height: 16, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${(kw.CNT / maxCnt) * 100}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 4 }} />
                      </div>
                      <div style={{ width: 30, fontSize: 11, fontWeight: 700, color: "#1e293b" }}>{kw.CNT}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Sentiment by Agent (Emotion Detection)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.agentLeaderboard.map(a => ({ name: a.AGENT_NAME.split(" ")[0], Positive: a.POSITIVE, Neutral: a.NEUTRAL, Negative: a.NEGATIVE }))} margin={{ left: 10, right: 10 }}>
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

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Sentiment Trend Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={(() => {
                const months = [...new Set(data.sentimentTrend.map(s => s.MONTH))].sort()
                return months.map(m => ({
                  MONTH: m,
                  Positive: data.sentimentTrend.find(s => s.MONTH === m && s.SENTIMENT === "Positive")?.CNT || 0,
                  Neutral: data.sentimentTrend.find(s => s.MONTH === m && s.SENTIMENT === "Neutral")?.CNT || 0,
                  Negative: data.sentimentTrend.find(s => s.MONTH === m && s.SENTIMENT === "Negative")?.CNT || 0,
                }))
              })()} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="MONTH" fontSize={10} tick={{ fill: "#64748b" }} />
                <YAxis fontSize={10} tick={{ fill: "#64748b" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Positive" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Neutral" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Negative" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* PREDICTIVE TAB */}
      {tab === "predictive" && (
        <>
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            <KPICard label="Avg Daily Volume" value={Math.round(summary.TOTAL_CALLS / Math.max(data.monthlyTrends.length, 1) / 30).toString() || "7"} sub="Calls per day" accent="#3b82f6" />
            <KPICard label="Peak Hour" value={`${data.hourly.reduce((max, h) => h.CALL_COUNT > max.CALL_COUNT ? h : max, data.hourly[0])?.HOUR_OF_DAY || 0}:00`} sub="Highest volume" accent="#f59e0b" />
            <KPICard label="Peak Day" value={data.daily.reduce((max, d) => d.CALL_COUNT > max.CALL_COUNT ? d : max, data.daily[0])?.DAY_NAME || "Mon"} sub="Busiest weekday" accent="#8b5cf6" />
            <KPICard label="Trend" value={data.monthlyTrends.length >= 2 ? (data.monthlyTrends[data.monthlyTrends.length - 1].CALL_COUNT > data.monthlyTrends[data.monthlyTrends.length - 2].CALL_COUNT ? "Rising" : "Declining") : "Stable"} sub="Volume direction" accent="#06b6d4" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Call Volume by Day of Week</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.daily} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="DAY_NAME" fontSize={11} tick={{ fill: "#64748b" }} />
                  <YAxis fontSize={10} tick={{ fill: "#64748b" }} />
                  <Tooltip />
                  <Bar dataKey="CALL_COUNT" name="Calls" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {data.daily.map((d, i) => <Cell key={i} fill={d.CALL_COUNT === Math.max(...data.daily.map(x => x.CALL_COUNT)) ? "#dc2626" : "#8b5cf6"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Monthly Volume Trend (Forecast)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.monthlyTrends} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="MONTH" fontSize={10} tick={{ fill: "#64748b" }} />
                  <YAxis fontSize={10} tick={{ fill: "#64748b" }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="CALL_COUNT" name="Call Volume" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }} />
                  <Line type="monotone" dataKey="AHT" name="AHT (s)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Staffing Recommendation (Based on Hourly Patterns)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 6 }}>
              {data.hourly.map(h => {
                const intensity = h.CALL_COUNT / Math.max(...data.hourly.map(x => x.CALL_COUNT))
                return (
                  <div key={h.HOUR_OF_DAY} style={{ textAlign: "center", padding: 10, borderRadius: 8, background: intensity > 0.8 ? "#fef2f2" : intensity > 0.5 ? "#fef9c3" : intensity > 0.2 ? "#f0fdf4" : "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{h.HOUR_OF_DAY}:00</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: intensity > 0.8 ? "#dc2626" : intensity > 0.5 ? "#d97706" : "#16a34a" }}>{h.CALL_COUNT}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* CORE KPIs TAB */}
      {tab === "kpis" && (
        <>
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            <KPICard label="FCR Rate" value={`${summary.FCR_RATE}%`} sub="First Call Resolution" accent="#16a34a" large />
            <KPICard label="AHT" value={`${Math.floor(summary.AHT / 60)}m ${summary.AHT % 60}s`} sub={`Talk ${Math.floor(summary.AVG_TALK / 60)}m + Wrap ${Math.floor(summary.AVG_WRAP / 60)}m`} accent="#3b82f6" large />
            <KPICard label="CSAT" value={`${summary.AVG_CSAT}/5.0`} sub="Customer Satisfaction" accent="#f59e0b" large />
            <KPICard label="NPS" value={summary.AVG_NPS.toString()} sub={`${summary.PROMOTERS}P / ${summary.PASSIVES}N / ${summary.DETRACTORS}D`} accent="#8b5cf6" large />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>FCR & CSAT Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.monthlyTrends} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="MONTH" fontSize={10} tick={{ fill: "#64748b" }} />
                  <YAxis yAxisId="left" fontSize={10} tick={{ fill: "#64748b" }} tickFormatter={v => `${v}%`} />
                  <YAxis yAxisId="right" orientation="right" fontSize={10} tick={{ fill: "#64748b" }} domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="FCR_RATE" name="FCR %" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="AVG_CSAT" name="CSAT" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>NPS Distribution</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={[{ name: "Promoters", value: summary.PROMOTERS }, { name: "Passives", value: summary.PASSIVES }, { name: "Detractors", value: summary.DETRACTORS }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                      <Cell fill="#16a34a" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#dc2626" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#16a34a", marginRight: 8 }} /><span style={{ fontSize: 12, fontWeight: 600 }}>Promoters: {summary.PROMOTERS}</span></div>
                  <div><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", marginRight: 8 }} /><span style={{ fontSize: 12, fontWeight: 600 }}>Passives: {summary.PASSIVES}</span></div>
                  <div><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#dc2626", marginRight: 8 }} /><span style={{ fontSize: 12, fontWeight: 600 }}>Detractors: {summary.DETRACTORS}</span></div>
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 11, color: "#64748b" }}>NPS = {summary.PROMOTERS > 0 ? Math.round(((summary.PROMOTERS - summary.DETRACTORS) / summary.TOTAL_CALLS) * 100) : 0} (Promoters% - Detractors%)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Leaderboard */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Agent Leaderboard</h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>Rank</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>Agent</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>Calls</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>FCR</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>AHT</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>CSAT</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>NPS</th>
                </tr>
              </thead>
              <tbody>
                {data.agentLeaderboard.map((a, i) => (
                  <tr key={a.AGENT_NAME} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                    <td style={{ padding: "10px 16px", fontSize: 12, borderBottom: "1px solid #f1f5f9" }}><span style={{ display: "inline-flex", width: 22, height: 22, borderRadius: "50%", background: i === 0 ? "#dcfce7" : i === 1 ? "#fef9c3" : "#f1f5f9", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: i === 0 ? "#166534" : i === 1 ? "#854d0e" : "#475569" }}>{i + 1}</span></td>
                    <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>{a.AGENT_NAME}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>{a.TOTAL_CALLS}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #f1f5f9" }}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: a.FCR_RATE > 70 ? "#dcfce7" : a.FCR_RATE > 50 ? "#fef9c3" : "#fef2f2", color: a.FCR_RATE > 70 ? "#166534" : a.FCR_RATE > 50 ? "#854d0e" : "#991b1b" }}>{a.FCR_RATE}%</span></td>
                    <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>{Math.floor(a.AHT / 60)}m {a.AHT % 60}s</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: a.AVG_CSAT >= 4 ? "#16a34a" : a.AVG_CSAT >= 3 ? "#d97706" : "#dc2626" }}>{a.AVG_CSAT}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: a.AVG_NPS >= 50 ? "#16a34a" : a.AVG_NPS >= 0 ? "#d97706" : "#dc2626" }}>{a.AVG_NPS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
