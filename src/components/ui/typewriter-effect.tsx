"use client";

import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { useEffect, useState } from "react";

// Ultra-modern Apple-like typewriter animation (premium version)
export const TypewriterEffectSmooth = ({
  words,
  className,
  cursorClassName,
}: {
  words: { text: string; className?: string }[];
  className?: string;
  cursorClassName?: string;
}) => {
  const chars = words[0].text.split("");

  const [scope, animate] = useAnimate();
  const isInView = useInView(scope);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (isInView) {
      setTimeout(() => {
        setShowCursor(true);

        animate(
          "span.char",
          {
            opacity: 1,
            display: "inline-block",
            y: 0,
          },
          {
            duration: 0.25,
            delay: stagger(0.038),
            ease: [0.19, 1, 0.22, 1], // Apple-like spring easing
          }
        );
      }, 1400);
    }
  }, [isInView]);

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        className
      )}
    >
      <motion.div
        ref={scope}
        className="inline-flex items-center"
        style={{ whiteSpace: "nowrap" }}
      >
        {chars.map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 3 }}
            className={cn(
              "char opacity-0 tracking-tight font-semibold",
              words[0].className
            )}
            style={{
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', Arial",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              fontSize: "clamp(22px, 4vw, 40px)",
            }}
          >
            {char === " " ? (
              <span
                style={{
                  display: "inline-block",
                  width: "0.35em",
                }}
              ></span>
            ) : (
              char
            )}
          </motion.span>
        ))}

        {/* FOLLOWING CURSOR — MOVES WITH TEXT */}
        {showCursor && (
          <motion.span
            key="typing-cursor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className={cn(
              "inline-block rounded-sm bg-black",
              cursorClassName
            )}
            style={{
              width: "3px",
              height: "clamp(22px, 4vw, 38px)",
              marginLeft: "2px",
              position: "relative",
              top: "0.1em",
            }}
          />
        )}
      </motion.div>
    </div>
  );
};
