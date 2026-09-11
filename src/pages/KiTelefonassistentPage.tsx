import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Phone,
  Clock,
  Calendar,
  CircleCheck as CheckCircle2,
  Users,
  TrendingUp,
  Shield,
  Building2,
  Stethoscope,
  Wrench,
  UtensilsCrossed,
  Chrome as Home,
  Languages,
  Briefcase,
  PhoneCall,
  MessageSquare,
  ChevronDown,
  Lock,
  FileText,
  ListChecks,
} from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO, PHONE_HREF } from "@/lib/seo-data";
import { trackEvent } from "@/lib/consent";
import {
  ANBIETER_CHECKLISTE,
  BETREUUNG,
  EINRICHTUNG_SCHRITTE,
  FAKTEN,
  GENERISCH_DATENSCHUTZ_PUNKTE,
  GENERISCH_DECKELUNG,
  GENERISCH_GRENZEN,
  GENERISCH_IMMER_MENSCH,
  GENERISCH_NICHT_PASSEND,
  GENERISCH_SAEULEN,
  GENERISCH_UEBERGABE,
  GENERISCH_UEBERNIMMT,
  UMKEHRBARKEIT,
  WAS_IST,
} from "@/lib/telefonassistent-copy";
import { StimmprobeSection } from "@/components/StimmprobeSection";

/**
 * DIESE SEITE IST DIE GENERISCHE, BRANCHENOFFENE SEITE DES CLUSTERS.
 *
 * Sie besaß bis zum 11.09.2026 die Praxis-Bausteine aus
 * `telefonassistent-copy.ts` mit: Überschriften über Patientinnen, über das
 * Praxisteam, über medizinische Triage, dazu eine Statistik über Versicherte.
 * Für die Intention „KI Telefonassistent (für Unternehmen)" war das die falsche
 * Seite — und für Google war die dominante Entität „Arztpraxis", also genau die
 * Intention, die die Arzt-Segmentseite und `/praxen` bereits besitzen.
 *
 * Deshalb gilt hier ab jetzt: Diese Seite benutzt ausschließlich die
 * `GENERISCH_*`-Bausteine. Praxisspezifische Bausteine (PATIENTEN_SICHT,
 * TEAM_BLOCK, SAEULEN, GRENZEN, ANLIEGEN_*, DATENSCHUTZ_PUNKTE) gehören auf die
 * Praxisseiten und werden hier nicht wieder eingebaut. Wer eine medizinische
 * Formulierung auf dieser Seite braucht, braucht in Wahrheit die Praxisseite.
 *
 * PRODUKTWAHRHEIT — die drei Regeln, an denen diese Seite zweimal gescheitert
 * war und die jede Änderung wieder einhalten muss:
 *   1. BOOKING_WRITE: Kein Text und kein Bildbeispiel darf behaupten, der
 *      Assistent schreibe Termine in Kalender, CRM oder Branchensoftware. Was
 *      universell gilt, ist die AUFNAHME des Terminwunsches — `FAKTEN.terminaufnahme`.
 *   2. SMS_EMAIL_CONFIRMATION: Bestätigungen per SMS oder E-Mail sind kein
 *      Standardumfang — `FAKTEN.bestaetigungen`.
 *   3. Keine Aussage zu Hosting, Serverstandort, EU-Verarbeitung oder
 *      „DSGVO-konform", solange die AVV mit den Infrastruktur-Anbietern nicht
 *      signiert sind (Inhaber-Antwort B).
 *
 * EINGEFRORENE EXPERIMENTE: Diese Datei verweist GENAU EINMAL auf die
 * Arzt-Segmentseite und GENAU ZWEIMAL auf die Kostenseite. Diese Anzahl ist
 * Teil der Messbedingungen zweier laufender Experimente und in
 * `src/test/fixtures/protected-experiments.baseline.json` festgeschrieben. Einen
 * Link hinzuzufügen oder zu entfernen lässt den Build fehlschlagen — zu Recht.
 * Aus demselben Grund stehen die beiden Pfade hier NICHT ausgeschrieben: Der
 * Wächter zählt rohe Vorkommen im Quelltext, Kommentare eingeschlossen.
 */

/**
 * Bewegung nach COPY-BRIEF-3 §1.4: höchstens 180 ms, `ease-out`, ausschließlich
 * Deckkraft und kleine Verschiebung. Keine gestaffelten Scroll-Sequenzen.
 */
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" as const },
  },
};

const breadcrumbs = [
  { name: "Home", url: BUSINESS_INFO.website },
  { name: "KI Telefonassistent", url: `${BUSINESS_INFO.website}/ki-telefonassistent` },
];

/**
 * Der eine primäre Handlungsaufruf der Seite.
 *
 * Vorher standen „Kostenlose Demo ansehen" und „Unverbindliches Erstgespräch
 * vereinbaren" dreimal gleichrangig nebeneinander und führten beide auf ein
 * Formular. Zwei gleich gewichtete Wege zum selben Ergebnis sind keine Auswahl,
 * sondern eine Entscheidung, die dem Besucher aufgebürdet wird.
 *
 * „ansehen" war zusätzlich unzutreffend: Unter /ki-telefonassistent/demo steht
 * ein Formular, mit dem ein Demo-Termin ANGEFRAGT wird. Der Text sagt das jetzt.
 */
const PRIMARY_CTA = {
  to: "/ki-telefonassistent/demo",
  label: "Demo-Termin anfragen",
} as const;

const faqItems = [
  {
    question: "Was ist ein KI-Telefonassistent?",
    answer:
      "Eine Software, die eingehende Anrufe selbst annimmt, in natürlicher Sprache mit dem Anrufer spricht und das Anliegen strukturiert erfasst. Sie beantwortet wiederkehrende Fragen nach Ihren Vorgaben und entscheidet nach Regeln, die Sie vorher festlegen, ob sie das Gespräch selbst bearbeitet, an einen Menschen übergibt oder als Rückrufwunsch notiert. Gebräuchlich sind für dieselbe Sache auch die Begriffe KI-Anrufassistent, AI-Telefonassistent, digitaler Telefonassistent, KI-Telefonservice oder KI-Telefonzentrale.",
  },
  {
    question: "Worin unterscheidet sich ein KI-Telefonassistent von Mailbox und Tastenmenü?",
    answer:
      "Die Mailbox nimmt auf, sie versteht nichts — jemand muss abhören, zurückrufen und von Hand übertragen. Ein Tastenmenü zwingt den Anrufer in Ihre Struktur; wer kein passendes Feld findet, legt auf. Der Assistent führt stattdessen ein Gespräch, ordnet das Anliegen selbst ein, auch wenn der Anrufer vom erwarteten Ablauf abweicht, und liefert am Ende ein lesbares Ergebnis.",
  },
  {
    question: "Kommen Anrufer mit der Stimme eines Sprachassistenten zurecht?",
    answer:
      "Nicht jeder Anrufer mag synthetische Stimmen — das nehmen wir ernst. Sie wählen die Stimme, formulieren Ihren Begrüßungssatz und legen fest, wie Ihr Betrieb am Telefon spricht. Anrufer erfahren im ersten Satz, dass ein KI-System spricht, und können jederzeit zu einem Menschen wechseln. In der Startphase werten wir Gespräche mit Ihnen aus und passen an, was nicht sitzt.",
  },
  {
    question: "Was ändert sich an meinem Telefonanschluss?",
    answer: `${FAKTEN.rufumleitung} Dasselbe gilt für Kalender und Branchensoftware: Welche Anbindung möglich ist, steht im Angebot — nicht in einer Zusage danach.`,
  },
  {
    question: "Was übernimmt der Assistent — und was bewusst nicht?",
    answer:
      "Er nimmt Terminwünsche, Absagen und Rückrufbitten auf, beantwortet wiederkehrende Fragen und erfasst Anliegen strukturiert. Fachliche Beratung gibt er grundsätzlich nicht. Dringende Anliegen und alles, was Sie festlegen, gehen sofort an einen Menschen. Diese Grenzen definieren Sie im Anliegen-Katalog — vor dem Start.",
  },
  {
    // Kanonische Fassung der Inhaber-Antwort vom 10.09.2026 (BOOKING_WRITE,
    // SMS_EMAIL_CONFIRMATION). Der Umfang steht in FAKTEN und wird hier nicht
    // neu formuliert — siehe OWNER-INPUT.md „Nachtrag 10.09.2026".
    question: "Bucht der Assistent Termine direkt in mein System — und verschickt er Bestätigungen?",
    answer: `${FAKTEN.terminaufnahme} ${FAKTEN.bestaetigungen}`,
  },
  {
    question: "Was passiert, wenn der Assistent ein Anliegen nicht versteht?",
    answer:
      "Dann versucht er nicht, es trotzdem zu lösen. Er fragt nach, und wenn das Anliegen weiterhin unklar bleibt oder außerhalb Ihres Anliegen-Katalogs liegt, erfasst er Name, Rückrufnummer und den Gesprächsinhalt und übergibt an Ihr Team. Wer ausdrücklich einen Menschen möchte, wird auf Wunsch weitergeleitet, sofern dort jemand erreichbar ist.",
  },
  {
    question: "Wie kommt das Gesprächsergebnis bei meinem Team an?",
    answer:
      "Jedes Gespräch endet in einer strukturierten Zusammenfassung: Anliegen, Rückrufnummer, gewünschter Termin, nächster Schritt. Ihr Team liest das Ergebnis dort, wo es ohnehin arbeitet — statt Sprachnachrichten abzuhören und von Hand zu übertragen.",
  },
  {
    question: "Worauf müssen Sie bei DSGVO und KI Telefonassistent achten?",
    answer:
      "Vier Punkte entscheiden, und Sie sollten sie bei jedem Anbieter abfragen: Wird das Gespräch aufgezeichnet und wie lange gespeichert. Werden Ihre Daten zum Training von Modellen verwendet. Gibt es einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO. Und erfährt der Anrufer, dass ein KI-System spricht. Bei uns: Gespräche werden nicht aufgezeichnet – gespeichert wird ausschließlich das strukturierte Ergebnis. Ihre Daten werden nicht zum Training von Modellen verwendet. Einen AVV nach Art. 28 DSGVO stellen wir jedem Kunden bereit. Und der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen.",
  },
  {
    question: "Was passiert bei einem technischen Ausfall?",
    // [[CLAIM: verify — Fallback-Mechanik (Weiterleitung auf Backup-Nummer / Ansage) technisch bestätigen]]
    answer:
      "Für den Störungsfall wird ein Fallback eingerichtet: Anrufe laufen dann auf eine von Ihnen benannte Nummer oder auf eine klare Ansage mit dem nächsten Schritt. Wie dieser Weg aussieht, legen wir gemeinsam bei der Einrichtung fest.",
  },
  {
    question: "Wie aufwändig ist die Einrichtung für mich?",
    answer: `Ihr Aufwand konzentriert sich auf das Aufnahmegespräch: Sie beschreiben Ihre Anrufe, wir bauen daraus Regeln und Ansagen. Konfiguration, Anbindung und Tests übernehmen wir. ${FAKTEN.uebergabeGarantie} ${FAKTEN.freigabeNachUebergabe}`,
  },
  {
    question: "Was kostet ein KI Telefonassistent?",
    answer: `Sie zahlen einen festen Monatsbetrag für ein Minutenkontingent. ${FAKTEN.deckelung} Einmalig kommt die Einrichtung dazu; sie steht vor Vertragsschluss im Angebot. Details finden Sie auf der Kostenseite.`,
  },
];

const PROBLEMS = [
  {
    icon: Phone,
    title: "Die Anrufe kommen gebündelt",
    desc: "Montagmorgen, Mittagszeit, nach Feiertagen: Die Flut an Anrufen trifft Ihr Team genau dann, wenn es ohnehin ausgelastet ist.",
  },
  {
    icon: Users,
    title: "Ständige Unterbrechungen erzeugen Fehler",
    desc: "Wer zwischen Tresen und Telefon hin- und herspringt, macht unter Druck Fehler: verhörte Nummern, doppelte Termine, vergessene Rückrufe.",
  },
  {
    icon: TrendingUp,
    title: "Unerreichbarkeit wird öffentlich bewertet",
    desc: "Wer mehrfach nicht durchkommt, versucht es oft woanders — und schreibt seine Erfahrung mit der Erreichbarkeit in die Online-Bewertung.",
  },
  {
    icon: Building2,
    title: "Anliegen ohne festen Weg bleiben liegen",
    desc: "Zettelnotizen und Mailbox-Nachrichten haben keinen verlässlichen Weg zu Ihrem Team. Was nicht erfasst wird, wird vergessen.",
  },
];

/**
 * Branchenbeispiele. Formulierungen bewusst ohne Schreibzugriff-Zusage
 * (BOOKING_WRITE): „aufnehmen", „erfassen", „übergeben" — nie „buchen" oder
 * „in den Kalender eintragen". Die vorherige Fassung sagte an drei Stellen
 * „buchen" und war damit eine universelle Zusage, die das Produkt nicht deckt.
 */
const USE_CASES = [
  {
    icon: Wrench,
    industry: "Handwerk & Bau",
    desc: "Terminanfragen und Störungsmeldungen aufnehmen, während Sie auf der Baustelle sind — mit Rückrufnummer und Dringlichkeit.",
  },
  {
    icon: Briefcase,
    industry: "Kanzleien & Dienstleister",
    desc: "Erstanfragen qualifizieren, Mandanten- und Kundendaten erfassen, Rückrufwünsche strukturiert weitergeben.",
  },
  {
    icon: Home,
    industry: "Immobilien & Hausverwaltung",
    desc: "Besichtigungs- und Exposé-Anfragen entgegennehmen, Schadensmeldungen erfassen — auch außerhalb der Bürozeiten.",
  },
  {
    icon: UtensilsCrossed,
    industry: "Gastronomie & Hotellerie",
    desc: "Reservierungs- und Buchungsanfragen aufnehmen, während der Service läuft, und an Ihr Team zur Bestätigung übergeben.",
  },
  {
    icon: Stethoscope,
    industry: "Praxen & Gesundheit",
    desc: "Terminwünsche, Absagen und Rezeptanfragen strukturiert aufnehmen — spürbare Entlastung für die Anmeldung zu Stoßzeiten.",
  },
  {
    icon: Building2,
    industry: "Agenturen & Beratung",
    desc: "Erstgespräche terminieren, Anliegen erfassen und an den richtigen Ansprechpartner weiterleiten.",
  },
];

export function KiTelefonassistentPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "KI Telefonassistent für Unternehmen",
        // Beschreibt ausschließlich, was universell zugesagt ist. Die frühere
        // Fassung sagte „Termine bucht" und behauptete damit im strukturierten
        // Datensatz genau den Schreibzugriff, den BOOKING_WRITE ausschließt.
        description:
          "KI Telefonassistent für Unternehmen: nimmt Anrufe an, beantwortet wiederkehrende Fragen nach Ihren Vorgaben und erfasst Anliegen und Terminwünsche strukturiert – auch außerhalb regulärer Geschäftszeiten.",
        serviceType: "KI-Telefonassistent",
        areaServed: { "@type": "Country", name: "Deutschland" },
        url: `${BUSINESS_INFO.website}/ki-telefonassistent`,
        provider: {
          "@type": "Organization",
          name: BUSINESS_INFO.name,
          url: BUSINESS_INFO.website,
        },
      },
      // FAQPage wird von PageSEO aus `faqItems` erzeugt und darf hier nicht
      // noch einmal stehen — sonst läge derselbe Block zweimal im Dokument.
      {
        "@type": "HowTo",
        "name": "So wird Ihr Empfang am Telefon gebaut – in 5 Schritten",
        "description": "So richtet Cogniiq den KI-Telefonassistenten für Ihren Betrieb ein – vom Aufnahmegespräch über den Anliegen-Katalog bis zur laufenden Anpassung.",
        "totalTime": "P14D",
        // No estimatedCost: the previous value of 0 EUR asserted a free setup that the page
        // does not state. Pricing is individual, so no figure may be published here.
        "step": EINRICHTUNG_SCHRITTE.map((s, i) => ({
          "@type": "HowToStep",
          "position": i + 1,
          "name": s.title,
          "text": s.description,
          "url": "https://cogniiq.de/ki-telefonassistent#einrichtung",
        })),
      },
    ],
  };

  return (
    <>
      <PageSEO
        title="KI Telefonassistent für Unternehmen – Anrufannahme | Cogniiq"
        description="KI Telefonassistent für Unternehmen: nimmt Anrufe an, beantwortet Fragen und erfasst Anliegen nach Ihren Regeln. Keine Gesprächsaufzeichnung, gedeckelte Rechnung."
        canonical={`${BUSINESS_INFO.website}/ki-telefonassistent`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={schema}
      />

      <main className="min-h-screen">
        {/*
          Reihenfolge als Kaufentscheidung gelesen, nicht als Modulliste:
          Verstehen → Problem → Lösung → Ablauf → Beweis der Übergabe →
          Grenzen → Kaufkriterien → Einrichtung → Betreuung → Preis → Ausstieg →
          Datenschutz → Branchen → offene Fragen → Abschluss.

          Entfernt gegenüber der Fassung vom 10.09.2026, weil doppelt oder
          praxisspezifisch: PatientenSicht (M20), TeamBlock (M21),
          FailurePatterns (M3 — steckt jetzt als „Warum das zählt" in der
          Anbieter-Checkliste), Säulen als eigener Abschnitt, der zweite
          CTA-Block und die Einwand-Karten (deckungsgleich mit der FAQ).
        */}
        <HeroSection />
        <CredentialStrip />
        <WasIstSection />
        <ProblemSection />
        <StimmprobeSection />          {/* M13 Stimmprobe (asset-gated) */}
        <SolutionSection />
        <CallFlowSection />
        <CallSummarySection />         {/* M14 Die Übergabe */}
        <AnliegenKatalogSection />     {/* M8 Anliegen-Katalog + M15 Grenzen */}
        <AnbieterCheckSection />       {/* Kaufkriterien — der eigenständige Beitrag */}
        <SetupSection />               {/* M17 Einrichtung */}
        <BetreuungSection />           {/* M18 Betreuung */}
        <PreisLogikSection />          {/* M10 Preis & Deckelung */}
        <UmkehrbarkeitSection />       {/* M19 Umkehrbarkeit */}
        <NichtPassendSection />        {/* M16 Wann wir nicht passen */}
        <DatenschutzTeaserSection />   {/* M7 Datenschutz kurz */}
        <UseCasesSection />
        <FAQSectionBlock />            {/* M11 FAQ */}
        <FinalCtaSection />            {/* M12 Nächster Schritt */}
        <InternalLinksSection />
      </main>
    </>
  );
}

/** Primärer Button. Eine Stelle, damit Beschriftung, Ziel und Messung nicht
 *  seitenweit auseinanderlaufen. */
function PrimaryCta({ className = "" }: { className?: string }) {
  return (
    <Link
      to={PRIMARY_CTA.to}
      onClick={() => trackEvent("cta_demo_click", PRIMARY_CTA.label)}
      className={`inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[15px] hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-lg ${className}`}
    >
      <Phone size={15} aria-hidden="true" />
      {PRIMARY_CTA.label}
    </Link>
  );
}

/** Sekundärer Weg, bewusst leiser und bewusst ein anderer Kanal: Wer ein
 *  Telefonprodukt kauft, will oft telefonieren statt ein Formular auszufüllen. */
function PhoneCta({ className = "" }: { className?: string }) {
  return (
    <a
      href={PHONE_HREF}
      onClick={() => trackEvent("cta_telefon_click", "Hero")}
      className={`inline-flex items-center justify-center gap-2.5 px-7 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[15px] hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900 ${className}`}
    >
      Oder anrufen: {BUSINESS_INFO.contact.phoneDisplay}
    </a>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] max-w-full bg-[radial-gradient(ellipse_at_top_right,_rgba(0,0,0,0.04)_0%,_transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.03)_0%,_transparent_65%)]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-16 items-start">
          <motion.div className="cq-rise">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm font-medium tracking-widest uppercase mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Für Betriebe mit hohem Telefonaufkommen
            </div>

            {/*
              Die H1 nennt den gesuchten Begriff zuerst und das Versprechen
              unmittelbar danach. Die vorherige Fassung begann mit „Erreichbar,
              wenn niemand abnehmen kann." und stellte den Begriff in den
              hellgrauen zweiten Teil — verständlich erst nach dem zweiten Satz.
            */}
            <h1 className="text-[2.5rem] sm:text-5xl lg:text-[3.4rem] font-bold text-gray-900 dark:text-gray-100 leading-[1.07] tracking-tight mb-6">
              KI-Telefonassistent für Unternehmen:{" "}
              <span className="text-gray-400 dark:text-gray-500 font-light">
                Anrufe annehmen, wenn Ihr Team keine Hand frei hat.
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 leading-[1.7] max-w-xl mb-3">
              Der Telefonassistent von Cogniiq nimmt Anrufe zu Stoßzeiten und
              außerhalb der Öffnungszeiten entgegen, spricht in natürlicher
              Sprache mit dem Anrufer, beantwortet wiederkehrende Fragen nach
              Ihren Vorgaben und erfasst jedes Anliegen strukturiert — mit
              Rückrufnummer und nächstem Schritt.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-10 max-w-lg leading-relaxed">
              Mit Ihrer Stimmauswahl, Ihren Gesprächsregeln und einer Übergabe,
              die wir vor der Unterschrift mit Ihnen klären.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <PrimaryCta />
              <PhoneCta />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-10">
              Sie schildern kurz Ihre Anrufe, wir schlagen einen Termin für die
              Demo vor. Kostenlos, unverbindlich, ca. 15&nbsp;Minuten.
            </p>

            <div className="flex flex-wrap gap-x-7 gap-y-2.5">
              {[
                "Keine Gesprächsaufzeichnung",
                `${FAKTEN.gleichzeitigeAnrufe} Anrufe gleichzeitig`,
                "Ihre Stimmauswahl, Ihre Regeln",
                "Festes Kontingent mit Obergrenze",
              ].map((item) => (
                <motion.div
                  key={item}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                >
                  <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" aria-hidden="true" />
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <HeroCallPanel />
        </div>
      </div>
    </section>
  );
}

/**
 * Das Gesprächsbeispiel im Hero.
 *
 * Die vorherige Fassung endete mit „Eingetragen. Sie erhalten eine Bestätigung
 * per E-Mail." und der Fußzeile „Termin automatisch gespeichert · Kalender
 * aktualisiert". Das waren zwei Zusagen auf einmal, die das Produkt nicht
 * universell hält: Schreibzugriff auf ein Kundensystem (BOOKING_WRITE) und eine
 * E-Mail-Bestätigung als Standardfunktion (SMS_EMAIL_CONFIRMATION). Ein Bild
 * behauptet dasselbe wie ein Satz, nur schneller.
 *
 * Die neue Fassung zeigt stattdessen das, was universell gilt und zugleich das
 * stärkste Argument ist: die Offenlegung nach Art. 50 im ersten Satz, ein
 * Gespräch in natürlicher Sprache, und ein Ergebnis, das beim Team landet.
 */
function HeroCallPanel() {
  const turns = [
    { role: "ai", text: "Guten Tag, hier ist der digitale Empfang. Ich bin ein KI-Assistent — wie kann ich helfen?" },
    { role: "customer", text: "Ich hätte gern einen Termin für eine Erstberatung." },
    { role: "ai", text: "Gerne. Würde Ihnen Dienstagvormittag passen?" },
    { role: "customer", text: "Ja, das passt gut." },
    { role: "ai", text: "Notiert: Erstberatung, Dienstagvormittag. Mein Kollege bestätigt Ihnen den Termin. Unter welcher Nummer sind Sie erreichbar?" },
  ];

  return (
    <motion.div className="cq-rise hidden lg:block">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900 overflow-hidden shadow-[0_2px_24px_rgba(0,0,0,0.07)] dark:shadow-[0_2px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
            Eingehender Anruf
          </span>
          <span className="ml-auto text-sm text-gray-400 dark:text-gray-500 font-mono">10:24</span>
        </div>

        <p className="px-5 pt-4 text-[13px] text-gray-500 dark:text-gray-500">
          Nachgestelltes Beispiel, kein echter Anruf.
        </p>

        <div className="p-5 pt-3 space-y-3">
          {turns.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[86%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                  msg.role === "ai"
                    ? "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700"
                    : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                }`}
              >
                {msg.role === "ai" && (
                  <span className="block text-sm font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-widest">
                    KI Assistent
                  </span>
                )}
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
          <div className="flex items-start gap-2">
            <FileText size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Ergebnis: Anliegen, Terminwunsch und Rückrufnummer — strukturiert
              für Ihr Team
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 px-1">
        <Lock size={11} className="text-gray-300 dark:text-gray-600 flex-shrink-0" aria-hidden="true" />
        <span className="text-sm text-gray-400 dark:text-gray-500">
          Keine Gesprächsaufzeichnung · AVV nach Art. 28 DSGVO
        </span>
      </div>
    </motion.div>
  );
}

function CredentialStrip() {
  const items = [
    { label: "Festes Minutenkontingent", detail: `Darüber ${FAKTEN.mehrpreisProMinute}/Min., gedeckelt auf die Obergrenze Ihres Tarifs` },
    { label: "Rufumleitung", detail: "Anrufe laufen auf die vereinbarte Nummer" },
    { label: "Strukturierte Übergabe", detail: "Anliegen landen bei Ihrem Team" },
    // „Europäische Server" ist eine Aussage zum Verarbeitungsort und damit
    // untersagt, solange die AVV mit den Infrastruktur-Anbietern nicht
    // unterzeichnet sind (Inhaber-Antwort B, ASSETS-REQUIRED §B2.2).
    { label: "Keine Gesprächsaufzeichnung", detail: "AVV nach Art. 28 DSGVO" },
    { label: "Erreichbar zu Stoßzeiten", detail: "Und außerhalb der Öffnungszeiten" },
  ];

  return (
    <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {item.label}
              </span>
              <span className="hidden sm:inline text-sm text-gray-400 dark:text-gray-500">
                · {item.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Definition und Abgrenzung.
 *
 * Die Seite erklärte den Begriff bisher nirgends — obwohl ein erheblicher Teil
 * der Suchenden ihn gerade erst zum ersten Mal gehört hat und die erste Frage
 * „was ist das und wie unterscheidet es sich von meiner Mailbox" lautet. Der
 * Abschnitt steht deshalb vor dem Problemabschnitt: Wer nicht weiß, was
 * gemeint ist, liest das Problem nicht als seines.
 */
function WasIstSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950" aria-labelledby="was-ist-heading">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-14 items-start">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
              Grundlagen
            </p>
            <h2
              id="was-ist-heading"
              className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-5"
            >
              {WAS_IST.headline}
            </h2>
            <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.75]">
              {WAS_IST.definition}
            </p>
          </motion.div>

          <motion.dl
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={fadeUp}
            className="space-y-3"
          >
            {WAS_IST.abgrenzungen.map((item) => (
              <div
                key={item.gegen}
                className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
              >
                <dt className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                  Unterschied zu: {item.gegen}
                </dt>
                <dd className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.text}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="max-w-2xl mb-14"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
            Das Problem
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
            Der Anruf kommt immer dann,
            <br className="hidden sm:block" /> wenn gerade niemand frei ist.
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-[1.7]">
            Am Tresen steht ein Kunde, am Telefon wartet der nächste. Egal wie Ihr
            Team entscheidet — einer von beiden verliert. Das kostet mehr als den
            einzelnen Anruf: unterbrochene Arbeit, Fehler unter Druck und Gespräche
            über verpasste Erreichbarkeit, die länger dauern als das Anliegen selbst.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROBLEMS.map((item) => (
            <motion.div
              key={item.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
              className="p-6 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4">
                <item.icon size={17} className="text-gray-400 dark:text-gray-500" aria-hidden="true" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-snug">
                {item.title}
              </h3>
              <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  const capabilities = [
    { icon: PhoneCall, label: "Nimmt Anrufe entgegen, wenn Ihr Team gebunden ist" },
    { icon: MessageSquare, label: "Beantwortet wiederkehrende Fragen nach Ihren Vorgaben" },
    { icon: Calendar, label: "Nimmt Terminwünsche nach Ihren Regeln auf" },
    { icon: CheckCircle2, label: "Erfasst Anliegen strukturiert – mit Rückrufnummer und nächstem Schritt" },
    { icon: Shield, label: "Leitet dringende Anrufe sofort an einen Menschen weiter" },
    { icon: Clock, label: "Erreichbar auch abends, am Wochenende und an Feiertagen" },
    { icon: Languages, label: "Spricht auf Wunsch weitere Sprachen – und wechselt sie mitten im Gespräch" },
  ];

  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
              Die Lösung
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-5">
              Ein Empfang am Telefon,
              <br className="hidden sm:block" /> der sich nach Ihrem Betrieb richtet.
            </h2>
            <div className="space-y-4 mb-8 max-w-lg">
              {GENERISCH_SAEULEN.map((saeule) => (
                <div key={saeule.title}>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {saeule.title}
                  </h3>
                  <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7]">
                    {saeule.description}
                  </p>
                </div>
              ))}
            </div>
            <PrimaryCta />
          </motion.div>

          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="space-y-2.5"
          >
            {capabilities.map((feat) => (
              <li
                key={feat.label}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
              >
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                  <feat.icon size={14} className="text-gray-400 dark:text-gray-400" aria-hidden="true" />
                </div>
                <span className="text-[17px] text-gray-700 dark:text-gray-300 leading-relaxed">
                  {feat.label}
                </span>
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}

function CallFlowSection() {
  const steps = [
    {
      number: "01",
      icon: PhoneCall,
      title: "Anruf eingehend",
      desc: "Der Assistent nimmt ab, wenn Ihr Team gebunden ist – auch in Stoßzeiten, abends oder am Wochenende. Der Anrufer erfährt im ersten Satz, dass ein KI-System spricht.",
      detail: "Kein Besetztzeichen, keine Warteschleife",
    },
    {
      number: "02",
      icon: MessageSquare,
      title: "Gespräch & Anliegen erfassen",
      desc: "Der Assistent erfragt das Anliegen in natürlicher Sprache und beantwortet wiederkehrende Fragen nach Ihren Vorgaben.",
      detail: "Auf Ihren Betrieb konfiguriert",
    },
    {
      number: "03",
      icon: Calendar,
      title: "Nach Ihren Regeln entscheiden",
      // Vorher: „Termin buchen oder weiterleiten … werden geprüft und
      // eingetragen." — das las sich als Schreibzugriff auf ein Kundensystem.
      desc: "Terminwünsche nimmt er im vereinbarten Rahmen auf oder legt sie Ihrem Team zur Bestätigung vor. Dringende und komplexe Anliegen gehen sofort an einen Menschen.",
      detail: "Ihre Regeln entscheiden",
    },
    {
      number: "04",
      icon: FileText,
      title: "Zusammenfassung & Übergabe",
      desc: "Jedes Gespräch endet in einer strukturierten Zusammenfassung: Anliegen, Rückrufnummer, nächster Schritt – lesbar dort, wo Ihr Team arbeitet.",
      detail: "Kein Abtippen, kein Zettel",
    },
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="max-w-2xl mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
            Ablauf
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15]">
            Was passiert, wenn ein Kunde anruft
          </h2>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-[28px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px border-t border-dashed border-gray-200 dark:border-gray-700" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step) => (
              <motion.div
                key={step.number}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={fadeUp}
                className="relative"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-white dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                    <step.icon size={20} className="text-gray-500 dark:text-gray-400" aria-hidden="true" />
                  </div>
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold tracking-[0.2em] text-gray-300 dark:text-gray-600 uppercase">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                  {step.desc}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 font-medium">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  {step.detail}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CallSummarySection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
              Nach jedem Gespräch
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-5">
              Die Übergabe entscheidet.
              <br className="hidden sm:block" /> Deshalb ist sie der Kern.
            </h2>
            <div className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mb-8 max-w-lg space-y-4">
              {GENERISCH_UEBERGABE.paragraphs.map((absatz, i) => (
                <p key={i}>{absatz}</p>
              ))}
            </div>
            <ul className="space-y-3">
              {GENERISCH_UEBERGABE.wasAnkommt.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[17px] text-gray-600 dark:text-gray-400">
                  <span className="mt-[10px] w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
                <div className="flex items-center gap-2.5">
                  <FileText size={14} className="text-gray-400" aria-hidden="true" />
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide uppercase">
                    Beispiel eines Dashboard-Eintrags
                  </span>
                </div>
                <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">
                  Heute · 18:47
                </span>
              </div>

              <p className="px-5 pt-4 text-[13px] text-gray-500 dark:text-gray-500 leading-[1.5]">
                Nachgestelltes Beispiel, kein echter Anruf.
              </p>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest mb-1">
                      Anrufer
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      M. Berger
                    </p>
                  </div>
                  <div className="px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest mb-1">
                      Dauer
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      2 Min 14 Sek
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest mb-1.5">
                    Anliegen
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Erstberatung zur Automatisierung der Telefonie. Interessiert an Terminbuchungslösung.
                  </p>
                </div>

                <div className="px-3.5 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40">
                  <p className="text-sm text-emerald-600 dark:text-emerald-500 font-semibold uppercase tracking-widest mb-1">
                    Terminwunsch
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Di., 18. März · 10:30&nbsp;Uhr · Beratungsgespräch
                  </p>
                </div>

                <div className="px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest mb-1.5">
                    Nächster Schritt
                  </p>
                  <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    Unterlagen zur Telefonassistenz vorbereiten · Termin bestätigen
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 flex items-center gap-2">
                <Users size={13} className="text-gray-400" aria-hidden="true" />
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Eintrag im Dashboard · von Ihrem Team zu bestätigen
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** Gemeinsame Stile der Textabschnitte. */
function KettenStile() {
  const PROSE = "text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7]";
  const H2C = "text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6";
  const CARD =
    "p-7 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800";
  const DOT =
    "mt-[10px] w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0";
  const TEXT_LINK =
    "inline-flex items-center gap-2 min-h-[44px] py-3 text-[16px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors";

  return { PROSE, H2C, CARD, DOT, TEXT_LINK };
}

/**
 * Anliegen-Katalog und Grenzen in EINEM Abschnitt.
 *
 * Vorher standen „Was der Assistent übernimmt / was immer ein Mensch macht"
 * (M8) und „Was unser Empfang nicht macht" (M15) als zwei Abschnitte
 * untereinander und sagten dreimal dasselbe. Zusammengelegt ist die Aussage
 * stärker: erst die Aufteilung, dann die harten Grenzen darunter.
 */
function AnliegenKatalogSection() {
  const { PROSE, DOT } = KettenStile();

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/40" aria-labelledby="anliegen-heading">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="max-w-2xl mb-12"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
            Anliegen-Katalog
          </p>
          <h2
            id="anliegen-heading"
            className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4"
          >
            Was der Assistent übernimmt –
            <br className="hidden sm:block" /> und was immer ein Mensch macht
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-[1.7]">
            Für jeden Anrufanlass legen Sie vor dem Start fest, was passiert.
            Diese Grenzen offen zu benennen, schafft mehr Vertrauen als jedes
            Leistungsversprechen.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-14">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={fadeUp}
            className="p-7 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Übernimmt der Assistent
            </h3>
            <ul className="space-y-3">
              {GENERISCH_UEBERNIMMT.map((item) => (
                <li key={item} className={`flex items-start gap-2.5 ${PROSE}`}>
                  <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-1.5" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={fadeUp}
            className="p-7 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Geht immer an einen Menschen
            </h3>
            <ul className="space-y-3">
              {GENERISCH_IMMER_MENSCH.map((item) => (
                <li key={item} className={`flex items-start gap-2.5 ${PROSE}`}>
                  <Users size={13} className="text-gray-400 flex-shrink-0 mt-1.5" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          variants={fadeUp}
          className="max-w-3xl"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-3">
            {GENERISCH_GRENZEN.headline}
          </h3>
          <p className={`${PROSE} mb-6`}>{GENERISCH_GRENZEN.intro}</p>
          <ul className="space-y-4">
            {GENERISCH_GRENZEN.points.map((point) => (
              <li key={point} className={`flex items-start gap-3 ${PROSE}`}>
                <span className={DOT} />
                {point}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Kaufkriterien — der Abschnitt, der diese Seite von einer Anbieterseite
 * unterscheidet.
 *
 * Die generische SERP zu „KI Telefonassistent" besteht aus Produktseiten, die
 * alle dasselbe behaupten („bucht Termine", „CRM-Integration", „DSGVO-konform"),
 * und aus Anbieterlisten, die diese Behauptungen nebeneinanderstellen, ohne sie
 * zu prüfen. Was fehlt, ist die Ebene dazwischen: woran ein Käufer erkennt, ob
 * eine solche Behauptung trägt.
 *
 * Genau das steht hier — mit der eigenen Antwort daneben, damit der Abschnitt
 * nicht neutral tut, was er nicht ist. Die Begründungsspalte ist zugleich die
 * ehemalige Sektion „Warum bisherige Versuche gescheitert sind": Jedes
 * Kriterium IST ein reales Scheiternsmuster.
 *
 * Bewusst KEIN Vergleich mit benannten Wettbewerbern (§ 2.3 UWG) und bewusst
 * keine eigene Vergleichsseite — die Intention „KI Telefonassistent Vergleich"
 * wird laut Scoreboard absichtlich nicht verfolgt.
 */
function AnbieterCheckSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950" aria-labelledby="auswahl-heading">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="max-w-2xl mb-12"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
            Auswahlhilfe
          </p>
          <h2
            id="auswahl-heading"
            className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4"
          >
            Sechs Fragen, an denen sich ein
            <br className="hidden sm:block" /> KI-Telefonassistent entscheidet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-[1.7]">
            Fast jeder Anbieter verspricht dasselbe. Diese sechs Fragen trennen
            das Versprechen von der Umsetzung — stellen Sie sie jedem Anbieter,
            uns eingeschlossen. Unsere Antworten stehen daneben.
          </p>
        </motion.div>

        <ol className="space-y-4">
          {ANBIETER_CHECKLISTE.map((item, i) => (
            <motion.li
              key={item.frage}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <div className="p-7">
                <div className="flex items-start gap-4">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 flex-1">
                    <div>
                      <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 leading-snug mb-2.5">
                        {item.frage}
                      </h3>
                      <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7]">
                        {item.warum}
                      </p>
                    </div>
                    <div className="lg:border-l lg:border-gray-200 lg:dark:border-gray-800 lg:pl-10">
                      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-2.5">
                        Unsere Antwort
                      </p>
                      <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7]">
                        {item.cogniiq}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SetupSection() {
  return (
    <section id="einrichtung" className="py-24 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-start">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
              Implementierung
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
              So wird Ihr Empfang
              <br className="hidden sm:block" /> am Telefon gebaut.
            </h2>
            <p className="text-[17px] text-gray-500 dark:text-gray-400 leading-[1.7] max-w-md">
              Individuell heißt bei uns nicht Adjektiv, sondern Ablauf: Sie
              beschreiben Ihre Anrufe, wir bauen daraus Regeln, Ansagen und die
              Übergabe. Vor dem Start hören Sie das Ergebnis selbst.
            </p>
            <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] max-w-md mt-4 p-5 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
              {FAKTEN.uebergabeGarantie} {FAKTEN.freigabeNachUebergabe}
            </p>
            {/*
              Kontextueller Verweis auf den Einführungsleitfaden. Er steht hier,
              weil genau an dieser Stelle die Frage aufkommt, die diese Seite
              nicht beantwortet: nicht „was wird gebaut", sondern „was muss der
              Betrieb dafür entscheiden und prüfen".
            */}
            <p className="text-[17px] text-gray-500 dark:text-gray-400 leading-[1.7] max-w-md mt-4">
              Was auf Ihrer Seite dazugehört — welche Anrufanlässe überhaupt in
              Frage kommen, was vor dem Go-live geprüft gehört und wer freigibt —
              steht im{" "}
              <Link
                to="/ki-telefonassistent-einfuehren"
                className="underline underline-offset-4 hover:no-underline text-gray-700 dark:text-gray-300"
              >
                Leitfaden zur Einführung eines KI-Telefonassistenten
              </Link>
              .
            </p>
          </motion.div>

          <ol className="space-y-3">
            {EINRICHTUNG_SCHRITTE.map((phase, i) => (
              <motion.li
                key={phase.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-20px" }}
                variants={fadeUp}
                className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{i + 1}</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{phase.title}</h3>
                  <p className="text-[17px] text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{phase.description}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function BetreuungSection() {
  const { PROSE, H2C, CARD } = KettenStile();
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <h2 className={H2C}>{BETREUUNG.headline}</h2>
        <p className={`${PROSE} mb-8`}>{BETREUUNG.text}</p>
        <div className={CARD}>
          <p className="text-[19px] font-semibold text-gray-900 dark:text-gray-100">
            {BETREUUNG.person.name}
          </p>
          <p className="text-[15px] text-gray-500 dark:text-gray-500 mb-6">
            {BETREUUNG.person.rolle}
          </p>
          <dl className="space-y-4">
            {BETREUUNG.fakten.map((fakt) => (
              <div key={fakt.label}>
                <dt className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">
                  {fakt.label}
                </dt>
                <dd className={PROSE}>{fakt.wert}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function PreisLogikSection() {
  const { PROSE, H2C, TEXT_LINK } = KettenStile();
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <h2 className={H2C}>{GENERISCH_DECKELUNG.headline}</h2>
        <p className={`${PROSE} mb-4`}>{GENERISCH_DECKELUNG.text}</p>
        <p className={`${PROSE} mb-4`}>{GENERISCH_DECKELUNG.tarifwechsel}</p>
        <p className={PROSE}>{GENERISCH_DECKELUNG.preisgarantie}</p>
        <Link
          to="/kosten-ki-telefonassistent"
          onClick={() => trackEvent("cta_kosten_click", "Preislogik")}
          className={TEXT_LINK}
        >
          Alle Preisangaben im Detail
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function UmkehrbarkeitSection() {
  const { PROSE, H2C, CARD } = KettenStile();
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <h2 className={H2C}>{UMKEHRBARKEIT.headline}</h2>
        <dl className="space-y-5 mb-8">
          {UMKEHRBARKEIT.fakten.map((fakt) => (
            <div key={fakt.label} className={CARD}>
              <dt className="text-[15px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {fakt.label}
              </dt>
              <dd className={PROSE}>{fakt.wert}</dd>
            </div>
          ))}
        </dl>
        <p className={PROSE}>{UMKEHRBARKEIT.vetorecht}</p>
      </div>
    </section>
  );
}

function NichtPassendSection() {
  const { PROSE, DOT } = KettenStile();
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
          Ehrliche Beratung
        </p>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-4">
          {GENERISCH_NICHT_PASSEND.headline}
        </h2>
        <p className={`${PROSE} mb-6`}>{GENERISCH_NICHT_PASSEND.intro}</p>
        <ul className="space-y-3">
          {GENERISCH_NICHT_PASSEND.points.map((point) => (
            <li key={point} className={`flex items-start gap-3 ${PROSE}`}>
              <span className={DOT} />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DatenschutzTeaserSection() {
  const { PROSE, H2C, DOT, TEXT_LINK } = KettenStile();
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <h2 className={H2C}>Was Ihr Datenschutzbeauftragter wissen will</h2>
        <ul className="space-y-5">
          {GENERISCH_DATENSCHUTZ_PUNKTE.map((punkt) => (
            <li key={punkt} className={`flex items-start gap-3 ${PROSE}`}>
              <span className={DOT} />
              {punkt}
            </li>
          ))}
        </ul>
        <Link to="/datenschutz-sicherheit" className={TEXT_LINK}>
          Datenschutz und Sicherheit im Detail
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="max-w-2xl mb-14"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
            Anwendungsbereiche
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15]">
            Eingesetzt in Branchen mit
            <br className="hidden sm:block" /> hohem Telefonaufkommen
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.map((item) => (
            <motion.div
              key={item.industry}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon size={17} className="text-gray-400 dark:text-gray-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                  {item.industry}
                </h3>
                <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSectionBlock() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="mb-12"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
            FAQ
          </p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15]">
            Häufige Fragen zum KI-Telefonassistenten
          </h2>
        </motion.div>

        <div className="space-y-2">
          {faqItems.map((item, i) => (
            <motion.div
              key={item.question}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-xl overflow-hidden"
            >
              <h3>
                <button
                  type="button"
                  aria-expanded={open === i}
                  aria-controls={`faq-panel-${i}`}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-[17px] font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100/70 dark:hover:bg-gray-800/80 transition-colors duration-150"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                      open === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </h3>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    id={`faq-panel-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-0">
                      <div className="w-full h-px bg-gray-200 dark:bg-gray-700/60 mb-4" />
                      <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7]">
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InternalLinksSection() {
  const cols = [
    {
      heading: "Nach Branche",
      links: [
        { label: "KI Telefonassistent für Arztpraxen", href: "/ki-telefonassistent-arzt" },
        { label: "KI Telefonassistent für Restaurants", href: "/ki-telefonassistent-restaurant" },
        { label: "KI Telefonassistent für Hotels", href: "/ki-telefonassistent-hotel" },
        { label: "Telefonassistent für medizinische Praxen", href: "/ki-telefonassistent-praxis" },
      ],
    },
    {
      heading: "Nach Region",
      links: [
        { label: "KI Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
        { label: "KI Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
        { label: "KI Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
        { label: "KI Telefonassistent in Bayern", href: "/bayern/ki-telefonassistent" },
      ],
    },
    {
      heading: "Verwandte Themen",
      links: [
        { label: "Was ein KI Telefonassistent kostet", href: "/kosten-ki-telefonassistent" },
        { label: "Anbindung an bestehende Systeme", href: "/integrationen" },
        { label: "Was verpasste Anrufe kosten", href: "/verpasste-anrufe-verlust" },
        { label: "Automatisierung für Unternehmen", href: "/automatisierung-unternehmen" },
      ],
    },
  ];

  return (
    <section className="py-14 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Eine h2 für den Abschnitt, die Spaltenlabels darunter als h3 — drei
            gleichrangige h2 am Seitenende („Nach Branche", „Nach Region",
            „Verwandte Themen") hätten die Gliederung mit Navigationslabels
            beendet statt mit Inhalt. */}
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-7">
          Weiterführende Seiten
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {cols.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-3">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
                    >
                      <ArrowRight
                        size={11}
                        aria-hidden="true"
                        className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors flex-shrink-0"
                      />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="py-28 bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <div className="relative rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 px-8 sm:px-10 lg:px-14 py-14 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.03)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_60%)] pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl lg:text-[2.25rem] font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
                Gehen wir Ihre Anrufe
                <br className="hidden sm:block" /> gemeinsam durch.
              </h2>
              <p className="text-[17px] text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-8 leading-[1.7]">
                In einer kurzen Demo hören Sie, wie der Assistent Anrufe
                entgegennimmt, und wir skizzieren Ihren Empfang am Telefon — mit
                Ihren Anrufanlässen, Ihren Regeln und Ihrer Übergabe. Danach
                entscheiden Sie in Ruhe.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <PrimaryCta />
                <Link
                  to="/kontakt"
                  onClick={() => trackEvent("cta_kontakt_click", "Abschluss")}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[15px] hover:border-gray-400 transition-all duration-200"
                >
                  Frage stellen
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400 dark:text-gray-500 mb-6">
                <span className="inline-flex items-center gap-1.5">
                  <ListChecks size={12} aria-hidden="true" /> Ca. 15&nbsp;Minuten
                </span>
                <span>Kostenlos</span>
                <span>Unverbindlich</span>
                <span>Keine Vorkenntnisse nötig</span>
              </div>

              <p className="text-sm text-gray-400 dark:text-gray-500">
                {BUSINESS_INFO.name} · {BUSINESS_INFO.contact.email} ·{" "}
                <a
                  href={PHONE_HREF}
                  onClick={() => trackEvent("cta_telefon_click", "Abschluss")}
                  className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {BUSINESS_INFO.contact.phoneDisplay}
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
