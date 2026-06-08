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
  const accentColor = isCritical ? '#ff4444' : task.priority === 'high' ? '#ff8c00' : '#00d4ff';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(4,12,28,0.98) 0%, rgba(6,16,32,0.98) 100%)',
        border: `1px solid ${accentColor}20`,
        boxShadow: `0 0 40px ${accentColor}06, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Animated corner accent */}
      <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none" style={{ background: `radial-gradient(circle at 0% 0%, ${accentColor}10 0%, transparent 65%)` }} />
      <div className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none" style={{ background: `radial-gradient(circle at 100% 100%, ${accentColor}06 0%, transparent 65%)` }} />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, ${accentColor}30, transparent)` }} />

      {/* Critical pulse ring */}
      {isCritical && (
        <motion.div className="absolute top-5 right-5 w-2 h-2 rounded-full" style={{ background: accentColor }}
          animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative p-6 sm:p-8">
        {/* Label */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: `${accentColor}0d`, border: `1px solid ${accentColor}20` }}>
            <svg width="10" height="10" fill="none" stroke={accentColor} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase font-mono" style={{ color: accentColor }}>Next Best Action</span>
          </div>
          {isCritical && (
            <span className="text-[9px] font-bold tracking-[0.18em] uppercase font-mono animate-pulse" style={{ color: '#ff4444' }}>● CRITICAL</span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight mb-3 max-w-2xl">
          {task.title}
        </h2>

        {task.description && (
          <p className="text-sm leading-relaxed mb-5 max-w-xl" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {task.description}
          </p>
        )}

        {/* Data chips */}
        <div className="flex flex-wrap gap-4 mb-5">
          {task.money_impact != null && task.money_impact > 0 && (
            <div className="flex items-center gap-2">
              <svg width="12" height="12" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" /></svg>
              <span className="text-base font-bold font-mono" style={{ color: '#10b981' }}>{formatMoney(task.money_impact)}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>revenue impact</span>
            </div>
          )}
          {task.due_time && (
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>Due {task.due_time.slice(0, 5)}</span>
            </div>
          )}
          {task.category && (
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.22)' }}>
              {task.category.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {task.reason && (
          <p className="text-[11px] italic mb-6 max-w-xl" style={{ color: 'rgba(255,255,255,0.2)' }}>
            "{task.reason}"
          </p>
        )}

        {/* CTA */}
        <button
          onClick={() => onComplete(task.id)}
          disabled={completing}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200"
          style={completing
            ? { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.06)' }
            : { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', boxShadow: '0 0 20px rgba(16,185,129,0.05)' }
          }
          onMouseEnter={(e) => { if (!completing) { const el = e.currentTarget; el.style.background = 'rgba(16,185,129,0.18)'; el.style.boxShadow = '0 0 30px rgba(16,185,129,0.12)'; } }}
          onMouseLeave={(e) => { if (!completing) { const el = e.currentTarget; el.style.background = 'rgba(16,185,129,0.1)'; el.style.boxShadow = '0 0 20px rgba(16,185,129,0.05)'; } }}
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
