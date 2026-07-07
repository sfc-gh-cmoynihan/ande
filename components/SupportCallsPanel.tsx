"use client"
import { useState, useEffect } from "react"
import { Phone, Clock, User, ExternalLink, Search, Filter } from "lucide-react"
import { CallDetailPanel } from "@/components/CallDetailPanel"

interface CallRecord {
  CALL_ID: string
  CALL_DATE: string
  DURATION_SECONDS: number
  AGENT_NAME: string
  CALL_TYPE: string
  SENTIMENT: string
  MP4_FILE_PATH: string
  TRANSCRIPTION: string
  FULL_NAME: string
  MASTER_CUSTOMER_ID: string
}

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "#16a34a",
  Neutral: "#64748b",
  Negative: "#dc2626",
}

export function SupportCallsPanel({ customerId }: { customerId?: string }) {
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [allCalls, setAllCalls] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState("")
  const [agentFilter, setAgentFilter] = useState("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [customerFilter, setCustomerFilter] = useState(customerId || "")
  const [sentimentFilter, setSentimentFilter] = useState("All")

  useEffect(() => {
    fetch("/api/calls/all")
      .then(r => r.json())
      .then(d => { setAllCalls(d); setCalls(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    let filtered = [...allCalls]
    if (searchText) {
      const q = searchText.toLowerCase()
      filtered = filtered.filter(c =>
        c.FULL_NAME?.toLowerCase().includes(q) ||
        c.AGENT_NAME?.toLowerCase().includes(q) ||
        c.CALL_ID?.toLowerCase().includes(q) ||
        c.CALL_TYPE?.toLowerCase().includes(q)
      )
    }
    if (agentFilter !== "All") {
      filtered = filtered.filter(c => c.AGENT_NAME === agentFilter)
    }
    if (sentimentFilter !== "All") {
      filtered = filtered.filter(c => c.SENTIMENT === sentimentFilter)
    }
    if (customerFilter) {
      const q = customerFilter.toLowerCase()
      filtered = filtered.filter(c => c.FULL_NAME?.toLowerCase().includes(q) || c.MASTER_CUSTOMER_ID?.toLowerCase().includes(q))
    }
    if (dateFrom) {
      filtered = filtered.filter(c => c.CALL_DATE >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter(c => c.CALL_DATE <= dateTo + "T23:59:59")
    }
    setCalls(filtered)
  }, [searchText, agentFilter, sentimentFilter, customerFilter, dateFrom, dateTo, allCalls])

  if (selectedCallId) {
    return <CallDetailPanel callId={selectedCallId} onBack={() => setSelectedCallId(null)} />
  }

  const agents = ["All", ...Array.from(new Set(allCalls.map(c => c.AGENT_NAME))).sort()]
  const sentiments = ["All", "Positive", "Neutral", "Negative"]
  const totalDuration = calls.reduce((s, c) => s + c.DURATION_SECONDS, 0)

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading support calls...</div>

  return (
    <div style={{ padding: "24px 32px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>Support Calls</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Browse and filter all customer support calls</p>
      </div>

      {/* Search & Filters */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Search</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search by customer, agent, call ID..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none" }}
              />
            </div>
          </div>
          <div style={{ minWidth: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Agent</label>
            <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer" }}>
              {agents.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Sentiment</label>
            <select value={sentimentFilter} onChange={e => setSentimentFilter(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer" }}>
              {sentiments.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Customer</label>
            <input
              type="text"
              placeholder="Name or ID..."
              value={customerFilter}
              onChange={e => setCustomerFilter(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none" }}
            />
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none" }}
            />
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none" }}
            />
          </div>
          <button
            onClick={() => { setSearchText(""); setAgentFilter("All"); setSentimentFilter("All"); setCustomerFilter(""); setDateFrom(""); setDateTo("") }}
            style={{ padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#f8fafc", cursor: "pointer", color: "#475569", whiteSpace: "nowrap" }}
          >
            <Filter size={12} /> Clear All
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{calls.length}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Calls Found</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{Math.round(totalDuration / 60)}m</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Total Duration</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{calls.filter(c => c.SENTIMENT === "Positive").length}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Positive</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#64748b" }}>{calls.filter(c => c.SENTIMENT === "Neutral").length}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Neutral</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>{calls.filter(c => c.SENTIMENT === "Negative").length}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Negative</div>
        </div>
      </div>

      {/* Calls Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ maxHeight: 500, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Call ID</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Date</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Customer</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Agent</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Type</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Duration</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Sentiment</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c, i) => (
                <tr key={c.CALL_ID} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc", cursor: "pointer" }} onClick={() => setSelectedCallId(c.CALL_ID)}>
                  <td style={{ padding: "10px 12px", fontSize: 11, borderBottom: "1px solid #f1f5f9", fontFamily: "monospace", color: "#64748b" }}>{c.CALL_ID}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, borderBottom: "1px solid #f1f5f9", color: "#1e293b" }}>{new Date(c.CALL_DATE).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: "#1e293b" }}>{c.FULL_NAME}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, borderBottom: "1px solid #f1f5f9", color: "#475569" }}>{c.AGENT_NAME}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: c.CALL_TYPE === "Inbound" ? "#eff6ff" : "#f0fdf4", color: c.CALL_TYPE === "Inbound" ? "#1d4ed8" : "#166534" }}>{c.CALL_TYPE}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, borderBottom: "1px solid #f1f5f9", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#475569" }}>{Math.floor(c.DURATION_SECONDS / 60)}m {c.DURATION_SECONDS % 60}s</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: c.SENTIMENT === "Positive" ? "#dcfce7" : c.SENTIMENT === "Negative" ? "#fef2f2" : "#f1f5f9", color: SENTIMENT_COLORS[c.SENTIMENT] }}>{c.SENTIMENT}</span>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCallId(c.CALL_ID) }} style={{ padding: "4px 10px", fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#3b82f6", fontWeight: 600 }}>
                      <ExternalLink size={10} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {calls.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No calls match your filters</div>
          )}
        </div>
      </div>
    </div>
  )
}
