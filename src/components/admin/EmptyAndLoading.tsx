export function LoadingSkeleton() {
  return (
    <div className="space-y-2.5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl h-24"
          style={{ background: 'rgba(8,18,32,0.9)', border: '1px solid rgba(255,255,255,0.04)', opacity: 1 - i * 0.25 }}
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
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl" style={{ background: 'rgba(8,18,32,0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
        <svg width="16" height="16" fill="none" stroke="rgba(0,212,255,0.3)" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-sm font-semibold font-mono mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{message}</p>
      {sub && <p className="text-[10px] font-mono max-w-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.15)' }}>{sub}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wide transition-all duration-150"
          style={{ background: 'rgba(0,212,255,0.08)', color: 'rgba(0,212,255,0.7)', border: '1px solid rgba(0,212,255,0.15)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.15)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.08)'; }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
