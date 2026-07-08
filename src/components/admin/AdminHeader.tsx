import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AdminThemeToggle } from './AdminThemeToggle';
import { AdminTheme } from '../../hooks/useAdminTheme';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  todayCount: number;
  overdueCount: number;
  theme?: AdminTheme;
  onThemeToggle?: () => void;
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'today', label: 'Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
  { key: 'revenue', label: 'Revenue Focus' },
  { key: 'oura-analytics', label: 'Oura Analytics', href: '/admin/oura-analytics' },
  { key: 'execution', label: 'Execution OS', href: '/admin/execution' },
];

export function AdminHeader({ activeTab, onTabChange, todayCount, overdueCount, theme = 'dark', onThemeToggle }: Props) {
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
    <header className="relative z-20 border-b admin-header" style={{ borderColor: 'var(--admin-header-border)', background: 'var(--admin-header-bg)', backdropFilter: 'blur(20px)' }}>
      {/* Top scan line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, var(--admin-header-scan) 30%, var(--admin-header-scan) 50%, var(--admin-header-scan) 70%, transparent 100%)' }} />

      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Main header row */}
        <div className="flex items-center justify-between py-4 gap-4">
          {/* Left: Identity */}
          <div className="flex items-center gap-4">
            {/* Logo mark */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--admin-surface-hover)', border: '1px solid var(--admin-border-strong)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="12" rx="1.5" fill="var(--admin-accent)" style={{ opacity: 0.8 }} />
                <circle cx="10.5" cy="7" r="3.5" fill="none" stroke="var(--admin-accent)" strokeWidth="1.5" style={{ opacity: 0.8 }} />
              </svg>
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: 'var(--admin-accent-subtle)' }}>
                Cogniiq Command Center
              </p>
              <h1 className="text-sm font-bold tracking-tight leading-tight" style={{ color: 'var(--admin-text-primary)' }}>
                Today's Operating System
              </h1>
            </div>
          </div>

          {/* Center: live counters */}
          <div className="hidden md:flex items-center gap-3">
            <StatPill label="OPEN" value={todayCount} colorKey="accent" />
            {overdueCount > 0 && <StatPill label="OVERDUE" value={overdueCount} colorKey="warning" pulse />}
          </div>

          {/* Right: clock, online, theme toggle */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: 'var(--admin-success)' }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: 'var(--admin-success)' }} />
                </span>
                <span className="text-[9px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--admin-success)' }}>System Online</span>
              </div>
              <div className="font-mono text-lg font-semibold tabular-nums leading-none" style={{ color: 'var(--admin-text-secondary)' }}>
                {hh}<span className="animate-pulse" style={{ color: 'var(--admin-accent)' }}>:</span>{mm}<span className="animate-pulse" style={{ color: 'var(--admin-accent)' }}>:</span>{ss}
              </div>
              <p className="text-[9px] tracking-wide" style={{ color: 'var(--admin-text-muted)' }}>{dateStr}</p>
            </div>
            {onThemeToggle && <AdminThemeToggle theme={theme} onToggle={onThemeToggle} />}
          </div>
        </div>

        {/* Tab nav */}
        <nav className="flex gap-0 overflow-x-auto no-scrollbar">
          {TABS.map((tab) =>
            tab.href ? (
              <a
                key={tab.key}
                href={tab.href}
                className="relative px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors duration-200 whitespace-nowrap"
                style={{ color: activeTab === tab.key ? 'var(--admin-accent)' : 'var(--admin-text-muted)' }}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div layoutId="admin-tab-line" className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, var(--admin-accent), transparent)' }} transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
                )}
              </a>
            ) : (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className="relative px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors duration-200 whitespace-nowrap"
                style={{ color: activeTab === tab.key ? 'var(--admin-accent)' : 'var(--admin-text-muted)' }}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div layoutId="admin-tab-line" className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, var(--admin-accent), transparent)' }} transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
                )}
              </button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

function StatPill({ label, value, colorKey, pulse }: { label: string; value: number; colorKey: 'accent' | 'warning'; pulse?: boolean }) {
  const color = colorKey === 'accent' ? 'var(--admin-accent)' : 'var(--admin-warning)';
  const bgColor = colorKey === 'accent' ? 'var(--admin-surface-hover)' : 'var(--admin-warning-bg)';
  const borderColor = colorKey === 'accent' ? 'var(--admin-border-strong)' : 'var(--admin-warning-border)';

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
      {pulse && <span className="relative flex h-1.5 w-1.5 flex-shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} /><span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: color }} /></span>}
      <span className="text-[10px] font-bold tracking-[0.14em] uppercase font-mono" style={{ color }}>{label}</span>
      <span className="text-[13px] font-bold font-mono tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}
