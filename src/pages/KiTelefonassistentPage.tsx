import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Phone,
  Clock,
  Calendar,
  CircleCheck as CheckCircle2,
  Zap,
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
} from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const breadcrumbs = [
  { name: "Home", url: BUSINESS_INFO.website },
  { name: "KI Telefonassistent", url: `${BUSINESS_INFO.website}/ki-telefonassistent` },
];

const faqItems = [
  {
    question: "Wie schnell ist der KI Telefonassistent eingerichtet?",
    answer: "In den meisten Fällen ist der Assistent innerhalb weniger Tage einsatzbereit. Wir konfigurieren ihn individuell für Ihr Unternehmen – inklusive Branchensprache, häufigen Anfragen und Kalenderintegration.",
  },
  {
    question: "Welche Systeme können integriert werden?",
    answer: "Der Assistent verbindet sich mit Google Calendar, Outlook, gängigen CRM-Systemen sowie Automationstools wie Make oder Zapier. Die Integration erfolgt ohne technischen Aufwand für Ihr Team.",
  },
  {
    question: "Ist der KI Telefonassistent DSGVO-konform?",
    answer: "Ja. Alle Daten werden auf deutschen Servern verarbeitet. Der Assistent ist vollständig DSGVO-konform und wurde für den Einsatz im deutschen Mittelstand entwickelt.",
  },
  {
    question: "Kann die KI individuell angepasst werden?",
    answer: "Ja. Wir trainieren den Assistenten auf Ihre Branche, Ihre Unternehmenssprache und Ihre häufigsten Anfragen. Er klingt professionell und wie ein Teil Ihres Teams.",
  },
  {
    question: "Wie funktioniert die automatische Terminbuchung?",
    answer: "Der Assistent prüft in Echtzeit Ihre Kalenderverfügbarkeit, schlägt freie Zeiten vor und trägt Termine nach Bestätigung automatisch ein – ohne manuelle Nacharbeit.",
  },
  {
    question: "Was kostet der KI Telefonassistent?",
    answer: "Die Kosten hängen von Umfang und Integrationen ab. In einer kostenlosen Demo erstellen wir ein individuelles Angebot für Ihr Unternehmen.",
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

const FEATURES = [
  { icon: PhoneCall, label: "Nimmt eingehende Anrufe sofort und automatisch entgegen" },
  { icon: MessageSquare, label: "Versteht natürliche Sprache und Kundenanliegen" },
  { icon: CheckCircle2, label: "Beantwortet häufige Fragen und gibt Informationen weiter" },
  { icon: Calendar, label: "Bucht Termine direkt in Ihren Kalender" },
  { icon: Clock, label: "Erreichbar rund um die Uhr, 365 Tage im Jahr" },
  { icon: Shield, label: "Nahtlose Integration in CRM und Automationssysteme" },
];

const BENEFITS = [
  {
    icon: Phone,
    title: "Nie wieder Anrufe verpassen",
    desc: "Jeder Kunde wird sofort professionell empfangen – unabhängig von Uhrzeit, Auslastung oder Verfügbarkeit Ihres Teams.",
  },
  {
    icon: Calendar,
    title: "Mehr Termine automatisch",
    desc: "Die KI bucht Termine direkt in Ihren Kalender – ohne Rückruf, ohne Hin und Her, ohne manuellen Aufwand.",
  },
  {
    icon: Clock,
    title: "24/7 erreichbar",
    desc: "Kunden erreichen Ihr Unternehmen jederzeit – auch abends, am Wochenende und an Feiertagen.",
  },
  {
    icon: TrendingUp,
    title: "Spart Zeit und Personal",
    desc: "Routineanfragen werden vollständig automatisiert – Ihr Team konzentriert sich auf Aufgaben, die wirklich zählen.",
  },
  {
    icon: Users,
    title: "Skalierbarer Kundenservice",
    desc: "Ob 10 oder 1.000 Anrufe täglich – der Assistent wächst mit Ihrem Unternehmen ohne Mehrkosten.",
  },
  {
    icon: Shield,
    title: "Professioneller erster Eindruck",
    desc: "Jeder Anrufer wird kompetent und freundlich begrüßt. Das stärkt Vertrauen, Markenbild und Kundenbindung.",
  },
];

const USE_CASES = [
  { icon: Wrench, industry: "Handwerker", desc: "Terminanfragen entgegennehmen und in den Kalender buchen – auch wenn Sie auf der Baustelle sind." },
  { icon: Stethoscope, industry: "Arztpraxen", desc: "Patientenanfragen, Terminbuchungen und Standardauskünfte automatisieren – Entlastung für das Praxisteam." },
  { icon: Briefcase, industry: "Dienstleister", desc: "Erstanfragen qualifizieren, Kundendaten erfassen und Rückrufe automatisch einplanen." },
  { icon: Home, industry: "Immobilien", desc: "Besichtigungstermine buchen und Exposé-Anfragen entgegennehmen – vollautomatisch." },
  { icon: Building2, industry: "Agenturen & Beratung", desc: "Erstgespräche terminieren, Anliegen erfassen und an den richtigen Ansprechpartner weiterleiten." },
];

export function KiTelefonassistentPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "KI Telefonassistent für Unternehmen",
        description: "Automatischer KI Telefonassistent der Anrufe beantwortet, Fragen klärt und Termine bucht – 24/7.",
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
        <TrustStripSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <LiveDemoSection />
        <BenefitsSection />
        <SocialProofSection />
        <SpeedGuaranteeSection />
        <UseCasesSection />
        <DemoCtaSection />
        <FAQSectionBlock />
        <FinalCtaSection />
      </main>
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-gray-100/60 to-transparent dark:from-gray-800/20 dark:to-transparent rounded-full translate-x-1/3 -translate-y-1/4" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            KI Telefonservice · Mittelstand
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-[1.08] tracking-tight mb-6">
            Nie wieder
            <br />
            <span className="text-gray-500 dark:text-gray-400">Kundenanrufe verpassen</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-10">
            Der KI Telefonassistent beantwortet eingehende Anrufe, spricht mit
            Kunden und bucht Termine automatisch – 24/7 und ohne zusätzliches Personal.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              <Phone size={16} />
              Kostenlose Demo ansehen
            </Link>
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-all duration-200"
            >
              Termin vereinbaren
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2.5">
            {[
              "DSGVO-konform",
              "Made in Germany",
              "Integration mit CRM & Kalender",
              "Einrichtung in wenigen Tagen",
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.2 + i * 0.07}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
              >
                <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustStripSection() {
  return (
    <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-5">
        <div className="flex flex-wrap items-center justify-between gap-5">
          {[
            "KI Anrufbeantworter für Unternehmen",
            "Made in Germany",
            "DSGVO-konform",
            "Individuell konfiguriert",
            "Schnelle Implementierung",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <CheckCircle2 size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              {item}
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
          className="max-w-2xl mb-5"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
            Das Problem
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">
            Viele Unternehmen verlieren täglich Kunden durch verpasste Anrufe.
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Deutsche Unternehmen verlieren täglich potenzielle Aufträge – nicht weil ihr Service
            schlecht ist, sondern weil niemand ans Telefon geht.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          custom={0.1}
          className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 mb-12"
        >
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">40 %</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">aller Anrufe bei Unternehmen bleiben unbeantwortet.</span>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROBLEMS.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
              custom={i * 0.08}
              className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4">
                <item.icon size={18} className="text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
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
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            custom={0}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
              Die Lösung
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-6">
              Der KI Telefonassistent übernimmt Ihre Anrufe automatisch.
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
              Die KI nimmt eingehende Anrufe entgegen, versteht die Anliegen Ihrer Kunden
              und erledigt häufige Aufgaben vollständig automatisch – rund um die Uhr.
            </p>
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5"
            >
              Demo erleben
              <ArrowRight size={15} />
            </Link>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              Kostenlose Demo – unverbindlich
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            custom={0.15}
            className="space-y-3"
          >
            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.06}
                className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                  <feat.icon size={15} className="text-gray-500 dark:text-gray-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {feat.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: PhoneCall,
      title: "Kunde ruft an",
      desc: "Die KI nimmt eingehende Anrufe automatisch und sofort entgegen – kein Klingeln ins Leere.",
    },
    {
      number: "02",
      icon: MessageSquare,
      title: "Gespräch führen",
      desc: "Der Assistent versteht Fragen und Anliegen Ihrer Kunden in natürlicher Sprache und antwortet kompetent.",
    },
    {
      number: "03",
      icon: CheckCheck,
      title: "Termin buchen",
      desc: "Termine werden direkt geprüft, bestätigt und automatisch in Ihren Kalender eingetragen.",
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
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
            So funktioniert es
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            So funktioniert der KI Telefonassistent
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-8">
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
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-5 left-full w-full h-px border-t border-dashed border-gray-200 dark:border-gray-700 z-0 -translate-x-8" />
              )}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                    <step.icon size={17} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-xs font-bold tracking-widest text-gray-300 dark:text-gray-600 uppercase">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveDemoSection() {
  const conversation = [
    { role: "customer", text: "Guten Tag, ich möchte einen Termin vereinbaren." },
    { role: "ai", text: "Gerne. Für welchen Service möchten Sie einen Termin buchen?" },
    { role: "customer", text: "Eine Beratung, bitte." },
    { role: "ai", text: "Ich habe am Dienstag um 10:30 Uhr einen Termin frei. Passt das für Sie?" },
    { role: "customer", text: "Ja, das passt." },
    { role: "ai", text: "Perfekt. Der Termin ist eingetragen. Sie erhalten eine Bestätigung." },
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            custom={0}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
              Live Demo
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-6">
              So spricht Ihr KI Telefonassistent
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
              Der KI Telefonservice klingt natürlich, kompetent und professionell –
              wie ein erfahrener Mitarbeiter, der immer da ist.
            </p>
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5"
            >
              <Phone size={15} />
              Live in Demo erleben
            </Link>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              Live-Demo in unter 15 Minuten
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            custom={0.15}
          >
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase">
                  Eingehender Anruf
                </span>
                <PhoneCall size={13} className="text-gray-400 ml-auto" />
              </div>

              <div className="p-5 space-y-3.5">
                {conversation.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.08}
                    className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                        msg.role === "ai"
                          ? "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700"
                          : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <span className="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">
                          KI Assistent
                        </span>
                      )}
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                <div className="flex items-center gap-2.5">
                  <CheckCheck size={14} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Termin automatisch im Kalender gespeichert
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
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
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
            Vorteile
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Warum Unternehmen einen KI Telefonassistenten einsetzen
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              custom={i * 0.07}
              className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-5">
                <item.icon size={18} className="text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {item.desc}
              </p>
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
      quote: "Wir verpassen keinen einzigen Anruf mehr und bekommen deutlich mehr Termine – der Assistent arbeitet besser als erwartet.",
      author: "Geschäftsführer",
      company: "Handwerksbetrieb, Bayern",
    },
    {
      quote: "Der KI Telefonassistent nimmt uns täglich viele Anfragen ab. Unser Team kann sich endlich auf die eigentliche Arbeit konzentrieren.",
      author: "Inhaberin",
      company: "Dienstleistungsunternehmen, NRW",
    },
    {
      quote: "Patienten buchen jetzt rund um die Uhr Termine. Die Entlastung für unser Praxisteam ist spürbar.",
      author: "Praxismanagerin",
      company: "Arztpraxis, Hamburg",
    },
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          custom={0}
          className="max-w-2xl mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
            Kundenstimmen
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Bereits von Unternehmen genutzt
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              custom={i * 0.08}
              className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, s) => (
                  <span key={s} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-5 italic">
                "{t.quote}"
              </p>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{t.author}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.company}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpeedGuaranteeSection() {
  return (
    <section className="py-16 bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          custom={0}
          className="grid sm:grid-cols-3 gap-10 items-center"
        >
          <div className="sm:col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
              Schnelle Einrichtung
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Einrichtung in wenigen Tagen
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
              Der KI Telefonassistent wird individuell für Ihr Unternehmen konfiguriert und ist
              in den meisten Fällen innerhalb weniger Tage einsatzbereit – ohne technischen
              Aufwand auf Ihrer Seite.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              "Keine technische Vorkenntnis nötig",
              "Individuelle Konfiguration inklusive",
              "Onboarding durch unser Team",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          custom={0}
          className="max-w-2xl mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
            Anwendungsbereiche
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            KI Telefon KI für Unternehmen aller Branchen
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {USE_CASES.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              custom={i * 0.07}
              className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon size={17} className="text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                  {item.industry}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
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

function DemoCtaSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          custom={0}
          className="relative rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-10 lg:p-14 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-radial from-gray-100/80 to-transparent dark:from-gray-800/30 dark:to-transparent pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live-Demo verfügbar
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Sehen Sie Ihren KI Telefonassistenten in Aktion
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
              In einer kurzen Live-Demo zeigen wir Ihnen, wie der Assistent Anrufe
              entgegennimmt, Fragen beantwortet und Termine bucht – individuell für Ihr Unternehmen.
            </p>
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              <Phone size={16} />
              Kostenlose Demo ansehen
            </Link>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              Dauer: ca. 15 Minuten · Kostenlos · Unverbindlich
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FAQSectionBlock() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          custom={0}
          className="mb-10"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
            FAQ
          </p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Häufige Fragen zum KI Telefonassistenten
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.1}
          className="space-y-3"
        >
          {faqItems.map((item, i) => (
            <details
              key={i}
              className="group bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-5 overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100 list-none select-none">
                {item.question}
                <ArrowRight
                  size={14}
                  className="flex-shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-90"
                />
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pb-5">
                {item.answer}
              </p>
            </details>
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
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Bereit für Ihren KI Telefonassistenten?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Lassen Sie uns in einer kostenlosen Demo zeigen, wie der KI Anrufbeantworter
            für Unternehmen in Ihrer Branche eingesetzt wird.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5"
            >
              <Phone size={16} />
              Kostenlose Demo ansehen
            </Link>
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 transition-all duration-200"
            >
              Termin vereinbaren
              <ArrowRight size={15} />
            </Link>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {BUSINESS_INFO.name} · {BUSINESS_INFO.contact.email} · {BUSINESS_INFO.contact.phoneDisplay}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
