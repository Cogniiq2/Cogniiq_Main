import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  BadgeCheck,
  X,
  Lock,
  Sparkles,
} from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { PAGE_META, BUSINESS_INFO } from "@/lib/seo-data";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

// ── The real, verifiable credentials ──────────────────────────────────────
// Each certificate was issued directly by Anthropic — the company that builds
// Claude. Order tells the real story: from foundation to advanced architecture.
type Certificate = {
  slug: string;
  title: string;
  issuer: string;
  level: string;
  accent: string; // matches the certificate's own colour
  image: string;
  proves: string;
};

const CERTIFICATES: Certificate[] = [
  {
    slug: "claude-101",
    title: "Claude 101",
    issuer: "Anthropic",
    level: "Fundament",
    accent: "#DAD3C4",
    image: "/zertifikate/claude-101.png",
    proves:
      "Wie moderne Sprachmodelle wirklich denken, wo ihre Stärken liegen — und wo ihre Grenzen. Die Basis, ohne die jede KI-Umsetzung Blindflug bleibt.",
  },
  {
    slug: "claude-platform-101",
    title: "Claude Platform 101",
    issuer: "Anthropic",
    level: "Plattform",
    accent: "#6C97CC",
    image: "/zertifikate/claude-platform-101.png",
    proves:
      "Die Anthropic-Plattform von innen: Modelle, Kontextfenster, Sicherheit und der saubere Einsatz im Unternehmen — nicht im Spielmodus, sondern im Betrieb.",
  },
  {
    slug: "claude-code-in-action",
    title: "Claude Code in Action",
    issuer: "Anthropic",
    level: "Engineering",
    accent: "#7E9268",
    image: "/zertifikate/claude-code-in-action.png",
    proves:
      "KI, die echten Code schreibt, prüft und ausliefert. Die Grundlage dafür, dass wir Systeme schneller bauen als klassische Agenturen — ohne an Qualität zu verlieren.",
  },
  {
    slug: "model-context-protocol-advanced",
    title: "Model Context Protocol: Advanced Topics",
    issuer: "Anthropic",
    level: "Architektur",
    accent: "#C5C6DE",
    image: "/zertifikate/model-context-protocol-advanced.png",
    proves:
      "Die Architektur, mit der KI sicher an Ihre echten Tools, Daten und Prozesse angebunden wird. Das Fortgeschrittenen-Level — der Teil, den die meisten nie erreichen.",
  },
  {
    slug: "ai-fluency-for-builders",
    title: "AI Fluency for Builders",
    issuer: "CodePath.org × Anthropic",
    level: "Anwendung",
    accent: "#B9CDBF",
    image: "/zertifikate/ai-fluency-for-builders.png",
    proves:
      "KI nicht nur bedienen, sondern damit bauen — fließend, verantwortungsvoll und mit einem klaren Blick dafür, was in der Praxis trägt und was nur nach Zukunft klingt.",
  },
];

// ── Certificate lightbox ──────────────────────────────────────────────────
function Lightbox({
  cert,
  onClose,
}: {
  cert: Certificate | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (cert) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cert, onClose]);

  return (
    <AnimatePresence>
      {cert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Zertifikat: ${cert.title}`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl"
          >
            <button
              onClick={onClose}
              aria-label="Schließen"
              className="absolute -top-11 right-0 flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/70 hover:text-white transition-colors"
            >
              Schließen <X size={15} />
            </button>
            <div className="bg-white shadow-2xl">
              <img
                src={cert.image}
                alt={`Original-Zertifikat „${cert.title}" von ${cert.issuer}, ausgestellt für Lazar Popovic`}
                className="w-full h-auto block"
              />
            </div>
            <div className="flex items-center justify-between gap-4 mt-4 px-1">
              <div className="flex items-center gap-2 text-white/80">
                <BadgeCheck size={15} />
                <span className="text-xs tracking-wide">
                  Ausgestellt von {cert.issuer} · auf den Namen Lazar Popovic
                </span>
              </div>
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">
                {cert.level}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Structured data: real credentials attached to the founder ─────────────
const zertifizierungenSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${BUSINESS_INFO.website}/#lazar-popovic`,
      name: "Lazar Popovic",
      jobTitle: "Co-Founder, Cogniiq",
      worksFor: {
        "@type": "Organization",
        "@id": `${BUSINESS_INFO.website}/#organization`,
        name: BUSINESS_INFO.name,
      },
      hasCredential: CERTIFICATES.map((c) => ({
        "@type": "EducationalOccupationalCredential",
        name: c.title,
        credentialCategory: "Certificate of Completion",
        recognizedBy: {
          "@type": "Organization",
          name: c.issuer,
        },
      })),
    },
  ],
};

export function ZertifizierungenPage() {
  const [active, setActive] = useState<Certificate | null>(null);
  const openCert = useCallback((c: Certificate) => setActive(c), []);
  const closeCert = useCallback(() => setActive(null), []);

  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Zertifizierungen", url: PAGE_META.zertifizierungen.canonical },
  ];

  return (
    <>
      <PageSEO
        title={PAGE_META.zertifizierungen.title}
        description={PAGE_META.zertifizierungen.description}
        canonical={PAGE_META.zertifizierungen.canonical}
        breadcrumbs={breadcrumbs}
        additionalSchema={zertifizierungenSchema}
      />

      <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="pt-40 pb-20 px-6 lg:px-8">
          <div className="max-w-[820px] mx-auto">
            <motion.nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                Home
              </Link>
              <ChevronRight size={10} />
              <span className="text-gray-500 dark:text-gray-400">Zertifizierungen</span>
            </motion.nav>

            <motion.div
              className="flex items-center gap-2.5 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <ShieldCheck size={15} className="text-gray-400 dark:text-gray-500" />
              <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-400 dark:text-gray-600">
                Zertifiziert von Anthropic — den Machern von Claude
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-[1.06] mb-8"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            >
              Die meisten Agenturen<br />reden über KI.
              <span className="block text-gray-400 dark:text-gray-600">
                Wir haben sie uns zertifizieren lassen.
              </span>
            </motion.h1>

            <motion.p
              className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-light max-w-[600px] mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            >
              Fünf offizielle Zertifikate — ausgestellt direkt von Anthropic, dem
              Labor hinter Claude, einem der weltweit führenden KI-Systeme. Kein
              Kurs von einem Wiederverkäufer. Keine selbst ausgedachten Siegel.
              Belege von der Quelle.
            </motion.p>

            <motion.p
              className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed max-w-[600px] mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.28 }}
            >
              Wenn Sie Ihr Geschäft in fremde Hände geben, sollten es Hände sein,
              die die Technologie nicht nur benutzen, sondern beherrschen. Genau
              das steht hier — schwarz auf weiß, verifizierbar.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-2 mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.34 }}
            >
              {["5 offizielle Zertifikate", "Direkt von Anthropic", "Auf Lazar Popovic", "Öffentlich einsehbar"].map((chip) => (
                <span
                  key={chip}
                  className="inline-block px-3 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-800 tracking-wide"
                >
                  {chip}
                </span>
              ))}
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold text-sm tracking-wide hover:bg-gray-700 dark:hover:bg-white transition-colors"
              >
                Erstgespräch vereinbaren
                <ArrowRight size={14} />
              </Link>
              <a
                href="#zertifikate"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-semibold text-sm tracking-wide hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              >
                Zertifikate ansehen
              </a>
            </motion.div>
          </div>
        </section>

        {/* ── AUTHORITY BAND ────────────────────────────────────────────── */}
        <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-14">
            <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
              {[
                {
                  k: "Die Quelle, nicht der Umweg",
                  v: "Zertifiziert von Anthropic selbst — nicht von einem dazwischengeschalteten Anbieter, der die Kurse nur weiterreicht.",
                },
                {
                  k: "Vom Fundament bis zur Architektur",
                  v: "Von den Grundlagen bis zu fortgeschrittenen Themen wie dem Model Context Protocol. Der Weg, den die wenigsten zu Ende gehen.",
                },
                {
                  k: "Belegbar, nicht behauptet",
                  v: "Jedes Zertifikat ist hier im Original einsehbar — auf einen echten Namen ausgestellt. Nichts davon müssen Sie uns glauben.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.k}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.08}
                >
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2.5 leading-snug">
                    {item.k}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.v}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── THE CERTIFICATES ──────────────────────────────────────────── */}
        <section id="zertifikate" className="scroll-mt-20">
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-14 max-w-[640px]"
            >
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                Die Nachweise
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
                Fünf Zertifikate. Ein Anspruch.
              </h2>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Klicken Sie auf jedes Zertifikat, um das Original in voller Größe
                zu sehen. Alles echt. Alles auf denselben Namen. So sieht der
                Unterschied zwischen „wir kennen uns mit KI aus" und einem Beleg aus.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CERTIFICATES.map((cert, i) => (
                <motion.button
                  key={cert.slug}
                  type="button"
                  onClick={() => openCert(cert)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  custom={i * 0.06}
                  className="group text-left border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors overflow-hidden flex flex-col"
                >
                  <div
                    className="relative aspect-[11/8.5] overflow-hidden"
                    style={{ backgroundColor: cert.accent }}
                  >
                    <img
                      src={cert.image}
                      alt={`Zertifikat „${cert.title}" von ${cert.issuer}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 text-[9px] font-semibold tracking-[0.14em] uppercase text-gray-700">
                      <BadgeCheck size={11} /> Verifiziert
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-400 dark:text-gray-600">
                        {cert.issuer}
                      </span>
                      <span className="text-[10px] font-mono text-gray-300 dark:text-gray-700">
                        {cert.level}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug mb-3">
                      {cert.title}
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                      {cert.proves}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-600 group-hover:text-gray-800 dark:group-hover:text-gray-300 transition-colors">
                      Original ansehen
                      <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT IT MEANS FOR YOU ─────────────────────────────────────── */}
        <section className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-[380px_1fr] gap-12 lg:gap-20 items-start">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0}
              >
                <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                  Was das für Sie heißt
                </p>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                  Ein Zertifikat ist nur ein Blatt Papier.<br />
                  <span className="text-gray-400 dark:text-gray-600">
                    Bis Sie sehen, was daran hängt.
                  </span>
                </h2>
              </motion.div>

              <div className="space-y-8">
                {[
                  {
                    icon: Lock,
                    t: "Weniger Risiko in Ihrer Entscheidung",
                    d: "Die meisten Fehlentscheidungen bei KI-Projekten passieren, weil jemand mehr verspricht, als er versteht. Ein Beleg von der Quelle nimmt genau dieses Risiko aus dem Gespräch — bevor es Sie Zeit und Geld kostet.",
                  },
                  {
                    icon: Sparkles,
                    t: "Systeme, die halten, was sie sollen",
                    d: "Fundiertes Wissen führt zu Architekturen, die in echten Abläufen bestehen — nicht nur in der Demo. Sie bekommen Systeme, die morgen noch laufen, wenn die erste Begeisterung verflogen ist.",
                  },
                  {
                    icon: ShieldCheck,
                    t: "Ein Partner, der auf dem Laufenden bleibt",
                    d: "Diese Zertifikate sind kein Abschluss, sondern eine Momentaufnahme fortlaufender Arbeit. Wir lernen die Technologie in dem Tempo, in dem sie sich verändert — damit Sie das nicht müssen.",
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.t}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      custom={i * 0.08}
                      className="flex items-start gap-5"
                    >
                      <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                        <Icon size={15} className="text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                          {item.t}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">
                          {item.d}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOUNDER ATTRIBUTION ───────────────────────────────────────── */}
        <section className="border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center text-xl font-bold text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900">
                  L
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Lazar Popovic
                  </p>
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-400 dark:text-gray-600">
                    Gründer · KI-Automatisierung &amp; technische Integrationen
                  </p>
                </div>
              </div>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl md:border-l md:border-gray-200 md:dark:border-gray-800 md:pl-12">
                „Ich zeige diese Zertifikate nicht, um zu beeindrucken. Ich zeige
                sie, weil ich an Ihrer Stelle genau das sehen wollen würde, bevor
                ich jemandem mein Geschäft anvertraue. Alles hier ist echt, auf
                meinen Namen, und Sie können es prüfen."
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.15}
              className="mt-10"
            >
              <Link
                to="/ueber-uns"
                className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-600 hover:text-gray-800 dark:hover:text-gray-300 transition-colors underline underline-offset-4"
              >
                Mehr über die Menschen hinter Cogniiq
                <ArrowRight size={13} />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section className="border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-[780px] mx-auto px-6 lg:px-8 py-28 lg:py-36 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-6">
                Reden wir über<br />Ihr System.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-light mb-3 max-w-md mx-auto">
                Sie wissen jetzt, mit wem Sie es zu tun haben. Der nächste
                Schritt ist ein Gespräch — kein Pitch, keine Verkaufsshow.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 tracking-wide mb-14">
                30–45 Min. &middot; keine Vorbereitung nötig &middot; ehrliche Einschätzung
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold text-sm tracking-wide hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Erstgespräch vereinbaren
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/leistungen"
                  className="inline-flex items-center gap-2.5 px-8 py-4 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm tracking-wide hover:border-gray-500 dark:hover:border-gray-500 transition-colors"
                >
                  Leistungen ansehen
                </Link>
              </div>

              <p className="mt-12 text-xs text-gray-400 dark:text-gray-600 tracking-wide">
                {BUSINESS_INFO.name} &middot; {BUSINESS_INFO.address.addressLocality} &middot; {BUSINESS_INFO.contact.email}
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── BREADCRUMB (bottom) ────────────────────────────────────────── */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-6 lg:px-8 py-4">
          <div className="max-w-[1100px] mx-auto">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                Home
              </Link>
              <ChevronRight size={10} />
              <span className="text-gray-500 dark:text-gray-400">Zertifizierungen</span>
            </nav>
          </div>
        </div>
      </main>

      <Lightbox cert={active} onClose={closeCert} />
    </>
  );
}
