import { AlertTriangle, ExternalLink, FolderOpen, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'
import { auditAPI } from '../utils/api'

export default function Cases() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const r = await auditAPI.listCases()
      setCases(r.data.cases || r.data || [])
    } catch {
      setCases([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const hasProcessing = cases.some(c => c.status === 'processing')
    if (!hasProcessing) return
    const t = setInterval(() => load(true), 8000)
    return () => clearInterval(t)
  }, [cases])

  const handleDelete = async (caseId) => {
    setDeleting(caseId)
    try {
      await auditAPI.deleteCase(caseId)
      setCases(prev => prev.filter(c => c.case_id !== caseId))
      toast.success(`Case ${caseId} deleted`)
    } catch {
      toast.error('Failed to delete case')
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  const filtered = cases.filter(c =>
    c.case_id.toLowerCase().includes(search.toLowerCase()) ||
    c.chart_filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ padding: '1.75rem', maxWidth: 380, width: '90%', textAlign: 'center' }}>
            <AlertTriangle size={32} style={{ color: '#f87171', margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '0.5rem' }}>Delete Case?</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.375rem' }}>This will permanently delete:</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#93c5fd', marginBottom: '1.25rem' }}>{confirmDelete}</p>
            <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} className="btn" style={{ padding: '0.5rem 1.25rem', color: '#64748b' }}>Cancel</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="btn"
                style={{ padding: '0.5rem 1.25rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                disabled={deleting === confirmDelete}
              >
                {deleting === confirmDelete ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Audit Cases</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{cases.length} total cases{cases.some(c => c.status === 'processing') ? ' · Auto-refreshing...' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => load(true)} className="btn btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <Link to="/audit" className="btn btn-primary"><Plus size={14} /> New Audit</Link>
        </div>
      </div>

      <div className="animate-fade-up-1" style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
        <input
          type="text" placeholder="Search by case ID or filename..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input" style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card animate-fade-up" style={{ padding: '4rem', textAlign: 'center' }}>
          <FolderOpen size={40} style={{ color: '#1e3a5f', margin: '0 auto 0.875rem' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>No cases found</p>
          <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: 4 }}>
            <Link to="/audit" style={{ color: '#3b82f6' }}>Start your first audit →</Link>
          </p>
        </div>
      ) : (
        <div className="card animate-fade-up-2" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th><th>Chart File</th><th>Patient</th><th>Status</th>
                  <th>Risk</th><th style={{ textAlign: 'right' }}>Discrepancies</th>
                  <th style={{ textAlign: 'right' }}>Revenue Impact</th>
                  <th style={{ textAlign: 'right' }}>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.case_id}>
                    <td><span className="pill">{c.case_id}</span></td>
                    <td style={{ color: '#94a3b8', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.chart_filename}</td>
                    <td style={{ color: '#64748b' }}>{c.patient_id || '—'}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>{c.risk_level ? <RiskBadge level={c.risk_level} /> : <span style={{ color: '#1e3a5f' }}>—</span>}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: c.discrepancy_count > 0 ? '#fb923c' : '#4ade80' }}>{c.discrepancy_count ?? '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>{c.revenue_impact != null ? `$${c.revenue_impact.toLocaleString()}` : '—'}</td>
                    <td style={{ textAlign: 'right', color: '#475569', fontSize: '0.75rem' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {c.status === 'completed' ? (
                          <Link to={`/cases/${c.case_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none' }}>
                            View <ExternalLink size={11} />
                          </Link>
                        ) : c.status === 'processing' ? (
                          <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>Processing...</span>
                        ) : <span style={{ color: '#1e3a5f' }}>—</span>}
                        <button
                          onClick={() => setConfirmDelete(c.case_id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#334155', display: 'flex', alignItems: 'center' }}
                          title="Delete case"
                        >
                          <Trash2 size={13} style={{ color: deleting === c.case_id ? '#f87171' : '#475569' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
