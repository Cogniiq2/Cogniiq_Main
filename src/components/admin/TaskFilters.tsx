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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="11" height="11" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-8 pr-3 py-2 rounded-xl text-xs font-mono placeholder-white/15 outline-none transition-all duration-200 w-full sm:w-48"
          style={{ background: 'rgba(8,18,32,0.9)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
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
              ? { background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)' }
              : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.28)', border: '1px solid rgba(255,255,255,0.05)' }
            }
            onMouseEnter={(e) => { if (active !== f.key) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; }}
            onMouseLeave={(e) => { if (active !== f.key) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.28)'; }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
