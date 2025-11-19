"use client";

import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { useEffect } from "react";

// Ultra-modern Apple-like typewriter animation
export const TypewriterEffectSmooth = ({
  words,
  className,
  cursorClassName,
}: {
  words: { text: string; className?: string }[];
  className?: string;
  cursorClassName?: string;
}) => {
  // Split into characters
  const chars = words[0].text.split("");

  const [scope, animate] = useAnimate();
  const isInView = useInView(scope);

  useEffect(() => {
    if (isInView) {
      animate(
        "span",
        {
          opacity: 1,
          display: "inline-block",
        },
        {
          duration: 0.25,
          delay: stagger(0.045), // slightly faster, more premium
          ease: "easeOut",
        }
      );
    }
  }, [isInView]);

  return (
    <div
      className={cn(
        "flex items-center justify-center space-x-2",
        className
      )}
    >
      <motion.div ref={scope} className="inline-block">
        {chars.map((char, index) => (
          <motion.span
            key={index}
            className={cn(
              "opacity-0 text-black tracking-tight font-semibold",
              words[0].className
            )}
            style={{
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', Arial",
              fontWeight: 600,
              letterSpacing: "-0.03em", // luxury Apple tightness
              fontSize: "clamp(32px, 6vw, 68px)", // responsive luxury size
            }}
          >
            {/* FIXED SPACING */}
            {char === " " ? (
              <span
                style={{
                  display: "inline-block",
                  width: "0.35em", // perfect Apple-like spacing
                }}
              ></span>
            ) : (
              char
            )}
          </motion.span>
        ))}
      </motion.div>

      {/* Cursor */}
      <motion.span
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
          width: "4px",
          height: "clamp(28px, 5vw, 54px)",
        }}
      ></motion.span>
    </div>
  );
};
