import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface PageRevealProps {
  children: ReactNode;
}

const REVEAL_KEY = "cogniiq_reveal_seen";

function shouldPlayReveal(): boolean {
  if (typeof window === "undefined") return false;

  // Mobile / tablet: never play — cold-outreach traffic on 4G, every ms counts
  if (window.matchMedia("(max-width: 1023px)").matches) return false;

  // Respect users who disable animations (accessibility + Lighthouse check)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  // Desktop: play once per browser session only
  if (sessionStorage.getItem(REVEAL_KEY)) return false;

  return true;
}

export function PageReveal({ children }: PageRevealProps) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (shouldPlayReveal()) {
      sessionStorage.setItem(REVEAL_KEY, "1");
      setPlaying(true);
      const t = setTimeout(() => setPlaying(false), 1700);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <>
      {/*
        Children are ALWAYS mounted in the same tree position.
        The overlay is a sibling on top, not a wrapper around the page.
        This removes the unmount/remount (double render) of the old version
        and lets FCP/LCP measure the real page immediately.
      */}
      {children}

      {playing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "white",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <clipPath id="iqmask" clipPathUnits="userSpaceOnUse">
                {/* "I" */}
                <rect x="48" y="20" width="36" height="160" rx="6" />
                {/* "Q" */}
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
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.19, 1, 0.22, 1] }}
            style={{
              position: "absolute",
              inset: 0,
              background: "white",
              clipPath: "url(#iqmask)",
            }}
          />
        </div>
      )}
    </>
  );
}