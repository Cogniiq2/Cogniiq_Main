"use client";

import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { useEffect, useState } from "react";

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
  const chars = words[0].text.split("");

  const [scope, animate] = useAnimate();
  const isInView = useInView(scope);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (isInView) {
      setTimeout(() => {
        setShowCursor(true); // cursor appears exactly when animation starts

        animate(
          "span.char", // only animate characters
          {
            opacity: 1,
            display: "inline-block",
          },
          {
            duration: 0.25,
            delay: stagger(0.045),
            ease: "easeOut",
          }
        );
      }, 2000); // 2-second delay
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
            className={cn(
              "char opacity-0 text-black tracking-tight font-semibold",
              words[0].className
            )}
            style={{
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', Arial",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              fontSize: "clamp(32px, 6vw, 68px)",
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

        {/* Cursor now INSIDE the text container */}
        {showCursor && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className={cn(
              "inline-block rounded-sm bg-black ml-1",
              cursorClassName
            )}
            style={{
              width: "4px",
              height: "clamp(28px, 5vw, 54px)",
            }}
          ></motion.span>
        )}
      </motion.div>
    </div>
  );
};
