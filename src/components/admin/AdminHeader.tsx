import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LABELS: Record<string, string> = {
  overview: 'Overview',
  today: 'Today',
  overdue: 'Overdue',
  completed: 'Completed',
  revenue: 'Revenue Focus',
};

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminHeader({ activeTab, onTabChange }: Props) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = time.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const timeStr = time.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const tabs = ['overview', 'today', 'overdue', 'completed', 'revenue'];

  return (
    <header className="relative z-10 border-b border-white/[0.06] bg-black/20 backdrop-blur-xl">
      {/* Top bar */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Identity */}
        <div>
          <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#3d9fbe]/60 mb-1.5">
            Cogniiq Command Center
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none">
            Today's Operating System
          </h1>
          <p className="mt-1.5 text-sm text-white/30 max-w-md leading-relaxed">
            Real-time execution cockpit for revenue, delivery, and client protection.
          </p>
        </div>

        {/* Right: Clock + status */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          {/* System online */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-emerald-400/80">
              System Online
            </span>
          </div>
          {/* Date */}
          <p className="text-xs text-white/30 tracking-wide">{dateStr}</p>
          {/* Clock */}
          <p className="text-xl font-mono font-semibold text-white/70 tabular-nums tracking-widest">
            {timeStr}
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        <nav className="flex gap-1 overflow-x-auto pb-0 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`relative px-4 py-3 text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-200 whitespace-nowrap ${
                activeTab === tab ? 'text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {LABELS[tab]}
              {activeTab === tab && (
                <motion.div
                  layoutId="admin-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, #1a4a62 0%, #2e6f8f 50%, #3d9fbe 100%)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
