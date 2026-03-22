import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import './index.css'
import AuditReport from './pages/AuditReport'
import Cases from './pages/Cases'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import NewAudit from './pages/NewAudit'

function AppInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'

  if (isLanding) {
    return <Landing />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content" style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(37,99,235,0.1)', background: '#070f1c' }} className="md:hidden">
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <Menu size={20} />
          </button>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>CodePerfect Auditor</span>
        </div>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/audit" element={<NewAudit />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:caseId" element={<AuditReport />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#0d1724', color: '#e2e8f0', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, fontSize: '0.85rem' },
        success: { iconTheme: { primary: '#4ade80', secondary: '#0d1724' } },
        error: { iconTheme: { primary: '#f87171', secondary: '#0d1724' } },
      }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/*" element={<AppInner />} />
      </Routes>
    </BrowserRouter>
  )
}
