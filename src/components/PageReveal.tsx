import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface PageRevealProps {
  children: ReactNode;
}

export function PageReveal({ children }: PageRevealProps) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1700);
    return () => clearTimeout(t);
  }, []);

  if (done) return <>{children}</>;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        zIndex: 9999,
        background: "#0A0A0A",
      }}
    >
      {/* Proper scalable IQ mask */}
      <svg width="0" height="0">
        <defs>
          <clipPath id="iq-mask" clipPathUnits="objectBoundingBox">
            {/* Normalized shapes 0–1 */}
            <rect x="0.58" y="0.15" width="0.06" height="0.70" />
            <circle cx="0.72" cy="0.50" r="0.22" />
            {/* Q Tail */}
            <rect
              x="0.78"
              y="0.63"
              width="0.10"
              height="0.18"
              transform="rotate(45 0.83 0.72)"
            />
          </clipPath>
        </defs>
      </svg>

      <motion.div
        initial={{ scale: 0.01 }}
        animate={{ scale: 20 }}
        transition={{
          duration: 1.6,
          ease: [0.19, 1, 0.22, 1],
        }}
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "center center",
          clipPath: "url(#iq-mask)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
