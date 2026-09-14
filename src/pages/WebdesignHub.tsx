// ─────────────────────────────────────────────────────────────────────────────
// /webdesign — kanonischer Eigentümer der nationalen Webdesign-Kopfintention.
//
// WAS SICH AM 13.09.2026 GEÄNDERT HAT
//
// Bis dahin war diese Seite ein Verzeichnis: 578 gerenderte Wörter, drei H3,
// 32 Links im Körper, davon 24 auf Stadt- und Stadt×Branche-Unterseiten mit
// Ankern wie „Lokales SEO Bayreuth" und „Landingpage Regensburg". Google hat
// das wörtlich genommen: Der größte Teil ihrer Impressionen kam auf lokale
// Queries („seo bayreuth", „webentwicklung regensburg", „homepage erstellen
// lassen regensburg") auf Positionen um 70–90 — auf Begriffe, die längst
// eigene Seiten besitzen. Am 31.08.2026 fiel die Sichtbarkeit auf null.
// Befund und Zeitlinie: docs/seo/ARCHITEKTUR.md §5.
//
// `/webdesign-agentur-deutschland`, die zweite nationale Seite auf dieselbe
// Intention, bleibt VORERST live: Ihre Konsolidierung hierher ist beschlossen,
// aber aufgeschoben, weil sie Anker in zwei eingefrorene Experimente trägt
// (docs/seo/ARCHITEKTUR.md §5.1, F9). Neue interne Autorität zeigt seit dem
// 13.09.2026 hierher, nicht mehr dorthin. Nichts von ihrem Inhalt wurde
// kopiert: Preise, Projektdauern, eine CMS-Herstellerliste und „nachweislich
// besser ranken" haben keine Quelle. Herkunftsprüfung: docs/seo/preisaudit-webdesign.md.
//
// WOFÜR DIESE SEITE GEBAUT IST
//
// Für eine Geschäftsführerin oder einen Inhaber, der entscheidet, ob Cogniiq
// die Website des Unternehmens bauen soll. Die Abschnitte sind die Fragen, die
// vor dieser Entscheidung stehen: was gebaut wird, für wen — und für wen nicht —,
// neu oder Relaunch, was ein Projekt umfasst, wer Inhalte liefert, welche
// technische Grundlage, wie SEO, Performance, Tracking, Einwilligung und
// Barrierefreiheit ins Projekt kommen, was bei Schnittstellen gilt, was ein
// Relaunch für bestehende Rankings bedeutet, was es kostet, wie es abläuft und
// was der nächste Schritt ist.
//
// WAS DIESE SEITE NICHT TUT
//
// Sie zielt nicht auf Städte: Lokale Webdesign-Intention gehört den Stadtseiten
// (/<stadt>/webdesign), die hier mit Ortsnamen verlinkt sind, nicht mit
// „Webdesign <Stadt>". Sie zielt nicht auf die Kostenintention: Die gehört
// /kosten-webdesign, hier stehen nur die Preistreiber in vier Sätzen. Sie ist
// nicht die Relaunch-Seite: Die Relaunch-Intention gehört den Relaunch-Seiten.
//
// EINGEFRORENE ROUTEN. Vier Ziele in diesem Körper sind laufende
// Suchexperimente. Der Freeze zählt jede Erwähnung ihres Pfads im Quellbaum,
// diese Datei eingeschlossen; jede dieser Adressen steht hier deshalb genau
// einmal — wie vor dem Umbau.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  CircleCheck as CheckCircle2,
  Dumbbell,
  FileText,
  Hotel,
  Layers,
  MapPin,
  Plug,
  Search,
  Stethoscope,
  Utensils,
  XCircle,
} from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { trackEvent } from "@/lib/consent";

const BASE = BUSINESS_INFO.website;
const CANONICAL = `${BASE}/webdesign`;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const breadcrumbs = [
  { name: "Home", url: BASE },
  { name: "Webdesign", url: CANONICAL },
];

// ── Für wen / für wen nicht ──────────────────────────────────────────────────

const PASST = [
  "Ihre Website soll eine bestimmte Aufgabe erfüllen: Anfragen, Buchungen, Bewerbungen, Termine — und Sie können sagen, welche.",
  "Jemand in Ihrem Unternehmen kann Inhalte liefern oder freigeben und ist während des Projekts erreichbar.",
  "Sie suchen einen Partner, der Struktur, Umsetzung und Suchmaschinen-Grundlagen aus einer Hand verantwortet, nicht nur ein Layout.",
  "Sie wollen wissen, was im Projekt enthalten ist und was nicht — und akzeptieren, dass ein Angebot nach dem Erstgespräch kommt, nicht davor.",
];

const PASST_NICHT = [
  {
    fall: "Sie brauchen eine einfache Visitenkarte im Netz.",
    grund: "Für eine einfache digitale Visitenkarte kann ein Baukasten die wirtschaftlichere Lösung sein. Wir sagen Ihnen das im Erstgespräch, statt ein Projekt daraus zu machen.",
  },
  {
    fall: "Niemand kann Texte, Bilder oder Freigaben liefern.",
    grund: "Fehlende Inhalte können ein Website-Projekt ausbremsen. Eine zuständige Person auf Ihrer Seite ist deshalb Voraussetzung für den Start.",
  },
  {
    fall: "Die Website hat kein definiertes Ziel.",
    grund: "„Moderner aussehen“ ist kein Ziel, an dem sich Struktur und Inhalte ausrichten lassen. Wir helfen beim Formulieren — aber ein Ziel muss es geben.",
  },
  {
    fall: "Sie erwarten garantierte Google-Positionen.",
    grund: "Rankings vergibt Google, nicht wir. Wir bauen die Voraussetzungen und messen — versprechen lässt sich dieses Ergebnis nicht.",
  },
  {
    fall: "Ein Drittsystem muss angebunden werden, gibt den Zugang aber nicht her.",
    grund: "Ohne geeignete Schnittstelle oder Export gibt es keine Anbindung. Das prüfen wir vor dem Angebot; ist es ausgeschlossen, sagen wir es.",
  },
  {
    fall: "Die Website ist nicht Ihr Engpass.",
    grund: "Wenn Anrufe unbeantwortet bleiben oder Abläufe im Betrieb haken, hilft eine neue Website wenig. Dann ist ein anderes System dran.",
  },
];

// ── Neu oder Relaunch ────────────────────────────────────────────────────────

const RELAUNCH_ENTSCHEIDUNG = [
  {
    frage: "Wird die Seite heute gefunden?",
    neu: "Wenn kaum organische Sichtbarkeit oder wertvolle bestehende Adressen vorhanden sind, ist das SEO-Migrationsrisiko geringer — trotzdem prüfen wir vor einem Neubau, was erhalten werden sollte: Backlinks, direkte Besucher, indexierte Seiten.",
    relaunch: "Es gibt Rankings und Besucher: Dann braucht der Relaunch einen sauberen Migrations- und Weiterleitungsplan, um bestehende Signale möglichst zu erhalten. Vollständig garantieren lässt sich ihre Übertragung nicht.",
  },
  {
    frage: "Trägt die Struktur noch?",
    neu: "Seitenstruktur, Navigation und Inhalte passen nicht mehr zum Angebot: neu konzipieren.",
    relaunch: "Die Struktur stimmt, Technik oder Gestaltung sind veraltet: umbauen, nicht neu erfinden.",
  },
  {
    frage: "Lässt sich die Technik weiterführen?",
    neu: "Ein System, das keine Updates mehr bekommt oder niemand mehr betreuen kann, wird ersetzt.",
    relaunch: "Ein gepflegtes System mit brauchbaren Inhalten wird behalten und ausgebaut.",
  },
];

// ── Die sieben Ebenen eines Projekts ─────────────────────────────────────────

const EBENEN = [
  {
    icon: Search,
    titel: "Strategie",
    punkte: ["Zielgruppe und Geschäftsziel", "Nutzerwege: Woher kommt jemand, was soll er tun?", "Informationsarchitektur: welche Seiten, in welcher Ordnung"],
  },
  {
    icon: FileText,
    titel: "Inhalt",
    punkte: ["Seitenstruktur und Kernaussagen je Seite", "Textzuständigkeiten: wer schreibt, wer gibt frei", "Bilder, Logos, Dokumente — vorhanden oder zu beschaffen"],
  },
  {
    icon: Layers,
    titel: "UX und Gestaltung",
    punkte: ["Hierarchie: was zuerst sichtbar ist", "Navigation und Kontaktwege", "Verhalten auf Smartphone, Tablet und Desktop"],
  },
  {
    icon: Plug,
    titel: "Entwicklung",
    punkte: ["Umsetzung des Frontends", "Redaktionssystem, wo Sie Inhalte selbst pflegen wollen", "Formulare, Schnittstellen, Messung"],
  },
  {
    icon: Search,
    titel: "Suche",
    punkte: ["Crawlbarkeit und Indexierbarkeit", "Titel, Beschreibungen, strukturierte Daten, wo sie etwas erklären", "Interne Verlinkung und Ladezeit-Grundlagen"],
  },
  {
    icon: CheckCircle2,
    titel: "Go-live",
    punkte: ["Prüfung auf echten Geräten", "Weiterleitungen bei Relaunch", "Messung und Indexierung nach dem Start geprüft, soweit vereinbart"],
  },
  {
    icon: Building2,
    titel: "Danach",
    punkte: ["Betreuung als Option, kein Zwang", "Änderungen an Inhalten und Struktur", "SEO- und Inhaltsarbeit, wenn vereinbart"],
  },
];

// ── Technische Grundlagen und Prüfpunkte ─────────────────────────────────────

const GRUNDLAGEN = [
  {
    titel: "Suchmaschinen",
    text: "Seiten bekommen Titel, Beschreibungen und Adressen, die ihr Thema benennen, und eine Struktur, die Suchmaschinen erreichen und einordnen können. Strukturierte Daten setzen wir dort ein, wo sie etwas Wahres über Ihr Unternehmen sagen — nicht als Dekoration. Welche SEO-Grundlagen zum Projekt gehören, steht im Angebot.",
  },
  {
    titel: "Ladezeit",
    text: "Bilder in passender Größe, Skripte nur dort, wo sie gebraucht werden, und ein sichtbarer erster Bildschirm, der nicht auf Skripte warten muss — das sind die Grundsätze. Gemessen wird vor dem Go-live mit den Core Web Vitals als Prüfmaß, nicht als Garantie: Ladezeiten hängen auch von Hosting, Inhalten und Endgerät ab.",
  },
  {
    titel: "Anfragen",
    text: "Jede Seite hat einen erkennbaren nächsten Schritt: anrufen, anfragen, buchen. Formulare fragen nur, was Sie zur Bearbeitung brauchen, und bestätigen den Eingang. Ob daraus mehr Anfragen werden, hängt von Angebot, Nachfrage und Inhalten ab — wir bauen die Voraussetzung und messen das Ergebnis, statt es vorher zu versprechen.",
  },
  {
    titel: "Messung",
    text: "Wenn Messung vereinbart ist, sehen Sie nach dem Start, welche Seiten besucht werden und wo Anfragen entstehen. Wir richten sie so ein, dass nicht notwendiges Tracking erst nach Einwilligung läuft und keine Formulareingaben mitgeschrieben werden.",
  },
  {
    titel: "Einwilligung",
    text: "Nicht notwendiges Tracking wird erst nach der entsprechenden Einwilligung aktiviert. Welche Dienste und Einwilligungen erforderlich sind, hängt vom konkreten Setup ab und wird vor dem Go-live mit Ihnen abgestimmt; eine Rechtsberatung ersetzen wir nicht.",
  },
  {
    titel: "Barrierefreiheit",
    text: "Barrierefreiheitsmerkmale wie Kontraste, Tastaturbedienung, Alternativtexte und beschriftete Formulare werden entsprechend dem vereinbarten technischen Umfang berücksichtigt. Ob und wie das Barrierefreiheitsstärkungsgesetz für Ihr Angebot gilt, ist eine Rechtsfrage, die Sie mit Ihrer Rechtsberatung klären — der technische Umfang steht im Angebot.",
  },
];

// ── Relaunch-Sicherung ───────────────────────────────────────────────────────

const RELAUNCH_PRUEFLISTE = [
  "Bestandsaufnahme aller heutigen Adressen und ihrer Rankings",
  "Weiterleitungsplan: alte Adressen auf ihre neuen Entsprechungen, möglichst ohne Ketten",
  "Titel und Beschreibungen mitnehmen oder bewusst ändern — nie zufällig verlieren",
  "Canonicals, Sitemap und Indexierbarkeit vor dem Start prüfen",
  "Interne Links auf die neuen Adressen umstellen",
  "Messung weiterführen, damit vorher und nachher vergleichbar bleiben",
  "Nach dem Start beobachten: Crawling, Indexierung, Fehlerseiten — im vereinbarten Zeitraum",
];

// ── Ablauf ───────────────────────────────────────────────────────────────────

const ABLAUF = [
  { nr: "01", titel: "Geschäftsziel und Anforderungen", text: "Was die Website erreichen soll, für wen, und was heute fehlt." },
  { nr: "02", titel: "Bestandsprüfung", text: "Bei bestehender Website: Rankings, Inhalte, Technik, Messung — was bleibt, was geht." },
  { nr: "03", titel: "Such- und Wettbewerbsblick", text: "Wonach Ihre Kunden suchen und was die sichtbaren Wettbewerber zeigen." },
  { nr: "04", titel: "Informationsarchitektur", text: "Welche Seiten es gibt, wie sie heißen, wie sie verlinkt sind." },
  { nr: "05", titel: "Inhaltszuständigkeiten", text: "Wer welche Texte und Bilder liefert, bis wann, wer freigibt." },
  { nr: "06", titel: "Gestaltungsrichtung", text: "Hierarchie, Farb- und Schriftwelt, Verhalten auf kleinen Bildschirmen." },
  { nr: "07", titel: "Umsetzung", text: "Frontend, Redaktionssystem wo nötig, Formulare." },
  { nr: "08", titel: "Schnittstellen", text: "Buchung, Kalender, Newsletter, CRM — nur, was vorher geprüft wurde." },
  { nr: "09", titel: "Qualitätsprüfung", text: "Echte Geräte, Ladezeit, Formulare, Barrierefreiheitspunkte, Rechtstexte vorhanden." },
  { nr: "10", titel: "SEO-Migration", text: "Bei Relaunch: Weiterleitungen, Metadaten, Sitemap, Indexierbarkeit." },
  { nr: "11", titel: "Ihre Abnahme", text: "Sie prüfen die Vorschau, wir arbeiten die vereinbarten Punkte ab, Sie geben frei." },
  { nr: "12", titel: "Go-live", text: "Umschaltung, Messung verifiziert, Indexierung angestoßen." },
  { nr: "13", titel: "Messen und nachschärfen", text: "Erste Wochen auswerten, Inhalte und Wege anpassen — im vereinbarten Rahmen." },
];

// ── Verzweigungen ────────────────────────────────────────────────────────────

const BRANCHEN = [
  { icon: Stethoscope, label: "Arztpraxen", href: "/webdesign-arzt" },
  { icon: Hotel, label: "Hotels", href: "/webdesign-hotel" },
  { icon: Utensils, label: "Gastronomie", href: "/webdesign-gastronomie" },
  { icon: Building2, label: "Immobilien", href: "/webdesign-immobilien" },
  { icon: Dumbbell, label: "Sport und Fitness", href: "/webdesign-sport" },
];

const STANDORTE = [
  { label: "Bayreuth", sub: "Hauptsitz, Oberfranken", href: "/bayreuth/webdesign" },
  { label: "München", sub: "vor Ort und remote", href: "/muenchen/webdesign" },
  { label: "Regensburg", sub: "Ostbayern", href: "/regensburg/webdesign" },
];

const RELAUNCH_SEITEN = [
  { label: "Bayreuth", href: "/bayreuth/website-relaunch" },
  { label: "München", href: "/muenchen/website-relaunch" },
  { label: "Regensburg", href: "/regensburg/website-relaunch" },
];

const KOSTEN_LOKAL = [
  { label: "Bayreuth", href: "/bayreuth/webdesign-kosten" },
  { label: "München", href: "/muenchen/webdesign-kosten" },
  { label: "Regensburg", href: "/regensburg/webdesign-kosten" },
];

// ── FAQ ──────────────────────────────────────────────────────────────────────

const faqItems = [
  {
    question: "Wer schreibt die Texte?",
    answer:
      "Die Fachaussagen kommen von Ihnen — niemand kennt Ihr Angebot besser. Wir legen fest, welche Seite was sagen muss, strukturieren Ihre Vorlagen und schreiben auf Wunsch aus. Freigeben müssen Sie in jedem Fall selbst.",
  },
  {
    question: "Nutzt Cogniiq für jede Website dieselbe Technik?",
    answer:
      "Nein. Wer Inhalte selbst pflegen will, braucht ein Redaktionssystem; wer vor allem Geschwindigkeit und wenig Wartung braucht, eine statisch ausgelieferte Website. Welche Grundlage wir vorschlagen, steht mit Begründung im Angebot.",
  },
  {
    question: "Ist SEO enthalten?",
    answer:
      "Technische SEO-Grundlagen — erreichbare Seiten, saubere Titel und Beschreibungen, interne Verlinkung, Ladezeit — können Bestandteil des vereinbarten Webdesign-Umfangs sein; der konkrete Umfang steht im Angebot. Laufende Suchmaschinenarbeit an Inhalten und Rankings wird gesondert vereinbart.",
  },
  {
    question: "Was passiert mit meinen Rankings bei einem Relaunch?",
    answer:
      "Sie lassen sich nicht garantieren, aber absichern: Adressinventar, Weiterleitungsplan, Metadaten-Übernahme und Kontrolle nach dem Start gehören zum Relaunch dazu. Die Prüfliste steht auf dieser Seite.",
  },
  {
    question: "Was kostet eine Website?",
    answer:
      "Der Preis hängt an Seitenumfang, Inhalten, Designaufwand, Schnittstellen, Barrierefreiheitsanforderungen und Betreuung. Eine Pauschale nennen wir vor dem Erstgespräch nicht; was den Preis bestimmt, erklärt die Kostenseite.",
  },
  {
    question: "Betreut Cogniiq Unternehmen in ganz Deutschland?",
    answer:
      "Ja. Der Sitz ist in Bayreuth, persönliche Termine sind in Bayern möglich; die Zusammenarbeit läuft sonst über Videotermine und geteilte Arbeitsdokumente.",
  },
  {
    question: "Gehört die Website danach mir?",
    answer:
      "Ja. Zugänge zu Domain, Hosting und Redaktionssystem und die Frage, auf wen Verträge laufen, werden im Angebot festgelegt — Betreuung nach dem Start ist keine Bedingung dafür.",
  },
];

// ── Schema ───────────────────────────────────────────────────────────────────
// Der Anbieter wird per @id referenziert, nicht als zweites, unvollständiges
// Organization-Objekt wiederholt: Das vollständige (mit Logo) liefert
// LocalBusinessSchema auf jeder öffentlichen Seite.
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${CANONICAL}#service`,
  name: "Webdesign und Website-Entwicklung für Unternehmen",
  description:
    "Konzeption, Gestaltung und Entwicklung von Unternehmenswebsites: Strategie, Inhalte, Gestaltung, Umsetzung, Suchmaschinen-Grundlagen, Go-live und Betreuung. Der konkrete Umfang wird im Angebot festgelegt.",
  provider: { "@id": `${BASE}/#organization` },
  areaServed: { "@type": "Country", name: "Deutschland" },
  serviceType: "Webdesign",
  url: CANONICAL,
  inLanguage: "de-DE",
};

function Abschnitt({
  id,
  titel,
  lead,
  dunkel = false,
  children,
}: {
  id: string;
  titel: string;
  lead?: string;
  dunkel?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`py-20 px-6 lg:px-10 transition-colors duration-300 ${
        dunkel ? "bg-gray-50 dark:bg-white/[0.02]" : "bg-white dark:bg-gray-950"
      }`}
      aria-labelledby={`${id}-heading`}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-10">
          <h2 id={`${id}-heading`} className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {titel}
          </h2>
          {lead && <p className="text-gray-500 dark:text-white/55 leading-relaxed max-w-3xl">{lead}</p>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

export function WebdesignHub() {
  return (
    <>
      <PageSEO
        title="Webdesign Agentur – Websites für Unternehmen | Cogniiq"
        description="Was eine Website bei Cogniiq umfasst, wer Inhalte liefert, wie SEO, Performance, Tracking und Barrierefreiheit ins Projekt kommen, was den Preis bestimmt und wie ein Projekt bis zum Go-live abläuft."
        canonical={CANONICAL}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={serviceSchema}
      />

      <main className="min-h-screen bg-white dark:bg-gray-950">
        {/* ── HERO ── */}
        <section className="pt-28 pb-16 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto">
            <nav aria-label="Breadcrumb" className="cq-rise flex items-center gap-1.5 text-sm text-pub-ink-3 dark:text-white/35 mb-8">
              <Link to="/" className="hover:text-gray-600 dark:hover:text-white/60 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <span className="text-gray-600 dark:text-white/60">Webdesign</span>
            </nav>

            <motion.p className="cq-rise text-xs font-semibold tracking-[0.18em] uppercase text-blue-600 dark:text-blue-400 mb-4">
              Webdesign Agentur · Deutschland
            </motion.p>
            <motion.h1 className="cq-rise cq-rise-d1 text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-[1.08] mb-6 max-w-4xl">
              Webdesign für Unternehmen: Websites mit einem klaren Auftrag
            </motion.h1>

            <div className="cq-rise cq-rise-d2 max-w-3xl space-y-5 text-[17px] lg:text-xl text-gray-500 dark:text-white/55 leading-relaxed mb-10">
              <p>
                Cogniiq konzipiert, gestaltet und entwickelt Websites für
                Unternehmen, die damit etwas Bestimmtes erreichen wollen:
                Anfragen, Buchungen, Termine, Bewerbungen. Strategie, Inhalte,
                Gestaltung, Umsetzung und Suchmaschinen-Grundlagen kommen aus
                einer Hand — und der Umfang steht vor dem Start im Angebot.
              </p>
              <p>
                Diese Seite beantwortet die Fragen, die vor der Beauftragung
                stehen: was wir bauen, für wen wir ein guter Partner sind und
                für wen nicht, neu oder Relaunch, wer Inhalte liefert, was
                technisch geschieht, was den Preis bestimmt und wie ein Projekt
                bis zum Go-live abläuft.
              </p>
            </div>

            <div className="cq-rise cq-rise-d3 flex flex-wrap gap-4">
              <Link
                to="/kontakt"
                onClick={() => trackEvent("cta_kontakt_click", "webdesign-hero")}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
              >
                Website-Projekt besprechen <ArrowRight size={15} />
              </Link>
              <Link
                to="/kosten-webdesign"
                onClick={() => trackEvent("cta_kosten_click", "webdesign-hero")}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:border-gray-300 dark:hover:border-white/20 font-semibold text-sm transition-colors"
              >
                Was eine Website kostet
              </Link>
            </div>
          </div>
        </section>

        {/* ── WAS WIR BAUEN ── */}
        <Abschnitt
          id="leistung"
          titel="Was Cogniiq baut"
          lead="Websites, deren Aufgabe sich benennen lässt. Nicht jedes Vorhaben gehört dazu — das steht bewusst weiter unten."
          dunkel
        >
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                titel: "Unternehmenswebsites",
                text: "Leistungen, Team, Kontaktwege und die Seiten, die Ihre Kunden vor einer Anfrage tatsächlich lesen. Für Dienstleister, Handwerk, Beratung, Mittelstand.",
              },
              {
                titel: "Websites für Praxen, Hotels und Gastronomie",
                text: "Mit den Wegen, die dort zählen: Terminanfrage, Direktbuchung, Reservierung. Welche Anbindung möglich ist, prüfen wir vor dem Angebot.",
              },
              {
                titel: "Relaunches bestehender Websites",
                text: "Neue Struktur oder Technik auf einer Website, die bereits gefunden wird — mit dem Weiterleitungs- und Prüfplan, der die vorhandenen Signale mitnimmt.",
              },
              {
                titel: "Landingpages für Kampagnen",
                text: "Einzelseiten mit einem Ziel, für Anzeigen oder Aktionen. Mit Messung, damit Sie sehen, ob die Seite ihren Zweck erfüllt.",
              },
            ].map(({ titel, text }, i) => (
              <motion.div
                key={titel}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.06}
                className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{titel}</h3>
                <p className="text-sm text-gray-500 dark:text-white/55 leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-sm text-gray-500 dark:text-white/50 max-w-3xl leading-relaxed">
            Shop- oder Portalfunktionen sind keine Standardleistung dieser Seite. Ob sie in Ihr
            Projekt gehören, klären wir im Erstgespräch — und bieten sie nur an, wenn Umfang und
            Schnittstellen vorher geprüft sind.
          </p>
        </Abschnitt>

        {/* ── FÜR WEN / FÜR WEN NICHT ── */}
        <Abschnitt
          id="passung"
          titel="Für wen Cogniiq passt — und für wen nicht"
          lead="Ein Website-Projekt scheitert selten an der Technik. Es scheitert an fehlenden Inhalten, einem fehlenden Ziel oder Erwartungen, die niemand erfüllen kann. Deshalb steht das hier, bevor Sie anfragen."
        >
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Es passt, wenn</h3>
              <ul className="space-y-3">
                {PASST.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-white/60 leading-relaxed">
                    <CheckCircle2 size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-3">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Es passt nicht, wenn</h3>
              <ul className="space-y-3">
                {PASST_NICHT.map(({ fall, grund }) => (
                  <li key={fall} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <XCircle size={15} className="text-pub-ink-3 dark:text-white/30 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-gray-900 dark:text-white">{fall}</span>{" "}
                      <span className="text-gray-500 dark:text-white/55">{grund}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Abschnitt>

        {/* ── NEU ODER RELAUNCH ── */}
        <Abschnitt
          id="neu-oder-relaunch"
          titel="Neue Website oder Relaunch — wie wir das entscheiden"
          lead="Drei Fragen entscheiden es. Die Antwort steht nach der Bestandsprüfung fest, nicht vorher."
          dunkel
        >
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/[0.06]">
            <table className="w-full text-sm text-left">
              <thead className="bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white">
                <tr>
                  <th className="p-4 font-semibold">Frage</th>
                  <th className="p-4 font-semibold">Spricht für Neubau</th>
                  <th className="p-4 font-semibold">Spricht für Relaunch</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-white/60">
                {RELAUNCH_ENTSCHEIDUNG.map(({ frage, neu, relaunch }) => (
                  <tr key={frage} className="border-t border-gray-100 dark:border-white/[0.06] align-top">
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{frage}</td>
                    <td className="p-4 leading-relaxed">{neu}</td>
                    <td className="p-4 leading-relaxed">{relaunch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-sm text-gray-500 dark:text-white/50 leading-relaxed max-w-3xl">
            Für die Relaunch-Frage vor Ort gibt es eigene Seiten mit dem jeweiligen Vorgehen:{" "}
            {RELAUNCH_SEITEN.map(({ label, href }, i) => (
              <span key={href}>
                <Link to={href} className="text-blue-600 dark:text-blue-400 hover:underline">
                  Website-Relaunch {label}
                </Link>
                {i < RELAUNCH_SEITEN.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </Abschnitt>

        {/* ── SIEBEN EBENEN ── */}
        <Abschnitt
          id="umfang"
          titel="Was ein Website-Projekt umfasst"
          lead="Eine Website ist kein Layout. Sie besteht aus sieben Ebenen, und jede kann fehlen, ohne dass es auf den ersten Blick auffällt — bis Anfragen ausbleiben. Welche Ebenen in welchem Umfang zu Ihrem Projekt gehören, legt das Angebot fest."
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EBENEN.map(({ icon: Icon, titel, punkte }, i) => (
              <motion.div
                key={titel}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.05}
                className="p-5 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-3">
                  <Icon size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{titel}</h3>
                <ul className="space-y-1.5">
                  {punkte.map((p) => (
                    <li key={p} className="text-sm text-gray-500 dark:text-white/55 leading-snug">
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── INHALTE ── */}
        <Abschnitt
          id="inhalte"
          titel="Wer liefert Texte und Bilder?"
          lead="Die Frage, an der die meisten Projekte Zeit verlieren. Deshalb wird sie vor dem Start beantwortet, nicht währenddessen."
          dunkel
        >
          <div className="grid md:grid-cols-3 gap-6 text-sm leading-relaxed">
            <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Von Ihnen</h3>
              <p className="text-gray-500 dark:text-white/55">
                Die Fachaussagen: Was Sie anbieten, für wen, was Sie anders machen, welche
                Fragen Kunden stellen. Dazu Logo, vorhandene Fotos, Rechtstexte und die
                Freigabe jeder Seite.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Von uns</h3>
              <p className="text-gray-500 dark:text-white/55">
                Die Struktur: welche Seite was sagen muss, in welcher Reihenfolge, mit welchem
                nächsten Schritt. Auf Wunsch schreiben wir Ihre Vorlagen aus und legen fest,
                welche Bilder fehlen.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Was festgehalten wird</h3>
              <p className="text-gray-500 dark:text-white/55">
                Wer liefert was bis wann, und wer gibt frei. Fehlt ein Inhalt am vereinbarten
                Termin, verschiebt sich der Plan — das steht vorher so im Angebot, damit es
                später keine Überraschung ist.
              </p>
            </div>
          </div>
        </Abschnitt>

        {/* ── TECHNIK ── */}
        <Abschnitt
          id="technik"
          titel="Technische Grundlage: nicht jede Website derselbe Bau"
          lead="Welche Technik wir vorschlagen, folgt aus zwei Fragen: Wer pflegt die Inhalte, und was muss die Seite können?"
        >
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mit Redaktionssystem</h3>
              <p className="text-sm text-gray-500 dark:text-white/55 leading-relaxed">
                Wenn Sie Texte, Bilder oder Neuigkeiten selbst ändern wollen. Sie bekommen eine
                Oberfläche und eine Einweisung; wir richten die Vorlagen so ein, dass Sie beim
                Pflegen keine Struktur zerstören können.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Statisch ausgeliefert</h3>
              <p className="text-sm text-gray-500 dark:text-white/55 leading-relaxed">
                Wenn sich Inhalte selten ändern und Geschwindigkeit, Sicherheit und wenig Wartung
                zählen. Änderungen laufen dann über uns oder über einen vereinbarten Weg.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {[
              ["Responsiv", "Eine Seite, die sich an Smartphone, Tablet und Desktop anpasst. Geprüft auf echten Geräten, nicht nur im Browserfenster."],
              ["Mobile zuerst", "Entworfen für den kleinen Bildschirm, dann erweitert. Auf dem Smartphone entscheidet sich die meiste Nutzung."],
              ["Zugänge geklärt", "Wer Domain, Hosting und Redaktionssystem hält und welche Zugänge Sie erhalten, wird im Angebot festgelegt — so, dass Sie nicht gebunden sind."],
            ].map(([t, d]) => (
              <div key={t} className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
                <p className="font-medium text-gray-900 dark:text-white mb-1">{t}</p>
                <p className="text-gray-500 dark:text-white/55 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </Abschnitt>

        {/* ── SEO, PERFORMANCE, TRACKING, CONSENT, BARRIEREFREIHEIT ── */}
        <Abschnitt
          id="grundlagen"
          titel="Suche, Ladezeit, Anfragen, Messung, Einwilligung, Barrierefreiheit"
          lead="Sechs Dinge, die eine Website leisten muss und die in einem Angebot oft nur als Schlagwort stehen. Hier steht, was konkret geschieht — und wo die Grenze liegt."
          dunkel
        >
          <div className="grid md:grid-cols-2 gap-6">
            {GRUNDLAGEN.map(({ titel, text }, i) => (
              <motion.div
                key={titel}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.05}
                className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{titel}</h3>
                <p className="text-sm text-gray-500 dark:text-white/55 leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── SCHNITTSTELLEN ── */}
        <Abschnitt
          id="schnittstellen"
          titel="Schnittstellen: was möglich ist — und was passiert, wenn nicht"
          lead="Terminbuchung, Reservierung, Kalender, Newsletter, CRM, Telefonassistent: Eine Website wird wertvoller, wenn sie mit Ihren Systemen spricht. Ob sie das kann, entscheidet das jeweilige System, nicht unser Wunsch."
        >
          <div className="grid md:grid-cols-3 gap-6 text-sm leading-relaxed">
            <div className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Vor dem Angebot</h3>
              <p className="text-gray-500 dark:text-white/55">
                Wir prüfen, ob das System eine geeignete Schnittstelle, einen Export oder eine
                Einbettung bietet und ob Sie den Zugang dazu bekommen. Erst danach steht die
                Anbindung im Angebot.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Wenn es geht</h3>
              <p className="text-gray-500 dark:text-white/55">
                Die Anbindung wird gebaut, getestet und beschrieben — nach Möglichkeit mit
                realen Testfällen und mit der Antwort auf die Frage, was passiert, wenn das
                andere System einmal nicht antwortet.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Wenn es nicht geht</h3>
              <p className="text-gray-500 dark:text-white/55">
                Dann sagen wir das vorher. Mögliche Wege: ein Formular, dessen Eingaben per
                E-Mail in Ihren Ablauf gehen; ein manueller Schritt; oder der Verzicht auf die
                Funktion. Was wir nicht tun: eine Anbindung versprechen, die wir nicht geprüft
                haben.
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm text-gray-500 dark:text-white/50 leading-relaxed max-w-3xl">
            Für Betriebe, bei denen Anfragen vor allem telefonisch eingehen, lässt sich die
            Website in vielen Fällen mit dem{" "}
            <Link to="/ki-telefonassistent" className="text-blue-600 dark:text-blue-400 hover:underline">
              KI-Telefonassistenten
            </Link>{" "}
            verbinden — ob das sinnvoll ist, hängt von Ihrem Anrufaufkommen ab, nicht von der Website.
          </p>
        </Abschnitt>

        {/* ── RELAUNCH-SICHERUNG ── */}
        <Abschnitt
          id="relaunch-sicherung"
          titel="Relaunch: was mit bestehenden Rankings geschieht"
          lead="Eine Website, die gefunden wird, hat etwas zu verlieren. Ein Relaunch ohne Migrationsplan verliert es. Diese Prüfliste gehört zu jedem Relaunch, den wir umsetzen — sie senkt das Risiko, sie garantiert kein Ergebnis."
          dunkel
        >
          <ol className="grid sm:grid-cols-2 gap-3">
            {RELAUNCH_PRUEFLISTE.map((p, i) => (
              <li key={p} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] text-sm text-gray-600 dark:text-white/60 leading-relaxed">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5 w-5 flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p}
              </li>
            ))}
          </ol>
        </Abschnitt>

        {/* ── KOSTEN ── */}
        <Abschnitt
          id="kosten"
          titel="Was eine Website kostet"
          lead="Eine Pauschale vor dem Erstgespräch wäre geraten. Was sich vorher sagen lässt, ist, woran der Preis hängt."
        >
          <div className="max-w-3xl space-y-4 text-gray-600 dark:text-white/60 leading-relaxed">
            <p>
              Den Preis bestimmen der Seitenumfang und die Zahl unterschiedlicher Seitentypen,
              der Anteil an Inhalten, die erst entstehen müssen, der Gestaltungsaufwand, ob ein
              Redaktionssystem gebraucht wird, welche Schnittstellen angebunden werden, ob
              Daten aus einer bestehenden Website übernommen werden, ob mehrere Sprachen nötig
              sind, welche Anforderungen an Barrierefreiheit gelten und ob Sie nach dem Start
              Betreuung wünschen.
            </p>
            <p>
              Einmalige Kosten für Konzeption und Umsetzung und laufende Kosten für Hosting,
              Domain und Betreuung werden im Angebot getrennt ausgewiesen. Wer eigene Texte
              und Bilder liefert, senkt den Aufwand.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <Link
              to="/kosten-webdesign"
              onClick={() => trackEvent("cta_kosten_click", "webdesign-kosten-abschnitt")}
              className="inline-flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Alle Preistreiber im Einzelnen <ArrowRight size={14} />
            </Link>
            <span className="text-pub-ink-3 dark:text-white/35">
              Regional:{" "}
              {KOSTEN_LOKAL.map(({ label, href }, i) => (
                <span key={href}>
                  <Link to={href} className="text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-blue-400">
                    Webdesign-Kosten {label}
                  </Link>
                  {i < KOSTEN_LOKAL.length - 1 ? " · " : ""}
                </span>
              ))}
            </span>
          </div>
        </Abschnitt>

        {/* ── ABLAUF ── */}
        <Abschnitt
          id="ablauf"
          titel="So läuft ein Website-Projekt ab"
          lead="Dreizehn Schritte, von der Anforderung bis zur ersten Auswertung. Feste Dauern nennen wir nicht — sie hängen am Umfang und daran, wie schnell Inhalte und Freigaben kommen. Den Zeitplan mit Meilensteinen erhalten Sie nach dem Erstgespräch."
          dunkel
        >
          <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ABLAUF.map(({ nr, titel, text }) => (
              <li key={nr} className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">{nr}</p>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5">{titel}</h3>
                <p className="text-sm text-gray-500 dark:text-white/55 leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-gray-500 dark:text-white/50 max-w-3xl leading-relaxed">
            Was Sie dafür bereitstellen: eine zuständige Person, Zugänge zu Domain und
            bestehender Website, Inhalte zum vereinbarten Termin und Freigaben innerhalb der
            abgesprochenen Frist.
          </p>
        </Abschnitt>

        {/* ── BRANCHEN UND STANDORTE ── */}
        <Abschnitt
          id="branchen-standorte"
          titel="Branchen und Standorte"
          lead="Für einige Branchen gibt es eigene Seiten mit dem, was dort anders ist. Und für drei Städte gibt es Seiten mit dem lokalen Vorgehen und persönlichen Terminen vor Ort."
        >
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Nach Branche</h3>
              <ul className="space-y-2">
                {BRANCHEN.map(({ icon: Icon, label, href }) => (
                  <li key={href}>
                    <Link
                      to={href}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors"
                    >
                      <Icon size={15} className="text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-white/65 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Webdesign für {label}
                      </span>
                      <ArrowRight size={13} className="ml-auto text-pub-ink-3 dark:text-white/20 group-hover:text-blue-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Vor Ort</h3>
              <ul className="space-y-2">
                {STANDORTE.map(({ label, sub, href }) => (
                  <li key={href}>
                    <Link
                      to={href}
                      className="group flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors"
                    >
                      <MapPin size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="block text-sm text-gray-700 dark:text-white/65 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {label}
                        </span>
                        <span className="block text-xs text-pub-ink-3 dark:text-white/35">{sub}</span>
                      </span>
                      <ArrowRight size={13} className="ml-auto mt-1 text-pub-ink-3 dark:text-white/20 group-hover:text-blue-400" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-pub-ink-3 dark:text-white/35 leading-relaxed">
                Außerhalb dieser Städte arbeiten wir remote für Unternehmen in ganz Deutschland.
              </p>
            </div>
          </div>
        </Abschnitt>

        {/* ── FAQ ── */}
        <Abschnitt id="faq" titel="Häufige Fragen vor der Beauftragung" dunkel>
          <div className="space-y-4">
            {faqItems.map(({ question, answer }, i) => (
              <motion.div
                key={question}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.04}
                className="p-5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{question}</h3>
                <p className="text-sm text-gray-500 dark:text-white/55 leading-relaxed">{answer}</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-sm text-gray-500 dark:text-white/50 leading-relaxed max-w-3xl">
            Ihre Website existiert bereits, bringt aber keine Anfragen? Typische Ursachen
            und ihre Prüfreihenfolge stehen auf der Seite{" "}
            <Link to="/keine-anfragen-website" className="text-blue-600 dark:text-blue-400 hover:underline">
              Website bringt keine Anfragen
            </Link>
            .
          </p>
        </Abschnitt>

        {/* ── NÄCHSTER SCHRITT ── */}
        <section className="py-20 px-6 lg:px-10" aria-labelledby="naechster-schritt-heading">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 id="naechster-schritt-heading" className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Der nächste Schritt
              </h2>
              <p className="text-gray-500 dark:text-white/55 mb-8 leading-relaxed">
                Ein Gespräch über Ihr Vorhaben: was die Website erreichen soll, was heute da
                ist, wer Inhalte liefern kann. Danach wissen Sie, ob ein Neubau oder ein
                Relaunch der richtige Weg ist — und bekommen ein Angebot, in dem der Umfang
                steht.
              </p>
              <Link
                to="/kontakt"
                onClick={() => trackEvent("cta_kontakt_click", "webdesign-abschluss")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                Website-Projekt besprechen <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
