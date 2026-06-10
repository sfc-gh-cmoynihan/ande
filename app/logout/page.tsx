"use client"
import { useEffect } from "react"

export default function LogoutPage() {
  useEffect(() => {
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    window.location.href = "/_oauth/logout"
  }, [])

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, color: "#64748b", marginBottom: 8 }}>Logging out...</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>Redirecting to login</div>
      </div>
    </div>
  )
}
