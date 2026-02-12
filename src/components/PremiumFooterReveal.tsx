import { motion } from 'framer-motion';

interface PremiumFooterRevealProps {
  children: React.ReactNode;
}

export function PremiumFooterReveal({ children }: PremiumFooterRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      {children}
    </motion.div>
  );
}
