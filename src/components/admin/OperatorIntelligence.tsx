import { motion } from 'framer-motion';
import type { Task } from './types';
import { formatMoney } from './types';

interface Props {
  todayOpen: Task[];
  overdueOpen: Task[];
  dbStatus: 'ok' | 'error';
  dbError?: string;
}

export function OperatorIntelligence({ todayOpen, overdueOpen, dbStatus, dbError }: Props) {
  const criticalCount = todayOpen.filter((t) => t.priority === 'critical').length;
  const score = Math.max(0, 100 - overdueOpen.length * 15 - criticalCount * 5);
  const totalRevenue = [...todayOpen, ...overdueOpen].reduce((s, t) => s + (t.money_impact ?? 0), 0);
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 26;
  const dashOffset = circumference * (1 - score / 100);

  const automations = [
    { label: 'Claude Planner', status: 'Ready', color: '#f59e0b' },
    { label: 'Supabase Sync', status: dbStatus === 'ok' ? 'Connected' : 'Error', color: dbStatus === 'ok' ? '#10b981' : '#ef4444' },
    { label: 'Admin UI', status: 'Live', color: '#10b981' },
  ];

  return (
    <div className="space-y-3">
      {/* Panel title */}
      <p className="text-[9px] font-bold tracking-[0.24em] uppercase font-mono mb-3" style={{ color: 'rgba(0,212,255,0.4)' }}>
        Operator Intelligence
      </p>

      {/* Focus Score */}
      <Panel accent="#00d4ff" delay={0.08}>
        <p className="text-[9px] font-bold tracking-[0.18em] uppercase font-mono mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Focus Score</p>
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
              <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle cx="28" cy="28" r="26" fill="none" stroke={scoreColor} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.6s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-base font-bold font-mono tabular-nums" style={{ color: scoreColor }}>
              {score}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/70 leading-snug">
              {score >= 80 ? 'Execution Clean' : score >= 50 ? 'Needs Attention' : 'Under Pressure'}
            </p>
            <p className="text-[10px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {overdueOpen.length > 0 ? `${overdueOpen.length} overdue` : ''}
              {overdueOpen.length > 0 && criticalCount > 0 ? ' · ' : ''}
              {criticalCount > 0 ? `${criticalCount} critical` : ''}
              {overdueOpen.length === 0 && criticalCount === 0 ? 'No blockers.' : ''}
            </p>
          </div>
        </div>
      </Panel>

      {/* Revenue Pressure */}
      <Panel accent="#10b981" delay={0.14}>
        <p className="text-[9px] font-bold tracking-[0.18em] uppercase font-mono mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Revenue Pressure</p>
        <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: '#10b981' }}>
          {formatMoney(totalRevenue)}
        </p>
        <p className="text-[10px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>potential execution value</p>
      </Panel>

      {/* Execution Rule */}
      <Panel accent="rgba(0,212,255,0.3)" delay={0.2}>
        <p className="text-[9px] font-bold tracking-[0.18em] uppercase font-mono mb-2" style={{ color: 'rgba(0,212,255,0.4)' }}>Execution Rule</p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Do not open random tools before completing the next best action.
        </p>
      </Panel>

      {/* Automation Status */}
      <Panel accent="rgba(255,255,255,0.1)" delay={0.26}>
        <p className="text-[9px] font-bold tracking-[0.18em] uppercase font-mono mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Automation Status</p>
        <div className="space-y-2.5">
          {automations.map((a) => (
            <div key={a.label} className="flex items-center justify-between">
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{a.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.color, boxShadow: `0 0 4px ${a.color}` }} />
                <span className="text-[10px] font-bold font-mono" style={{ color: a.color }}>{a.status}</span>
              </div>
            </div>
          ))}
        </div>
        {dbStatus === 'error' && dbError && (
          <p className="mt-3 text-[9px] font-mono leading-relaxed" style={{ color: 'rgba(239,68,68,0.5)' }}>{dbError}</p>
        )}
      </Panel>
    </div>
  );
}

function Panel({ children, accent, delay }: { children: React.ReactNode; accent: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl p-4 relative overflow-hidden"
      style={{ background: 'rgba(8,18,32,0.9)', border: `1px solid rgba(255,255,255,0.05)` }}
    >
      <div className="absolute top-0 left-3 right-3 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }} />
      {children}
    </motion.div>
  );
}
