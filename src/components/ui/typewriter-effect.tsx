"use client";

import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { useEffect } from "react";

// --- CLEAN SINGLE-LINE TYPEWRITER ANIMATION ---
export const TypewriterEffectSmooth = ({
  words,
  className,
  cursorClassName,
}: {
  words: { text: string; className?: string }[];
  className?: string;
  cursorClassName?: string;
}) => {
  // Convert words into a single array of characters
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
          delay: stagger(0.06),
          ease: "easeInOut",
        }
      );
    }
  }, [isInView]);

  return (
    <div
      className={cn(
        "flex space-x-1 my-6 items-center justify-center",
        className
      )}
    >
      <motion.div ref={scope} className="inline-block">
        {chars.map((char, index) => (
          <motion.span
            key={index}
            className={cn("opacity-0 text-black", words[0].className)}
          >
            {char}
          </motion.span>
        ))}
      </motion.div>

      {/* Cursor */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className={cn(
          "inline-block rounded-sm w-[4px] h-10 bg-black",
          cursorClassName
        )}
      ></motion.span>
    </div>
  );
};
