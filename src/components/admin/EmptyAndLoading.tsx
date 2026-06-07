export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-28 rounded-2xl bg-white/[0.03] border border-white/[0.05]"
          style={{ opacity: 1 - i * 0.2 }}
        />
      ))}
    </div>
  );
}

interface EmptyProps {
  message: string;
  sub?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ message, sub, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border border-white/[0.05] bg-white/[0.02]">
      <div className="w-10 h-10 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
        <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-white/30 mb-1">{message}</p>
      {sub && <p className="text-[11px] text-white/18 max-w-xs leading-relaxed">{sub}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2e6f8f]/15 text-[#7dd3e8] border border-[#2e6f8f]/20 hover:bg-[#2e6f8f]/25 transition-all duration-200"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
