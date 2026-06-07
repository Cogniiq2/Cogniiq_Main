import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PageReveal } from './components/PageReveal';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { PremiumFooterReveal } from './components/PremiumFooterReveal';
import { LocalBusinessSchema } from './components/LocalBusinessSchema';
import { CanonicalManager } from './components/CanonicalManager';
import { CityServicePage } from './components/CityServicePage';
import { HomePage } from './pages/HomePage';
import { LeistungenPage } from './pages/LeistungenPage';
import { UeberUnsPage } from './pages/UeberUnsPage';
import { FAQPage } from './pages/FAQPage';
import { KontaktPage } from './pages/KontaktPage';
import { BayernPage } from './pages/BayernPage';
import { DeutschlandPage } from './pages/DeutschlandPage';
import { CityLandingPage } from './pages/CityLandingPage';
import { CITY_SERVICE_CONFIGS } from './lib/standorte-data';
import { WebdesignArztBayreuth } from './pages/WebdesignArztBayreuth';
import { WebdesignGastronomieBayreuth } from './pages/WebdesignGastronomieBayreuth';
import { WebdesignImmobilienBayreuth } from './pages/WebdesignImmobilienBayreuth';
import { WebdesignArztMuenchen } from './pages/WebdesignArztMuenchen';
import { WebdesignGastronomieMuenchen } from './pages/WebdesignGastronomieMuenchen';
import { WebdesignImmobilienMuenchen } from './pages/WebdesignImmobilienMuenchen';
import { WebdesignArztRegensburg } from './pages/WebdesignArztRegensburg';
import { WebdesignGastronomieRegensburg } from './pages/WebdesignGastronomieRegensburg';
import { WebdesignImmobilienRegensburg } from './pages/WebdesignImmobilienRegensburg';
import { WebdesignBayreuth } from './pages/WebdesignBayreuth';
import { WebdesignRegensburg } from './pages/WebdesignRegensburg';
import { WebdesignMuenchen } from './pages/WebdesignMuenchen';
import { ReferenzenPage } from './pages/ReferenzenPage';
import { BewertungenPage } from './pages/BewertungenPage';
import { WebdesignKostenBayreuth } from './pages/cluster/bayreuth/WebdesignKostenBayreuth';
import { WebsiteErstellenBayreuth } from './pages/cluster/bayreuth/WebsiteErstellenBayreuth';
import { LandingpageBayreuth } from './pages/cluster/bayreuth/LandingpageBayreuth';
import { WebsiteRelaunchBayreuth } from './pages/cluster/bayreuth/WebsiteRelaunchBayreuth';
import { LokalesSEOBayreuth } from './pages/cluster/bayreuth/LokalesSEOBayreuth';
import { WebdesignKostenRegensburg } from './pages/cluster/regensburg/WebdesignKostenRegensburg';
import { WebsiteErstellenRegensburg } from './pages/cluster/regensburg/WebsiteErstellenRegensburg';
import { LandingpageRegensburg } from './pages/cluster/regensburg/LandingpageRegensburg';
import { WebsiteRelaunchRegensburg } from './pages/cluster/regensburg/WebsiteRelaunchRegensburg';
import { LokalesSEORegensburg } from './pages/cluster/regensburg/LokalesSEORegensburg';
import { WebdesignKostenMuenchen } from './pages/cluster/muenchen/WebdesignKostenMuenchen';
import { WebsiteErstellenMuenchen } from './pages/cluster/muenchen/WebsiteErstellenMuenchen';
import { LandingpageMuenchen } from './pages/cluster/muenchen/LandingpageMuenchen';
import { WebsiteRelaunchMuenchen } from './pages/cluster/muenchen/WebsiteRelaunchMuenchen';
import { LokalesSEOMuenchen } from './pages/cluster/muenchen/LokalesSEOMuenchen';
import { AnfrageErhaltenPage } from './pages/AnfrageErhaltenPage';
import { KiTelefonassistentPage } from './pages/KiTelefonassistentPage';
import { KiTelefonassistentDemoPage } from './pages/KiTelefonassistentDemoPage';
import { BayernKiTelefonassistentPage } from './pages/BayernKiTelefonassistentPage';
import { KostenWebdesign } from './pages/costs/KostenWebdesign';
import { KostenKiTelefonassistent } from './pages/costs/KostenKiTelefonassistent';
import { KostenAutomatisierung } from './pages/costs/KostenAutomatisierung';
import { WebdesignGastronomie } from './pages/industries/WebdesignGastronomie';
import { WebdesignArzt } from './pages/industries/WebdesignArzt';
import { WebdesignImmobilien } from './pages/industries/WebdesignImmobilien';
import { WebdesignHotel } from './pages/industries/WebdesignHotel';
import { WebdesignSport } from './pages/industries/WebdesignSport';
import { KiTelefonassistentArzt } from './pages/industries/KiTelefonassistentArzt';
import { KiTelefonassistentRestaurant } from './pages/industries/KiTelefonassistentRestaurant';
import { KiTelefonassistentHotel } from './pages/industries/KiTelefonassistentHotel';
import { KiTelefonassistentPraxis } from './pages/industries/KiTelefonassistentPraxis';
import { AutomatisierungRestaurant } from './pages/industries/AutomatisierungRestaurant';
import { AutomatisierungArzt } from './pages/industries/AutomatisierungArzt';
import { AutomatisierungImmobilien } from './pages/industries/AutomatisierungImmobilien';
import { AutomatisierungSport } from './pages/industries/AutomatisierungSport';
import { VerpassteAnrufePage } from './pages/problems/VerpassteAnrufePage';
import { KeineAnfragenWebsitePage } from './pages/problems/KeineAnfragenWebsitePage';
import { KeineTerminbuchungPage } from './pages/problems/KeineTerminbuchungPage';
import { ZuVielManuelleArbeitPage } from './pages/problems/ZuVielManuelleArbeitPage';
import { DigitaleAutomatisierungPage } from './pages/problems/DigitaleAutomatisierungPage';
import { WebdesignAgenturDeutschland } from './pages/pillars/WebdesignAgenturDeutschland';
import { KiAgenturDeutschland } from './pages/pillars/KiAgenturDeutschland';
import { AutomatisierungUnternehmen } from './pages/pillars/AutomatisierungUnternehmen';
import { NotFoundPage } from './pages/NotFoundPage';
import { LogoShowcasePage } from './pages/LogoShowcasePage';
import { BlogIndexPage } from './pages/blog/BlogIndexPage';
import { BlogPostPage } from './pages/blog/BlogPostPage';
import { ScanPage } from './pages/ScanPage';
import { AdminPage } from './pages/AdminPage';
import { useLocation } from 'react-router-dom';

function AppInner() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return <AdminPage />;

  return (
    <PageReveal>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/leistungen" element={<LeistungenPage />} />
          <Route path="/ueber-uns" element={<UeberUnsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/kontakt" element={<KontaktPage />} />
          <Route path="/anfrage-erhalten" element={<AnfrageErhaltenPage />} />
          <Route path="/ki-telefonassistent" element={<KiTelefonassistentPage />} />
          <Route path="/ki-telefonassistent/demo" element={<KiTelefonassistentDemoPage />} />
          <Route path="/bayern/ki-telefonassistent" element={<BayernKiTelefonassistentPage />} />
          <Route path="/bayern" element={<BayernPage />} />
          <Route path="/deutschland" element={<DeutschlandPage />} />
          <Route path="/bayreuth" element={<CityLandingPage citySlug="bayreuth" />} />
          <Route path="/muenchen" element={<CityLandingPage citySlug="muenchen" />} />
          <Route path="/regensburg" element={<CityLandingPage citySlug="regensburg" />} />
          <Route path="/bayreuth/webdesign" element={<WebdesignBayreuth />} />
          <Route path="/regensburg/webdesign" element={<WebdesignRegensburg />} />
          <Route path="/muenchen/webdesign" element={<WebdesignMuenchen />} />
          <Route path="/referenzen" element={<ReferenzenPage />} />
          <Route path="/bewertungen" element={<BewertungenPage />} />
          <Route path="/bayreuth/webdesign-kosten" element={<WebdesignKostenBayreuth />} />
          <Route path="/bayreuth/website-erstellen" element={<WebsiteErstellenBayreuth />} />
          <Route path="/bayreuth/landingpage" element={<LandingpageBayreuth />} />
          <Route path="/bayreuth/website-relaunch" element={<WebsiteRelaunchBayreuth />} />
          <Route path="/bayreuth/lokales-seo" element={<LokalesSEOBayreuth />} />
          <Route path="/regensburg/webdesign-kosten" element={<WebdesignKostenRegensburg />} />
          <Route path="/regensburg/website-erstellen" element={<WebsiteErstellenRegensburg />} />
          <Route path="/regensburg/landingpage" element={<LandingpageRegensburg />} />
          <Route path="/regensburg/website-relaunch" element={<WebsiteRelaunchRegensburg />} />
          <Route path="/regensburg/lokales-seo" element={<LokalesSEORegensburg />} />
          <Route path="/muenchen/webdesign-kosten" element={<WebdesignKostenMuenchen />} />
          <Route path="/muenchen/website-erstellen" element={<WebsiteErstellenMuenchen />} />
          <Route path="/muenchen/landingpage" element={<LandingpageMuenchen />} />
          <Route path="/muenchen/website-relaunch" element={<WebsiteRelaunchMuenchen />} />
          <Route path="/muenchen/lokales-seo" element={<LokalesSEOMuenchen />} />
          <Route path="/webdesign-arzt-bayreuth" element={<WebdesignArztBayreuth />} />
          <Route path="/webdesign-gastronomie-bayreuth" element={<WebdesignGastronomieBayreuth />} />
          <Route path="/webdesign-immobilien-bayreuth" element={<WebdesignImmobilienBayreuth />} />
          <Route path="/webdesign-arzt-muenchen" element={<WebdesignArztMuenchen />} />
          <Route path="/webdesign-gastronomie-muenchen" element={<WebdesignGastronomieMuenchen />} />
          <Route path="/webdesign-immobilien-muenchen" element={<WebdesignImmobilienMuenchen />} />
          <Route path="/webdesign-arzt-regensburg" element={<WebdesignArztRegensburg />} />
          <Route path="/webdesign-gastronomie-regensburg" element={<WebdesignGastronomieRegensburg />} />
          <Route path="/webdesign-immobilien-regensburg" element={<WebdesignImmobilienRegensburg />} />
          {Object.values(CITY_SERVICE_CONFIGS).map((config) => (
            <Route
              key={config.route}
              path={config.route}
              element={<CityServicePage config={config} />}
            />
          ))}
          <Route path="/kosten-webdesign" element={<KostenWebdesign />} />
          <Route path="/kosten-ki-telefonassistent" element={<KostenKiTelefonassistent />} />
          <Route path="/kosten-automatisierung" element={<KostenAutomatisierung />} />
          <Route path="/webdesign-gastronomie" element={<WebdesignGastronomie />} />
          <Route path="/webdesign-arzt" element={<WebdesignArzt />} />
          <Route path="/webdesign-immobilien" element={<WebdesignImmobilien />} />
          <Route path="/webdesign-hotel" element={<WebdesignHotel />} />
          <Route path="/webdesign-sport" element={<WebdesignSport />} />
          <Route path="/ki-telefonassistent-arzt" element={<KiTelefonassistentArzt />} />
          <Route path="/ki-telefonassistent-restaurant" element={<KiTelefonassistentRestaurant />} />
          <Route path="/ki-telefonassistent-hotel" element={<KiTelefonassistentHotel />} />
          <Route path="/ki-telefonassistent-praxis" element={<KiTelefonassistentPraxis />} />
          <Route path="/automatisierung-restaurant" element={<AutomatisierungRestaurant />} />
          <Route path="/automatisierung-arzt" element={<AutomatisierungArzt />} />
          <Route path="/automatisierung-immobilien" element={<AutomatisierungImmobilien />} />
          <Route path="/automatisierung-sport" element={<AutomatisierungSport />} />
          <Route path="/verpasste-anrufe-verlust" element={<VerpassteAnrufePage />} />
          <Route path="/keine-anfragen-website" element={<KeineAnfragenWebsitePage />} />
          <Route path="/keine-terminbuchung-online" element={<KeineTerminbuchungPage />} />
          <Route path="/zu-viel-manuelle-arbeit" element={<ZuVielManuelleArbeitPage />} />
          <Route path="/digitale-automatisierung-unternehmen" element={<DigitaleAutomatisierungPage />} />
          <Route path="/webdesign-agentur-deutschland" element={<WebdesignAgenturDeutschland />} />
          <Route path="/ki-agentur-deutschland" element={<KiAgenturDeutschland />} />
          <Route path="/automatisierung-unternehmen" element={<AutomatisierungUnternehmen />} />
          <Route path="/logo-preview" element={<LogoShowcasePage />} />
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <PremiumFooterReveal>
          <Footer />
        </PremiumFooterReveal>
      </div>
    </PageReveal>
  );
}

function App() {
  return (
    <Router>
      <CanonicalManager />
      <LocalBusinessSchema />
      <AppInner />
    </Router>
  );
}

export default App;
