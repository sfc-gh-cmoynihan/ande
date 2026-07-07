"use client"
import { useState, useEffect, Suspense, lazy } from "react"
import { Search, Phone, Bot, LayoutDashboard, AlertCircle, Car, Activity, ShieldAlert } from "lucide-react"

const DashboardPanel = lazy(() => import("@/components/DashboardPanel").then(m => ({ default: m.DashboardPanel })))
const SearchPanel = lazy(() => import("@/components/SearchPanel").then(m => ({ default: m.SearchPanel })))
const CallsPanel = lazy(() => import("@/components/CallsPanel").then(m => ({ default: m.CallsPanel })))
const RecordingsPanel = lazy(() => import("@/components/RecordingsPanel").then(m => ({ default: m.RecordingsPanel })))
const ContractsPanel = lazy(() => import("@/components/ContractsPanel").then(m => ({ default: m.ContractsPanel })))
const CoWorkAgentPanel = lazy(() => import("@/components/CoWorkAgentPanel").then(m => ({ default: m.CoWorkAgentPanel })))
const DocumentSearchPanel = lazy(() => import("@/components/DocumentSearchPanel").then(m => ({ default: m.DocumentSearchPanel })))
const ContactCentrePanel = lazy(() => import("@/components/ContactCentrePanel").then(m => ({ default: m.ContactCentrePanel })))
const CallGovernancePanel = lazy(() => import("@/components/CallGovernancePanel").then(m => ({ default: m.CallGovernancePanel })))

const NAV_ITEMS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "search", label: "Customer", icon: Search },
  { id: "contact-centre", label: "Call Analytics", icon: Activity },
  { id: "calls", label: "Calls by Agent", icon: Phone },
  { id: "governance", label: "Red Flags", icon: ShieldAlert },
  { id: "contracts", label: "Policies", icon: Car },
  { id: "claims", label: "Claims", icon: AlertCircle },
  { id: "agent", label: "Agent", icon: Bot },
]

function LoadingSpinner() {
  return <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Loading...</div>
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedCustomerName, setSelectedCustomerName] = useState("")
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const update = () => setCurrentTime(new Date().toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short" }))
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleCustomerSelect = (id: string, name: string) => {
    setSelectedCustomerId(id)
    setSelectedCustomerName(name)
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <header style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        padding: "0 24px",
        height: 56,
        background: "#fff",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <img src="/ande-logo.png" alt="AND.e" style={{ height: 28, marginRight: 12 }} />
        <div style={{ display: "flex", flexDirection: "column", marginRight: 28, lineHeight: 1.3 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>Colm Moynihan</span>
          <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{currentTime}</span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 6,
                border: activeTab === item.id ? "1px solid var(--accent)" : "1px solid transparent",
                background: activeTab === item.id ? "rgba(0, 120, 120, 0.06)" : "transparent",
                color: activeTab === item.id ? "var(--accent)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: activeTab === item.id ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          ))}
        </nav>
        <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", whiteSpace: "nowrap" }}>v6.21</span>
      </header>
      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        <Suspense fallback={<LoadingSpinner />}>
          {activeTab === "dashboard" && <DashboardPanel />}
          {activeTab === "search" && (
            <>
              <SearchPanel onCustomerSelect={handleCustomerSelect} />
            </>
          )}
          {activeTab === "contracts" && <ContractsPanel customerId={selectedCustomerId} />}
          {activeTab === "claims" && <DocumentSearchPanel />}
          {activeTab === "calls" && (
            <>
              <CallsPanel customerId={selectedCustomerId} />
              <div style={{ marginTop: 32 }}>
                <RecordingsPanel customerId={selectedCustomerId} />
              </div>
            </>
          )}
          {activeTab === "contact-centre" && <ContactCentrePanel />}
          {activeTab === "governance" && <CallGovernancePanel />}
          {activeTab === "agent" && <CoWorkAgentPanel />}
        </Suspense>
      </main>
    </div>
  )
}
