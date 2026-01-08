import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface PremiumFooterRevealProps {
  children: React.ReactNode;
}

export function PremiumFooterReveal({ children }: PremiumFooterRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };

  const rawOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 0.3, 1]);
  const rawScale = useTransform(scrollYProgress, [0, 0.4, 1], [0.88, 0.94, 1]);
  const rawY = useTransform(scrollYProgress, [0, 0.4, 1], [150, 60, 0]);
  const rawRotateX = useTransform(scrollYProgress, [0, 0.4, 1], [25, 10, 0]);

  const opacity = useSpring(rawOpacity, springConfig);
  const scale = useSpring(rawScale, springConfig);
  const y = useSpring(rawY, springConfig);
  const rotateX = useSpring(rawRotateX, springConfig);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-hidden" style={{ perspective: '2500px', perspectiveOrigin: 'center top' }}>
      {/* Dramatic gradient overlay with pulsing effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden -top-40"
        style={{ opacity: useTransform(scrollYProgress, [0, 0.3, 1], [1, 0.6, 0]) }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(150,150,150,0.08) 0%, transparent 60%)',
          }}
          animate={isVisible ? {
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.05, 1],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1]
          }}
        />
      </motion.div>

      {/* Light rays emanating from footer */}
      {isVisible && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`ray-${i}`}
              className="absolute top-0 w-px origin-top"
              style={{
                left: `${(i + 1) * 12.5}%`,
                height: '200%',
                background: 'linear-gradient(to bottom, transparent 0%, rgba(200,200,200,0.06) 50%, transparent 100%)',
                transformOrigin: 'top center',
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{
                scaleY: [0, 1.2, 1],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}
        </div>
      )}

      {/* Enhanced floating particles */}
      {isVisible && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(35)].map((_, i) => {
            const size = Math.random() * 3 + 1;
            return (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-full"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `radial-gradient(circle, rgba(${Math.random() > 0.5 ? '200,200,200' : '150,150,150'},${Math.random() * 0.3 + 0.1}) 0%, transparent 70%)`,
                  boxShadow: `0 0 ${size * 2}px rgba(255,255,255,${Math.random() * 0.3})`,
                }}
                initial={{
                  x: Math.random() * 100 + '%',
                  y: '110%',
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  y: ['-20%', '-30%'],
                  x: `${Math.random() * 100}%`,
                  opacity: [0, 1, 0.8, 0],
                  scale: [0, 1, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 4 + 3,
                  delay: Math.random() * 1,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 3,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            );
          })}
        </div>
      )}

      {/* Multi-layer shimmer effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 1, 0]) }}
      >
        <motion.div
          className="absolute inset-0 w-[200%]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.03) 75%, transparent 100%)',
          }}
          animate={isVisible ? {
            x: ['-50%', '50%'],
          } : {}}
          transition={{
            duration: 2.5,
            delay: 0.2,
            ease: [0.65, 0, 0.35, 1],
          }}
        />
      </motion.div>

      {/* Secondary shimmer */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: useTransform(scrollYProgress, [0.3, 0.6, 0.9], [0, 1, 0]) }}
      >
        <motion.div
          className="absolute inset-0 w-[150%]"
          style={{
            background: 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
          }}
          animate={isVisible ? {
            x: ['-50%', '100%'],
          } : {}}
          transition={{
            duration: 2,
            delay: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </motion.div>

      {/* Main footer content with 3D transforms */}
      <motion.div
        style={{
          opacity,
          scale,
          y,
          rotateX,
          transformStyle: 'preserve-3d',
        }}
        className="relative"
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Subtle inner glow on footer */}
        <motion.div
          className="absolute -inset-4 pointer-events-none rounded-3xl"
          style={{
            opacity: useTransform(scrollYProgress, [0.3, 0.7, 1], [0, 0.5, 0.2]),
            background: 'radial-gradient(ellipse at center, rgba(150,150,150,0.08) 0%, transparent 60%)',
            filter: 'blur(30px)',
          }}
        />
        {children}
      </motion.div>

      {/* Expansive bottom glow with animation */}
      <motion.div
        className="absolute -bottom-32 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '90%',
          height: '300px',
          opacity: useTransform(scrollYProgress, [0, 0.4, 0.8, 1], [0, 0.4, 0.3, 0.1]),
        }}
      >
        <motion.div
          className="w-full h-full"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at center, rgba(120,120,120,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={isVisible ? {
            scale: [1, 1.1, 1.05],
            opacity: [0.3, 0.5, 0.4],
          } : {}}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
          }}
        />
      </motion.div>

      {/* Ambient atmospheric effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.15, 0.05]),
          background: 'linear-gradient(to bottom, transparent 0%, rgba(100,100,100,0.03) 100%)',
        }}
      />
    </div>
  );
}
