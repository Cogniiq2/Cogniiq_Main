import { motion } from 'framer-motion';
import type { Task } from './types';
import { formatMoney, formatTime } from './types';
import { Zap, CircleCheck as CheckCircle, ArrowRight, Circle } from 'lucide-react';

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  completing?: boolean;
}

export function NextBestAction({ task, onComplete, completing = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[#2e6f8f]/25 bg-gradient-to-br from-[#0a1824] via-[#0d1f2d] to-[#071318] p-6 sm:p-8"
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 50% at 20% 0%, rgba(46,111,143,0.14) 0%, transparent 65%)',
        }}
      />
      {/* Corner mesh */}
      <div
        className="absolute top-0 right-0 w-56 h-56 pointer-events-none opacity-20"
        style={{
          background:
            'radial-gradient(circle at 80% 20%, rgba(61,159,190,0.2) 0%, transparent 55%)',
        }}
      />

      <div className="relative">
        {/* Label */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2e6f8f]/15 border border-[#2e6f8f]/20">
            <ArrowRight size={11} className="text-[#3d9fbe]" />
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#3d9fbe]">
              Next Best Action
            </span>
          </div>
          {task.priority === 'critical' && (
            <span className="text-[10px] font-semibold text-red-400/80 tracking-wide uppercase">
              Critical
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug mb-3 max-w-2xl">
          {task.title}
        </h2>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-white/40 leading-relaxed mb-4 max-w-xl">
            {task.description}
          </p>
        )}

        {/* Meta grid */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
          {task.money_impact != null && task.money_impact > 0 && (
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">
                {formatMoney(task.money_impact)}
              </span>
              <span className="text-xs text-white/25 ml-0.5">impact</span>
            </div>
          )}
          {task.due_time && (
            <div>
              <span className="text-xs text-white/30">Due at </span>
              <span className="text-xs font-semibold text-white/60">{task.due_time.slice(0, 5)}</span>
            </div>
          )}
          {task.category && (
            <div>
              <span className="text-xs font-medium text-white/30 uppercase tracking-widest">
                {task.category.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Reason */}
        {task.reason && (
          <p className="text-[11px] text-white/25 italic mb-6 max-w-xl">
            Why: "{task.reason}"
          </p>
        )}

        {/* CTA */}
        <button
          onClick={() => onComplete(task.id)}
          disabled={completing}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            completing
              ? 'bg-white/[0.04] text-white/20 cursor-not-allowed'
              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/25 hover:text-emerald-200 hover:border-emerald-500/35'
          }`}
        >
          {completing ? (
            <>
              <Circle size={14} className="animate-spin opacity-50" />
              Completing…
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              Mark Complete
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
