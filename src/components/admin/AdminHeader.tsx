import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  todayCount: number;
  overdueCount: number;
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'today', label: 'Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
  { key: 'revenue', label: 'Revenue Focus' },
];

export function AdminHeader({ activeTab, onTabChange, todayCount, overdueCount }: Props) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = time.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  return (
    <header className="relative z-20 border-b" style={{ borderColor: 'rgba(0,212,255,0.07)', background: 'rgba(4,8,15,0.92)', backdropFilter: 'blur(20px)' }}>
      {/* Top scan line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.3) 30%, rgba(0,212,255,0.5) 50%, rgba(0,212,255,0.3) 70%, transparent 100%)' }} />

      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Main header row */}
        <div className="flex items-center justify-between py-4 gap-4">
          {/* Left: Identity */}
          <div className="flex items-center gap-4">
            {/* Logo mark */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="12" rx="1.5" fill="rgba(0,212,255,0.8)" />
                <circle cx="10.5" cy="7" r="3.5" fill="none" stroke="rgba(0,212,255,0.8)" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: 'rgba(0,212,255,0.5)' }}>
                Cogniiq Command Center
              </p>
              <h1 className="text-sm font-bold text-white/80 tracking-tight leading-tight">
                Today's Operating System
              </h1>
            </div>
          </div>

          {/* Center: live counters */}
          <div className="hidden md:flex items-center gap-3">
            <StatPill label="OPEN" value={todayCount} color="#00d4ff" />
            {overdueCount > 0 && <StatPill label="OVERDUE" value={overdueCount} color="#f59e0b" pulse />}
          </div>

          {/* Right: clock + online */}
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10b981' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#10b981' }} />
              </span>
              <span className="text-[9px] font-bold tracking-[0.18em] uppercase" style={{ color: 'rgba(16,185,129,0.7)' }}>System Online</span>
            </div>
            <div className="font-mono text-lg font-semibold tabular-nums leading-none" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {hh}<span className="animate-pulse" style={{ color: 'rgba(0,212,255,0.6)' }}>:</span>{mm}<span className="animate-pulse" style={{ color: 'rgba(0,212,255,0.6)' }}>:</span>{ss}
            </div>
            <p className="text-[9px] tracking-wide" style={{ color: 'rgba(255,255,255,0.2)' }}>{dateStr}</p>
          </div>
        </div>

        {/* Tab nav */}
        <nav className="flex gap-0 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className="relative px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors duration-200 whitespace-nowrap"
              style={{ color: activeTab === tab.key ? '#00d4ff' : 'rgba(255,255,255,0.28)' }}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div layoutId="admin-tab-line" className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)' }} transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function StatPill({ label, value, color, pulse }: { label: string; value: number; color: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
      {pulse && <span className="relative flex h-1.5 w-1.5 flex-shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} /><span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: color }} /></span>}
      <span className="text-[10px] font-bold tracking-[0.14em] uppercase font-mono" style={{ color: `${color}90` }}>{label}</span>
      <span className="text-[13px] font-bold font-mono tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}
