// ─────────────────────────────────────────────────────────────────────────────
// /praxen — Healthcare-Einstiegsseite (Positionierung Option B).
//
// In sich geschlossene Journey: von hier geht es ausschließlich in
// Gesundheits-Inhalte (Segmente, Kosten, Stadtseiten, Service) — keine Links
// in Hotel- oder Restaurant-Inhalte.
//
// Aufbau: die Beweiskette aus COPY-BRIEF-3 §2, 18 Abschnitte in fester
// Reihenfolge. Jeder Abschnitt beantwortet die Frage, die der vorherige
// ausgelöst hat; kein Abschnitt darf ausgelassen oder vorgezogen werden.
// M15 (Grenzen) steht vor dem Preis, M13 bleibt asset-gated, M22 existiert
// nicht — es gibt keine Referenzpraxis.
//
// Gestaltung nach COPY-BRIEF-3 §1: Fließtext ≥ 17 px, ein Akzent nur für
// Handlung, Bewegung höchstens 180 ms und nur Deckkraft plus kleine
// Verschiebung, Tarife als Karten (kein horizontales Scrollen auf dem Handy).
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { StimmprobeSection } from "@/components/StimmprobeSection";
import { PraxisRechnerSection } from "@/components/PraxisRechnerSection";
import { BUSINESS_INFO } from "@/lib/seo-data";
import {
  ANLIEGEN_IMMER_MENSCH,
  ANLIEGEN_UEBERNIMMT,
  BETREUUNG,
  CTA,
  DATENSCHUTZ_PUNKTE,
  DECKELUNG,
  EINRICHTUNG_PROJEKT,
  FAKTEN,
  ZWEI_WOCHEN_GARANTIE,
  BETREUUNG_NACH_GOLIVE,
  GRENZEN,
  NICHT_PASSEND,
  PATIENTEN_SICHT,
  PERSONALKOSTEN_ANKER,
  SAEULEN,
  SCHEITERN_INTRO,
  SCHEITERN_MUSTER,
  TARIFE,
  TARIF_ENTERPRISE,
  TEAM_BLOCK,
  UEBERGABE,
  UMKEHRBARKEIT,
} from "@/lib/telefonassistent-copy";

const base = BUSINESS_INFO.website;

const breadcrumbs = [
  { name: "Home", url: base },
  { name: "Für Praxen", url: `${base}/praxen` },
];

const faqItems = [
  {
    question: "Kommen meine Patientinnen und Patienten mit einer Computerstimme klar?",
    answer:
      "Nicht alle sofort — das nehmen wir ernst. Sie wählen die Stimme, formulieren Ihren Begrüßungssatz und legen fest, wie Ihre Praxis am Telefon spricht. Anrufer erfahren im ersten Satz, dass ein KI-System spricht, und können jederzeit zu einem Menschen wechseln. Die ersten Wochen begleiten wir aktiv und ändern, was nicht ankommt.",
  },
  {
    question: "Landet der Termin automatisch in meiner Praxissoftware?",
    answer:
      `Das entscheidet Ihre Praxissoftware, nicht wir — und wir sagen es Ihnen vor der Unterschrift, nicht danach. ${FAKTEN.keineAnbindung}`,
  },
  {
    question: "Beurteilt der Assistent, wie dringend ein Anliegen ist?",
    answer:
      "Nein, unter keinen Umständen. Er gibt keine medizinische Einschätzung ab und stellt keine Triage. Hinweise auf einen Notfall führen sofort zu einem Menschen, zum Bereitschaftsdienst oder zur Ansage, den Notruf 112 zu wählen.",
  },
  {
    question: `Was passiert, wenn der Empfang nicht in ${FAKTEN.einrichtungsfrist} übergeben ist?`,
    answer:
      `${FAKTEN.uebergabeGarantie} ${FAKTEN.startDefinition} ${FAKTEN.garantieOhneAntrag} ${FAKTEN.zahlungsaufteilung}`,
  },
  {
    question: "Kann die Rechnung teurer werden als geplant?",
    answer:
      `Nur begrenzt. ${FAKTEN.deckelung} ${FAKTEN.tarifzuordnung} ${FAKTEN.preisgarantie} ${FAKTEN.nichtProBehandler}`,
  },
  {
    question: "Wie komme ich wieder aus dem Vertrag heraus?",
    answer:
      `${FAKTEN.kuendigung} ${FAKTEN.laufzeit}`,
  },
  {
    question: "Werden Gespräche aufgezeichnet?",
    answer:
      `Nein. ${FAKTEN.keineAufzeichnung} ${FAKTEN.keinTraining} Das bedeutet auch: Wenn Sie später den genauen Wortlaut eines Anrufs brauchen, gibt es ihn nicht.`,
  },
];

// FAQPage wird von PageSEO aus `faqItems` erzeugt und steht deshalb NICHT
// zusaetzlich hier — sonst laege derselbe Block zweimal im Dokument.
const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: "KI Telefonassistent für Praxen",
      description:
        "Telefonische Anrufannahme für Arzt-, Zahnarzt- und Therapiepraxen: mit eigener Stimmauswahl, praxiseigenen Regeln und strukturierter Übergabe an das Praxisteam.",
      url: `${base}/praxen`,
      provider: { "@type": "Organization", name: BUSINESS_INFO.name, url: base },
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
    label: "Zahnarztpraxen",
    href: "/ki-telefonassistent-zahnarztpraxis",
    text: "Anrufe während der Behandlung, kurzfristige Absagen, Recall-Rückrufe — und was immer beim Team bleibt",
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

/** Gleichmäßiger vertikaler Rhythmus (§1.3) — überall derselbe Abstand. */
const SECTION = "py-24";
const SECTION_ALT = "py-24 bg-gray-50 dark:bg-gray-900/40";
const PROSE = "text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7]";
const H2 = "text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6";
const H3 = "text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5";
const CARD =
  "p-7 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800";
const CARD_ALT =
  "p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800";
/** Neutraler Listenpunkt — Farbe bleibt der Handlung vorbehalten (§1.1). */
const DOT =
  "mt-[10px] w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0";
/** Primärer CTA, ≥ 44 px Tap-Ziel (§1.6). */
const CTA_PRIMARY =
  "inline-flex items-center gap-2 px-7 py-4 min-h-[44px] bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[16px] hover:bg-gray-700 dark:hover:bg-white transition-colors";

export function PraxenPage() {
  return (
    <>
      <PageSEO
        title="KI Telefonassistent für Praxen – Ihr Empfang | Cogniiq"
        description="Ein Empfang am Telefon für Ihre Praxis: Ihre Stimmauswahl, Ihre Regeln, strukturierte Übergabe. Keine Triage, Kontingent mit Obergrenze, in zwei Wochen eingerichtet und bereit zur Freigabe."
        canonical={`${base}/praxen`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={schema}
      />

      <main className="min-h-screen bg-white dark:bg-gray-950">
        {/* ── 1 · M1 Wiedererkennung ── */}
        <section className="pt-32 pb-24">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[14px] text-gray-400 dark:text-gray-500 mb-10"
            >
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Home
              </Link>
              <ChevronRight size={13} aria-hidden="true" />
              <span className="text-gray-600 dark:text-gray-300" aria-current="page">
                Für Praxen
              </span>
            </nav>

            <motion.div className="cq-rise">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.12] tracking-tight mb-7">
                Am Tresen steht eine Patientin.
                <br />
                <span className="text-gray-400 dark:text-gray-500 font-light">
                  Und das Telefon klingelt trotzdem.
                </span>
              </h1>
              <div className={`${PROSE} space-y-5 mb-9`}>
                <p>
                  In diesem Moment verliert immer jemand. Nehmen Sie ab, wartet die
                  Patientin vor Ihnen. Nehmen Sie nicht ab, versucht es die andere
                  ein zweites Mal, ein drittes Mal — und irgendwann nicht mehr.
                </p>
                <p>
                  Zu Stoßzeiten wird daraus ein Dauerzustand: Die Anmeldung
                  arbeitet unter ständiger Unterbrechung, die Telefonzeiten werden
                  weiter eingeschränkt, weil es anders nicht geht, und die Rückrufe
                  bleiben für den Abend liegen.
                </p>
                <p>
                  Der Praxis-Empfang von Cogniiq nimmt die Anrufe an, die sonst ins
                  Leere laufen — mit Ihrer Stimmauswahl, nach Ihren Regeln, mit
                  einer Übergabe, die wir vor der Unterschrift mit Ihnen klären.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/kontakt" className={CTA_PRIMARY}>
                  {CTA.primaryLabel}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  to="/ki-telefonassistent"
                  className="inline-flex items-center gap-2 px-7 py-4 min-h-[44px] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[16px] hover:border-gray-400 transition-colors"
                >
                  Wie der Empfang arbeitet
                </Link>
              </div>
              <p className="mt-4 text-[15px] text-gray-500 dark:text-gray-500">
                {CTA.microcopy}
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── 2 · M2 Was es kostet, nicht erreichbar zu sein ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Was es kostet, wenn niemand abnehmen kann</h2>
            <div className={`${PROSE} space-y-5`}>
              <p>
                Der offensichtliche Teil sind die Anrufe, die nicht ankommen. Der
                teurere Teil ist der Rest: Arbeit, die unter Unterbrechung
                passiert, und Fehler, die dabei entstehen. Ein Name, der falsch
                notiert wird. Ein Termin, der doppelt vergeben ist. Eine
                Rezeptbestellung, die auf einem Zettel liegen bleibt.
              </p>
              <p>
                Dazu kommen die Gespräche über die Erreichbarkeit selbst. Sie
                dauern regelmäßig länger als das medizinische Anliegen, das
                dahintersteht — und sie führt Ihr Team, nicht Sie. Was am Ende
                öffentlich sichtbar wird, ist die Bewertung, in der nicht die
                Behandlung steht, sondern dass niemand ans Telefon geht.
              </p>
            </div>
            <div className={`${CARD} mt-8`}>
              <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.6]">
                Mehr als ein Drittel der Befragten ist beim Versuch der
                telefonischen Terminbuchung gescheitert.
              </p>
              <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-2">
                Quelle: vzbv, Marktcheck Arztterminportale, 2025
              </p>
            </div>
          </div>
        </section>

        {/* ── 3 · M20 Patientensicht ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{PATIENTEN_SICHT.headline}</h2>
            <div className={`${PROSE} space-y-5`}>
              {PATIENTEN_SICHT.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className={`${CARD_ALT} mt-8`}>
              <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.6]">
                <span className="font-semibold tabular-nums">
                  {PATIENTEN_SICHT.stat.value}
                </span>{" "}
                {PATIENTEN_SICHT.stat.text}
              </p>
              <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-2">
                Quelle: {PATIENTEN_SICHT.stat.source}
              </p>
            </div>
          </div>
        </section>

        {/* ── 4 · M3 Warum bisherige Versuche gescheitert sind ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Warum bisherige Versuche oft gescheitert sind</h2>
            <p className={`${PROSE} mb-10`}>{SCHEITERN_INTRO}</p>
            <div className="space-y-4">
              {SCHEITERN_MUSTER.map((item, i) => (
                <div key={i} className={CARD}>
                  <h3 className={H3}>{item.title}</h3>
                  <p className={PROSE}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5 · M13 Stimmprobe (asset-gated, rendert ohne Audiodatei nichts) ── */}
        <StimmprobeSection />

        {/* ── 6 · M4 Die vier Säulen ── */}
        <section className={SECTION}>
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Was „für Ihre Praxis gebaut“ konkret heißt</h2>
            <div className="space-y-4">
              {SAEULEN.map((s, i) => (
                <div key={i} className={CARD_ALT}>
                  <h3 className={H3}>{s.title}</h3>
                  <p className={PROSE}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7 · M14 Die Übergabe ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{UEBERGABE.headline}</h2>
            <div className={`${PROSE} space-y-5`}>
              {UEBERGABE.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className={`${CARD} mt-8`}>
              <h3 className={H3}>{UEBERGABE.wasAnkommt.headline}</h3>
              <ul className="space-y-2.5 mb-4">
                {UEBERGABE.wasAnkommt.items.map((item) => (
                  <li key={item} className={`flex items-start gap-3 ${PROSE}`}>
                    <span className={DOT} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[15px] text-gray-500 dark:text-gray-500 leading-[1.6]">
                {UEBERGABE.wasAnkommt.hinweis}
              </p>
            </div>
          </div>
        </section>

        {/* ── 8 · M8 Anliegen-Katalog ── */}
        <section className={SECTION}>
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Was der Assistent übernimmt — und was immer ein Mensch macht</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className={CARD_ALT}>
                <h3 className={H3}>Übernimmt der Assistent</h3>
                <ul className="space-y-3">
                  {ANLIEGEN_UEBERNIMMT.map((item, i) => (
                    <li key={i} className={`flex items-start gap-3 ${PROSE}`}>
                      <span className={DOT} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={CARD_ALT}>
                <h3 className={H3}>Geht immer an einen Menschen</h3>
                <ul className="space-y-3">
                  {ANLIEGEN_IMMER_MENSCH.map((item, i) => (
                    <li key={i} className={`flex items-start gap-3 ${PROSE}`}>
                      <span className={DOT} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className={`${PROSE} mt-8`}>
              Wo die Trennlinie in Ihrer Praxis verläuft, entscheiden Sie. Wie Sie sie
              ziehen und was vor der Freigabe geprüft gehört, steht im{" "}
              <Link
                to="/ki-telefonassistent-einfuehren"
                className="underline underline-offset-4 hover:no-underline text-gray-900 dark:text-gray-100"
              >
                Leitfaden zur Einführung in der Praxis
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ── 9 · M15 Grenzen — steht vor dem Preis, nie abschwächen ── */}
        <section className={SECTION_ALT} aria-labelledby="grenzen-heading">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 id="grenzen-heading" className={H2}>
              {GRENZEN.headline}
            </h2>
            <p className={`${PROSE} mb-8`}>{GRENZEN.intro}</p>
            <ul className="space-y-5">
              {GRENZEN.points.map((point, i) => (
                <li key={i} className={`flex items-start gap-3 ${PROSE}`}>
                  <span className={DOT} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── 10 · M21 Für Ihr Praxisteam ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{TEAM_BLOCK.headline}</h2>
            <p className={`${PROSE} mb-8`}>{TEAM_BLOCK.text}</p>
            <ul className="space-y-4">
              {TEAM_BLOCK.points.map((point, i) => (
                <li key={i} className={`flex items-start gap-3 ${PROSE}`}>
                  <span className={DOT} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── 11 · M17 Einrichtung Ihres Empfangs + Zwei-Wochen-Garantie ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{EINRICHTUNG_PROJEKT.headline}</h2>
            <p className={`${PROSE} mb-10`}>{EINRICHTUNG_PROJEKT.intro}</p>
            <ol className="space-y-4">
              {EINRICHTUNG_PROJEKT.schritte.map((s) => (
                <li key={s.nummer} className={`${CARD} flex items-start gap-5`}>
                  <span className="text-[15px] font-bold text-gray-400 dark:text-gray-500 tabular-nums mt-1 flex-shrink-0">
                    {s.nummer}
                  </span>
                  <div>
                    <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                      {s.title}
                      {s.dauer && (
                        <span className="ml-2 text-[15px] font-normal text-gray-500 dark:text-gray-500">
                          · {s.dauer}
                        </span>
                      )}
                    </h3>
                    <p className={PROSE}>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Zwei-Wochen-Garantie: eigener Block, kein Aufzählungspunkt (§3.3).
                Der Mechanismus steht mit im Block — eine Frist ohne die Zahlungs-
                aufteilung dahinter liest sich wie eine Absichtserklärung. */}
            <div className="mt-10 rounded-2xl border border-pub-signal/25 bg-pub-signal-wash p-8">
              <h3 className="mb-3 text-[22px] font-bold text-pub-ink">
                {ZWEI_WOCHEN_GARANTIE.headline}
              </h3>
              <p className={PROSE}>{ZWEI_WOCHEN_GARANTIE.text}</p>
              <ul className="mt-5 space-y-2.5 border-t border-pub-signal/20 pt-5">
                {ZWEI_WOCHEN_GARANTIE.mechanik.map((satz) => (
                  <li key={satz} className="flex gap-3 text-[15px] leading-relaxed text-pub-ink-2">
                    <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-pub-signal" />
                    <span>{satz}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Betreuung nach dem Go-live — kontert den dokumentierten Abbruchgrund
                im Betrieb (52 % nennen Support als Wechselgrund, Zi 2026). */}
            <div className="mt-6 rounded-2xl border border-pub-hairline p-8">
              <h3 className="mb-3 text-[22px] font-bold text-pub-ink">
                {BETREUUNG_NACH_GOLIVE.headline}
              </h3>
              {BETREUUNG_NACH_GOLIVE.paragraphs.map((absatz) => (
                <p key={absatz} className={`${PROSE} mt-3 first:mt-0`}>{absatz}</p>
              ))}
            </div>
          </div>
        </section>

        {/* ── 12 · M18 Betreuung ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{BETREUUNG.headline}</h2>
            <p className={`${PROSE} mb-8`}>{BETREUUNG.text}</p>
            <div className={CARD_ALT}>
              <p className="text-[19px] font-semibold text-gray-900 dark:text-gray-100">
                {BETREUUNG.person.name}
              </p>
              <p className="text-[15px] text-gray-500 dark:text-gray-500 mb-6">
                {BETREUUNG.person.rolle}
              </p>
              <dl className="space-y-4">
                {BETREUUNG.fakten.map((f) => (
                  <div key={f.label}>
                    <dt className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">
                      {f.label}
                    </dt>
                    <dd className={PROSE}>{f.wert}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className={`${PROSE} mt-6`}>
              52&nbsp;% der Praxen nennen unzureichenden Kundensupport als Grund, ihr
              System zu wechseln. Deshalb steht hier eine Frist und kein
              Versprechen.
            </p>
            <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-2">
              Quelle: Zi, PVS-Monitoring, 2026
            </p>
          </div>
        </section>

        {/* ── 13 · M10 Preis und Deckelung — Obergrenze zuerst (§5.1) ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{DECKELUNG.headline}</h2>
            <p className={`${PROSE} mb-4`}>{DECKELUNG.text}</p>
            <p className={`${PROSE} mb-4`}>{DECKELUNG.tarifwechsel}</p>
            <p className={`${PROSE} mb-10`}>{DECKELUNG.nichtProBehandler}</p>

            {/* Tarife als Karten — auf dem Handy kein horizontales Scrollen */}
            <div className="grid md:grid-cols-3 gap-5">
              {TARIFE.map((t) => (
                <div key={t.name} className={CARD}>
                  <p className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {t.name}
                  </p>
                  <p className="text-[28px] font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-none mb-1">
                    {t.monatlich}
                  </p>
                  <p className="text-[15px] text-gray-500 dark:text-gray-500 mb-6">
                    im Monat
                  </p>
                  <dl className="space-y-2.5 text-[16px]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-500">Kontingent</dt>
                      <dd className="text-gray-700 dark:text-gray-300 tabular-nums text-right">
                        {t.minuten.toLocaleString("de-DE")} Min.
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-500">entspricht</dt>
                      <dd className="text-gray-700 dark:text-gray-300 tabular-nums text-right">
                        ca. {t.anrufeCa.toLocaleString("de-DE")} Anrufe
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-500">Obergrenze</dt>
                      <dd className="text-gray-700 dark:text-gray-300 tabular-nums text-right">
                        {t.obergrenze}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-500">Einrichtung</dt>
                      <dd className="text-gray-700 dark:text-gray-300 tabular-nums text-right">
                        {t.einrichtung}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
            <p className={`${PROSE} mt-6`}>{TARIF_ENTERPRISE}</p>

            <div className={`${CARD} mt-8`}>
              <p className={PROSE}>{PERSONALKOSTEN_ANKER.text}</p>
              <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-2">
                Quelle: {PERSONALKOSTEN_ANKER.source}
              </p>
            </div>

            <Link
              to="/kosten-ki-telefonassistent"
              className="inline-flex items-center gap-2 mt-8 min-h-[44px] py-3 text-[16px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Alle Preisangaben im Detail
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── Rechner: steht NACH dem Preisblock, damit der Leser Tarife und
            Deckelung kennt, bevor er rechnet (Inhaber-Vorgabe). ── */}
        <PraxisRechnerSection />

        {/* ── 14 · M19 Umkehrbarkeit ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{UMKEHRBARKEIT.headline}</h2>
            <dl className="space-y-5 mb-8">
              {UMKEHRBARKEIT.fakten.map((f) => (
                <div key={f.label} className={CARD_ALT}>
                  <dt className="text-[15px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {f.label}
                  </dt>
                  <dd className={PROSE}>{f.wert}</dd>
                </div>
              ))}
            </dl>
            <p className={PROSE}>{UMKEHRBARKEIT.vetorecht}</p>
          </div>
        </section>

        {/* ── 15 · M16 Wann wir nicht passen ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{NICHT_PASSEND.headline}</h2>
            <p className={`${PROSE} mb-8`}>{NICHT_PASSEND.intro}</p>
            <ul className="space-y-5">
              {NICHT_PASSEND.points.map((point, i) => (
                <li key={i} className={`flex items-start gap-3 ${PROSE}`}>
                  <span className={DOT} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── 16 · M7 Datenschutz kurz ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Was Ihr Datenschutzbeauftragter wissen will</h2>
            <ul className="space-y-5">
              {DATENSCHUTZ_PUNKTE.map((punkt, i) => (
                <li key={i} className={`flex items-start gap-3 ${PROSE}`}>
                  <span className={DOT} />
                  {punkt}
                </li>
              ))}
            </ul>
            <Link
              to="/datenschutz-sicherheit"
              className="inline-flex items-center gap-2 mt-8 min-h-[44px] py-3 text-[16px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Datenschutz und Sicherheit im Detail
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── 17 · M11 FAQ ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Häufige Fragen</h2>
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <div key={i} className={CARD}>
                  <h3 className={H3}>{item.question}</h3>
                  <p className={PROSE}>{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 18 · M12 Nächster Schritt ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-2xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Gehen wir Ihre Anrufe gemeinsam durch.</h2>
            <p className={`${PROSE} mb-8`}>{CTA.nextStep}</p>
            <Link to="/kontakt" className={CTA_PRIMARY}>
              {CTA.primaryLabel}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <p className="mt-4 text-[15px] text-gray-500 dark:text-gray-500">
              {CTA.microcopy}
            </p>
          </div>
        </section>

        {/* ── Wegweiser: nur Gesundheitsinhalte (Positionierung Option B) ── */}
        <section className={`${SECTION} border-t border-gray-100 dark:border-gray-800`}>
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              Für Ihre Praxisform
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mb-12">
              {segmentLinks.map((s) => (
                <Link
                  key={s.href}
                  to={s.href}
                  className={`${CARD} block hover:border-gray-300 dark:hover:border-gray-600 transition-colors`}
                >
                  <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    {s.label}
                    <ArrowRight size={15} className="text-gray-400" aria-hidden="true" />
                  </h3>
                  <p className={PROSE}>{s.text}</p>
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
                    className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-700 text-[16px] font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors"
                  >
                    {c.label}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
