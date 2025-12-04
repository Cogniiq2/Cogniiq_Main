import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Logo } from './Logo';

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    { label: 'Leistungen', href: '/leistungen' },
    { label: 'Cases', href: '/cases' },
    { label: 'Ablauf', href: '/ablauf' },
    { label: 'Über uns', href: '/ueber-uns' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Kontakt', href: '/kontakt' },
  ];

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
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
                className="flex items-center"
              >
                <Logo className="h-12" />
              </motion.div>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link
                    to={item.href}
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'text-gray-900'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={() => handleNavClick('/kontakt')}
                  aria-label="Kostenloses Erstgespräch buchen"
                >
                  Erstgespräch
                </Button>
              </motion.div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-gray-900 p-2"
              aria-label="Menü öffnen"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          className="fixed inset-0 z-40 lg:hidden bg-white pt-20"
        >
          <div className="flex flex-col items-center gap-6 p-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-lg font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'text-gray-900'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Button
              onClick={() => handleNavClick('/kontakt')}
              className="mt-4"
              aria-label="Kostenloses Erstgespräch buchen"
            >
              Erstgespräch
            </Button>
          </div>
        </motion.div>
      )}
    </>
  );
}
