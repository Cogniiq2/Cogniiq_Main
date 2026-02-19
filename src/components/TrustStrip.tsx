import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const ITEMS = [
  'Bayern',
  'KI-Systeme',
  'Automatisierung',
  'Webplattformen',
];

export function TrustStrip() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });

  return (
    <div ref={ref} className="w-full bg-white">
      <motion.div
        className="max-w-3xl mx-auto px-6"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div
          className="mx-auto"
          style={{ maxWidth: '720px' }}
        >
          <div
            className="w-full h-px bg-gray-200"
            style={{ marginBottom: '32px' }}
          />
        </div>

        <div
          className="flex flex-col items-center text-center"
          style={{ paddingBottom: '32px' }}
        >
          <p
            className="text-neutral-700"
            style={{
              fontSize: 'clamp(13px, 3.5vw, 15px)',
              fontWeight: 500,
              letterSpacing: '0.05em',
              lineHeight: 1.5,
            }}
          >
            {ITEMS.map((item, i) => (
              <span key={item} className="inline">
                {item}
                {i < ITEMS.length - 1 && (
                  <span
                    className="inline-block text-neutral-400 select-none"
                    style={{ margin: '0 10px', fontSize: '0.55em', verticalAlign: 'middle', lineHeight: 1 }}
                    aria-hidden="true"
                  >
                    ●
                  </span>
                )}
              </span>
            ))}
          </p>

          <p
            className="text-neutral-500"
            style={{
              fontSize: 'clamp(11px, 2.8vw, 12px)',
              fontWeight: 400,
              letterSpacing: '0.05em',
              marginTop: '9px',
            }}
          >
            Für Unternehmen in Deutschland entwickelt
          </p>
        </div>
      </motion.div>
    </div>
  );
}
