// ─────────────────────────────────────────────────────────────────────────────
// /kosten-webdesign — die Kosten- und Preisintention des Webdesign-Clusters.
//
// WARUM DIESE SEITE NICHT MEHR `CostPage` BENUTZT
//
// `CostPage` ist um Preisstaffeln, Beispielprojekte mit Investitionsbetrag und
// ein Offer-Schema gebaut, das diese Beträge als `price` ausliefert. Für den
// Telefonassistenten trägt das, weil dort bestätigte Tarife existieren
// (docs/preis-wahrheitstabelle.md). Für Webdesign existieren sie NICHT.
//
// Die bis zum 13.09.2026 hier stehenden Zahlen — Staffeln „ab 1.500 €",
// „2.500–5.000 €", „ab 5.000 €", vier Beispielprojekte mit Beträgen, Wartung
// „ab ca. 50–150 €/Monat", Local SEO „ca. 500–2.000 €", Terminbuchung „ca.
// 800–2.500 €", Texte „ca. 80–150 € pro Seite", „Angebote 30 Tage gültig" —
// sind in keiner Quelle bestätigt: OWNER-INPUT kennt keine Webdesign-Preisfrage,
// COPY-CLAIMS-TO-VERIFY Z12 führt die Webdesign-Beträge ausdrücklich als offen.
// Herkunftsprüfung Zeile für Zeile: docs/seo/preisaudit-webdesign.md.
//
// Sie sind entfernt und NICHT durch andere Zahlen ersetzt. Ebenso wenig durch
// erfundene Leistungspolitik: Was enthalten ist, wer Domain und Hosting hält und
// ob Betreuung dazugehört, steht nur im Angebot (Inhaber-Review 13.09.2026). An ihre Stelle
// treten die Preistreiber im Einzelnen, die Trennung von einmaligem und
// laufendem Aufwand, die Projektzuschnitte ohne Betrag, ein Abschnitt darüber,
// wann sich eine neue Website NICHT lohnt, und was ein Kunde selbst tun kann,
// um den Preis zu senken. Kein Rechner: Für Webdesign gibt es kein
// vertretbares Nutzermodell ohne erfundene Annahmen (Mission 2026-09-13, §29).
//
// Die Jahreszahl im Titel („2025") ist entfallen: Die Seite trägt keinen
// jährlich gepflegten Datensatz. Sobald der Inhaber Beträge bestätigt, gehören
// sie in eine kanonische Quelle nach dem Muster `TARIFE`, nicht als Literal
// in diese Datei.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  CircleCheck as CheckCircle2,
  Euro,
  MapPin,
  Repeat,
  XCircle,
} from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { trackEvent } from "@/lib/consent";

const BASE = BUSINESS_INFO.website;
const CANONICAL = `${BASE}/kosten-webdesign`;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const H1 = "Was kostet eine Website?";

const KOSTENTREIBER = [
  {
    titel: "Seitenumfang und Seitentypen",
    text: "Nicht nur die Zahl der Seiten treibt den Aufwand, sondern vor allem die Zahl unterschiedlicher Seitentypen. Mehrere Seiten auf Basis derselben Vorlage können weniger Umsetzungsaufwand verursachen als eine kleinere Zahl vollständig unterschiedlicher Seitentypen. Entscheidend ist der konkrete Aufbau.",
  },
  {
    titel: "Inhalte, die erst entstehen müssen",
    text: "Texte, die Sie liefern, werden strukturiert und gesetzt. Texte, die wir aus Ihren Stichpunkten ausschreiben, und Bilder, die erst beschafft werden müssen, sind eigener Aufwand.",
  },
  {
    titel: "Gestaltungsaufwand",
    text: "Ein zurückhaltendes Erscheinungsbild auf Basis Ihres bestehenden Logos ist schneller umgesetzt als eine neue Bildsprache mit Illustrationen, Animationen und eigenem Gestaltungssystem.",
  },
  {
    titel: "Redaktionssystem",
    text: "Sollen Sie Inhalte selbst pflegen, braucht die Website ein Redaktionssystem, eingerichtete Vorlagen und eine Einweisung. Eine statisch ausgelieferte Website spart das — und passt meist nur, wenn sich Inhalte selten ändern.",
  },
  {
    titel: "Datenübernahme",
    text: "Bei einem Relaunch müssen bestehende Seiten, Beiträge, Bilder und Adressen übernommen werden. Je größer und unordentlicher der Bestand, desto mehr Sichtung und Bereinigung.",
  },
  {
    titel: "Schnittstellen",
    text: "Terminbuchung, Reservierung, Kalender, Newsletter, CRM: Eine Anbindung wird vor dem Angebot geprüft, dann gebaut und getestet. Fehlt eine geeignete Schnittstelle, gibt es einen Ersatzweg oder die Funktion entfällt.",
  },
  {
    titel: "Mehrsprachigkeit",
    text: "Jede zusätzliche Sprache vervielfacht Inhalte, Metadaten und Prüfung. Übersetzungen liefern Sie oder ein von Ihnen beauftragter Dienst; wir richten die Struktur ein.",
  },
  {
    titel: "Barrierefreiheit",
    text: "Barrierefreiheitsmerkmale wie Kontraste, Tastaturbedienung, Alternativtexte und beschriftete Formulare werden entsprechend dem vereinbarten Umfang berücksichtigt. Ein geprüfter, dokumentierter Stand nach einem Anforderungskatalog ist zusätzlicher Aufwand — ob er für Ihr Angebot rechtlich nötig ist, klären Sie mit Ihrer Rechtsberatung.",
  },
  {
    titel: "Messung und Einwilligung",
    text: "Eine Messung, bei der nicht notwendiges Tracking erst nach Einwilligung läuft und Anfragen als Ereignis erfasst werden, muss eingerichtet und geprüft werden. Zusätzliche Dienste bedeuten zusätzliche Einbindung und in der Regel zusätzliche Rechtstexte.",
  },
  {
    titel: "SEO-Migration bei Relaunch",
    text: "Adressinventar, Weiterleitungsplan, Übernahme der Metadaten, Kontrolle nach dem Start. Entfällt bei einer neuen Website ohne Vorgänger; bei einer Website, die gefunden wird, sollte darauf nicht verzichtet werden.",
  },
  {
    titel: "Betreuung nach dem Start",
    text: "Updates, Sicherung, Inhaltsänderungen und Auswertung sind laufender Aufwand. Ob Betreuung nach dem Start Bestandteil des Projekts ist oder separat angeboten wird, ergibt sich aus dem konkreten Angebot.",
  },
];

const EINMALIG = [
  "Konzeption: Ziele, Struktur, Nutzerwege",
  "Gestaltung und Umsetzung aller Seitentypen",
  "Einrichtung von Redaktionssystem, Formularen, Schnittstellen",
  "Prüfung, Migration, Go-live",
];

const LAUFEND = [
  "Domain und Hosting — Kosten des jeweiligen Anbieters; wer die Verträge hält, wird im Angebot festgelegt",
  "Lizenzen für Drittdienste, falls eingebunden (Buchung, Newsletter, Karten)",
  "Betreuung, soweit vereinbart: Updates, Sicherung, Änderungen",
  "Laufende Suchmaschinen- und Inhaltsarbeit, soweit vereinbart",
];

const ZUSCHNITTE = [
  {
    titel: "Kompakte Unternehmenswebsite",
    text: "Wenige Seitentypen, Inhalte weitgehend vorhanden, ein Kontaktweg, Grundlagen für die Suche. Der Zuschnitt für Betriebe, die gefunden und angefragt werden wollen, ohne Inhalte laufend zu ändern.",
  },
  {
    titel: "Website mit Redaktionssystem",
    text: "Mehrere Seitentypen, Neuigkeiten oder Beiträge, die Sie selbst pflegen, eingerichtete Vorlagen und Einweisung. Für Unternehmen, bei denen sich Inhalte regelmäßig ändern.",
  },
  {
    titel: "Website mit Schnittstellen",
    text: "Terminbuchung, Reservierung oder Kundenkonto, angebunden an ein bestehendes System. Der Aufwand hängt weniger an der Website als daran, was das andere System zulässt.",
  },
  {
    titel: "Relaunch mit Migration",
    text: "Bestehende Website mit Rankings und Inhalten, die neu strukturiert oder technisch ersetzt wird. Sichtung, Übernahme, Weiterleitungsplan und Kontrolle nach dem Start gehören dazu.",
  },
];

const NICHT_LOHNEND = [
  {
    fall: "Die heutige Website wird gefunden und bringt Anfragen — sie sieht nur nicht mehr zeitgemäß aus.",
    grund: "Dann kann eine gezielte Überarbeitung wirtschaftlicher sein als ein Neubau. Ein Relaunch riskiert etwas, das funktioniert.",
  },
  {
    fall: "Es gibt niemanden, der Inhalte liefert oder freigibt.",
    grund: "Ohne Inhalte entsteht keine Website, nur eine Rechnung. Das Projekt wartet dann auf Sie, nicht auf uns.",
  },
  {
    fall: "Der Engpass liegt nicht bei der Website.",
    grund: "Wenn Anfragen unbeantwortet bleiben oder Abläufe haken, hilft eine neue Website wenig. Dann ist ein anderes System dran.",
  },
  {
    fall: "Sie brauchen eine Visitenkarte im Netz.",
    grund: "Für eine einfache digitale Visitenkarte kann ein Baukasten die wirtschaftlichere Lösung sein. Das sagen wir Ihnen im Erstgespräch.",
  },
];

const PREIS_SENKEN = [
  "Texte und Bilder liegen zum Start vor — der größte Hebel.",
  "Eine zuständige Person entscheidet und gibt frei, statt drei.",
  "Seitentypen statt Einzelseiten denken: eine Vorlage, viele Inhalte.",
  "Schnittstellen nur, wo sie einen Ablauf tatsächlich ersetzen.",
  "Erst launchen, dann erweitern — nicht alles in die erste Fassung.",
];

const FAQ = [
  {
    question: "Warum steht hier kein Preis?",
    answer:
      "Weil jede Zahl ohne Kenntnis Ihres Umfangs geraten wäre. Der Preis einer Website hängt an Seitentypen, Inhalten, Gestaltung, Redaktionssystem, Schnittstellen und Betreuung. Nach dem Erstgespräch erhalten Sie ein Angebot, in dem der Umfang steht — und was nicht dazugehört.",
  },
  {
    question: "Ist eine Agentur-Website teurer als ein Baukasten?",
    answer:
      "In der Anschaffung in der Regel ja. Ob sie sich lohnt, hängt davon ab, was die Website leisten soll: Für eine reine Visitenkarte kann ein Baukasten genügen. Für eine Website, die gefunden werden und Anfragen bringen soll, zählen Struktur, Inhalte und Suchmaschinen-Grundlagen — das ist der Aufwand, den Sie bezahlen.",
  },
  {
    question: "Sind Texte und Bilder im Preis enthalten?",
    answer:
      "Welche Inhaltsleistungen enthalten sind, wird im Angebot festgelegt. Texte, die wir ausschreiben, und Bilder, die beschafft werden müssen, sind eigener Aufwand. Wer eigene Inhalte liefert, senkt den Preis.",
  },
  {
    question: "Ist SEO enthalten?",
    answer:
      "Technische SEO-Grundlagen — erreichbare Seiten, Titel und Beschreibungen, interne Verlinkung, Ladezeit — können Bestandteil des vereinbarten Webdesign-Umfangs sein; der konkrete Umfang steht im Angebot. Laufende Arbeit an Inhalten und Rankings wird gesondert vereinbart.",
  },
  {
    question: "Was kostet die Betreuung nach dem Start?",
    answer:
      "Das hängt davon ab, was betreut werden soll: nur Updates und Sicherung, oder auch Inhaltsänderungen und Auswertung. Ob Betreuung Bestandteil des Projekts ist oder separat angeboten wird, ergibt sich aus dem konkreten Angebot — mit Umfang und Preis.",
  },
  {
    question: "Was kostet eine Terminbuchung oder Reservierung auf der Website?",
    answer:
      "Das entscheidet das System, an das angebunden wird: Ob es eine geeignete Schnittstelle bietet, wird vor dem Angebot geprüft. Erst danach lässt sich der Aufwand beziffern — vorher wäre jede Zahl geraten.",
  },
];

const STADT_LINKS = [
  { label: "Bayreuth", href: "/bayreuth/webdesign" },
  { label: "München", href: "/muenchen/webdesign" },
  { label: "Regensburg", href: "/regensburg/webdesign" },
];

const BRANCHEN_LINKS = [
  { label: "Arztpraxen", href: "/webdesign-arzt" },
  { label: "Hotels", href: "/webdesign-hotel" },
  { label: "Gastronomie", href: "/webdesign-gastronomie" },
  { label: "Immobilien", href: "/webdesign-immobilien" },
  { label: "Sport und Fitness", href: "/webdesign-sport" },
];

// Kein Offer-Block, kein Preis im Schema: Es gibt keinen bestätigten Betrag,
// und ein Schema-Preis ohne Grundlage wäre derselbe Fehler wie ein Text-Preis.
// Der Anbieter wird per @id referenziert; das vollständige Organization-Objekt
// liefert LocalBusinessSchema auf jeder öffentlichen Seite.
const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${CANONICAL}#service`,
  name: "Webdesign — Kosten und Preistreiber",
  description:
    "Was den Preis einer Unternehmenswebsite bestimmt, wie einmalige und laufende Kosten getrennt werden und wann sich eine neue Website nicht lohnt.",
  url: CANONICAL,
  serviceType: "Webdesign",
  provider: { "@id": `${BASE}/#organization` },
  areaServed: { "@type": "Country", name: "Deutschland" },
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

export function KostenWebdesign() {
  const breadcrumbs = [
    { name: "Home", url: BASE },
    { name: "Webdesign", url: `${BASE}/webdesign` },
    { name: "Kosten", url: CANONICAL },
  ];

  return (
    <>
      <PageSEO
        title="Was kostet eine Website? Webdesign Kosten & Preistreiber | Cogniiq"
        description="Was eine professionelle Website kostet, hängt an Seitenumfang, Inhalten, Design, Schnittstellen, Barrierefreiheit und Betreuung. Alle Preistreiber erklärt, einmalig und laufend getrennt — ohne Fantasiepreise."
        canonical={CANONICAL}
        breadcrumbs={breadcrumbs}
        faqItems={FAQ}
        additionalSchema={schema}
      />

      <main className="min-h-screen bg-white dark:bg-gray-950">
        {/* ── HERO — die direkte Antwort zuerst ── */}
        <section className="pt-28 pb-16 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto">
            <nav aria-label="Breadcrumb" className="cq-rise flex items-center gap-1.5 text-sm text-pub-ink-3 dark:text-white/35 mb-8">
              <Link to="/" className="hover:text-gray-600 dark:hover:text-white/60 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link to="/webdesign" className="hover:text-gray-600 dark:hover:text-white/60 transition-colors">Webdesign</Link>
              <ChevronRight size={12} />
              <span className="text-gray-600 dark:text-white/60">Kosten</span>
            </nav>

            <motion.p className="cq-rise text-xs font-semibold tracking-[0.18em] uppercase text-blue-600 dark:text-blue-400 mb-4">
              Webdesign Kosten
            </motion.p>
            <motion.h1 className="cq-rise cq-rise-d1 text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-[1.08] mb-6 max-w-4xl">
              {H1}
            </motion.h1>

            <div className="cq-rise cq-rise-d2 max-w-3xl space-y-5 text-[17px] lg:text-xl text-gray-500 dark:text-white/55 leading-relaxed mb-10">
              <p>
                So viel, wie ihr Umfang verlangt — und der lässt sich vor einem Gespräch nicht
                ehrlich beziffern. Was sich vorher sagen lässt: woran der Preis hängt, was
                einmalig und was laufend anfällt, welche Projektzuschnitte es gibt, wann sich
                eine neue Website nicht lohnt und was Sie selbst tun können, damit sie weniger
                kostet.
              </p>
              <p>
                Eine Zahl, die hier ohne Kenntnis Ihres Projekts stünde, wäre geraten. Wir
                nennen sie deshalb nicht — auch nicht als „ab"-Preis.
              </p>
            </div>

            <div className="cq-rise cq-rise-d3 flex flex-wrap gap-4">
              <Link
                to="/kontakt"
                onClick={() => trackEvent("cta_kontakt_click", "kosten-webdesign-hero")}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
              >
                Angebot anfragen <ArrowRight size={15} />
              </Link>
              <Link
                to="/webdesign"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:border-gray-300 dark:hover:border-white/20 font-semibold text-sm transition-colors"
              >
                Was ein Projekt umfasst
              </Link>
            </div>
          </div>
        </section>

        {/* ── PREISTREIBER ── */}
        <Abschnitt
          id="treiber"
          titel="Woran der Preis hängt"
          lead="Elf Faktoren. Nicht alle treffen auf jedes Projekt zu — aber jeder, der zutrifft, steht im Angebot mit Umfang und Betrag."
          dunkel
        >
          <div className="grid sm:grid-cols-2 gap-5">
            {KOSTENTREIBER.map(({ titel, text }, i) => (
              <motion.div
                key={titel}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.03}
                className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]"
              >
                <div className="flex items-start gap-3">
                  <Euro size={15} className="text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5">{titel}</h3>
                    <p className="text-sm text-gray-500 dark:text-white/55 leading-relaxed">{text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── EINMALIG / LAUFEND ── */}
        <Abschnitt
          id="struktur"
          titel="Einmalig und laufend — getrennt"
          lead="Zwei Rechnungen, die im Angebot getrennt stehen, damit Sie wissen, was nach dem Go-live weiterläuft und was nicht."
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <Euro size={16} className="text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Einmalig: das Projekt</h3>
              </div>
              <ul className="space-y-2.5">
                {EINMALIG.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-white/60 leading-relaxed">
                    <CheckCircle2 size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <Repeat size={16} className="text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Laufend: der Betrieb</h3>
              </div>
              <ul className="space-y-2.5">
                {LAUFEND.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-white/60 leading-relaxed">
                    <CheckCircle2 size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-sm text-gray-500 dark:text-white/50 leading-relaxed max-w-3xl">
            Wer Domain, Hosting und Zugänge hält, wird im Angebot festgelegt — mit dem Ziel, dass
            Sie nicht an uns gebunden sind, um die Website weiter zu betreiben.
          </p>
        </Abschnitt>

        {/* ── ZUSCHNITTE ── */}
        <Abschnitt
          id="zuschnitte"
          titel="Vier Projektzuschnitte"
          lead="Keine Pakete mit Preis, sondern die Formen, in denen Website-Projekte bei uns typischerweise vorkommen. Ihr Projekt kann eine davon sein oder zwischen zwei liegen."
          dunkel
        >
          <div className="grid sm:grid-cols-2 gap-5">
            {ZUSCHNITTE.map(({ titel, text }) => (
              <div key={titel} className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{titel}</h3>
                <p className="text-sm text-gray-500 dark:text-white/55 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </Abschnitt>

        {/* ── WANN NICHT ── */}
        <Abschnitt
          id="dagegen"
          titel="Wann sich eine neue Website nicht lohnt"
          lead="Der Abschnitt, der auf Preisseiten meistens fehlt. Er spart Ihnen ein Projekt, das nichts ändert."
        >
          <ul className="space-y-3">
            {NICHT_LOHNEND.map(({ fall, grund }) => (
              <li key={fall} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] text-sm leading-relaxed">
                <XCircle size={15} className="text-pub-ink-3 dark:text-white/30 mt-0.5 flex-shrink-0" />
                <span>
                  <span className="font-medium text-gray-900 dark:text-white">{fall}</span>{" "}
                  <span className="text-gray-500 dark:text-white/55">{grund}</span>
                </span>
              </li>
            ))}
          </ul>
        </Abschnitt>

        {/* ── PREIS SENKEN ── */}
        <Abschnitt
          id="hebel"
          titel="Was Sie tun können, damit die Website weniger kostet"
          dunkel
        >
          <ol className="grid sm:grid-cols-2 gap-3">
            {PREIS_SENKEN.map((p, i) => (
              <li key={p} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] text-sm text-gray-600 dark:text-white/60 leading-relaxed">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5 w-5 flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p}
              </li>
            ))}
          </ol>
        </Abschnitt>

        {/* ── WIE EIN ANGEBOT ENTSTEHT ── */}
        <Abschnitt
          id="angebot"
          titel="Wie ein Angebot entsteht"
          lead="Drei Schritte zwischen Ihrer Anfrage und einer Zahl, die stimmt."
        >
          <div className="grid md:grid-cols-3 gap-6 text-sm leading-relaxed">
            {[
              ["01", "Erstgespräch", "Was die Website erreichen soll, was heute da ist, wer Inhalte liefern kann, welche Systeme angebunden werden sollen."],
              ["02", "Prüfung", "Bestehende Website, Rankings, Systeme und deren Schnittstellen. Erst danach steht fest, was möglich ist."],
              ["03", "Angebot", "Umfang je Ebene, Zuständigkeiten, Schnittstellen mit Prüfergebnis, einmalige und laufende Beträge getrennt ausgewiesen — und was nicht enthalten ist."],
            ].map(([nr, t, d]) => (
              <div key={nr} className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06]">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">{nr}</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t}</h3>
                <p className="text-gray-500 dark:text-white/55">{d}</p>
              </div>
            ))}
          </div>
        </Abschnitt>

        {/* ── FAQ ── */}
        <Abschnitt id="faq" titel="Häufige Fragen zu Website-Kosten" dunkel>
          <div className="space-y-4">
            {FAQ.map(({ question, answer }, i) => (
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
        </Abschnitt>

        {/* ── VERZWEIGUNGEN ── */}
        <Abschnitt
          id="links"
          titel="Kosten vor Ort und nach Branche"
          lead="Was den Preis bestimmt, ist überall gleich. Was vor Ort oder in einer Branche anders ist, steht auf den jeweiligen Seiten."
        >
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Webdesign vor Ort</h3>
              <ul className="space-y-2">
                {STADT_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link to={href} className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors">
                      <MapPin size={15} className="text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-white/65 group-hover:text-blue-600 dark:group-hover:text-blue-400">{label}</span>
                      <ArrowRight size={13} className="ml-auto text-pub-ink-3 dark:text-white/20 group-hover:text-blue-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Webdesign nach Branche</h3>
              <ul className="space-y-2">
                {BRANCHEN_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link to={href} className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors">
                      <span className="text-sm text-gray-700 dark:text-white/65 group-hover:text-blue-600 dark:group-hover:text-blue-400">Webdesign für {label}</span>
                      <ArrowRight size={13} className="ml-auto text-pub-ink-3 dark:text-white/20 group-hover:text-blue-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Abschnitt>

        {/* ── ABSCHLUSS ── */}
        <section className="py-20 px-6 lg:px-10 bg-gray-50 dark:bg-white/[0.02]" aria-labelledby="abschluss-heading">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 id="abschluss-heading" className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ein Angebot mit Umfang statt einer Zahl ohne Grundlage
              </h2>
              <p className="text-gray-500 dark:text-white/55 mb-8 leading-relaxed">
                Im Erstgespräch klären wir Ziel, Bestand und Inhalte. Danach erhalten Sie ein
                Angebot, in dem steht, was enthalten ist, was nicht, und was einmalig und
                laufend anfällt.
              </p>
              <Link
                to="/kontakt"
                onClick={() => trackEvent("cta_kontakt_click", "kosten-webdesign-abschluss")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                Angebot anfragen <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
