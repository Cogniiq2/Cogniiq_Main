import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Logo } from './Logo';
import { InteractiveMenu } from './ui/modern-mobile-menu';

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Leistungen', href: '/leistungen' },
    { label: 'Über uns', href: '/ueber-uns' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Kontakt', href: '/kontakt' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm'
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Hauptnavigation"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center relative z-10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Logo className="h-12" />
              </motion.div>
            </Link>

            <PremiumNavBar navItems={navItems} currentPath={location.pathname} onNavClick={handleNavClick} />
          </div>
        </div>
      </motion.nav>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="fixed bottom-4 left-4 right-4 z-50 lg:hidden"
      >
        <InteractiveMenu />
      </motion.div>
    </>
  );
}

function PremiumNavBar({
  navItems,
  currentPath,
  onNavClick
}: {
  navItems: { label: string; href: string }[];
  currentPath: string;
  onNavClick: (path: string) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const index = navItems.findIndex(item => item.href === currentPath);
    setActiveIndex(index);
    updateIndicator(index);
  }, [currentPath, navItems]);

  const updateIndicator = (index: number) => {
    if (index === -1 || !itemRefs.current[index] || !containerRef.current) return;

    const item = itemRefs.current[index];
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    setIndicatorStyle({
      left: itemRect.left - containerRect.left,
      width: itemRect.width,
    });
  };

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIndex(null)}
      className="hidden lg:flex items-center gap-1 bg-white/50 backdrop-blur-3xl rounded-full px-2 py-2 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.8)]"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.4) 100%)',
      }}
    >
      <AnimatePresence>
        {activeIndex !== -1 && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute h-[44px] bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-full"
            initial={false}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
            }}
            style={{
              boxShadow: '0 4px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full opacity-50"
              animate={{
                background: [
                  'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {navItems.map((item, index) => (
        <PremiumNavItem
          key={item.href}
          item={item}
          index={index}
          isActive={index === activeIndex}
          isHovered={index === hoveredIndex}
          onHover={setHoveredIndex}
          mouseX={mouseX}
          mouseY={mouseY}
          ref={(el) => (itemRefs.current[index] = el)}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="ml-1"
      >
        <PremiumCTAButton
          onClick={() => onNavClick('/kontakt')}
          isActive={currentPath === '/kontakt'}
        />
      </motion.div>
    </motion.div>
  );
}

const PremiumNavItem = ({
  item,
  index,
  isActive,
  isHovered,
  onHover,
  mouseX,
  mouseY,
}: {
  item: { label: string; href: string };
  index: number;
  isActive: boolean;
  isHovered: boolean;
  onHover: (index: number | null) => void;
  mouseX: any;
  mouseY: any;
  ref?: any;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };

  const magneticX = useSpring(useMotionValue(0), springConfig);
  const magneticY = useSpring(useMotionValue(0), springConfig);
  const scale = useSpring(1, springConfig);

  useEffect(() => {
    if (!ref.current) return;

    const unsubscribe = mouseX.on('change', (latest: number) => {
      const rect = ref.current!.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width / 2 - (ref.current!.offsetParent as HTMLElement)?.getBoundingClientRect().left;
      const itemCenterY = rect.top + rect.height / 2 - (ref.current!.offsetParent as HTMLElement)?.getBoundingClientRect().top;

      const distanceX = latest - itemCenterX;
      const distanceY = mouseY.get() - itemCenterY;
      const dist = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      distance.set(dist);

      const maxDistance = 120;
      if (dist < maxDistance) {
        const strength = (maxDistance - dist) / maxDistance;
        const magnetStrength = 0.15;
        magneticX.set(distanceX * strength * magnetStrength);
        magneticY.set(distanceY * strength * magnetStrength);
        scale.set(1 + strength * 0.08);
      } else {
        magneticX.set(0);
        magneticY.set(0);
        scale.set(1);
      }
    });

    return () => unsubscribe();
  }, [mouseX, mouseY]);

  const handleMouseEnter = () => {
    onHover(index);
  };

  const handleMouseLeave = () => {
    onHover(null);
    magneticX.set(0);
    magneticY.set(0);
    scale.set(1);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        x: magneticX,
        y: magneticY,
        scale,
      }}
      className="relative"
    >
      <Link
        to={item.href}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative block"
      >
        <motion.div
          className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
            isActive
              ? 'text-white'
              : 'text-gray-700'
          }`}
        >
          <AnimatePresence>
            {!isActive && isHovered && (
              <>
                <motion.div
                  layoutId={`hoverBackground-${index}`}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-50"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 70%)',
                  }}
                />
              </>
            )}
          </AnimatePresence>

          <span className="relative z-10 tracking-wide flex items-center gap-0">
            {item.label.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 1, y: 0 }}
                animate={{
                  y: isHovered && !isActive ? [0, -2, 0] : 0,
                }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.02,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {char}
              </motion.span>
            ))}
          </span>

          <AnimatePresence>
            {!isActive && isHovered && (
              <motion.div
                className="absolute bottom-1.5 left-1/2 h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-full"
                initial={{ width: '0%', x: '-50%' }}
                animate={{ width: '70%', x: '-50%' }}
                exit={{ width: '0%', x: '-50%' }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {isHovered && (
          <motion.div
            className="absolute -inset-2 rounded-full opacity-0"
            animate={{
              opacity: [0, 0.5, 0],
              scale: [0.8, 1.2, 1.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            }}
          />
        )}
      </Link>
    </motion.div>
  );
};

function PremiumCTAButton({ onClick, isActive }: { onClick: () => void; isActive: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const springConfig = { damping: 20, stiffness: 300 };
  const scale = useSpring(1, springConfig);

  return (
    <motion.div
      onHoverStart={() => {
        setIsHovered(true);
        scale.set(1.05);
      }}
      onHoverEnd={() => {
        setIsHovered(false);
        scale.set(1);
      }}
      whileTap={{ scale: 0.95 }}
      style={{ scale }}
    >
      <Button
        onClick={onClick}
        aria-label="Kostenloses Erstgespräch buchen"
        className={`relative rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 overflow-hidden border-0 ${
          isActive
            ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
            : 'bg-gradient-to-br from-gray-100 to-white text-gray-900 shadow-[0_2px_12px_rgba(0,0,0,0.08)]'
        }`}
      >
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isActive && isHovered && (
            <>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                className="absolute inset-0"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                }}
              />
            </>
          )}
        </AnimatePresence>

        <span className="relative z-10 flex items-center gap-0">
          {'Erstgespräch'.split('').map((char, i) => (
            <motion.span
              key={i}
              animate={{
                y: isHovered && !isActive ? [0, -2, 0] : 0,
              }}
              transition={{
                duration: 0.3,
                delay: i * 0.02,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>

        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 20px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                '0 0 30px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                '0 0 20px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </Button>
    </motion.div>
  );
}
