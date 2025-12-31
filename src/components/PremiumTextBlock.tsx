import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

export function PremiumTextBlock() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const springConfig = { stiffness: 150, damping: 15 };
  const x = useSpring(useMotionValue(0), springConfig);
  const y = useSpring(useMotionValue(0), springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.querySelector('.premium-text-container')?.getBoundingClientRect();
      if (rect) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setMousePosition({
          x: (e.clientX - centerX) / 50,
          y: (e.clientY - centerY) / 50,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const headingWords = ['CogniIQ', '–', 'The', 'Future', 'is', 'here.'];

  return (
    <motion.div
      className="flex-none w-full lg:w-[400px] xl:w-[450px] p-4 lg:p-8 relative z-10 flex flex-col justify-center premium-text-container"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        x,
        y,
      }}
    >
      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 w-32 h-32 border border-gray-300/20 dark:border-gray-700/20"
          animate={{
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.1, 1, 0.9, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
          }}
        />
        <motion.div
          className="absolute bottom-10 left-0 w-24 h-24 border border-gray-400/20 dark:border-gray-600/20 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            transform: `translate(${mousePosition.x * -0.3}px, ${mousePosition.y * -0.3}px)`,
          }}
        />
        <motion.div
          className="absolute top-1/2 right-10 w-16 h-16 bg-gradient-to-br from-gray-200/30 dark:from-gray-800/30 to-transparent backdrop-blur-sm"
          animate={{
            rotate: [0, -180, -360],
            y: [-10, 10, -10],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            transform: `translate(${mousePosition.x * 0.8}px, ${mousePosition.y * 0.8}px)`,
          }}
        />
      </div>

      {/* Premium Border Container */}
      <motion.div
        className="relative p-6 lg:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Animated Gradient Border */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0"
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)',
            backgroundSize: '200% 100%',
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{
              backgroundPosition: ['0% 0%', '200% 0%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)',
              backgroundSize: '200% 100%',
            }}
          />
        </motion.div>

        {/* Glowing Accent Lines */}
        <motion.div
          className="absolute top-0 left-0 w-20 h-[2px] bg-gradient-to-r from-gray-900 dark:from-gray-100 to-transparent"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 80, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-20 h-[2px] bg-gradient-to-l from-gray-900 dark:from-gray-100 to-transparent"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 80, opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
        />

        {/* Main Heading with Advanced Animation */}
        <div className="relative">
          {/* Background shimmer effect */}
          <motion.div
            className="absolute inset-0 opacity-0"
            animate={{
              opacity: [0, 0.1, 0],
              x: [-100, 500],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)',
              filter: 'blur(20px)',
            }}
          />

          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight relative">
            {headingWords.map((word, wordIndex) => (
              <motion.span
                key={wordIndex}
                className="inline-block mr-3"
                initial={{ opacity: 0, y: 50, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: wordIndex * 0.1,
                  ease: [0.645, 0.045, 0.355, 1],
                }}
                whileHover={{
                  scale: 1.05,
                  textShadow: '0 0 8px rgba(0,0,0,0.3)',
                }}
                style={{
                  perspective: '1000px',
                  transformStyle: 'preserve-3d',
                }}
              >
                {word.split('').map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    className="inline-block bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 via-neutral-700 to-neutral-600 dark:from-neutral-100 dark:via-neutral-300 dark:to-neutral-400"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: wordIndex * 0.1 + charIndex * 0.03,
                    }}
                    whileHover={{
                      y: -2,
                      transition: { duration: 0.2 },
                    }}
                    style={{
                      display: 'inline-block',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.span>
            ))}

            {/* Animated gradient overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
              style={{
                mixBlendMode: 'overlay',
              }}
            />
          </h1>
        </div>

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay rounded-2xl"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>

      {/* Ambient glow effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none"
        animate={{
          opacity: [0.05, 0.15, 0.05],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </motion.div>
  );
}
