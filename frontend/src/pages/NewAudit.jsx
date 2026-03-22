import {
  AlertCircle, CheckCircle,
  ChevronRight,
  FileText,
  Info,
  Loader2,
  PenLine,
  Play,
  Upload,
  X,
  Zap
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { auditAPI } from '../utils/api'

const STEPS = [
  { id: 1, label: 'Parsing clinical chart',        icon: '📄' },
  { id: 2, label: 'Extracting clinical facts',     icon: '🔬' },
  { id: 3, label: 'Generating ICD-10 & CPT codes', icon: '💊' },
  { id: 4, label: 'Comparing & auditing codes',    icon: '🔍' },
  { id: 5, label: 'Generating final report',       icon: '📋' },
]

const MANUAL_PLACEHOLDER =
`DISCHARGE SUMMARY

Patient: [Name], [Age]-year-old [gender]
Admission: YYYY-MM-DD  Discharge: YYYY-MM-DD

CHIEF COMPLAINT: ...

PRIMARY DIAGNOSIS: ...

COMORBIDITIES:
- ...

PROCEDURES:
- ...

ATTENDING: Dr. [Name], MD [Specialty]`

export default function NewAudit() {
  const navigate    = useNavigate()
  const timerRef    = useRef(null)
  const doneRef     = useRef(false)

  const [tab,          setTab]          = useState('demo')
  const [file,         setFile]         = useState(null)
  // ── codes start EMPTY — user must enter their own ──────────────────────
  const [icd10Input,   setIcd10Input]   = useState('')
  const [cptInput,     setCptInput]     = useState('')
  const [selectedDemo, setSelectedDemo] = useState(null)
  const [demoCharts,   setDemoCharts]   = useState([])
  const [manualChart,  setManualChart]  = useState('')
  const [processing,   setProcessing]   = useState(false)
  const [currentStep,  setCurrentStep]  = useState(1)
  const [caseId,       setCaseId]       = useState(null)
  const percent = Math.min(Math.round((currentStep / 5) * 100), 95)

  useEffect(() => {
    auditAPI.getDemoCharts()
      .then(r => {
        const charts = r.data.charts || []
        setDemoCharts(charts)
        // Select first demo but DO NOT fill codes
        if (charts.length > 0) setSelectedDemo(charts[0])
      })
      .catch(() => {})
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const onDrop = useCallback(files => { if (files[0]) setFile(files[0]) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain':       ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  // Selecting a demo only changes the chart — NOT the codes
  const selectDemo = (chart) => {
    setSelectedDemo(chart)
    // Intentionally NOT setting icd10Input or cptInput
    // User must enter their own codes to get a meaningful audit
  }

  const useSuggestedCodes = () => {
    if (!selectedDemo) return
    setIcd10Input(selectedDemo.suggested_human_codes.icd10.join(', '))
    setCptInput(selectedDemo.suggested_human_codes.cpt.join(', '))
    toast('Suggested codes loaded — edit or leave some out to see AI catch discrepancies', { icon: '💡' })
  }

  const startFakeProgress = () => {
    let step = 1
    timerRef.current = setInterval(() => {
      step = Math.min(step + 1, 4)
      setCurrentStep(step)
    }, 8000)
  }

  const handleSubmit = async () => {
    if (tab === 'upload' && !file)          return toast.error('Please upload a chart file')
    if (tab === 'manual' && !manualChart.trim()) return toast.error('Please enter chart text')
    if (tab === 'demo'   && !selectedDemo)  return toast.error('Please select a demo case')

    doneRef.current = false
    setProcessing(true)
    setCurrentStep(1)

    try {
      const fd = new FormData()
      fd.append('human_icd10_codes', icd10Input.trim())
      fd.append('human_cpt_codes',   cptInput.trim())

      let res
      if (tab === 'upload') {
        fd.append('chart_file', file)
        res = await auditAPI.submitUpload(fd)
      } else if (tab === 'manual') {
        const blob = new Blob([manualChart], { type: 'text/plain' })
        fd.append('chart_file', blob, 'manual_chart.txt')
        res = await auditAPI.submitUpload(fd)
      } else {
        fd.append('demo_type', selectedDemo.id)
        res = await auditAPI.submitDemo(fd)
      }

      const id = res.data.case_id
      setCaseId(id)
      startFakeProgress()

      // Poll every 3 seconds for up to 5 minutes
      const maxWait = 300000
      const start   = Date.now()
      while (Date.now() - start < maxWait) {
        await new Promise(r => setTimeout(r, 3000))
        try {
          const { data } = await auditAPI.getStatus(id)
          if (data.status === 'completed' && !doneRef.current) {
            doneRef.current = true
            clearInterval(timerRef.current)
            setCurrentStep(5)
            toast.success('Audit complete!')
            setTimeout(() => navigate(`/cases/${id}`), 800)
            return
          }
          if (data.status === 'error') {
            clearInterval(timerRef.current)
            toast.error('Audit failed — check backend terminal')
            setProcessing(false)
            return
          }
        } catch (_) {}
      }
      clearInterval(timerRef.current)
      navigate('/cases')
    } catch (err) {
      clearInterval(timerRef.current)
      toast.error(err.message || 'Failed to submit')
      setProcessing(false)
    }
  }

  // ── Processing screen ─────────────────────────────────────────────────────
  if (processing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
        <div className="card animate-fade-up" style={{ maxWidth: 480, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 1.5rem' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#2563eb', animation: 'spin 1s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#3b82f6', animation: 'spin 1.5s linear infinite reverse' }} />
            <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} style={{ color: '#3b82f6' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>AI Audit In Progress</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>3 AI agents analyzing the chart against CMS 2024 database. Takes 15–45 seconds.</p>
          <div className="progress-bar" style={{ marginBottom: '0.5rem' }}>
            <div className="progress-fill" style={{ width: `${percent}%`, transition: 'width 1s ease' }} />
          </div>
          <p style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '1.5rem' }}>{percent}%</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {STEPS.map((step, i) => {
              const done   = currentStep > i + 1
              const active = currentStep === i + 1
              return (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: done ? 'rgba(34,197,94,0.06)' : active ? 'rgba(37,99,235,0.08)' : 'transparent', transition: 'background 0.5s' }}>
                  <span style={{ fontSize: '0.9rem' }}>{step.icon}</span>
                  <span style={{ fontSize: '0.75rem', flex: 1, textAlign: 'left', color: done ? '#4ade80' : active ? '#93c5fd' : '#334155' }}>{step.label}</span>
                  {done   && <CheckCircle size={13} style={{ color: '#4ade80' }} />}
                  {active && <Loader2    size={13} style={{ color: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />}
                </div>
              )
            })}
          </div>
          {caseId && <p style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: '#334155', fontFamily: 'monospace' }}>Case: {caseId}</p>}
        </div>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'demo',   icon: <Zap     size={13} />, label: 'Demo Cases'   },
    { id: 'manual', icon: <PenLine size={13} />, label: 'Manual Input' },
    { id: 'upload', icon: <Upload  size={13} />, label: 'Upload File'  },
  ]

  return (
    <div style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div className="animate-fade-up" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>New Audit</h1>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Submit a clinical chart and enter the human coder's codes for AI comparison</p>
      </div>

      {/* Tab bar */}
      <div className="animate-fade-up-1" style={{ display: 'flex', gap: '0.25rem', background: 'rgba(8,18,32,0.8)', border: '1px solid rgba(37,99,235,0.12)', borderRadius: 10, padding: 4, marginBottom: '1.25rem', width: 'fit-content' }}>
        {tabs.map(({ id, icon, label }) => (
          <button key={id} onClick={() => setTab(id)} className="btn" style={{ padding: '0.375rem 0.875rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.375rem', background: tab === id ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'transparent', color: tab === id ? 'white' : '#64748b', boxShadow: tab === id ? '0 2px 8px rgba(37,99,235,0.3)' : 'none' }}>
            {icon}{label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: '1rem', alignItems: 'start' }}>

        {/* Left panel — chart input */}
        <div className="animate-fade-up-2">

          {/* DEMO */}
          {tab === 'demo' && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Select Clinical Case</p>
              <p style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '1rem' }}>Chart text will be loaded. Enter human coder codes on the right yourself.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {demoCharts.map(chart => (
                  <button key={chart.id} onClick={() => selectDemo(chart)} style={{ textAlign: 'left', padding: '1rem', borderRadius: 10, border: `1px solid ${selectedDemo?.id === chart.id ? 'rgba(37,99,235,0.4)' : 'rgba(37,99,235,0.1)'}`, background: selectedDemo?.id === chart.id ? 'rgba(37,99,235,0.08)' : 'rgba(8,18,32,0.5)', cursor: 'pointer', transition: 'all 0.15s', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{chart.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{chart.description}</p>
                      </div>
                      {selectedDemo?.id === chart.id && <CheckCircle size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />}
                    </div>
                    {/* Show suggested codes as hints only */}
                    <div style={{ marginTop: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.62rem', color: '#334155' }}>Typical codes:</span>
                      {chart.suggested_human_codes.icd10.map(c => (
                        <span key={c} style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#475569', background: 'rgba(37,99,235,0.06)', padding: '0.1rem 0.4rem', borderRadius: 4, border: '1px solid rgba(37,99,235,0.1)' }}>{c}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {/* Use suggested codes button — explicit action */}
              {selectedDemo && (
                <button
                  onClick={useSuggestedCodes}
                  style={{ marginTop: '0.875rem', width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px dashed rgba(37,99,235,0.3)', background: 'transparent', color: '#60a5fa', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                >
                  <Info size={13} /> Load suggested codes into fields (optional)
                </button>
              )}
            </div>
          )}

          {/* MANUAL */}
          {tab === 'manual' && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Paste Clinical Chart Text</p>
              <p style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '0.875rem' }}>Paste any discharge summary, admission note, or progress note</p>
              <textarea
                value={manualChart}
                onChange={e => setManualChart(e.target.value)}
                placeholder={MANUAL_PLACEHOLDER}
                className="input"
                style={{ width: '100%', minHeight: 320, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.6, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#334155' }}>{manualChart.length} characters</span>
                <button onClick={() => setManualChart('')} style={{ fontSize: '0.7rem', color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
              </div>
            </div>
          )}

          {/* UPLOAD */}
          {tab === 'upload' && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Upload Clinical Chart</p>
              <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? 'rgba(37,99,235,0.6)' : 'rgba(37,99,235,0.2)'}`, borderRadius: 12, padding: '2.5rem 1rem', textAlign: 'center', cursor: 'pointer', background: isDragActive ? 'rgba(37,99,235,0.06)' : 'rgba(8,18,32,0.5)', transition: 'all 0.2s' }}>
                <input {...getInputProps()} />
                {file ? (
                  <div>
                    <FileText size={32} style={{ color: '#3b82f6', margin: '0 auto 0.75rem' }} />
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{file.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</p>
                    <button onClick={e => { e.stopPropagation(); setFile(null) }} style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, margin: '0.75rem auto 0' }}>
                      <X size={12} /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} style={{ color: '#1e3a5f', margin: '0 auto 0.75rem' }} />
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Drop chart file here or click to browse</p>
                    <p style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.375rem' }}>PDF, DOCX, TXT · Max 10MB</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right panel — codes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-up-3">
          <div className="card" style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Human Coder's Codes</p>
            <p style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '1rem' }}>Enter exactly what the human coder submitted — or leave blank to see what AI generates from scratch</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>ICD-10 Codes</label>
                <textarea
                  value={icd10Input}
                  onChange={e => setIcd10Input(e.target.value)}
                  placeholder="e.g. I21.9, E11.9, I10&#10;Leave blank to let AI generate all codes"
                  className="input"
                  style={{ resize: 'none', height: 72, fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>CPT Codes</label>
                <textarea
                  value={cptInput}
                  onChange={e => setCptInput(e.target.value)}
                  placeholder="e.g. 99223, 93306&#10;Leave blank to let AI generate all codes"
                  className="input"
                  style={{ resize: 'none', height: 56, fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            {/* Clear button */}
            {(icd10Input || cptInput) && (
              <button
                onClick={() => { setIcd10Input(''); setCptInput('') }}
                style={{ marginTop: '0.625rem', fontSize: '0.7rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <X size={11} /> Clear all codes
              </button>
            )}

            <div style={{ marginTop: '0.875rem', padding: '0.625rem 0.75rem', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.12)', borderRadius: 8, display: 'flex', gap: '0.5rem' }}>
              <AlertCircle size={13} style={{ color: '#60a5fa', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.5 }}>
                Enter the codes exactly as submitted by your coder. The AI will validate each code against CMS 2024 database and find what was missed or wrong.
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Play size={16} /> Run AI Audit <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
