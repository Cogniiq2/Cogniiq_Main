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
        zIndex: 999999,
        background: "white", // match hero bg → avoids half-black screen
        overflow: "hidden",
      }}
    >
      <svg width="100vw" height="100vh" style={{ position: "absolute" }}>
        <defs>
          <clipPath id="iqmask" clipPathUnits="userSpaceOnUse">
            {/* --- EXACT IQ SHAPE IN PIXELS (clean, non-distorted) --- */}

            {/* “I” */}
            <rect x="48" y="20" width="36" height="160" rx="6" />

            {/* “Q” */}
            <circle cx="150" cy="100" r="70" />

            {/* Q tail */}
            <rect
              x="165"
              y="140"
              width="40"
              height="12"
              rx="4"
              transform="rotate(45 185 146)"
            />
          </clipPath>
        </defs>
      </svg>

      <motion.div
        initial={{
          scale: 0,              // completely hidden at start
        }}
        animate={{
          scale: 25,             // expands enough to reveal entire site
        }}
        transition={{
          duration: 1.6,
          ease: [0.19, 1, 0.22, 1],
        }}
        style={{
          position: "absolute",
          width: "100vw",
          height: "100vh",
          top: 0,
          left: 0,
          clipPath: "url(#iqmask)",      // IQ reveal
          transformOrigin: "85% 10%",     // EXACT position of IQ in navbar
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>{children}</div>
      </motion.div>
    </div>
  );
}
