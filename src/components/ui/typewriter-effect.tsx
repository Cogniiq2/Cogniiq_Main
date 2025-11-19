"use client";

import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { useEffect } from "react";

export const TypewriterEffect = ({
  text,
  className,
  cursorClassName,
}: {
  text: string;
  className?: string;
  cursorClassName?: string;
}) => {
  // Split the SINGLE text into characters
  const chars = text.split("");

  const [scope, animate] = useAnimate();
  const isInView = useInView(scope);

  useEffect(() => {
    if (isInView) {
      animate(
        "span",
        {
          display: "inline-block",
          opacity: 1,
          width: "fit-content",
        },
        {
          duration: 0.3,
          delay: stagger(0.05),
          ease: "easeInOut",
        }
      );
    }
  }, [isInView]);

  return (
    <div
      className={cn(
        "text-5xl md:text-7xl lg:text-8xl font-bold text-center",
        className
      )}
    >
      <motion.div ref={scope} className="inline">
        {chars.map((char, index) => (
          <motion.span
            key={index}
            initial={{}}
            className="text-black opacity-0 hidden"
          >
            {char}
          </motion.span>
        ))}
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
          "inline-block rounded-sm w-[4px] h-10 bg-black",
          cursorClassName
        )}
      ></motion.span>
    </div>
  );
};
