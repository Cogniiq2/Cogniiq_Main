import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import {
  Home,
  Briefcase,
  Users,
  HelpCircle,
  Mail,
  MapPin,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';
import { CITY_LINKS } from '@/lib/standorte-data';

const navItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Leistungen', icon: Briefcase, path: '/leistungen' },
  { label: 'Über uns', icon: Users, path: '/ueber-uns' },
  { label: 'FAQ', icon: HelpCircle, path: '/faq' },
  { label: 'Kontakt', icon: Mail, path: '/kontakt' },
];

const cityEntries = Object.entries(CITY_LINKS) as Array<[string, typeof CITY_LINKS[keyof typeof CITY_LINKS]]>;

export function PremiumMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [showStandorte, setShowStandorte] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const isStandortePage =
    location.pathname.startsWith('/bayreuth') ||
    location.pathname.startsWith('/regensburg') ||
    location.pathname.startsWith('/muenchen') ||
    location.pathname === '/bayern';

  useEffect(() => {
    setIsOpen(false);
    setShowStandorte(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current - touchEndY.current < -100) {
      setIsOpen(false);
    }
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-full blur-xl opacity-60" />

          <div className="relative bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 px-8 py-4 rounded-full border border-gray-700/50 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {navItems.slice(0, 4).map((item, i) => (
                  <div
                    key={item.path}
                    className="w-1 h-1 rounded-full bg-gray-500"
                    style={{
                      opacity: location.pathname === item.path ? 1 : 0.3,
                      backgroundColor: location.pathname === item.path ? '#fff' : '#6b7280'
                    }}
                  />
                ))}
              </div>

              <div className="w-px h-4 bg-gray-700 mx-1" />

              <span className="text-xs font-medium text-white tracking-wide">
                Menu
              </span>
            </div>
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[70] lg:hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="bg-white dark:bg-gray-950 rounded-t-[2rem] shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 rounded-full" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                      Navigation
                    </h2>
                  </div>

                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={18} className="text-gray-600 dark:text-gray-400" />
                  </motion.button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                  <div className="space-y-1 mb-6">
                    {navItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;

                      return (
                        <motion.button
                          key={item.path}
                          onClick={() => handleNavClick(item.path)}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                            isActive
                              ? 'bg-gray-900 dark:bg-white shadow-lg'
                              : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                            isActive
                              ? 'bg-white dark:bg-gray-900'
                              : 'bg-white dark:bg-gray-800'
                          }`}>
                            <Icon
                              size={20}
                              className={isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}
                            />
                          </div>

                          <span className={`flex-1 text-left font-medium ${
                            isActive
                              ? 'text-white dark:text-gray-900'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {item.label}
                          </span>

                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-900"
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="mb-4">
                    <button
                      onClick={() => setShowStandorte(!showStandorte)}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                        isStandortePage
                          ? 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 shadow-lg'
                          : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        isStandortePage
                          ? 'bg-white dark:bg-gray-900'
                          : 'bg-white dark:bg-gray-800'
                      }`}>
                        <MapPin
                          size={20}
                          className={isStandortePage ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}
                        />
                      </div>

                      <span className={`flex-1 text-left font-medium ${
                        isStandortePage
                          ? 'text-white dark:text-gray-900'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        Standorte
                      </span>

                      <motion.div
                        animate={{ rotate: showStandorte ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight
                          size={18}
                          className={isStandortePage ? 'text-white dark:text-gray-900' : 'text-gray-400'}
                        />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {showStandorte && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 space-y-3">
                            <motion.button
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 }}
                              onClick={() => handleNavClick('/bayern')}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-gray-200 dark:hover:from-gray-700 transition-all"
                              whileTap={{ scale: 0.98 }}
                            >
                              <Sparkles size={16} className="text-gray-600 dark:text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Bayern – Alle Standorte
                              </span>
                            </motion.button>

                            {cityEntries.map(([slug, cityData], cityIndex) => (
                              <motion.div
                                key={slug}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 + cityIndex * 0.05 }}
                                className="space-y-2"
                              >
                                <div className="px-4 py-2 flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600" />
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {cityData.label}
                                  </span>
                                </div>

                                <div className="space-y-1.5 pl-2">
                                  {cityData.services.map((service) => {
                                    const isActive = location.pathname === service.href;

                                    return (
                                      <button
                                        key={service.href}
                                        onClick={() => handleNavClick(service.href)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                                          isActive
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                            : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                      >
                                        <div className={`w-1 h-1 rounded-full ${
                                          isActive ? 'bg-white dark:bg-gray-900' : 'bg-gray-300 dark:bg-gray-600'
                                        }`} />
                                        <span className="text-sm font-medium">
                                          {service.label}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-600">
                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                    <span>Premium Navigation</span>
                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
