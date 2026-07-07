"use client"
import { useState, useEffect } from "react"
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, Eye, XCircle, ChevronUp, Filter, Search } from "lucide-react"

interface FlagRecord {
  FLAG_ID: number
  CALL_ID: string
  WORD_MATCHED: string
  CATEGORY: string
  CONTEXT: string
  STATUS: string
  REVIEWED_BY: string | null
  REVIEWED_AT: string | null
  REVIEW_NOTES: string | null
  FLAGGED_AT: string
  CALL_DATE: string
  AGENT_NAME: string
  DURATION_SECONDS: number
  SENTIMENT: string
  FULL_NAME: string
  MASTER_CUSTOMER_ID: string
  TRANSCRIPTION: string
}

interface WordStat {
  CATEGORY: string
  WORD_COUNT: number
}

interface Summary {
  TOTAL_FLAGGED_CALLS: number
  TOTAL_FLAGS: number
  PENDING_COUNT: number
  REVIEWED_COUNT: number
  ESCALATED_COUNT: number
  PENDING_CALLS: number
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  PENDING: { color: "#d97706", bg: "#fffbeb", icon: Clock },
  REVIEWED: { color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
  ESCALATED: { color: "#dc2626", bg: "#fef2f2", icon: AlertTriangle },
}

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  Profanity: { color: "#9333ea", bg: "#faf5ff" },
  Legal: { color: "#0369a1", bg: "#f0f9ff" },
  Financial: { color: "#b45309", bg: "#fffbeb" },
  GDPR: { color: "#0f766e", bg: "#f0fdfa" },
}

export function CallGovernancePanel() {
  const [data, setData] = useState<{ flaggedCalls: FlagRecord[]; wordStats: WordStat[]; summary: Summary } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState<string | null>(null)
  const [reviewingFlag, setReviewingFlag] = useState<number | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [searchText, setSearchText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchData = () => {
    fetch("/api/calls/governance")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleReview = async (flagId: number, action: "approve" | "escalate") => {
    setSubmitting(true)
    await fetch("/api/calls/governance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagId, action, reviewNotes, reviewedBy: "Colm Moynihan" })
    })
    setReviewingFlag(null)
    setReviewNotes("")
    setSubmitting(false)
    fetchData()
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading governance data...</div>
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>Failed to load governance data</div>

  const { flaggedCalls, wordStats, summary } = data

  // Group flags by call
  const callGroups = flaggedCalls.reduce((acc, flag) => {
    if (!acc[flag.CALL_ID]) acc[flag.CALL_ID] = []
    acc[flag.CALL_ID].push(flag)
    return acc
  }, {} as Record<string, FlagRecord[]>)

  // Filter
  let filteredFlags = [...flaggedCalls]
  if (statusFilter !== "ALL") filteredFlags = filteredFlags.filter(f => f.STATUS === statusFilter)
  if (categoryFilter !== "ALL") filteredFlags = filteredFlags.filter(f => f.CATEGORY === categoryFilter)
  if (searchText) {
    const q = searchText.toLowerCase()
    filteredFlags = filteredFlags.filter(f =>
      f.FULL_NAME?.toLowerCase().includes(q) ||
      f.AGENT_NAME?.toLowerCase().includes(q) ||
      f.WORD_MATCHED?.toLowerCase().includes(q) ||
      f.CALL_ID?.toLowerCase().includes(q)
    )
  }

  // Unique calls from filtered flags
  const filteredCallIds = [...new Set(filteredFlags.map(f => f.CALL_ID))]

  // Detail view for a single call
  if (selectedCall) {
    const callFlags = callGroups[selectedCall] || []
    const call = callFlags[0]
    if (!call) { setSelectedCall(null); return null }

    const pendingFlags = callFlags.filter(f => f.STATUS === "PENDING")
    const reviewedFlags = callFlags.filter(f => f.STATUS === "REVIEWED")
    const escalatedFlags = callFlags.filter(f => f.STATUS === "ESCALATED")

    return (
      <div style={{ padding: "24px 32px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
        <button
          onClick={() => setSelectedCall(null)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#475569", background: "#fff", cursor: "pointer", marginBottom: 20 }}
        >
          <ChevronUp size={14} style={{ transform: "rotate(-90deg)" }} /> Back to All Flagged Calls
        </button>

        {/* Call header */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>Call Review: {call.CALL_ID}</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                {call.FULL_NAME} &bull; Agent: {call.AGENT_NAME} &bull; {new Date(call.CALL_DATE).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#fef2f2", color: "#dc2626" }}>
                {callFlags.length} Flags
              </span>
              <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#fffbeb", color: "#d97706" }}>
                {pendingFlags.length} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Transcription with highlighted words */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>Call Transcription</h3>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: "#374151", whiteSpace: "pre-wrap" }}>
            {highlightWords(call.TRANSCRIPTION, callFlags.map(f => f.WORD_MATCHED))}
          </div>
        </div>

        {/* Flags list with review actions */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>
            Flagged Words ({callFlags.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {callFlags.map(flag => {
              const cfg = STATUS_CONFIG[flag.STATUS] || STATUS_CONFIG.PENDING
              const catCfg = CATEGORY_COLORS[flag.CATEGORY] || { color: "#64748b", bg: "#f8fafc" }
              const StatusIcon = cfg.icon
              const isReviewing = reviewingFlag === flag.FLAG_ID

              return (
                <div key={flag.FLAG_ID} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, background: flag.STATUS === "PENDING" ? "#fffbeb" : "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: catCfg.bg, color: catCfg.color }}>
                        {flag.CATEGORY}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>&ldquo;{flag.WORD_MATCHED}&rdquo;</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: cfg.color }}>
                        <StatusIcon size={12} /> {flag.STATUS}
                      </span>
                    </div>
                    {flag.STATUS === "PENDING" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {!isReviewing ? (
                          <button
                            onClick={() => setReviewingFlag(flag.FLAG_ID)}
                            style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#3b82f6" }}
                          >
                            <Eye size={11} /> Review
                          </button>
                        ) : (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input
                              type="text"
                              placeholder="Add notes..."
                              value={reviewNotes}
                              onChange={e => setReviewNotes(e.target.value)}
                              style={{ padding: "5px 10px", fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 6, width: 200 }}
                            />
                            <button
                              onClick={() => handleReview(flag.FLAG_ID, "approve")}
                              disabled={submitting}
                              style={{ padding: "5px 10px", fontSize: 11, fontWeight: 600, border: "none", borderRadius: 6, background: "#16a34a", color: "#fff", cursor: "pointer" }}
                            >
                              <CheckCircle size={11} /> Approve
                            </button>
                            <button
                              onClick={() => handleReview(flag.FLAG_ID, "escalate")}
                              disabled={submitting}
                              style={{ padding: "5px 10px", fontSize: 11, fontWeight: 600, border: "none", borderRadius: 6, background: "#dc2626", color: "#fff", cursor: "pointer" }}
                            >
                              <AlertTriangle size={11} /> Escalate
                            </button>
                            <button
                              onClick={() => { setReviewingFlag(null); setReviewNotes("") }}
                              style={{ padding: "5px 10px", fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#64748b" }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {flag.CONTEXT && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                      &ldquo;...{flag.CONTEXT}...&rdquo;
                    </div>
                  )}
                  {flag.STATUS === "REVIEWED" && flag.REVIEWED_BY && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#16a34a" }}>
                      Reviewed by {flag.REVIEWED_BY} on {new Date(flag.REVIEWED_AT!).toLocaleDateString("en-GB")} {flag.REVIEW_NOTES && `— ${flag.REVIEW_NOTES}`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Main list view
  return (
    <div style={{ padding: "24px 32px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>Call Governance</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Monitor and review calls flagged for prohibited language, legal threats, or financial data exposure</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>{summary.TOTAL_FLAGGED_CALLS}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Flagged Calls</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>{summary.TOTAL_FLAGS}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Total Flags</div>
        </div>
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#d97706" }}>{summary.PENDING_COUNT}</div>
          <div style={{ fontSize: 11, color: "#92400e", marginTop: 2 }}>Pending Review</div>
        </div>
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{summary.REVIEWED_COUNT}</div>
          <div style={{ fontSize: 11, color: "#166534", marginTop: 2 }}>Reviewed</div>
        </div>
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>{summary.ESCALATED_COUNT}</div>
          <div style={{ fontSize: 11, color: "#991b1b", marginTop: 2 }}>Escalated</div>
        </div>
      </div>

      {/* Word List Stats */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <ShieldAlert size={16} color="#dc2626" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Red Flag Word List</span>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {wordStats.map(ws => (
            <div key={ws.CATEGORY} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: CATEGORY_COLORS[ws.CATEGORY]?.bg || "#f8fafc", color: CATEGORY_COLORS[ws.CATEGORY]?.color || "#64748b" }}>
                {ws.CATEGORY}
              </span>
              <span style={{ fontSize: 12, color: "#64748b" }}>{ws.WORD_COUNT} words</span>
            </div>
          ))}
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", marginLeft: "auto" }}>
            Total: {wordStats.reduce((s, w) => s + w.WORD_COUNT, 0)} monitored terms
          </span>
          <a
            href="/api/calls/governance/words?format=pdf"
            download="Red_Flag_Word_List.pdf"
            style={{ marginLeft: 12, padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#dc2626", color: "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <ShieldAlert size={12} /> Download PDF
          </a>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Search</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search by customer, agent, word..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none" }}
              />
            </div>
          </div>
          <div style={{ minWidth: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer" }}>
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>
          <div style={{ minWidth: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Category</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer" }}>
              <option value="ALL">All Categories</option>
              <option value="Profanity">Profanity</option>
              <option value="Legal">Legal</option>
              <option value="Financial">Financial</option>
              <option value="GDPR">GDPR</option>
            </select>
          </div>
          <button
            onClick={() => { setSearchText(""); setStatusFilter("ALL"); setCategoryFilter("ALL") }}
            style={{ padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#f8fafc", cursor: "pointer", color: "#475569", whiteSpace: "nowrap" }}
          >
            <Filter size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Flagged Calls Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Flagged Calls ({filteredCallIds.length})</span>
          <span style={{ fontSize: 11, color: "#64748b" }}>Click a call to review flags</span>
        </div>
        <div style={{ maxHeight: 450, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Call ID</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Agent</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Flags</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Categories</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCallIds.map((callId, i) => {
                const flags = callGroups[callId] || []
                const firstFlag = flags[0]
                const pendingCount = flags.filter(f => f.STATUS === "PENDING").length
                const categories = [...new Set(flags.map(f => f.CATEGORY))]
                const worstStatus = flags.some(f => f.STATUS === "ESCALATED") ? "ESCALATED" : flags.some(f => f.STATUS === "PENDING") ? "PENDING" : "REVIEWED"
                const cfg = STATUS_CONFIG[worstStatus]

                return (
                  <tr key={callId} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc", cursor: "pointer" }} onClick={() => setSelectedCall(callId)}>
                    <td style={tdStyle}><span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{callId}</span></td>
                    <td style={tdStyle}>{new Date(firstFlag.CALL_DATE).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{firstFlag.FULL_NAME}</td>
                    <td style={tdStyle}>{firstFlag.AGENT_NAME}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#fef2f2", color: "#dc2626" }}>{flags.length}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                        {categories.map(cat => (
                          <span key={cat} style={{ padding: "2px 6px", borderRadius: 10, fontSize: 9, fontWeight: 700, background: CATEGORY_COLORS[cat]?.bg, color: CATEGORY_COLORS[cat]?.color }}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
                        {worstStatus === "PENDING" && `${pendingCount} pending`}
                        {worstStatus === "REVIEWED" && "Reviewed"}
                        {worstStatus === "ESCALATED" && "Escalated"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedCall(callId) }}
                        style={{ padding: "4px 10px", fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#3b82f6", fontWeight: 600 }}
                      >
                        <Eye size={10} /> Review
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredCallIds.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No flagged calls match your filters</div>
          )}
        </div>
      </div>
    </div>
  )
}

function highlightWords(text: string, words: string[]) {
  if (!text || !words.length) return text
  const sortedWords = [...words].sort((a, b) => b.length - a.length)
  const escaped = sortedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const regex = new RegExp(`(${escaped.join("|")})`, "gi")
  const parts = text.split(regex)

  return parts.map((part, i) => {
    const isMatch = words.some(w => w.toLowerCase() === part.toLowerCase())
    if (isMatch) {
      return <mark key={i} style={{ background: "#fecaca", color: "#991b1b", padding: "1px 3px", borderRadius: 3, fontWeight: 700 }}>{part}</mark>
    }
    return part
  })
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569",
  textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", position: "sticky", top: 0
}

const tdStyle: React.CSSProperties = {
  padding: "10px 12px", fontSize: 12, borderBottom: "1px solid #f1f5f9", color: "#1e293b"
}
