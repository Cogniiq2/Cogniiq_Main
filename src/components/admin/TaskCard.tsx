import type { Task } from './types';
import { formatMoney, formatTime } from './types';
import { CircleCheck as CheckCircle, Clock, Tag, TriangleAlert as AlertTriangle, Zap, Circle } from 'lucide-react';

const PRIORITY_CONFIG: Record<string, {
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  glowColor: string;
}> = {
  critical: {
    label: 'Critical',
    dotColor: '#f87171',
    badgeBg: 'rgba(248,113,113,0.12)',
    badgeText: '#fca5a5',
    borderColor: 'rgba(248,113,113,0.2)',
    glowColor: 'rgba(248,113,113,0.06)',
  },
  high: {
    label: 'High',
    dotColor: '#fb923c',
    badgeBg: 'rgba(251,146,60,0.12)',
    badgeText: '#fdba74',
    borderColor: 'rgba(251,146,60,0.18)',
    glowColor: 'rgba(251,146,60,0.05)',
  },
  medium: {
    label: 'Medium',
    dotColor: '#3d9fbe',
    badgeBg: 'rgba(61,159,190,0.1)',
    badgeText: '#7dd3e8',
    borderColor: 'rgba(61,159,190,0.15)',
    glowColor: 'rgba(61,159,190,0.04)',
  },
  low: {
    label: 'Low',
    dotColor: '#6b7280',
    badgeBg: 'rgba(107,114,128,0.1)',
    badgeText: '#9ca3af',
    borderColor: 'rgba(107,114,128,0.12)',
    glowColor: 'transparent',
  },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  sales: { bg: 'rgba(34,197,94,0.1)', text: '#86efac' },
  follow_up: { bg: 'rgba(99,102,241,0.1)', text: '#a5b4fc' },
  client_issue: { bg: 'rgba(248,113,113,0.1)', text: '#fca5a5' },
  delivery: { bg: 'rgba(251,191,36,0.1)', text: '#fde68a' },
  finance: { bg: 'rgba(52,211,153,0.1)', text: '#6ee7b7' },
  outreach: { bg: 'rgba(56,189,248,0.1)', text: '#7dd3fc' },
  admin: { bg: 'rgba(156,163,175,0.1)', text: '#d1d5db' },
};

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  completing?: boolean;
  muted?: boolean;
}

export function TaskCard({ task, onComplete, completing = false, muted = false }: Props) {
  const pCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.low;
  const catCfg = task.category
    ? (CATEGORY_COLORS[task.category] ?? { bg: 'rgba(255,255,255,0.06)', text: '#9ca3af' })
    : { bg: 'rgba(255,255,255,0.06)', text: '#9ca3af' };

  return (
    <div
      className={`group relative rounded-2xl border backdrop-blur-sm p-5 transition-all duration-300 ${
        muted
          ? 'bg-white/[0.02] border-white/[0.04]'
          : 'bg-white/[0.035] hover:bg-white/[0.055] hover:shadow-lg'
      }`}
      style={{
        borderColor: muted ? undefined : pCfg.borderColor,
        boxShadow: muted ? undefined : `0 0 0 0 ${pCfg.glowColor}`,
      }}
    >
      {/* Left priority stripe */}
      {!muted && (
        <div
          className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
          style={{ background: pCfg.dotColor, opacity: 0.6 }}
        />
      )}

      <div className={`${!muted ? 'pl-3' : ''}`}>
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Priority badge */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
            style={{ background: pCfg.badgeBg, color: pCfg.badgeText }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: pCfg.dotColor }}
            />
            {pCfg.label}
          </span>
          {/* Category badge */}
          {task.category && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide"
              style={{ background: catCfg.bg, color: catCfg.text }}
            >
              <Tag size={9} />
              {task.category.replace('_', ' ')}
            </span>
          )}
          {/* Due time */}
          {task.due_time && (
            <span className="inline-flex items-center gap-1 text-[10px] text-white/30 ml-auto">
              <Clock size={10} />
              {task.due_time.slice(0, 5)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`text-sm font-semibold leading-snug mb-1 ${muted ? 'text-white/40 line-through' : 'text-white/90'}`}>
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-white/30 leading-relaxed mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
          {task.money_impact != null && task.money_impact > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <Zap size={10} />
              {formatMoney(task.money_impact)}
            </span>
          )}
          {task.reason && (
            <span className="text-[11px] text-white/25 italic line-clamp-1 max-w-xs">
              "{task.reason}"
            </span>
          )}
          {task.source && (
            <span className="text-[10px] text-white/20 ml-auto">src: {task.source}</span>
          )}
        </div>

        {/* Footer: completed_at or complete button */}
        {muted ? (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/60">
            <CheckCircle size={12} />
            Completed at {formatTime(task.completed_at)}
          </div>
        ) : (
          <button
            onClick={() => onComplete(task.id)}
            disabled={completing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
              completing
                ? 'bg-white/[0.04] text-white/20 cursor-not-allowed'
                : 'bg-white/[0.06] text-white/50 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/20 border border-white/[0.06]'
            }`}
          >
            {completing ? (
              <>
                <Circle size={11} className="animate-spin opacity-50" />
                Completing…
              </>
            ) : (
              <>
                <CheckCircle size={11} />
                Complete
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
