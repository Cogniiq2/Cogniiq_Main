import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function MobilePremiumHero() {
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setTouchPosition({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        });
      }
    };

    window.addEventListener('touchmove', handleTouch);
    return () => window.removeEventListener('touchmove', handleTouch);
  }, []);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center px-6">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large Gradient Orb 1 */}
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-30 dark:opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(147, 51, 234, 0.3) 50%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          initial={{ top: '10%', left: '-20%' }}
        />

        {/* Large Gradient Orb 2 */}
        <motion.div
          className="absolute w-80 h-80 rounded-full opacity-30 dark:opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.5) 0%, rgba(59, 130, 246, 0.3) 50%, transparent 70%)',
            filter: 'blur(50px)',
          }}
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          initial={{ top: '60%', right: '-10%' }}
        />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 dark:bg-blue-300 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Geometric Shapes */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 border border-blue-400/30 dark:border-blue-300/20"
          animate={{
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        <motion.div
          className="absolute bottom-32 right-10 w-16 h-16 border border-pink-400/30 dark:border-pink-300/20 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Neural Network Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-10">
          <motion.line
            x1="10%"
            y1="20%"
            x2="90%"
            y2="80%"
            stroke="url(#gradient1)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
          <motion.line
            x1="80%"
            y1="30%"
            x2="20%"
            y2="70%"
            stroke="url(#gradient2)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 0.5 }}
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>

        {/* Holographic Grid */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-64"
          style={{
            background: 'linear-gradient(to top, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
            }}
          />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Glowing Halo Effect */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Premium Animated Border */}
        <motion.div
          className="relative p-8 rounded-3xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {/* Animated gradient border effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl opacity-0"
            animate={{
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
              padding: '2px',
            }}
          />

          {/* Main Heading */}
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-6 relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {['CogniIQ', '–', 'The', 'Future', 'is', 'here.'].map((word, wordIndex) => (
              <motion.span
                key={wordIndex}
                className="inline-block mr-3 bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 via-neutral-700 to-neutral-600 dark:from-neutral-100 dark:via-neutral-300 dark:to-neutral-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.3 + wordIndex * 0.1,
                }}
                whileInView={{
                  scale: [1, 1.05, 1],
                }}
                viewport={{ once: true }}
              >
                {word}
              </motion.span>
            ))}

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
                ease: 'easeInOut',
              }}
              style={{
                mixBlendMode: 'overlay',
              }}
            />
          </motion.h1>

          {/* Accent Lines */}
          <div className="flex justify-center gap-4 mb-6">
            <motion.div
              className="h-1 bg-gradient-to-r from-blue-500 to-pink-500 dark:from-blue-400 dark:to-pink-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 60 }}
              transition={{ duration: 1, delay: 0.8 }}
            />
            <motion.div
              className="h-1 bg-gradient-to-r from-pink-500 to-purple-500 dark:from-pink-400 dark:to-purple-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 60 }}
              transition={{ duration: 1, delay: 1 }}
            />
          </div>

          {/* Floating Orbs around text */}
          <motion.div
            className="absolute -top-6 -left-6 w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"
            animate={{
              y: [0, -10, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -bottom-6 -right-6 w-3 h-3 bg-pink-500 dark:bg-pink-400 rounded-full"
            animate={{
              y: [0, 10, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
          <motion.div
            className="absolute top-1/2 -right-8 w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"
            animate={{
              x: [0, 10, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        </motion.div>

        {/* Bottom ambient glow */}
        <motion.div
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-32"
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </div>
    </div>
  );
}
