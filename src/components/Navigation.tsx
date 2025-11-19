<div className="max-w-7xl mx-auto px-6 lg:px-8">
  <div className="flex items-center justify-between h-20">

    {/* LEFT — LOGO (NOW FLUSH LEFT) */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="flex items-center justify-start flex-1"
    >
      <img
        src="/COGNI IQ.png"
        alt="CogniIQ"
        className="h-29 w-auto"
      />
    </motion.div>

    {/* RIGHT — NAVIGATION */}
    <div className="hidden lg:flex items-center gap-8">
      {navItems.map((item, index) => (
        <motion.a
          key={item.href}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
          href={item.href}
          onClick={(e) => {
            e.preventDefault();
            handleNavClick(item.href);
          }}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          {item.label}
        </motion.a>
      ))}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={() => handleNavClick('#kontakt')}
          className="bg-gradient-to-r from-[#D4AF37] to-[#F4E5B0] hover:opacity-90 transition-opacity text-[#1a1a1a] font-semibold"
          aria-label="Kostenloses Erstgespräch buchen"
        >
          Erstgespräch
        </Button>
      </motion.div>
    </div>

    {/* MOBILE MENU BUTTON */}
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
