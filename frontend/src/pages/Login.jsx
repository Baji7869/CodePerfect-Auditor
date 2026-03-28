import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const DEMO_USERS = [
  { username: 'admin',      password: 'Admin@2026',  role: 'Administrator',  color: '#7c3aed' },
  { username: 'supervisor', password: 'Super@2026',  role: 'Supervisor',     color: '#0d9488' },
  { username: 'coder1',     password: 'Coder@2026',  role: 'Medical Coder',  color: '#2563eb' },
  { username: 'demo',       password: 'Demo@2026',   role: 'Demo User',      color: '#64748b' },
]

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleLogin = async (u = username, p = password) => {
    if (!u || !p) { setError('Please enter username and password'); return }
    setLoading(true); setError('')
    try {
      const { data } = await axios.post(`${BASE}/api/auth/login`, { username: u, password: p })
      localStorage.setItem('cp_token', data.access_token)
      localStorage.setItem('cp_user',  JSON.stringify({
        username: data.username, name: data.name,
        role: data.role, permissions: data.permissions
      }))
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (u) => {
    setUsername(u.username)
    setPassword(u.password)
    handleLogin(u.username, u.password)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0c1a3a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏥</div>
          <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            CodePerfect Auditor
          </h1>
          <p style={{ color: '#60a5fa', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
            AI-Powered Medical Coding Validation
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: '2rem',
          backdropFilter: 'blur(12px)'
        }}>
          <h2 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1.5rem' }}>
            Sign in to your account
          </h2>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem',
              color: '#fca5a5', fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter username"
              style={{
                width: '100%', padding: '0.7rem 1rem', borderRadius: 8,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'white', fontSize: '0.95rem', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter password"
              style={{
                width: '100%', padding: '0.7rem 1rem', borderRadius: 8,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'white', fontSize: '0.95rem', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={() => handleLogin()}
            disabled={loading}
            style={{
              width: '100%', padding: '0.8rem',
              background: loading ? '#334155' : 'linear-gradient(135deg,#2563eb,#4f46e5)',
              border: 'none', borderRadius: 8, color: 'white',
              fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s', letterSpacing: '0.02em'
            }}
          >
            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
          </button>
        </div>

        {/* Quick login */}
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Demo Login
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {DEMO_USERS.map(u => (
              <button
                key={u.username}
                onClick={() => quickLogin(u)}
                disabled={loading}
                style={{
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${u.color}44`,
                  borderRadius: 8, cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.2s'
                }}
              >
                <div style={{ color: u.color, fontSize: '0.75rem', fontWeight: 700 }}>
                  {u.username}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '2px' }}>
                  {u.role}
                </div>
              </button>
            ))}
          </div>
        </div>

        <p style={{ color: '#334155', fontSize: '0.7rem', textAlign: 'center', marginTop: '1.5rem' }}>
          Virtusa Jatayu Season 5 · Team: The Boys · VR Siddhartha Engineering College
        </p>
      </div>
    </div>
  )
}
