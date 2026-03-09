import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Phone,
  Clock,
  Calendar,
  CircleCheck as CheckCircle2,
  Shield,
  Zap,
  Building2,
  ChevronDown,
  Check,
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
  { name: "Demo", url: `${BUSINESS_INFO.website}/ki-telefonassistent/demo` },
];

const DEMO_BENEFITS = [
  { icon: Phone, label: "Live-Demo des KI Telefonassistenten" },
  { icon: Calendar, label: "Sehen Sie automatische Terminbuchung in Aktion" },
  { icon: Zap, label: "Konfiguration für Ihre Branche besprechen" },
  { icon: Clock, label: "Nur 30 Minuten, kein Verkaufsdruck" },
  { icon: Shield, label: "Kostenlos und unverbindlich" },
  { icon: Building2, label: "Individuelle Einschätzung für Ihr Unternehmen" },
];

const INDUSTRIES = [
  { value: "Handwerk / Bau", label: "Handwerk / Bau", icon: "🔧" },
  { value: "Arztpraxis / Heilberufe", label: "Arztpraxis / Heilberufe", icon: "⚕️" },
  { value: "Dienstleistungen", label: "Dienstleistungen", icon: "💼" },
  { value: "Immobilien", label: "Immobilien", icon: "🏠" },
  { value: "Agentur / Beratung", label: "Agentur / Beratung", icon: "📊" },
  { value: "Gastro / Hotel", label: "Gastro / Hotel", icon: "🍽️" },
  { value: "Sonstige", label: "Sonstige", icon: "✦" },
];

const COMPANY_SIZES = [
  { value: "1–5 Mitarbeiter", label: "1–5 Mitarbeiter", sub: "Kleinstunternehmen" },
  { value: "6–20 Mitarbeiter", label: "6–20 Mitarbeiter", sub: "Kleines Unternehmen" },
  { value: "21–50 Mitarbeiter", label: "21–50 Mitarbeiter", sub: "Mittelkleines Unternehmen" },
  { value: "51–200 Mitarbeiter", label: "51–200 Mitarbeiter", sub: "Mittelstand" },
  { value: "200+ Mitarbeiter", label: "200+ Mitarbeiter", sub: "Großunternehmen" },
];

interface PremiumSelectProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string; icon?: string; sub?: string }>;
}

function PremiumSelect({ value, onChange, placeholder, options }: PremiumSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-all duration-200 text-left
          ${open
            ? "border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800/80 shadow-sm"
            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
      >
        <span className={selected ? "text-gray-900 dark:text-gray-100 flex items-center gap-2" : "text-gray-400 dark:text-gray-500"}>
          {selected ? (
            <>
              {selected.icon && <span className="text-base leading-none">{selected.icon}</span>}
              {selected.label}
            </>
          ) : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-1.5 space-y-0.5 max-h-56 overflow-y-auto">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 text-left group
                    ${value === opt.value
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    {opt.icon && (
                      <span className="text-base leading-none flex-shrink-0">{opt.icon}</span>
                    )}
                    <span className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{opt.label}</span>
                      {opt.sub && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">{opt.sub}</span>
                      )}
                    </span>
                  </span>
                  {value === opt.value && (
                    <Check size={13} className="flex-shrink-0 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const N8N_WEBHOOK = "https://n8n.cogniiq.co/webhook/google-ads";

export function KiTelefonassistentDemoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      email,
      phone,
      company,
      industry,
      company_size: size,
      message,
      primary_interest: "KI Telefonassistent Demo",
      source: "ki-telefonassistent-demo",
      submitted_at: new Date().toISOString(),
      page_url: window.location.href,
    };

    try {
      await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {}

    setLoading(false);
    window.location.href = "https://cogniiq.de/anfrage-erhalten";
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "KI Telefonassistent Demo buchen",
    description: "Kostenlose Live-Demo des KI Telefonassistenten von Cogniiq – erleben Sie, wie KI Anrufe beantwortet und Termine bucht.",
    url: `${BUSINESS_INFO.website}/ki-telefonassistent/demo`,
    provider: {
      "@type": "Organization",
      name: BUSINESS_INFO.name,
      url: BUSINESS_INFO.website,
    },
  };

  return (
    <>
      <PageSEO
        title="KI Telefonassistent Demo buchen | Cogniiq"
        description="Kostenlose Live-Demo des KI Telefonassistenten: Erleben Sie, wie Ihre KI Anrufe beantwortet und Termine automatisch bucht. Jetzt Demo-Termin sichern."
        canonical={`${BUSINESS_INFO.website}/ki-telefonassistent/demo`}
        breadcrumbs={breadcrumbs}
        additionalSchema={schema}
      />

      <main className="min-h-screen">
        <section className="pt-32 pb-20 bg-white dark:bg-gray-950">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
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

            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-widest uppercase mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Kostenlos · Unverbindlich
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight mb-5">
                  KI Telefonassistent Demo
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-10">
                  Erleben Sie live, wie Ihre KI Anrufe beantwortet und Termine
                  automatisch bucht – individuell für Ihr Unternehmen konfiguriert.
                </p>

                <div className="space-y-3 mb-10">
                  {DEMO_BENEFITS.map((item, i) => (
                    <motion.div
                      key={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      custom={0.1 + i * 0.06}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        <item.icon size={14} className="text-gray-500 dark:text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    So läuft die Demo ab
                  </p>
                  <ol className="space-y-2.5">
                    {[
                      "Formular ausfüllen und Demo-Termin anfragen",
                      "Wir melden uns innerhalb von 24 Stunden",
                      "Live-Demo per Video: KI-Assistent in Aktion",
                      "Individuelle Konfiguration für Ihr Unternehmen besprechen",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="w-5 h-5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.15}
              >
                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-10 text-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 size={24} className="text-emerald-500" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Demo-Anfrage eingegangen
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                        Wir melden uns innerhalb von 24 Stunden, um Ihren Demo-Termin zu bestätigen.
                      </p>
                      <Link
                        to="/ki-telefonassistent"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Zurück zur Übersicht
                        <ArrowRight size={13} />
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 p-7 lg:p-8"
                    >
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                        Demo-Termin anfragen
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Kostenlos · Unverbindlich · Innerhalb von 24 Stunden Rückmeldung
                      </p>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                              Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Max Mustermann"
                              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                              E-Mail *
                            </label>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="max@firma.de"
                              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                              Telefon
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+49 123 456 789"
                              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                              Unternehmen *
                            </label>
                            <input
                              type="text"
                              required
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              placeholder="Muster GmbH"
                              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                              Branche
                            </label>
                            <PremiumSelect
                              value={industry}
                              onChange={setIndustry}
                              placeholder="Bitte wählen"
                              options={INDUSTRIES}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                              Unternehmensgröße
                            </label>
                            <PremiumSelect
                              value={size}
                              onChange={setSize}
                              placeholder="Bitte wählen"
                              options={COMPANY_SIZES}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                            Ihre Situation (optional)
                          </label>
                          <textarea
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Wie viele Anrufe erhalten Sie täglich? Was ist Ihr Hauptproblem?"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Phone size={15} />
                          )}
                          {loading ? "Wird gesendet…" : "Kostenlose Demo anfragen"}
                        </button>

                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                          Kein Verkaufsdruck · Kostenlos · Rückmeldung innerhalb von 24&nbsp;Stunden
                        </p>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                Das erwartet Sie in der Demo
              </p>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-10">
                Was wir Ihnen zeigen
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Phone,
                  title: "Live-Telefonat",
                  desc: "Erleben Sie einen echten Anruf, den der KI Assistent entgegennimmt und beantwortet.",
                },
                {
                  icon: Calendar,
                  title: "Automatische Terminbuchung",
                  desc: "Sehen Sie, wie der Assistent direkt einen Termin in den Kalender bucht.",
                },
                {
                  icon: Zap,
                  title: "Individuelle Konfiguration",
                  desc: "Wir besprechen, wie der Assistent für Ihre Branche und Ihr Unternehmen eingerichtet wird.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-30px" }}
                  variants={fadeUp}
                  custom={i * 0.08}
                  className="p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 flex items-center justify-center mb-4">
                    <item.icon size={17} className="text-gray-500 dark:text-gray-400" />
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
      </main>
    </>
  );
}
