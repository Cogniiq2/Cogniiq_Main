import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/muenchen/website-erstellen",
  city: "München",
  citySlug: "muenchen",
  cityHub: "/muenchen",
  topic: "Website erstellen",
  seo: {
    title: "Website erstellen lassen München – Premium & SEO-dominierend | Cogniiq",
    description:
      "Website erstellen lassen in München: Cogniiq entwickelt premium Websites für Unternehmen in München – schnell, SEO-ready, DSGVO-konform. Für den kompetitivsten lokalen Markt in Bayern.",
    canonical: `${base}/muenchen/website-erstellen`,
    keywords:
      "Website erstellen München, Homepage erstellen München, Website erstellen lassen München, neue Website München",
  },
  hero: {
    h1: "Website erstellen lassen in München",
    lead: "München ist Deutschlands wettbewerbsintensivster lokaler Digitalmarkt. Wer hier eine neue Website erstellen lässt, braucht mehr als ein schönes Design – er braucht ein technisch überlegenes, SEO-dominierendes System.",
    trustTags: ["München", "Premium-Standard", "SEO-Dominanz", "DSGVO-konform"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Website erstellen in München",
    items: [
      { label: "Für wen", value: "Unternehmen mit Wachstumsambitionen in München" },
      { label: "Typische Ergebnisse", value: "Top-Rankings, mehr qualifizierte Anfragen" },
      { label: "Projektdauer", value: "1–8 Wochen" },
      { label: "Preisrahmen", value: "ab ca. 1.500 €" },
    ],
  },
  intro: {
    heading: "Was eine neue Website in München leisten muss",
    paragraphs: [
      "In München reicht 'gut genug' nicht. Die Zielgruppe – ob Privatkunden, B2B-Entscheider oder Touristen – vergleicht digital versiert und entscheidet schnell. Eine neue Website muss beim ersten Eindruck überzeugen, innerhalb von zwei Sekunden laden und für relevante Münchner Suchanfragen gefunden werden.",
      "Cogniiq entwickelt Websites für München mit einer klaren Strategie: Wettbewerbsanalyse zuerst, dann Design und Entwicklung, dann vollständiges Local SEO-Setup. Das Ergebnis ist kein generisches Produkt, sondern ein System, das auf die spezifischen Wettbewerbssituationen in Ihrer Branche in München ausgerichtet ist.",
      "Jede Website wird mit modernen Web-Technologien entwickelt: sauberer Code, Core Web Vitals grün, Mobile-First, strukturierte Daten, DSGVO-konform ab Auslieferung. Kein Template, kein Baukasten.",
    ],
  },
  painPoints: [
    "Münchner Zielgruppe reagiert auf langsame oder generische Websites sofort mit Absprung",
    "Harter lokaler Wettbewerb: ohne erstklassiges SEO-Setup keine organische Sichtbarkeit",
    "Fehlende Skalierbarkeit: Website wächst nicht mit dem Unternehmen – teurer Relaunch alle 2 Jahre",
    "Erster digitaler Auftritt zu schwach positioniert für den Münchner Premium-Markt",
  ],
  deliverables: {
    heading: "Was Sie mit einer neuen Website von Cogniiq erhalten",
    items: [
      "Premium individuelles Design nach Ihrer Marke",
      "Responsive Design: optimal auf allen Geräten",
      "On-Page SEO: vollständig optimiert für München",
      "Local SEO Setup: Google Business, strukturierte Daten",
      "DSGVO-Seiten vollständig: Impressum, Datenschutz, Consent",
      "Kontaktformular mit automatischer Bestätigungs-Mail",
      "Google Analytics 4 & Search Console",
      "Performance: Ladezeit unter 1,5s, Core Web Vitals grün",
      "Skalierbare Architektur: kein Relaunch beim Wachsen nötig",
      "Übergabe mit CMS und Schulung",
    ],
  },
  localRelevance: {
    heading: "Website erstellen in München – Anforderungen des Markts",
    paragraphs: [
      "Keine andere Stadt in Bayern stellt höhere Anforderungen an Webdesign-Qualität. Unternehmen, die in München neue Kunden gewinnen wollen, konkurrieren mit gut aufgestellten, digital-affinen Wettbewerbern. Eine Website, die in Bamberg oder Bayreuth die Konkurrenz übertrifft, ist in München oft Durchschnitt.",
      "Das bedeutet konkret: höhere technische Standards (Core Web Vitals unter 1,5s statt 2s), tiefere SEO-Strategie (nicht nur On-Page, sondern Backlinks und Topical Authority), und ein Design, das Münchner Premium-Erwartungen erfüllt – nicht nur solide ist.",
      "Cogniiq entwickelt mit diesem Anspruch. Persönliche Termine in München auf Wunsch möglich.",
    ],
  },
  faq: [
    {
      question: "Was unterscheidet eine Münchner Website von einer in kleineren Städten?",
      answer: "Höhere SEO-Anforderungen, stärkerer Wettbewerb, anspruchsvollere Zielgruppe. Eine München-Website braucht mehr SEO-Tiefe, bessere Performance und ein Design auf Premium-Niveau.",
    },
    {
      question: "Wie lange dauert die Erstellung einer neuen Website in München?",
      answer: "7–14 Tage für kompakte Projekte. 4–8 Wochen für Websites mit vollständiger SEO-Strategie.",
    },
    {
      question: "Muss ich Texte selbst liefern?",
      answer: "Nein. Cogniiq erstellt Conversion-optimierte Texte mit Fokus auf Münchner Suchbegriffe und Zielgruppen.",
    },
    {
      question: "Kann ich die Website selbst bearbeiten?",
      answer: "Ja. CMS-Übergabe und Schulung sind Standard.",
    },
    {
      question: "Welche Technologien werden verwendet?",
      answer: "Moderne Web-Technologien für maximale Performance. Kein WordPress-Baukasten, kein Page-Builder – sauberer, optimierter Code.",
    },
    {
      question: "Ist die Website direkt bei Google gefunden?",
      answer: "Mit vollständigem SEO-Setup und Search Console beschleunigen wir die Indexierung. Erste Sichtbarkeit typisch nach 2–6 Wochen.",
    },
    {
      question: "Was kostet eine Website in München?",
      answer: "Ab ca. 1.500 €. Für wettbewerbsfähige Sichtbarkeit in München typisch ab 2.500–4.000 €. Detaillierte Preisübersicht unter /muenchen/webdesign-kosten.",
    },
    {
      question: "Bietet Cogniiq auch laufende Betreuung für München an?",
      answer: "Ja. Monatliche Betreuung, SEO-Monitoring und Content-Updates sind verfügbar.",
    },
    {
      question: "Kann die Website skaliert werden?",
      answer: "Ja. Alle Cogniiq-Websites sind skalierbar – ohne Relaunch beim Wachstum.",
    },
    {
      question: "Wie starte ich?",
      answer: "Kostenloses Erstgespräch – remote oder vor Ort in München.",
    },
  ],
  internalLinks: [
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "Webdesign Kosten München", href: "/muenchen/webdesign-kosten" },
    { label: "Website Relaunch München", href: "/muenchen/website-relaunch" },
    { label: "Landingpage München", href: "/muenchen/landingpage" },
    { label: "Lokales SEO München", href: "/muenchen/lokales-seo" },
    { label: "Alle Leistungen", href: "/leistungen" },
  ],
};

export function WebsiteErstellenMuenchen() {
  return <ClusterPage config={config} />;
}
