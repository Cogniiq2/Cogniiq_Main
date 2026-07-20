import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Chrome as Home, Briefcase, Users, CircleHelp as HelpCircle, Mail, MapPin, ChevronDown, X, ArrowRight, ArrowUpRight, Star, BookOpen, UserRound } from 'lucide-react';
import { CITY_LINKS } from '@/lib/standorte-data';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

const leistungenItems = [
  {
    group: 'Webdesign',
    links: [
      { label: 'Webdesign Agentur Deutschland', href: '/webdesign-agentur-deutschland' },
      { label: 'Für Arztpraxen', href: '/webdesign-arzt' },
      { label: 'Für Gastronomie', href: '/webdesign-gastronomie' },
      { label: 'Für Immobilien', href: '/webdesign-immobilien' },
      { label: 'Für Hotels', href: '/webdesign-hotel' },
      { label: 'Für Sport & Fitness', href: '/webdesign-sport' },
      { label: 'Kosten Webdesign', href: '/kosten-webdesign' },
    ],
  },
  {
    group: 'KI-Telefonassistent',
    links: [
      { label: 'KI-Agentur Deutschland', href: '/ki-agentur-deutschland' },
      { label: 'Für Arztpraxen', href: '/ki-telefonassistent-arzt' },
      { label: 'Für Restaurants', href: '/ki-telefonassistent-restaurant' },
      { label: 'Für Hotels', href: '/ki-telefonassistent-hotel' },
      { label: 'Für Zahnarzt & Praxis', href: '/ki-telefonassistent-praxis' },
      { label: 'Demo anhören', href: '/ki-telefonassistent/demo' },
      { label: 'Kosten KI-Telefonassistent', href: '/kosten-ki-telefonassistent' },
    ],
  },
  {
    group: 'Automatisierung',
    links: [
      { label: 'Automatisierung Unternehmen', href: '/automatisierung-unternehmen' },
      { label: 'Für Restaurants', href: '/automatisierung-restaurant' },
      { label: 'Für Arztpraxen', href: '/automatisierung-arzt' },
      { label: 'Für Immobilien', href: '/automatisierung-immobilien' },
      { label: 'Für Sport & Fitness', href: '/automatisierung-sport' },
      { label: 'Kosten Automatisierung', href: '/kosten-automatisierung' },
    ],
  },
];

const cityEntries = Object.entries(CITY_LINKS) as Array<[string, typeof CITY_LINKS[keyof typeof CITY_LINKS]]>;

type NavSection = 'home' | 'leistungen' | 'standorte' | 'ueber-uns' | 'faq' | 'referenzen' | 'blog' | 'kontakt';

const pillItems: { id: NavSection; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'leistungen', label: 'Leistungen' },
  { id: 'standorte', label: 'Standorte' },
  { id: 'ueber-uns', label: 'Über uns' },
  { id: 'faq', label: 'FAQ' },
  { id: 'referenzen', label: 'Referenzen' },
  { id: 'blog', label: 'Blog' },
  { id: 'kontakt', label: 'Kontakt' },
];

function getActiveSection(pathname: string): NavSection {
  if (pathname === '/') return 'home';
  if (
    pathname.startsWith('/webdesign') ||
    pathname.startsWith('/ki-') ||
    pathname.startsWith('/automatisierung') ||
    pathname.startsWith('/kosten-') ||
    pathname === '/leistungen'
  ) return 'leistungen';
  if (
    pathname.startsWith('/bayreuth') ||
    pathname.startsWith('/regensburg') ||
    pathname.startsWith('/muenchen') ||
    pathname === '/bayern' ||
    pathname === '/deutschland'
  ) return 'standorte';
  if (pathname === '/ueber-uns') return 'ueber-uns';
  if (pathname === '/faq') return 'faq';
  if (pathname === '/referenzen') return 'referenzen';
  if (pathname.startsWith('/blog')) return 'blog';
  if (pathname === '/kontakt') return 'kontakt';
  return 'home';
}

export function PremiumMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLeistungen, setShowLeistungen] = useState(false);
  const [showStandorte, setShowStandorte] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const activeSection = getActiveSection(location.pathname);
  const customerNav = {
    label: !isLoading && user ? 'Dashboard' : 'Kundenlogin',
    href: !isLoading && user ? '/app' : '/app/login',
  };

  useEffect(() => {
    setIsOpen(false);
    setShowLeistungen(false);
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

  const currentLabel = pillItems.find(i => i.id === activeSection)?.label ?? 'Menu';

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
              {pillItems.map((item) => (
                <motion.div
                  key={item.id}
                  className="rounded-full"
                  animate={{
                    width: activeSection === item.id ? 16 : 4,
                    backgroundColor: activeSection === item.id ? '#ffffff' : '#4b5563',
                    height: 4,
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                />
              ))}
            </div>
            <div className="w-px h-3.5 bg-white/10" />
            <span className="text-[13px] font-medium text-white/90 tracking-wide">
              {currentLabel}
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
                  <Logo className="h-7" variant="light" />
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

                  <nav className="space-y-0.5 mb-4">

                    {/* HOME */}
                    <NavRow
                      icon={Home}
                      label="Home"
                      isActive={activeSection === 'home'}
                      delay={0}
                      onClick={() => go('/')}
                    />

                    {/* LEISTUNGEN — expandable */}
                    <ExpandableRow
                      icon={Briefcase}
                      label="Leistungen"
                      isActive={activeSection === 'leistungen'}
                      isOpen={showLeistungen}
                      delay={0.04}
                      onToggle={() => setShowLeistungen(!showLeistungen)}
                    >
                      <div className="pt-2 pb-1 px-2 space-y-4">
                        {leistungenItems.map((group, gi) => (
                          <motion.div
                            key={group.group}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.05 + gi * 0.04 }}
                          >
                            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.12em] px-4 mb-1.5">
                              {group.group}
                            </p>
                            <div className="space-y-0.5">
                              {group.links.map((link) => {
                                const active = location.pathname === link.href;
                                return (
                                  <button
                                    key={link.href}
                                    onClick={() => go(link.href)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                                      active
                                        ? 'bg-white/[0.07] text-white'
                                        : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                                    }`}
                                  >
                                    <div className={`w-1 h-1 rounded-full flex-shrink-0 ${active ? 'bg-white/60' : 'bg-white/15'}`} />
                                    <span className="text-[13px] font-medium text-left">{link.label}</span>
                                    <ArrowUpRight size={11} className="ml-auto text-white/15 flex-shrink-0" />
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ExpandableRow>

                    {/* STANDORTE — expandable */}
                    <ExpandableRow
                      icon={MapPin}
                      label="Standorte"
                      isActive={activeSection === 'standorte'}
                      isOpen={showStandorte}
                      delay={0.08}
                      onToggle={() => setShowStandorte(!showStandorte)}
                    >
                      <div className="pt-2 pb-1 px-2 space-y-4">
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
                                const active = location.pathname === service.href;
                                return (
                                  <button
                                    key={service.href}
                                    onClick={() => go(service.href)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                                      active
                                        ? 'bg-white/[0.07] text-white'
                                        : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                                    }`}
                                  >
                                    <div className={`w-1 h-1 rounded-full flex-shrink-0 ${active ? 'bg-white/60' : 'bg-white/15'}`} />
                                    <span className="text-[13px] font-medium">{service.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ExpandableRow>

                    {/* DIVIDER */}
                    <div className="h-px bg-white/[0.05] mx-4 my-2" />

                    {/* ÜBER UNS */}
                    <NavRow
                      icon={Users}
                      label="Über uns"
                      isActive={activeSection === 'ueber-uns'}
                      delay={0.12}
                      onClick={() => go('/ueber-uns')}
                    />

                    {/* FAQ */}
                    <NavRow
                      icon={HelpCircle}
                      label="FAQ"
                      isActive={activeSection === 'faq'}
                      delay={0.16}
                      onClick={() => go('/faq')}
                    />

                    {/* REFERENZEN */}
                    <NavRow
                      icon={Star}
                      label="Referenzen"
                      isActive={activeSection === 'referenzen'}
                      delay={0.20}
                      onClick={() => go('/referenzen')}
                    />

                    {/* BLOG */}
                    <NavRow
                      icon={BookOpen}
                      label="Blog"
                      isActive={activeSection === 'blog'}
                      delay={0.22}
                      onClick={() => go('/blog')}
                    />

                    <NavRow
                      icon={UserRound}
                      label={customerNav.label}
                      isActive={false}
                      delay={0.24}
                      onClick={() => go(customerNav.href)}
                    />

                    {/* KONTAKT */}
                    <NavRow
                      icon={Mail}
                      label="Kontakt"
                      isActive={activeSection === 'kontakt'}
                      delay={0.28}
                      onClick={() => go('/kontakt')}
                    />

                  </nav>
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

function NavRow({
  icon: Icon,
  label,
  isActive,
  delay,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  delay: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
        isActive ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
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
        {label}
      </span>
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
          >
            <div className="w-1 h-1 rounded-full bg-white/60" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function ExpandableRow({
  icon: Icon,
  label,
  isActive,
  isOpen,
  delay,
  onToggle,
  children,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isOpen: boolean;
  delay: number;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <motion.button
        onClick={onToggle}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.28 }}
        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
          isActive ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
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
          {label}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
          <ChevronDown size={16} className="text-white/25" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
