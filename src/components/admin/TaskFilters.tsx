import type { FilterOption } from './types';

const FILTERS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' },
  { key: 'sales', label: 'Sales' },
  { key: 'follow_up', label: 'Follow-up' },
  { key: 'client_issue', label: 'Client' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'finance', label: 'Finance' },
  { key: 'outreach', label: 'Outreach' },
  { key: 'admin', label: 'Admin' },
];

interface Props {
  active: FilterOption;
  search: string;
  onChange: (f: FilterOption) => void;
  onSearch: (s: string) => void;
}

export function TaskFilters({ active, search, onChange, onSearch }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
      {/* Search */}
      <div className="relative flex-shrink-0">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="11" height="11" fill="none" stroke="var(--admin-text-muted)" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-8 pr-3 py-2 rounded-xl text-xs font-mono outline-none transition-all duration-200 w-full sm:w-48"
          style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-input-border)', color: 'var(--admin-input-text)' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border-focus)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-input-border)'; }}
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold tracking-[0.1em] uppercase font-mono transition-all duration-150 whitespace-nowrap"
            style={active === f.key
              ? { background: 'var(--admin-button-primary-bg)', color: 'var(--admin-accent)', border: '1px solid var(--admin-button-primary-border)' }
              : { background: 'var(--admin-surface)', color: 'var(--admin-text-muted)', border: '1px solid var(--admin-border)' }
            }
            onMouseEnter={(e) => { if (active !== f.key) (e.currentTarget as HTMLElement).style.color = 'var(--admin-text-secondary)'; }}
            onMouseLeave={(e) => { if (active !== f.key) (e.currentTarget as HTMLElement).style.color = 'var(--admin-text-muted)'; }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
