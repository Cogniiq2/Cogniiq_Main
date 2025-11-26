import { PageReveal } from './components/PageReveal';
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
    <PageReveal>
      <div className="min-h-screen bg-background text-foreground">
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
    </PageReveal>
  );
}

export default App;
