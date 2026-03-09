import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, Clock, Calendar, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Zap, Users, TrendingUp, Shield, Building2, Stethoscope, Wrench, Chrome as Home, Briefcase } from "lucide-react";
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
    question: "Wie funktioniert der KI Telefonassistent?",
    answer: "Der KI Telefonassistent nimmt eingehende Anrufe automatisch entgegen, versteht das Anliegen des Anrufers und beantwortet Fragen, gibt Informationen weiter oder bucht direkt Termine in Ihren Kalender – vollautomatisch, rund um die Uhr.",
  },
  {
    question: "Kann der Assistent auch außerhalb der Öffnungszeiten arbeiten?",
    answer: "Ja. Der KI Telefonassistent ist 24/7 erreichbar. Kunden, die abends oder am Wochenende anrufen, werden professionell betreut und können direkt Termine buchen.",
  },
  {
    question: "In welche Systeme lässt sich der Assistent integrieren?",
    answer: "Der Assistent lässt sich mit gängigen Kalendersystemen (Google Calendar, Outlook), CRM-Systemen und Automationstools wie Make oder Zapier verbinden.",
  },
  {
    question: "Ist die KI auf mein Unternehmen trainiert?",
    answer: "Ja. Wir konfigurieren den Assistenten individuell auf Ihre Branche, Ihre häufigen Anfragen und Ihre Unternehmenssprache. Er klingt professionell und passt zu Ihrer Marke.",
  },
  {
    question: "Für welche Branchen eignet sich der KI Telefonassistent?",
    answer: "Besonders geeignet für Handwerker, Arztpraxen, Dienstleister, Immobilienbüros und Agenturen – also überall dort, wo viele Anrufe beantwortet werden müssen.",
  },
  {
    question: "Was kostet ein KI Telefonassistent?",
    answer: "Die Kosten hängen von Umfang und Integrationen ab. Buchen Sie eine kostenlose Demo, um ein individuelles Angebot zu erhalten.",
  },
];

const PROBLEMS = [
  {
    icon: Phone,
    title: "Verpasste Anrufe",
    desc: "Jeder nicht beantwortete Anruf ist ein potenziell verlorener Kunde – gerade in Stoßzeiten oder bei Abwesenheit.",
  },
  {
    icon: AlertCircle,
    title: "Verlorene Kunden",
    desc: "Kunden, die niemanden erreichen, rufen beim Wettbewerber an. Ohne 24/7-Erreichbarkeit verlieren Sie Aufträge.",
  },
  {
    icon: Users,
    title: "Überlastete Mitarbeiter",
    desc: "Routineanfragen binden wertvolle Personalressourcen, die eigentlich für wichtigere Aufgaben gebraucht werden.",
  },
  {
    icon: Clock,
    title: "Anfragen außerhalb der Öffnungszeiten",
    desc: "Ein Großteil der Anrufe kommt abends, früh morgens oder am Wochenende – genau dann, wenn niemand da ist.",
  },
];

const FEATURES = [
  { icon: Phone, label: "Nimmt eingehende Anrufe automatisch entgegen" },
  { icon: Zap, label: "Versteht Kundenanfragen dank moderner KI" },
  { icon: CheckCircle2, label: "Beantwortet Fragen und gibt Informationen weiter" },
  { icon: Calendar, label: "Bucht Termine direkt in Ihren Kalender" },
  { icon: Clock, label: "Funktioniert rund um die Uhr, 365 Tage" },
  { icon: Shield, label: "Verbindet sich mit CRM und Automationen" },
];

const BENEFITS = [
  {
    icon: Phone,
    title: "Nie wieder Anrufe verpassen",
    desc: "Jeder Anruf wird professionell beantwortet – auch wenn Ihr Team beschäftigt oder außer Haus ist.",
  },
  {
    icon: Calendar,
    title: "Mehr Termine automatisch",
    desc: "Der Assistent bucht Termine selbstständig und füllt Ihren Kalender ohne manuellen Aufwand.",
  },
  {
    icon: Clock,
    title: "24/7 Telefonservice",
    desc: "Kunden erreichen Ihr Unternehmen rund um die Uhr – an Wochentagen, Wochenenden und Feiertagen.",
  },
  {
    icon: TrendingUp,
    title: "Spart Personal und Zeit",
    desc: "Routineanfragen werden automatisiert – Ihr Team kann sich auf das Wesentliche konzentrieren.",
  },
  {
    icon: Users,
    title: "Skalierbarer Kundenservice",
    desc: "Ob 10 oder 1.000 Anrufe täglich – der Assistent skaliert mit Ihrem Wachstum ohne Mehrkosten.",
  },
  {
    icon: Shield,
    title: "Professioneller erster Eindruck",
    desc: "Jeder Anrufer wird kompetent empfangen – das stärkt Vertrauen und Markenbild.",
  },
];

const USE_CASES = [
  { icon: Wrench, industry: "Handwerker", desc: "Terminanfragen automatisch entgegennehmen und in den Kalender buchen – auch wenn Sie auf der Baustelle sind." },
  { icon: Stethoscope, industry: "Arztpraxen", desc: "Patientenanfragen, Terminbuchungen und Auskünfte automatisieren – Entlastung für das Praxisteam." },
  { icon: Briefcase, industry: "Dienstleister", desc: "Erstanfragen qualifizieren, Rückrufe einplanen und Kundendaten automatisch erfassen." },
  { icon: Home, industry: "Immobilien", desc: "Besichtigungstermine buchen und Exposé-Anfragen entgegennehmen – vollautomatisch." },
  { icon: Building2, industry: "Agenturen", desc: "Erstberatungsgespräche buchen, Kundenanliegen erfassen und an die richtige Stelle weiterleiten." },
];

export function KiTelefonassistentPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "KI Telefonassistent für Unternehmen",
        description: "Automatischer KI-Telefonassistent der Anrufe beantwortet, Fragen klärt und Termine bucht – 24/7.",
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
        <BenefitsSection />
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
            KI Automation · Mittelstand
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-[1.08] tracking-tight mb-6">
            KI Telefonassistent
            <br />
            <span className="text-gray-500 dark:text-gray-400">für Unternehmen</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-10">
            Beantwortet Anrufe automatisch, spricht mit Kunden und bucht Termine
            direkt in Ihren Kalender – rund um die Uhr, ohne Personal.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              <Phone size={16} />
              Kostenlose Demo buchen
            </Link>
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-all duration-200"
            >
              Termin vereinbaren
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex flex-wrap gap-6">
            {[
              { icon: Phone, label: "KI beantwortet Anrufe" },
              { icon: Clock, label: "24/7 erreichbar" },
              { icon: Calendar, label: "Termine automatisch" },
              { icon: Users, label: "Spart Personalzeit" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.2 + i * 0.07}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
              >
                <item.icon size={14} className="text-gray-400 dark:text-gray-500" />
                {item.label}
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
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          {[
            "KI-Automation für den Mittelstand",
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
          className="max-w-2xl mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
            Das Problem
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">
            Jeder verpasste Anruf ist ein verlorener Auftrag
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Deutsche Unternehmen verlieren täglich potenzielle Kunden – nicht weil ihr Service
            schlecht ist, sondern weil niemand ans Telefon geht.
          </p>
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
              Ihr KI Telefonassistent
              <br />
              arbeitet rund um die Uhr
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
              Der KI Telefonassistent von Cogniiq nimmt Anrufe automatisch entgegen, versteht das
              Anliegen Ihrer Kunden und handelt sofort – ob Terminbuchung, Auskunft oder
              Weitervermittlung.
            </p>
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5"
            >
              Demo erleben
              <ArrowRight size={15} />
            </Link>
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
            Was Ihr Unternehmen gewinnt
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
            Für welche Branchen eignet
            sich der KI Telefonassistent?
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
              In einer kostenlosen Demo zeigen wir Ihnen live, wie Ihr KI Assistent Anrufe
              entgegennimmt, Fragen beantwortet und Termine bucht.
            </p>
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              <Phone size={16} />
              Kostenlose Demo buchen
            </Link>
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
            Lassen Sie uns in einem kostenlosen Gespräch klären, wie der KI Assistent
            in Ihrem Unternehmen eingesetzt werden kann.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/ki-telefonassistent/demo"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5"
            >
              <Phone size={16} />
              Kostenlose Demo buchen
            </Link>
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 transition-all duration-200"
            >
              Termin vereinbaren
              <ArrowRight size={15} />
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
            {BUSINESS_INFO.name} · {BUSINESS_INFO.contact.email} · {BUSINESS_INFO.contact.phoneDisplay}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
