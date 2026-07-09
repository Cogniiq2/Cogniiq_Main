import { useEffect, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Calendar,
  CircleCheck as CheckCircle,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { AdminThemeToggle } from './AdminThemeToggle';
import type { AdminTheme } from '../../hooks/useAdminTheme';

interface Props {
  activeTab: string;
  onTabChange?: (tab: string) => void;
  todayCount: number;
  overdueCount: number;
  theme?: AdminTheme;
  onThemeToggle?: () => void;
  utilityAction?: ReactNode;
}

type AdminNavItem = {
  key: string;
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  tone: 'accent' | 'success' | 'warning' | 'info';
  localView?: boolean;
  count?: (props: Pick<Props, 'todayCount' | 'overdueCount'>) => number | null;
};

const ADMIN_NAV: AdminNavItem[] = [
  { key: 'overview', label: 'Overview', shortLabel: 'Core', href: '/admin', icon: LayoutDashboard, tone: 'accent', localView: true },
  { key: 'today', label: 'Today', shortLabel: 'Now', href: '/admin#today', icon: Calendar, tone: 'info', localView: true, count: ({ todayCount }) => todayCount },
  { key: 'overdue', label: 'Overdue', shortLabel: 'Risk', href: '/admin#overdue', icon: TriangleAlert, tone: 'warning', localView: true, count: ({ overdueCount }) => overdueCount || null },
  { key: 'completed', label: 'Completed', shortLabel: 'Done', href: '/admin#completed', icon: CheckCircle, tone: 'success', localView: true },
  { key: 'revenue', label: 'Revenue Focus', shortLabel: 'Value', href: '/admin#revenue', icon: BarChart3, tone: 'success', localView: true },
  { key: 'oura-analytics', label: 'Oura Analytics', shortLabel: 'Health', href: '/admin/#/oura-analytics', icon: HeartPulse, tone: 'info' },
  { key: 'execution', label: 'Execution OS', shortLabel: 'Execute', href: '/admin/execution', icon: Gauge, tone: 'accent' },
];

function colorForTone(tone: AdminNavItem['tone']): string {
  if (tone === 'success') return 'var(--admin-success)';
  if (tone === 'warning') return 'var(--admin-warning)';
  if (tone === 'info') return 'var(--admin-info)';
  return 'var(--admin-accent)';
}

function isOnAdminWorkspace() {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.replace(/\/$/, '') === '/admin' && !window.location.hash.startsWith('#/');
}

function setAdminHash(tabKey: string) {
  if (typeof window === 'undefined') return;
  const nextUrl = tabKey === 'overview' ? '/admin' : `/admin#${tabKey}`;
  window.history.replaceState(null, '', nextUrl);
}

export function AdminHeader({ activeTab, onTabChange, todayCount, overdueCount, theme = 'dark', onThemeToggle, utilityAction }: Props) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = time.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  const handleLocalViewClick = (event: MouseEvent<HTMLAnchorElement>, item: AdminNavItem) => {
    if (!item.localView || !isOnAdminWorkspace()) return;
    event.preventDefault();
    onTabChange?.(item.key);
    setAdminHash(item.key);
  };

  return (
    <header
      className="sticky top-0 z-30 border-b admin-header"
      style={{
        borderColor: 'var(--admin-header-border)',
        background: 'linear-gradient(180deg, color-mix(in srgb, var(--admin-header-bg) 96%, transparent), color-mix(in srgb, var(--admin-header-bg) 86%, transparent))',
        backdropFilter: 'blur(24px)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, var(--admin-header-scan) 28%, var(--admin-success) 50%, var(--admin-header-scan) 72%, transparent 100%)' }} />

      <div className="mx-auto max-w-[1760px] px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-3 xl:justify-start">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, var(--admin-surface-hover), var(--admin-surface))',
                  border: '1px solid var(--admin-border-strong)',
                  boxShadow: 'var(--accent-glow)',
                }}
              >
                <div className="absolute inset-1 rounded-xl" style={{ border: '1px solid color-mix(in srgb, var(--admin-accent) 22%, transparent)' }} />
                <Activity size={19} style={{ color: 'var(--admin-accent)' }} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black uppercase" style={{ color: 'var(--admin-accent-subtle)' }}>
                    Cogniiq Admin
                  </span>
                  <span className="hidden h-1 w-1 rounded-full sm:inline-flex" style={{ background: 'var(--admin-border-strong)' }} />
                  <span className="hidden text-[10px] font-mono sm:inline" style={{ color: 'var(--admin-text-muted)' }}>
                    {dateStr}
                  </span>
                </div>
                <h1 className="truncate text-base font-semibold sm:text-lg" style={{ color: 'var(--admin-text-primary)' }}>
                  Command Constellation
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 xl:hidden">
              {utilityAction}
              {onThemeToggle && <AdminThemeToggle theme={theme} onToggle={onThemeToggle} />}
            </div>
          </div>

          <nav
            aria-label="Admin sections"
            className="flex min-w-0 flex-1 gap-2 overflow-x-auto no-scrollbar rounded-[1.35rem] border p-1.5"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--admin-surface) 94%, transparent), color-mix(in srgb, var(--admin-surface-hover) 76%, transparent))',
              borderColor: 'var(--admin-border)',
              boxShadow: 'var(--admin-card-shadow, none)',
            }}
          >
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              const accent = colorForTone(item.tone);
              const count = item.count?.({ todayCount, overdueCount }) ?? null;

              return (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={(event) => handleLocalViewClick(event, item)}
                  className="group relative flex min-w-[128px] flex-1 items-center gap-2 overflow-hidden rounded-[1rem] px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 sm:min-w-[146px]"
                  style={{
                    color: active ? accent : 'var(--admin-text-muted)',
                    border: `1px solid ${active ? `color-mix(in srgb, ${accent} 34%, transparent)` : 'transparent'}`,
                    background: active ? `linear-gradient(135deg, color-mix(in srgb, ${accent} 13%, transparent), color-mix(in srgb, var(--admin-surface-hover) 84%, transparent))` : 'transparent',
                    boxShadow: active ? `0 16px 44px color-mix(in srgb, ${accent} 10%, transparent)` : 'none',
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="admin-section-lens"
                      className="absolute inset-x-3 bottom-0 h-px"
                      style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                      transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                    />
                  )}
                  <span
                    className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: active ? `color-mix(in srgb, ${accent} 14%, transparent)` : 'var(--admin-surface)',
                      border: `1px solid ${active ? `color-mix(in srgb, ${accent} 24%, transparent)` : 'var(--admin-border)'}`,
                    }}
                  >
                    <Icon size={15} />
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-black uppercase">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10px]" style={{ color: active ? accent : 'var(--admin-text-faint)' }}>
                      {item.shortLabel}
                    </span>
                  </span>
                  {count !== null && (
                    <span
                      className="relative flex h-6 min-w-6 flex-shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums"
                      style={{
                        background: `color-mix(in srgb, ${accent} 13%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${accent} 24%, transparent)`,
                        color: accent,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          <div className="hidden flex-shrink-0 items-center gap-3 xl:flex">
            {utilityAction}
            <div className="rounded-2xl border px-3 py-2 text-right" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
              <div className="flex items-center justify-end gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: 'var(--admin-success)' }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: 'var(--admin-success)' }} />
                </span>
                <span className="text-[9px] font-black uppercase" style={{ color: 'var(--admin-success)' }}>
                  Live
                </span>
              </div>
              <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums leading-none" style={{ color: 'var(--admin-text-secondary)' }}>
                {hh}<span style={{ color: 'var(--admin-accent)' }}>:</span>{mm}<span style={{ color: 'var(--admin-accent)' }}>:</span>{ss}
              </div>
            </div>
            {onThemeToggle && <AdminThemeToggle theme={theme} onToggle={onThemeToggle} />}
          </div>
        </div>
      </div>
    </header>
  );
}
