import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Globe, Phone, Zap, Mail, MapPin, Clock, CircleCheck as CheckCircle2 } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO, getGoogleMapsUrl, getGoogleMapsEmbedUrl } from "@/lib/seo-data";
import { ContactSection } from "@/components/ContactSection";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const FOCUS_CARDS = [
  {
    icon: Zap,
    title: "KI-Automatisierung",
    description:
      "Unternehmen, die Prozesse automatisieren und manuelle Arbeit systematisch reduzieren wollen.",
    href: "/leistungen",
    label: "Mehr erfahren",
  },
  {
    icon: Globe,
    title: "Webdesign & Conversion",
    description:
      "Unternehmen, die mehr Anfragen und Kunden über ihre Website gewinnen wollen.",
    href: "/leistungen",
    label: "Mehr erfahren",
  },
  {
    icon: Phone,
    title: "KI-Telefonassistent",
    description:
      "Unternehmen mit vielen Anrufen, Terminen oder Kundenanfragen die automatisiert bearbeitet werden sollen.",
    href: "/leistungen",
    label: "Mehr erfahren",
  },
];

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Anfrage senden",
    description: "Kurze Beschreibung Ihrer Situation – kein Aufwand, keine Vorbereitung nötig.",
  },
  {
    number: "02",
    title: "Kurzanalyse Ihres Status quo",
    description: "Wir analysieren Ihren Fall strukturiert und bereiten das Gespräch vor.",
  },
  {
    number: "03",
    title: "Strategiegespräch (Video)",
    description: "30–45 Minuten fokussiertes Gespräch über konkrete Potenziale und nächste Schritte.",
  },
  {
    number: "04",
    title: "Klare Empfehlung & nächste Schritte",
    description: "Sie erhalten eine ehrliche Einschätzung – kein Pitch, keine Verkaufsveranstaltung.",
  },
];

const REGIONS = [
  { label: "KI Agentur Bayreuth", href: "/bayreuth" },
  { label: "KI Agentur München", href: "/muenchen" },
  { label: "KI Agentur Regensburg", href: "/regensburg" },
  { label: "KI Agentur Deutschland", href: "/deutschland" },
];

const SERVICES_LINKS = [
  { label: "Webdesign", href: "/leistungen" },
  { label: "KI-Telefonassistent", href: "/leistungen" },
  { label: "Automatisierung", href: "/leistungen" },
];

const BRANCHEN_ITEMS = [
  { label: "Arztpraxis Bayreuth", href: "/webdesign-arzt-bayreuth" },
  { label: "Gastronomie München", href: "/webdesign-gastronomie-muenchen" },
  { label: "Immobilien Regensburg", href: "/webdesign-immobilien-regensburg" },
];

export function KontaktPage() {
  return (
    <>
      <PageSEO
        title="KI Beratung & Kontakt | Cogniiq AI Agentur Deutschland"
        description="Kontaktieren Sie Cogniiq für KI-Automatisierung, Webdesign und KI-Telefonassistent. Analysegespräch für Unternehmen in Deutschland, München, Regensburg und Bayreuth."
        canonical="https://cogniiq.de/kontakt"
        breadcrumbs={[
          { name: "Start", url: "https://cogniiq.de" },
          { name: "Kontakt", url: "https://cogniiq.de/kontakt" },
        ]}
      />

      <div className="min-h-screen bg-white dark:bg-gray-950">

        {/* SECTION 1: HERO */}
        <section className="relative pt-32 pb-24 px-6 lg:px-8 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(15,23,42,0.04) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 60%, rgba(2,132,199,0.03) 0%, transparent 55%)',
            }}
          />
          <div className="relative max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="flex items-center gap-2 mb-8"
            >
              <Link
                to="/"
                className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Start
              </Link>
              <ChevronRight size={10} className="text-gray-300" />
              <span className="text-[11px] text-gray-700 font-medium">Kontakt</span>
            </motion.div>

            <div className="grid lg:grid-cols-[1fr_420px] gap-16 lg:gap-20 items-start">
              {/* Left: Headline */}
              <div>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.04}
                  className="flex items-center gap-2 mb-5"
                >
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-500">
                      Analysegespräch
                    </span>
                  </div>
                </motion.div>

                <motion.h1
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.08}
                  className="text-4xl sm:text-5xl lg:text-[3.6rem] font-bold text-gray-900 leading-[1.06] tracking-[-0.024em] mb-6"
                >
                  KI-Systeme für Ihr
                  <br />
                  <span className="text-gray-200">Unternehmen besprechen</span>
                </motion.h1>

                <motion.p
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.13}
                  className="text-[16px] text-gray-500 leading-[1.75] mb-8 max-w-[560px]"
                >
                  In einem strukturierten Analysegespräch prüfen wir, wo KI-Automatisierung,
                  Webdesign oder digitale Systeme in Ihrem Unternehmen konkret Umsatz,
                  Effizienz und Anfragen steigern können.
                </motion.p>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.18}
                  className="flex flex-col sm:flex-row gap-3 mb-10"
                >
                  <a
                    href="#kontaktformular"
                    className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gray-950 text-white text-[13.5px] font-semibold hover:bg-gray-800 transition-colors"
                    style={{ borderRadius: '4px' }}
                  >
                    Analysegespräch starten
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </a>
                  <Link
                    to="/leistungen"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                  >
                    Leistungen ansehen
                    <ArrowRight size={13} className="opacity-50" />
                  </Link>
                </motion.div>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.23}
                  className="flex flex-wrap gap-x-6 gap-y-2.5"
                >
                  {[
                    { icon: Clock, text: '30–45 Min. Strategiegespräch' },
                    { icon: CheckCircle2, text: 'Einschätzung statt Verkauf' },
                    { icon: MapPin, text: 'Für Unternehmen in Deutschland' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <Icon size={12} className="text-gray-300 flex-shrink-0" />
                      <span className="text-[12.5px] text-gray-500">{text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right: Value card */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.14}
                className="hidden lg:block"
              >
                <div className="bg-gray-950 rounded-2xl p-8 relative overflow-hidden">
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 70% 20%, rgba(2,132,199,0.09) 0%, transparent 55%)' }}
                  />
                  <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(2,132,199,0.35), transparent)' }}
                  />

                  <div className="relative">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-4">
                      Was Sie mitnehmen
                    </p>

                    <div className="space-y-4 mb-7">
                      {[
                        { n: '01', text: 'Klares Bild Ihrer Verlustquellen' },
                        { n: '02', text: 'Konkrete Automatisierungspotenziale' },
                        { n: '03', text: 'Realistische ROI-Einschätzung' },
                        { n: '04', text: 'Klarer nächster Schritt — kein Pitch' },
                      ].map(({ n, text }) => (
                        <div key={n} className="flex items-start gap-3.5">
                          <span className="text-[10px] font-medium text-gray-700 tabular-nums mt-0.5 min-w-[20px]">{n}</span>
                          <p className="text-[13px] text-gray-400 leading-snug">{text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="w-full h-px bg-white/[0.05] mb-6" />

                    <div className="flex items-center gap-2 mb-2">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Garantien
                      </span>
                    </div>
                    <p className="text-[11.5px] text-gray-600 leading-relaxed">
                      Antwort innerhalb 24h · Go-Live in 14 Tagen oder Geld zurück ·
                      kein Formular-Loop — persönliches Gespräch
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 2: FÜR WEN */}
        <section className="py-20 px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                Für wen
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Für welche Unternehmen<br />
                <span className="font-light text-gray-500 dark:text-gray-400">Cogniiq arbeitet</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {FOCUS_CARDS.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={fadeUp}
                    custom={i * 0.07}
                    className="group relative bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-7 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-gray-50 flex items-center justify-center mb-5">
                      <Icon size={18} className="text-white dark:text-gray-900" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                      {card.description}
                    </p>
                    <Link
                      to={card.href}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {card.label}
                      <ArrowRight size={12} />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: ABLAUF */}
        <section className="py-20 px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-16 lg:gap-24 items-start">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={0}
                className="lg:sticky lg:top-32"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                  Ablauf
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight mb-5">
                  So läuft das<br />
                  <span className="font-light text-gray-500 dark:text-gray-400">Analysegespräch ab</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Keine Vorbereitung nötig. Wir analysieren Ihre Situation strukturiert
                  und zeigen konkrete Möglichkeiten in Ihrem spezifischen Kontext.
                </p>
              </motion.div>

              <div className="space-y-0">
                {PROCESS_STEPS.map((step, i) => (
                  <motion.div
                    key={step.number}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={fadeUp}
                    custom={i * 0.08}
                    className="relative flex gap-6 pb-10 last:pb-0"
                  >
                    {i < PROCESS_STEPS.length - 1 && (
                      <div className="absolute left-[19px] top-10 w-px h-full bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-700" />
                    )}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wide">
                        {step.number}
                      </span>
                    </div>
                    <div className="pt-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: KONTAKTFORMULAR */}
        <div id="kontaktformular" className="scroll-mt-20">
          <ContactSection />
        </div>

        {/* SECTION 5: STANDORT & KONTAKT */}
        <section className="py-20 px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                Standort
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Direkter Kontakt
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0.05}
                className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 space-y-7"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500 mb-4">
                    Adresse
                  </p>
                  <a
                    href={getGoogleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                      <MapPin size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                        {BUSINESS_INFO.address.streetAddress}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.addressLocality}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Deutschland</p>
                    </div>
                  </a>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-7 space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500 mb-4">
                    Kontakt
                  </p>
                  <a
                    href={`mailto:${BUSINESS_INFO.contact.email}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                      <Mail size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {BUSINESS_INFO.contact.email}
                    </span>
                  </a>
                  <a
                    href={`tel:${BUSINESS_INFO.contact.phone}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                      <Phone size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {BUSINESS_INFO.contact.phoneDisplay}
                    </span>
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0.1}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[320px]"
              >
                <iframe
                  src={getGoogleMapsEmbedUrl()}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "320px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Cogniiq Standort Bayreuth"
                  className="grayscale hover:grayscale-0 transition-all duration-500"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 6 + 7: REGIONEN & LEISTUNGEN */}
        <section className="py-20 px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="mb-10"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                Regionen & Leistungen
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Beratung für Unternehmen<br />
                <span className="font-light text-gray-500 dark:text-gray-400">in ganz Deutschland</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0.04}
                className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 p-7"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500 mb-4">
                  Standorte
                </p>
                <ul className="space-y-2">
                  {REGIONS.map((r) => (
                    <li key={r.href}>
                      <Link
                        to={r.href}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                      >
                        <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                        {r.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0.08}
                className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 p-7"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500 mb-4">
                  Unsere Systeme
                </p>
                <ul className="space-y-2">
                  {SERVICES_LINKS.map((s) => (
                    <li key={s.label}>
                      <Link
                        to={s.href}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                      >
                        <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0.12}
                className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 p-7"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500 mb-4">
                  Branchen
                </p>
                <ul className="space-y-2">
                  {BRANCHEN_ITEMS.map((b) => (
                    <li key={b.label}>
                      <Link
                        to={b.href}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                      >
                        <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                        {b.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 8: FINAL CTA */}
        <section className="py-20 px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="max-w-[640px]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
                Analysegespräch
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight mb-5">
                KI-Potenziale in Ihrem<br />
                <span className="font-light text-gray-500 dark:text-gray-400">Unternehmen erkennen</span>
              </h2>
              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                In einem kurzen Analysegespräch zeigen wir, wo digitale Systeme konkret
                Umsatz, Effizienz und Wachstum steigern können.
              </p>
              <a
                href="#kontaktformular"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors duration-200"
              >
                Analysegespräch starten
                <ArrowRight size={15} />
              </a>
            </motion.div>
          </div>
        </section>

      </div>
    </>
  );
}
