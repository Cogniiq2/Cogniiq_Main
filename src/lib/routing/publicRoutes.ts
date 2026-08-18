// ─────────────────────────────────────────────────────────────────────────────
// Authoritative PUBLIC SEO / PRERENDER / SITEMAP MANIFEST.
//
// This is NOT the runtime router. src/App.tsx keeps its own explicit <Route>
// table — deliberately, because generating routes from data would mean rewriting
// a working router that also carries every authenticated surface. What this file
// IS: the single authoritative description of the public URL surface for
// everything SEO-shaped, consumed by exactly four places:
//
//   1. scripts/prerender.mjs        — which URLs get build-time HTML, and the
//                                     <head> each one receives.
//   2. scripts/generate-sitemap.mjs — public/sitemap.xml (indexable routes only).
//   3. .github/scripts/test-seo-consistency.mjs   — parity + drift guards.
//   4. .github/scripts/test-prerender-output.mjs  — output verification.
//
// Parity with the runtime router is not assumed, it is ENFORCED bidirectionally
// in CI: a public route in App.tsx that is missing here fails the build, and a
// route here that App.tsx cannot serve fails the build. See
// .github/scripts/test-seo-consistency.mjs.
//
// Node consumes this module through the compiled SSR bundle (dist-ssr), which
// re-exports PUBLIC_ROUTES from src/entry-server.tsx. No .mjs script imports
// this .ts file directly and no runtime transpiler is involved.
//
// PRIVATE surfaces (/app, /admin, /owner, /auth, /d) are deliberately absent:
// they are never prerendered, never in the sitemap, and are held noindex by
// public/_headers plus src/lib/routing/indexability.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_ORIGIN = 'https://cogniiq.de';

export type ChangeFreq = 'weekly' | 'monthly' | 'yearly';

export interface SitemapEntry {
  /** Hand-maintained publication date. NEVER the build date — a fabricated
   *  lastmod that changes on every deploy is a lie to crawlers. */
  readonly lastmod: string;
  readonly changefreq: ChangeFreq;
  /** Kept as the exact literal string ("1.0", "0.95", "0.30") so regenerating
   *  the sitemap is byte-stable and cannot reformat itself into a diff. */
  readonly priority: string;
  /** Only the homepage carries hreflang="x-default". */
  readonly xDefault?: true;
}

export interface PublicRoute {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly keywords?: string;
  /** false => prerendered with robots noindex AND excluded from the sitemap. */
  readonly indexable: boolean;
  /** Present if and only if `indexable` is true. Enforced by publicRoutes.test.ts. */
  readonly sitemap?: SitemapEntry;
}

export const PUBLIC_ROUTES: readonly PublicRoute[] = [

  // ─── CORE PAGES ──────────────────────────────────────────────────────────────
  {
    path: "/",
    title: "Cogniiq – KI-Telefonassistent, Webdesign & Automatisierung für Unternehmen in Bayern",
    description: "Cogniiq entwickelt operative KI-Systeme für Unternehmen in Bayern: KI-Telefonassistent, Websites und Prozessautomatisierung. Erreichbar auch außerhalb der Öffnungszeiten.",
    keywords: "AI Agentur Bayern, KI Telefonassistent, Webdesign Agentur Bayern, Prozessautomatisierung, Cogniiq",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "weekly", priority: "1.0", xDefault: true },
  },
  {
    path: "/leistungen",
    title: "Leistungen | KI-Telefonassistent, Webdesign & Automatisierung – Cogniiq",
    description: "Drei operative Systeme für Ihr Unternehmen: KI-Telefonassistent für die Anrufannahme, Webdesign für mehr Anfragen, Automatisierung gegen manuelle Handarbeit.",
    keywords: "KI Leistungen, Webdesign Leistungen, Automatisierung Leistungen, Cogniiq Services",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.95" },
  },
  {
    path: "/kontakt",
    title: "Kostenloses Erstgespräch vereinbaren – Cogniiq | KI-Agentur Bayern",
    description: "30 Minuten – wir schauen uns Ihre konkrete Situation an und zeigen, wo KI-Telefonie, Webdesign oder Automatisierung sofort wirkt. Kein Pitch. Kein Standardangebot.",
    keywords: "Cogniiq Kontakt, KI Erstgespräch, Webdesign Anfrage, Automatisierung Anfrage",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/ueber-uns",
    title: "Über Uns | KI-Agentur Bayreuth – Lazar & Djordje Popovic – Cogniiq",
    description: "Cogniiq wurde von Lazar und Djordje Popovic in Bayreuth gegründet. Wir bauen operative KI-Systeme – keine Beratungsfolien, keine generischen Pakete. Direkter Kontakt.",
    keywords: "Cogniiq Team, AI Agentur Gründer, Lazar Popovic, Djordje Popovic, Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.75" },
  },
  {
    path: "/faq",
    title: "FAQ – Kosten, Ablauf & KI-Systeme | Cogniiq Bayreuth",
    description: "Antworten zu KI-Telefonassistent, Webdesign-Kosten, Projektstart und Automatisierung. Was kostet ein Projekt? Wie schnell geht es? Was ist realistisch? Hier, konkret.",
    keywords: "FAQ KI Agentur, Webdesign Kosten FAQ, Automatisierung FAQ, Cogniiq Fragen",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.75" },
  },
  {
    path: "/referenzen",
    title: "Referenzen – Arbeitsweise & Projektverständnis | Cogniiq",
    description: "Wie Cogniiq arbeitet: Nutzerführung, Geschäftslogik, Verwaltung und Betrieb als ein System. Kundenprojekte veröffentlichen wir nur mit schriftlicher Freigabe.",
    keywords: "Cogniiq Referenzen, Webdesign Projekte, KI Projekte, Automatisierung Beispiele",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.80" },
  },
  {
    path: "/bewertungen",
    title: "Bewertungen & Kundenstimmen | Cogniiq AI-Agentur Bayern",
    description: "Was Kunden über Cogniiq sagen: echte Bewertungen zu Webdesign, KI-Telefonassistenten und Automatisierung. Überzeugen Sie sich von unserer Arbeit.",
    keywords: "Cogniiq Bewertungen, Kundenstimmen AI Agentur, Webdesign Bewertungen, KI Telefonassistent Erfahrungen",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.75" },
  },

  // ─── PILLAR SERVICE PAGES ────────────────────────────────────────────────────
  // ─── HEALTHCARE-EINSTIEG (Positionierung Option B) ───────────────────────────
  {
    path: "/praxen",
    title: "KI Telefonassistent für Praxen – Ihr Empfang | Cogniiq",
    description: "Ein Empfang am Telefon für Ihre Praxis: Ihre Stimmauswahl, Ihre Regeln, strukturierte Übergabe. Keine Triage, Kontingent mit Obergrenze, Go-live in 7 Tagen.",
    keywords: "KI Telefonassistent Praxis, Praxisempfang Telefon, telefonische Erreichbarkeit Praxis, Anrufannahme Arztpraxis",
    indexable: true,
    sitemap: { lastmod: "2026-08-16", changefreq: "monthly", priority: "0.90" },
  },

  // Grundgerüste ohne Fachinhalt: bewusst NICHT indexierbar, bis die Angaben aus
  // OWNER-INPUT.md (Gruppe B bzw. C) geprüft vorliegen. Eine Seite, die
  // Integrationen oder Compliance verspricht, ohne sie belegen zu können, gehört
  // weder in den Suchindex noch in die Sitemap.
  {
    path: "/integrationen",
    title: "Anbindungen an Ihr System | Cogniiq",
    description: "Was nach einem Anruf passiert, was wir für Ihr System prüfen — und was wir nicht behaupten: eine fertige Standardanbindung an Praxissysteme gibt es nicht.",
    indexable: false,
  },
  {
    path: "/datenschutz-sicherheit",
    title: "Datenschutz & Sicherheit – die Prüfpunkte | Cogniiq",
    description: "Was beim Praxis-Empfang gilt, was Ihr Datenschutzbeauftragter uns fragen sollte und was wir nicht behaupten. Keine Aufzeichnung, kein Training.",
    indexable: false,
  },

  {
    path: "/ki-telefonassistent",
    title: "KI Telefonassistent – individuell konfiguriert | Cogniiq",
    description: "KI Telefonassistent mit Ihrer Stimmauswahl, Ihren Regeln und strukturierter Übergabe an Ihr Team. Festes Minutenkontingent mit Obergrenze, keine Gesprächsaufzeichnung.",
    keywords: "KI Telefonassistent, AI Rezeptionistin, KI Telefon Unternehmen, Anruf automatisieren, Telefonie außerhalb der Geschäftszeiten",
    indexable: true,
    sitemap: { lastmod: "2026-06-30", changefreq: "monthly", priority: "0.92" },
  },
  {
    path: "/webdesign",
    title: "Webdesign Agentur – Hochkonvertierende Websites für Unternehmen | Cogniiq",
    description: "Cogniiq entwickelt individuelle Websites, die bei Google sichtbar sind und Besucher zu Anfragen führen: sauberer Code, Core Web Vitals, Local SEO.",
    keywords: "Webdesign Agentur, Website erstellen lassen, professionelle Website, SEO Webdesign, Core Web Vitals",
    indexable: true,
    sitemap: { lastmod: "2026-06-30", changefreq: "monthly", priority: "0.92" },
  },
  {
    path: "/prozessautomatisierung",
    title: "Prozessautomatisierung für Unternehmen | KI-Workflows – Cogniiq",
    description: "Cogniiq automatisiert wiederkehrende Prozesse: Buchungen, Lead-Nachverfolgung, E-Mail-Workflows und mehr. Weniger manuelle Arbeit, mehr Kapazität für das Wesentliche.",
    keywords: "Prozessautomatisierung, KI Automatisierung, Workflow Automatisierung, AI Workflows, Automatisierung Unternehmen",
    indexable: true,
    sitemap: { lastmod: "2026-06-30", changefreq: "monthly", priority: "0.92" },
  },
  {
    path: "/webdesign-agentur-deutschland",
    title: "Webdesign Agentur Deutschland | Individuelle Websites national – Cogniiq",
    description: "Cogniiq ist Ihre Webdesign Agentur für ganz Deutschland. Wir entwickeln individuelle, SEO-optimierte Websites die konvertieren – remote oder persönlich in Bayern.",
    keywords: "Webdesign Agentur Deutschland, Website Agentur Deutschland, professionelle Website Deutschland",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.92" },
  },
  {
    path: "/ki-agentur-deutschland",
    title: "KI Agentur Deutschland | AI-Systeme für Unternehmen – Cogniiq",
    description: "Cogniiq ist Ihre KI-Agentur für ganz Deutschland. KI-Telefonassistenten, Chatbots und Automatisierungssysteme – entwickelt für den deutschen Markt, einsatzbereit in 7–14 Tagen.",
    keywords: "KI Agentur Deutschland, AI Agentur Deutschland, KI Systeme Unternehmen, Artificial Intelligence Deutschland",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.92" },
  },
  {
    path: "/automatisierung-unternehmen",
    title: "Automatisierung für Unternehmen | KI-gestützte Workflows – Cogniiq",
    description: "Automatisieren Sie wiederkehrende Aufgaben in Ihrem Unternehmen. Cogniiq entwickelt KI-gestützte Workflows für Gastronomie, Praxen, Immobilien und Handwerk.",
    keywords: "Automatisierung Unternehmen, KI Workflows, Business Automation, Prozessoptimierung KI",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.90" },
  },
  {
    path: "/ki-telefonassistent/demo",
    title: "KI-Telefonassistent Demo | Live-Vorführung AI-Rezeptionistin – Cogniiq",
    description: "Testen Sie den KI-Telefonassistenten von Cogniiq live. Hören Sie, wie die AI-Rezeptionistin Anrufe annimmt, Termine bucht und Fragen beantwortet – auch außerhalb regulärer Geschäftszeiten.",
    keywords: "KI Telefonassistent Demo, AI Rezeptionistin testen, KI Telefon Demo, Cogniiq Demo",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.70" },
  },

  // ─── GEO HUBS ────────────────────────────────────────────────────────────────
  {
    path: "/deutschland",
    title: "AI-Systeme & Webdesign für Unternehmen in Deutschland | Cogniiq",
    description: "Cogniiq entwickelt KI-Telefonassistenten, hochkonvertierende Websites und Automatisierungssysteme für Unternehmen in ganz Deutschland. Remote oder persönlich in Bayern.",
    keywords: "AI Agentur Deutschland, Webdesign Deutschland, KI Systeme Deutschland, Automatisierung Deutschland",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.88" },
  },
  {
    path: "/bayern",
    title: "AI-Systeme & Webdesign für Unternehmen in Bayern | Cogniiq",
    description: "Cogniiq betreut Unternehmen in Bayern mit KI-Telefonassistenten, Webdesign und Automatisierung. Persönliche Betreuung in Bayreuth, München, Nürnberg und Regensburg.",
    keywords: "AI Agentur Bayern, Webdesign Bayern, KI Telefonassistent Bayern, Automatisierung Bayern",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/bayern/ki-telefonassistent",
    title: "KI-Telefonassistent Bayern | AI-Rezeptionistin für bayerische Unternehmen – Cogniiq",
    description: "Der KI-Telefonassistent für Unternehmen in Bayern: nimmt Anrufe an, bucht Termine, beantwortet Fragen – auch außerhalb regulärer Geschäftszeiten. Persönliche Einrichtung durch Cogniiq in Bayreuth.",
    keywords: "KI Telefonassistent Bayern, AI Rezeptionistin Bayern, KI Telefon Bayern",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.82" },
  },

  // ─── CITY LANDING PAGES ──────────────────────────────────────────────────────
  {
    path: "/bayreuth",
    title: "AI-Systeme & Webdesign in Bayreuth | KI-Telefonassistent & Automatisierung – Cogniiq",
    description: "Cogniiq – Ihre AI-Agentur in Bayreuth. KI-Telefonassistent, hochkonvertierende Websites und Prozessautomatisierung für Unternehmen in Oberfranken. Persönliche Betreuung vor Ort.",
    keywords: "AI Agentur Bayreuth, Webdesign Bayreuth, KI Telefonassistent Bayreuth, Automatisierung Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/muenchen",
    title: "AI-Systeme & Webdesign in München | KI-Telefonassistent & Automatisierung – Cogniiq",
    description: "Cogniiq betreut Unternehmen in München mit KI-Telefonassistenten, Webdesign und Prozessautomatisierung – remote, mit festem Ansprechpartner und Festpreis.",
    keywords: "AI Agentur München, Webdesign München, KI Telefonassistent München, Automatisierung München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/regensburg",
    title: "AI-Systeme & Webdesign in Regensburg | KI-Telefonassistent & Automatisierung – Cogniiq",
    description: "Cogniiq entwickelt KI-Telefonassistenten, Webdesign und Automatisierungslösungen für Unternehmen in Regensburg. Persönliche Betreuung, Go-Live in 7–14 Tagen.",
    keywords: "AI Agentur Regensburg, Webdesign Regensburg, KI Telefonassistent Regensburg, Automatisierung Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.80" },
  },

  // ─── BAYREUTH — CITY SERVICES ────────────────────────────────────────────────
  {
    path: "/bayreuth/webdesign",
    title: "Webdesign Agentur Bayreuth – Website erstellen & SEO | Cogniiq",
    description: "Webdesign Bayreuth: Individuelle Websites für lokale Unternehmen. Schnell, SEO-optimiert, Mobile-First. Keine Templates – professionelle Webentwicklung mit lokalem Ansprechpartner.",
    keywords: "Webdesign Bayreuth, Webdesign Agentur Bayreuth, Website erstellen Bayreuth, Homepage Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "weekly", priority: "0.9" },
  },
  {
    path: "/bayreuth/ki-telefonassistent",
    title: "KI Telefonassistent Bayreuth – AI Rezeption & Anrufannahme | Cogniiq",
    description: "KI Telefonassistent Bayreuth: Anrufannahme, Terminbuchung und Weiterleitung für lokale Unternehmen. Auch außerhalb der Öffnungszeiten, ohne Gesprächsaufzeichnung, Go-live in 7 Tagen.",
    keywords: "KI Telefonassistent Bayreuth, AI Rezeptionistin Bayreuth, KI Telefon Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "weekly", priority: "0.9" },
  },
  {
    path: "/bayreuth/automatisierung",
    title: "Prozessautomatisierung Bayreuth | KI-Workflows für lokale Unternehmen – Cogniiq",
    description: "Prozessautomatisierung für Unternehmen in Bayreuth: Buchungen, Lead-Nachverfolgung, Workflows. Cogniiq automatisiert manuelle Prozesse – persönlich betreut in Oberfranken.",
    keywords: "Automatisierung Bayreuth, Prozessautomatisierung Bayreuth, KI Workflows Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "weekly", priority: "0.9" },
  },

  // ─── BAYREUTH — CLUSTER PAGES ────────────────────────────────────────────────
  {
    path: "/bayreuth/webdesign-kosten",
    title: "Webdesign Kosten Bayreuth – Preise für Websites in der Region | Cogniiq",
    description: "Was kostet Webdesign in Bayreuth? Transparente Preisübersicht für individuelle Websites, SEO-Pakete und Wartung. Kostenloser Kostenvoranschlag für Ihr Projekt.",
    keywords: "Webdesign Kosten Bayreuth, Website Preise Bayreuth, Homepage Kosten Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },
  {
    path: "/bayreuth/website-erstellen",
    title: "Website erstellen lassen in Bayreuth | Professionell & schnell – Cogniiq",
    description: "Website in Bayreuth erstellen lassen: individuelle Entwicklung, SEO von Anfang an, kein Baukasten. Go-Live in 7–14 Tagen. Persönliche Betreuung in Bayreuth.",
    keywords: "Website erstellen Bayreuth, Homepage erstellen Bayreuth, Webseite erstellen Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },
  {
    path: "/bayreuth/landingpage",
    title: "Landingpage Bayreuth – Conversion-optimierte Seiten für Kampagnen | Cogniiq",
    description: "Professionelle Landingpages für Unternehmen in Bayreuth. Für Google Ads, Social Media und lokale Kampagnen – mit klarem CTA, schnell geladen und messbar.",
    keywords: "Landingpage Bayreuth, Landing Page erstellen Bayreuth, Kampagnenseite Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },
  {
    path: "/bayreuth/website-relaunch",
    title: "Website Relaunch Bayreuth – Alte Website modernisieren | Cogniiq",
    description: "Website Relaunch in Bayreuth: Ihre bestehende Website modernisieren ohne Rankingverlust. Neues Design, bessere Performance, stärkeres SEO – persönliche Betreuung.",
    keywords: "Website Relaunch Bayreuth, Website modernisieren Bayreuth, Homepage Relaunch Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },
  {
    path: "/bayreuth/lokales-seo",
    title: "Lokales SEO Bayreuth – Google Maps & lokale Suche optimieren | Cogniiq",
    description: "Lokales SEO für Unternehmen in Bayreuth: Google Maps Optimierung, lokale Suchanfragen, NAP-Konsistenz. Mehr Kunden aus der Region durch bessere lokale Sichtbarkeit.",
    keywords: "Lokales SEO Bayreuth, Google Maps Bayreuth, Local SEO Bayreuth, Lokale Suche Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },

  // ─── MÜNCHEN — CITY SERVICES ─────────────────────────────────────────────────
  {
    path: "/muenchen/webdesign",
    title: "Webdesign Agentur München – Website erstellen | Cogniiq",
    description: "Webdesign München: Individuelle Websites für Startups, Mittelstand und Premium-Segment. Enterprise-Qualität ohne Münchner Agenturpreise. SEO-optimiert, schnell, mehrsprachig.",
    keywords: "Webdesign München, Webdesign Agentur München, Website erstellen München, Homepage München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "weekly", priority: "0.9" },
  },
  {
    path: "/muenchen/ki-telefonassistent",
    title: "KI Telefonassistent München – AI Rezeption & Telefonservice | Cogniiq",
    description: "KI Telefonassistent für Unternehmen in München: Anrufannahme mit Ihren Regeln, bis zu fünf Sprachen, strukturierte Übergabe, keine Gesprächsaufzeichnung.",
    keywords: "KI Telefonassistent München, AI Rezeptionistin München, KI Telefon München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "weekly", priority: "0.9" },
  },
  {
    path: "/muenchen/automatisierung",
    title: "Prozessautomatisierung München | KI-Workflows für Münchner Unternehmen – Cogniiq",
    description: "Prozessautomatisierung für Unternehmen in München: KI-gestützte Workflows für Buchungen, Leads und Kundenkommunikation. Weniger manueller Aufwand, mehr Kapazität.",
    keywords: "Automatisierung München, Prozessautomatisierung München, KI Workflows München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "weekly", priority: "0.9" },
  },

  // ─── MÜNCHEN — CLUSTER PAGES ─────────────────────────────────────────────────
  {
    path: "/muenchen/webdesign-kosten",
    title: "Webdesign Kosten München – Preise für professionelle Websites | Cogniiq",
    description: "Was kostet Webdesign in München? Ehrliche Preisübersicht für individuelle Website-Entwicklung im Münchner Markt. Jetzt kostenlosen Kostenvoranschlag anfragen.",
    keywords: "Webdesign Kosten München, Website Preise München, Homepage Kosten München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },
  {
    path: "/muenchen/website-erstellen",
    title: "Website erstellen lassen in München | Professionell & schnell – Cogniiq",
    description: "Website in München erstellen lassen: maßgeschneiderte Entwicklung, SEO, individuelles Design. Keine Fertigvorlagen – Go-Live typischerweise in 7–14 Tagen.",
    keywords: "Website erstellen München, Homepage erstellen München, Webseite erstellen München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },
  {
    path: "/muenchen/landingpage",
    title: "Landingpage München – Conversion-starke Seiten für den Münchner Markt | Cogniiq",
    description: "Professionelle Landingpages für Unternehmen in München. Optimiert für Google Ads, Social Media Kampagnen und lokale Suchanfragen im Münchner Raum.",
    keywords: "Landingpage München, Landing Page München, Kampagnenseite München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },
  {
    path: "/muenchen/website-relaunch",
    title: "Website Relaunch München – Modernisierung ohne Rankingverlust | Cogniiq",
    description: "Website Relaunch in München: bestehende Seite modernisieren, Performance verbessern, SEO sichern. Professionelle Umsetzung für Münchner Unternehmen.",
    keywords: "Website Relaunch München, Homepage Relaunch München, Website modernisieren München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },
  {
    path: "/muenchen/lokales-seo",
    title: "Lokales SEO München – Google Maps & lokale Sichtbarkeit | Cogniiq",
    description: "Lokales SEO für Münchner Unternehmen: Google Maps Optimierung, lokale Suchanfragen und NAP-Konsistenz für mehr Kunden aus München.",
    keywords: "Lokales SEO München, Google Maps München, Local SEO München, Lokale Suche München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },

  // ─── REGENSBURG — CITY SERVICES ──────────────────────────────────────────────
  {
    path: "/regensburg/webdesign",
    title: "Webdesign Agentur Regensburg – Website erstellen & SEO | Cogniiq",
    description: "Webdesign Regensburg: Individuelle Websites für Unternehmen, Praxen und Gastronomie. Schnell, lokal SEO-optimiert, Mobile-First. Website Agentur mit persönlicher Betreuung.",
    keywords: "Webdesign Regensburg, Webdesign Agentur Regensburg, Website erstellen Regensburg, Homepage Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "weekly", priority: "0.9" },
  },
  {
    path: "/regensburg/ki-telefonassistent",
    title: "KI Telefonassistent Regensburg – AI Rezeption & Anrufannahme | Cogniiq",
    description: "KI Telefonassistent Regensburg: Anrufannahme, Terminbuchung und Weiterleitung für Praxen, Gastronomie und Dienstleister. Auch außerhalb der Öffnungszeiten, ohne Gesprächsaufzeichnung, Go-live in 7 Tagen.",
    keywords: "KI Telefonassistent Regensburg, AI Rezeptionistin Regensburg, KI Telefon Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "weekly", priority: "0.9" },
  },
  {
    path: "/regensburg/automatisierung",
    title: "Prozessautomatisierung Regensburg | KI-Workflows für lokale Unternehmen – Cogniiq",
    description: "Prozessautomatisierung für Unternehmen in Regensburg und Ostbayern: Buchungen, Leads, Workflows automatisieren. Cogniiq entwickelt KI-Systeme, die täglich arbeiten.",
    keywords: "Automatisierung Regensburg, Prozessautomatisierung Regensburg, KI Workflows Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "weekly", priority: "0.9" },
  },

  // ─── REGENSBURG — CLUSTER PAGES ──────────────────────────────────────────────
  {
    path: "/regensburg/webdesign-kosten",
    title: "Webdesign Kosten Regensburg – Transparente Preise für Websites | Cogniiq",
    description: "Was kostet Webdesign in Regensburg? Realistische Preisübersicht für professionelle Websites in Regensburg und Ostbayern. Jetzt Kostenvoranschlag anfragen.",
    keywords: "Webdesign Kosten Regensburg, Website Preise Regensburg, Homepage Kosten Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.75" },
  },
  {
    path: "/regensburg/website-erstellen",
    title: "Website erstellen lassen in Regensburg | Professionell & schnell – Cogniiq",
    description: "Website in Regensburg erstellen lassen: individuelle Entwicklung, SEO von Anfang an, kein Baukasten. Persönliche Betreuung vor Ort in Regensburg.",
    keywords: "Website erstellen Regensburg, Homepage erstellen Regensburg, Webseite erstellen Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.75" },
  },
  {
    path: "/regensburg/landingpage",
    title: "Landingpage Regensburg – Conversion-optimierte Seiten | Cogniiq",
    description: "Professionelle Landingpages für Unternehmen in Regensburg. Für Google Ads, Social Media und lokale Kampagnen – schnell, messbar, conversion-stark.",
    keywords: "Landingpage Regensburg, Landing Page Regensburg, Kampagnenseite Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.75" },
  },
  {
    path: "/regensburg/website-relaunch",
    title: "Website Relaunch Regensburg – Modernisierung ohne Rankingverlust | Cogniiq",
    description: "Website Relaunch in Regensburg: alte Website modernisieren, Performance verbessern, lokales SEO optimieren. Professionelle Umsetzung für Unternehmen in Ostbayern.",
    keywords: "Website Relaunch Regensburg, Homepage Relaunch Regensburg, Website modernisieren Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.75" },
  },
  {
    path: "/regensburg/lokales-seo",
    title: "Lokales SEO Regensburg – Google Maps & lokale Suche | Cogniiq",
    description: "Lokales SEO für Unternehmen in Regensburg: Google Maps Optimierung, lokale Suchanfragen, mehr Sichtbarkeit in Ostbayern. Messbare Ergebnisse durch technisches SEO.",
    keywords: "Lokales SEO Regensburg, Google Maps Regensburg, Local SEO Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.75" },
  },

  // ─── INDUSTRY × LOCATION — WEBDESIGN ─────────────────────────────────────────
  {
    path: "/webdesign-arzt-bayreuth",
    title: "Webdesign für Ärzte in Bayreuth | Praxis-Website erstellen – Cogniiq",
    description: "Webdesign für Arztpraxen in Bayreuth: Praxis-Websites mit Online-Terminbuchung, Patienteninformationen und lokalem SEO für mehr Neupatienten in Bayreuth.",
    keywords: "Webdesign Arzt Bayreuth, Praxis Website Bayreuth, Arztwebsite Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.82" },
  },
  {
    path: "/webdesign-gastronomie-bayreuth",
    title: "Webdesign für Restaurants in Bayreuth | Online Reservierungen – Cogniiq",
    description: "Webdesign für Restaurants und Gastronomie in Bayreuth: Online-Reservierung, Speisekarte digital, Google Maps. Mehr Gäste durch professionelle Website.",
    keywords: "Webdesign Restaurant Bayreuth, Gastronomie Website Bayreuth, Restaurant Website Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.82" },
  },
  {
    path: "/webdesign-immobilien-bayreuth",
    title: "Webdesign für Immobilienmakler in Bayreuth | Leads gewinnen – Cogniiq",
    description: "Websites für Immobilienmakler in Bayreuth: Objektpräsentation, Anfragen-Formulare, lokales SEO. Mehr qualifizierte Immobilienanfragen durch professionelles Webdesign.",
    keywords: "Webdesign Immobilien Bayreuth, Immobilienmakler Website Bayreuth, Immobilien Webdesign Bayreuth",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.82" },
  },
  {
    path: "/webdesign-arzt-muenchen",
    title: "Webdesign für Ärzte in München | Praxis-Website erstellen – Cogniiq",
    description: "Webdesign für Arztpraxen in München: Praxis-Websites mit Online-Terminbuchung und lokalem SEO für mehr Neupatienten in München.",
    keywords: "Webdesign Arzt München, Praxis Website München, Arztwebsite München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.82" },
  },
  {
    path: "/webdesign-gastronomie-muenchen",
    title: "Webdesign für Restaurants in München | Online Reservierungen – Cogniiq",
    description: "Webdesign für Restaurants und Gastronomie in München: Online-Reservierung, digitale Speisekarte, Google Maps. Mehr Gäste für Ihr Münchner Restaurant.",
    keywords: "Webdesign Restaurant München, Gastronomie Website München, Restaurant Website München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.82" },
  },
  {
    path: "/webdesign-immobilien-muenchen",
    title: "Webdesign für Immobilienmakler in München | Leads gewinnen – Cogniiq",
    description: "Websites für Immobilienmakler in München: Objektpräsentation, Anfragen, lokales SEO. Mehr qualifizierte Immobilienanfragen in der Münchner Immobilienbranche.",
    keywords: "Webdesign Immobilien München, Immobilienmakler Website München, Immobilien Webdesign München",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.82" },
  },
  {
    path: "/webdesign-arzt-regensburg",
    title: "Webdesign für Ärzte in Regensburg | Praxis-Website erstellen – Cogniiq",
    description: "Webdesign für Arztpraxen in Regensburg: Praxis-Websites mit Online-Terminbuchung und lokalem SEO für mehr Neupatienten in Regensburg.",
    keywords: "Webdesign Arzt Regensburg, Praxis Website Regensburg, Arztwebsite Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },
  {
    path: "/webdesign-gastronomie-regensburg",
    title: "Webdesign für Restaurants in Regensburg | Online Reservierungen – Cogniiq",
    description: "Webdesign für Restaurants und Gastronomie in Regensburg: Online-Reservierung, Speisekarte, Google Maps. Mehr Gäste durch professionelle Website in Ostbayern.",
    keywords: "Webdesign Restaurant Regensburg, Gastronomie Website Regensburg, Restaurant Website Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },
  {
    path: "/webdesign-immobilien-regensburg",
    title: "Webdesign für Immobilienmakler in Regensburg | Leads gewinnen – Cogniiq",
    description: "Websites für Immobilienmakler in Regensburg: Objektpräsentation, Anfragen-Formulare, lokales SEO für mehr Immobilienanfragen in Regensburg und Ostbayern.",
    keywords: "Webdesign Immobilien Regensburg, Immobilienmakler Website Regensburg, Immobilien Webdesign Regensburg",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.78" },
  },

  // ─── INDUSTRY-SPECIFIC SERVICE PAGES — WEBDESIGN ─────────────────────────────
  {
    path: "/webdesign-gastronomie",
    title: "Webdesign für Restaurants & Gastronomie | Online Reservierungen – Cogniiq",
    description: "Websites für Restaurants, Cafés und Gastronomie: mit Online-Reservierung, Speisekarte, Google Maps. Mehr Tischreservierungen durch professionelles Webdesign.",
    keywords: "Webdesign Restaurant, Website Gastronomie, Webdesign Café, Restaurant Website erstellen",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/webdesign-arzt",
    title: "Webdesign für Ärzte & Praxen | Patientengewinnung online – Cogniiq",
    description: "Professionelle Websites für Arztpraxen und medizinische Einrichtungen. Mit Online-Terminbuchung, lokales SEO für mehr Neupatienten.",
    keywords: "Webdesign Arzt, Website Praxis, Arztwebsite erstellen, Webdesign Praxis, Patientenakquise Online",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/webdesign-immobilien",
    title: "Webdesign für Immobilienmakler | Objekte präsentieren & Leads gewinnen – Cogniiq",
    description: "Websites für Immobilienmakler und Immobilienbüros: Objektpräsentation, Anfragen-Formulare, lokales SEO. Mehr qualifizierte Anfragen durch professionelles Webdesign.",
    keywords: "Webdesign Immobilien, Website Immobilienmakler, Immobilien Website erstellen",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/webdesign-hotel",
    title: "Webdesign für Hotels & Pensionen | Direktbuchungen steigern – Cogniiq",
    description: "Professionelle Hotel-Websites: Direktbuchungssystem, Zimmerpräsentation, SEO für mehr organische Buchungen. Weniger OTA-Provisionen, mehr Direktgäste.",
    keywords: "Webdesign Hotel, Website Hotel erstellen, Hotel Direktbuchungen, Pension Website",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/webdesign-sport",
    title: "Webdesign für Sportvereine & Fitnessstudios | Mitgliederwachstum – Cogniiq",
    description: "Websites für Sportvereine, Fitnessstudios und Trainingsanbieter: mit Online-Anmeldung, Kursplan, Mitgliederbereichen. Mehr Mitglieder durch digitale Präsenz.",
    keywords: "Webdesign Sportverein, Website Fitnessstudio, Webdesign Sport, Vereinswebsite",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.80" },
  },

  // ─── INDUSTRY-SPECIFIC SERVICE PAGES — KI-TELEFONASSISTENT ───────────────────
  {
    path: "/ki-telefonassistent-arzt",
    title: "KI-Telefonassistent für Arztpraxen | Termine automatisch buchen – Cogniiq",
    description: "Der KI-Telefonassistent für Praxen: nimmt Patientenanrufe an, bucht Termine ins System, beantwortet häufige Fragen – auch außerhalb der Sprechzeiten, ohne Praxismitarbeiterin am Telefon.",
    keywords: "KI Telefonassistent Arzt, AI Rezeptionistin Praxis, Terminbuchung Praxis KI, Arztpraxis Automatisierung",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.87" },
  },
  {
    path: "/ki-telefonassistent-restaurant",
    title: "KI-Telefonassistent für Restaurants | Reservierungen automatisch annehmen – Cogniiq",
    description: "KI Telefonassistent für Restaurants: Tischreservierungen entgegennehmen, bestätigen und erinnern – auch während des Service, abends und am Wochenende.",
    keywords: "KI Telefonassistent Restaurant, Reservierungen KI, AI Rezeptionistin Restaurant, Gastronomie Automatisierung",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/ki-telefonassistent-hotel",
    title: "KI-Telefonassistent für Hotels | Buchungsanfragen auch nachts bearbeiten – Cogniiq",
    description: "KI-Telefonassistent für Hotels: Buchungsanfragen annehmen, Zimmerverfügbarkeiten mitteilen, Fragen beantworten – auch außerhalb der Rezeptionszeiten, ohne zusätzliches Personal.",
    keywords: "KI Telefonassistent Hotel, AI Rezeptionistin Hotel, Hotel Automatisierung, Buchungen KI Hotel",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/ki-telefonassistent-praxis",
    title: "KI-Telefonassistent für medizinische Praxen | Terminverwaltung automatisieren – Cogniiq",
    description: "KI-Telefonassistent für Arzt- und Facharztpraxen: Termine aufnehmen, Rezeptanfragen strukturiert erfassen, Anmeldung entlasten – ohne Gesprächsaufzeichnung.",
    keywords: "KI Telefonassistent Praxis, Praxis Telefonassistent, Terminverwaltung Praxis KI, AI Praxis",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },

  // ─── INDUSTRY-SPECIFIC SERVICE PAGES — AUTOMATISIERUNG ───────────────────────
  {
    path: "/automatisierung-restaurant",
    title: "Automatisierung für Restaurants | Bestellungen, Reservierungen & mehr – Cogniiq",
    description: "Prozessautomatisierung für Restaurants: Reservierungen, Bestellungen, Dienstpläne und Kundenkommunikation automatisieren. Mehr Zeit für das Wesentliche.",
    keywords: "Automatisierung Restaurant, Gastronomie Automatisierung, KI Restaurant, Bestellsystem Automatisierung",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/automatisierung-arzt",
    title: "Automatisierung für Arztpraxen | Terminbuchung & Kommunikation – Cogniiq",
    description: "Prozessautomatisierung für Arztpraxen: Terminbuchung, Erinnerungen, Patientenkommunikation und Dokumentenverwaltung automatisieren. Mehr Zeit für Patienten.",
    keywords: "Automatisierung Arztpraxis, Praxis Automatisierung, Terminbuchung Automatisierung, Arzt KI Systeme",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/automatisierung-immobilien",
    title: "Automatisierung für Immobilienmakler | Lead-Nachverfolgung & CRM – Cogniiq",
    description: "Prozessautomatisierung für Immobilienmakler: Lead-Nachverfolgung, Expose-Versand, Besichtigungen und Kundenkommunikation automatisieren. Mehr Abschlüsse, weniger Aufwand.",
    keywords: "Automatisierung Immobilien, Immobilienmakler KI, Lead-Nachverfolgung Immobilien, CRM Automatisierung Immobilien",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.85" },
  },
  {
    path: "/automatisierung-sport",
    title: "Automatisierung für Sportvereine & Studios | Mitgliederverwaltung KI – Cogniiq",
    description: "Prozessautomatisierung für Sportvereine und Fitnessstudios: Mitgliederverwaltung, Anmeldungen, Kursplanung und Zahlungen automatisieren.",
    keywords: "Automatisierung Sportverein, Fitnessstudio Automatisierung, Mitgliederverwaltung KI, Sport Digitalisierung",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.80" },
  },

  // ─── COST / PRICING PAGES ────────────────────────────────────────────────────
  {
    path: "/kosten-webdesign",
    title: "Webdesign Kosten 2025 – Was kostet eine professionelle Website? | Cogniiq",
    description: "Was kostet Webdesign wirklich? Preise für individuelle Websites, Ladezeiten, SEO-Optimierung und Wartung. Transparente Kostenübersicht von der AI-Agentur Cogniiq.",
    keywords: "Webdesign Kosten, Website Preise, Was kostet Webdesign, Homepage Kosten 2025",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.88" },
  },
  {
    path: "/kosten-ki-telefonassistent",
    title: "Was kostet ein KI Telefonassistent? Preise | Cogniiq",
    description: "Was kostet ein KI Telefonassistent für Praxen? Tarife ab 300 € im Monat mit festem Minutenkontingent, gedeckelter Rechnung, Einrichtung und Go-live-Garantie.",
    keywords: "KI Telefonassistent Kosten, AI Rezeptionist Preis, KI Telefonie Kosten, Automatisierung Kosten",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.88" },
  },
  {
    path: "/kosten-automatisierung",
    title: "Automatisierung Kosten – Was kostet Prozessautomatisierung? | Cogniiq",
    description: "Realistische Kostenübersicht für Prozessautomatisierung: von einfachen Workflows bis zu komplexen KI-Systemen. ROI und Amortisierungszeiten für verschiedene Unternehmensgrößen.",
    keywords: "Automatisierung Kosten, Prozessautomatisierung Preis, KI Automation Kosten, Workflow Automatisierung Kosten",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.88" },
  },

  // ─── PROBLEM-BASED LANDING PAGES ─────────────────────────────────────────────
  {
    path: "/verpasste-anrufe-verlust",
    title: "Verpasste Anrufe kosten täglich Umsatz – So hören Sie damit auf | Cogniiq",
    description: "Verpasste Anrufe sind verlorene Aufträge. Der KI-Telefonassistent von Cogniiq nimmt Anrufe an, wenn Ihr Team gebunden ist – auch abends und am Wochenende.",
    keywords: "Verpasste Anrufe, Anrufe verpassen Unternehmen, KI Telefonassistent Lösung, telefonische Erreichbarkeit",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.80" },
  },
  {
    path: "/keine-anfragen-website",
    title: "Warum Ihre Website keine Anfragen bringt – und wie Sie das ändern | Cogniiq",
    description: "Eine schöne Website bringt noch keine Anfragen. Hier sind die echten Gründe warum Besucher abspringen – und wie Cogniiq das technisch und inhaltlich löst.",
    keywords: "Website keine Anfragen, Website konvertiert nicht, Webdesign Conversion Problem, Websitebesucher keine Kunden",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.80" },
  },
  {
    path: "/keine-terminbuchung-online",
    title: "Keine Online-Terminbuchung? Das kostet Sie täglich Patienten & Kunden | Cogniiq",
    description: "Ohne Online-Terminbuchung verlieren Sie Patienten und Kunden an Wettbewerber. Cogniiq integriert Terminbuchungssysteme in Ihre Website – in wenigen Tagen.",
    keywords: "Keine Online Terminbuchung, Terminbuchung Website, Online Buchungssystem integrieren",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.80" },
  },
  {
    path: "/zu-viel-manuelle-arbeit",
    title: "Zu viel manuelle Arbeit im Unternehmen? KI löst das | Cogniiq",
    description: "Wiederkehrende manuelle Aufgaben bremsen Ihr Wachstum. Cogniiq automatisiert Buchungen, Kommunikation und Verwaltung mit KI – damit Ihr Team sich auf das Wesentliche konzentriert.",
    keywords: "Manuelle Arbeit automatisieren, Prozesse automatisieren, KI gegen manuelle Aufgaben, Automatisierung KMU",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.80" },
  },
  {
    path: "/digitale-automatisierung-unternehmen",
    title: "Digitale Automatisierung für Unternehmen – Praxisnah & sofort einsetzbar | Cogniiq",
    description: "Digitale Automatisierung für KMU: Vom Erstgespräch bis zum laufenden System in 7–14 Tagen. Cogniiq entwickelt Automatisierungssysteme, die wirklich eingesetzt werden.",
    keywords: "Digitale Automatisierung, Automatisierung KMU, KI Digitalisierung Unternehmen, Digital Transformation",
    indexable: true,
    sitemap: { lastmod: "2026-03-14", changefreq: "monthly", priority: "0.80" },
  },

  // ─── BLOG ────────────────────────────────────────────────────────────────────
  {
    path: "/blog",
    title: "Blog – KI, Webdesign & Automatisierung für Unternehmen | Cogniiq",
    description: "Praktisches Wissen zu KI-Systemen, Webdesign und Prozessautomatisierung: Praxistipps, Fallstudien und Brancheneinblicke für Unternehmer in Bayern.",
    keywords: "Cogniiq Blog, KI Unternehmen Blog, Webdesign Tipps, Automatisierung Blog",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "weekly", priority: "0.70" },
  },
  {
    path: "/blog/ki-automatisierung-kleine-unternehmen",
    title: "KI-Automatisierung für kleine Unternehmen 2025 | Leitfaden",
    description: "KI-Automatisierung für kleine Unternehmen: Welche Prozesse sich lohnen, was es kostet und wie der Einstieg gelingt. Mit konkreten Beispielen aus der Praxis.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "monthly", priority: "0.60" },
  },
  {
    path: "/blog/ki-telefonassistent-arztpraxis",
    title: "KI-Telefonassistent Arztpraxis 2025 | Vorteile & Kosten",
    description: "Wie ein KI-Telefonassistent Arztpraxen dabei hilft, verpasste Anrufe zu eliminieren, Termine automatisch zu buchen und das Praxisteam zu entlasten.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "monthly", priority: "0.60" },
  },
  {
    path: "/blog/webdesign-konversion-tipps",
    title: "Webdesign für mehr Anfragen & Konversion 2025 | 8 Tipps",
    description: "Warum viele Unternehmenswebsites keine Anfragen generieren – und wie Sie mit gezielten Webdesign-Entscheidungen die Konversionsrate verdoppeln können.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "monthly", priority: "0.60" },
  },
  {
    path: "/blog/lokales-seo-unternehmen",
    title: "Lokales SEO für Unternehmen 2025 | Google Maps & lokale Suche",
    description: "Lokales SEO erklärt: Wie Unternehmen in Google Maps sichtbar werden, welche Faktoren wirklich zählen und welche Fehler die meisten Betriebe machen.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "monthly", priority: "0.60" },
  },
  {
    path: "/blog/prozessautomatisierung-roi",
    title: "Prozessautomatisierung ROI berechnen 2025 | Leitfaden",
    description: "Wie Sie den Return on Investment einer Prozessautomatisierung korrekt berechnen – mit Formel, konkreten Beispielen und typischen Kostenfallen.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "monthly", priority: "0.60" },
  },
  {
    path: "/blog/verpasste-anrufe-kosten",
    title: "Verpasste Anrufe Kosten berechnen | KI-Telefonassistent",
    description: "Wie teuer sind verpasste Anrufe wirklich? Eine ehrliche Kalkulation mit Durchschnittswerten aus deutschen KMU – und wie ein KI-Telefonassistent den Verlust stoppt.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "monthly", priority: "0.60" },
  },
  {
    path: "/blog/ki-telefonassistent-restaurant",
    title: "KI-Telefonassistent Restaurant 2025 | Reservierungen automatisieren",
    description: "Wie Restaurants mit einem KI-Telefonassistenten Reservierungen automatisch annehmen, Wartelisten führen und Gäste nachqualifizieren – ohne Personal.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "monthly", priority: "0.60" },
  },
  {
    path: "/blog/website-ohne-anfragen",
    title: "Website bringt keine Anfragen? Ursachen & Lösungen 2025",
    description: "Die häufigsten Gründe, warum Unternehmenswebsites keine Anfragen generieren – und konkrete Schritte, um das in wenigen Wochen zu ändern.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "monthly", priority: "0.60" },
  },
  {
    path: "/blog/digitalisierung-mittelstand",
    title: "Digitalisierung Mittelstand 2025 | Wo anfangen & was vermeiden",
    description: "Digitalisierung im deutschen Mittelstand: Ein praxisorientierter Einstiegsleitfaden, der zeigt, welche Maßnahmen wirklich Wirkung haben – und welche Fallen es zu vermeiden gilt.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "monthly", priority: "0.60" },
  },
  {
    path: "/blog/webdesign-agentur-auswahl",
    title: "Webdesign Agentur auswählen 2025 | 7 entscheidende Kriterien",
    description: "Wie finden Sie die richtige Webdesign-Agentur für Ihr Unternehmen? 7 konkrete Auswahlkriterien, die vor überteuerten Projekten und schlechten Ergebnissen schützen.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "monthly", priority: "0.60" },
  },

  // ─── LEGAL ───────────────────────────────────────────────────────────────────
  {
    path: "/impressum",
    title: "Impressum | Cogniiq",
    description: "Impressum von Cogniiq – Anbieterkennzeichnung gemäß § 5 DDG, Kontaktangaben und rechtliche Hinweise.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "yearly", priority: "0.30" },
  },
  {
    path: "/datenschutz",
    title: "Datenschutzerklärung | Cogniiq",
    description: "Datenschutzerklärung von Cogniiq: Welche Daten wir verarbeiten, Hosting, Kontaktanfragen, Google Ads mit Einwilligung (Consent Mode v2) und Ihre Rechte.",
    indexable: true,
    sitemap: { lastmod: "2026-07-23", changefreq: "yearly", priority: "0.30" },
  },

  // ─── NON-INDEXABLE PUBLIC SURFACES ───────────────────────────────────────────
  // Reachable and prerendered (so it is not a hard 404 and not an empty shell),
  // but held out of every index: it is the post-submission confirmation page,
  // already Disallow-ed in public/robots.txt.
  {
    path: "/anfrage-erhalten",
    title: "Anfrage erhalten – wir melden uns | Cogniiq",
    description: "Ihre Anfrage ist bei uns eingegangen. Wir melden uns in der Regel innerhalb eines Werktags mit einem konkreten Vorschlag für das weitere Vorgehen.",
    indexable: false,
  },
];

/** Canonical URL for a public path. Trailing slash only on the homepage. */
export function canonicalFor(path: string): string {
  return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path.replace(/\/+$/, '')}`;
}

export const INDEXABLE_ROUTES: readonly PublicRoute[] = PUBLIC_ROUTES.filter((r) => r.indexable);

export function routeFor(path: string): PublicRoute | undefined {
  return PUBLIC_ROUTES.find((r) => r.path === path);
}

// normalizePath / isKnownPublicRoute now live in ./publicRoutePaths, which holds
// the paths WITHOUT the per-route title, description and keyword strings. The
// browser only ever needed set membership, and importing this module to get it
// pulled ~39 KiB of unread marketing prose into the entry chunk of every route.
// They are re-exported here so every existing build-time consumer of this module
// keeps working unchanged; the two client callers (src/App.tsx and
// CanonicalManager) import from ./publicRoutePaths directly so this file stays
// out of the client bundle entirely.
export { normalizePath, isKnownPublicRoute, PUBLIC_ROUTE_PATHS } from './publicRoutePaths';

export const DEFAULT_ROUTE_ROBOTS =
  'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

export const NOINDEX_ROUTE_ROBOTS = 'noindex, nofollow';
