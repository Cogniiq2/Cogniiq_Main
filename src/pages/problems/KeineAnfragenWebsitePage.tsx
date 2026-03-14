import { ProblemPage } from "@/components/ProblemPage";
import type { ProblemPageConfig } from "@/components/ProblemPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: ProblemPageConfig = {
  seo: {
    title: "Website bringt keine Anfragen? Ursachen & Lösungen | Cogniiq",
    description: "Warum Ihre Website keine Anfragen generiert – und wie Sie das ändern. Conversion-Probleme, fehlende SEO und schlechte User Experience identifiziert und behoben.",
    canonical: `${BUSINESS_INFO.website}/keine-anfragen-website`,
  },
  h1: "Warum Ihre Website keine Anfragen generiert",
  tagline: "Problem · Website Conversion · Anfragen",
  intro: "Viele Unternehmen investieren in eine Website und erwarten Anfragen – die nie kommen. Das liegt selten an der Branche, fast immer an vermeidbaren Fehlern in Design, SEO und Conversion-Optimierung.",
  problem: {
    headline: "Die häufigsten Gründe, warum Websites keine Anfragen bringen",
    points: [
      "Kein Google-Ranking: Niemand findet die Website, weil kein SEO gemacht wurde",
      "Langsame Ladezeit: Besucher springen sofort ab, bevor sie die Seite sehen",
      "Kein klares Call-to-Action: Besucher wissen nicht, was sie tun sollen",
      "Schlechte mobile Optimierung: 65 % aller Suchen kommen vom Smartphone",
      "Keine lokale SEO-Sichtbarkeit bei stadtspezifischen Suchanfragen",
      "Veraltetes Design: Besucher vertrauen der Website nicht und verlassen sie",
      "Kein Tracking: Unklar, wo Besucher abspringen und warum keine Anfragen kommen",
    ],
  },
  costs: {
    headline: "Was eine nicht konvertierende Website Ihr Unternehmen kostet",
    points: [
      {
        title: "Investition ohne Rückfluss",
        description: "Eine Website, die keine Anfragen bringt, kostet Hosting, Wartung und Pflege – ohne messbaren Return. Das Geld wäre besser in eine funktionierende Lösung investiert.",
      },
      {
        title: "Verpasste organische Nachfrage",
        description: "Täglich suchen Menschen in Ihrer Stadt nach Ihren Leistungen. Ohne SEO-Sichtbarkeit bekommen Sie diese Anfragen nicht – Ihre Konkurrenten schon.",
      },
      {
        title: "Reputationsschaden durch schlechten ersten Eindruck",
        description: "Eine langsame, veraltete oder nicht-mobile Website schadet dem Vertrauen. Interessenten entscheiden innerhalb von 3 Sekunden, ob sie bleiben oder gehen.",
      },
      {
        title: "Keine Daten für Optimierung",
        description: "Ohne Tracking-Setup ist unklar, wo Besucher herkommen und warum sie nicht anfragen. Blinde Optimierung ohne Daten ist Glückssache.",
      },
    ],
  },
  solution: {
    headline: "Websites, die messbar Anfragen generieren.",
    text: "Cogniiq entwickelt Websites, die bei relevanten Google-Suchen sichtbar sind, Besucher in Anfragen konvertieren und messbar Ergebnisse liefern. Core Web Vitals, Local SEO, Conversion-Struktur und Tracking – alles inklusive.",
    bullets: [
      "Local SEO: gefunden bei relevanten Suchen in Ihrer Stadt",
      "Core Web Vitals: Ladezeit unter 2 Sekunden",
      "Conversion-optimiertes Design mit klaren CTAs",
      "Mobile-first: perfekt auf jedem Smartphone",
      "Google Analytics 4 & Search Console Setup",
      "DSGVO-konforme Website mit allen Pflichtseiten",
    ],
  },
  serviceLinks: [
    { label: "Webdesign Leistungen", href: "/leistungen" },
    { label: "Webdesign Kosten", href: "/kosten-webdesign" },
    { label: "Webdesign Agentur Deutschland", href: "/webdesign-agentur-deutschland" },
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Kontakt", href: "/kontakt" },
  ],
};

export function KeineAnfragenWebsitePage() {
  return <ProblemPage config={config} />;
}
