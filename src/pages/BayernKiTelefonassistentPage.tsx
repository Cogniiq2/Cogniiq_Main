import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, Clock, Calendar, CircleCheck as CheckCircle2, MapPin, Zap, Users, Shield, Wrench, Stethoscope, Chrome as Home, Briefcase, Building2 } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const breadcrumbs = [
  { name: "Home", url: BUSINESS_INFO.website },
  { name: "Bayern", url: `${BUSINESS_INFO.website}/bayern` },
  { name: "KI Telefonassistent", url: `${BUSINESS_INFO.website}/bayern/ki-telefonassistent` },
];

const faqItems = [
  {
    question: "Gibt es den KI Telefonassistenten speziell für bayerische Unternehmen?",
    answer: "Ja. Wir konfigurieren den Assistenten auf die Bedürfnisse Ihrer Branche und Region. Als bayerisches Unternehmen kennen wir die lokalen Anforderungen des Mittelstands.",
  },
  {
    question: "Kann der Assistent auch Bayerisch oder regionale Dialekte verstehen?",
    answer: "Der Assistent ist auf Hochdeutsch ausgelegt und kommt mit regionalem Akzent in aller Regel gut zurecht. Bei sehr starkem Dialekt fragt er nach, statt zu raten – das prüfen wir in der Testphase mit echten Szenarien.",
  },
  {
    question: "Wie lange dauert die Einrichtung für ein Unternehmen in Bayern?",
    // [[CLAIM: verify — Einrichtungsdauer 1–2 Wochen bestätigen]]
    answer: "Die Basisimplementierung dauert in der Regel 1–2 Wochen. Wir konfigurieren den Assistenten auf Ihre Branche, Öffnungszeiten und typische Anfragen – live geht er erst nach Ihrer Freigabe.",
  },
  {
    question: "Für welche bayerischen Branchen eignet sich der KI Telefonassistent?",
    answer: "Besonders für Betriebe, bei denen Telefon und eigentliche Arbeit um dieselben Hände konkurrieren: Handwerksbetriebe, Arztpraxen, Immobilienmakler, Dienstleister und mittelständische Unternehmen – in den Städten wie im ländlichen Bayern.",
  },
  {
    question: "Worauf müssen Sie bei DSGVO und KI-Telefonie in Deutschland achten?",
    answer: "Ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO gehört zur Einrichtung. Gespräche werden nicht aufgezeichnet – gespeichert wird ausschließlich das strukturierte Ergebnis. Ihre Daten werden nicht zum Training von Modellen verwendet.",
  },
  {
    question: "Wie erhalte ich eine Demo für mein Unternehmen in Bayern?",
    answer: "Nutzen Sie das Formular auf unserer Demo-Seite oder rufen Sie uns an. Wir zeigen Ihnen in einer kostenlosen Live-Demo, wie der Assistent für Ihr Unternehmen funktioniert.",
  },
];

const BAVARIAN_CITIES = [
  "München", "Nürnberg", "Augsburg", "Regensburg", "Ingolstadt",
  "Würzburg", "Erlangen", "Fürth", "Bayreuth", "Landshut",
];

const USE_CASES = [
  {
    icon: Wrench,
    industry: "Handwerk & Bau",
    desc: "Bayerische Handwerksbetriebe – Terminanfragen automatisch entgegennehmen, auch wenn Sie auf der Baustelle sind.",
  },
  {
    icon: Stethoscope,
    industry: "Arztpraxen & Heilberufe",
    desc: "Patientenanfragen, Terminbuchungen und Auskünfte automatisieren – mehr Zeit für die Patientenversorgung.",
  },
  {
    icon: Briefcase,
    industry: "Dienstleister",
    desc: "Erstanfragen qualifizieren, Rückrufe einplanen und Kundendaten automatisch erfassen – bayernweit.",
  },
  {
    icon: Home,
    industry: "Immobilien",
    desc: "Besichtigungstermine für Objekte in ganz Bayern buchen – auch außerhalb der Bürozeiten.",
  },
  {
    icon: Building2,
    industry: "Mittelstand",
    desc: "Für mittelständische Unternehmen in Bayern: skalierbarer Telefonservice ohne zusätzliches Personal.",
  },
  {
    icon: Briefcase,
    industry: "Agenturen & Berater",
    desc: "Erstberatungsgespräche buchen, Kundenanliegen erfassen und an die richtige Stelle weiterleiten.",
  },
];

export function BayernKiTelefonassistentPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${BUSINESS_INFO.website}/#localbusiness`,
        name: BUSINESS_INFO.name,
        url: BUSINESS_INFO.website,
        telephone: BUSINESS_INFO.contact.phone,
        email: BUSINESS_INFO.contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS_INFO.address.streetAddress,
          addressLocality: BUSINESS_INFO.address.addressLocality,
          postalCode: BUSINESS_INFO.address.postalCode,
          addressCountry: BUSINESS_INFO.address.addressCountry,
        },
        areaServed: [
          { "@type": "State", name: "Bayern" },
          { "@type": "Country", name: "Deutschland" },
        ],
      },
      {
        "@type": "Service",
        name: "KI Telefonassistent für Unternehmen in Bayern",
        description: "KI Telefonassistent für bayerische Unternehmen: Anrufe automatisch beantworten, Termine buchen, auch außerhalb regulärer Geschäftszeiten erreichbar.",
        url: `${BUSINESS_INFO.website}/bayern/ki-telefonassistent`,
        provider: { "@id": `${BUSINESS_INFO.website}/#localbusiness` },
        areaServed: { "@type": "State", name: "Bayern" },
      },
      // FAQPage wird von PageSEO aus `faqItems` erzeugt und darf hier nicht
      // noch einmal stehen — sonst läge derselbe Block zweimal im Dokument.
    ],
  };

  return (
    <>
      <PageSEO
        title="KI Telefonassistent für Unternehmen in Bayern | Cogniiq"
        description="KI Telefonassistent für bayerische Unternehmen: nimmt Anrufe an, bucht Termine nach Ihren Regeln und entlastet Ihr Team – auch außerhalb der Öffnungszeiten, ohne Gesprächsaufzeichnung."
        canonical={`${BUSINESS_INFO.website}/bayern/ki-telefonassistent`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={schema}
      />

      <main className="min-h-screen">
        <HeroSection />
        <TrustSection />
        <IntroSection />
        <UseCasesSection />
        <BenefitsSection />
        <CitiesSection />
        <DemoCtaSection />
        <FAQSection />
        <FinalCtaSection />
      </main>
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-gray-100/60 to-transparent dark:from-gray-800/20 dark:to-transparent rounded-full translate-x-1/3 -translate-y-1/4" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <motion.nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-8 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.url} className="flex items-center gap-1.5">
              {i < breadcrumbs.length - 1 ? (
                <>
                  <Link
                    to={crumb.url.replace(BUSINESS_INFO.website, "") || "/"}
                    className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {crumb.name}
                  </Link>
                  <ArrowRight size={11} />
                </>
              ) : (
                <span className="text-gray-600 dark:text-gray-300">{crumb.name}</span>
              )}
            </span>
          ))}
        </motion.nav>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-widest uppercase mb-6">
            <MapPin size={11} />
            Bayern · KI Automation · Mittelstand
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-[1.08] tracking-tight mb-6">
            KI Telefonassistent
            <br />
            <span className="text-gray-500 dark:text-gray-400">für Unternehmen in Bayern</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-10">
            Beantwortet Anrufe automatisch, spricht mit Ihren Kunden und bucht Termine
            direkt in Ihren Kalender – für bayerische Unternehmen, auch außerhalb der Öffnungszeiten.
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
              Unverbindliches Analysegespräch vereinbaren
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex flex-wrap gap-6">
            {[
              { icon: MapPin, label: "Bayernweit verfügbar" },
              { icon: Clock, label: "Auch außerhalb der Öffnungszeiten erreichbar" },
              { icon: Calendar, label: "Termine automatisch" },
              { icon: Shield, label: "Keine Gesprächsaufzeichnung" },
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

function TrustSection() {
  return (
    <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          {[
            "Spezialisiert auf den bayerischen Mittelstand",
            "Keine Gesprächsaufzeichnung",
            "Individuelle Konfiguration",
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

function IntroSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
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
              KI Automation in Bayern
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-6">
              Der automatische Telefonservice
              für den bayerischen Mittelstand
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                Bayerische Unternehmen – vom Handwerksbetrieb in Landsberg bis zur Arztpraxis
                in Nürnberg – stehen vor der gleichen Herausforderung: Anrufe kommen im
                ungünstigsten Moment, Personal ist beschäftigt, Kunden werden vertröstet.
              </p>
              <p>
                Der KI Telefonassistent von Cogniiq setzt genau dort an. Als bayerisches
                Unternehmen kennen wir die Anforderungen des Mittelstands. Wir konfigurieren
                den Assistenten individuell – auf Ihre Branche, Ihre Öffnungszeiten und
                Ihre häufigen Anfragen.
              </p>
              <p>
                Das Ergebnis: Anrufe werden angenommen, wenn Ihr Team gebunden ist.
                Termine werden nach Ihren Regeln gebucht. Ihr Team konzentriert sich
                auf die Arbeit, für die es gebraucht wird.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            custom={0.15}
            className="space-y-3"
          >
            {[
              { icon: Phone, label: "Nimmt eingehende Anrufe automatisch entgegen" },
              { icon: Zap, label: "Versteht Kundenanfragen auf Hochdeutsch" },
              { icon: CheckCircle2, label: "Beantwortet Fragen und gibt Informationen weiter" },
              { icon: Calendar, label: "Bucht Termine direkt in Ihren Kalender" },
              { icon: Clock, label: "Erreichbar auch an Feiertagen in Bayern" },
              { icon: Shield, label: "Keine Gesprächsaufzeichnung" },
              { icon: Zap, label: "Integration mit CRM und Automationen" },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.05}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
              >
                <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
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
            Für welche bayerischen
            Unternehmen eignet sich der Assistent?
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
            Was bayerische Unternehmen gewinnen
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Phone,
              title: "Erreichbar, wenn niemand abnehmen kann",
              desc: "Anrufe werden angenommen, auch wenn Ihr Team auf der Baustelle, beim Patienten oder im Termin ist – ohne Besetztzeichen, ohne Warteschleife.",
            },
            {
              icon: Calendar,
              title: "Termine nach Ihren Regeln",
              desc: "Der Assistent bucht Termine in Ihren Kalender oder legt sie zur Bestätigung vor – nach den Regeln, die Sie vorgeben.",
            },
            {
              icon: Clock,
              title: "Auch an bayerischen Feiertagen",
              desc: "An Feiertagen wie Fronleichnam oder dem bayerischen Nationalfeiertag bleibt Ihr Telefonservice aktiv.",
            },
            {
              icon: Users,
              title: "Entlastet Ihr Personal",
              desc: "Routineanfragen übernimmt die KI – Ihr Team konzentriert sich auf wertschöpfende Aufgaben.",
            },
            {
              icon: Shield,
              title: "Datenschutzorientiert umgesetzt",
              desc: "Auftragsverarbeitungsvertrag nach Art. 28 DSGVO gehört zur Einrichtung. Gespräche werden nicht aufgezeichnet.",
            },
            {
              icon: Zap,
              title: "Schnell implementiert",
              // [[CLAIM: verify — Einrichtungsdauer 1–2 Wochen bestätigen]]
              desc: "In der Regel ist Ihr individuell konfigurierter Assistent innerhalb von 1–2 Wochen einsatzbereit – live geht er erst nach Ihrer Freigabe.",
            },
          ].map((item, i) => (
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

function CitiesSection() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          custom={0}
          className="mb-8"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Bayernweit verfügbar
          </p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            KI Telefonassistent für alle Regionen Bayerns
          </h2>
        </motion.div>

        <div className="flex flex-wrap gap-2">
          {BAVARIAN_CITIES.map((city, i) => (
            <motion.div
              key={city}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.04}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400"
            >
              <MapPin size={12} className="text-gray-400 dark:text-gray-500" />
              {city}
            </motion.div>
          ))}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={BAVARIAN_CITIES.length * 0.04}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-500 italic"
          >
            und alle weiteren Regionen
          </motion.div>
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
              <MapPin size={11} />
              Bayern · Kostenlose Demo
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Sehen Sie Ihren KI Telefonassistenten live in Aktion
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
              In einer kostenlosen Demo zeigen wir Ihnen, wie der KI Assistent für
              Ihr bayerisches Unternehmen eingerichtet wird – individuell auf Ihre
              Branche und Ihre Anforderungen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/ki-telefonassistent/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              >
                <Phone size={16} />
                Kostenlose Demo buchen
              </Link>
              <Link
                to="/kontakt"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 transition-all duration-200"
              >
                Termin vereinbaren
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FAQSection() {
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
            Häufige Fragen – KI Telefonassistent Bayern
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
            KI Telefonassistent für Ihr Unternehmen in Bayern
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Lassen Sie uns in einem kostenlosen Gespräch klären, wie der KI Assistent
            in Ihrem Unternehmen eingesetzt werden kann. Wir kennen die Anforderungen
            bayerischer Unternehmen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
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
              Unverbindliches Analysegespräch vereinbaren
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { href: "/ki-telefonassistent", label: "KI Telefonassistent (Deutschland)" },
              { href: "/bayern", label: "KI Automation Bayern" },
              { href: "/leistungen", label: "Alle Leistungen" },
            ].map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {link.label}
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>

          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
            {BUSINESS_INFO.name} · {BUSINESS_INFO.address.addressLocality} · {BUSINESS_INFO.contact.email}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
