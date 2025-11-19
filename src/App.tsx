import { motion } from 'framer-motion';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { TrustSection } from './components/TrustSection';
import { ServicesSection } from './components/ServicesSection';
import { CasesSection } from './components/CasesSection';
import { ProcessSection } from './components/ProcessSection';
import { AboutSection } from './components/AboutSection';
import { FAQSection } from './components/FAQSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';

function App() {
  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="iqclip" clipPathUnits="objectBoundingBox">
            <path d="M 0.68,0.2 L 0.72,0.2 L 0.72,0.8 L 0.68,0.8 Z M 0.76,0.2 Q 0.88,0.2 0.88,0.45 Q 0.88,0.55 0.85,0.62 L 0.92,0.8 L 0.82,0.8 L 0.78,0.65 Q 0.76,0.65 0.76,0.65 Q 0.76,0.55 0.76,0.55 Q 0.84,0.55 0.84,0.45 Q 0.84,0.35 0.76,0.35 L 0.76,0.8 L 0.76,0.2 Z" />
          </clipPath>
        </defs>
      </svg>
      <motion.div
        initial={{ clipPath: "circle(0% at 75% 50%)" }}
        animate={{ clipPath: "circle(150% at 75% 50%)" }}
        transition={{
          duration: 1.6,
          ease: [0.19, 1, 0.22, 1],
          delay: 0.1
        }}
        style={{ willChange: 'clip-path' }}
      >
        <div className="min-h-screen bg-[#fafafa] text-gray-900">
          <Navigation />
          <HeroSection />
          <TrustSection />
          <ServicesSection />
          <CasesSection />
          <ProcessSection />
          <AboutSection />
          <FAQSection />
          <ContactSection />
          <Footer />
        </div>
      </motion.div>
    </>
  );
}

export default App;
