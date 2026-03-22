import { FilePlus, FolderOpen, LayoutDashboard, Stethoscope, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/audit', icon: FilePlus, label: 'New Audit' },
  { to: '/cases', icon: FolderOpen, label: 'All Cases' },
]

export default function Sidebar({ open, onClose }) {
  const [online, setOnline] = useState(true)
  useEffect(() => {
    fetch('/health').then(() => setOnline(true)).catch(() => setOnline(false))
  }, [])

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />}

      <aside className={`sidebar fixed md:static w-56 h-screen bg-[#070f1c] border-r border-blue-900/20 flex flex-col z-50 ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-blue-900/20">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Stethoscope size={16} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">CodePerfect</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Auditor v2.0</div>
            </div>
          </Link>
          <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white p-1"><X size={16} /></button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-2 mb-3">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Main Menu</p>
          </div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Status footer */}
        <div className="px-4 py-4 border-t border-blue-900/20">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-red-400'}`}
              style={online ? { animation: 'pulse-ring 2s ease infinite' } : {}} />
            <span className="text-[11px] text-slate-500">{online ? 'AI Agents Online' : 'Backend Offline'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">Powered by Groq AI · Built by The Boys</span>
          </div>
        </div>
      </aside>
    </>
  )
}
