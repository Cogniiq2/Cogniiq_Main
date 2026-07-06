import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { AdminTheme } from '../../hooks/useAdminTheme';

interface Props {
  theme: AdminTheme;
  onToggle: () => void;
}

export function AdminThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300"
      style={{
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {theme === 'dark' ? (
          <Moon size={14} style={{ color: 'var(--admin-accent)' }} />
        ) : (
          <Sun size={14} style={{ color: 'var(--admin-accent)' }} />
        )}
      </motion.div>
      <span
        className="text-[10px] font-bold tracking-[0.12em] uppercase"
        style={{ color: 'var(--admin-text-secondary)' }}
      >
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}
