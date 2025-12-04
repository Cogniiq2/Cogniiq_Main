import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

            <motion.div
              className="hidden lg:flex items-center gap-2 bg-white/40 backdrop-blur-2xl rounded-full px-3 py-2 border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {navItems.map((item, index) => (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={location.pathname === item.href}
                  index={index}
                />
              ))}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="ml-2"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => handleNavClick('/kontakt')}
                    aria-label="Kostenloses Erstgespräch buchen"
                    className={`relative rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 overflow-hidden group ${
                      location.pathname === '/kontakt'
                        ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg'
                        : 'bg-white/60 text-gray-900 hover:bg-white/80 border border-gray-300/50 shadow-md hover:shadow-lg'
                    }`}
                  >
                    <span className="relative z-10">Erstgespräch</span>
                    {location.pathname === '/kontakt' ? (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={false}
                      />
                    ) : (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={false}
                      />
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
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

function NavItem({ item, isActive, index }: { item: { label: string; href: string }; isActive: boolean; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 300 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = (mouseX / width - 0.5) * 2;
    const yPct = (mouseY / height - 0.5) * 2;

    x.set(xPct * 0.3);
    y.set(yPct * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
    >
      <Link
        ref={ref}
        to={item.href}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative block"
      >
        <motion.div
          style={{
            rotateX,
            rotateY,
          }}
          className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
            isActive
              ? 'text-white'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <motion.div
            className={`absolute inset-0 rounded-full transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg'
                : ''
            }`}
            animate={{
              scale: isActive ? 1 : isHovered ? 0.98 : 0,
              opacity: isActive ? 1 : isHovered ? 0.08 : 0,
              backgroundColor: isActive ? undefined : isHovered ? '#f3f4f6' : 'transparent',
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />

          <span className="relative z-10 tracking-wide">
            {item.label}
          </span>

          {!isActive && (
            <motion.div
              className="absolute bottom-1 left-1/2 h-0.5 bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400 rounded-full"
              initial={{ width: 0, x: '-50%' }}
              animate={{
                width: isHovered ? '60%' : 0,
              }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          )}

          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: isActive
                ? '0 0 20px rgba(0,0,0,0.1), inset 0 0 20px rgba(255,255,255,0.1)'
                : isHovered
                ? '0 0 15px rgba(0,0,0,0.05)'
                : '0 0 0px rgba(0,0,0,0)',
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}
