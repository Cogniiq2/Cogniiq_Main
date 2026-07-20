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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const breadcrumbs = [
  { name: "Home", url: BUSINESS_INFO.website },
  { name: "KI Telefonassistent", url: `${BUSINESS_INFO.website}/ki-telefonassistent` },
];

const faqItems = [
  {
    question: "Wie schnell ist der KI Telefonassistent eingerichtet?",
    answer:
      "In den meisten Fällen ist der Assistent innerhalb weniger Tage einsatzbereit. Wir konfigurieren ihn individuell für Ihr Unternehmen – inklusive Branchensprache, häufigen Anfragen und Kalenderintegration.",
  },
  {
    question: "Welche Systeme können integriert werden?",
    answer:
      "Der Assistent verbindet sich mit Google Calendar, Outlook, gängigen CRM-Systemen sowie bestehenden Automatisierungs-Workflows. Die Integration erfolgt ohne technischen Aufwand für Ihr Team.",
  },
  {
    question: "Ist der KI Telefonassistent DSGVO-konform?",
    answer:
      "Ja. Alle Daten werden auf deutschen Servern verarbeitet. Der Assistent ist vollständig DSGVO-konform und wurde für den Einsatz im deutschen Mittelstand entwickelt.",
  },
  {
    question: "Kann die KI individuell angepasst werden?",
    answer:
      "Ja. Wir trainieren den Assistenten auf Ihre Branche, Ihre Unternehmenssprache und Ihre häufigsten Anfragen. Er klingt professionell und wie ein Teil Ihres Teams.",
  },
  {
    question: "Wie funktioniert die automatische Terminbuchung?",
    answer:
      "Der Assistent prüft in Echtzeit Ihre Kalenderverfügbarkeit, schlägt freie Zeiten vor und trägt Termine nach Bestätigung automatisch ein – ohne manuelle Nacharbeit.",
  },
  {
    question: "Was kostet der KI Telefonassistent?",
    answer:
      "Die Kosten hängen von Umfang und Integrationen ab. In einer kostenlosen Demo erstellen wir ein individuelles Angebot für Ihr Unternehmen.",
  },
];

const PROBLEMS = [
  {
    icon: Phone,
    title: "Anrufe außerhalb der Öffnungszeiten",
    desc: "Ein Großteil der Anrufe kommt abends, am Wochenende oder in Stoßzeiten – genau dann, wenn niemand erreichbar ist.",
  },
  {
    icon: Users,
    title: "Mitarbeiter sind im Gespräch",
    desc: "Wenn alle besetzt sind, klingelt das Telefon ins Leere. Kunden warten nicht – sie rufen beim Wettbewerber an.",
  },
  {
    icon: TrendingUp,
    title: "Kunden springen zur Konkurrenz",
    desc: "Über 60 % der Anrufer, die niemanden erreichen, versuchen es bei einem anderen Anbieter – und kehren nicht zurück.",
  },
  {
    icon: Building2,
    title: "Wichtige Anfragen gehen verloren",
    desc: "Ohne systematische Erfassung verschwinden Anfragen im Alltag. Aufträge bleiben liegen, Kunden werden enttäuscht.",
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
    desc: "Patientenanfragen, Terminbuchungen und Standardauskünfte automatisieren – Entlastung für das Praxisteam.",
  },
  {
    icon: Briefcase,
    industry: "Dienstleister",
    desc: "Erstanfragen qualifizieren, Kundendaten erfassen und Rückrufe automatisch einplanen.",
  },
  {
    icon: Home,
    industry: "Immobilien",
    desc: "Besichtigungstermine buchen und Exposé-Anfragen entgegennehmen – vollautomatisch.",
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
    q: "Klingt es natürlich?",
    a: "Ja. Der Assistent spricht in flüssiger, natürlicher Sprache und klingt nicht roboterhaft. Auf Wunsch sprechen wir mit Ihnen gemeinsam die Stimme, Tonalität und Formulierungen ab.",
  },
  {
    icon: GitMerge,
    q: "Was passiert bei komplexen Anfragen?",
    a: "Der Assistent erfasst Anliegen strukturiert und leitet komplexe Fälle gezielt an Ihr Team weiter – mit vollständiger Gesprächszusammenfassung, damit kein Kontext verloren geht.",
  },
  {
    icon: Calendar,
    q: "Kann er Termine buchen?",
    a: "Ja. Die KI prüft in Echtzeit Ihren Kalender und trägt bestätigte Termine direkt ein – kompatibel mit Google Calendar, Outlook und weiteren Systemen.",
  },
  {
    icon: BellRing,
    q: "Was bei dringenden Anrufen?",
    a: "Dringende Anrufe – z. B. Notfälle in Praxen – werden sofort eskaliert: per Weiterleitung, SMS oder E-Mail an den richtigen Ansprechpartner in Ihrem Team.",
  },
  {
    icon: SlidersHorizontal,
    q: "Wie aufwändig ist die Einrichtung?",
    a: "Kein technischer Aufwand auf Ihrer Seite. Wir übernehmen Konfiguration, Integration und Einrichtung komplett. Die meisten Kunden sind in weniger als einer Woche live.",
  },
  {
    icon: RotateCcw,
    q: "Kann man es anpassen?",
    a: "Vollständig. Sprache, Themen, Prozesse und Weiterleitungsregeln werden individuell für Ihr Unternehmen konfiguriert – und können jederzeit angepasst werden.",
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
          "Automatischer KI Telefonassistent der Anrufe beantwortet, Fragen klärt und Termine bucht – 24/7.",
        url: `${BUSINESS_INFO.website}/ki-telefonassistent`,
        provider: {
          "@type": "Organization",
          name: BUSINESS_INFO.name,
          url: BUSINESS_INFO.website,
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
      {
        "@type": "HowTo",
        "name": "KI-Telefonassistent einrichten – in 4 Schritten",
        "description": "So wird der KI-Telefonassistent von Cogniiq für Ihr Unternehmen eingerichtet – von der Analyse bis zum Live-Betrieb.",
        "totalTime": "P14D",
        "estimatedCost": {
          "@type": "MonetaryAmount",
          "currency": "EUR",
          "value": "0",
          "minValue": "0",
        },
        "step": [
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "Analyse",
            "text": "Wir verstehen Ihre Branche, häufigsten Anrufthemen und bestehenden Systeme.",
            "url": "https://cogniiq.de/ki-telefonassistent#einrichtung",
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "Konfiguration",
            "text": "Der Assistent wird auf Ihre Sprache, Prozesse und Weiterleitungsregeln eingestellt.",
            "url": "https://cogniiq.de/ki-telefonassistent#einrichtung",
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "Integration",
            "text": "Anbindung an Kalender, CRM oder Ihre bestehende Rufnummer – ohne IT-Aufwand.",
            "url": "https://cogniiq.de/ki-telefonassistent#einrichtung",
          },
          {
            "@type": "HowToStep",
            "position": 4,
            "name": "Live-Betrieb",
            "text": "Der Assistent übernimmt Anrufe. Bei Bedarf passen wir ihn laufend an.",
            "url": "https://cogniiq.de/ki-telefonassistent#einrichtung",
          },
        ],
      },
    ],
  };

  return (
    <>
      <PageSEO
        title="KI Telefonassistent für Unternehmen | Cogniiq"
        description="KI Telefonassistent für Ihr Unternehmen: Beantwortet Anrufe automatisch, versteht Kundenanfragen und bucht Termine rund um die Uhr. Jetzt kostenlose Demo buchen."
        canonical={`${BUSINESS_INFO.website}/ki-telefonassistent`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={schema}
      />

      <main className="min-h-screen">
        <HeroSection />
        <CredentialStrip />
        <ProblemSection />
        <SolutionSection />
        <CallFlowSection />
        <CallSummarySection />
        <ObjectionsSection />
        <UseCasesSection />
        <SocialProofSection />
        <SetupSection />
        <DemoCtaSection />
        <FAQSectionBlock />
        <InternalLinksSection />
        <FinalCtaSection />
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
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs font-medium tracking-widest uppercase mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              KI Telefonservice · Mittelstand Deutschland
            </div>

            <h1 className="text-[2.75rem] sm:text-5xl lg:text-[3.5rem] font-bold text-gray-900 dark:text-gray-100 leading-[1.06] tracking-tight mb-6">
              Jeder Anruf beantwortet.
              <br />
              <span className="text-gray-400 dark:text-gray-500 font-light">Kein Kunde verloren.</span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 leading-[1.7] max-w-xl mb-3">
              Der KI Telefonassistent von Cogniiq übernimmt eingehende Anrufe, führt
              natürliche Gespräche und bucht Termine direkt in Ihren Kalender –
              rund um die Uhr, ohne zusätzliches Personal.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-10 max-w-lg leading-relaxed">
              Individuell konfiguriert für Ihre Branche. Eingerichtet in wenigen Tagen.
              Betrieben auf deutschen Servern.
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
                Termin vereinbaren
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-7 gap-y-2.5">
              {[
                "DSGVO-konform · Deutsche Server",
                "Einrichtung in wenigen Tagen",
                "Individuelle Konfiguration",
                "CRM & Kalender-Integration",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.25 + i * 0.06}
                  className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400"
                >
                  <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0.2}
            className="hidden lg:block"
          >
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900 overflow-hidden shadow-[0_2px_24px_rgba(0,0,0,0.07)] dark:shadow-[0_2px_24px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                  Eingehender Anruf
                </span>
                <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                  10:24
                </span>
              </div>

              <div className="p-5 space-y-3">
                {[
                  { role: "customer", text: "Guten Tag, ich möchte einen Termin vereinbaren." },
                  { role: "ai", text: "Gerne – für welchen Service planen Sie den Termin?" },
                  { role: "customer", text: "Eine Erstberatung." },
                  { role: "ai", text: "Ich habe Dienstag, 10:30 Uhr frei. Passt Ihnen das?" },
                  { role: "customer", text: "Ja, das passt sehr gut." },
                  { role: "ai", text: "Eingetragen. Sie erhalten eine Bestätigung per E-Mail." },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[86%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                        msg.role === "ai"
                          ? "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700"
                          : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-widest">
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
                  <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                    Termin automatisch gespeichert · Kalender aktualisiert
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 px-1">
              <Lock size={11} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                DSGVO-konform · Verarbeitung auf deutschen Servern
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
    { label: "Deutsche Server", detail: "DSGVO-konform" },
    { label: "Einrichtung in Tagen", detail: "Kein IT-Aufwand" },
    { label: "24/7 Erreichbarkeit", detail: "365 Tage im Jahr" },
    { label: "Individuelle Konfiguration", detail: "Für Ihre Branche" },
    { label: "CRM & Kalender-Integration", detail: "Google, Outlook & mehr" },
  ];

  return (
    <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
              <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">
                {item.label}
              </span>
              <span className="hidden sm:inline text-[12px] text-gray-400 dark:text-gray-500">
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
          custom={0}
          className="max-w-2xl mb-6"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
            Das Problem
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
            Täglich verlieren Unternehmen
            <br className="hidden sm:block" /> Aufträge durch unbeantwortete Anrufe.
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-[1.7]">
            Nicht wegen schlechtem Service – sondern weil niemand abnimmt. Kunden warten
            nicht. Sie rufen beim nächsten Anbieter an.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          custom={0.1}
          className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 mb-14"
        >
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">40 %</span>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            aller eingehenden Unternehmensanrufe bleiben unbeantwortet – laut Branchenerhebungen.
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
              custom={i * 0.08}
              className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 group hover:border-gray-200 dark:hover:border-gray-700 transition-colors duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-colors duration-300">
                <item.icon size={17} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-snug">
                {item.title}
              </h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
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
    { icon: PhoneCall, label: "Nimmt eingehende Anrufe sofort entgegen" },
    { icon: MessageSquare, label: "Führt natürliche, kompetente Gespräche" },
    { icon: CheckCircle2, label: "Beantwortet Fragen nach Ihren Vorgaben" },
    { icon: Calendar, label: "Bucht Termine direkt in Ihren Kalender" },
    { icon: Clock, label: "Erreichbar 24/7, auch an Feiertagen" },
    { icon: Shield, label: "Integriert in CRM, Outlook, Google und mehr" },
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
            custom={0}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
              Die Lösung
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-5">
              Der KI Telefonassistent –
              <br className="hidden sm:block" /> immer erreichbar, immer kompetent.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-[1.7] mb-8 max-w-lg">
              Die KI übernimmt eingehende Anrufe vollautomatisch. Sie führt echte
              Gespräche in natürlicher Sprache, erfasst Anliegen strukturiert und
              erledigt häufige Aufgaben ohne manuellen Aufwand.
            </p>
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
            >
              Demo ansehen
              <ArrowRight size={14} />
            </Link>
            <p className="mt-3 text-[12px] text-gray-400 dark:text-gray-500">
              Kostenlos · Unverbindlich · Ca. 15 Minuten
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            custom={0.15}
            className="space-y-2.5"
          >
            {capabilities.map((feat, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.06}
                className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 group hover:border-gray-200 dark:hover:border-gray-600 transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700/60 border border-gray-150 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                  <feat.icon size={14} className="text-gray-400 dark:text-gray-400" />
                </div>
                <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium leading-snug">
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
      desc: "Die KI nimmt sofort ab. Kein Klingeln ins Leere – auch nicht in Stoßzeiten, abends oder am Wochenende.",
      detail: "Reaktionszeit: unter 2 Sekunden",
    },
    {
      number: "02",
      icon: MessageSquare,
      title: "Gespräch & Anliegen erfassen",
      desc: "Der Assistent führt ein natürliches Gespräch, versteht das Anliegen und beantwortet Fragen nach Ihren Vorgaben.",
      detail: "Branchenspezifisch trainiert",
    },
    {
      number: "03",
      icon: Calendar,
      title: "Termin buchen oder weiterleiten",
      desc: "Termine werden direkt geprüft und eingetragen. Komplexe Anliegen werden mit Zusammenfassung weitergeleitet.",
      detail: "Kalender & CRM-Integration",
    },
    {
      number: "04",
      icon: FileText,
      title: "Zusammenfassung & Protokoll",
      desc: "Jedes Gespräch wird strukturiert dokumentiert. Ihr Team erhält eine klare Zusammenfassung – ohne Nacharbeit.",
      detail: "Automatisch · Sofort verfügbar",
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
          custom={0}
          className="max-w-2xl mb-16"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
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
                custom={i * 0.1}
                className="relative"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                    <step.icon size={20} className="text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-gray-300 dark:text-gray-600 uppercase">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                  {step.desc}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
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
            custom={0}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
              Nach jedem Gespräch
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-5">
              Strukturiert dokumentiert.
              <br className="hidden sm:block" /> Sofort handlungsfähig.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-[1.7] mb-8 max-w-lg">
              Jedes Gespräch wird automatisch erfasst und als klares Protokoll bereitgestellt –
              mit Anliegen, vereinbartem Termin und empfohlener nächster Maßnahme. Kein
              manuelles Nacharbeiten, kein Informationsverlust.
            </p>
            <div className="space-y-3">
              {[
                "Gesprächszusammenfassung direkt nach dem Anruf",
                "Erfasstes Anliegen und Kontaktdaten",
                "Vereinbarter Termin oder Rückrufwunsch",
                "Automatische Weiterleitung an Ihr Team",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[13px] text-gray-600 dark:text-gray-400">
                  <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
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
            custom={0.15}
          >
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
                <div className="flex items-center gap-2.5">
                  <FileText size={14} className="text-gray-400" />
                  <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-400 tracking-wide uppercase">
                    Gesprächsprotokoll
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                  Heute · 18:47
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest mb-1">
                      Anrufer
                    </p>
                    <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">
                      Thomas Bauer
                    </p>
                  </div>
                  <div className="px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest mb-1">
                      Dauer
                    </p>
                    <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">
                      2 Min 14 Sek
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest mb-1.5">
                    Anliegen
                  </p>
                  <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
                    Erstberatung zur Automatisierung der Telefonie. Interessiert an Terminbuchungslösung.
                  </p>
                </div>

                <div className="px-3.5 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold uppercase tracking-widest mb-1">
                    Vereinbart
                  </p>
                  <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                    Di., 18. März · 10:30 Uhr · Beratungsgespräch
                  </p>
                </div>

                <div className="px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest mb-1.5">
                    Empfohlene Maßnahme
                  </p>
                  <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    Unterlagen zur Telefonassistenz vorbereiten · Rückruf bestätigt
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 flex items-center gap-2">
                <CheckCheck size={13} className="text-emerald-500" />
                <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                  Kalender aktualisiert · Team benachrichtigt
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
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
          custom={0}
          className="max-w-2xl mb-14"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
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
              custom={i * 0.07}
              className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors duration-300 group"
            >
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4">
                <item.icon size={15} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5 leading-snug">
                {item.q}
              </h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
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
          custom={0}
          className="max-w-2xl mb-14"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
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
              custom={i * 0.07}
              className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-150 dark:border-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon size={17} className="text-gray-400 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                  {item.industry}
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
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

function SocialProofSection() {
  const testimonials = [
    {
      quote:
        "Wir verpassen keinen einzigen Anruf mehr – der Assistent funktioniert zuverlässiger als erwartet und hat unsere Terminquote spürbar erhöht.",
      author: "Geschäftsführer",
      company: "Handwerksbetrieb, Bayern",
    },
    {
      quote:
        "Der Assistent übernimmt täglich viele Anfragen, die vorher bei uns hängengeblieben sind. Das Team hat wieder Luft für die eigentliche Arbeit.",
      author: "Inhaberin",
      company: "Dienstleistungsunternehmen, NRW",
    },
    {
      quote:
        "Patienten können jetzt rund um die Uhr Termine buchen. Die Entlastung für unser Praxisteam ist messbar – weniger Unterbrechungen, weniger Rückrufe.",
      author: "Praxismanagerin",
      company: "Arztpraxis, Hamburg",
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
          custom={0}
          className="max-w-2xl mb-14"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
            Kundenstimmen
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15]">
            Unternehmen berichten
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              custom={i * 0.08}
              className="flex flex-col p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex gap-0.5 mb-5">
                {[...Array(5)].map((_, s) => (
                  <span key={s} className="text-amber-400 text-[13px]">★</span>
                ))}
              </div>
              <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed flex-1 mb-6">
                "{t.quote}"
              </p>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700/60">
                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{t.author}</p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">{t.company}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SetupSection() {
  const phases = [
    {
      step: "Analyse",
      desc: "Wir verstehen Ihre Branche, häufigsten Anrufthemen und bestehenden Systeme.",
    },
    {
      step: "Konfiguration",
      desc: "Der Assistent wird auf Ihre Sprache, Prozesse und Weiterleitungsregeln eingestellt.",
    },
    {
      step: "Integration",
      desc: "Anbindung an Kalender, CRM oder Ihre bestehende Rufnummer – ohne IT-Aufwand.",
    },
    {
      step: "Live-Betrieb",
      desc: "Der Assistent übernimmt Anrufe. Bei Bedarf passen wir ihn laufend an.",
    },
  ];

  return (
    <section id="einrichtung" className="py-20 bg-gray-50 dark:bg-gray-900/40 border-y border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            custom={0}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
              Implementierung
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-4">
              Von der Anfrage bis zum Live-Betrieb –
              <br className="hidden sm:block" /> in wenigen Tagen.
            </h2>
            <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-[1.7] max-w-md">
              Kein technischer Aufwand auf Ihrer Seite. Wir übernehmen Analyse,
              Konfiguration und Integration vollständig.
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
                custom={i * 0.08}
                className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{i + 1}</span>
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{phase.step}</span>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{phase.desc}</p>
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
          custom={0}
        >
          <div className="relative rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 px-10 lg:px-14 py-14 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.03)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_60%)] pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-6 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[14px] hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-lg"
                >
                  <Phone size={15} />
                  Kostenlose Demo ansehen
                </Link>
                <Link
                  to="/kontakt"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[14px] hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 hover:bg-gray-50/80"
                >
                  Termin vereinbaren
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-gray-400 dark:text-gray-500">
                <span>Ca. 15 Minuten</span>
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
          custom={0}
          className="mb-12"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
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
              custom={i * 0.05}
              className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-[14px] font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors duration-150"
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
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-0">
                      <div className="w-full h-px bg-gray-100 dark:bg-gray-700/60 mb-4" />
                      <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-[1.7]">
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
          custom={0}
          className="mb-7"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
            Weiterführende Seiten
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.1}
          className="grid sm:grid-cols-3 gap-8"
        >
          {cols.map((col) => (
            <div key={col.heading}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-3">
                {col.heading}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="group inline-flex items-center gap-2 text-[13px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
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
          custom={0}
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
            Bereit, jeden Anruf zu beantworten?
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-10 leading-[1.7]">
            Sprechen Sie mit uns. Wir zeigen Ihnen in einer kurzen Demo, wie der
            KI Telefonassistent in Ihrem Unternehmen eingesetzt werden kann.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[14px] hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
            >
              <Phone size={15} />
              Kostenlose Demo ansehen
            </Link>
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[14px] hover:border-gray-400 transition-all duration-200"
            >
              Termin vereinbaren
              <ArrowRight size={14} />
            </Link>
          </div>
          <p className="text-[12px] text-gray-400 dark:text-gray-500">
            {BUSINESS_INFO.name} · {BUSINESS_INFO.contact.email} · {BUSINESS_INFO.contact.phoneDisplay}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
