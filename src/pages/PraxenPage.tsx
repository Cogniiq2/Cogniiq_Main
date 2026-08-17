// ─────────────────────────────────────────────────────────────────────────────
// /praxen — Healthcare-Einstiegsseite (Positionierung Option B).
//
// In sich geschlossene Journey: von hier geht es ausschließlich in
// Gesundheits-Inhalte (Segmente, Kosten, Stadtseiten, Service) — keine Links
// in Hotel- oder Restaurant-Inhalte.
//
// Der Text stammt vollständig aus bereits geprüften, geteilten Modulen
// (telefonassistent-copy.ts). Es werden keine unbestätigten Fachaussagen
// ergänzt; die Stimmprobe bleibt asset-gated und rendert ohne Audiodatei nichts.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, CircleCheck as CheckCircle2, Users } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { StimmprobeSection } from "@/components/StimmprobeSection";
import { BUSINESS_INFO } from "@/lib/seo-data";
import {
  ANLIEGEN_IMMER_MENSCH,
  ANLIEGEN_UEBERNIMMT,
  CTA,
  EINRICHTUNG_SCHRITTE,
  GRENZEN,
  NICHT_PASSEND,
  PATIENTEN_SICHT,
  SAEULEN,
  SCHEITERN_INTRO,
  SCHEITERN_MUSTER,
  TEAM_BLOCK,
} from "@/lib/telefonassistent-copy";

const base = BUSINESS_INFO.website;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const breadcrumbs = [
  { name: "Home", url: base },
  { name: "Für Praxen", url: `${base}/praxen` },
];

const faqItems = [
  {
    question: "Kommen meine Patientinnen und Patienten mit einer Computerstimme klar?",
    answer:
      "Nicht alle sofort — das nehmen wir ernst. Begrüßung und Ansagen werden auf Ihre Praxis abgestimmt, auf Wunsch mit Ihren eigenen Aufnahmen. Anrufer erfahren zu Beginn, dass ein Sprachassistent sie betreut, und können jederzeit zu einem Menschen wechseln. Die Eingewöhnungsphase begleiten wir aktiv.",
  },
  {
    question: "Muss ich dafür meine Praxissoftware wechseln?",
    // [[CLAIM: verify — kein Systemwechsel nötig (OWNER-INPUT B1–B4)]]
    answer:
      "Nein. Ihre Rufnummer bleibt, Ihre Telefonanlage bleibt, Ihre Praxissoftware bleibt. Welche Anbindung für Ihr System möglich ist, prüfen wir vor dem Angebot — nicht danach.",
  },
  {
    question: "Beurteilt der Assistent, wie dringend ein Anliegen ist?",
    answer:
      "Nein, unter keinen Umständen. Er gibt keine medizinische Einschätzung ab und stellt keine Triage. Hinweise auf einen Notfall führen sofort zu einem Menschen, zum Bereitschaftsdienst oder zur Ansage, den Notruf 112 zu wählen.",
  },
  {
    question: "Was kostet der Assistent?",
    answer:
      "Sie zahlen einen festen Monatsbetrag für einen definierten Leistungsumfang — keine Abrechnung pro Anruf. Einmalige Posten wie die Einrichtung stehen vor Vertragsschluss schriftlich im Angebot. Details finden Sie auf der Kostenseite.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: "KI Telefonassistent für Praxen",
      description:
        "Telefonische Anrufannahme für Arzt-, Zahnarzt- und Therapiepraxen: mit eigenen Ansagen, praxiseigenen Regeln und strukturierter Übergabe an das Praxisteam.",
      url: `${base}/praxen`,
      provider: { "@type": "Organization", name: BUSINESS_INFO.name, url: base },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqItems.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ],
};

const segmentLinks = [
  {
    label: "Arztpraxen",
    href: "/ki-telefonassistent-arzt",
    text: "Montagsflut an der Anmeldung, Rezeptbestellungen, Stornierungen",
  },
  {
    label: "Therapiepraxen",
    href: "/ki-telefonassistent-praxis",
    text: "Erreichbar bleiben, während Sie behandeln — ohne besetzten Empfang",
  },
];

const cityLinks = [
  { label: "Praxen im Raum Bayreuth", href: "/bayreuth/ki-telefonassistent" },
  { label: "Praxen im Raum Regensburg", href: "/regensburg/ki-telefonassistent" },
  { label: "Praxen im Raum München", href: "/muenchen/ki-telefonassistent" },
];

export function PraxenPage() {
  return (
    <>
      <PageSEO
        title="KI Telefonassistent für Praxen – Ihr Empfang | Cogniiq"
        description="Ein Empfang am Telefon für Ihre Praxis: mit Ihren Ansagen, Ihren Regeln und strukturierter Übergabe an Ihr Team. Keine Triage, feste monatliche Kosten."
        canonical={`${base}/praxen`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={schema}
      />

      <main className="min-h-screen bg-white dark:bg-gray-950">
        {/* ── Hero: Realität zuerst ── */}
        <section className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-8"
            >
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Home
              </Link>
              <ChevronRight size={12} aria-hidden="true" />
              <span className="text-gray-600 dark:text-gray-300" aria-current="page">
                Für Praxen
              </span>
            </nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.1] tracking-tight mb-6">
                Am Tresen steht eine Patientin.
                <br />
                <span className="text-gray-400 dark:text-gray-500 font-light">
                  Und das Telefon klingelt trotzdem.
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-[1.75] max-w-2xl mb-8">
                In diesem Moment verliert immer jemand: die Patientin vor Ihnen oder
                die am Telefon. Der Praxis-Empfang von Cogniiq nimmt die Anrufe an,
                die sonst ins Leere laufen — mit Ihren Ansagen, nach Ihren Regeln
                und mit einer Übergabe, die bei Ihrem Team ankommt.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  {CTA.primaryLabel}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link
                  to="/ki-telefonassistent"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-400 transition-colors"
                >
                  Wie der Empfang arbeitet
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── M13 · Stimmprobe (asset-gated) ── */}
        <StimmprobeSection />

        {/* ── M20 · Patientensicht ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/40">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-6">
              {PATIENTEN_SICHT.headline}
            </h2>
            {PATIENTEN_SICHT.paragraphs.map((p, i) => (
              <p key={i} className="text-gray-500 dark:text-gray-400 leading-[1.75] mb-4">
                {p}
              </p>
            ))}
            <div className="mt-6 inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {PATIENTEN_SICHT.stat.value}
              </span>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                {PATIENTEN_SICHT.stat.text}
                <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                  Quelle: {PATIENTEN_SICHT.stat.source}
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* ── M3 · Warum bisherige Versuche gescheitert sind ── */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
              Warum bisherige Versuche oft gescheitert sind
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-[1.7] mb-10 max-w-2xl">
              {SCHEITERN_INTRO}
            </p>
            <div className="grid sm:grid-cols-3 gap-5">
              {SCHEITERN_MUSTER.map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
                >
                  <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── M4 · Die vier Säulen ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/40">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-10">
              Was „für Ihre Praxis gebaut" konkret heißt
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {SAEULEN.map((s, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
                >
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5">
                    {s.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── M8 · Anliegen-Katalog ── */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-10">
              Was der Assistent übernimmt — und was immer ein Mensch macht
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Übernimmt der Assistent
                </h3>
                <ul className="space-y-3">
                  {ANLIEGEN_UEBERNIMMT.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Geht immer an einen Menschen
                </h3>
                <ul className="space-y-3">
                  {ANLIEGEN_IMMER_MENSCH.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      <Users size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── M15 · Grenzen ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/40" aria-labelledby="grenzen-heading">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2
              id="grenzen-heading"
              className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4"
            >
              {GRENZEN.headline}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-[1.7] mb-8">{GRENZEN.intro}</p>
            <ul className="space-y-4">
              {GRENZEN.points.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed"
                >
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── M5 · So wird Ihr Empfang gebaut ── */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-10">
              So wird Ihr Empfang gebaut
            </h2>
            <div className="space-y-3">
              {EINRICHTUNG_SCHRITTE.map((s) => (
                <div
                  key={s.step}
                  className="flex items-start gap-4 p-5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
                >
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tabular-nums mt-0.5">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {s.title}
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── M21 · Für Ihr Praxisteam ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/40">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-14 items-start">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-5">
                  {TEAM_BLOCK.headline}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 leading-[1.7]">{TEAM_BLOCK.text}</p>
              </div>
              <ul className="space-y-3">
                {TEAM_BLOCK.points.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed"
                  >
                    <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Segment- und Stadtlinks (nur Healthcare) ── */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              Für Ihre Praxisform
            </h2>
            <div className="grid sm:grid-cols-2 gap-5 mb-12">
              {segmentLinks.map((s) => (
                <Link
                  key={s.href}
                  to={s.href}
                  className="group p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-2">
                    {s.label}
                    <ArrowRight
                      size={13}
                      className="text-gray-300 group-hover:text-gray-600 transition-colors"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {s.text}
                  </p>
                </Link>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Praxen in Ihrer Region
            </h2>
            <ul className="flex flex-wrap gap-3">
              {cityLinks.map((c) => (
                <li key={c.href}>
                  <Link
                    to={c.href}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors"
                  >
                    {c.label}
                    <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/kosten-ki-telefonassistent"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors"
                >
                  Was der Empfang kostet
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* ── M11 · FAQ ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/40">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-10">
              Häufige Fragen
            </h2>
            <div className="space-y-5">
              {faqItems.map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
                >
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5">
                    {item.question}
                  </h3>
                  <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-[1.7]">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── M16 · Wenn wir nicht passen ── */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-4">
              {NICHT_PASSEND.headline}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-[1.7] mb-6">
              {NICHT_PASSEND.intro}
            </p>
            <ul className="space-y-3">
              {NICHT_PASSEND.points.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed"
                >
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── M12 · Abschluss-CTA ── */}
        <section className="py-24 bg-gray-50 dark:bg-gray-900/40">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
              Gehen wir Ihre Anrufe gemeinsam durch.
            </h2>
            <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-8 leading-[1.7]">
              {CTA.nextStep}
            </p>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
            >
              {CTA.primaryLabel}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
