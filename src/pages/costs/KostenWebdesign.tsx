import { CostPage } from "@/components/CostPage";
import type { CostPageConfig } from "@/components/CostPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: CostPageConfig = {
  seo: {
    title: "Was kostet eine Website? Webdesign Kosten & Preise | Cogniiq",
    description: "Was kostet eine Website in Deutschland? Webdesign Kosten, Preise und Einflussfaktoren erklärt. Von der einfachen Homepage bis zur komplexen Unternehmenswebsite – transparente Preisübersicht.",
    canonical: `${BUSINESS_INFO.website}/kosten-webdesign`,
  },
  h1: "Was kostet Webdesign? Kosten & Preise",
  intro: "Die Kosten für eine Website hängen von vielen Faktoren ab. Hier finden Sie eine transparente Übersicht über typische Preisspannen, Einflussfaktoren und konkrete Beispielprojekte – damit Sie eine fundierte Entscheidung treffen können.",
  serviceLink: "/leistungen",
  serviceLinkLabel: "Webdesign Leistungen",
  priceRanges: [
    {
      label: "Einfach",
      range: "ab 1.500 €",
      description: "Professionelle Visitenkarten-Website mit 4–6 Seiten, responsivem Design, On-Page SEO und DSGVO-Konformität. Ideal für Einzelunternehmer und kleine Betriebe.",
    },
    {
      label: "Mittelstand",
      range: "2.500 – 6.000 €",
      description: "Unternehmenswebsite mit erweiterter Seitenstruktur, Conversion-Optimierung, Local SEO, strukturierten Daten und Google Analytics. Für wachsende Unternehmen.",
    },
    {
      label: "Premium",
      range: "ab 6.000 €",
      description: "Komplexe Website mit umfassender SEO-Strategie, KI-Integration, Automatisierung, Content-Strategie und laufender Betreuung. Für Marktführer und ambitionierte Unternehmen.",
    },
  ],
  priceFactors: [
    {
      title: "Anzahl der Seiten und Unterseiten",
      description: "Mehr Seiten bedeuten mehr Konzeption, Design und technische Umsetzung. Eine 4-seitige Website kostet deutlich weniger als eine 20-seitige Unternehmenswebsite.",
    },
    {
      title: "Individuelles Design vs. Template",
      description: "Ein vollständig individuell entwickeltes Design ist aufwändiger als die Anpassung eines bestehenden Themes. Cogniiq entwickelt ausschließlich individuell – kein Copy-Paste.",
    },
    {
      title: "Technische Funktionen und Integrationen",
      description: "Buchungssysteme, CRM-Anbindungen, Online-Shops oder KI-Integrationen erhöhen den Aufwand und damit die Kosten. Einfache Kontaktformulare sind günstiger.",
    },
    {
      title: "SEO-Umfang",
      description: "Basis-SEO ist in jedem Paket enthalten. Erweiterte lokale SEO-Strategien, Keyword-Recherche, strukturierte Daten und Backlink-Aufbau sind kostenpflichtige Ergänzungen.",
    },
    {
      title: "Content-Erstellung",
      description: "Müssen Texte, Bilder und Grafiken erstellt werden? Content-Erstellung durch Cogniiq wird separat berechnet. Liefern Sie eigenen Content, sinkt der Preis.",
    },
    {
      title: "Laufende Wartung und Betreuung",
      description: "Hosting, Updates, Sicherheits-Backups und Inhaltspflege können als monatliches Paket hinzugebucht werden. Diese Kosten entstehen dauerhaft, nicht einmalig.",
    },
  ],
  exampleProjects: [
    {
      title: "Handwerksbetrieb Bayreuth",
      description: "Neue 6-seitige Website mit responsivem Design, Local SEO Setup für Bayreuth, Google Business Optimierung, DSGVO-konforme Seiten und Kontaktformular mit Bestätigungs-Mail.",
      investment: "1.800 – 2.400 €",
    },
    {
      title: "Arztpraxis München",
      description: "Praxis-Website mit Online-Terminbuchungsintegration, DSGVO-konformer Patient-Kommunikation, Local SEO für München, strukturierten Daten für Gesundheitsdienstleister.",
      investment: "3.500 – 5.000 €",
    },
    {
      title: "Gastronomie Regensburg",
      description: "Restaurant-Website mit digitaler Speisekarte, Tischreservierungssystem, Integration KI-Telefonassistent für Anruf-Reservierungen und Local SEO Optimierung.",
      investment: "2.800 – 4.200 €",
    },
    {
      title: "Mittelstandsunternehmen deutschlandweit",
      description: "Unternehmenswebsite mit 15+ Seiten, umfassender SEO-Strategie, mehreren Standortseiten, Automatisierungsintegration für Lead-Management und laufender Betreuung.",
      investment: "ab 7.500 €",
    },
  ],
  cityLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "Webdesign Bayern", href: "/bayern" },
    { label: "Webdesign Deutschland", href: "/webdesign-agentur-deutschland" },
  ],
  industryLinks: [
    { label: "Webdesign Gastronomie", href: "/webdesign-gastronomie" },
    { label: "Webdesign Arzt", href: "/webdesign-arzt" },
    { label: "Webdesign Immobilien", href: "/webdesign-immobilien" },
    { label: "Webdesign Hotel", href: "/webdesign-hotel" },
    { label: "Webdesign Sport", href: "/webdesign-sport" },
  ],
  faq: [
    {
      question: "Was kostet eine einfache Website in Deutschland?",
      answer: "Eine professionelle Einsteiger-Website mit 4–6 Seiten, responsivem Design und DSGVO-Konformität beginnt bei ca. 1.500 €. Der genaue Preis hängt vom Umfang und den gewünschten Funktionen ab.",
    },
    {
      question: "Ist Webdesign von Cogniiq teurer als ein Baukasten?",
      answer: "Kurzfristig ja, langfristig nein. Baukastenlösungen kosten monatliche Gebühren, bieten schlechte SEO-Performance und liefern keine individuellen Lösungen. Eine Cogniiq-Website hat keine laufenden Gebühren, rankt besser und konvertiert messbar mehr Besucher.",
    },
    {
      question: "Was kostet monatliche Website-Wartung?",
      answer: "Wartungspakete bei Cogniiq beginnen ab ca. 50–150 €/Monat – inklusive Hosting, Backups, Updates und kleiner Anpassungen. Der genaue Umfang wird im Erstgespräch definiert.",
    },
    {
      question: "Wie viel kostet eine Website mit SEO?",
      answer: "On-Page SEO Basis ist in jedem Paket inklusive. Erweiterte Local SEO Strategien für spezifische Städte und Branchen kosten ca. 500–2.000 € einmalig, je nach Wettbewerbsumfeld.",
    },
    {
      question: "Zahle ich die Website in Raten?",
      answer: "Ja. Bei größeren Projekten ist eine Aufteilung in Anzahlung, Zwischenzahlung bei Fertigstellung und Rest bei Go-Live möglich. Die genaue Zahlungsstruktur wird individuell vereinbart.",
    },
    {
      question: "Was kostet eine Website mit Terminbuchungssystem?",
      answer: "Die Integration eines Terminbuchungssystems – z.B. für Arztpraxen oder Dienstleister – kostet je nach Komplexität ca. 800–2.500 € zusätzlich. Bei Integration des KI-Telefonassistenten entstehen Synergieeffekte.",
    },
    {
      question: "Sind Bilder und Texte im Preis inbegriffen?",
      answer: "Nein, standardmäßig nicht. Professionelle Texterstellung kostet ca. 80–150 € pro Seite. Stock-Bilder oder eigene Fotografie werden separat berechnet. Liefern Sie eigenen Content, entfällt dieser Aufwand.",
    },
    {
      question: "Wie lange gilt das Angebot und wann muss ich entscheiden?",
      answer: "Angebote von Cogniiq sind 30 Tage gültig. Es gibt keinen Druck zur schnellen Entscheidung – wir klären alle Fragen im kostenlosen Erstgespräch und geben Ihnen Zeit zur Entscheidung.",
    },
  ],
  ctaHeadline: "Kostenloses Angebot für Ihre Website",
  ctaText: "Im kostenlosen Erstgespräch analysieren wir Ihre Situation, Ihre Ziele und geben Ihnen ein konkretes Preisangebot – ohne versteckte Kosten, ohne Verpflichtung.",
};

export function KostenWebdesign() {
  return <CostPage config={config} />;
}
