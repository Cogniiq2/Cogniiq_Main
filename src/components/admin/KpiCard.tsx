import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  accentColor?: string;
  delay?: number;
}

export function KpiCard({ label, value, description, icon, accentColor = '#2e6f8f', delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-sm p-5 hover:border-white/[0.12] hover:bg-white/[0.06] transition-all duration-300 cursor-default"
    >
      {/* Ambient glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${accentColor}18 0%, transparent 70%)`,
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/30 mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {value}
          </p>
          <p className="mt-2 text-[11px] text-white/30 leading-relaxed">{description}</p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {icon}
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-5 right-5 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
        }}
      />
    </motion.div>
  );
}
