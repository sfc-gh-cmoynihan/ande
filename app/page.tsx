"use client"
import { useState } from "react"
import { Search, Users, Phone, Headphones, FileText, Bot, GitBranch, LogOut } from "lucide-react"
import { SearchPanel } from "@/components/SearchPanel"
import { VersionsPanel } from "@/components/VersionsPanel"
import { CallsPanel } from "@/components/CallsPanel"
import { RecordingsPanel } from "@/components/RecordingsPanel"
import { ContractsPanel } from "@/components/ContractsPanel"
import { CoWorkAgentPanel } from "@/components/CoWorkAgentPanel"
import { MappingsPanel } from "@/components/MappingsPanel"

const NAV_ITEMS = [
  { id: "search", label: "Search", icon: Search },
  { id: "versions", label: "Duplicate Records", icon: Users },
  { id: "calls", label: "Support Calls", icon: Phone },
  { id: "recordings", label: "Recordings", icon: Headphones },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "mappings", label: "Mappings", icon: GitBranch },
  { id: "agent", label: "Agent", icon: Bot },
]

const LOGIN_TIME = new Date().toLocaleString("en-GB", { timeZone: "Europe/London", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })

export default function Home() {
  const [activeTab, setActiveTab] = useState("search")
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedCustomerName, setSelectedCustomerName] = useState("")

  const handleCustomerSelect = (id: string, name: string) => {
    setSelectedCustomerId(id)
    setSelectedCustomerName(name)
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <h1>Customer 360</h1>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>v4.3</span>
          </div>
          <p>Master Record Search</p>
        </div>
        {selectedCustomerName && (
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
            <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>SELECTED</div>
            <div style={{ color: "var(--accent)", fontWeight: 600 }}>{selectedCustomerName}</div>
            <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 10 }}>{selectedCustomerId}</div>
          </div>
        )}
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>Colm Moynihan</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 10 }}>Logged in: {LOGIN_TIME} BST</div>
          <button
            onClick={() => { document.cookie.split(";").forEach(c => { const name = c.split("=")[0].trim(); document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"; document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname; }); window.location.replace("https://app.snowflake.com/sfseeurope-ie-demo10") }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: "none", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--text-muted)", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)" }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        {activeTab === "search" && <SearchPanel onCustomerSelect={handleCustomerSelect} />}
        {activeTab === "versions" && <VersionsPanel customerId={selectedCustomerId} />}
        {activeTab === "calls" && <CallsPanel customerId={selectedCustomerId} />}
        {activeTab === "recordings" && <RecordingsPanel customerId={selectedCustomerId} />}
        {activeTab === "contracts" && <ContractsPanel customerId={selectedCustomerId} />}
        {activeTab === "agent" && <CoWorkAgentPanel />}
        {activeTab === "mappings" && <MappingsPanel />}
      </main>
    </div>
  )
}
