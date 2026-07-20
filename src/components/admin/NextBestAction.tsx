import { motion } from 'framer-motion';
import type { Task } from './types';
import { formatMoney } from './types';

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  completing?: boolean;
}

export function NextBestAction({ task, onComplete, completing = false }: Props) {
  const isCritical = task.priority === 'critical';
  const accentColorVar = isCritical ? 'var(--admin-danger)' : task.priority === 'high' ? 'var(--admin-warning)' : 'var(--admin-accent)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'var(--admin-surface-elevated)',
        border: '1px solid var(--admin-border-strong)',
        boxShadow: 'var(--admin-card-shadow)',
      }}
    >
      {/* Animated corner accent */}
      <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none" style={{ background: `radial-gradient(circle at 0% 0%, color-mix(in srgb, ${accentColorVar} 10%, transparent) 0%, transparent 65%)` }} />
      <div className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none" style={{ background: `radial-gradient(circle at 100% 100%, color-mix(in srgb, ${accentColorVar} 6%, transparent) 0%, transparent 65%)` }} />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--admin-header-scan) 50%, transparent)' }} />

      {/* Critical pulse ring */}
      {isCritical && (
        <motion.div className="absolute top-5 right-5 w-2 h-2 rounded-full" style={{ background: accentColorVar }}
          animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative p-6 sm:p-8">
        {/* Label */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'var(--admin-surface-hover)', border: '1px solid var(--admin-border-strong)' }}>
            <svg width="10" height="10" fill="none" stroke={accentColorVar} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase font-mono" style={{ color: accentColorVar }}>Next Best Action</span>
          </div>
          {isCritical && (
            <span className="text-[9px] font-bold tracking-[0.18em] uppercase font-mono animate-pulse" style={{ color: 'var(--admin-danger)' }}>● CRITICAL</span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight mb-3 max-w-2xl" style={{ color: 'var(--admin-text-primary)' }}>
          {task.title}
        </h2>

        {task.description && (
          <p className="text-sm leading-relaxed mb-5 max-w-xl" style={{ color: 'var(--admin-text-muted)' }}>
            {task.description}
          </p>
        )}

        {/* Data chips */}
        <div className="flex flex-wrap gap-4 mb-5">
          {task.money_impact != null && task.money_impact > 0 && (
            <div className="flex items-center gap-2">
              <svg width="12" height="12" fill="none" stroke="var(--admin-success)" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" /></svg>
              <span className="text-base font-bold font-mono" style={{ color: 'var(--admin-success)' }}>{formatMoney(task.money_impact)}</span>
              <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>revenue impact</span>
            </div>
          )}
          {task.due_time && (
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" fill="none" stroke="var(--admin-text-muted)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              <span className="text-xs font-mono" style={{ color: 'var(--admin-text-secondary)' }}>Due {task.due_time.slice(0, 5)}</span>
            </div>
          )}
          {task.category && (
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--admin-text-muted)' }}>
              {task.category.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {task.reason && (
          <p className="text-[11px] italic mb-6 max-w-xl" style={{ color: 'var(--admin-text-muted)' }}>
            "{task.reason}"
          </p>
        )}

        {/* CTA */}
        <button
          onClick={() => onComplete(task.id)}
          disabled={completing}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200"
          style={completing
            ? { background: 'var(--admin-surface)', color: 'var(--admin-text-muted)', cursor: 'not-allowed', border: '1px solid var(--admin-border)' }
            : { background: 'var(--admin-success-bg)', color: 'var(--admin-success)', border: '1px solid var(--admin-success-border)', boxShadow: '0 0 20px color-mix(in srgb, var(--admin-success) 10%, transparent)' }
          }
          onMouseEnter={(e) => { if (!completing) { const el = e.currentTarget; el.style.background = 'var(--admin-surface-hover)'; el.style.boxShadow = '0 0 30px color-mix(in srgb, var(--admin-success) 15%, transparent)'; } }}
          onMouseLeave={(e) => { if (!completing) { const el = e.currentTarget; el.style.background = 'var(--admin-success-bg)'; el.style.boxShadow = '0 0 20px color-mix(in srgb, var(--admin-success) 10%, transparent)'; } }}
        >
          {completing ? (
            <><span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />Completing…</>
          ) : (
            <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>Mark Complete</>
          )}
        </button>
      </div>
    </motion.div>
  );
}
