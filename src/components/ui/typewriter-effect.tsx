"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function TypewriterEffectSmooth({
  words,
  className,
  cursorClassName,
}: {
  words: { text: string; className?: string }[];
  className?: string;
  cursorClassName?: string;
}) {
  const renderWords = () => {
    return (
      <div>
        {words.map((word, idx) => (
          <div key={`word-${idx}`} className="inline-block">
            {word.text.split("").map((char, index) => (
              <span
                key={`char-${index}`}
                className={cn("text-black", word.className)}
              >
                {char}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("flex space-x-1 my-6", className)}>
      <motion.div
        className="overflow-hidden pb-2"
        initial={{ width: "0%" }}
        whileInView={{ width: "fit-content" }}
        transition={{
          duration: 2,
          ease: "linear",
          delay: 0.4,
        }}
      >
        <div
          className="text-5xl md:text-7xl lg:text-8xl font-bold"
          style={{ whiteSpace: "nowrap" }}
        >
          {renderWords()}
        </div>
      </motion.div>

      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className={cn(
          "block rounded-sm w-[4px] h-10 bg-black",
          cursorClassName
        )}
      ></motion.span>
    </div>
  );
}
