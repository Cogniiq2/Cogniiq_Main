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
  Chrome as Home,
  Briefcase,
  PhoneCall,
  MessageSquare,
  CheckCheck,
  ChevronDown,
  Lock,
  RotateCcw,
  SlidersHorizontal,
  BellRing,
  FileText,
  GitMerge,
} from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";
import {
  ANLIEGEN_IMMER_MENSCH,
  ANLIEGEN_UEBERNIMMT,
  BETREUUNG,
  DATENSCHUTZ_PUNKTE,
  DECKELUNG,
  EINRICHTUNG_SCHRITTE,
  FAKTEN,
  SAEULEN,
  UEBERGABE,
  UMKEHRBARKEIT,
  GRENZEN,
  NICHT_PASSEND,
  PATIENTEN_SICHT,
  SCHEITERN_INTRO,
  SCHEITERN_MUSTER,
  TEAM_BLOCK,
} from "@/lib/telefonassistent-copy";
import { StimmprobeSection } from "@/components/StimmprobeSection";

/**
 * Bewegung nach COPY-BRIEF-3 §1.4: höchstens 180 ms, `ease-out`, ausschließlich
 * Deckkraft und kleine Verschiebung. Keine gestaffelten Scroll-Sequenzen — die
 * frühere Fassung verzögerte jedes Element um `i * 0.06`, was bei sechs Karten
 * eine halbe Sekunde Nachlauf ergab. Das ist genau die Scroll-Choreografie, die
 * §1.4 untersagt.
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

const faqItems = [
  {
    question: "Kommen Anrufer mit der Stimme eines Sprachassistenten zurecht?",
    answer:
      "Nicht jeder Anrufer mag synthetische Stimmen — das nehmen wir ernst. Sie wählen die Stimme, formulieren Ihren Begrüßungssatz und legen fest, wie Ihr Betrieb am Telefon spricht. Anrufer erfahren im ersten Satz, dass ein KI-System spricht, und können jederzeit zu einem Menschen wechseln. In der Startphase werten wir Gespräche mit Ihnen aus und passen an, was nicht sitzt.",
  },
  {
    question: "Was ändert sich an meinem Telefonanschluss?",
    answer:
      `${FAKTEN.rufumleitung} Dasselbe gilt für Kalender und Praxissystem: Welche Anbindung möglich ist, steht im Angebot — nicht in einer Zusage danach.`,
  },
  {
    question: "Was übernimmt der Assistent — und was bewusst nicht?",
    answer:
      "Er nimmt Terminwünsche, Stornierungen und Rückrufbitten auf, beantwortet wiederkehrende Fragen und erfasst Anliegen strukturiert. Medizinische oder fachliche Beratung gibt er grundsätzlich nicht. Dringende Anliegen und alles, was Sie festlegen, gehen sofort an einen Menschen. Diese Grenzen definieren Sie im Anliegen-Katalog — vor dem Start.",
  },
  {
    question: "Wie kommt das Gesprächsergebnis bei meinem Team an?",
    answer:
      "Jedes Gespräch endet in einer strukturierten Zusammenfassung: Anliegen, Rückrufnummer, gewünschter Termin, nächster Schritt. Ihr Team liest das Ergebnis dort, wo es ohnehin arbeitet — statt Sprachnachrichten abzuhören und von Hand zu übertragen.",
  },
  {
    question: "Worauf müssen Sie bei DSGVO und KI Telefonassistent achten?",
    answer:
      "Vier Punkte entscheiden, und Sie sollten sie bei jedem Anbieter abfragen: Wird das Gespräch aufgezeichnet und wie lange gespeichert. Werden Ihre Daten zum Training von Modellen verwendet. Gibt es einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO. Und wie wird die Schweigepflicht nach § 203 StGB vertraglich abgebildet. Bei uns: Gespräche werden nicht aufgezeichnet – gespeichert wird ausschließlich das strukturierte Ergebnis. Ihre Daten werden nicht zum Training von Modellen verwendet. Einen AVV nach Art. 28 DSGVO stellen wir jedem Kunden bereit. Cogniiq und alle Mitarbeitenden werden vertraglich auf das Berufsgeheimnis nach § 203 StGB verpflichtet. Der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen. Ob Ihre Praxis eine Datenschutz-Folgenabschätzung benötigt, entscheidet Ihr Datenschutzbeauftragter – wir liefern die Unterlagen dafür zu.",
  },
  {
    question: "Was passiert bei einem technischen Ausfall?",
    // [[CLAIM: verify — Fallback-Mechanik (Weiterleitung auf Backup-Nummer / Ansage) technisch bestätigen]]
    answer:
      "Für den Störungsfall wird ein Fallback eingerichtet: Anrufe laufen dann auf eine von Ihnen benannte Nummer oder auf eine klare Ansage mit dem nächsten Schritt. Wie dieser Weg aussieht, legen wir gemeinsam bei der Einrichtung fest.",
  },
  {
    question: "Was kostet der KI Telefonassistent?",
    answer:
      `Sie zahlen einen festen Monatsbetrag für ein Minutenkontingent. ${FAKTEN.deckelung} ${FAKTEN.nichtProBehandler} Einmalig kommt die Einrichtung dazu; sie steht vor Vertragsschluss im Angebot. Details finden Sie auf der Kostenseite.`,
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

const USE_CASES = [
  {
    icon: Wrench,
    industry: "Handwerk & Bau",
    desc: "Terminanfragen entgegennehmen und in den Kalender buchen – auch wenn Sie auf der Baustelle sind.",
  },
  {
    icon: Stethoscope,
    industry: "Arztpraxen",
    desc: "Terminwünsche, Stornierungen und Rezeptbestellungen strukturiert aufnehmen – spürbare Entlastung für die Anmeldung zu Stoßzeiten.",
  },
  {
    icon: Briefcase,
    industry: "Dienstleister",
    desc: "Erstanfragen qualifizieren, Kundendaten erfassen und Rückrufe automatisch einplanen.",
  },
  {
    icon: Home,
    industry: "Immobilien",
    desc: "Besichtigungstermine buchen und Exposé-Anfragen entgegennehmen – auch außerhalb der Bürozeiten.",
  },
  {
    icon: Building2,
    industry: "Agenturen & Beratung",
    desc: "Erstgespräche terminieren, Anliegen erfassen und an den richtigen Ansprechpartner weiterleiten.",
  },
];

const OBJECTIONS = [
  {
    icon: MessageSquare,
    q: "Kommen meine Kunden mit der Stimme klar?",
    a: "Manche Anrufer sind skeptisch gegenüber synthetischen Stimmen — das ist berechtigt. Deshalb wählen Sie die Stimme, formulieren Ihren Begrüßungssatz und legen die Formulierungen fest. Wer lieber mit einem Menschen spricht, wird jederzeit weitergeleitet.",
  },
  {
    icon: GitMerge,
    q: "Was passiert bei komplexen Anfragen?",
    a: "Der Assistent erfasst das Anliegen strukturiert und übergibt es an Ihr Team – mit Rückrufnummer, Kontext und nächstem Schritt. Er versucht nicht, Fälle zu lösen, die in menschliche Hände gehören.",
  },
  {
    icon: Calendar,
    q: "Kann er Termine buchen?",
    a: "Ja, nach Ihren Regeln: Er prüft Ihren Kalender und trägt Termine direkt ein oder legt sie zur Bestätigung vor – kompatibel mit Google Calendar, Outlook und weiteren Systemen.",
  },
  {
    icon: BellRing,
    q: "Was ist bei dringenden Anrufen?",
    a: "Dringende Anliegen erkennt der Assistent an klaren Signalwörtern und leitet sofort weiter – an Ihr Team, den Bereitschaftsdienst oder mit der Ansage, den Notruf 112 zu wählen. Er bewertet niemals selbst, wie ernst ein Anliegen ist.",
  },
  {
    icon: SlidersHorizontal,
    q: "Wie aufwändig ist die Einrichtung für mich?",
    a: "Ihr Aufwand konzentriert sich auf das Aufnahmegespräch: Sie beschreiben Ihre Anrufe, wir bauen daraus Regeln und Ansagen. Konfiguration, Anbindung und Tests übernehmen wir – Sie hören das Ergebnis vor dem Start.",
  },
  {
    icon: RotateCcw,
    q: "Wer passt das System später an?",
    a: "Öffnungszeiten, Urlaubsansagen und aktuelle Hinweise ändern Sie selbst über ein Dashboard. Für Änderungen an Gesprächslogik und Regeln haben Sie einen festen Ansprechpartner – kein anonymes Ticketsystem.",
  },
];

export function KiTelefonassistentPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "KI Telefonassistent für Unternehmen",
        description:
          "Automatischer KI Telefonassistent der Anrufe beantwortet, Fragen klärt und Termine bucht – auch außerhalb regulärer Geschäftszeiten.",
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
        title="KI Telefonassistent – individuell konfiguriert | Cogniiq"
        description="KI Telefonassistent mit Ihrer Stimmauswahl, Ihren Regeln und strukturierter Übergabe an Ihr Team. Festes Minutenkontingent mit Obergrenze, keine Gesprächsaufzeichnung."
        canonical={`${BUSINESS_INFO.website}/ki-telefonassistent`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={schema}
      />

      <main className="min-h-screen">
        {/* Beweiskette nach COPY-BRIEF-3 §2, Referenz ist /praxen.
            M13 bleibt asset-gated, M22 existiert nicht. */}
        <HeroSection />                {/* 1 · M1 Wiedererkennung */}
        <CredentialStrip />
        <ProblemSection />             {/* 2 · M2 Was es kostet */}
        <PatientenSichtSection />      {/* 3 · M20 Patientensicht */}
        <FailurePatternsSection />     {/* 4 · M3 Warum es scheiterte */}
        <StimmprobeSection />          {/* 5 · M13 Stimmprobe (asset-gated) */}
        <SaeulenSection />             {/* 6 · M4 Die vier Säulen */}
        <SolutionSection />
        <CallFlowSection />
        <CallSummarySection />         {/* 7 · M14 Die Übergabe */}
        <AnliegenKatalogSection />     {/* 8 · M8 Anliegen-Katalog */}
        <GrenzenSection />             {/* 9 · M15 Grenzen — vor dem Preis */}
        <TeamSection />                {/* 10 · M21 Für Ihr Team */}
        <SetupSection />               {/* 11 · M17 Einrichtung */}
        <BetreuungSection />           {/* 12 · M18 Betreuung */}
        <PreisLogikSection />          {/* 13 · M10 Preis & Deckelung */}
        <UmkehrbarkeitSection />       {/* 14 · M19 Umkehrbarkeit */}
        <NichtPassendSection />        {/* 15 · M16 Wann wir nicht passen */}
        <DatenschutzTeaserSection />   {/* 16 · M7 Datenschutz kurz */}
        <ObjectionsSection />
        <UseCasesSection />
        <DemoCtaSection />
        <FAQSectionBlock />            {/* 17 · M11 FAQ */}
        <FinalCtaSection />            {/* 18 · M12 Nächster Schritt */}
        <InternalLinksSection />
      </main>
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-28 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(ellipse_at_top_right,_rgba(0,0,0,0.04)_0%,_transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.03)_0%,_transparent_65%)]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.02)_0%,_transparent_70%)]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-16 items-start">
          <motion.div className="cq-rise">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm font-medium tracking-widest uppercase mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              KI Telefonservice · Mittelstand Deutschland
            </div>

            <h1 className="text-[2.75rem] sm:text-5xl lg:text-[3.5rem] font-bold text-gray-900 dark:text-gray-100 leading-[1.06] tracking-tight mb-6">
              Erreichbar, wenn niemand
              <br />
              abnehmen kann.{" "}
              <span className="text-gray-400 dark:text-gray-500 font-light">
                Ein KI Telefonassistent, zugeschnitten auf Ihren Betrieb.
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 leading-[1.7] max-w-xl mb-3">
              Das Telefon klingelt, während vor Ihnen ein Kunde steht. Für diesen
              Moment ist der Telefonassistent von Cogniiq gebaut: Er nimmt Anrufe
              zu Stoßzeiten und außerhalb der Öffnungszeiten entgegen, erfasst
              Anliegen strukturiert und übergibt sie dorthin, wo Ihr Team arbeitet.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-10 max-w-lg leading-relaxed">
              Mit Ihrer Stimmauswahl, Ihren Regeln und einer Übergabe, die wir vor
              der Unterschrift mit Ihnen klären.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link
                to="/ki-telefonassistent/demo"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-lg"
              >
                <Phone size={15} />
                Kostenlose Demo ansehen
              </Link>
              <Link
                to="/kontakt"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Unverbindliches Erstgespräch vereinbaren
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-7 gap-y-2.5">
              {[
                "Keine Gesprächsaufzeichnung",
                "Zehn Anrufe gleichzeitig",
                "Ihre Stimmauswahl, Ihre Regeln",
                "Festes Kontingent mit Obergrenze",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                >
                  <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="cq-rise hidden lg:block">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900 overflow-hidden shadow-[0_2px_24px_rgba(0,0,0,0.07)] dark:shadow-[0_2px_24px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
                  Eingehender Anruf
                </span>
                <span className="ml-auto text-sm text-gray-400 dark:text-gray-500 font-mono">
                  10:24
                </span>
              </div>

              <div className="p-5 space-y-3">
                {[
                  { role: "customer", text: "Guten Tag, ich möchte einen Termin vereinbaren." },
                  { role: "ai", text: "Gerne – für welchen Service planen Sie den Termin?" },
                  { role: "customer", text: "Eine Erstberatung." },
                  { role: "ai", text: "Ich habe Dienstag, 10:30 Uhr frei. Passt Ihnen das?" },
                  { role: "customer", text: "Ja, das passt sehr gut." },
                  { role: "ai", text: "Eingetragen. Sie erhalten eine Bestätigung per E-Mail." },
                ].map((msg, i) => (
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
                <div className="flex items-center gap-2">
                  <CheckCheck size={13} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Termin automatisch gespeichert · Kalender aktualisiert
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 px-1">
              <Lock size={11} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
              <span className="text-sm text-gray-400 dark:text-gray-500">
                Keine Gesprächsaufzeichnung · AVV nach Art. 28 DSGVO
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
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
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
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

function ProblemSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="max-w-2xl mb-6"
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

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 mb-14"
        >
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">39&nbsp;%</span>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            der Versicherten bewerten die Erreichbarkeit von Praxen außerhalb der
            Öffnungszeiten als schwierig.
            <span className="block text-sm text-gray-400 dark:text-gray-500 mt-1">
              Quelle: GKV-Spitzenverband, Versichertenbefragung 2025
            </span>
          </span>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROBLEMS.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
              className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 group hover:border-gray-200 dark:hover:border-gray-700 transition-colors duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-colors duration-300">
                <item.icon size={17} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-snug">
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

function FailurePatternsSection() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="max-w-2xl mb-12"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
            Ehrlich betrachtet
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
            Warum bisherige Versuche
            <br className="hidden sm:block" /> oft gescheitert sind
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-[1.7]">{SCHEITERN_INTRO}</p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5">
          {SCHEITERN_MUSTER.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              className="p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5 leading-snug">
                {item.title}
              </h3>
              <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnliegenKatalogSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
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
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
            Was der Assistent übernimmt –
            <br className="hidden sm:block" /> und was immer ein Mensch macht
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-[1.7]">
            Für jeden Anrufanlass legen Sie vor dem Start fest, was passiert.
            Diese Grenzen offen zu benennen, schafft mehr Vertrauen als jedes
            Leistungsversprechen.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={fadeUp}
            className="p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Übernimmt der Assistent
            </h3>
            <ul className="space-y-3">
              {ANLIEGEN_UEBERNIMMT.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
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
            className="p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Geht immer an einen Menschen
            </h3>
            <ul className="space-y-3">
              {ANLIEGEN_IMMER_MENSCH.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  <Users size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PatientenSichtSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
          Die andere Seite der Leitung
        </p>
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-6">
          {PATIENTEN_SICHT.headline}
        </h2>
        {PATIENTEN_SICHT.paragraphs.map((p, i) => (
          <p key={i} className="text-gray-500 dark:text-gray-400 leading-[1.75] mb-4">
            {p}
          </p>
        ))}
        <div className="mt-6 inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {PATIENTEN_SICHT.stat.value}
          </span>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            {PATIENTEN_SICHT.stat.text}
            <span className="block text-sm text-gray-400 dark:text-gray-500 mt-1">
              Quelle: {PATIENTEN_SICHT.stat.source}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

function GrenzenSection() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/40" aria-labelledby="grenzen-heading">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
          Klare Grenzen
        </p>
        <h2
          id="grenzen-heading"
          className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4"
        >
          {GRENZEN.headline}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 leading-[1.7] mb-8">{GRENZEN.intro}</p>
        <ul className="space-y-4">
          {GRENZEN.points.map((point, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed"
            >
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TeamSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
              Für Ihr Praxisteam
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-5">
              {TEAM_BLOCK.headline}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-[1.7]">{TEAM_BLOCK.text}</p>
          </div>
          <ul className="space-y-3">
            {TEAM_BLOCK.points.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed"
              >
                <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function NichtPassendSection() {
  return (
    <section className="py-20 bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
          Ehrliche Beratung
        </p>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-4">
          {NICHT_PASSEND.headline}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 leading-[1.7] mb-6">{NICHT_PASSEND.intro}</p>
        <ul className="space-y-3">
          {NICHT_PASSEND.points.map((point, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed"
            >
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SolutionSection() {
  const capabilities = [
    { icon: PhoneCall, label: "Nimmt Anrufe entgegen, wenn Ihr Team gebunden ist" },
    { icon: MessageSquare, label: "Beantwortet wiederkehrende Fragen nach Ihren Vorgaben" },
    { icon: Calendar, label: "Bucht Termine nach Ihren Regeln in Ihren Kalender" },
    { icon: CheckCircle2, label: "Erfasst Anliegen strukturiert – mit Rückrufnummer und nächstem Schritt" },
    { icon: Shield, label: "Leitet dringende Anrufe sofort an einen Menschen weiter" },
    { icon: Clock, label: "Erreichbar auch abends, am Wochenende und an Feiertagen" },
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/40">
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
            <p className="text-gray-500 dark:text-gray-400 leading-[1.7] mb-8 max-w-lg">
              Der Telefonassistent übernimmt die Anrufe, die Ihr Team gerade nicht
              annehmen kann. Er spricht mit Ihrer Stimmauswahl, folgt Ihren Regeln und
              übergibt jedes Anliegen strukturiert – statt es auf der Mailbox
              liegen zu lassen. Was er übernimmt und was nicht, legen Sie fest.
            </p>
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
            >
              Demo ansehen
              <ArrowRight size={14} />
            </Link>
            <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
              Kostenlos · Unverbindlich · Ca. 15&nbsp;Minuten
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="space-y-2.5"
          >
            {capabilities.map((feat, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 group hover:border-gray-200 dark:hover:border-gray-600 transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700/60 border border-gray-150 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                  <feat.icon size={14} className="text-gray-400 dark:text-gray-400" />
                </div>
                <span className="text-[17px] text-gray-700 dark:text-gray-300 leading-relaxed">
                  {feat.label}
                </span>
                <CheckCircle2 size={13} className="text-emerald-400 ml-auto flex-shrink-0 opacity-70" />
              </motion.div>
            ))}
          </motion.div>
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
      desc: "Der Assistent nimmt ab, wenn Ihr Team gebunden ist – auch in Stoßzeiten, abends oder am Wochenende. Der Anrufer erfährt zu Beginn, dass ein Sprachassistent ihn betreut.",
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
      title: "Termin buchen oder weiterleiten",
      desc: "Termine werden nach Ihren Regeln geprüft und eingetragen. Dringende und komplexe Anliegen gehen sofort an einen Menschen.",
      detail: "Ihre Regeln entscheiden",
    },
    {
      number: "04",
      icon: FileText,
      title: "Zusammenfassung & Protokoll",
      desc: "Jedes Gespräch endet in einer strukturierten Zusammenfassung: Anliegen, Rückrufnummer, nächster Schritt – lesbar dort, wo Ihr Team arbeitet.",
      detail: "Kein Abtippen, kein Zettel",
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-gray-950">
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
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={fadeUp}
                className="relative"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                    <step.icon size={20} className="text-gray-500 dark:text-gray-400" />
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
    <section className="py-24 bg-gray-50 dark:bg-gray-900/40">
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
              {UEBERGABE.paragraphs.map((absatz, i) => (
                <p key={i}>{absatz}</p>
              ))}
            </div>
            <div className="space-y-3">
              {UEBERGABE.wasAnkommt.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-[17px] text-gray-600 dark:text-gray-400">
                  <span className="mt-[10px] w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
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
                  <FileText size={14} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide uppercase">
                    Beispiel eines Dashboard-Eintrags
                  </span>
                </div>
                <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">
                  Heute · 18:47
                </span>
              </div>

              <p className="px-5 pt-4 text-[14px] text-gray-500 dark:text-gray-500 leading-[1.5]">
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
                    Vereinbart
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Di., 18. März · 10:30&nbsp;Uhr · Beratungsgespräch
                  </p>
                </div>

                <div className="px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest mb-1.5">
                    Empfohlene Maßnahme
                  </p>
                  <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    Unterlagen zur Telefonassistenz vorbereiten · Rückruf bestätigt
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 flex items-center gap-2">
                <CheckCheck size={13} className="text-emerald-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Eintrag im Dashboard · von Ihrem Team zu übertragen
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/**
 * Fehlende Glieder der Beweiskette (COPY-BRIEF-3 §2), nachgezogen an der
 * Referenz /praxen: M4 Säulen, M18 Betreuung, M10 Preislogik, M19
 * Umkehrbarkeit, M7 Datenschutz.
 *
 * M10 steht hier bewusst OHNE Beträge: Die Tarife sind auf Praxen zugeschnitten,
 * diese Seite ist branchenübergreifend. Genannt wird die Logik, die Zahlen
 * stehen auf der Preisseite.
 */
function KettenStile() {
  const PROSE = "text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7]";
  const H2C = "text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6";
  const CARD =
    "p-7 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800";
  const CARD_ALT =
    "p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800";
  const DOT =
    "mt-[10px] w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0";
  const TEXT_LINK =
    "inline-flex items-center gap-2 min-h-[44px] py-3 text-[16px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors";

  return { PROSE, H2C, CARD, CARD_ALT, DOT, TEXT_LINK };
}

function SaeulenSection() {
  const { PROSE, H2C, CARD_ALT } = KettenStile();
  return (
    <>
      {/* ── M4 · Die vier Säulen ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className={H2C}>Was „für Ihren Betrieb gebaut" konkret heißt</h2>
          <div className="space-y-4">
            {SAEULEN.map((saeule, i) => (
              <div key={i} className={CARD_ALT}>
                <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5">
                  {saeule.title}
                </h3>
                <p className={PROSE}>{saeule.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}

function BetreuungSection() {
  const { PROSE, H2C, CARD } = KettenStile();
  return (
    <>
      {/* ── M18 · Betreuung ── */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/40">
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

    </>
  );
}

function PreisLogikSection() {
  const { PROSE, H2C, TEXT_LINK } = KettenStile();
  return (
    <>
      {/* ── M10 · Preislogik ohne Beträge ── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className={H2C}>{DECKELUNG.headline}</h2>
          <p className={`${PROSE} mb-4`}>{DECKELUNG.text}</p>
          <p className={`${PROSE} mb-4`}>{DECKELUNG.tarifwechsel}</p>
          <p className={PROSE}>{DECKELUNG.nichtProBehandler}</p>
          <Link to="/kosten-ki-telefonassistent" className={TEXT_LINK}>
            Alle Preisangaben im Detail
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

    </>
  );
}

function UmkehrbarkeitSection() {
  const { PROSE, H2C, CARD } = KettenStile();
  return (
    <>
      {/* ── M19 · Umkehrbarkeit ── */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/40">
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

    </>
  );
}

function DatenschutzTeaserSection() {
  const { PROSE, H2C, DOT, TEXT_LINK } = KettenStile();
  return (
    <>
      {/* ── M7 · Datenschutz ── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className={H2C}>Was Ihr Datenschutzbeauftragter wissen will</h2>
          <ul className="space-y-5">
            {DATENSCHUTZ_PUNKTE.map((punkt, i) => (
              <li key={i} className={`flex items-start gap-3 ${PROSE}`}>
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
    </>
  );
}

function ObjectionsSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="max-w-2xl mb-14"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
            Häufige Fragen im Vorfeld
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15]">
            Was Entscheider wissen wollen
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {OBJECTIONS.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors duration-300 group"
            >
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4">
                <item.icon size={15} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5 leading-snug">
                {item.q}
              </h3>
              <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.a}
              </p>
            </motion.div>
          ))}
        </div>
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
          {USE_CASES.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-150 dark:border-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon size={17} className="text-gray-400 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
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

function SetupSection() {
  const phases = EINRICHTUNG_SCHRITTE.map((s) => ({
    step: s.title,
    desc: s.description,
  }));

  return (
    <section id="einrichtung" className="py-20 bg-gray-50 dark:bg-gray-900/40 border-y border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4">
              Implementierung
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-4">
              So wird Ihr Empfang
              <br className="hidden sm:block" /> am Telefon gebaut.
            </h2>
            <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-[1.7] max-w-md">
              Individuell heißt bei uns nicht Adjektiv, sondern Ablauf: Sie
              beschreiben Ihre Anrufe, wir bauen daraus Regeln, Ansagen und die
              Übergabe. Vor dem Start hören Sie das Ergebnis selbst.
            </p>
          </motion.div>

          <div className="space-y-3">
            {phases.map((phase, i) => (
              <motion.div
                key={i}
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
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{phase.step}</span>
                  <p className="text-[17px] text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{phase.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoCtaSection() {
  return (
    <section className="py-28 bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <div className="relative rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 px-10 lg:px-14 py-14 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.03)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_60%)] pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 mb-6 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Demo jetzt verfügbar
              </div>
              <h2 className="text-3xl lg:text-[2.25rem] font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
                Sehen Sie den Assistenten
                <br className="hidden sm:block" /> live in Aktion.
              </h2>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-8 leading-[1.7]">
                In einer kurzen Demo zeigen wir, wie der Assistent Anrufe entgegennimmt,
                Termine bucht und Anliegen weiterleitet – konfiguriert für Ihre Branche.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <Link
                  to="/ki-telefonassistent/demo"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[15px] hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-lg"
                >
                  <Phone size={15} />
                  Kostenlose Demo ansehen
                </Link>
                <Link
                  to="/kontakt"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[15px] hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 hover:bg-gray-50/80"
                >
                  Unverbindliches Erstgespräch vereinbaren
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400 dark:text-gray-500">
                <span>Ca. 15&nbsp;Minuten</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span>Kostenlos</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span>Unverbindlich</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span>Keine Vorkenntnisse nötig</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FAQSectionBlock() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/40">
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
            Häufige Fragen
          </h2>
        </motion.div>

        <div className="space-y-2">
          {faqItems.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-[17px] font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors duration-150"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{item.question}</span>
                <ChevronDown
                  size={15}
                  className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-0">
                      <div className="w-full h-px bg-gray-100 dark:bg-gray-700/60 mb-4" />
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
        { label: "KI Telefonassistent Arzt", href: "/ki-telefonassistent-arzt" },
        { label: "KI Telefonassistent Restaurant", href: "/ki-telefonassistent-restaurant" },
        { label: "KI Telefonassistent Hotel", href: "/ki-telefonassistent-hotel" },
        { label: "KI Telefonassistent Praxis", href: "/ki-telefonassistent-praxis" },
      ],
    },
    {
      heading: "Nach Stadt",
      links: [
        { label: "KI Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
        { label: "KI Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
        { label: "KI Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
        { label: "Bayern KI Telefonassistent", href: "/bayern/ki-telefonassistent" },
      ],
    },
    {
      heading: "Verwandte Themen",
      links: [
        { label: "KI Telefonassistent Kosten", href: "/kosten-ki-telefonassistent" },
        { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
        { label: "Verpasste Anrufe", href: "/verpasste-anrufe-verlust" },
        { label: "Automatisierung Unternehmen", href: "/automatisierung-unternehmen" },
      ],
    },
  ];

  return (
    <section className="py-14 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-7"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
            Weiterführende Seiten
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="grid sm:grid-cols-3 gap-8"
        >
          {cols.map((col) => (
            <div key={col.heading}>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-3">
                {col.heading}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
                    >
                      <ArrowRight
                        size={11}
                        className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors flex-shrink-0"
                      />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
            Gehen wir Ihre Anrufe gemeinsam durch.
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-10 leading-[1.7]">
            Im unverbindlichen Erstgespräch skizzieren wir, wie Ihr Empfang am
            Telefon aussehen könnte – mit Ihren Anrufanlässen, Ihren Regeln und
            Ihrer Übergabe. Danach entscheiden Sie in Ruhe.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[15px] hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
            >
              <Phone size={15} />
              Kostenlose Demo ansehen
            </Link>
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[15px] hover:border-gray-400 transition-all duration-200"
            >
              Unverbindliches Erstgespräch vereinbaren
              <ArrowRight size={14} />
            </Link>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {BUSINESS_INFO.name} · {BUSINESS_INFO.contact.email} · {BUSINESS_INFO.contact.phoneDisplay}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
