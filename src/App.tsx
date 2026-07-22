import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Routes, Route, useLocation } from 'react-router-dom';

import { PageReveal } from './components/PageReveal';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { PremiumFooterReveal } from './components/PremiumFooterReveal';
import { LocalBusinessSchema } from './components/LocalBusinessSchema';
import { CanonicalManager } from './components/CanonicalManager';
import { CityServicePage } from './components/CityServicePage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleLandingPage } from './components/auth/RoleLandingPage';
import { LegacyLoginRedirect, LegacyOwnerRedirect } from './components/auth/LegacyRedirects';
import { InternalWorkspaceLayout } from './pages/admin/InternalWorkspace';
import { ReceptionistEntitlementRoute } from './components/app/ReceptionistEntitlementRoute';
import { AuthProvider } from './contexts/AuthContext';
import { CITY_SERVICE_CONFIGS } from './lib/standorte-data';

type LazyPageComponent = ComponentType<Record<string, unknown>>;

function lazyNamed<T extends Record<string, unknown>, K extends keyof T>(
  importer: () => Promise<T>,
  exportName: K
): LazyExoticComponent<LazyPageComponent> {
  return lazy(() =>
    importer().then((module) => ({
      default: module[exportName] as LazyPageComponent,
    }))
  );
}

function PageFallback() {
  return null;
}

const DEFAULT_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function isPrivateSurface(pathname: string) {
  return pathname === '/app' || pathname.startsWith('/app/') || pathname === '/admin' || pathname.startsWith('/admin/')
    || pathname === '/owner' || pathname.startsWith('/owner/');
}

function RouteIndexabilityManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (isPrivateSurface(pathname)) {
      setMeta('robots', 'noindex, nofollow');
      document.title = pathname.startsWith('/admin')
        ? 'Cogniiq Admin'
        : pathname.startsWith('/owner')
          ? 'Cogniiq Owner'
          : 'Cogniiq Kundenbereich';
      return;
    }

    setMeta('robots', DEFAULT_ROBOTS);
  }, [pathname]);

  return null;
}

function PublicStructuredData() {
  const { pathname } = useLocation();
  if (isPrivateSurface(pathname)) return null;
  return <LocalBusinessSchema />;
}

// Core pages
const HomePage = lazyNamed(() => import('./pages/HomePage'), 'HomePage');
const LeistungenPage = lazyNamed(() => import('./pages/LeistungenPage'), 'LeistungenPage');
const UeberUnsPage = lazyNamed(() => import('./pages/UeberUnsPage'), 'UeberUnsPage');
const FAQPage = lazyNamed(() => import('./pages/FAQPage'), 'FAQPage');
const KontaktPage = lazyNamed(() => import('./pages/KontaktPage'), 'KontaktPage');
const AnfrageErhaltenPage = lazyNamed(() => import('./pages/AnfrageErhaltenPage'), 'AnfrageErhaltenPage');

// Location / hub pages
const BayernPage = lazyNamed(() => import('./pages/BayernPage'), 'BayernPage');
const DeutschlandPage = lazyNamed(() => import('./pages/DeutschlandPage'), 'DeutschlandPage');
const CityLandingPage = lazyNamed(() => import('./pages/CityLandingPage'), 'CityLandingPage');
const WebdesignHub = lazyNamed(() => import('./pages/WebdesignHub'), 'WebdesignHub');
const ProzessautomatisierungHub = lazyNamed(
  () => import('./pages/ProzessautomatisierungHub'),
  'ProzessautomatisierungHub'
);

// KI pages
const KiTelefonassistentPage = lazyNamed(
  () => import('./pages/KiTelefonassistentPage'),
  'KiTelefonassistentPage'
);
const KiTelefonassistentDemoPage = lazyNamed(
  () => import('./pages/KiTelefonassistentDemoPage'),
  'KiTelefonassistentDemoPage'
);
const BayernKiTelefonassistentPage = lazyNamed(
  () => import('./pages/BayernKiTelefonassistentPage'),
  'BayernKiTelefonassistentPage'
);

// Webdesign city pages
const WebdesignBayreuth = lazyNamed(() => import('./pages/WebdesignBayreuth'), 'WebdesignBayreuth');
const WebdesignRegensburg = lazyNamed(() => import('./pages/WebdesignRegensburg'), 'WebdesignRegensburg');
const WebdesignMuenchen = lazyNamed(() => import('./pages/WebdesignMuenchen'), 'WebdesignMuenchen');

const WebdesignArztBayreuth = lazyNamed(
  () => import('./pages/WebdesignArztBayreuth'),
  'WebdesignArztBayreuth'
);
const WebdesignGastronomieBayreuth = lazyNamed(
  () => import('./pages/WebdesignGastronomieBayreuth'),
  'WebdesignGastronomieBayreuth'
);
const WebdesignImmobilienBayreuth = lazyNamed(
  () => import('./pages/WebdesignImmobilienBayreuth'),
  'WebdesignImmobilienBayreuth'
);

const WebdesignArztMuenchen = lazyNamed(
  () => import('./pages/WebdesignArztMuenchen'),
  'WebdesignArztMuenchen'
);
const WebdesignGastronomieMuenchen = lazyNamed(
  () => import('./pages/WebdesignGastronomieMuenchen'),
  'WebdesignGastronomieMuenchen'
);
const WebdesignImmobilienMuenchen = lazyNamed(
  () => import('./pages/WebdesignImmobilienMuenchen'),
  'WebdesignImmobilienMuenchen'
);

const WebdesignArztRegensburg = lazyNamed(
  () => import('./pages/WebdesignArztRegensburg'),
  'WebdesignArztRegensburg'
);
const WebdesignGastronomieRegensburg = lazyNamed(
  () => import('./pages/WebdesignGastronomieRegensburg'),
  'WebdesignGastronomieRegensburg'
);
const WebdesignImmobilienRegensburg = lazyNamed(
  () => import('./pages/WebdesignImmobilienRegensburg'),
  'WebdesignImmobilienRegensburg'
);

// Trust / proof pages
const ReferenzenPage = lazyNamed(() => import('./pages/ReferenzenPage'), 'ReferenzenPage');
const BewertungenPage = lazyNamed(() => import('./pages/BewertungenPage'), 'BewertungenPage');

// Bayreuth cluster
const WebdesignKostenBayreuth = lazyNamed(
  () => import('./pages/cluster/bayreuth/WebdesignKostenBayreuth'),
  'WebdesignKostenBayreuth'
);
const WebsiteErstellenBayreuth = lazyNamed(
  () => import('./pages/cluster/bayreuth/WebsiteErstellenBayreuth'),
  'WebsiteErstellenBayreuth'
);
const LandingpageBayreuth = lazyNamed(
  () => import('./pages/cluster/bayreuth/LandingpageBayreuth'),
  'LandingpageBayreuth'
);
const WebsiteRelaunchBayreuth = lazyNamed(
  () => import('./pages/cluster/bayreuth/WebsiteRelaunchBayreuth'),
  'WebsiteRelaunchBayreuth'
);
const LokalesSEOBayreuth = lazyNamed(
  () => import('./pages/cluster/bayreuth/LokalesSEOBayreuth'),
  'LokalesSEOBayreuth'
);

// Regensburg cluster
const WebdesignKostenRegensburg = lazyNamed(
  () => import('./pages/cluster/regensburg/WebdesignKostenRegensburg'),
  'WebdesignKostenRegensburg'
);
const WebsiteErstellenRegensburg = lazyNamed(
  () => import('./pages/cluster/regensburg/WebsiteErstellenRegensburg'),
  'WebsiteErstellenRegensburg'
);
const LandingpageRegensburg = lazyNamed(
  () => import('./pages/cluster/regensburg/LandingpageRegensburg'),
  'LandingpageRegensburg'
);
const WebsiteRelaunchRegensburg = lazyNamed(
  () => import('./pages/cluster/regensburg/WebsiteRelaunchRegensburg'),
  'WebsiteRelaunchRegensburg'
);
const LokalesSEORegensburg = lazyNamed(
  () => import('./pages/cluster/regensburg/LokalesSEORegensburg'),
  'LokalesSEORegensburg'
);

// München cluster
const WebdesignKostenMuenchen = lazyNamed(
  () => import('./pages/cluster/muenchen/WebdesignKostenMuenchen'),
  'WebdesignKostenMuenchen'
);
const WebsiteErstellenMuenchen = lazyNamed(
  () => import('./pages/cluster/muenchen/WebsiteErstellenMuenchen'),
  'WebsiteErstellenMuenchen'
);
const LandingpageMuenchen = lazyNamed(
  () => import('./pages/cluster/muenchen/LandingpageMuenchen'),
  'LandingpageMuenchen'
);
const WebsiteRelaunchMuenchen = lazyNamed(
  () => import('./pages/cluster/muenchen/WebsiteRelaunchMuenchen'),
  'WebsiteRelaunchMuenchen'
);
const LokalesSEOMuenchen = lazyNamed(
  () => import('./pages/cluster/muenchen/LokalesSEOMuenchen'),
  'LokalesSEOMuenchen'
);

// Cost pages
const KostenWebdesign = lazyNamed(() => import('./pages/costs/KostenWebdesign'), 'KostenWebdesign');
const KostenKiTelefonassistent = lazyNamed(
  () => import('./pages/costs/KostenKiTelefonassistent'),
  'KostenKiTelefonassistent'
);
const KostenAutomatisierung = lazyNamed(
  () => import('./pages/costs/KostenAutomatisierung'),
  'KostenAutomatisierung'
);

// Industry pages
const WebdesignGastronomie = lazyNamed(
  () => import('./pages/industries/WebdesignGastronomie'),
  'WebdesignGastronomie'
);
const WebdesignArzt = lazyNamed(() => import('./pages/industries/WebdesignArzt'), 'WebdesignArzt');
const WebdesignImmobilien = lazyNamed(
  () => import('./pages/industries/WebdesignImmobilien'),
  'WebdesignImmobilien'
);
const WebdesignHotel = lazyNamed(() => import('./pages/industries/WebdesignHotel'), 'WebdesignHotel');
const WebdesignSport = lazyNamed(() => import('./pages/industries/WebdesignSport'), 'WebdesignSport');

const KiTelefonassistentArzt = lazyNamed(
  () => import('./pages/industries/KiTelefonassistentArzt'),
  'KiTelefonassistentArzt'
);
const KiTelefonassistentRestaurant = lazyNamed(
  () => import('./pages/industries/KiTelefonassistentRestaurant'),
  'KiTelefonassistentRestaurant'
);
const KiTelefonassistentHotel = lazyNamed(
  () => import('./pages/industries/KiTelefonassistentHotel'),
  'KiTelefonassistentHotel'
);
const KiTelefonassistentPraxis = lazyNamed(
  () => import('./pages/industries/KiTelefonassistentPraxis'),
  'KiTelefonassistentPraxis'
);

const AutomatisierungRestaurant = lazyNamed(
  () => import('./pages/industries/AutomatisierungRestaurant'),
  'AutomatisierungRestaurant'
);
const AutomatisierungArzt = lazyNamed(
  () => import('./pages/industries/AutomatisierungArzt'),
  'AutomatisierungArzt'
);
const AutomatisierungImmobilien = lazyNamed(
  () => import('./pages/industries/AutomatisierungImmobilien'),
  'AutomatisierungImmobilien'
);
const AutomatisierungSport = lazyNamed(
  () => import('./pages/industries/AutomatisierungSport'),
  'AutomatisierungSport'
);

// Problem pages
const VerpassteAnrufePage = lazyNamed(
  () => import('./pages/problems/VerpassteAnrufePage'),
  'VerpassteAnrufePage'
);
const KeineAnfragenWebsitePage = lazyNamed(
  () => import('./pages/problems/KeineAnfragenWebsitePage'),
  'KeineAnfragenWebsitePage'
);
const KeineTerminbuchungPage = lazyNamed(
  () => import('./pages/problems/KeineTerminbuchungPage'),
  'KeineTerminbuchungPage'
);
const ZuVielManuelleArbeitPage = lazyNamed(
  () => import('./pages/problems/ZuVielManuelleArbeitPage'),
  'ZuVielManuelleArbeitPage'
);
const DigitaleAutomatisierungPage = lazyNamed(
  () => import('./pages/problems/DigitaleAutomatisierungPage'),
  'DigitaleAutomatisierungPage'
);

// Pillar pages
const WebdesignAgenturDeutschland = lazyNamed(
  () => import('./pages/pillars/WebdesignAgenturDeutschland'),
  'WebdesignAgenturDeutschland'
);
const KiAgenturDeutschland = lazyNamed(
  () => import('./pages/pillars/KiAgenturDeutschland'),
  'KiAgenturDeutschland'
);
const AutomatisierungUnternehmen = lazyNamed(
  () => import('./pages/pillars/AutomatisierungUnternehmen'),
  'AutomatisierungUnternehmen'
);

// Misc pages
const NotFoundPage = lazyNamed(() => import('./pages/NotFoundPage'), 'NotFoundPage');
const LogoShowcasePage = lazyNamed(() => import('./pages/LogoShowcasePage'), 'LogoShowcasePage');
const BlogIndexPage = lazyNamed(() => import('./pages/blog/BlogIndexPage'), 'BlogIndexPage');
const BlogPostPage = lazyNamed(() => import('./pages/blog/BlogPostPage'), 'BlogPostPage');
const ScanPage = lazyNamed(() => import('./pages/ScanPage'), 'ScanPage');
// Unified internal workspace content (all rendered inside InternalWorkspaceLayout's shared shell).
const TaskDashboardContent = lazyNamed(() => import('./pages/admin/tasks/TaskDashboardContent'), 'TaskDashboardContent');
const ExecutionContent = lazyNamed(() => import('./pages/ExecutionPage'), 'ExecutionContent');
const OuraAnalyticsContent = lazyNamed(() => import('./pages/OuraAnalyticsPage'), 'OuraAnalyticsContent');
const FinanceModule = lazyNamed(() => import('./pages/admin/finance/FinanceModule'), 'FinanceModule');
const PublicDocumentPortal = lazyNamed(() => import('./pages/public/PublicDocumentPortal'), 'PublicDocumentPortal');
const ClientsListPage = lazyNamed(() => import('./pages/admin/clients/ClientsListPage'), 'ClientsListPage');
const NewClientWizard = lazyNamed(() => import('./pages/admin/clients/NewClientWizard'), 'NewClientWizard');
const ClientDetailPage = lazyNamed(() => import('./pages/admin/clients/ClientDetailPage'), 'ClientDetailPage');
const AdminSolutionsPage = lazyNamed(() => import('./pages/admin/clients/AdminSolutionsPage'), 'AdminSolutionsPage');
const AdminInvitationsPage = lazyNamed(() => import('./pages/admin/clients/AdminInvitationsPage'), 'AdminInvitationsPage');
const AppHomePage = lazyNamed(() => import('./pages/app/AppHomePage'), 'AppHomePage');
const CustomerSectionPage = lazyNamed(() => import('./pages/app/CustomerSectionPage'), 'CustomerSectionPage');
const SolutionPage = lazyNamed(() => import('./pages/app/SolutionPage'), 'SolutionPage');
const SolutionsIndexPage = lazyNamed(() => import('./pages/app/SolutionsIndexPage'), 'SolutionsIndexPage');
const SupportPage = lazyNamed(() => import('./pages/app/SupportPage'), 'SupportPage');
const LoginPage = lazyNamed(() => import('./pages/app/LoginPage'), 'LoginPage');
const SignupPage = lazyNamed(() => import('./pages/app/SignupPage'), 'SignupPage');
const ForgotPasswordPage = lazyNamed(() => import('./pages/app/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('./pages/app/ResetPasswordPage'), 'ResetPasswordPage');

function PublicLayout() {
  return (
    <PageReveal>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Navigation />
        <main id="main-content">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <PremiumFooterReveal>
          <Footer />
        </PremiumFooterReveal>
      </div>
    </PageReveal>
  );
}

// One top-level route table. Auth/private surfaces and the customer portal are matched first; the
// public marketing site is a pathless layout route so its chrome wraps every marketing page without
// changing any public path. Route guards live inside their own layout/module (no duplicated guards).
function AppInner() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Post-login role resolution — waits for the DB-backed role, then routes safely. */}
        <Route path="/auth/continue" element={<RoleLandingPage />} />

        {/* Legacy redirects preserve old links/bookmarks. */}
        <Route path="/admin/login" element={<LegacyLoginRedirect />} />
        <Route path="/owner" element={<LegacyOwnerRedirect />} />
        <Route path="/owner/*" element={<LegacyOwnerRedirect />} />

        {/* Canonical login + customer portal (/app/*). */}
        <Route path="/app/login" element={<LoginPage />} />
        <Route path="/app/signup" element={<SignupPage />} />
        <Route path="/app/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/app/reset-password" element={<ResetPasswordPage />} />
        <Route path="/app" element={<ProtectedRoute><AppHomePage /></ProtectedRoute>} />
        <Route path="/app/solutions" element={<ProtectedRoute><SolutionsIndexPage /></ProtectedRoute>} />
        <Route path="/app/solutions/:instanceKey/*" element={<ProtectedRoute><SolutionPage /></ProtectedRoute>} />
        <Route path="/app/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
        <Route path="/app/onboarding" element={<ProtectedRoute><ReceptionistEntitlementRoute><CustomerSectionPage section="onboarding" /></ReceptionistEntitlementRoute></ProtectedRoute>} />
        <Route path="/app/receptionist" element={<ProtectedRoute><ReceptionistEntitlementRoute><CustomerSectionPage section="receptionist" /></ReceptionistEntitlementRoute></ProtectedRoute>} />
        <Route path="/app/knowledge" element={<ProtectedRoute><ReceptionistEntitlementRoute><CustomerSectionPage section="knowledge" /></ReceptionistEntitlementRoute></ProtectedRoute>} />
        <Route path="/app/phone" element={<ProtectedRoute><ReceptionistEntitlementRoute><CustomerSectionPage section="phone" /></ReceptionistEntitlementRoute></ProtectedRoute>} />
        <Route path="/app/test" element={<ProtectedRoute><ReceptionistEntitlementRoute><CustomerSectionPage section="test" /></ReceptionistEntitlementRoute></ProtectedRoute>} />
        <Route path="/app/calls" element={<ProtectedRoute><ReceptionistEntitlementRoute><CustomerSectionPage section="calls" /></ReceptionistEntitlementRoute></ProtectedRoute>} />
        <Route path="/app/leads" element={<ProtectedRoute><ReceptionistEntitlementRoute><CustomerSectionPage section="leads" /></ReceptionistEntitlementRoute></ProtectedRoute>} />
        <Route path="/app/billing" element={<ProtectedRoute><CustomerSectionPage section="billing" /></ProtectedRoute>} />
        <Route path="/app/settings" element={<ProtectedRoute><CustomerSectionPage section="settings" /></ProtectedRoute>} />
        <Route path="/app/*" element={<ProtectedRoute><Navigate to="/app" replace /></ProtectedRoute>} />

        {/* Unified internal workspace (/admin/*) — one shell, role-aware nav, owner-only finance. */}
        <Route element={<InternalWorkspaceLayout />}>
          <Route path="/admin" element={<TaskDashboardContent />} />
          <Route path="/admin/tasks/today" element={<TaskDashboardContent view="today" />} />
          <Route path="/admin/tasks/overdue" element={<TaskDashboardContent view="overdue" />} />
          <Route path="/admin/tasks/completed" element={<TaskDashboardContent view="completed" />} />
          <Route path="/admin/tasks/revenue" element={<TaskDashboardContent view="revenue" />} />
          <Route path="/admin/execution" element={<ExecutionContent />} />
          <Route path="/admin/oura-analytics" element={<OuraAnalyticsContent />} />
          <Route path="/admin/clients" element={<ClientsListPage />} />
          <Route path="/admin/clients/new" element={<NewClientWizard />} />
          <Route path="/admin/clients/:organizationId" element={<ClientDetailPage />} />
          <Route path="/admin/solutions" element={<AdminSolutionsPage />} />
          <Route path="/admin/invitations" element={<AdminInvitationsPage />} />
          <Route path="/admin/finance/*" element={<FinanceModule />} />
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Public marketing site. */}
        <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/leistungen" element={<LeistungenPage />} />
      <Route path="/ueber-uns" element={<UeberUnsPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/kontakt" element={<KontaktPage />} />
      <Route path="/anfrage-erhalten" element={<AnfrageErhaltenPage />} />

      <Route path="/ki-telefonassistent" element={<KiTelefonassistentPage />} />
      <Route path="/ki-telefonassistent/demo" element={<KiTelefonassistentDemoPage />} />
      <Route path="/bayern/ki-telefonassistent" element={<BayernKiTelefonassistentPage />} />

      <Route path="/webdesign" element={<WebdesignHub />} />
      <Route path="/prozessautomatisierung" element={<ProzessautomatisierungHub />} />

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
      {/* Public, tokenized document portal (offer acceptance). Outside the auth shell; access is
          governed entirely by the secure token, never by a raw resource id. */}
      <Route path="/d/:token" element={<PublicDocumentPortal />} />
      <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <RouteIndexabilityManager />
        <CanonicalManager />
        <PublicStructuredData />
        <AppInner />
      </AuthProvider>
    </Router>
  );
}

export default App;
