// frontend/src/components/Sidebar.jsx
// Role keys match what /api/auth/login now returns: "admin","supervisor","coder","demo"

import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'

// Keyed by SHORT role string — must match login response role field
const ROLE_ACCESS = {
  admin:      ['dashboard', 'audit', 'cases', 'lookup', 'admin'],
  supervisor: ['dashboard', 'audit', 'cases', 'lookup'],
  coder:      ['audit', 'cases'],
  demo:       ['dashboard', 'audit', 'cases', 'lookup'],
}

const ROLE_LABEL = {
  admin:      'Administrator',
  supervisor: 'Supervisor',
  coder:      'Medical Coder',
  demo:       'Demo User',
}

const ROLE_ICON = {
  admin:      '👑',
  supervisor: '🎯',
  coder:      '💊',
  demo:       '👤',
}

const ROLE_COLOR = {
  admin:      '#7c3aed',
  supervisor: '#0d9488',
  coder:      '#2563eb',
  demo:       '#64748b',
}

const ALL_NAV = [
  { path: '/dashboard', label: 'Dashboard',   icon: '📊', key: 'dashboard', desc: 'Stats & trends' },
  { path: '/audit',     label: 'New Audit',   icon: '🔍', key: 'audit',     desc: 'Run AI audit'  },
  { path: '/cases',     label: 'All Cases',   icon: '📋', key: 'cases',     desc: 'Audit history' },
  { path: '/lookup',    label: 'Code Lookup', icon: '🔎', key: 'lookup',    desc: 'Live ICD-10 search' },
]

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const userRaw = localStorage.getItem('cp_user')
  const user    = userRaw ? (() => { try { return JSON.parse(userRaw) } catch { return null } })() : null
  const role    = user?.role || 'demo'   // SHORT key: "admin", "supervisor", "coder", "demo"
  const allowed = ROLE_ACCESS[role] || ROLE_ACCESS.demo
  const navItems = ALL_NAV.filter(n => allowed.includes(n.key))

  const roleColor = ROLE_COLOR[role] || '#64748b'
  const roleLabel = ROLE_LABEL[role] || role
  const roleIcon  = ROLE_ICON[role]  || '👤'

  const handleLogout = () => {
    localStorage.removeItem('cp_token')
    localStorage.removeItem('cp_user')
    sessionStorage.removeItem('auditHistory')
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: '#0f172a',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{ padding: '1.5rem 1.2rem 1rem', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>🏥</span>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>CodePerfect</div>
            <div style={{ color: '#475569', fontSize: '0.65rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Medical Auditor
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem 0' }}>
        {navItems.map(item => {
          const active = location.pathname === item.path ||
                         (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onClose?.() }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '0.65rem 0.8rem', borderRadius: 8, border: 'none',
                background: active ? 'rgba(37,99,235,.25)' : 'transparent',
                cursor: 'pointer', textAlign: 'left', marginBottom: 4,
                borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '1rem', minWidth: 22 }}>{item.icon}</span>
              <div>
                <div style={{ color: active ? '#93c5fd' : '#e2e8f0', fontWeight: active ? 700 : 500, fontSize: '0.875rem' }}>
                  {item.label}
                </div>
                <div style={{ color: '#475569', fontSize: '0.68rem', marginTop: 1 }}>{item.desc}</div>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Standards badges */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', margin: '0 0.5rem' }}>
        <div style={{ fontSize: '0.62rem', color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
          Standards
        </div>
        {[
          '✓ ICD-10-CM 2026 (NIH NLM)',
          '✓ AMA CPT 2024',
          '✓ CMS MPFS 2024 Revenue',
          '✓ MS-DRG v41 FY2024',
          '✓ CMS CCI Upcoding',
        ].map((s, i) => (
          <div key={i} style={{ fontSize: '0.68rem', color: '#475569', marginBottom: 2 }}>{s}</div>
        ))}
      </div>

      {/* User info */}
      {user && (
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: `${roleColor}22`, border: `1.5px solid ${roleColor}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', flexShrink: 0,
            }}>
              {roleIcon}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || user.username}
              </div>
              <div style={{ fontSize: '0.65rem', color: roleColor, fontWeight: 600 }}>{roleLabel}</div>
            </div>
          </div>

          {/* Pages this role can access */}
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 6, padding: '6px 8px', marginBottom: 10 }}>
            <div style={{ fontSize: '0.62rem', color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
              Access
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {allowed.map(p => (
                <span key={p} style={{
                  background: `${roleColor}22`, color: roleColor,
                  borderRadius: 4, padding: '1px 6px',
                  fontSize: '0.62rem', fontWeight: 600, textTransform: 'capitalize',
                }}>
                  {p}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '0.55rem', borderRadius: 7,
              background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)',
              color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,.12)'}
          >
            🚪 Sign Out
          </button>
        </div>
      )}

      <div style={{ padding: '0.5rem 1rem 0.75rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.62rem', color: '#1e293b' }}>
          Team: The Boys · Virtusa Jatayu Season 5
        </div>
      </div>
    </aside>
  )
}