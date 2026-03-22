import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { auditAPI } from '../utils/api'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, AlertTriangle, DollarSign, CheckCircle, Clock, FileText, Plus, ArrowRight, Zap } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auditAPI.getDashboard().then(r => setStats(r.data)).catch(() => setStats(EMPTY)).finally(() => setLoading(false))
    const t = setInterval(() => auditAPI.getDashboard().then(r => setStats(r.data)).catch(() => {}), 15000)
    return () => clearInterval(t)
  }, [])

  if (loading) return (
    <div style={{ padding: '2rem' }}>
      <div className="skeleton" style={{ height: 32, width: 280, marginBottom: '1.5rem' }} />
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
      </div>
    </div>
  )

  const s = stats || EMPTY
  const riskData = [
    { name: 'Critical', value: s.risk_distribution?.critical || 0, color: '#ef4444' },
    { name: 'High', value: s.risk_distribution?.high || 0, color: '#f97316' },
    { name: 'Medium', value: s.risk_distribution?.medium || 0, color: '#eab308' },
    { name: 'Low', value: s.risk_distribution?.low || 0, color: '#22c55e' },
  ]

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>Revenue Integrity Dashboard</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Real-time medical coding audit intelligence · Auto-refreshes every 15s</p>
        </div>
        <Link to="/audit" className="btn btn-primary"><Plus size={15} /> New Audit</Link>
      </div>

      {/* Stats */}
      <div className="stat-grid animate-fade-up-1" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon={<FileText size={18} className="gradient-text" />} label="Total Audits" value={s.total_audits} sub={`${s.audits_today} today`} />
        <StatCard icon={<AlertTriangle size={18} style={{ color: '#fb923c' }} />} label="Discrepancies Found" value={s.total_discrepancies} sub={`${s.high_risk_cases} high-risk cases`} />
        <StatCard icon={<DollarSign size={18} style={{ color: '#4ade80' }} />} label="Revenue Recovered" value={`$${(s.revenue_recovered / 1000).toFixed(1)}k`} sub="across all audits" highlight />
        <StatCard icon={<CheckCircle size={18} style={{ color: '#60a5fa' }} />} label="AI Accuracy Rate" value={`${s.accuracy_rate}%`} sub="vs human coders" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Risk distribution chart */}
        <div className="card animate-fade-up-2" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Risk Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={riskData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1724', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {riskData.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Agent pipeline */}
        <div className="card animate-fade-up-3" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>AI Agent Pipeline Status</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {AGENTS.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0, animation: 'pulse-ring 2s ease infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{a.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#475569' }}>{a.desc}</div>
                </div>
                <span className="badge badge-low">Online</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(37,99,235,0.04)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Clock size={14} style={{ color: '#475569' }} />
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Avg processing time: <strong style={{ color: '#93c5fd' }}>{(s.avg_processing_time_ms / 1000).toFixed(1)}s</strong></span>
          </div>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="card animate-fade-up-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(37,99,235,0.08)' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={15} style={{ color: '#3b82f6' }} /> Recent Audits
          </p>
          <Link to="/cases" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none' }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {s.recent_audits?.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <FileText size={36} style={{ color: '#1e3a5f', margin: '0 auto 0.75rem' }} />
            <p style={{ fontSize: '0.8rem', color: '#475569' }}>No audits yet. <Link to="/audit" style={{ color: '#3b82f6' }}>Run your first →</Link></p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th><th>Chart File</th><th>Status</th>
                  <th>Risk</th><th style={{ textAlign: 'right' }}>Discrepancies</th>
                  <th style={{ textAlign: 'right' }}>Revenue Impact</th><th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(s.recent_audits || []).map(c => (
                  <tr key={c.case_id}>
                    <td><span className="pill">{c.case_id}</span></td>
                    <td style={{ color: '#94a3b8', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.chart_filename}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>{c.risk_level ? <RiskBadge level={c.risk_level} /> : <span style={{ color: '#334155' }}>—</span>}</td>
                    <td style={{ textAlign: 'right', color: c.discrepancy_count > 0 ? '#fb923c' : '#4ade80', fontWeight: 600 }}>{c.discrepancy_count ?? '—'}</td>
                    <td style={{ textAlign: 'right', color: '#4ade80', fontWeight: 600 }}>{c.revenue_impact != null ? `$${c.revenue_impact.toLocaleString()}` : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {c.status === 'completed' && <Link to={`/cases/${c.case_id}`} style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>Report <ArrowRight size={12} /></Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, highlight }) {
  return (
    <div className="card card-hover" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        {icon}
      </div>
      <div style={{ fontSize: '1.625rem', fontWeight: 800, color: highlight ? '#4ade80' : 'white', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.375rem' }}>{sub}</div>
    </div>
  )
}

const AGENTS = [
  { name: 'Clinical Reader Agent', desc: 'Extracts diagnoses, comorbidities & procedures' },
  { name: 'Coding Logic Agent', desc: 'Generates ICD-10 & CPT codes via RAG' },
  { name: 'Auditor Agent', desc: 'Compares codes & identifies discrepancies' },
]

const EMPTY = { total_audits: 0, audits_today: 0, total_discrepancies: 0, revenue_recovered: 0, accuracy_rate: 98.5, high_risk_cases: 0, avg_processing_time_ms: 0, risk_distribution: {}, recent_audits: [] }
