import { AlertTriangle, Brain, CheckCircle, ChevronLeft, Clock, Code2, DollarSign, FileText, Minus, Quote, Shield, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import RiskBadge from '../components/RiskBadge'
import { auditAPI } from '../utils/api'

const typeColors = {
  missed_code: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', label: 'Missed Code', color: '#f87171' },
  incorrect_code: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: 'Incorrect Code', color: '#fbbf24' },
  upcoding: { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)', label: 'Upcoding', color: '#c084fc' },
  undercoding: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', label: 'Undercoding', color: '#f87171' },
  missed_comorbidity: { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.25)', label: 'Missed Comorbidity', color: '#facc15' },
  wrong_specificity: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', label: 'Wrong Specificity', color: '#60a5fa' },
}

const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

export default function AuditReport() {
  const { caseId } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('discrepancies')
  const [error, setError] = useState(null)

  useEffect(() => {
    auditAPI.getReport(caseId)
      .then(r => { setReport(r.data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [caseId])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(37,99,235,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#475569', fontSize: '0.85rem' }}>Loading report...</p>
      </div>
    </div>
  )

  if (error || !report) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: '#f87171' }}>Failed to load report: {error}</p>
      <Link to="/cases" style={{ color: '#3b82f6', fontSize: '0.85rem' }}>← Back to Cases</Link>
    </div>
  )

  const sortedDiscrepancies = [...(report.discrepancies || [])].sort((a, b) =>
    (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  )
  const totalRevenue = report.total_revenue_impact_usd || 0
  // Fix: infer direction from revenue amount if backend returned 'accurate' incorrectly
  const rawDirection = report.revenue_impact_direction || 'accurate'
  const direction = (rawDirection === 'accurate' && (report.total_revenue_impact_usd || 0) > 0)
    ? 'under-billed'
    : rawDirection
  const revenueColor = direction === 'under-billed' ? '#f87171' : direction === 'over-billed' ? '#c084fc' : '#4ade80'
  const RevenueIcon = direction === 'under-billed' ? TrendingDown : direction === 'over-billed' ? TrendingUp : Minus

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '1.5rem' }}>
        <Link to="/cases" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.78rem', color: '#475569', textDecoration: 'none', marginBottom: '1rem' }}>
          <ChevronLeft size={14} /> All Cases
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.375rem' }}>Audit Report</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(37,99,235,0.12)', color: '#93c5fd', padding: '0.2rem 0.625rem', borderRadius: 6, border: '1px solid rgba(37,99,235,0.2)' }}>{caseId}</span>
              {report.processing_time_ms > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#475569' }}>
                  <Clock size={11} /> {(report.processing_time_ms / 1000).toFixed(1)}s processing
                </span>
              )}
            </div>
          </div>
          <RiskBadge level={report.risk_level} />
        </div>
      </div>

      {/* Executive Summary */}
      <div className="animate-fade-up-1 card" style={{ padding: '1.25rem', marginBottom: '1rem', borderLeft: `3px solid ${revenueColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Brain size={14} style={{ color: '#3b82f6' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Executive Summary</span>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>{report.summary}</p>
        {report.critical_findings?.length > 0 && (
          <div style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {report.critical_findings.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: '#fca5a5' }}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {f}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="animate-fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Discrepancies', value: report.total_discrepancies, sub: `${sortedDiscrepancies.filter(d => d.severity === 'critical' || d.severity === 'high').length} High/Critical`, icon: <AlertTriangle size={16} style={{ color: '#f59e0b' }} /> },
          { label: 'Revenue Impact', value: `$${totalRevenue.toLocaleString()}`, sub: direction.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()), icon: <RevenueIcon size={16} style={{ color: revenueColor }} />, valueColor: revenueColor },
          { label: 'AI Codes Generated', value: (report.ai_icd10_codes?.length || 0) + (report.ai_cpt_codes?.length || 0), sub: `${report.ai_icd10_codes?.length || 0} ICD-10 · ${report.ai_cpt_codes?.length || 0} CPT`, icon: <Code2 size={16} style={{ color: '#818cf8' }} /> },
          { label: 'Defense Strength', value: (report.audit_defense_strength || 'moderate').charAt(0).toUpperCase() + (report.audit_defense_strength || 'moderate').slice(1), sub: 'Audit Defensibility', icon: <Shield size={16} style={{ color: '#34d399' }} /> },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</span>
              {stat.icon}
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.valueColor || 'white', lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.25rem' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="animate-fade-up-3" style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
        {[
          { id: 'discrepancies', label: `Discrepancies (${report.total_discrepancies})`, icon: <AlertTriangle size={13} /> },
          { id: 'codes', label: 'Code Comparison', icon: <Code2 size={13} /> },
          { id: 'facts', label: 'Clinical Facts', icon: <FileText size={13} /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.375rem', background: activeTab === tab.id ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'rgba(8,18,32,0.8)', color: activeTab === tab.id ? 'white' : '#64748b', border: `1px solid ${activeTab === tab.id ? 'transparent' : 'rgba(37,99,235,0.12)'}` }}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* DISCREPANCIES TAB */}
      {activeTab === 'discrepancies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {sortedDiscrepancies.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <CheckCircle size={40} style={{ color: '#4ade80', margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>No Discrepancies Found</p>
              <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>Human coder's codes match AI perfectly.</p>
            </div>
          ) : sortedDiscrepancies.map((d, i) => {
            const style = typeColors[d.discrepancy_type] || typeColors.missed_code
            return (
              <div key={i} className="card animate-fade-up" style={{ padding: '1.25rem', borderLeft: `3px solid ${style.color}`, background: style.bg, border: `1px solid ${style.border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: 6, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>{style.label}</span>
                    <RiskBadge level={d.severity} small />
                    {d.ai_code && <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#93c5fd', background: 'rgba(37,99,235,0.12)', padding: '0.15rem 0.5rem', borderRadius: 5 }}>{d.ai_code}</span>}
                    {d.human_code && <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#f87171', textDecoration: 'line-through', opacity: 0.8 }}>{d.human_code}</span>}
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{d.code_type}</span>
                  </div>
                  {d.estimated_revenue_impact_usd > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>-${d.estimated_revenue_impact_usd.toLocaleString()}</p>
                      <p style={{ fontSize: '0.65rem', color: '#475569' }}>Revenue Impact</p>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', marginBottom: '0.75rem' }}>{d.description}</p>

                {/* Chart Evidence — THE KEY FEATURE */}
                {d.chart_evidence && d.chart_evidence !== 'chart excerpt' && d.chart_evidence !== 'evidence' && (
                  <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                      <Quote size={12} style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chart Evidence</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#93c5fd', fontStyle: 'italic', lineHeight: 1.5 }}>"{d.chart_evidence}"</p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                  {d.clinical_justification && (
                    <div style={{ background: 'rgba(8,18,32,0.5)', borderRadius: 7, padding: '0.625rem 0.75rem' }}>
                      <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Clinical Justification</p>
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>{d.clinical_justification}</p>
                    </div>
                  )}
                  {d.recommendation && (
                    <div style={{ background: 'rgba(8,18,32,0.5)', borderRadius: 7, padding: '0.625rem 0.75rem' }}>
                      <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Recommendation</p>
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>{d.recommendation}</p>
                    </div>
                  )}
                </div>

                {d.financial_impact && (
                  <div style={{ marginTop: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <DollarSign size={12} style={{ color: '#f59e0b' }} />
                    <p style={{ fontSize: '0.75rem', color: '#fbbf24' }}>{d.financial_impact}</p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Compliance Flags */}
          {report.compliance_flags?.length > 0 && (
            <div className="card" style={{ padding: '1rem', borderLeft: '3px solid rgba(168,85,247,0.5)' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>⚠ Compliance Flags</p>
              {report.compliance_flags.map((f, i) => (
                <p key={i} style={{ fontSize: '0.8rem', color: '#a78bfa', padding: '0.375rem 0', borderBottom: i < report.compliance_flags.length - 1 ? '1px solid rgba(168,85,247,0.1)' : 'none' }}>• {f}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CODE COMPARISON TAB */}
      {activeTab === 'codes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1rem' }}>👨‍⚕️</span>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Human Coder's Codes</p>
            </div>
            {(!report.human_icd10_codes?.length && !report.human_cpt_codes?.length) ? (
              <p style={{ fontSize: '0.8rem', color: '#334155' }}>No codes provided</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[...(report.human_icd10_codes || []).map(c => ({ code: c, type: 'ICD10' })), ...(report.human_cpt_codes || []).map(c => ({ code: c, type: 'CPT' }))].map((item, i) => {
                  const desc = item.type === 'ICD10'
                    ? report.human_icd10_descriptions?.[item.code]
                    : report.human_cpt_descriptions?.[item.code]
                  const isValid = desc !== undefined && desc !== ''
                  return (
                    <div key={i} style={{ padding: '0.625rem 0.75rem', borderRadius: 8, background: 'rgba(8,18,32,0.5)', border: `1px solid ${isValid ? 'rgba(37,99,235,0.15)' : 'rgba(239,68,68,0.25)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: desc ? '0.25rem' : 0 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: isValid ? '#93c5fd' : '#f87171' }}>{item.code}</span>
                        <span style={{ fontSize: '0.65rem', color: '#475569', background: 'rgba(37,99,235,0.08)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{item.type}</span>
                        {isValid
                          ? <span style={{ fontSize: '0.65rem', color: '#4ade80', marginLeft: 'auto' }}>✓ Valid</span>
                          : <span style={{ fontSize: '0.65rem', color: '#f87171', marginLeft: 'auto' }}>✗ Not in CMS 2026</span>
                        }
                      </div>
                      {desc
                        ? <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>{desc}</p>
                        : <p style={{ fontSize: '0.75rem', color: '#f87171', opacity: 0.7 }}>Code not found in ICD-10-CM 2026 or AMA CPT 2024</p>
                      }
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1rem' }}>🤖</span>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI-Generated Codes</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[...(report.ai_icd10_codes || []), ...(report.ai_cpt_codes || [])].map((code, i) => (
                <div key={i} style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(8,18,32,0.5)', border: '1px solid rgba(37,99,235,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#93c5fd' }}>{code.code}</span>
                      <span style={{ fontSize: '0.65rem', color: '#475569', background: 'rgba(37,99,235,0.08)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{code.code_type}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 600 }}>{Math.round((code.confidence || 0.9) * 100)}%</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: code.supporting_text ? '0.375rem' : 0 }}>{code.description}</p>
                  {code.supporting_text && code.supporting_text !== 'evidence' && code.supporting_text !== 'chart excerpt' && (
                    <p style={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic' }}>"{code.supporting_text}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CLINICAL FACTS TAB */}
      {activeTab === 'facts' && report.clinical_facts && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>Primary Diagnosis</p>
            <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#93c5fd' }}>{report.clinical_facts.primary_diagnosis}</p>
            </div>
            {report.clinical_facts.patient_age && (
              <div style={{ marginTop: '0.875rem' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Patient Info</p>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Age: {report.clinical_facts.patient_age} {report.clinical_facts.patient_gender && `· ${report.clinical_facts.patient_gender}`}</p>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>Comorbidities ({report.clinical_facts.comorbidities?.length || 0})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {(report.clinical_facts.comorbidities || []).map((c, i) => (
                <div key={i} style={{ padding: '0.5rem 0.75rem', borderRadius: 7, background: 'rgba(8,18,32,0.6)', border: '1px solid rgba(37,99,235,0.08)', fontSize: '0.8rem', color: '#94a3b8' }}>{c}</div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', gridColumn: '1 / -1' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>Procedures Performed ({report.clinical_facts.procedures_performed?.length || 0})</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
              {(report.clinical_facts.procedures_performed || []).map((p, i) => (
                <div key={i} style={{ padding: '0.5rem 0.75rem', borderRadius: 7, background: 'rgba(8,18,32,0.6)', border: '1px solid rgba(37,99,235,0.08)', fontSize: '0.8rem', color: '#94a3b8' }}>• {p}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}