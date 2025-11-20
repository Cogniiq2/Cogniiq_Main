"use client";

import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { useEffect, useState } from "react";

// Apple-style typewriter where the cursor truly follows the text
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
            width: "auto",
          },
          {
            duration: 0.25,
            delay: stagger(0.045),
            ease: [0.19, 1, 0.22, 1],
          }
        );
      }, 1200);
    }
  }, [isInView]);

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        ref={scope}
        className="inline-flex items-center"
        style={{ whiteSpace: "nowrap" }}
      >
        {chars.map((char, index) => (
          <motion.span
            key={index}
            className={cn(
              "char opacity-0 overflow-hidden inline-block",
              words[0].className
            )}
            initial={{ opacity: 0, width: 0 }}
            style={{
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', Arial",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              fontSize: "clamp(22px, 4vw, 40px)",
            }}
          >
            {char === " " ? (
              <span style={{ display: "inline-block", width: "0.35em" }}></span>
            ) : (
              char
            )}
          </motion.span>
        ))}

        {/* REAL FOLLOWING CURSOR */}
        {showCursor && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className={cn(
              "inline-block bg-black",
              cursorClassName
            )}
            style={{
              width: "3px",
              height: "clamp(22px, 4vw, 38px)",
              marginLeft: "3px",
              position: "relative",
              top: "0.1em",
            }}
          />
        )}
      </motion.div>
    </div>
  );
};
