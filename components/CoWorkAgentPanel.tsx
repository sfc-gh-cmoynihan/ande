"use client"
import { useState, useRef, useEffect } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
}

const MODELS = [
  { value: "claude-opus-4-8", label: "Claude Opus 4-8 (Default)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4-6" },
  { value: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
  { value: "llama4-maverick", label: "Llama 4 Maverick" },
  { value: "llama4-scout", label: "Llama 4 Scout" },
  { value: "snowflake-llama-3.3-70b", label: "Snowflake Llama 3.3 70B" },
  { value: "openai-gpt-5.2", label: "OpenAI GPT 5.2" },
  { value: "openai-gpt-5.1", label: "OpenAI GPT 5.1" },
  { value: "deepseek-r1", label: "DeepSeek R1" },
  { value: "mistral-large2", label: "Mistral Large 2" },
  { value: "mixtral-8x7b", label: "Mixtral 8x7B" },
]

const SAMPLE_QUESTIONS = [
  "What Toyota vehicles does Colm Moynihan have insured?",
  "What is the excess on the Lexus RX policy?",
  "Show me all motor insurance policies",
  "What is Dan Jones covered for on his Lexus IS?",
  "What is the total value of all active contracts?",
  "Which contracts have the highest value?",
  "What is the sentiment breakdown across all calls?",
  "Show me top 10 customers by contract value",
  "Which customers have negative call sentiment?",
  "Does the Toyota Corolla policy include breakdown assistance?",
]

function FormattedAnswer({ content }: { content: string }) {
  if (!content.includes("|")) {
    const parts = content.split(/\*\*(.*?)\*\*/g)
    return (
      <div>
        {parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        )}
      </div>
    )
  }

  const lines = content.trim().split("\n").filter(l => l.trim())
  const metaLines: string[] = []
  let tableStart = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("|") && !lines[i].startsWith("**")) {
      tableStart = i
      break
    }
    metaLines.push(lines[i])
  }

  const tableLines = lines.slice(tableStart).filter(l => l.includes("|"))
  if (tableLines.length < 3) {
    const parts = content.split(/\*\*(.*?)\*\*/g)
    return (
      <div>
        {parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        )}
      </div>
    )
  }

  const headers = tableLines[0].split("|").map(h => h.trim()).filter(Boolean)
  const dataLines = tableLines.slice(2)

  const formatHeader = (h: string) => h.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  const formatValue = (v: string, col: string) => {
    if (!v || v === "-") return <span style={{ color: "#9ca3af" }}>—</span>
    if (col.match(/DATE|EXPIRY/i) && v.includes("GMT")) {
      return new Date(v).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })
    }
    if (col.match(/VALUE|COST|AMOUNT/i) && !isNaN(Number(v))) {
      return `€${Number(v).toLocaleString()}`
    }
    if (col.match(/STATUS/i)) {
      const color = v === "Active" ? "#16a34a" : v === "Expired" ? "#dc2626" : "#f59e0b"
      return <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${color}18`, color }}>{v}</span>
    }
    if (col.match(/SENTIMENT/i)) {
      const color = v === "Positive" ? "#16a34a" : v === "Negative" ? "#dc2626" : "#6b7280"
      return <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${color}18`, color }}>{v}</span>
    }
    if (v.length > 60) return v.slice(0, 60) + "..."
    return v
  }

  const skipCols = new Set(["PDF_STAGE_PATH", "CONTRACT_TEXT", "MASTER_CUSTOMER_ID"])
  const visibleHeaders = headers.filter(h => !skipCols.has(h))

  return (
    <div>
      {metaLines.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {metaLines.map((line, i) => {
            const parts = line.split(/\*\*(.*?)\*\*/g)
            return (
              <div key={i} style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
                {parts.map((part, j) =>
                  j % 2 === 1 ? <strong key={j} style={{ color: "#374151" }}>{part}</strong> : <span key={j}>{part}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{dataLines.length} result{dataLines.length !== 1 ? "s" : ""}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {dataLines.map((line, ri) => {
          const cells = line.split("|").map(c => c.trim()).filter(Boolean)
          return (
            <div key={ri} style={{ padding: "10px 14px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "6px 16px" }}>
                {visibleHeaders.map((h, ci) => {
                  const cellIdx = headers.indexOf(h)
                  const val = cells[cellIdx] || ""
                  return (
                    <div key={ci}>
                      <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", fontWeight: 600 }}>{formatHeader(h)}</div>
                      <div style={{ fontSize: 13, color: "#1f2937", marginTop: 2 }}>{formatValue(val, h)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CoWorkAgentPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("claude-opus-4-8")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const preloadCache = useRef<Map<string, string>>(new Map())
  const preloadingRef = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Preload first 5 sample question answers on mount
  useEffect(() => {
    if (preloadingRef.current) return
    preloadingRef.current = true
    const questionsToPreload = SAMPLE_QUESTIONS.slice(0, 5)
    questionsToPreload.forEach(async (q) => {
      try {
        const agentMessages = [{ role: "user", content: q }]
        const res = await fetch("/api/ande-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: agentMessages }),
        })
        const data = await res.json()
        if (data.answer) {
          preloadCache.current.set(q, data.answer)
        }
      } catch {}
    })
  }, [])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: "user", content: text.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput("")
    setLoading(true)
    const askedAt = new Date().toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short" })
    const modelLabel = MODELS.find(m => m.value === selectedModel)?.label || selectedModel
    try {
      // Check preload cache first (only for first message in conversation)
      const cached = updated.length === 1 ? preloadCache.current.get(text.trim()) : undefined
      if (cached) {
        const meta = `**Model:** ${modelLabel} | **Asked:** ${askedAt}`
        setMessages([...updated, { role: "assistant", content: `${meta}\n\n${cached}` }])
        return
      }
      // Try Agent first, fall back to SQL-based agent
      const agentMessages = updated.map(m => ({ role: m.role, content: m.content }))
      let res = await fetch("/api/ande-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: agentMessages }) })
      let data = await res.json()
      if (res.status === 500 && data.error && !data.answer) {
        // Fallback to SQL-based agent
        const apiMessages = updated.map(m => ({ role: m.role, content: [{ type: "text", text: m.content }] }))
        res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: apiMessages, model: selectedModel }) })
        data = await res.json()
      }
      const answer = data.error ? `Error: ${data.error}` : (data.answer || "No response")
      const meta = `**Model:** ${modelLabel} | **Asked:** ${askedAt}`
      setMessages([...updated, { role: "assistant", content: `${meta}\n\n${answer}` }])
    } catch (err) {
      const meta = `**Model:** ${modelLabel} | **Asked:** ${askedAt}`
      setMessages([...updated, { role: "assistant", content: `${meta}\n\nError: ${err instanceof Error ? err.message : "Unknown"}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", gap: 24, height: "calc(100vh - 120px)", padding: "24px 32px" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 16, background: "white", marginBottom: 12 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#6c757d" }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#1a1a2e" }}>AND-E Agent</div>
              <div>Ask about customers, contracts, insurance policies, calls, or documents</div>
            </div>
          )}
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div key={i} style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, maxWidth: "80%", fontSize: 14, lineHeight: 1.6, background: "#3b82f6", color: "#fff", marginLeft: "auto", whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </div>
              )
            }
            const parts = msg.content.split("\n\n")
            const hasMetadata = parts[0]?.includes("**Model:**")
            const metaLine = hasMetadata ? parts[0] : null
            const answerContent = hasMetadata ? parts.slice(1).join("\n\n") : msg.content
            return (
              <div key={i} style={{ marginBottom: 16, maxWidth: "95%" }}>
                {metaLine && (
                  <div style={{ padding: "8px 12px", marginBottom: 6, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 11, color: "#4338ca" }}>
                    {metaLine.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                      j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                    )}
                  </div>
                )}
                <div style={{ padding: "12px 16px", borderRadius: 8, fontSize: 14, lineHeight: 1.6, background: "#f8f9fa", color: "#1a1a2e", border: "1px solid #e0e0e0" }}>
                  <FormattedAnswer content={answerContent} />
                </div>
              </div>
            )
          })}
          {loading && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#f1f3f5", color: "#6c757d", maxWidth: "80%" }}>Thinking...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask about customers, contracts, calls, web activity..."
            disabled={loading}
            style={{ flex: 1, padding: "12px 16px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 14, outline: "none" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{ padding: "12px 24px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontWeight: 600, opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            Go
          </button>
          <button
            onClick={() => { setMessages([]); setInput("") }}
            style={{ padding: "12px 16px", background: "#e9ecef", color: "#6c757d", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
          >
            Clear
          </button>
        </div>
      </div>
      <div style={{ width: 300, minWidth: 300, background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, overflowY: "auto" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6c757d", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Model</div>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            style={{ width: "100%", fontSize: 12, padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: 6, background: "#fff", cursor: "pointer" }}
          >
            {MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: 11, color: "#6c757d", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Sample Questions</div>
        {SAMPLE_QUESTIONS.map((q, i) => (
          <div
            key={i}
            onClick={() => sendMessage(q)}
            style={{ padding: "8px 12px", marginBottom: 6, background: i < 5 ? "#f0fdf4" : "#fff", border: `1px solid ${i < 5 ? "#bbf7d0" : "#e0e0e0"}`, borderRadius: 6, fontSize: 12, cursor: "pointer", transition: "all 0.2s", position: "relative" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#3b82f6" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = i < 5 ? "#bbf7d0" : "#e0e0e0"; e.currentTarget.style.color = "#1a1a2e" }}
          >
            {i < 5 && <span style={{ position: "absolute", top: 4, right: 6, fontSize: 9, color: "#16a34a", fontWeight: 600 }}>⚡</span>}
            {q}
          </div>
        ))}
      </div>
    </div>
  )
}
