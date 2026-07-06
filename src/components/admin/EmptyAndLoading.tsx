export function LoadingSkeleton() {
  return (
    <div className="space-y-2.5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl h-24"
          style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', opacity: 1 - i * 0.25 }}
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
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--admin-surface-hover)', border: '1px solid var(--admin-border-strong)' }}>
        <svg width="16" height="16" fill="none" stroke="var(--admin-accent-subtle)" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-sm font-semibold font-mono mb-1.5" style={{ color: 'var(--admin-text-muted)' }}>{message}</p>
      {sub && <p className="text-[10px] font-mono max-w-xs leading-relaxed mb-4" style={{ color: 'var(--admin-text-faint)' }}>{sub}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wide transition-all duration-150"
          style={{ background: 'var(--admin-button-primary-bg)', color: 'var(--admin-accent)', border: '1px solid var(--admin-button-primary-border)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--admin-button-primary-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--admin-button-primary-bg)'; }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
