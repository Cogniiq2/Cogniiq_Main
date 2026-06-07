import type { FilterOption } from './types';

const FILTERS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High Priority' },
  { key: 'sales', label: 'Sales' },
  { key: 'follow_up', label: 'Follow-up' },
  { key: 'client_issue', label: 'Client Issues' },
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
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-8 pr-4 py-2 rounded-xl text-xs text-white/60 placeholder-white/20 bg-white/[0.04] border border-white/[0.07] focus:outline-none focus:border-[#2e6f8f]/40 focus:bg-white/[0.06] transition-all duration-200 w-full sm:w-52"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200 whitespace-nowrap ${
              active === f.key
                ? 'bg-[#2e6f8f]/20 text-[#7dd3e8] border border-[#2e6f8f]/30'
                : 'bg-white/[0.03] text-white/30 border border-white/[0.05] hover:bg-white/[0.06] hover:text-white/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
