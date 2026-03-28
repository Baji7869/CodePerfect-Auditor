import { LogOut, Menu, User } from 'lucide-react'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import './index.css'
import AuditReport from './pages/AuditReport'
import Cases from './pages/Cases'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Login from './pages/Login'
import NewAudit from './pages/NewAudit'

// ── Auth helpers ──────────────────────────────────────────────────────────────
export function getStoredUser() {
  try {
    const u = localStorage.getItem('cp_user')
    const t = localStorage.getItem('cp_token')
    return (u && t) ? JSON.parse(u) : null
  } catch { return null }
}

export function logout() {
  localStorage.removeItem('cp_token')
  localStorage.removeItem('cp_user')
}

// ── Protected route wrapper ───────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const user = getStoredUser()
  if (!user) return <Navigate to="/login" replace />
  return children
}

// ── User badge in header ──────────────────────────────────────────────────────
const ROLE_COLORS = {
  admin: '#7c3aed', supervisor: '#0d9488', coder: '#2563eb'
}

function UserBadge() {
  const navigate = useNavigate()
  const user = getStoredUser()
  if (!user) return null

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.3rem 0.6rem', borderRadius: 20,
        background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)'
      }}>
        <User size={13} style={{ color: '#60a5fa' }} />
        <span style={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 600 }}>{user.name}</span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10,
          background: `${ROLE_COLORS[user.role] || '#475569'}22`,
          color: ROLE_COLORS[user.role] || '#94a3b8',
          border: `1px solid ${ROLE_COLORS[user.role] || '#475569'}44`
        }}>
          {user.role.toUpperCase()}
        </span>
      </div>
      <button
        onClick={handleLogout}
        title="Sign out"
        style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, padding: '0.3rem 0.5rem', cursor: 'pointer',
          color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.75rem', fontWeight: 600
        }}
      >
        <LogOut size={13} /> Sign out
      </button>
    </div>
  )
}

// ── App shell (authenticated) ─────────────────────────────────────────────────
function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid rgba(37,99,235,0.1)',
          background: '#070f1c'
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <Menu size={20} />
          </button>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>
            🏥 CodePerfect Auditor
          </span>
          <UserBadge />
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/dashboard"        element={<Dashboard />} />
            <Route path="/audit"            element={<NewAudit />} />
            <Route path="/cases"            element={<Cases />} />
            <Route path="/cases/:caseId"    element={<AuditReport />} />
            <Route path="*"                 element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// ── Root app ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0d1724', color: '#e2e8f0',
          border: '1px solid rgba(37,99,235,0.2)',
          borderRadius: 10, fontSize: '0.85rem'
        },
        success: { iconTheme: { primary: '#4ade80', secondary: '#0d1724' } },
        error:   { iconTheme: { primary: '#f87171', secondary: '#0d1724' } },
      }} />
      <Routes>
        {/* Public routes */}
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}