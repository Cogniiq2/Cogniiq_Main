/**
 * LOCAL SEO IMPLEMENTATION EXAMPLE
 *
 * This file shows how to integrate the local SEO components into your App.tsx
 * Copy and adapt the relevant parts to your main application file.
 */

import { LocalBusinessSchema } from './components/LocalBusinessSchema';
import { LocationContent } from './components/LocationContent';
import { NAP } from './components/NAP';

// ============================================
// EXAMPLE 1: Add to App.tsx (Main Component)
// ============================================

export function App() {
  return (
    <>
      {/* Add this at the top of your app to inject structured data */}
      <LocalBusinessSchema />

      {/* Your existing sections */}
      <HeroSection />
      <ServicesSection />
      <CasesSection />

      {/* Add location content section (recommended placement) */}
      <LocationContent />

      <TrustSection />
      <ProcessSection />
      <AboutSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </>
  );
}

// ============================================
// EXAMPLE 2: Using NAP Component
// ============================================

// In Footer (already implemented)
function Footer() {
  return (
    <footer>
      <div>
        <h4>Kontakt</h4>
        <NAP variant="vertical" showIcons={true} />
      </div>
    </footer>
  );
}

// In Contact Section
function ContactSection() {
  return (
    <section>
      <h2>Kontaktieren Sie uns</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3>Unsere Kontaktdaten</h3>
          <NAP variant="vertical" showIcons={true} />
        </div>
        <div>
          {/* Contact form */}
        </div>
      </div>
    </section>
  );
}

// In Header (compact version)
export function Header() {
  return (
    <header>
      <nav>
        {/* Logo and navigation */}
      </nav>
      <div className="header-contact">
        <NAP variant="compact" showIcons={false} />
      </div>
    </header>
  );
}

// ============================================
// EXAMPLE 3: Using Business Data
// ============================================

import { BUSINESS_INFO, getGoogleMapsUrl, formatAddress } from '@/lib/seo-data';

export function CustomSection() {
  return (
    <div>
      {/* Display business name */}
      <h1>{BUSINESS_INFO.name}</h1>

      {/* Display description */}
      <p>{BUSINESS_INFO.description}</p>

      {/* Display formatted address */}
      <p>{formatAddress(true)}</p>

      {/* Link to Google Maps */}
      <a href={getGoogleMapsUrl()} target="_blank" rel="noopener">
        Finden Sie uns auf Google Maps
      </a>

      {/* Display email */}
      <a href={`mailto:${BUSINESS_INFO.contact.email}`}>
        {BUSINESS_INFO.contact.email}
      </a>

      {/* Display phone */}
      <a href={`tel:${BUSINESS_INFO.contact.phone}`}>
        {BUSINESS_INFO.contact.phoneDisplay}
      </a>
    </div>
  );
}

// ============================================
// EXAMPLE 4: Generating Metadata (for future use)
// ============================================

import {
  generateLocationMetadata,
  generateServiceMetadata,
  generateGeoMetaTags
} from '@/lib/seo-metadata';

// For homepage
const homepageMetadata = generateLocationMetadata();
console.log(homepageMetadata.title);
console.log(homepageMetadata.description);

// For service page
export const serviceMetadata = generateServiceMetadata(
  'AI Automationen',
  'Automatisieren Sie wiederkehrende Aufgaben'
);

// Get geo meta tags
export const geoTags = generateGeoMetaTags();

// ============================================
// EXAMPLE 5: Google Business Integration
// ============================================

import {
  GOOGLE_BUSINESS_SETUP_GUIDE,
  generateGooglePostsContent,
  getLocalBusinessCitations
} from '@/lib/google-business-integration';

// Access setup guide
export function AdminPanel() {
  return (
    <div>
      <h2>Google Business Setup Guide</h2>
      {GOOGLE_BUSINESS_SETUP_GUIDE.steps.map((step) => (
        <div key={step.step}>
          <h3>Step {step.step}: {step.title}</h3>
          <p>{step.description}</p>
        </div>
      ))}

      <h2>Best Practices</h2>
      <ul>
        {GOOGLE_BUSINESS_SETUP_GUIDE.bestPractices.map((practice, i) => (
          <li key={i}>{practice}</li>
        ))}
      </ul>
    </div>
  );
}

// Generate post content for Google Business
const posts = generateGooglePostsContent();
console.log('Weekly posts for Google Business:', posts.services);

// Get citation opportunities
const citations = getLocalBusinessCitations();
console.log('Submit business to:', citations);

// ============================================
// EXAMPLE 6: Location-Specific Landing Page
// ============================================

export function LocationPage() {
  return (
    <div>
      <section>
        <h1>AI Agentur & Webdesign in Bayreuth</h1>
        <p>
          {BUSINESS_INFO.name} ist Ihre lokale AI Agentur und Webdesign Agentur
          in {BUSINESS_INFO.address.addressLocality}. Mit unserem Büro in der{' '}
          {BUSINESS_INFO.address.streetAddress} betreuen wir Unternehmen in ganz{' '}
          {BUSINESS_INFO.address.addressRegion} und Deutschland.
        </p>
      </section>

      <LocationContent />

      <section>
        <h2>Kontaktieren Sie uns</h2>
        <NAP variant="vertical" showIcons={true} />
      </section>
    </div>
  );
}

// ============================================
// RECOMMENDED IMPLEMENTATION ORDER
// ============================================

/**
 * 1. Add LocalBusinessSchema to App.tsx (top level)
 *    ✅ This injects all structured data
 *
 * 2. NAP component already integrated in Footer
 *    ✅ Ensures consistent contact info display
 *
 * 3. Add LocationContent section to homepage
 *    📍 Recommended after ServicesSection or TrustSection
 *
 * 4. Setup Google Business Profile
 *    🔗 Follow guide in google-business-integration.ts
 *
 * 5. Submit to other directories
 *    📋 Use getLocalBusinessCitations() for list
 *
 * 6. Create location-specific blog content
 *    📝 Use BUSINESS_INFO data for consistency
 *
 * 7. Monitor and optimize
 *    📊 Track Google Business Profile insights
 */

export {};
