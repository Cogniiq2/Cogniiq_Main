import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface PageRevealProps {
  children: ReactNode;
}

const REVEAL_KEY = "cogniiq_reveal_seen";

/**
 * Safe sessionStorage access.
 * In some private/incognito configurations (and stricter privacy settings),
 * touching sessionStorage throws a SecurityError. An uncaught throw here
 * crashes the entire React tree -> white page. Fail open: if storage is
 * unavailable, just skip the reveal.
 */
function safeGetSeen(): boolean {
  try {
    return sessionStorage.getItem(REVEAL_KEY) === "1";
  } catch {
    return true; // treat as "already seen" -> no reveal, page renders normally
  }
}

function safeSetSeen(): void {
  try {
    sessionStorage.setItem(REVEAL_KEY, "1");
  } catch {
    // storage unavailable -> nothing to persist, fail silently
  }
}

function shouldPlayReveal(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // Mobile / tablet: never play — cold-outreach traffic on 4G
    if (window.matchMedia("(max-width: 1023px)").matches) return false;

    // Respect users who disable animations
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return false;
    }
  } catch {
    return false; // any matchMedia weirdness -> fail open, show page
  }

  // Desktop: once per browser session
  if (safeGetSeen()) return false;

  return true;
}

export function PageReveal({ children }: PageRevealProps) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (shouldPlayReveal()) {
      safeSetSeen();
      setPlaying(true);
      const t = setTimeout(() => setPlaying(false), 1300);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <>
      {/*
        Children are ALWAYS mounted, always in the same tree position.
        The overlay is a sibling above them — never a wrapper.
        If anything at all goes wrong with the overlay, the page
        underneath is already rendered. Fail-open by construction.
      */}
      {children}

      {playing && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "white",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/*
            Brand mark shown during the fade so the reveal is an actual
            branded moment, not a blank white pause. Gold "IQ" monogram,
            subtle scale-in. Both opacity and transform are GPU-composited.
          */}
          <motion.svg
            width="140"
            height="140"
            viewBox="0 0 240 200"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* "I" */}
            <rect x="48" y="20" width="36" height="160" rx="6" fill="#B08D4A" />
            {/* "Q" ring */}
            <circle
              cx="150"
              cy="100"
              r="62"
              fill="none"
              stroke="#B08D4A"
              strokeWidth="18"
            />
            {/* Q tail */}
            <rect
              x="178"
              y="138"
              width="44"
              height="16"
              rx="6"
              fill="#B08D4A"
              transform="rotate(45 196 146)"
            />
          </motion.svg>
        </motion.div>
      )}
    </>
  );
}