// ─────────────────────────────────────────────────────────────────────────────
// /kosten-automatisierung — die Kosten-, Preis- und Wirtschaftlichkeitsintention
// des Automatisierungs-Clusters.
//
// WARUM DIESE SEITE NICHT MEHR `CostPage` BENUTZT
//
// `CostPage` ist um drei Bausteine gebaut: Preisstaffeln, Beispielprojekte mit
// Investitionsbetrag und ein Offer-Schema, das diese Beträge als `price`
// ausliefert. Für den Telefonassistenten trägt das, weil dort bestätigte Tarife
// existieren (docs/preis-wahrheitstabelle.md).
//
// Für Automatisierung existieren sie NICHT. Die bis zum 12.09.2026 hier
// stehenden Zahlen — Staffeln 500–1.500 / 1.500–5.000 / ab 5.000 €, Wartung ab
// 99 €/Monat, vier Beispielprojekte mit Beträgen, „amortisiert sich in 3–6
// Monaten“, „ein Workflow für 500–1.000 € kann täglich eine Stunde sparen“ —
// sind in keiner Quelle bestätigt: OWNER-INPUT A1–A3 sind unbeantwortet,
// COPY-CLAIMS-TO-VERIFY Z12 führt die Automatisierungsbeträge ausdrücklich als
// offen. Sie standen als Verkaufszahlen auf einer Seite, deren einziger Zweck
// Glaubwürdigkeit in Geldfragen ist. Die vollständige Herkunftsprüfung steht in
// docs/seo/preisaudit-automatisierung.md.
//
// Sie sind deshalb entfernt und NICHT durch andere Zahlen ersetzt worden. Was
// an ihre Stelle tritt, ist mehr wert als eine erfundene Staffel: die
// Kostentreiber im Einzelnen, die Trennung von einmaligem und laufendem
// Aufwand, ein ehrlicher Abschnitt darüber, wann sich Automatisierung NICHT
// lohnt — und ein Rechner, in den der Besucher seine eigene Investitionssumme
// einträgt und sieht, ob sie sich trägt.
//
// Sobald der Inhaber Beträge bestätigt, gehören sie hierher zurück, in eine
// kanonische Quelle wie `telefonassistent-copy.ts` und nicht als Literal in
// diese Datei.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CircleCheck as CheckCircle2,
  ChevronRight,
  CircleAlert as AlertCircle,
  Euro,
  MapPin,
  Repeat,
  ShieldAlert,
  Plug,
  XCircle,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageSEO } from "@/components/PageSEO";
import { AutomatisierungRechner } from "@/components/AutomatisierungRechner";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { trackEvent } from "@/lib/consent";

const BASE = BUSINESS_INFO.website;
const CANONICAL = `${BASE}/kosten-automatisierung`;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const H1 = "Was kostet Prozessautomatisierung?";

/*
  DIE KOSTENTREIBER. Jeder Punkt ist eine Eigenschaft des zu automatisierenden
  Prozesses, die der Kunde selbst beurteilen kann — nicht eine Eigenschaft
  unseres Angebots. Wer die Liste durchgeht, kann vor dem ersten Gespräch
  abschätzen, ob sein Vorhaben am günstigen oder am teuren Ende liegt.
*/
const KOSTENTREIBER = [
  {
    titel: "Wie eindeutig der Ablauf beschreibbar ist",
    text: "Ein Ablauf, den Sie in wenigen Sätzen vollständig aufschreiben können, liegt am günstigen Ende. Einer, bei dem drei Personen drei verschiedene Versionen erzählen, wird zuerst zu einer Klärungsaufgabe — und die kostet Zeit, bevor eine Zeile Konfiguration entsteht.",
  },
  {
    titel: "Zahl und Art der Entscheidungspunkte",
    text: "„Wenn A, dann B“ ist billig. Jede zusätzliche Verzweigung, jede Bedingung, die von mehreren Feldern abhängt, und jede Regel, die nur manchmal gilt, vervielfacht die Fälle, die gebaut und geprüft werden müssen.",
  },
  {
    titel: "Zahl der beteiligten Systeme",
    text: "Ein Ablauf innerhalb eines Systems ist der einfache Fall. Sobald zwei oder drei Systeme Daten austauschen sollen, kommen Zugänge, Feldzuordnungen, Reihenfolgen und Fehlerfälle je Verbindung dazu.",
  },
  {
    titel: "Beschaffenheit der Schnittstellen",
    text: "Ob ein System überhaupt eine geeignete Schnittstelle hat, welche Vorgänge sie erlaubt und was der Anbieter dafür verlangt, entscheidet stärker über den Preis als die Logik des Ablaufs selbst. Das ist der Punkt, an dem ein Vorhaben auch scheitern kann.",
  },
  {
    titel: "Qualität und Struktur der Daten",
    text: "Saubere, einheitlich erfasste Daten lassen sich direkt verarbeiten. Freitextfelder, uneinheitliche Schreibweisen und Dubletten brauchen zusätzliche Prüf- und Aufbereitungsschritte — oder eine Bereinigung, bevor es losgeht.",
  },
  {
    titel: "Wie viele Ausnahmen es gibt",
    text: "Der häufigste Grund, warum ein Automatisierungsprojekt teurer wird als gedacht: Der Normalfall ist in Tagen gebaut, und dann kommen die Sonderfälle. Sie gehören in die Aufnahme, nicht in die Rechnung danach.",
  },
  {
    titel: "Wie kritisch der Prozess ist",
    text: "Ein Ablauf, dessen Fehler jemand am nächsten Tag bemerkt und korrigiert, braucht weniger Absicherung als einer, bei dem ein Fehler Geld kostet oder einen Kunden trifft. Prüfungen, Wiederholungen, Protokolle und Alarme sind Aufwand — und bei kritischen Abläufen kein optionaler.",
  },
  {
    titel: "Wer den Betrieb übernimmt",
    text: "Automatisierungen altern: Ein angebundenes System ändert seine Schnittstelle, eine Regel ändert sich, ein Format verschiebt sich. Ob Sie das selbst betreuen oder wir es tun, ist eine Kostenentscheidung, die man vorher trifft — nicht beim ersten Ausfall.",
  },
];

/*
  UMFANGSBEISPIELE OHNE PREIS. Sie beschreiben den ZUSCHNITT eines Vorhabens,
  damit ein Besucher sein eigenes einordnen kann. Keiner dieser Zuschnitte ist
  ein abgerechnetes Kundenprojekt, und keiner trägt einen Betrag: ein
  „Beispielpreis“ ohne Grundlage ist genau die Zahl, die dieser Seite bisher die
  Glaubwürdigkeit genommen hat.
*/
const UMFAENGE = [
  {
    titel: "Ein Ablauf, ein System",
    text: "Ein klar umrissener Vorgang, der innerhalb eines bestehenden Systems ausgelöst und abgeschlossen wird — etwa eine Benachrichtigung mit Zuständigkeit und Frist, wenn ein bestimmter Status gesetzt wird.",
    treiber: "Wenige Entscheidungspunkte, keine externe Schnittstelle, überschaubare Ausnahmen.",
  },
  {
    titel: "Ein Ablauf über zwei Systeme",
    text: "Ein Vorgang, der in einem System beginnt und in einem zweiten endet — zum Beispiel eine strukturierte Anfrage, die als Vorgang angelegt und zugewiesen wird, sofern die Schnittstelle des Zielsystems das zulässt.",
    treiber: "Zugänge, Feldzuordnung und Fehlerbehandlung je Verbindung kommen dazu.",
  },
  {
    titel: "Eine Prozesskette über mehrere Stationen",
    text: "Mehrere aufeinander aufbauende Schritte mit Freigaben, Fristen und Zuständigkeiten — etwa ein Onboarding von der Zusage bis zur abgeschlossenen Checkliste.",
    treiber: "Zustände, Wartezeiten, Eskalationen und ein Ausnahmeweg je Station.",
  },
  {
    titel: "Ein kritischer Ablauf mit voller Absicherung",
    text: "Ein Vorgang, bei dem ein Fehler unmittelbar Geld oder Vertrauen kostet und deshalb Prüfungen, Wiederholungen, Protokoll, Alarm und einen definierten menschlichen Rückfallweg braucht.",
    treiber: "Die Absicherung ist hier der größere Teil der Arbeit, nicht der Ablauf selbst.",
  },
];

const NICHT_SINNVOLL = [
  {
    /*
      KEINE HÄUFIGKEITSSCHWELLE — siehe die gleichlautende Korrektur auf
      /prozessautomatisierung. „Zwölfmal im Jahr" war eine erfundene Grenze.
      Häufigkeit ist ein Faktor der Rechnung, nicht ihr Ergebnis.
    */
    titel: "Der Vorgang kommt selten vor",
    text: "Bei seltenen Vorgängen ist die Wirtschaftlichkeit besonders genau zu prüfen. Entscheidend ist nicht die Häufigkeit allein, sondern Aufwand, Wert und Risiko je Durchlauf im Verhältnis zu Investition und laufenden Kosten. Ein seltener, aber sehr aufwendiger oder fehlerkritischer Vorgang kann sich tragen. Der Rechner weiter unten bildet genau diesen Vergleich mit Ihren Zahlen ab.",
  },
  {
    titel: "Die Regeln ändern sich ständig",
    text: "Was diesen Monat anders läuft als letzten, muss nach jeder Änderung nachgezogen werden. Dann verschiebt Automatisierung den Aufwand von der Ausführung in die Pflege, statt ihn zu senken.",
  },
  {
    titel: "Die Arbeit ist Urteil, keine Prozedur",
    text: "Wenn jeder Fall eine eigene Abwägung verlangt, gibt es keine Regel zu automatisieren. Ein KI-Schritt kann hier zuarbeiten — Unterlagen vorsortieren, einen Entwurf vorbereiten —, aber die Entscheidung bleibt beim Menschen, und der Zeitgewinn ist entsprechend kleiner.",
  },
  {
    titel: "Die nötigen Systeme lassen sich nicht anbinden",
    text: "Fehlt eine geeignete Schnittstelle, erlaubt sie den gewünschten Vorgang nicht oder verlangt der Anbieter dafür Konditionen, die das Vorhaben sprengen, dann ist das Ergebnis der Prüfung: nicht sinnvoll umsetzbar. Das sagen wir vor dem Angebot, nicht danach.",
  },
  {
    titel: "Der Prozess selbst ist das Problem",
    text: "Ein umständlicher Ablauf wird durch Automatisierung ein schneller umständlicher Ablauf — und er wird schwerer zu ändern. Erst vereinfachen, dann automatisieren. Manchmal erledigt der erste Schritt den zweiten.",
  },
  {
    titel: "Die Rechnung geht nicht auf",
    text: "Wenn der realistisch reduzierbare Aufwand mal Ihrem Stundensatz die Investition über einen vertretbaren Zeitraum nicht trägt, ist die Antwort nein. Dafür steht der Rechner auf dieser Seite — er ist auch dazu da, ein Vorhaben zu widerlegen.",
  },
];

const FAQ = [
  {
    question: "Warum steht hier keine Preisliste?",
    answer:
      "Weil wir keine veröffentlichen können, die für Ihr Vorhaben etwas bedeutet. Zwei Automatisierungen mit demselben Namen — „Rechnungsversand automatisieren“ — unterscheiden sich um ein Vielfaches, je nachdem, wie viele Ausnahmen es gibt und ob die beteiligten Systeme eine geeignete Schnittstelle haben. Eine Staffel, die das ignoriert, ist entweder zu niedrig und wird im Angebot kassiert, oder zu hoch und schreckt Vorhaben ab, die sich gelohnt hätten. Was Sie stattdessen bekommen: die Treiber, die Ihren Preis bestimmen, und einen Rechner, in den Sie Ihre eigene Zahl eintragen.",
  },
  {
    question: "Wie kommen wir dann zu einer konkreten Zahl?",
    answer:
      "Über die Prozessaufnahme. Dabei wird der Ablauf Schritt für Schritt aufgenommen, die Entscheidungspunkte und Ausnahmen werden benannt, und für jedes beteiligte System wird geprüft, welche Schnittstelle es gibt, welcher Zugang nötig ist, welche Vorgänge damit möglich sind und welche Kosten Dritte dafür verlangen. Das Ergebnis steht im Angebot — auch dann, wenn es negativ ausfällt.",
  },
  {
    question: "Was kostet der laufende Betrieb?",
    answer:
      "Das hängt davon ab, was abgesichert und betreut werden muss und welche Gebühren Dritte für die beteiligten Schnittstellen verlangen. Ein einfacher Ablauf ohne externe Anbindung kann ohne laufende Kosten auskommen; ein kritischer Ablauf mit Überwachung, Alarmierung und Bereitschaft nicht. Beide Fälle werden im Angebot getrennt ausgewiesen — einmalig und laufend stehen nie in einer Summe.",
  },
  {
    question: "Ab wann rechnet sich eine Automatisierung?",
    answer:
      "Das lässt sich nur mit Ihren Zahlen beantworten, und genau dafür ist der Rechner auf dieser Seite da: manuelle Stunden pro Woche, Vollkosten einer Arbeitsstunde, realistisch reduzierbarer Anteil, einmalige Investition und laufende Kosten. Eine allgemeine Amortisationsdauer nennen wir nicht — sie wäre für jeden Betrieb eine andere, und eine publizierte Zahl wäre für die meisten falsch.",
  },
  {
    question: "Rechnet der Rechner freigesetzte Zeit als Ersparnis?",
    answer:
      "Nur, wenn Sie das so wählen — und er nennt es dann auch so. Bleibt die Mitarbeiterin im Betrieb, ist der Nutzen freigesetzte Kapazität, nicht gesparte Lohnkosten: Ihre Lohnsumme ändert sich um keinen Cent. Entfällt dagegen eine Position tatsächlich oder entsteht sie gar nicht erst, gibt es dafür die zweite Lesart. Beide zusammenzuzählen hieße, dieselbe Arbeitskapazität zweimal zu verkaufen; der Rechner lässt es nicht zu.",
  },
  {
    question: "Was passiert, wenn ein System keine Schnittstelle hat?",
    answer:
      "Dann gibt es für diesen Schritt drei mögliche Ergebnisse, und alle drei stehen vor dem Angebot fest: Der Schritt wird über einen anderen Weg gelöst (Datei-Übergabe, E-Mail, Export/Import), er bleibt bewusst manuell und wird nur vorbereitet und angestoßen, oder das Vorhaben ist in dieser Form nicht sinnvoll umsetzbar. Was wir nicht tun: eine Anbindung zusagen, die technisch nicht geprüft ist.",
  },
  {
    question: "Wie ist der Datenschutz bei Automatisierungen geregelt?",
    answer:
      "Zu jeder Automatisierung liefern wir den Auftragsverarbeitungsvertrag und die Dokumentation der Datenflüsse. Zum Verarbeitungsort machen wir derzeit keine Angabe — die Verträge mit den beteiligten Anbietern sind nicht abschließend unterzeichnet. Die Bewertung des konkreten Einsatzes bleibt bei Ihrem Datenschutzbeauftragten.",
  },
];

const STADT_LINKS = [
  { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
  { label: "Automatisierung München", href: "/muenchen/automatisierung" },
  { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
  { label: "Automatisierung Bayern", href: "/bayern" },
];

const BRANCHEN_LINKS = [
  { label: "Automatisierung Arztpraxis", href: "/automatisierung-arzt" },
  { label: "Automatisierung Restaurant", href: "/automatisierung-restaurant" },
  { label: "Automatisierung Immobilien", href: "/automatisierung-immobilien" },
  { label: "Automatisierung Sport & Fitness", href: "/automatisierung-sport" },
];

/*
  SCHEMA. Service ohne `offers` — ein Offer-Block braucht einen Preis, und
  einen belegten gibt es nicht. Lieber kein Offer als ein erfundenes: Ein
  Preis im strukturierten Datensatz, der auf der Seite nirgends steht, ist
  genau die Sorte Widerspruch, die Rich Results zu Recht abstraft.
  FAQPage erzeugt PageSEO aus `faqItems` und darf hier nicht doppelt stehen.
*/
const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": `${CANONICAL}#service`,
      name: "Prozessautomatisierung — Kosten und Wirtschaftlichkeit",
      description:
        "Was den Preis einer Prozessautomatisierung bestimmt, wie einmalige und laufende Kosten getrennt werden und wie sich die Wirtschaftlichkeit eines konkreten Prozesses rechnen lässt.",
      url: CANONICAL,
      serviceType: "Prozessautomatisierung",
      provider: {
        "@type": "Organization",
        "@id": `${BASE}/#organization`,
        name: BUSINESS_INFO.name,
        url: BASE,
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS_INFO.address.streetAddress,
          addressLocality: BUSINESS_INFO.address.addressLocality,
          addressRegion: BUSINESS_INFO.address.addressRegion,
          postalCode: BUSINESS_INFO.address.postalCode,
          addressCountry: BUSINESS_INFO.address.addressCountry,
        },
      },
      areaServed: { "@type": "Country", name: "Deutschland" },
      inLanguage: "de-DE",
    },
  ],
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
      className={`py-20 transition-colors duration-300 ${
        dunkel ? "bg-gray-50 dark:bg-gray-900/50" : "bg-white dark:bg-gray-950"
      }`}
      aria-labelledby={`${id}-heading`}
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <h2 id={`${id}-heading`} className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {titel}
          </h2>
          {lead && <p className="text-gray-500 dark:text-gray-400 max-w-3xl leading-relaxed">{lead}</p>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

export function KostenAutomatisierung() {
  const breadcrumbs = [
    { name: "Home", url: BASE },
    { name: "Prozessautomatisierung", url: `${BASE}/prozessautomatisierung` },
    { name: "Kosten", url: CANONICAL },
  ];

  return (
    <>
      <PageSEO
        title="Was kostet Prozessautomatisierung? Kosten, Preistreiber & Rechner | Cogniiq"
        description="Was eine Prozessautomatisierung kostet, hängt an Ausnahmen, Schnittstellen und Absicherung. Alle Preistreiber erklärt, einmalige und laufende Kosten getrennt — plus Rechner für Ihren Prozess."
        canonical={CANONICAL}
        breadcrumbs={breadcrumbs}
        faqItems={FAQ}
        additionalSchema={schema}
      />

      <main className="min-h-screen">
        {/* ── HERO — die direkte Antwort zuerst ── */}
        <section className="pt-32 pb-16 bg-white dark:bg-gray-950 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.nav
              aria-label="Breadcrumb"
              className="cq-rise flex items-center gap-1.5 text-sm text-pub-ink-3 dark:text-gray-500 mb-8"
            >
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Home
              </Link>
              <ChevronRight size={12} />
              <Link
                to="/prozessautomatisierung"
                className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Prozessautomatisierung
              </Link>
              <ChevronRight size={12} />
              <span className="text-gray-600 dark:text-gray-300">Kosten</span>
            </motion.nav>

            <motion.div className="cq-rise cq-rise-d1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
                <Euro size={12} />
                Kosten · Preistreiber · Wirtschaftlichkeit
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-6">
                {H1}
              </h1>

              {/*
                DIE KURZE ANTWORT ZUERST. Wer mit einer Kostenfrage kommt, soll
                nicht erst drei Abschnitte lesen müssen — auch dann nicht, wenn
                die ehrliche Antwort „das hängt ab von“ lautet. Dann gehört
                genau dieser Satz nach oben, samt dem, was er abhängt.
              */}
              <div className="max-w-3xl space-y-5 text-[17px] lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>
                  Der Preis einer Prozessautomatisierung hängt an vier Dingen: wie
                  eindeutig der Ablauf beschreibbar ist, wie viele Ausnahmen er
                  kennt, wie viele Systeme beteiligt sind und ob deren
                  Schnittstellen den gewünschten Vorgang überhaupt zulassen. Zwei
                  Vorhaben mit demselben Namen können sich dadurch um ein
                  Vielfaches unterscheiden.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-gray-100 font-semibold">
                    Cogniiq veröffentlicht deshalb keine Preisstaffel für
                    Automatisierung.
                  </strong>{" "}
                  Eine Zahl, die diese Unterschiede ignoriert, ist entweder zu
                  niedrig und wird im Angebot wieder kassiert, oder zu hoch und
                  schreckt Vorhaben ab, die sich gelohnt hätten. Was auf dieser
                  Seite steht, ist das, was Sie stattdessen brauchen: jeder
                  Preistreiber einzeln, einmalige und laufende Kosten getrennt,
                  die Fälle, in denen sich Automatisierung nicht lohnt — und ein
                  Rechner, in den Sie Ihre eigene Investitionssumme eintragen.
                </p>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="#wirtschaftlichkeitsrechner"
                  onClick={() => trackEvent("automation_cta_clicked", "hero-rechner")}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Wirtschaftlichkeit rechnen
                  <ArrowRight size={16} />
                </a>
                <Link
                  to="/prozessautomatisierung"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  Wie Cogniiq Prozesse automatisiert
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {[
                "Angebot nach Prozessaufnahme",
                "Einmalig und laufend getrennt ausgewiesen",
                "Schnittstellen vor dem Angebot geprüft",
              ].map((item, i) => (
                <span
                  key={item}
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"
                >
                  {i > 0 && (
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
                  )}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── KOSTENTREIBER ── */}
        <Abschnitt
          id="treiber"
          titel="Was den Preis bestimmt"
          lead="Acht Eigenschaften Ihres Prozesses — nicht unseres Angebots. Wer sie durchgeht, kann vor dem ersten Gespräch einschätzen, ob sein Vorhaben am günstigen oder am aufwendigen Ende liegt."
        >
          <div className="grid md:grid-cols-2 gap-4">
            {KOSTENTREIBER.map((f, i) => (
              <motion.div
                key={f.titel}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.05}
                className="flex gap-4 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
              >
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-pub-accent-soft dark:text-pub-accent-soft" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{f.titel}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── EINMALIG VS. LAUFEND ── */}
        <Abschnitt
          id="struktur"
          titel="Einmalig und laufend — zwei getrennte Zahlen"
          lead="Sie stehen im Angebot nie in einer Summe. Wer beides zusammenzieht, kann weder die Investition beurteilen noch den Betrieb planen."
          dunkel
        >
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Euro,
                titel: "Einmalig: bis zum Go-live",
                punkte: [
                  "Prozessaufnahme und Klärung der Ausnahmen",
                  "Prüfung der Schnittstellen aller beteiligten Systeme",
                  "Aufbau des Ablaufs samt Fehler- und Eskalationswegen",
                  "Tests mit echten, realistischen Fällen",
                  "Übergabe und Dokumentation",
                ],
              },
              {
                icon: Repeat,
                titel: "Laufend: nach dem Go-live",
                punkte: [
                  "Überwachung des Ablaufs und Alarmierung bei Störungen",
                  "Nachziehen, wenn ein angebundenes System sich ändert",
                  "Anpassungen, wenn sich Ihre Regeln ändern",
                  "Gebühren Dritter für die beteiligten Schnittstellen",
                  "Bei unkritischen Abläufen ohne externe Anbindung kann dieser Posten entfallen",
                ],
              },
            ].map(({ icon: Icon, titel, punkte }, i) => (
              <motion.div
                key={titel}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.08}
                className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
              >
                <Icon size={22} className="mb-4 text-pub-accent-soft dark:text-pub-accent-soft" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{titel}</h3>
                <ul className="space-y-2">
                  {punkte.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 size={13} className="flex-shrink-0 mt-1 text-pub-accent-soft dark:text-pub-accent-soft" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── UMFÄNGE ── */}
        <Abschnitt
          id="umfaenge"
          titel="Vier Zuschnitte zur Einordnung"
          lead="Beispielhafte Umfänge, damit Sie Ihr Vorhaben einordnen können — keine abgerechneten Kundenprojekte, und bewusst ohne Beträge."
        >
          <div className="grid md:grid-cols-2 gap-6">
            {UMFAENGE.map((u, i) => (
              <motion.div
                key={u.titel}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.08}
                className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{u.titel}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{u.text}</p>
                </div>
                <div className="px-6 py-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-pub-ink-3 dark:text-gray-500">
                    Was den Aufwand treibt
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-1">{u.treiber}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0.3}
            className="mt-8 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-start gap-3"
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-pub-ink-3 dark:text-gray-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Diese Zuschnitte sind Beschreibungen von Umfang, keine Angebote und
              keine Kundenprojekte. Ihr Angebot entsteht nach der Prozessaufnahme
              und beziffert einmalige und laufende Kosten getrennt.
            </p>
          </motion.div>
        </Abschnitt>

        {/* ── SCHNITTSTELLEN ── */}
        <Abschnitt
          id="schnittstellen"
          titel="Schnittstellen: der Posten, der ein Vorhaben kippen kann"
          lead="Die Frage ist nicht, ob wir ein System „unterstützen“, sondern was dessen Schnittstelle im konkreten Fall erlaubt."
          dunkel
        >
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
            >
              <Plug size={22} className="mb-4 text-pub-accent-soft dark:text-pub-accent-soft" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Fünf Fragen je System, vor dem Angebot
              </h3>
              <ul className="space-y-2">
                {[
                  "Gibt es überhaupt eine geeignete Schnittstelle?",
                  "Welcher Zugang ist nötig, und wer kann ihn erteilen?",
                  "Welche Vorgänge erlaubt sie — nur lesen, oder auch schreiben?",
                  "Passt die Datenstruktur zu dem, was der Ablauf braucht?",
                  "Welche Beschränkungen und Kosten verlangt der Anbieter dafür?",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 size={13} className="flex-shrink-0 mt-1 text-pub-accent-soft dark:text-pub-accent-soft" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.08}
              className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
            >
              <ShieldAlert size={22} className="mb-4 text-pub-accent-soft dark:text-pub-accent-soft" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Wenn die Antwort nein lautet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Dann gibt es drei mögliche Ergebnisse, und alle drei stehen vor
                dem Angebot fest:
              </p>
              <ul className="space-y-2">
                {[
                  "Der Schritt läuft über einen anderen Weg — Datei-Übergabe, E-Mail, Export und Import.",
                  "Der Schritt bleibt bewusst manuell und wird nur vorbereitet und angestoßen.",
                  "Das Vorhaben ist in dieser Form nicht sinnvoll umsetzbar — und das sagen wir vorher.",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 size={13} className="flex-shrink-0 mt-1 text-pub-accent-soft dark:text-pub-accent-soft" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
                Was Sie von uns nicht hören werden: dass wir „mit allen gängigen
                Tools“ arbeiten. Das ist eine Zusage über fremde Software, für die
                niemand geradestehen kann. Welche Systeme in Ihrem Fall
                anbindbar sind, steht nach der Prüfung fest —{" "}
                <Link
                  to="/integrationen"
                  className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  wie wir mit Integrationen umgehen
                </Link>
                .
              </p>
            </motion.div>
          </div>
        </Abschnitt>

        {/* ── AUSNAHMEN UND ABSICHERUNG ── */}
        <Abschnitt
          id="absicherung"
          titel="Ausnahmen, Tests und Betrieb — der unterschätzte Teil der Rechnung"
          lead="Der Normalfall ist schnell gebaut. Was ein Vorhaben teuer oder billig macht, entscheidet sich an dem, was danach kommt."
        >
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                titel: "Ausnahmen",
                text: "Jede Ausnahme ist ein eigener Weg: erkennen, entscheiden, weiterleiten. Werden sie in der Aufnahme benannt, sind sie Aufwand. Tauchen sie erst im Betrieb auf, sind sie Nacharbeit — und Nacharbeit ist die teuerste Form von Aufwand.",
              },
              {
                titel: "Tests",
                text: "Getestet wird mit realistischen Fällen aus Ihrem Betrieb, nicht mit Wunschdaten: der Normalfall, die benannten Ausnahmen, unvollständige Eingaben und der Fall, in dem ein beteiligtes System nicht antwortet. Das ist ein eigener Block im Aufwand, kein Anhängsel.",
              },
              {
                titel: "Betrieb",
                text: "Welche Absicherung ein Ablauf braucht — Prüfungen, Wiederholungen, Protokoll, Alarm, menschlicher Rückfallweg — wird je Ablauf festgelegt, nicht pauschal. Ein unkritischer Ablauf braucht weniger davon als einer, dessen Fehler einen Kunden trifft.",
              },
            ].map((b, i) => (
              <motion.div
                key={b.titel}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.08}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{b.titel}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{b.text}</p>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── RECHNER ── */}
        <section
          className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300"
          aria-labelledby="rechner-heading"
        >
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <h2 id="rechner-heading" className="sr-only">
              Wirtschaftlichkeitsrechner
            </h2>
            <AutomatisierungRechner />
          </div>
        </section>

        {/* ── WANN NICHT ── */}
        <Abschnitt
          id="dagegen"
          titel="Wann sich Automatisierung nicht lohnt"
          lead="Sechs Fälle, in denen die ehrliche Antwort nein lautet oder die Rechnung sehr genau zu prüfen ist. Wer sie kennt, spart sich ein Projekt, das niemandem nützt — und erkennt umgekehrt schneller, welcher seiner Abläufe der richtige ist."
        >
          <div className="grid md:grid-cols-2 gap-4">
            {NICHT_SINNVOLL.map((n, i) => (
              <motion.div
                key={n.titel}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.05}
                className="flex gap-4 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
              >
                <XCircle size={16} className="flex-shrink-0 mt-0.5 text-pub-ink-3 dark:text-gray-500" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{n.titel}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{n.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── FAQ ── */}
        <section
          className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300"
          aria-labelledby="faq-heading"
        >
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-10"
            >
              <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Häufige Fragen zu Kosten und Preisen
              </h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.1}>
              <Accordion type="single" collapsible className="space-y-3">
                {FAQ.map((item, i) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${i}`}
                    className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-5 data-[state=open]:border-gray-300 dark:data-[state=open]:border-gray-600 transition-colors"
                  >
                    <AccordionTrigger className="text-left text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-5 [&>svg]:text-gray-400">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pb-5">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* ── LINKS ── */}
        <section
          className="py-16 bg-white dark:bg-gray-950 transition-colors duration-300"
          aria-labelledby="links-heading"
        >
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-8"
            >
              <h2 id="links-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Weiter im Automatisierungs-Cluster
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-3xl">
                Die Leistung selbst steht auf{" "}
                <Link
                  to="/prozessautomatisierung"
                  className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  Prozessautomatisierung
                </Link>
                . Wenn das Problem eher „zu viel Handarbeit“ heißt als „was kostet das“,
                führt{" "}
                <Link
                  to="/zu-viel-manuelle-arbeit"
                  className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  zu viel manuelle Arbeit
                </Link>{" "}
                dorthin, und wer erst einordnen will, wo Digitalisierung im Betrieb
                überhaupt ansetzt, findet das unter{" "}
                <Link
                  to="/digitale-automatisierung-unternehmen"
                  className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  digitale Automatisierung im Unternehmen
                </Link>
                .
              </p>
            </motion.div>

            <div className="flex flex-wrap gap-3">
              {STADT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  <MapPin size={12} className="text-gray-400" />
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-pub-ink-3 dark:text-gray-500 mb-4">
                Branchen
              </p>
              <div className="flex flex-wrap gap-3">
                {BRANCHEN_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  >
                    {link.label}
                    <ArrowRight size={12} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Der nächste Schritt ist die Prozessaufnahme
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Bringen Sie einen konkreten Ablauf mit — den, der Sie am meisten
                Zeit kostet. Wir gehen ihn Schritt für Schritt durch, benennen die
                Ausnahmen und prüfen, was die beteiligten Systeme zulassen. Danach
                wissen Sie, was möglich ist, was es kostet und ob es sich trägt.
                Kostenlos und unverbindlich.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/kontakt"
                  onClick={() => trackEvent("automation_cta_clicked", "abschluss")}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Erstgespräch vereinbaren
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/prozessautomatisierung"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  Prozessautomatisierung ansehen
                </Link>
              </div>
              <p className="mt-6 text-xs text-pub-ink-3 dark:text-gray-500">
                {BUSINESS_INFO.name} · {BUSINESS_INFO.contact.email} · {BUSINESS_INFO.contact.phoneDisplay}
              </p>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
