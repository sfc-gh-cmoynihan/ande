"use client"
import { useState, useEffect } from "react"
import { FileText, Download, PenTool, Search } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface Contract {
  CONTRACT_ID: string
  CONTRACT_TITLE: string
  CUSTOMER_NAME: string
  MASTER_CUSTOMER_ID: string
  CONTRACT_DATE: string
  EXPIRY_DATE: string
  CONTRACT_VALUE: number
  STATUS: string
  SIGNED_BY_CUSTOMER: string
  SIGNED_BY_PROVIDER: string
  SIGNATURE_DATE: string
  PDF_URL: string
}

const STATUS_COLORS: Record<string, string> = {
  Active: "#66bb6a",
  Expired: "#ef5350",
  Pending: "#ffa726",
}

interface ContractsPanelProps {
  customerId?: string
}

export function ContractsPanel({ customerId }: ContractsPanelProps) {
  const [policyIdInput, setPolicyIdInput] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [idInput, setIdInput] = useState(customerId || "")
  const [emailInput, setEmailInput] = useState("colm.moynihan@snowflake.com")
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)

  const doSearch = async (overrides?: { id?: string; name?: string; email?: string }) => {
    setLoading(true)
    let params = ""
    const searchId = overrides?.id || idInput
    const searchName = overrides?.name || nameInput
    const searchEmail = overrides?.email || emailInput
    if (policyIdInput) {
      params = `policyId=${encodeURIComponent(policyIdInput)}`
    } else if (searchId) {
      params = `id=${encodeURIComponent(searchId)}`
    } else if (searchName) {
      params = `name=${encodeURIComponent(searchName)}`
    } else if (searchEmail) {
      params = `email=${encodeURIComponent(searchEmail)}`
    }
    const res = await fetch(`/api/contracts?${params}`)
    const data = await res.json()
    setContracts(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    if (customerId) {
      setIdInput(customerId)
      doSearch({ id: customerId })
    } else {
      setEmailInput("colm.moynihan@snowflake.com")
      doSearch({ email: "colm.moynihan@snowflake.com" })
    }
  }, [customerId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch()
  }

  const chartData = contracts.map((c) => ({
    name: c.CONTRACT_TITLE.slice(0, 20),
    value: c.CONTRACT_VALUE,
    status: c.STATUS,
  }))

  const totalValue = contracts.reduce((s, c) => s + c.CONTRACT_VALUE, 0)

  return (
    <div>
      <div className="page-header">
        <h2>Motor Policies</h2>
        <p>View motor insurance policies with signature details and PDF downloads</p>
      </div>

      <div className="card">
        <div className="search-row">
          <div className="input-group">
            <label>Policy ID</label>
            <input type="text" placeholder="e.g. POL-2025-LEXUS-001" value={policyIdInput} onChange={(e) => setPolicyIdInput(e.target.value)} onKeyDown={handleKeyDown} />
          </div>
          <div className="input-group">
            <label>Customer Name</label>
            <input type="text" placeholder="e.g. Colm Moynihan" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={handleKeyDown} />
          </div>

          <div className="input-group">
            <label>Customer Email</label>
            <input type="text" placeholder="e.g. colm.moynihan@snowflake.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyDown={handleKeyDown} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => doSearch()}>
          <Search size={14} /> Search Policies
        </button>
      </div>

      {loading && <div className="loading"><div className="spinner" /> Loading policies...</div>}

      {contracts.length > 0 && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{contracts.length}</div>
              <div className="stat-label">Policies</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">EUR {totalValue.toLocaleString()}</div>
              <div className="stat-label">Total Value</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{contracts.filter((c) => c.STATUS === "Active").length}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>

          {chartData.length > 1 && (
            <div className="chart-container">
              <div className="card-title" style={{ marginBottom: 12 }}>Policy Values</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status] || "var(--accent)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {contracts.map((c) => (
            <div key={c.CONTRACT_ID} className="contract-card">
              <div className="contract-header">
                <div>
                  <div className="contract-title">{c.CONTRACT_TITLE}</div>
                  <span className={`badge badge-${c.STATUS.toLowerCase()}`} style={{ marginTop: 4 }}>{c.STATUS}</span>
                </div>
                <div className="contract-value">
                  {c.CONTRACT_VALUE > 0 ? `EUR ${c.CONTRACT_VALUE.toLocaleString()}` : "N/A (DPA)"}
                </div>
              </div>
              <div className="contract-meta">
                <span>Policy: {c.CONTRACT_ID}</span>
                <span>Period: {c.CONTRACT_DATE} to {c.EXPIRY_DATE}</span>
                <span>Customer: {c.CUSTOMER_NAME}</span>
                <span>ID: {c.MASTER_CUSTOMER_ID}</span>
              </div>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div className="detail-label" style={{ marginBottom: 4 }}><PenTool size={10} /> Signatures</div>
                  <div style={{ fontSize: 13 }}>
                    <div>Customer: <strong>{c.SIGNED_BY_CUSTOMER}</strong></div>
                    <div>Provider: <strong>{c.SIGNED_BY_PROVIDER}</strong></div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Signed: {c.SIGNATURE_DATE}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                  {c.PDF_URL && (
                    <a href={c.PDF_URL} target="_blank" rel="noopener noreferrer" className="btn">
                      <Download size={14} /> Download PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
