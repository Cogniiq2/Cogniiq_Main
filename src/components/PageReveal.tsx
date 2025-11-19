import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageRevealProps {
  children: ReactNode;
}

export function PageReveal({ children }: PageRevealProps) {
  return (
    <>
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <defs>
          <clipPath id="iq-reveal-mask" clipPathUnits="objectBoundingBox">
            <rect x="0.325" y="0.2" width="0.125" height="0.6" rx="0.01" />
            <path
              d="M 0.65,0.25 A 0.2,0.2 0 1,1 0.65,0.65 A 0.2,0.2 0 1,1 0.65,0.25 Z M 0.65,0.325 A 0.125,0.125 0 1,0 0.65,0.575 A 0.125,0.125 0 1,0 0.65,0.325 Z"
              fillRule="evenodd"
            />
            <rect
              x="0.75"
              y="0.525"
              width="0.1"
              height="0.175"
              rx="0.01"
              transform="rotate(35 0.8 0.525)"
            />
          </clipPath>
        </defs>
      </svg>

      <motion.div
        initial={{
          clipPath: 'url(#iq-reveal-mask)',
          scale: 0.01,
        }}
        animate={{
          clipPath: 'url(#iq-reveal-mask)',
          scale: 80,
        }}
        transition={{
          duration: 1.6,
          ease: [0.19, 1, 0.22, 1],
        }}
        style={{
          transformOrigin: '50% 50%',
          willChange: 'transform, clip-path',
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
