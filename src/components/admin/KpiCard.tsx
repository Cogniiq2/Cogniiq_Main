import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { formatMoney } from './types';

interface KpiStripProps {
  todayOpen: number;
  criticalHigh: number;
  overdueCount: number;
  moneyToday: number;
}

const CARDS = (p: KpiStripProps) => [
  {
    label: "Today's Queue",
    value: String(p.todayOpen),
    sub: 'open tasks due today',
    accent: '#00d4ff',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Critical / High',
    value: String(p.criticalHigh),
    sub: 'highest priority today',
    accent: p.criticalHigh > 0 ? '#ff4444' : '#10b981',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  {
    label: 'Overdue',
    value: String(p.overdueCount),
    sub: 'tasks past due date',
    accent: p.overdueCount > 0 ? '#f59e0b' : '#10b981',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    label: 'Money Impact',
    value: formatMoney(p.moneyToday),
    sub: 'revenue at stake today',
    accent: '#10b981',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
      </svg>
    ),
  },
];

export function KpiStrip(props: KpiStripProps) {
  const cards = CARDS(props);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <KpiCard key={card.label} {...card} delay={i * 0.06} />
      ))}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  accent: string;
  icon: ReactNode;
  delay?: number;
}

function KpiCard({ label, value, sub, accent, icon, delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl overflow-hidden cursor-default"
      style={{ background: 'rgba(8,18,32,0.9)', border: `1px solid ${accent}12`, boxShadow: `0 1px 0 rgba(255,255,255,0.03) inset` }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }} />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" style={{ background: `radial-gradient(ellipse 60% 60% at 50% 0%, ${accent}0d 0%, transparent 70%)` }} />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}10`, color: accent, border: `1px solid ${accent}18` }}>
            {icon}
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight leading-none mb-2 font-mono" style={{ color: accent }}>
          {value}
        </p>
        <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.22)' }}>{sub}</p>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${accent}30, transparent)` }} />
      </div>
    </motion.div>
  );
}
