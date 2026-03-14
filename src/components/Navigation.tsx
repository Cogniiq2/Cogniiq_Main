import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { Logo } from './Logo';
import { PremiumMobileNav } from './ui/premium-mobile-nav';

const ease = [0.22, 1, 0.36, 1] as const;

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const location = useLocation();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setActiveMenu(null);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const openMenu = (name: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(name);
  };

  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const simpleItems = [
    { label: 'Über uns', href: '/ueber-uns' },
    { label: 'FAQ', href: '/faq' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/[0.97] dark:bg-gray-950/[0.97] backdrop-blur-xl border-b border-gray-100/80 dark:border-white/[0.05] shadow-[0_1px_0_0_rgba(0,0,0,0.04)]'
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Hauptnavigation"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">

            {/* LOGO */}
            <Link to="/" aria-label="Cogniiq Startseite">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center"
              >
                <Logo className="h-9" />
              </motion.div>
            </Link>

            {/* CENTER NAV */}
            <motion.div
              className="hidden lg:flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              {/* LEISTUNGEN MEGA */}
              <NavDropdownTrigger
                label="Leistungen"
                isActive={
                  location.pathname.startsWith('/webdesign') ||
                  location.pathname.startsWith('/ki-') ||
                  location.pathname.startsWith('/automatisierung') ||
                  location.pathname === '/leistungen'
                }
                isOpen={activeMenu === 'leistungen'}
                onOpen={() => openMenu('leistungen')}
                onClose={closeMenu}
              />

              {/* STANDORTE MEGA */}
              <NavDropdownTrigger
                label="Standorte"
                isActive={
                  location.pathname.startsWith('/bayreuth') ||
                  location.pathname.startsWith('/muenchen') ||
                  location.pathname.startsWith('/regensburg') ||
                  location.pathname === '/bayern' ||
                  location.pathname === '/deutschland'
                }
                isOpen={activeMenu === 'standorte'}
                onOpen={() => openMenu('standorte')}
                onClose={closeMenu}
              />

              {simpleItems.map((item) => (
                <SimpleNavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  isActive={location.pathname === item.href}
                />
              ))}
            </motion.div>

            {/* RIGHT CTA */}
            <motion.div
              className="hidden lg:flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Link
                to="/referenzen"
                className={`text-[13px] font-medium tracking-wide transition-colors duration-200 px-4 py-2 ${
                  location.pathname === '/referenzen'
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Referenzen
              </Link>
              <Link
                to="/kontakt"
                className="group relative flex items-center gap-1.5 px-5 py-2.5 bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-[13px] font-semibold tracking-wide rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:scale-[1.02] active:scale-[0.99]"
              >
                <span className="relative z-10">Kontakt</span>
                <ArrowUpRight size={13} className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                <div className="absolute inset-0 bg-gray-800 dark:bg-gray-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </Link>
            </motion.div>

          </div>
        </div>

        {/* MEGA MENU PANELS */}
        <AnimatePresence>
          {activeMenu === 'leistungen' && (
            <LeistungenMega
              onMouseEnter={cancelClose}
              onMouseLeave={closeMenu}
            />
          )}
          {activeMenu === 'standorte' && (
            <StandorteMega
              onMouseEnter={cancelClose}
              onMouseLeave={closeMenu}
            />
          )}
        </AnimatePresence>
      </motion.nav>

      <PremiumMobileNav />
    </>
  );
}

/* ─── Simple nav item ─────────────────────────────────────────────────── */
function SimpleNavItem({ label, href, isActive }: { label: string; href: string; isActive: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative px-4 py-2 group"
    >
      <span className={`text-[13px] font-medium tracking-wide transition-colors duration-200 ${
        isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
      }`}>
        {label}
      </span>
      <motion.div
        className="absolute bottom-0 left-4 right-4 h-[1px] bg-gray-900 dark:bg-gray-100 origin-left"
        animate={{ scaleX: isActive ? 1 : hovered ? 1 : 0, opacity: isActive ? 1 : hovered ? 0.4 : 0 }}
        transition={{ duration: 0.25, ease }}
      />
    </Link>
  );
}

/* ─── Dropdown trigger ────────────────────────────────────────────────── */
function NavDropdownTrigger({
  label, isActive, isOpen, onOpen, onClose,
}: {
  label: string; isActive: boolean; isOpen: boolean;
  onOpen: () => void; onClose: () => void;
}) {
  return (
    <button
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      className="relative flex items-center gap-1 px-4 py-2 group"
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <span className={`text-[13px] font-medium tracking-wide transition-colors duration-200 ${
        isActive || isOpen ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'
      }`}>
        {label}
      </span>
      <ChevronDown
        size={12}
        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      />
      <div className={`absolute bottom-0 left-4 right-4 h-[1px] bg-gray-900 dark:bg-gray-100 origin-left transition-all duration-200 ${
        isActive || isOpen ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
      }`} />
    </button>
  );
}

/* ─── Leistungen Mega Menu ────────────────────────────────────────────── */
function LeistungenMega({ onMouseEnter, onMouseLeave }: { onMouseEnter: () => void; onMouseLeave: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute top-full left-0 right-0 bg-white/[0.98] dark:bg-gray-950/[0.98] backdrop-blur-xl border-b border-gray-100 dark:border-white/[0.05] shadow-[0_16px_48px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-4 gap-8">

          {/* Webdesign */}
          <MegaColumn
            label="Webdesign"
            href="/leistungen"
            description="Websites die konvertieren"
            items={[
              { label: 'Webdesign Agentur Deutschland', href: '/webdesign-agentur-deutschland', featured: true },
              { label: 'Für Arztpraxen', href: '/webdesign-arzt' },
              { label: 'Für Gastronomie', href: '/webdesign-gastronomie' },
              { label: 'Für Immobilien', href: '/webdesign-immobilien' },
              { label: 'Für Hotels', href: '/webdesign-hotel' },
              { label: 'Für Sport & Fitness', href: '/webdesign-sport' },
              { label: 'Kosten & Preise', href: '/kosten-webdesign', small: true },
            ]}
          />

          {/* KI-Telefonassistent */}
          <MegaColumn
            label="KI-Telefonassistent"
            href="/ki-telefonassistent"
            description="24/7 automatisch erreichbar"
            items={[
              { label: 'KI-Agentur Deutschland', href: '/ki-agentur-deutschland', featured: true },
              { label: 'Für Arztpraxen', href: '/ki-telefonassistent-arzt' },
              { label: 'Für Restaurants', href: '/ki-telefonassistent-restaurant' },
              { label: 'Für Hotels', href: '/ki-telefonassistent-hotel' },
              { label: 'Für Zahnarzt & Praxis', href: '/ki-telefonassistent-praxis' },
              { label: 'Demo anhören', href: '/ki-telefonassistent/demo' },
              { label: 'Kosten & Preise', href: '/kosten-ki-telefonassistent', small: true },
            ]}
          />

          {/* Automatisierung */}
          <MegaColumn
            label="Automatisierung"
            href="/automatisierung-unternehmen"
            description="Prozesse auf Autopilot"
            items={[
              { label: 'Automatisierung Unternehmen', href: '/automatisierung-unternehmen', featured: true },
              { label: 'Für Restaurants', href: '/automatisierung-restaurant' },
              { label: 'Für Arztpraxen', href: '/automatisierung-arzt' },
              { label: 'Für Immobilien', href: '/automatisierung-immobilien' },
              { label: 'Für Sport & Fitness', href: '/automatisierung-sport' },
              { label: 'Kosten & Preise', href: '/kosten-automatisierung', small: true },
            ]}
          />

          {/* Probleme / Über */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600 mb-4">Ihr Problem</p>
            <div className="space-y-0.5 mb-6">
              {[
                { label: 'Verpasste Anrufe', href: '/verpasste-anrufe-verlust' },
                { label: 'Keine Anfragen von der Website', href: '/keine-anfragen-website' },
                { label: 'Keine Online-Terminbuchung', href: '/keine-terminbuchung-online' },
                { label: 'Zu viel manuelle Arbeit', href: '/zu-viel-manuelle-arbeit' },
                { label: 'Digitalisierung starten', href: '/digitale-automatisierung-unternehmen' },
              ].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all group"
                >
                  <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0 group-hover:bg-gray-500 dark:group-hover:bg-gray-400 transition-colors" />
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-100 dark:border-white/[0.05] pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600 mb-3">Unternehmen</p>
              <div className="space-y-0.5">
                {[
                  { label: 'Leistungen', href: '/leistungen' },
                  { label: 'Über uns', href: '/ueber-uns' },
                  { label: 'Referenzen', href: '/referenzen' },
                  { label: 'Bewertungen', href: '/bewertungen' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0 group-hover:bg-gray-500 dark:group-hover:bg-gray-400 transition-colors" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

/* ─── Standorte Mega Menu ─────────────────────────────────────────────── */
function StandorteMega({ onMouseEnter, onMouseLeave }: { onMouseEnter: () => void; onMouseLeave: () => void }) {
  const cities = [
    {
      label: 'Bayreuth',
      overview: '/bayreuth',
      services: [
        { label: 'Webdesign Bayreuth', href: '/bayreuth/webdesign' },
        { label: 'KI-Telefonassistent', href: '/bayreuth/ki-telefonassistent' },
        { label: 'Automatisierung', href: '/bayreuth/automatisierung' },
        { label: 'Website erstellen', href: '/bayreuth/website-erstellen' },
        { label: 'Landingpage', href: '/bayreuth/landingpage' },
        { label: 'Lokales SEO', href: '/bayreuth/lokales-seo' },
      ],
      industries: [
        { label: 'Arztpraxis Webdesign', href: '/webdesign-arzt-bayreuth' },
        { label: 'Gastronomie Webdesign', href: '/webdesign-gastronomie-bayreuth' },
        { label: 'Immobilien Webdesign', href: '/webdesign-immobilien-bayreuth' },
      ],
    },
    {
      label: 'München',
      overview: '/muenchen',
      services: [
        { label: 'Webdesign München', href: '/muenchen/webdesign' },
        { label: 'KI-Telefonassistent', href: '/muenchen/ki-telefonassistent' },
        { label: 'Automatisierung', href: '/muenchen/automatisierung' },
        { label: 'Website erstellen', href: '/muenchen/website-erstellen' },
        { label: 'Landingpage', href: '/muenchen/landingpage' },
        { label: 'Lokales SEO', href: '/muenchen/lokales-seo' },
      ],
      industries: [
        { label: 'Arztpraxis Webdesign', href: '/webdesign-arzt-muenchen' },
        { label: 'Gastronomie Webdesign', href: '/webdesign-gastronomie-muenchen' },
        { label: 'Immobilien Webdesign', href: '/webdesign-immobilien-muenchen' },
      ],
    },
    {
      label: 'Regensburg',
      overview: '/regensburg',
      services: [
        { label: 'Webdesign Regensburg', href: '/regensburg/webdesign' },
        { label: 'KI-Telefonassistent', href: '/regensburg/ki-telefonassistent' },
        { label: 'Automatisierung', href: '/regensburg/automatisierung' },
        { label: 'Website erstellen', href: '/regensburg/website-erstellen' },
        { label: 'Landingpage', href: '/regensburg/landingpage' },
        { label: 'Lokales SEO', href: '/regensburg/lokales-seo' },
      ],
      industries: [
        { label: 'Arztpraxis Webdesign', href: '/webdesign-arzt-regensburg' },
        { label: 'Gastronomie Webdesign', href: '/webdesign-gastronomie-regensburg' },
        { label: 'Immobilien Webdesign', href: '/webdesign-immobilien-regensburg' },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute top-full left-0 right-0 bg-white/[0.98] dark:bg-gray-950/[0.98] backdrop-blur-xl border-b border-gray-100 dark:border-white/[0.05] shadow-[0_16px_48px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-4 gap-8">

          {/* Overview column */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600 mb-4">Region</p>
            <div className="space-y-1 mb-6">
              <Link
                to="/deutschland"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:hover:border-white/[0.1] hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-all group"
              >
                <div>
                  <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">Deutschland</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-600">Bundesweit</p>
                </div>
                <ArrowUpRight size={13} className="text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
              </Link>
              <Link
                to="/bayern"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:hover:border-white/[0.1] hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-all group"
              >
                <div>
                  <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">Bayern</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-600">Alle Standorte</p>
                </div>
                <ArrowUpRight size={13} className="text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
              </Link>
            </div>
            <div className="border-t border-gray-100 dark:border-white/[0.05] pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600 mb-3">Bayern KI</p>
              <Link
                to="/bayern/ki-telefonassistent"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all group"
              >
                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                KI-Telefonassistent Bayern
              </Link>
            </div>
          </div>

          {/* City columns */}
          {cities.map((city) => (
            <div key={city.label}>
              <Link
                to={city.overview}
                className="group flex items-center gap-1.5 mb-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                  {city.label}
                </p>
                <ArrowUpRight size={10} className="text-gray-300 dark:text-gray-700 group-hover:text-gray-500 transition-colors" />
              </Link>

              <div className="space-y-0.5 mb-4">
                {city.services.map((s) => (
                  <Link
                    key={s.href}
                    to={s.href}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0 group-hover:bg-gray-500 dark:group-hover:bg-gray-400 transition-colors" />
                    {s.label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-gray-100 dark:border-white/[0.05] pt-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-300 dark:text-gray-700 mb-2 px-2">Branchen</p>
                {city.industries.map((ind) => (
                  <Link
                    key={ind.href}
                    to={ind.href}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
                  >
                    <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
                    {ind.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>
    </motion.div>
  );
}

/* ─── Mega Column ─────────────────────────────────────────────────────── */
function MegaColumn({
  label, href, description, items,
}: {
  label: string;
  href: string;
  description: string;
  items: { label: string; href: string; featured?: boolean; small?: boolean }[];
}) {
  return (
    <div>
      <Link to={href} className="group block mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors mb-0.5">
          {label}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-600">{description}</p>
      </Link>
      <div className="space-y-0.5">
        {items.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group ${
              item.featured
                ? 'text-[12.5px] font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                : item.small
                ? 'text-[11.5px] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                : 'text-[12.5px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
            }`}
          >
            <div className={`w-1 h-1 rounded-full flex-shrink-0 transition-colors ${
              item.featured
                ? 'bg-gray-400 dark:bg-gray-500 group-hover:bg-gray-600 dark:group-hover:bg-gray-300'
                : item.small
                ? 'bg-gray-200 dark:bg-gray-800'
                : 'bg-gray-300 dark:bg-gray-700 group-hover:bg-gray-500 dark:group-hover:bg-gray-400'
            }`} />
            {item.label}
            {item.featured && (
              <ArrowUpRight size={10} className="ml-auto text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
