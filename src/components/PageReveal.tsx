import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

interface PageRevealProps {
  children: ReactNode;
}

export function PageReveal({ children }: PageRevealProps) {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComplete(true);
    }, 1700);
    return () => clearTimeout(timer);
  }, []);

  if (isComplete) {
    return <>{children}</>;
  }

  return (
    <>
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <defs>
          <clipPath id="iq-reveal-mask">
            <rect x="40" y="20" width="15" height="60" />
            <circle cx="70" cy="50" r="20" />
            <circle cx="70" cy="50" r="12" fill="black" />
            <rect x="78" y="62" width="8" height="18" transform="rotate(45 82 71)" />
          </clipPath>
        </defs>
      </svg>

      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        <motion.div
          initial={{
            scale: 0.01,
          }}
          animate={{
            scale: 100,
          }}
          transition={{
            duration: 1.6,
            ease: [0.19, 1, 0.22, 1],
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '100vh',
            transformOrigin: 'center center',
            clipPath: 'url(#iq-reveal-mask)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(0.01)',
              width: '100vw',
              height: '100vh',
            }}
          >
            {children}
          </div>
        </motion.div>
      </div>
    </>
  );
}
