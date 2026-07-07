"use client"
import { useState, useEffect } from "react"
import { Phone, Clock, User, Search, FileAudio, ArrowLeft, Download, Play } from "lucide-react"

interface CallRecord {
  CALL_ID: string
  CALL_DATE: string
  DURATION_SECONDS: number
  AGENT_NAME: string
  CALL_TYPE: string
  SENTIMENT: string
  SUMMARY: string
  TRANSCRIPTION: string
  MP4_FILE_PATH: string
  MASTER_CUSTOMER_ID: string
  PRESIGNED_URL?: string
}

const SENTIMENT_COLORS: Record<string, { bg: string; text: string }> = {
  Positive: { bg: "#dcfce7", text: "#166534" },
  Neutral: { bg: "#f1f5f9", text: "#475569" },
  Negative: { bg: "#fef2f2", text: "#991b1b" },
}

interface CallsPanelProps {
  customerId?: string
}

export function CallsPanel({ customerId }: CallsPanelProps) {
  const [agentInput, setAgentInput] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState<string[]>([])

  const doSearch = async (agentOverride?: string) => {
    setLoading(true)
    setSelectedCall(null)
    const params = new URLSearchParams()
    const agent = agentOverride !== undefined ? agentOverride : agentInput
    if (agent) params.set("agent", agent)
    if (nameInput) params.set("name", nameInput)
    const res = await fetch(`/api/calls?${params.toString()}`)
    const data = await res.json()
    const rows = Array.isArray(data) ? data : []
    setCalls(rows)
    // Extract unique agent names for dropdown
    if (!agents.length && rows.length > 0) {
      const unique = [...new Set(rows.map((c: CallRecord) => c.AGENT_NAME).filter(Boolean))].sort()
      setAgents(unique)
    }
    setLoading(false)
  }

  useEffect(() => {
    doSearch("")
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch()
  }

  if (selectedCall) {
    const s = SENTIMENT_COLORS[selectedCall.SENTIMENT] || SENTIMENT_COLORS.Neutral
    return (
      <div>
        <button
          onClick={() => setSelectedCall(null)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: "#475569", marginBottom: 20 }}
        >
          <ArrowLeft size={14} /> Back to Calls
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedCall.CALL_ID}</h2>
          <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: s.bg, color: s.text }}>{selectedCall.SENTIMENT}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Agent</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{selectedCall.AGENT_NAME}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Date</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{selectedCall.CALL_DATE}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Duration</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{Math.round(selectedCall.DURATION_SECONDS / 60)}m {selectedCall.DURATION_SECONDS % 60}s</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Type</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{selectedCall.CALL_TYPE}</div>
          </div>
        </div>

        {selectedCall.MP4_FILE_PATH && (() => {
          const fileName = selectedCall.MP4_FILE_PATH.replace("@ANDE_DB.PUBLIC.CALL_RECORDINGS_STAGE/", "")
          const audioUrl = `/api/play-recording?file=${encodeURIComponent(fileName)}`
          return (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontWeight: 600, fontSize: 13 }}>
                <FileAudio size={15} /> Recording
              </div>
              <audio controls preload="none" style={{ width: "100%", height: 40, marginBottom: 10 }}>
                <source src={audioUrl} type="audio/mp4" />
              </audio>
              <a href={audioUrl} download={fileName} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "var(--accent)", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                <Download size={13} /> Download Recording
              </a>
            </div>
          )
        })()}

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 16, borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Summary</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: "#1e293b" }}>{selectedCall.SUMMARY}</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 16, borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Sentiment Analysis</div>
          <div style={{ display: "flex", gap: 12 }}>
            {(["Positive", "Neutral", "Negative"] as const).map((sent) => {
              const sc = SENTIMENT_COLORS[sent]
              const isActive = selectedCall.SENTIMENT === sent
              return (
                <div key={sent} style={{ flex: 1, padding: 12, borderRadius: 8, background: isActive ? sc.bg : "#f8fafc", border: isActive ? `2px solid ${sc.text}` : "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? sc.text : "#94a3b8" }}>{sent}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Transcript</div>
          <div style={{ fontSize: 12, lineHeight: 1.8, color: "#334155", whiteSpace: "pre-wrap", background: "#f8fafc", padding: 14, borderRadius: 8, maxHeight: 400, overflowY: "auto" }}>
            {selectedCall.TRANSCRIPTION}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Calls by Agent</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Search calls by agent or customer name. Select a call to view transcript, summary, and sentiment.</p>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Agent</label>
            <select value={agentInput} onChange={(e) => { setAgentInput(e.target.value); doSearch(e.target.value) }}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, background: "#fff" }}>
              <option value="">&lt;All&gt;</option>
              {agents.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Customer Name</label>
            <input type="text" placeholder="e.g. Colm Moynihan" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={handleKeyDown}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13 }} />
          </div>
          <button onClick={doSearch} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            <Search size={14} /> Search
          </button>
        </div>
      </div>

      {loading && <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading calls...</div>}

      {!loading && calls.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 12, color: "#64748b" }}>
            {calls.length} call{calls.length !== 1 ? "s" : ""} found
          </div>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {calls.map((c) => {
              const s = SENTIMENT_COLORS[c.SENTIMENT] || SENTIMENT_COLORS.Neutral
              return (
                <div
                  key={c.CALL_ID}
                  onClick={() => setSelectedCall(c)}
                  style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background .1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <div style={{ width: 80, fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>{c.CALL_ID}</div>
                  <div style={{ width: 120, fontSize: 12 }}><User size={12} /> {c.AGENT_NAME}</div>
                  <div style={{ width: 100, fontSize: 12, color: "#64748b" }}>{c.CALL_DATE?.slice(0, 10)}</div>
                  <div style={{ width: 60, fontSize: 12, color: "#64748b" }}><Clock size={11} /> {Math.round(c.DURATION_SECONDS / 60)}m</div>
                  <div style={{ width: 70 }}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: s.bg, color: s.text }}>{c.SENTIMENT}</span></div>
                  <div style={{ flex: 1, fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.SUMMARY?.slice(0, 60)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && calls.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10 }}>
          No calls found. Try a different search.
        </div>
      )}
    </div>
  )
}
