import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface PageRevealProps {
  children: ReactNode;
}

function Counter({ onComplete }: { onComplete: () => void }) {
  const [display, setDisplay] = useState(0);
  const count = useMotionValue(0);

  useEffect(() => {
    const controls = animate(count, 100, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
      onComplete,
    });
    return () => controls.stop();
  }, []);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif",
        fontSize: "clamp(72px, 14vw, 160px)",
        fontWeight: 200,
        letterSpacing: "-0.04em",
        color: "#ffffff",
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        userSelect: "none",
      }}
    >
      {display}
    </motion.span>
  );
}

export function PageReveal({ children }: PageRevealProps) {
  const [phase, setPhase] = useState<"count" | "line" | "wipe" | "done">("count");

  useEffect(() => {
    if (phase === "line") {
      const t = setTimeout(() => setPhase("wipe"), 400);
      return () => clearTimeout(t);
    }
    if (phase === "wipe") {
      const t = setTimeout(() => setPhase("done"), 900);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === "done") return <>{children}</>;

  return (
    <>
      <AnimatePresence>
        {phase !== "done" && (
          <motion.div
            key="loader"
            exit={{ opacity: 1 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999999,
              background: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <AnimatePresence mode="wait">
              {phase === "count" && (
                <motion.div
                  key="counter"
                  exit={{ opacity: 0, y: -12, transition: { duration: 0.25, ease: "easeIn" } }}
                  style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}
                >
                  <Counter onComplete={() => setPhase("line")} />

                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    style={{
                      height: "1px",
                      width: "clamp(60px, 12vw, 140px)",
                      background: "rgba(255,255,255,0.25)",
                      transformOrigin: "left center",
                      marginTop: "clamp(12px, 2vw, 20px)",
                    }}
                  />
                </motion.div>
              )}

              {phase === "line" && (
                <motion.div
                  key="line-expand"
                  initial={{ scaleX: 1, opacity: 1 }}
                  animate={{ scaleX: 80, opacity: 1 }}
                  transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
                  style={{
                    height: "1px",
                    width: "clamp(60px, 12vw, 140px)",
                    background: "rgba(255,255,255,0.6)",
                    transformOrigin: "center center",
                  }}
                />
              )}
            </AnimatePresence>

            {phase === "wipe" && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#000000",
                  transformOrigin: "top center",
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "wipe" && (
          <motion.div
            key="wipe-reveal"
            initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999998,
              pointerEvents: "none",
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "wipe" ? null : <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>{children}</div>}
    </>
  );
}
