import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HeroCTA() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="mt-10 flex flex-col sm:flex-row items-center lg:items-start gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 2.0, ease: EASE_OUT }}
    >
      <motion.button
        onClick={() => navigate('/kontakt')}
        className="group relative px-8 py-4 rounded-full overflow-hidden cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 bg-gray-900 rounded-full transition-all duration-300 group-hover:bg-gray-800" />

        <motion.div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(135deg, rgba(2,132,199,0.15) 0%, transparent 50%)',
          }}
        />

        <div className="relative flex items-center gap-3">
          <span className="text-sm font-medium tracking-wide text-white">
            Erstberatung vereinbaren
          </span>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 3, ease: 'easeInOut' }}
          >
            <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
          </motion.div>
        </div>
      </motion.button>

      <motion.button
        onClick={() => navigate('/leistungen')}
        className="group relative px-8 py-4 rounded-full overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors duration-300"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-sm font-medium tracking-wide text-gray-600 group-hover:text-gray-900 transition-colors">
          Leistungen entdecken
        </span>
      </motion.button>
    </motion.div>
  );
}
