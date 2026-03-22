export default function StatusBadge({ status }) {
  const map = {
    completed:  'badge badge-low',
    processing: 'badge badge-info',
    pending:    'badge' + ' bg-slate-800 text-slate-400 border-slate-700',
    error:      'badge badge-critical',
  }
  return <span className={map[status] || map.pending} style={{ textTransform: 'capitalize' }}>{status}</span>
}
