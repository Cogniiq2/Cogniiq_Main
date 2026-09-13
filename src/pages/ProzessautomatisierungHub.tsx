// ─────────────────────────────────────────────────────────────────────────────
// /prozessautomatisierung — kanonischer Eigentümer der nationalen
// Automatisierungs-Kopfintention.
//
// WAS SICH AM 12.09.2026 GEÄNDERT HAT
//
// Diese Seite war mit 2.746 Zeichen die dünnste Seite ihres Clusters und trug
// den Titel „Pillar" nur im Manifest: Verlinkt und inhaltlich ausgebaut war
// `/automatisierung-unternehmen` (7.769 Zeichen, Hauptnavigation, 22
// kontextuelle Links). Zwei nationale Seiten auf eine Kopfintention, beide auf
// „Automatisierung für Unternehmen" getitelt — die Kannibalisierung K1 aus
// docs/seo/ARCHITEKTUR.md §4.1.
//
// Die andere Seite ist per 301 hierher überführt. Ihr Inhalt wurde NICHT
// kopiert: Er bestand in weiten Teilen aus Aussagen, die keine Quelle deckt —
// „Quick-Wins in 1–3 Wochen", eine Liste von elf Fremdprodukten als
// Kompatibilitätszusage, Preisstaffeln ohne Bestätigung, „30 Minuten Arbeit
// passieren jetzt in Sekunden". Was davon belegbar war, ist hier neu
// geschrieben; der Rest ist ersatzlos weg. Herkunftsprüfung:
// docs/seo/preisaudit-automatisierung.md.
//
// WOFÜR DIESE SEITE GEBAUT IST
//
// Für einen Geschäftsführer, der entscheidet, ob Cogniiq einen Teil seines
// Betriebs automatisieren kann. Er braucht keine Adjektive, sondern Antworten
// auf sechzehn Fragen: was das ist, was sich eignet, was NICHT, wo KI etwas
// beiträgt und wo nicht, was bei einer Ausnahme passiert, wie Systeme verbunden
// werden, was gilt wenn eines keine Schnittstelle hat, wie eine Aufnahme
// abläuft, wie gebaut, getestet, freigegeben und betrieben wird, was es kostet,
// wie er die Wirtschaftlichkeit prüft, für welche Branchen wir arbeiten und was
// der nächste Schritt ist. Die Abschnitte unten sind genau diese Fragen.
//
// PREIS-INTENTION BLEIBT BEI /kosten-automatisierung. Diese Seite erklärt die
// Preislogik knapp und verweist; eine ausgebaute Preisstrecke hier
// würde die Kostenseite kannibalisieren, die als einzige Seite dieses Clusters
// heute schon in Reichweite der ersten Ergebnisseite steht.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ChartBar as BarChart2,
  ChevronRight,
  CircleCheck as CheckCircle2,
  FileText,
  GitMerge,
  MapPin,
  Repeat,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Users,
  Utensils,
  Briefcase,
  XCircle,
} from "lucide-react";

import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";

const BASE = BUSINESS_INFO.website;
const CANONICAL = `${BASE}/prozessautomatisierung`;

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
  { name: "Prozessautomatisierung", url: CANONICAL },
];

/* ── Welche Prozesse sich eignen ── */
const GEEIGNET = [
  {
    titel: "Er wiederholt sich",
    text: "Derselbe Ablauf, mehrmals pro Woche, in erkennbar gleicher Form. Die Häufigkeit entscheidet über die Wirtschaftlichkeit, nicht die Komplexität.",
  },
  {
    titel: "Er hat einen klaren Auslöser",
    text: "Ein Formular geht ein, ein Status wechselt, ein Termin wird gebucht, eine Frist läuft ab, es ist Montag früh. Ohne eindeutigen Auslöser gibt es nichts zu starten.",
  },
  {
    titel: "Die Regeln sind aufschreibbar",
    text: "Wer den Ablauf in wenigen Sätzen vollständig beschreiben kann, hat einen guten Kandidaten. Wenn drei Beteiligte drei Versionen erzählen, ist zuerst der Ablauf zu klären.",
  },
  {
    titel: "Die Eingangsdaten sind brauchbar",
    text: "Strukturierte Felder sind der einfache Fall. Freitext und Dokumente sind möglich, brauchen aber einen zusätzlichen Schritt, der sie erst in Struktur überführt.",
  },
  {
    titel: "Das Ergebnis ist überprüfbar",
    text: "Es muss sich sagen lassen, ob ein Durchlauf richtig war. Was niemand nachprüfen kann, lässt sich auch nicht verantwortlich automatisieren.",
  },
  {
    titel: "Fehler sind beherrschbar",
    text: "Ein Fehler muss auffallen und korrigierbar sein. Je härter die Folgen, desto mehr Absicherung gehört dazu — und desto sorgfältiger wird der Ablauf zugeschnitten.",
  },
];

const UNGEEIGNET = [
  {
    /*
      KEINE HÄUFIGKEITSSCHWELLE. Hier stand „Was zwölfmal im Jahr passiert, holt
      die Investition kaum herein" — eine erfundene Grenze, die als allgemeine
      Regel wirtschaftlich falsch ist. Häufigkeit allein entscheidet nichts: Ein
      Vorgang, der viermal im Jahr läuft, dabei aber zwei Tage Facharbeit bindet,
      teuer ist oder fehlerkritisch, kann sich tragen — und ein täglicher
      Trivialvorgang eine große Umsetzung nicht rechtfertigen. Was zählt, ist
      Aufwand × Wert × Risiko je Durchlauf gegen Investition und laufende Kosten.

      UND KEIN GLEICHSETZEN DER BETRIEBSKOSTEN. In der ersten Korrektur stand
      noch „Aufnahme, Tests und Betrieb kosten dasselbe wie bei einem täglichen
      Ablauf". Für Aufnahme, Aufbau und Tests stimmt das ungefähr — das ist
      Festaufwand. Für den BETRIEB stimmt es nicht: Ausführungshäufigkeit,
      API-Nutzung, Ausnahmen, Überwachung, Gebühren Dritter und die tatsächliche
      Komplexität des Ablaufs bewegen ihn. Die beiden Posten werden deshalb
      getrennt benannt, statt sie in eine Absolutaussage zu ziehen.
    */
    titel: "Selten — und je Durchlauf klein",
    text: "Je seltener ein Vorgang vorkommt und je geringer der Aufwand pro Durchlauf ist, desto schwieriger trägt sich eine Automatisierung. Auch bei seltenen Abläufen fällt ein Grundaufwand für Aufnahme, Aufbau und Tests an; wie hoch der laufende Betriebsaufwand ist, hängt vom konkreten Prozess, seiner Nutzung und den beteiligten Systemen ab. Selten allein ist aber kein Ausschlusskriterium — ein einzelner Vorgang kann sehr zeitaufwendig, teuer oder fehlerkritisch sein. Entscheidend ist die Rechnung mit den konkreten Zahlen.",
  },
  {
    titel: "Die Regeln ändern sich ständig",
    text: "Jede Regeländerung muss nachgezogen werden. Bei hoher Änderungsrate verschiebt Automatisierung den Aufwand von der Ausführung in die Pflege.",
  },
  {
    titel: "Die Arbeit ist Abwägung",
    text: "Wo jeder Fall eine eigene Entscheidung verlangt, gibt es keine Regel zu automatisieren. Zuarbeit ist möglich — Unterlagen vorsortieren, einen Entwurf vorbereiten —, die Entscheidung bleibt beim Menschen.",
  },
  {
    titel: "Der Ablauf selbst ist das Problem",
    text: "Ein umständlicher Prozess wird durch Automatisierung ein schnellerer umständlicher Prozess und zusätzlich schwerer zu ändern. Erst vereinfachen, dann automatisieren.",
  },
  {
    titel: "Die Systeme lassen sich nicht anbinden",
    text: "Fehlt eine geeignete Schnittstelle oder erlaubt sie den gewünschten Vorgang nicht, sagen wir das vor dem Angebot — nicht danach.",
  },
  {
    titel: "Die Rechnung geht nicht auf",
    text: "Trägt der realistisch reduzierbare Aufwand die Investition über einen vertretbaren Zeitraum nicht, ist die Antwort nein. Der Rechner auf der Kostenseite ist auch dafür da.",
  },
];

/* ── Ablaufmuster ── */
const MUSTER = [
  {
    icon: Users,
    titel: "Anfrage und Lead",
    schritte: [
      "Auslöser: Formular oder E-Mail geht ein",
      "Angaben in einheitliche Felder überführen",
      "Vorgang im Zielsystem anlegen oder aktualisieren, sofern dessen Schnittstelle das zulässt",
      "Zuständigkeit nach Ihren Regeln vergeben",
      "Beteiligte benachrichtigen",
      "Wiedervorlage setzen, wenn bis Frist nichts passiert",
    ],
    mensch: "Die Regeln für Zuständigkeit und Frist legen Sie fest. Alles, was nicht eindeutig zugeordnet werden kann, geht in eine Ausnahmeliste statt an eine geratene Adresse.",
  },
  {
    icon: Repeat,
    titel: "Termin und Buchung",
    schritte: [
      "Auslöser: ein Termin wird gebucht, verschoben oder abgesagt",
      "Bestätigung an den Kunden",
      "Erinnerung zum vereinbarten Zeitpunkt",
      "Status im führenden System nachziehen, sofern angebunden",
      "Nachfassen nach dem Termin, wenn vorgesehen",
    ],
    mensch: "Was versendet wird, in welchem Ton und zu welchem Zeitpunkt, ist Ihre Entscheidung. Absagen und Sonderfälle können bewusst auf einen Menschen gelenkt werden.",
  },
  {
    icon: FileText,
    titel: "Dokumente",
    schritte: [
      "Auslöser: ein Dokument geht ein",
      "Art des Dokuments bestimmen",
      "Die benötigten Angaben auslesen",
      "Gegen Ihre Regeln prüfen — Pflichtfelder, Plausibilität, Dubletten",
      "An das zuständige System oder die zuständige Person weiterleiten",
      "Unklare Fälle in die Ausnahmeliste, nie stillschweigend durchwinken",
    ],
    mensch: "Ausgelesene Werte werden vor der Weiterverarbeitung geprüft. Wo eine Prüfung nicht eindeutig ausfällt, entscheidet ein Mensch — das ist der Normalfall, nicht der Störfall.",
  },
  {
    icon: CheckCircle2,
    titel: "Onboarding",
    schritte: [
      "Auslöser: eine Zusage liegt vor",
      "Interne Checkliste erzeugen",
      "Aufgaben mit Zuständigkeit und Frist anlegen",
      "Vereinbarte Informationen an den Kunden senden",
      "Offene Punkte verfolgen und erinnern",
      "Abschluss melden, wenn alles erledigt ist",
    ],
    mensch: "Die Checkliste ist Ihre. Der Ablauf hält sie nach und macht sichtbar, was hängt — er entscheidet nicht, ob ein Punkt entfallen darf.",
  },
  {
    icon: BarChart2,
    titel: "Auswertung und Bericht",
    schritte: [
      "Auslöser: ein Zeitpunkt, etwa Montag früh",
      "Daten aus den freigegebenen Quellen holen",
      "Vereinbarte Kennzahlen berechnen",
      "Bericht erzeugen",
      "An die festgelegten Empfänger senden",
      "Melden, wenn eine Quelle nicht erreichbar war — statt einen unvollständigen Bericht zu senden",
    ],
    mensch: "Welche Quellen, welche Kennzahlen, welche Definition: alles Ihre Vorgaben. Ein Bericht aus unvollständigen Daten wird nicht kommentarlos verschickt.",
  },
  {
    icon: ShieldAlert,
    titel: "Betrieb und Zustandswechsel",
    schritte: [
      "Auslöser: ein Ereignis oder eine Zustandsänderung",
      "Die hinterlegten Regeln prüfen",
      "Die freigegebene Aktion ausführen",
      "Alles, was die Regeln nicht abdecken, in die Ausnahmeliste",
      "Bei Bedarf an die zuständige Person eskalieren",
    ],
    mensch: "Welche Aktionen automatisch laufen dürfen und welche eine Freigabe brauchen, wird je Ablauf festgelegt. Im Zweifel gilt: eskalieren statt handeln.",
  },
];

/* ── Umsetzungsablauf ── */
const ABLAUF = [
  {
    titel: "Prozessaufnahme",
    text: "Wir gehen den Ablauf mit den Menschen durch, die ihn heute machen — Schritt für Schritt, so wie er tatsächlich läuft und nicht wie er im Handbuch steht.",
  },
  {
    titel: "Auslöser und Eingang festlegen",
    text: "Was startet den Ablauf, woher kommen die Daten, in welcher Form liegen sie vor.",
  },
  {
    titel: "Entscheidungen und Ausnahmen kartieren",
    text: "Jede Verzweigung wird benannt, und ausdrücklich auch jeder Fall, der anders läuft. Ausnahmen, die hier fehlen, tauchen später im Betrieb auf — dann als Nacharbeit.",
  },
  {
    titel: "Zielsysteme benennen",
    text: "Wo soll das Ergebnis landen, wer ist für dieses System verantwortlich, wer kann Zugang erteilen.",
  },
  {
    titel: "Schnittstellen prüfen",
    text: "Für jedes beteiligte System: Gibt es eine geeignete Schnittstelle, welche Vorgänge erlaubt sie, welcher Zugang ist nötig, welche Beschränkungen und Kosten setzt der Anbieter. Das Ergebnis steht im Angebot — auch wenn es negativ ausfällt.",
  },
  {
    titel: "Eskalation und Rückfallweg definieren",
    text: "Wer bekommt welchen Fall, wenn der Ablauf nicht weiterkommt. Wird hier keine Zuständigkeit festgelegt, landet im Betrieb jede Ausnahme bei niemandem.",
  },
  {
    titel: "Aufbau",
    text: "Der Ablauf wird gebaut — einschließlich der Prüfungen, der Fehlerwege und der Protokollierung, nicht nur des Normalfalls.",
  },
  {
    titel: "Test mit realistischen Fällen",
    text: "Getestet wird mit echten Fällen aus Ihrem Betrieb: der Normalfall, die benannten Ausnahmen, unvollständige Eingaben und der Fall, in dem ein beteiligtes System nicht antwortet.",
  },
  {
    titel: "Freigabe durch Sie",
    text: "Live geht nichts, bevor Sie die Testergebnisse gesehen und den Ablauf freigegeben haben.",
  },
  {
    titel: "Go-live",
    text: "Der Ablauf übernimmt. Wo es sinnvoll ist, zuerst für einen Teilbereich oder mit einer Freigabe vor dem letzten Schritt.",
  },
  {
    titel: "Betrieb und Nachschärfen",
    text: "Die ersten Wochen zeigen Fälle, die in der Aufnahme niemand genannt hat. Sie werden aufgenommen und der Ablauf wird nachgezogen — das ist Teil der Umsetzung, nicht ihr Scheitern.",
  },
];

/* ── Absicherung ── */
const ABSICHERUNG = [
  { titel: "Prüfen vor dem Weiterverarbeiten", text: "Pflichtangaben, Format, Plausibilität. Ein Ablauf, der ungeprüfte Daten weitergibt, verteilt einen Fehler, statt ihn zu stoppen." },
  { titel: "Erneut versuchen, wo es sinnvoll ist", text: "Antwortet ein System kurzzeitig nicht, hilft ein zweiter Versuch. Bei Schritten, die kein zweites Mal laufen dürfen, wäre er der Fehler — deshalb wird das je Schritt entschieden." },
  { titel: "Protokollieren", text: "Nachvollziehbar, was wann mit welchen Daten passiert ist. Ohne Protokoll ist eine Störung nicht analysierbar, sondern nur bemerkbar." },
  { titel: "Alarmieren", text: "Wenn ein Ablauf stehenbleibt, erfährt es jemand — statt dass es auffällt, weil ein Kunde nachfragt." },
  { titel: "Ausnahmen sammeln", text: "Fälle, die der Ablauf nicht abdeckt, landen an einer Stelle, die jemand ansieht. Nicht im Nichts, und nicht mitten im Normalfall." },
  { titel: "Menschlicher Rückfallweg", text: "Für jeden Ablauf steht fest, was passiert, wenn er nicht weiterkommt: wer übernimmt, in welcher Form, bis wann." },
  { titel: "Zuständigkeit benennen", text: "Eine Person auf Ihrer Seite, die für diesen Ablauf verantwortlich ist. Ein Ablauf ohne Eigentümer wird nach der ersten Störung stillgelegt." },
];

const CITY_LINKS = [
  { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung", sub: "Hauptsitz & Region Oberfranken" },
  { label: "Automatisierung München", href: "/muenchen/automatisierung", sub: "Metropolregion München" },
  { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung", sub: "Ostbayern & Regensburg" },
];

const INDUSTRY_LINKS = [
  { icon: Stethoscope, label: "Automatisierung Arztpraxen", href: "/automatisierung-arzt" },
  { icon: Utensils, label: "Automatisierung Restaurants", href: "/automatisierung-restaurant" },
  { icon: Building2, label: "Automatisierung Immobilien", href: "/automatisierung-immobilien" },
  { icon: Briefcase, label: "Automatisierung Sport & Fitness", href: "/automatisierung-sport" },
];

const faqItems = [
  {
    question: "Was ist Prozessautomatisierung?",
    answer:
      "Ein wiederkehrender Arbeitsablauf wird so eingerichtet, dass er nach festgelegten Regeln von selbst läuft: Ein Ereignis löst ihn aus, die Daten werden geprüft und aufbereitet, die vorgesehenen Schritte laufen in den beteiligten Systemen, und alles, was die Regeln nicht abdecken, geht an einen Menschen. Automatisiert wird der Ablauf — nicht die Entscheidung darüber, wie er aussehen soll.",
  },
  {
    question: "Welche Prozesse eignen sich für Automatisierung?",
    answer:
      "Abläufe, die sich wiederholen, einen klaren Auslöser haben, in Regeln beschreibbar sind, mit brauchbaren Eingangsdaten arbeiten und deren Ergebnis überprüfbar ist. Typische Kandidaten sind Anfragen- und Lead-Bearbeitung, Termin- und Buchungskommunikation, Dokumenteneingang, Onboarding, wiederkehrende Auswertungen und regelbasierte Reaktionen auf Zustandsänderungen.",
  },
  {
    question: "Was sollte man nicht automatisieren?",
    answer:
      "Seltene Vorgänge, Abläufe mit ständig wechselnden Regeln, Arbeit, die im Kern aus Abwägung besteht, Prozesse, die zuerst vereinfacht gehören, und alles, dessen Systeme sich technisch nicht anbinden lassen. Und alles, dessen realistisch reduzierbarer Aufwand die Investition nicht trägt — das lässt sich auf der Kostenseite mit Ihren eigenen Zahlen prüfen.",
  },
  {
    question: "Wo hilft KI, und wo reicht gewöhnliche Automatisierung?",
    answer:
      "Der überwiegende Teil eines Ablaufs ist deterministisch: „Wenn A, dann B“ — dieselbe Eingabe ergibt immer dasselbe Ergebnis, prüfbar und wiederholbar. Ein KI-Schritt kommt dort dazu, wo unstrukturierte Eingaben verarbeitet werden müssen: einordnen, zusammenfassen, Angaben aus Freitext oder einem Dokument herauslesen, einen Entwurf vorbereiten. Sein Ergebnis wird geprüft und läuft dann wieder durch deterministische Regeln. Nicht jede Automatisierung ist KI, und es ist keine Qualitätsaussage, ob sie es ist.",
  },
  {
    question: "Was passiert, wenn eine Ausnahme auftritt?",
    answer:
      "Sie wird erkannt und ausgesteuert, statt stillschweigend durchzulaufen. Welche Absicherung ein Ablauf bekommt — Prüfungen, Wiederholungsversuche, Protokoll, Alarm, Ausnahmeliste, menschlicher Rückfallweg — wird je Ablauf festgelegt und richtet sich danach, was ein Fehler dort anrichten würde. Nicht jeder Ablauf enthält jeden dieser Mechanismen; welche er enthält, steht im Angebot.",
  },
  {
    question: "Wie werden mehrere Systeme miteinander verbunden?",
    answer:
      "Über die Schnittstellen der beteiligten Systeme, und nur soweit diese sie zulassen. Vor dem Angebot prüfen wir für Ihre konkreten Systeme: ob es eine geeignete Schnittstelle gibt, welcher Zugang nötig ist, welche Vorgänge damit möglich sind, ob die Datenstruktur passt und welche Beschränkungen oder Kosten Dritte dafür verlangen. Eine Liste unterstützter Produkte veröffentlichen wir nicht — sie wäre eine Zusage über fremde Software.",
  },
  {
    question: "Was, wenn ein System keine geeignete Schnittstelle hat?",
    answer:
      "Dann gibt es drei mögliche Ergebnisse, und alle drei stehen vor dem Angebot fest: Der Schritt läuft über einen anderen Weg — Datei-Übergabe, E-Mail, Export und Import. Oder er bleibt bewusst manuell und wird nur vorbereitet und angestoßen. Oder das Vorhaben ist in dieser Form nicht sinnvoll umsetzbar. Was wir nicht tun: eine Anbindung zusagen, die technisch nicht geprüft ist.",
  },
  {
    question: "Wie läuft eine Umsetzung ab?",
    answer:
      "In elf Schritten von der Prozessaufnahme über die Kartierung der Ausnahmen, die Prüfung der Schnittstellen und die Festlegung der Eskalationswege zum Aufbau, zum Test mit realistischen Fällen, zu Ihrer Freigabe, zum Go-live und in den Betrieb. Zeitangaben nennen wir vorab nicht: Sie hängen daran, wie viele Ausnahmen ein Ablauf kennt und wie schnell Zugänge zu Drittsystemen verfügbar sind — beides steht erst nach der Aufnahme fest.",
  },
  {
    question: "Was kostet Prozessautomatisierung?",
    answer:
      "Das hängt daran, wie eindeutig der Ablauf beschreibbar ist, wie viele Ausnahmen er kennt, wie viele Systeme beteiligt sind und was deren Schnittstellen zulassen. Eine Preisstaffel veröffentlichen wir dafür nicht — sie wäre für die meisten Vorhaben falsch. Auf der Kostenseite stehen alle Preistreiber im Einzelnen, die Trennung von einmaligem und laufendem Aufwand und ein Rechner, in den Sie Ihre eigenen Zahlen eintragen.",
  },
  {
    question: "Braucht mein Team technisches Wissen?",
    answer:
      "Für den Betrieb nicht. Wir bauen und dokumentieren den Ablauf, und Ihr Team arbeitet damit wie mit den Systemen, die es ohnehin nutzt. Was Sie beitragen, ist Fachwissen über den Prozess: welche Regeln gelten, welche Ausnahmen es gibt, wer im Zweifel entscheidet. Ohne das kann niemand automatisieren.",
  },
];

/*
  SCHEMA. Service ohne Preisangabe und ohne Bewertungen: Beides stünde ohne
  Beleg im strukturierten Datensatz, und ein strukturierter Datensatz, der mehr
  behauptet als die Seite zeigt, ist der teuerste Weg, sich Rich Results zu
  verderben. FAQPage erzeugt PageSEO aus `faqItems`.
*/
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${CANONICAL}#service`,
  name: "Prozessautomatisierung für Unternehmen",
  description:
    "Cogniiq richtet wiederkehrende Geschäftsabläufe so ein, dass sie nach festgelegten Regeln laufen: Prozessaufnahme, Kartierung der Ausnahmen, geprüfte Anbindung der beteiligten Systeme, Tests mit realistischen Fällen und definierte menschliche Eskalation.",
  provider: {
    "@type": "LocalBusiness",
    "@id": `${BASE}/#localbusiness`,
    name: "Cogniiq",
    url: BASE,
    telephone: BUSINESS_INFO.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_INFO.address.streetAddress,
      addressLocality: BUSINESS_INFO.address.addressLocality,
      postalCode: BUSINESS_INFO.address.postalCode,
      addressCountry: "DE",
    },
  },
  areaServed: { "@type": "Country", name: "Deutschland" },
  serviceType: "Prozessautomatisierung",
  url: CANONICAL,
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
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-10"
        >
          <h2 id={`${id}-heading`} className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {titel}
          </h2>
          {lead && (
            <p className="text-gray-500 dark:text-white/55 leading-relaxed max-w-3xl">{lead}</p>
          )}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

export function ProzessautomatisierungHub() {
  return (
    <>
      <PageSEO
        title="Prozessautomatisierung für Unternehmen | Abläufe automatisieren – Cogniiq"
        description="Welche Prozesse sich automatisieren lassen, welche nicht, wie Ausnahmen und Schnittstellen behandelt werden und wie eine Umsetzung abläuft. Prozessautomatisierung für Unternehmen in Deutschland."
        canonical={CANONICAL}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={serviceSchema}
      />

      <main className="min-h-screen bg-white dark:bg-gray-950">
        {/* ── HERO ── */}
        <section className="pt-28 pb-16 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto">
            <nav aria-label="Breadcrumb" className="cq-rise flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/35 mb-8">
              <Link to="/" className="hover:text-gray-600 dark:hover:text-white/60 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <span className="text-gray-600 dark:text-white/60">Prozessautomatisierung</span>
            </nav>

            <motion.p className="cq-rise text-xs font-semibold tracking-[0.18em] uppercase text-emerald-600 dark:text-emerald-400 mb-4">
              Prozessautomatisierung · Deutschland
            </motion.p>
            <motion.h1 className="cq-rise cq-rise-d1 text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-[1.08] mb-6 max-w-4xl">
              Geschäftsprozesse automatisieren — mit Ausnahmen, die jemand sieht
            </motion.h1>

            <div className="cq-rise cq-rise-d2 max-w-3xl space-y-5 text-[17px] lg:text-xl text-gray-500 dark:text-white/55 leading-relaxed mb-10">
              <p>
                Cogniiq richtet wiederkehrende Abläufe in Ihrem Unternehmen so
                ein, dass sie nach Ihren Regeln von selbst laufen: Ein Ereignis
                löst sie aus, die Daten werden geprüft, die vorgesehenen Schritte
                laufen in den beteiligten Systemen — und alles, was die Regeln
                nicht abdecken, geht an einen Menschen, statt stillschweigend
                durchzulaufen.
              </p>
              <p>
                Diese Seite beantwortet die Fragen, die vor der Entscheidung
                stehen: was sich eignet, was ausdrücklich nicht, wo KI etwas
                beiträgt und wo gewöhnliche Regeln genügen, was bei einer Störung
                passiert, wie Systeme verbunden werden, wenn sie sich verbinden
                lassen — und was zu tun ist, wenn nicht.
              </p>
            </div>

            <div className="cq-rise cq-rise-d3 flex flex-wrap gap-4">
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
              >
                Prozess besprechen <ArrowRight size={15} />
              </Link>
              <Link
                to="/kosten-automatisierung"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:border-gray-300 dark:hover:border-white/20 font-semibold text-sm transition-colors"
              >
                Kosten und Wirtschaftlichkeit
              </Link>
            </div>
          </div>
        </section>

        {/* ── WAS ES IST ── */}
        <Abschnitt
          id="grundlagen"
          titel="Was Prozessautomatisierung ist — und was sie nicht ist"
          dunkel
        >
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Was sie ist</h3>
              <p className="text-sm text-gray-600 dark:text-white/55 leading-relaxed mb-3">
                Ein Arbeitsablauf, den heute Menschen von Hand ausführen, wird als
                Abfolge festgelegter Schritte eingerichtet: Auslöser, Prüfung,
                Verarbeitung, Übergabe an die beteiligten Systeme, Benachrichtigung,
                Nachverfolgung. Was der Ablauf tut, bestimmen Ihre Regeln.
              </p>
              <p className="text-sm text-gray-600 dark:text-white/55 leading-relaxed">
                Der Gewinn liegt selten nur in der Zeit. Er liegt darin, dass ein
                Ablauf jedes Mal gleich läuft, dass nichts liegen bleibt, weil
                jemand im Urlaub war, und dass sich hinterher nachvollziehen lässt,
                was passiert ist.
              </p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.08}
              className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Was sie nicht ist</h3>
              <ul className="space-y-2.5">
                {[
                  "Kein Ersatz für eine Entscheidung. Automatisiert wird die Ausführung einer Regel, nicht die Frage, ob die Regel richtig ist.",
                  "Kein Selbstläufer. Ein Ablauf altert: Systeme ändern sich, Regeln ändern sich. Wer ihn betreut, gehört vorher festgelegt.",
                  "Keine Software, die man kauft und anschaltet. Der Aufwand steckt in Ihrem Ablauf, nicht in einem Werkzeug.",
                  "Kein Ablauf ohne Menschen. Ausnahmen, Freigaben und Grenzfälle bleiben besetzt — das ist die Voraussetzung dafür, dass der Rest laufen darf.",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-gray-600 dark:text-white/55 leading-relaxed">
                    <XCircle size={14} className="text-gray-400 dark:text-white/30 mt-1 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </Abschnitt>

        {/* ── EIGNUNG ── */}
        <Abschnitt
          id="eignung"
          titel="Welche Prozesse sich eignen"
          lead="Sechs Eigenschaften. Je mehr davon auf einen Ihrer Abläufe zutreffen, desto eher ist er der richtige, mit dem Sie anfangen."
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GEEIGNET.map((g, i) => (
              <motion.div
                key={g.titel}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.05}
                className="p-5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]"
              >
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{g.titel}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">{g.text}</p>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── UNGEEIGNET ── */}
        <Abschnitt
          id="grenzen"
          titel="Was nicht automatisiert gehört"
          lead="Der Abschnitt, den Anbieterseiten meistens weglassen. Er spart Ihnen ein Projekt, das niemandem nützt — und macht schneller sichtbar, welcher Ablauf stattdessen der richtige ist."
          dunkel
        >
          <div className="grid md:grid-cols-2 gap-4">
            {UNGEEIGNET.map((u, i) => (
              <motion.div
                key={u.titel}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.05}
                className="flex gap-3 p-5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
              >
                <XCircle size={15} className="text-gray-400 dark:text-white/30 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{u.titel}</h3>
                  <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">{u.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── DETERMINISTISCH VS KI ── */}
        <Abschnitt
          id="ki-anteil"
          titel="Wo KI etwas beiträgt — und wo gewöhnliche Regeln genügen"
          lead="Nicht jede Automatisierung ist KI, und es ist keine Qualitätsaussage, ob sie es ist. Der Unterschied ist praktisch relevant: Er entscheidet darüber, ob ein Schritt vorhersagbar ist oder geprüft werden muss."
        >
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]"
            >
              <GitMerge size={20} className="text-emerald-600 dark:text-emerald-400 mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Deterministische Automatisierung</h3>
              <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-3">
                „Wenn A, dann B.“ Dieselbe Eingabe ergibt immer dasselbe Ergebnis.
                Das ist der weitaus größte Teil eines typischen Ablaufs: Regeln
                anwenden, Felder übertragen, Zuständigkeiten vergeben, Fristen
                setzen, benachrichtigen.
              </p>
              <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">
                Der Vorteil ist nicht Nostalgie, sondern Prüfbarkeit: Ein solcher
                Schritt lässt sich vollständig testen und verhält sich im Betrieb
                wie im Test.
              </p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.08}
              className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]"
            >
              <Sparkles size={20} className="text-emerald-600 dark:text-emerald-400 mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">KI-gestützte Schritte</h3>
              <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-3">
                Sie kommen dort dazu, wo etwas Unstrukturiertes verarbeitet werden
                muss: einordnen, zusammenfassen, Angaben aus einer E-Mail oder einem
                Dokument herauslesen, einen Antwortentwurf vorbereiten.
              </p>
              <ul className="space-y-2">
                {[
                  "Ein KI-Schritt steht nie allein: Sein Ergebnis wird geprüft und läuft dann durch deterministische Regeln weiter.",
                  "Was nicht eindeutig eingeordnet werden kann, geht in die Ausnahmeliste statt in eine geratene Entscheidung.",
                  "Wo ein KI-Schritt beteiligt ist, steht das im Ablauf — es wird weder versteckt noch als Verkaufsargument vorangestellt.",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-gray-500 dark:text-white/50 leading-relaxed">
                    <CheckCircle2 size={13} className="text-emerald-500 mt-1 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </Abschnitt>

        {/* ── MUSTER ── */}
        <Abschnitt
          id="muster"
          titel="Sechs Ablaufmuster"
          lead="Was ein Ablauf tun KANN, in der Reihenfolge, in der er es tut. Das sind Muster zur Orientierung, keine Berichte über abgeschlossene Kundenprojekte — und jeder von ihnen wird für Ihren Betrieb neu zugeschnitten."
          dunkel
        >
          <div className="grid md:grid-cols-2 gap-6">
            {MUSTER.map(({ icon: Icon, titel, schritte, mensch }, i) => (
              <motion.div
                key={titel}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.06}
                className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={17} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{titel}</h3>
                </div>
                <ol className="space-y-1.5 mb-4">
                  {schritte.map((s, n) => (
                    <li key={s} className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-white/50 leading-relaxed">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[11px] font-bold text-gray-500 dark:text-white/50 flex items-center justify-center mt-0.5">
                        {n + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
                <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-1">
                    Wo der Mensch die Kontrolle behält
                  </p>
                  <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">{mensch}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── SYSTEME ── */}
        <Abschnitt
          id="systeme"
          titel="Wie Systeme verbunden werden — und was gilt, wenn eines sich nicht verbinden lässt"
          lead="Die Frage ist nie, ob wir ein Produkt „unterstützen“, sondern was dessen Schnittstelle in Ihrem konkreten Fall erlaubt. Das ist auch der Grund, warum Sie hier keine Liste kompatibler Tools finden."
        >
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Fünf Fragen je System, vor dem Angebot</h3>
              <ul className="space-y-2">
                {[
                  "Gibt es eine geeignete Schnittstelle?",
                  "Welcher Zugang ist nötig, und wer kann ihn erteilen?",
                  "Welche Vorgänge erlaubt sie — nur lesen, oder auch schreiben?",
                  "Passt die Datenstruktur zu dem, was der Ablauf braucht?",
                  "Welche Beschränkungen und Kosten verlangt der Anbieter?",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-gray-500 dark:text-white/50 leading-relaxed">
                    <CheckCircle2 size={13} className="text-emerald-500 mt-1 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mt-4">
                Ein System wird erst dann als direkt beschreibbar dargestellt, wenn
                diese Prüfung für Ihre Installation positiv ausgefallen ist.{" "}
                <Link to="/integrationen" className="text-gray-800 dark:text-white/80 underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Wie wir mit Integrationen umgehen
                </Link>
                .
              </p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.08}
              className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Wenn keine geeignete Schnittstelle da ist</h3>
              <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-3">
                Drei mögliche Ergebnisse, und alle drei stehen vor dem Angebot fest:
              </p>
              <ol className="space-y-2.5">
                {[
                  "Der Schritt läuft über einen anderen Weg — Datei-Übergabe, E-Mail, Export und Import. Langsamer, aber tragfähig.",
                  "Der Schritt bleibt bewusst manuell. Der Ablauf bereitet ihn vor, stößt ihn an und verfolgt ihn nach; ausgeführt wird er von einem Menschen.",
                  "Das Vorhaben ist in dieser Form nicht sinnvoll umsetzbar. Dann sagen wir das, bevor Sie etwas beauftragen.",
                ].map((p, n) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-white/50 leading-relaxed">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[11px] font-bold text-gray-500 dark:text-white/50 flex items-center justify-center mt-0.5">
                      {n + 1}
                    </span>
                    {p}
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>
        </Abschnitt>

        {/* ── ABSICHERUNG ── */}
        <Abschnitt
          id="ausnahmen"
          titel="Was passiert, wenn etwas schiefgeht"
          lead="Ein Ablauf, der nur den Normalfall kennt, ist kein produktiver Ablauf, sondern eine Vorführung. Welche dieser Mechanismen ein Ablauf bekommt, wird je Ablauf festgelegt — danach, was ein Fehler dort anrichten würde. Nicht jeder Ablauf enthält jeden; welche er enthält, steht im Angebot."
          dunkel
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ABSICHERUNG.map((a, i) => (
              <motion.div
                key={a.titel}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.05}
                className="p-5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
              >
                <div className="flex items-start gap-2 mb-2">
                  <ShieldAlert size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{a.titel}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">{a.text}</p>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── ABLAUF ── */}
        <Abschnitt
          id="ablauf"
          titel="Wie eine Umsetzung abläuft"
          lead="Elf Schritte von der Aufnahme bis in den Betrieb. Zeitangaben stehen hier bewusst nicht: Sie hängen daran, wie viele Ausnahmen ein Ablauf kennt und wie schnell Zugänge zu Drittsystemen verfügbar sind. Beides steht erst nach Schritt fünf fest — eine Dauer vorher zu nennen hieße, sie zu erfinden."
        >
          <ol className="space-y-3">
            {ABLAUF.map((s, i) => (
              <motion.li
                key={s.titel}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.04}
                className="flex gap-4 p-5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white text-[13px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{s.titel}</h3>
                  <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">{s.text}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </Abschnitt>

        {/* ── KOSTEN (kurz, verweist) ── */}
        <Abschnitt
          id="kosten"
          titel="Was es kostet"
          lead="Die ausführliche Antwort steht auf der Kostenseite — hier die Logik in Kürze."
          dunkel
        >
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="p-6 lg:p-8 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
          >
            <div className="max-w-3xl space-y-4 text-sm lg:text-[15px] text-gray-600 dark:text-white/55 leading-relaxed">
              <p>
                Der Preis hängt an vier Dingen: wie eindeutig der Ablauf
                beschreibbar ist, wie viele Ausnahmen er kennt, wie viele Systeme
                beteiligt sind und was deren Schnittstellen zulassen. Einmalige
                Umsetzung und laufender Betrieb werden im Angebot getrennt
                ausgewiesen, nie in einer Summe.
              </p>
              <p>
                Eine Preisstaffel veröffentlichen wir nicht. Zwei Vorhaben mit
                demselben Namen können sich um ein Vielfaches unterscheiden; eine
                Zahl, die das ignoriert, ist entweder zu niedrig und wird im
                Angebot wieder kassiert, oder zu hoch und schreckt Vorhaben ab, die
                sich gelohnt hätten.
              </p>
              <p>
                Ob sich ein konkreter Ablauf für Sie rechnet, lässt sich vorher
                prüfen — mit Ihren Stunden, Ihren Vollkosten und der
                Investitionssumme, die Sie einsetzen würden.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/kosten-automatisierung"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
              >
                Kosten, Preistreiber und Rechner <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        </Abschnitt>

        {/* ── BRANCHEN ── */}
        <Abschnitt
          id="branchen"
          titel="Branchen und Standorte"
          lead="Cogniiq arbeitet deutschlandweit remote, mit Vor-Ort-Terminen in Bayreuth, München und Regensburg. Für vier Branchen gibt es eigene Seiten mit den Abläufen, die dort typischerweise anfallen."
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INDUSTRY_LINKS.map(({ icon: Icon, label, href }, i) => (
              <motion.div key={href} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.06}>
                <Link to={href} className="group flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-emerald-200 dark:hover:border-emerald-500/20 bg-gray-50 dark:bg-white/[0.02] hover:bg-emerald-50/50 dark:hover:bg-emerald-500/[0.04] transition-all">
                  <Icon size={16} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-white/65 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{label}</span>
                  <ArrowRight size={13} className="ml-auto text-gray-300 dark:text-white/20 group-hover:text-emerald-400 transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {CITY_LINKS.map(({ label, href, sub }, i) => (
              <motion.div key={href} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.07}>
                <Link to={href} className="group flex items-start gap-3 p-5 rounded-2xl border border-gray-100 dark:border-white/[0.06] hover:border-emerald-200 dark:hover:border-emerald-500/20 bg-gray-50 dark:bg-white/[0.02] hover:bg-emerald-50/50 dark:hover:bg-emerald-500/[0.04] transition-all">
                  <MapPin size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-white/35 mt-0.5">{sub}</p>
                  </div>
                  <ChevronRight size={14} className="ml-auto text-gray-300 dark:text-white/20 group-hover:text-emerald-400 mt-0.5 transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.3}
            className="text-sm text-gray-500 dark:text-white/50 leading-relaxed mt-8 max-w-3xl"
          >
            Wenn Ihr Ausgangspunkt eher ein Problem als eine Leistung ist:{" "}
            <Link to="/zu-viel-manuelle-arbeit" className="text-gray-800 dark:text-white/80 underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              zu viel manuelle Arbeit
            </Link>{" "}
            beschreibt den Einstieg über den Aufwand,{" "}
            <Link to="/digitale-automatisierung-unternehmen" className="text-gray-800 dark:text-white/80 underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              digitale Automatisierung im Unternehmen
            </Link>{" "}
            den über die Frage, wo Digitalisierung im Betrieb überhaupt ansetzt. Geht
            es speziell um Anrufe, die niemanden erreichen, ist der{" "}
            <Link to="/ki-telefonassistent" className="text-gray-800 dark:text-white/80 underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              KI-Telefonassistent
            </Link>{" "}
            die passendere Leistung.
          </motion.p>
        </Abschnitt>

        {/* ── FAQ ── */}
        <Abschnitt id="faq" titel="Häufige Fragen zur Prozessautomatisierung" dunkel>
          <div className="space-y-3 max-w-4xl">
            {faqItems.map(({ question, answer }, i) => (
              <motion.div
                key={question}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.04}
                className="p-5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{question}</h3>
                <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">{answer}</p>
              </motion.div>
            ))}
          </div>
        </Abschnitt>

        {/* ── CTA ── */}
        <section className="py-20 px-6 lg:px-10 bg-white dark:bg-gray-950">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Der nächste Schritt ist ein Ablauf, kein Angebot
              </h2>
              <p className="text-gray-500 dark:text-white/55 mb-8 leading-relaxed">
                Bringen Sie den Prozess mit, der Sie am meisten Zeit kostet. Wir
                gehen ihn Schritt für Schritt durch, benennen die Ausnahmen und
                prüfen, was die beteiligten Systeme zulassen. Danach wissen Sie, was
                möglich ist, was es kostet und ob es sich trägt. Kostenlos und
                unverbindlich.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
                >
                  Erstgespräch vereinbaren <ArrowRight size={16} />
                </Link>
                <Link
                  to="/kosten-automatisierung"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:border-gray-300 dark:hover:border-white/20 font-semibold transition-colors"
                >
                  Erst die Wirtschaftlichkeit prüfen
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
