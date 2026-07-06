import type { Task } from './types';
import { formatMoney, formatTime } from './types';

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  completing?: boolean;
  muted?: boolean;
  overdue?: boolean;
}

export function TaskCard({ task, onComplete, completing = false, muted = false, overdue = false }: Props) {
  const borderColor = muted
    ? 'var(--admin-border)'
    : overdue
      ? 'var(--admin-warning-border)'
      : 'var(--admin-border)';

  const bgColor = muted
    ? 'var(--admin-surface)'
    : overdue
      ? 'var(--admin-warning-bg)'
      : 'var(--admin-surface-elevated)';

  const priorityDotMap: Record<string, string> = {
    critical: 'var(--admin-priority-critical-text)',
    high: 'var(--admin-priority-high-text)',
    medium: 'var(--admin-priority-medium-text)',
    low: 'var(--admin-priority-low-text)',
  };
  const priorityColor = priorityDotMap[task.priority] || 'var(--admin-text-muted)';

  return (
    <div
      className="group relative rounded-xl overflow-hidden transition-all duration-300"
      style={{ border: `1px solid ${borderColor}`, background: bgColor }}
    >
      {/* Left priority bar */}
      {!muted && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: priorityColor, opacity: overdue ? 0.5 : 0.65 }} />
      )}

      <div className={`${!muted ? 'pl-4' : ''} p-4`}>
        {/* Top row: badges + time */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {/* Priority */}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-[0.1em] uppercase font-mono" style={{ background: `var(--admin-priority-${task.priority}-bg)`, color: `var(--admin-priority-${task.priority}-text)` }}>
            <span className="w-1 h-1 rounded-full" style={{ background: `var(--admin-priority-${task.priority}-text)`, boxShadow: `0 0 3px var(--admin-priority-${task.priority}-text)` }} />
            {task.priority}
          </span>
          {/* Category */}
          {task.category && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium tracking-wide" style={{ background: 'var(--admin-surface-hover)', color: 'var(--admin-text-secondary)' }}>
              {task.category.replace(/_/g, ' ')}
            </span>
          )}
          {/* Overdue tag */}
          {overdue && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono tracking-wide" style={{ background: 'var(--admin-warning-bg)', color: 'var(--admin-warning)' }}>
              overdue
            </span>
          )}
          {/* Time */}
          {task.due_time && !muted && (
            <span className="ml-auto text-[9px] font-mono" style={{ color: 'var(--admin-text-muted)' }}>
              {task.due_time.slice(0, 5)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`text-sm font-semibold leading-snug mb-1.5 ${muted ? 'line-through' : ''}`} style={{ color: muted ? 'var(--admin-text-muted)' : 'var(--admin-text-primary)' }}>
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-xs leading-relaxed mb-2.5 line-clamp-2" style={{ color: 'var(--admin-text-muted)' }}>
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
          {task.money_impact != null && task.money_impact > 0 && (
            <span className="text-[11px] font-bold font-mono" style={{ color: 'var(--admin-success)' }}>
              {formatMoney(task.money_impact)}
            </span>
          )}
          {task.reason && (
            <span className="text-[10px] italic truncate max-w-xs" style={{ color: 'var(--admin-text-muted)' }}>
              "{task.reason}"
            </span>
          )}
          {task.source && (
            <span className="ml-auto text-[9px] font-mono" style={{ color: 'var(--admin-text-faint)' }}>
              {task.source}
            </span>
          )}
        </div>

        {/* Footer */}
        {muted ? (
          <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: 'var(--admin-success)' }}>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
            Completed {formatTime(task.completed_at)}
          </div>
        ) : (
          <button
            onClick={() => onComplete(task.id)}
            disabled={completing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-[0.08em] uppercase font-mono transition-all duration-200"
            style={completing
              ? { background: 'var(--admin-surface)', color: 'var(--admin-text-muted)', cursor: 'not-allowed', border: '1px solid var(--admin-border)' }
              : { background: 'var(--admin-success-bg)', color: 'var(--admin-success)', border: '1px solid var(--admin-success-border)' }
            }
            onMouseEnter={(e) => { if (!completing) { const el = e.currentTarget; el.style.background = 'var(--admin-surface-hover)'; } }}
            onMouseLeave={(e) => { if (!completing) { const el = e.currentTarget; el.style.background = 'var(--admin-success-bg)'; } }}
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
