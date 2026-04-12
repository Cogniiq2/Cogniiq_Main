import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface PageRevealProps {
  children: ReactNode;
}

const LETTERS = ["c", "o", "g", "n", "i", "i", "q"];

function WordmarkTrace({ animPhase }: { animPhase: "stroke" | "fill" | "solid" }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "baseline",
        gap: 0,
        userSelect: "none",
      }}
    >
      {LETTERS.map((letter, i) => {
        const strokeDelay = i * 0.1;
        const fillDelay = LETTERS.length * 0.1 + 0.04 + i * 0.04;

        return (
          <div
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
            }}
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: strokeDelay, duration: 0.06 }}
              style={{
                fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
                fontSize: "clamp(18px, 2.8vw, 32px)",
                fontWeight: 100,
                letterSpacing: "0.18em",
                lineHeight: 1,
                color: "transparent",
                WebkitTextStroke: "0.4px rgba(0,0,0,0.8)",
                display: "block",
                position: "relative",
                zIndex: 1,
              }}
            >
              {letter}
            </motion.span>

            <motion.span
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={
                animPhase === "fill" || animPhase === "solid"
                  ? { clipPath: "inset(0 0% 0 0)" }
                  : { clipPath: "inset(0 100% 0 0)" }
              }
              transition={{
                delay: fillDelay,
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
                fontSize: "clamp(18px, 2.8vw, 32px)",
                fontWeight: 100,
                letterSpacing: "0.18em",
                lineHeight: 1,
                color: "#000000",
                WebkitTextStroke: "0px transparent",
                display: "block",
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 2,
              }}
            >
              {letter}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
}

function ProgressLine({
  active,
  onComplete,
}: {
  active: boolean;
  onComplete: () => void;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "1px",
        background: "rgba(0,0,0,0.08)",
        marginTop: "clamp(16px, 2.8vw, 28px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={active ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{
          duration: 1.05,
          ease: [0.4, 0, 0.2, 1],
          delay: 0.04,
        }}
        onAnimationComplete={active ? onComplete : undefined}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          transformOrigin: "left center",
        }}
      />
    </div>
  );
}

export function PageReveal({ children }: PageRevealProps) {
  const [phase, setPhase] = useState<
    "stroke" | "fill" | "progress" | "split" | "done"
  >("stroke");

  useEffect(() => {
    if (phase === "stroke") {
      const totalStrokeDuration = LETTERS.length * 0.1 + 0.06 + 0.1;
      const t = setTimeout(() => setPhase("fill"), totalStrokeDuration * 1000);
      return () => clearTimeout(t);
    }
    if (phase === "fill") {
      const totalFillDuration =
        LETTERS.length * 0.1 + 0.04 + LETTERS.length * 0.04 + 0.32;
      const t = setTimeout(() => setPhase("split"), totalFillDuration * 1000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleProgressComplete = () => {
    setTimeout(() => setPhase("split"), 80);
  };

  const handleSplitDone = () => {
    setPhase("done");
  };

  const loaderContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 clamp(24px, 5vw, 48px)",
        maxWidth: "clamp(280px, 55vw, 680px)",
        width: "100%",
      }}
    >
      <WordmarkTrace
        animPhase={
          phase === "stroke" ? "stroke" : phase === "fill" ? "fill" : "solid"
        }
      />
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {phase !== "done" && phase !== "split" && (
          <motion.div
            key="loader-bg"
            initial={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999999,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {loaderContent}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "split" && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999999,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "0 clamp(24px, 5vw, 48px)",
                maxWidth: "clamp(280px, 55vw, 680px)",
                width: "100%",
              }}
            >
              <WordmarkTrace animPhase="solid" />
            </div>
          </div>

          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-100%" }}
            transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
            onAnimationComplete={handleSplitDone}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "50%",
              height: "100%",
              background: "#ffffff",
              zIndex: 9999999,
            }}
          />
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "50%",
              height: "100%",
              background: "#ffffff",
              zIndex: 9999999,
            }}
          />
        </>
      )}

      <div
        style={{
          visibility:
            phase === "done" || phase === "split" ? "visible" : "hidden",
          position: phase === "done" ? "static" : "fixed",
          inset: 0,
          zIndex: phase === "done" ? "auto" : 0,
        }}
      >
        {children}
      </div>
    </>
  );
}
