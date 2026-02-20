import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin } from 'lucide-react';
import { Logo } from './Logo';
import { PremiumMobileNav } from './ui/premium-mobile-nav';
import { CITY_LINKS } from '@/lib/standorte-data';

const cityEntries = Object.entries(CITY_LINKS) as Array<[string, typeof CITY_LINKS[keyof typeof CITY_LINKS]]>;

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

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

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800'
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
              <StandorteDropdown index={navItems.length} />
            </motion.div>
          </div>
        </div>
      </motion.nav>

      <PremiumMobileNav />
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
            isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
          }`}
          animate={{
            color: isHovered && !isActive ? '#111827' : undefined,
          }}
        >
          {item.label}
        </motion.span>

        <motion.div
          className="absolute -bottom-1.5 left-0 right-0 h-[1.5px] bg-gray-900 dark:bg-gray-100 origin-left"
          initial={false}
          animate={{
            scaleX: isActive ? 1 : 0,
            opacity: isActive ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.div
          className="absolute -bottom-1.5 left-0 right-0 h-[1px] bg-gray-300 dark:bg-gray-700 origin-left"
          initial={false}
          animate={{
            scaleX: !isActive && isHovered ? 1 : 0,
            opacity: !isActive && isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        />
      </Link>
    </motion.div>
  );
}

function StandorteDropdown({ index }: { index: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isActive =
    location.pathname.startsWith('/bayreuth') ||
    location.pathname.startsWith('/regensburg') ||
    location.pathname.startsWith('/muenchen') ||
    location.pathname === '/bayern';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <motion.div
      ref={ref}
      className="relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className={`flex items-center gap-1 text-sm font-medium tracking-wide transition-colors duration-300 ${
          isActive
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Standorte
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {isActive && (
        <div className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-gray-900 dark:bg-gray-100" />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onMouseLeave={() => setOpen(false)}
            className="absolute top-full right-0 mt-3 w-[420px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-gray-200/60 dark:shadow-none overflow-hidden z-50"
          >
            <div className="p-3">
              <Link
                to="/bayern"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-1"
              >
                <MapPin size={14} className="text-[#515A61] dark:text-sky-400" />
                Bayern – Alle Standorte & Leistungen
              </Link>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />

              <div className="grid grid-cols-3 gap-1">
                {cityEntries.map(([slug, cityData]) => (
                  <div key={slug} className="p-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 px-1">
                      {cityData.label}
                    </p>
                    {cityData.services.map((service) => (
                      <Link
                        key={service.href}
                        to={service.href}
                        className="block px-1 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                      >
                        {service.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
