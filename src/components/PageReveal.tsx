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
        const strokeDelay = i * 0.11;
        const fillDelay = LETTERS.length * 0.11 + 0.05 + i * 0.045;

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
              transition={{ delay: strokeDelay, duration: 0.08 }}
              style={{
                fontFamily:
                  "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
                fontSize: "clamp(52px, 10vw, 112px)",
                fontWeight: 100,
                letterSpacing: "-0.025em",
                lineHeight: 1,
                color: "transparent",
                WebkitTextStroke: "1px rgba(255,255,255,0.9)",
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
                duration: 0.18,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                fontFamily:
                  "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
                fontSize: "clamp(52px, 10vw, 112px)",
                fontWeight: 100,
                letterSpacing: "-0.025em",
                lineHeight: 1,
                color: "#ffffff",
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
        background: "rgba(255,255,255,0.1)",
        marginTop: "clamp(14px, 2.5vw, 24px)",
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
          delay: 0.05,
        }}
        onAnimationComplete={active ? onComplete : undefined}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,255,255,0.85)",
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
      const totalStrokeDuration = LETTERS.length * 0.11 + 0.08 + 0.12;
      const t = setTimeout(
        () => setPhase("fill"),
        totalStrokeDuration * 1000
      );
      return () => clearTimeout(t);
    }
    if (phase === "fill") {
      const totalFillDuration =
        LETTERS.length * 0.11 + 0.05 + LETTERS.length * 0.045 + 0.22;
      const t = setTimeout(
        () => setPhase("progress"),
        totalFillDuration * 1000
      );
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleProgressComplete = () => {
    setTimeout(() => setPhase("split"), 80);
  };

  const handleSplitDone = () => {
    setPhase("done");
  };

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
              background: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                padding: "0 clamp(24px, 5vw, 48px)",
                maxWidth: "clamp(300px, 60vw, 720px)",
                width: "100%",
              }}
            >
              <WordmarkTrace
                animPhase={
                  phase === "stroke"
                    ? "stroke"
                    : phase === "fill"
                    ? "fill"
                    : "solid"
                }
              />
              <ProgressLine
                active={phase === "progress"}
                onComplete={handleProgressComplete}
              />
            </div>
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
              background: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                padding: "0 clamp(24px, 5vw, 48px)",
                maxWidth: "clamp(300px, 60vw, 720px)",
                width: "100%",
              }}
            >
              <WordmarkTrace animPhase="solid" />
              <ProgressLine active={false} onComplete={() => {}} />
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
              background: "#000000",
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
              background: "#000000",
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
