import { motion } from 'framer-motion';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HeroText() {
  const line1 = 'CogniIQ';
  const line2 = 'The Future';
  const line3 = 'is here.';

  return (
    <div className="relative">
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: EASE_OUT }}
      >
        <motion.div
          className="h-px bg-gradient-to-r from-sky-700/40 to-transparent"
          initial={{ width: 0 }}
          animate={{ width: 40 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        />
        <span className="text-[11px] uppercase tracking-[0.3em] text-gray-400 font-medium">
          AI Solutions &amp; Webdesign
        </span>
      </motion.div>

      <h1 className="relative">
        <span className="block overflow-hidden">
          <motion.span
            className="block text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tighter leading-[0.9]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: EASE_OUT }}
          >
           <span className="inline-block bg-clip-text text-transparent bg-gradient-to-b from-gray-900 via-gray-800 to-gray-600">
  {line1}
</span>
          </motion.span>
        </span>

        <span className="block overflow-hidden mt-1">
          <motion.span
            className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight leading-[1.1] text-gray-400"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: EASE_OUT }}
          >
            {line2}
          </motion.span>
        </span>

        <span className="block overflow-hidden mt-0">
          <motion.span
            className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight leading-[1.1] text-gray-400"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 1.0, ease: EASE_OUT }}
          >
            {line3}
          </motion.span>
        </span>

        <motion.div
          className="absolute -left-4 top-2 bottom-2 w-[2px] rounded-full"
          style={{
            transformOrigin: 'top',
            background: 'linear-gradient(to bottom, rgba(2,132,199,0.4), rgba(14,165,233,0.1), transparent)',
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.4, ease: EASE_OUT }}
        />
      </h1>

      <motion.p
        className="mt-8 text-base sm:text-lg text-gray-500 font-light leading-relaxed max-w-md text-center lg:text-left"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.6, ease: EASE_OUT }}
      >
        AI-Systeme, Webdesign &amp; Automatisierung
        <br className="hidden sm:block" />
        {' '}für Unternehmen in Bayreuth, München und Regensburg.
      </motion.p>
    </div>
  );
}
