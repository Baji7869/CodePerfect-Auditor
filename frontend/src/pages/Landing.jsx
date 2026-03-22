import { Link } from 'react-router-dom'
import { AlertTriangle, Brain, CheckCircle, ChevronRight, DollarSign, FileText, Search, Shield, Zap } from 'lucide-react'

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: '#050b14', color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 3rem', borderBottom: '1px solid rgba(37,99,235,0.1)', background: 'rgba(5,11,20,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} style={{ color: 'white' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>CodePerfect Auditor</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/audit" style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: 'white', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 12px rgba(37,99,235,0.4)' }}>
            Run Demo Audit →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '6rem 2rem 4rem', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 1rem', borderRadius: 100, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', fontSize: '0.75rem', color: '#93c5fd', marginBottom: '1.75rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          AI Agents Online · Real-time Pre-Submission Auditing
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
          Stop Revenue Leakage<br />
          <span style={{ background: 'linear-gradient(135deg,#3b82f6,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Before Claims Are Submitted
          </span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: 620, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          3 AI agents read your clinical charts, generate correct ICD-10 & CPT codes, and flag every discrepancy with <strong style={{ color: '#93c5fd' }}>exact chart evidence</strong> — creating an auditable defense for every bill.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/audit" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', borderRadius: 10, background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: 'white', fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}>
            <Zap size={16} /> Run Free Demo Audit <ChevronRight size={15} />
          </Link>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', borderRadius: 10, border: '1px solid rgba(37,99,235,0.25)', color: '#93c5fd', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}>
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ display: 'flex', justifyContent: 'center', gap: 0, padding: '0 2rem 4rem', maxWidth: 860, margin: '0 auto' }}>
        {[
          { value: '$180B', label: 'Market by 2034' },
          { value: '94.2%', label: 'AI Accuracy Rate' },
          { value: '<40s', label: 'Audit Time' },
          { value: '3', label: 'AI Agents' },
        ].map((stat, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: '1.25rem 1rem', borderTop: '1px solid rgba(37,99,235,0.15)', borderBottom: '1px solid rgba(37,99,235,0.15)', borderRight: i < 3 ? '1px solid rgba(37,99,235,0.1)' : 'none', borderLeft: i === 0 ? '1px solid rgba(37,99,235,0.15)' : 'none' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', marginBottom: '0.25rem' }}>{stat.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* 3 Agents */}
      <section style={{ padding: '4rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>How It Works</p>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>3 AI Agents. One Audit.</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem', fontSize: '0.9rem' }}>Each agent specializes in one task, passing results to the next in a pipeline.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
          {[
            { num: '01', icon: <FileText size={24} style={{ color: '#3b82f6' }} />, title: 'Clinical Reader Agent', desc: 'Ingests unstructured discharge summaries and surgical notes. Extracts primary diagnoses, comorbidities, and procedures using NLP.', color: '#3b82f6' },
            { num: '02', icon: <Brain size={24} style={{ color: '#818cf8' }} />, title: 'Coding Logic Agent', desc: 'Independently generates ICD-10 and CPT codes from extracted facts using the latest CMS guidelines — no human input required.', color: '#818cf8' },
            { num: '03', icon: <Search size={24} style={{ color: '#f97316' }} />, title: 'Auditor Agent', desc: 'Compares AI codes vs human coder submission. Flags every discrepancy with the exact sentence from the chart as audit defense.', color: '#f97316' },
          ].map((agent, i) => (
            <div key={i} style={{ padding: '1.5rem', borderRadius: 12, background: 'rgba(8,18,32,0.8)', border: '1px solid rgba(37,99,235,0.12)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '2.5rem', fontWeight: 900, color: agent.color, opacity: 0.08 }}>{agent.num}</div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${agent.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>{agent.icon}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.625rem' }}>{agent.title}</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>{agent.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem → Solution */}
      <section style={{ padding: '4rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ padding: '2rem', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <AlertTriangle size={18} style={{ color: '#f87171' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em' }}>The Problem</span>
            </div>
            {[
              'Inaccurate ICD-10/CPT coding causes major revenue leakage',
              'Manual audits happen AFTER claim submission — too late',
              'Human coders miss comorbidities that increase reimbursement',
              'No auditable evidence trail for disputed claims',
              'Increasing regulatory complexity & RAC audit risk',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.625rem' }}>
                <span style={{ color: '#f87171', flexShrink: 0 }}>✗</span>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: '2rem', borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <CheckCircle size={18} style={{ color: '#4ade80' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CodePerfect Solution</span>
            </div>
            {[
              'AI audits codes BEFORE claim submission in under 40 seconds',
              'Catches missed comorbidities that increase DRG reimbursement',
              'Flags exact chart sentence as evidence for every discrepancy',
              'Creates downloadable audit defense PDF for every case',
              'Continuous learning from updated CMS coding guidelines',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.625rem' }}>
                <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Segments */}
      <section style={{ padding: '4rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Target Segments</p>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, marginBottom: '2.5rem' }}>Built for Revenue Cycle Teams</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.875rem' }}>
          {[
            { icon: '🏥', title: 'Hospitals & Health Systems', desc: 'Multi-specialty & enterprise hospitals protecting revenue integrity' },
            { icon: '💼', title: 'RCM Teams', desc: 'Revenue Cycle Management billing & coding operations' },
            { icon: '🏢', title: 'Medical Billing Firms', desc: 'Outsourced coding services needing accuracy at scale' },
            { icon: '🛡️', title: 'Insurance Payers', desc: 'Claims validation & fraud risk control' },
            { icon: '📋', title: 'Compliance Teams', desc: 'Regulatory oversight & RAC audit preparedness' },
            { icon: '📊', title: 'CFOs & Finance', desc: 'Revenue assurance and reimbursement optimization' },
          ].map((seg, i) => (
            <div key={i} style={{ padding: '1.25rem', borderRadius: 10, background: 'rgba(8,18,32,0.8)', border: '1px solid rgba(37,99,235,0.1)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{seg.icon}</span>
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.25rem' }}>{seg.title}</p>
                <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5 }}>{seg.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '5rem 2rem', background: 'linear-gradient(180deg, transparent, rgba(37,99,235,0.06))', borderTop: '1px solid rgba(37,99,235,0.1)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Ready to Protect Your Revenue?</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>Run a demo audit in 60 seconds. No setup required.</p>
        <Link to="/audit" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.5rem', borderRadius: 12, background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: 'white', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(37,99,235,0.5)' }}>
          <Zap size={18} /> Start Free Audit Now
        </Link>
        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#334155' }}>Powered by Groq AI · Built by The Boys</p>
      </section>
    </div>
  )
}
