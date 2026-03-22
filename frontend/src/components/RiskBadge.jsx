export default function RiskBadge({ level, size = 'sm' }) {
  const map = {
    critical: { cls: 'badge-critical', dot: '#f87171', label: 'Critical' },
    high:     { cls: 'badge-high',     dot: '#fb923c', label: 'High' },
    medium:   { cls: 'badge-medium',   dot: '#facc15', label: 'Medium' },
    low:      { cls: 'badge-low',      dot: '#4ade80', label: 'Low' },
  }
  const cfg = map[level?.toLowerCase()] || map.low
  return (
    <span className={`badge ${cfg.cls} ${size === 'lg' ? 'text-xs px-3 py-1' : ''}`}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}
