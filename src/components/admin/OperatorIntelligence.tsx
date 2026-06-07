import { motion } from 'framer-motion';
import type { Task } from './types';
import { formatMoney } from './types';
import { Activity, TrendingUp, Zap, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle } from 'lucide-react';

interface Props {
  todayOpen: Task[];
  overdueOpen: Task[];
  dbStatus: 'ok' | 'error';
  dbError?: string;
}

export function OperatorIntelligence({ todayOpen, overdueOpen, dbStatus, dbError }: Props) {
  // Focus score
  const criticalCount = todayOpen.filter((t) => t.priority === 'critical').length;
  const score = Math.max(0, 100 - overdueOpen.length * 15 - criticalCount * 5);

  // Revenue pressure
  const totalRevenuePressure = [
    ...todayOpen,
    ...overdueOpen,
  ].reduce((sum, t) => sum + (t.money_impact ?? 0), 0);

  const scoreColor =
    score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';

  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/25 mb-4">
        Operator Intelligence
      </p>

      {/* Focus Score */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5"
      >
        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/30 mb-4">
          Today's Focus Score
        </p>
        <div className="flex items-center gap-4">
          {/* Ring */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={scoreColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums"
              style={{ color: scoreColor }}
            >
              {score}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/70">
              {score >= 80 ? 'Execution Clean' : score >= 50 ? 'Needs Attention' : 'Under Pressure'}
            </p>
            <p className="text-[11px] text-white/25 mt-0.5 leading-relaxed">
              {overdueOpen.length > 0 && `${overdueOpen.length} overdue · `}
              {criticalCount > 0 && `${criticalCount} critical open`}
              {overdueOpen.length === 0 && criticalCount === 0 && 'No blockers detected.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Revenue Pressure */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={13} className="text-emerald-400/60" />
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/30">
            Revenue Pressure
          </p>
        </div>
        <p className="text-2xl font-bold text-emerald-400 tabular-nums mt-2">
          {formatMoney(totalRevenuePressure)}
        </p>
        <p className="text-[11px] text-white/25 mt-1">Potential execution value</p>
      </motion.div>

      {/* Execution Rule */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-[#2e6f8f]/12 bg-[#2e6f8f]/06 p-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap size={12} className="text-[#3d9fbe]/60" />
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#3d9fbe]/50">
            Execution Rule
          </p>
        </div>
        <p className="text-xs text-white/40 leading-relaxed">
          Do not open random tools before completing the next best action.
        </p>
      </motion.div>

      {/* Automation Status */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity size={12} className="text-white/25" />
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/25">
            Automation Status
          </p>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Claude Planner', status: 'Ready', color: '#fbbf24' },
            { label: 'Supabase Sync', status: dbStatus === 'ok' ? 'Connected' : 'Error', color: dbStatus === 'ok' ? '#34d399' : '#f87171' },
            { label: 'Admin UI', status: 'Live', color: '#34d399' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-[11px] text-white/30">{item.label}</span>
              <div className="flex items-center gap-1.5">
                {item.status === 'Error' ? (
                  <AlertTriangle size={10} style={{ color: item.color }} />
                ) : (
                  <CheckCircle2 size={10} style={{ color: item.color }} />
                )}
                <span className="text-[10px] font-semibold" style={{ color: item.color }}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        {dbStatus === 'error' && dbError && (
          <p className="mt-3 text-[10px] text-red-400/60 leading-relaxed">{dbError}</p>
        )}
      </motion.div>
    </div>
  );
}
