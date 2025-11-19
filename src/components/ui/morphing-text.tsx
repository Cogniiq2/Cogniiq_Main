"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

export function GooeyText({
  texts,
  morphTime = 2.2,          // slower, smoother
  cooldownTime = 1.1,        // longer pause before morph
  className,
  textClassName
}: GooeyTextProps) {

  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    let textIndex = texts.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;

    // *** SMOOTH & CLEAN morph ***
    const setMorph = (fraction: number) => {
      if (!text1Ref.current || !text2Ref.current) return;

      const eased = easeInOut(fraction);

      // reduced blur → cleaner
      const blurAmount = 3;

      text2Ref.current.style.filter = `blur(${blurAmount * (1 - eased)}px)`;
      text2Ref.current.style.opacity = `${eased}`;

      const inv = 1 - eased;
      text1Ref.current.style.filter = `blur(${blurAmount * inv}px)`;
      text1Ref.current.style.opacity = `${inv}`;
    };

    const doCooldown = () => {
      morph = 0;
      if (!text1Ref.current || !text2Ref.current) return;

      text2Ref.current.style.filter = "blur(0px)";
      text2Ref.current.style.opacity = "1";

      text1Ref.current.style.filter = "blur(3px)";
      text1Ref.current.style.opacity = "0";
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;

      let fraction = morph / morphTime;
      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }

      setMorph(fraction);
    };

    const animate = () => {
      requestAnimationFrame(animate);
      const newTime = new Date();
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;

      const shouldIncrement = cooldown > 0;
      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrement) {
          textIndex = (textIndex + 1) % texts.length;

          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[textIndex];
            text2Ref.current.textContent = texts[(textIndex + 1) % texts.length];
          }
        }
        doMorph();
      } else {
        doCooldown();
      }
    };

    // soft ease–in–out morph curve
    const easeInOut = (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    animate();
  }, [texts, morphTime, cooldownTime]);

  return (
    <div className={cn("relative", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 255 -140
              "
            />
          </filter>
        </defs>
      </svg>

      <div
        className="flex items-center justify-center"
        style={{ filter: "url(#threshold)" }}
      >
        <span
          ref={text1Ref}
          className={cn(
            "absolute inline-block select-none text-center text-6xl md:text-[60pt] text-foreground transition-all duration-300",
            textClassName
          )}
        />

        <span
          ref={text2Ref}
          className={cn(
            "absolute inline-block select-none text-center text-6xl md:text-[60pt] text-foreground transition-all duration-300",
            textClassName
          )}
        />
      </div>
    </div>
  );
}
