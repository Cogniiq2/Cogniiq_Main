import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Briefcase,
  Users,
  HelpCircle,
  Mail,
  MapPin,
  ChevronDown,
  X,
  ArrowRight,
} from 'lucide-react';
import { CITY_LINKS } from '@/lib/standorte-data';
import { Logo } from '@/components/Logo';

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

  const currentLabel =
    navItems.find((i) => i.path === location.pathname)?.label ||
    (isStandortePage ? 'Standorte' : null);

  useEffect(() => {
    setIsOpen(false);
    setShowStandorte(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndY.current = e.touches[0].clientY; };
  const handleTouchEnd = () => {
    if (touchStartY.current - touchEndY.current < -80) setIsOpen(false);
  };

  const go = (path: string) => { navigate(path); setIsOpen(false); };

  return (
    <>
      {/* TRIGGER PILL */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 240, damping: 22 }}
        whileTap={{ scale: 0.96 }}
        aria-label="Navigation öffnen"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-white/10 blur-xl scale-125 opacity-70" />
          <div className="relative flex items-center gap-3 bg-gray-950/95 border border-white/[0.08] rounded-full px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="flex items-center gap-[5px]">
              {navItems.map((item) => (
                <motion.div
                  key={item.path}
                  className="rounded-full"
                  animate={{
                    width: location.pathname === item.path ? 16 : 4,
                    backgroundColor: location.pathname === item.path ? '#ffffff' : '#4b5563',
                    height: 4,
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
            <div className="w-px h-3.5 bg-white/10" />
            <span className="text-[13px] font-medium text-white/90 tracking-wide">
              {currentLabel ?? 'Menu'}
            </span>
            <ChevronDown size={13} className="text-white/40" />
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* SHEET */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[70] lg:hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="bg-gray-950 rounded-t-[28px] max-h-[88vh] overflow-hidden flex flex-col border border-white/[0.06] border-b-0">

                {/* DRAG HANDLE */}
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                  <div className="w-10 h-1 rounded-full bg-white/10" />
                </div>

                {/* HEADER */}
                <div className="flex items-center justify-between px-6 pt-3 pb-5 flex-shrink-0">
                  <Logo className="h-7 brightness-0 invert opacity-90" />
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center"
                    whileTap={{ scale: 0.9 }}
                    aria-label="Schließen"
                  >
                    <X size={15} className="text-white/60" />
                  </motion.button>
                </div>

                {/* SCROLL AREA */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">

                  {/* PRIMARY NAV */}
                  <nav className="space-y-0.5 mb-4">
                    {navItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;

                      return (
                        <motion.button
                          key={item.path}
                          onClick={() => go(item.path)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.28 }}
                          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
                            isActive
                              ? 'bg-white/[0.07]'
                              : 'hover:bg-white/[0.04]'
                          }`}
                          whileTap={{ scale: 0.985 }}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                            isActive
                              ? 'bg-white/10 border-white/10'
                              : 'bg-white/[0.04] border-white/[0.05] group-hover:bg-white/[0.07]'
                          }`}>
                            <Icon
                              size={18}
                              className={isActive ? 'text-white' : 'text-white/40 group-hover:text-white/60 transition-colors'}
                            />
                          </div>

                          <span className={`flex-1 text-left text-[15px] font-medium transition-colors ${
                            isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                          }`}>
                            {item.label}
                          </span>

                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -4 }}
                                className="flex items-center gap-1.5"
                              >
                                <div className="w-1 h-1 rounded-full bg-white/60" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </nav>

                  {/* DIVIDER */}
                  <div className="h-px bg-white/[0.05] mx-4 mb-4" />

                  {/* STANDORTE SECTION */}
                  <div className="mb-2">
                    <motion.button
                      onClick={() => setShowStandorte(!showStandorte)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: navItems.length * 0.04, duration: 0.28 }}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
                        isStandortePage ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                      }`}
                      whileTap={{ scale: 0.985 }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                        isStandortePage
                          ? 'bg-white/10 border-white/10'
                          : 'bg-white/[0.04] border-white/[0.05] group-hover:bg-white/[0.07]'
                      }`}>
                        <MapPin
                          size={18}
                          className={isStandortePage ? 'text-white' : 'text-white/40 group-hover:text-white/60 transition-colors'}
                        />
                      </div>

                      <span className={`flex-1 text-left text-[15px] font-medium transition-colors ${
                        isStandortePage ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                      }`}>
                        Standorte
                      </span>

                      <motion.div
                        animate={{ rotate: showStandorte ? 180 : 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        <ChevronDown size={16} className="text-white/25" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {showStandorte && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 pb-1 px-2 space-y-4">
                            {/* Bayern overview link */}
                            <motion.button
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.06 }}
                              onClick={() => go('/bayern')}
                              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.07] transition-all group"
                              whileTap={{ scale: 0.985 }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-white/30" />
                                <span className="text-[13px] font-semibold text-white/70 uppercase tracking-wider">
                                  Bayern – Alle Standorte
                                </span>
                              </div>
                              <ArrowRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
                            </motion.button>

                            {/* Cities */}
                            {cityEntries.map(([slug, cityData], cityIndex) => (
                              <motion.div
                                key={slug}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.08 + cityIndex * 0.05 }}
                              >
                                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.12em] px-4 mb-1.5">
                                  {cityData.label}
                                </p>
                                <div className="space-y-0.5">
                                  {cityData.services.map((service) => {
                                    const isActive = location.pathname === service.href;
                                    return (
                                      <button
                                        key={service.href}
                                        onClick={() => go(service.href)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                                          isActive
                                            ? 'bg-white/[0.07] text-white'
                                            : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                                        }`}
                                      >
                                        <div className={`w-1 h-1 rounded-full flex-shrink-0 ${
                                          isActive ? 'bg-white/60' : 'bg-white/15'
                                        }`} />
                                        <span className="text-[13px] font-medium">{service.label}</span>
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

                {/* BOTTOM CTA */}
                <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-white/[0.04]">
                  <motion.button
                    onClick={() => go('/kontakt')}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-gray-950 font-semibold text-[15px] tracking-tight hover:bg-white/90 transition-colors active:scale-[0.98]"
                    whileTap={{ scale: 0.98 }}
                  >
                    Erstgespräch vereinbaren
                    <ArrowRight size={16} />
                  </motion.button>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
