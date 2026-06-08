import type { Task } from './types';
import { formatMoney, formatTime } from './types';

/* ── Priority config ───────────────────────────────────────── */
const P: Record<string, { label: string; dot: string; bar: string; badge: string; text: string }> = {
  critical: { label: 'Critical', dot: '#ff4444', bar: '#ff4444', badge: 'rgba(255,68,68,0.1)', text: '#ff8080' },
  high:     { label: 'High',     dot: '#ff8c00', bar: '#ff8c00', badge: 'rgba(255,140,0,0.1)',  text: '#ffb347' },
  medium:   { label: 'Medium',   dot: '#00d4ff', bar: '#00d4ff', badge: 'rgba(0,212,255,0.08)', text: '#7dd3e8' },
  low:      { label: 'Low',      dot: '#4b5563', bar: '#4b5563', badge: 'rgba(75,85,99,0.1)',   text: '#9ca3af' },
};

const CAT: Record<string, { bg: string; color: string }> = {
  sales:        { bg: 'rgba(34,197,94,0.08)',   color: '#86efac' },
  follow_up:    { bg: 'rgba(139,92,246,0.08)',  color: '#c4b5fd' },
  client_issue: { bg: 'rgba(255,68,68,0.08)',   color: '#fca5a5' },
  delivery:     { bg: 'rgba(251,191,36,0.08)',  color: '#fde68a' },
  finance:      { bg: 'rgba(52,211,153,0.08)',  color: '#6ee7b7' },
  outreach:     { bg: 'rgba(56,189,248,0.08)',  color: '#7dd3fc' },
  admin:        { bg: 'rgba(156,163,175,0.08)', color: '#d1d5db' },
};

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  completing?: boolean;
  muted?: boolean;
  overdue?: boolean;
}

export function TaskCard({ task, onComplete, completing = false, muted = false, overdue = false }: Props) {
  const p = P[task.priority] ?? P.low;
  const cat = task.category ? (CAT[task.category] ?? { bg: 'rgba(255,255,255,0.05)', color: '#9ca3af' }) : null;

  const borderColor = muted
    ? 'rgba(255,255,255,0.04)'
    : overdue
      ? 'rgba(245,158,11,0.14)'
      : `${p.dot}18`;

  const bgColor = muted
    ? 'rgba(255,255,255,0.01)'
    : overdue
      ? 'rgba(245,158,11,0.02)'
      : 'rgba(8,18,32,0.7)';

  return (
    <div
      className="group relative rounded-xl overflow-hidden transition-all duration-300"
      style={{ border: `1px solid ${borderColor}`, background: bgColor }}
    >
      {/* Left priority bar */}
      {!muted && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: p.bar, opacity: overdue ? 0.5 : 0.65 }} />
      )}

      <div className={`${!muted ? 'pl-4' : ''} p-4`}>
        {/* Top row: badges + time */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {/* Priority */}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-[0.1em] uppercase font-mono" style={{ background: p.badge, color: p.text }}>
            <span className="w-1 h-1 rounded-full" style={{ background: p.dot, boxShadow: `0 0 3px ${p.dot}` }} />
            {p.label}
          </span>
          {/* Category */}
          {cat && task.category && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium tracking-wide" style={{ background: cat.bg, color: cat.color }}>
              {task.category.replace(/_/g, ' ')}
            </span>
          )}
          {/* Overdue tag */}
          {overdue && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono tracking-wide" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
              ⚠ overdue
            </span>
          )}
          {/* Time */}
          {task.due_time && !muted && (
            <span className="ml-auto text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {task.due_time.slice(0, 5)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`text-sm font-semibold leading-snug mb-1.5 ${muted ? 'line-through' : ''}`} style={{ color: muted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.88)' }}>
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-xs leading-relaxed mb-2.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
          {task.money_impact != null && task.money_impact > 0 && (
            <span className="text-[11px] font-bold font-mono" style={{ color: '#10b981' }}>
              {formatMoney(task.money_impact)}
            </span>
          )}
          {task.reason && (
            <span className="text-[10px] italic truncate max-w-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>
              "{task.reason}"
            </span>
          )}
          {task.source && (
            <span className="ml-auto text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.14)' }}>
              {task.source}
            </span>
          )}
        </div>

        {/* Footer */}
        {muted ? (
          <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: 'rgba(16,185,129,0.5)' }}>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
            Completed {formatTime(task.completed_at)}
          </div>
        ) : (
          <button
            onClick={() => onComplete(task.id)}
            disabled={completing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-[0.08em] uppercase font-mono transition-all duration-200"
            style={completing
              ? { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.05)' }
              : { background: 'rgba(16,185,129,0.07)', color: 'rgba(16,185,129,0.7)', border: '1px solid rgba(16,185,129,0.15)' }
            }
            onMouseEnter={(e) => { if (!completing) { const el = e.currentTarget; el.style.background = 'rgba(16,185,129,0.14)'; el.style.color = '#10b981'; } }}
            onMouseLeave={(e) => { if (!completing) { const el = e.currentTarget; el.style.background = 'rgba(16,185,129,0.07)'; el.style.color = 'rgba(16,185,129,0.7)'; } }}
          >
            {completing ? (
              <><span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />Completing…</>
            ) : (
              <><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>Complete</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
