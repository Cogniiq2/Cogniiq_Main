import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, Clock, Calendar, CircleCheck as CheckCircle2, Shield, Zap, Building2 } from "lucide-react";
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
  "Handwerk / Bau",
  "Arztpraxis / Heilberufe",
  "Dienstleistungen",
  "Immobilien",
  "Agentur / Beratung",
  "Gastro / Hotel",
  "Sonstige",
];

const COMPANY_SIZES = [
  "1–5 Mitarbeiter",
  "6–20 Mitarbeiter",
  "21–50 Mitarbeiter",
  "51–200 Mitarbeiter",
  "200+ Mitarbeiter",
];

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

    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
          message: `Branche: ${industry}\nUnternehmensgröße: ${size}\n\n${message}`,
          primaryInterest: "KI Telefonassistent Demo",
          source: "ki-telefonassistent-demo",
        }),
      });
    } catch {}

    setLoading(false);
    setSent(true);
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
                {sent ? (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-10 text-center">
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
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 p-7 lg:p-8">
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
                          <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors appearance-none"
                          >
                            <option value="">Bitte wählen</option>
                            {INDUSTRIES.map((ind) => (
                              <option key={ind} value={ind}>{ind}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                            Unternehmensgröße
                          </label>
                          <select
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors appearance-none"
                          >
                            <option value="">Bitte wählen</option>
                            {COMPANY_SIZES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
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
                  </div>
                )}
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
