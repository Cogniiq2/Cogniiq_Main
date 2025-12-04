import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
            ? 'bg-white/95 backdrop-blur-md border-b border-gray-100'
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Logo className="h-12" />
              </motion.div>
            </Link>

            <motion.div
              className="hidden lg:flex items-center gap-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {navItems.map((item, index) => (
                <MinimalNavItem
                  key={item.href}
                  item={item}
                  isActive={location.pathname === item.href}
                  index={index}
                />
              ))}

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="ml-4"
              >
                <Button
                  onClick={() => handleNavClick('/kontakt')}
                  aria-label="Kostenloses Erstgespräch buchen"
                  className="relative rounded-full px-7 py-2.5 text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 shadow-sm hover:shadow-md border-0"
                >
                  Erstgespräch
                </Button>
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

function MinimalNavItem({
  item,
  isActive,
  index,
}: {
  item: { label: string; href: string };
  isActive: boolean;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
    >
      <Link
        to={item.href}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative block group"
      >
        <motion.span
          className={`text-sm font-medium tracking-wide transition-colors duration-300 ${
            isActive ? 'text-gray-900' : 'text-gray-600'
          }`}
          animate={{
            color: isHovered && !isActive ? '#111827' : undefined,
          }}
        >
          {item.label}
        </motion.span>

        <motion.div
          className="absolute -bottom-1.5 left-0 right-0 h-[1.5px] bg-gray-900 origin-left"
          initial={false}
          animate={{
            scaleX: isActive ? 1 : 0,
            opacity: isActive ? 1 : 0,
          }}
          transition={{
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
        />

        <motion.div
          className="absolute -bottom-1.5 left-0 right-0 h-[1px] bg-gray-300 origin-left"
          initial={false}
          animate={{
            scaleX: !isActive && isHovered ? 1 : 0,
            opacity: !isActive && isHovered ? 1 : 0,
          }}
          transition={{
            duration: 0.25,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </Link>
    </motion.div>
  );
}
