import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CircleCheck as CheckCircle2,
  Mail,
  CalendarCheck,
} from "lucide-react";
import { PageSEO } from "@/components/PageSEO";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

interface Recap {
  name?: string;
  email?: string;
  preferredTime?: string;
  interests?: string[];
}

function loadRecap(): Recap {
  try {
    const raw = sessionStorage.getItem("cogniiq-anfrage-recap");
    return raw ? (JSON.parse(raw) as Recap) : {};
  } catch {
    return {};
  }
}

const NEXT_STEPS = [
  {
    n: "01",
    title: "Eingangsbestätigung",
    detail: "Sie erhalten in wenigen Minuten eine Bestätigung per E-Mail.",
    timing: "Sofort",
  },
  {
    n: "02",
    title: "Systemanalyse",
    detail: "Wir sehen uns Ihre Angaben an und bereiten das Gespräch auf Ihre Situation vor.",
    timing: "Innerhalb von 24 Stunden",
  },
  {
    n: "03",
    title: "Analysegespräch",
    detail: "30–45 Minuten per Video: Ihre Ausgangslage, konkrete Hebel, ehrliche Einschätzung.",
    timing: "Terminbestätigung folgt",
  },
];

export function AnfrageErhaltenPage() {
  const [recap, setRecap] = useState<Recap>({});

  useEffect(() => {
    setRecap(loadRecap());
  }, []);

  const firstName = recap.name?.trim().split(/\s+/)[0];

  return (
    <>
      <PageSEO
        title="Anfrage erfolgreich gesendet | Cogniiq"
        description="Vielen Dank. Ihre Anfrage wurde erfolgreich gesendet und wird aktuell geprüft."
        canonical="https://cogniiq.de/anfrage-erhalten"
        breadcrumbs={[
          { name: "Start", url: "https://cogniiq.de" },
          { name: "Anfrage erhalten", url: "https://cogniiq.de/anfrage-erhalten" },
        ]}
      />

      <main className="min-h-screen bg-white px-6 py-32">
        <div className="w-full max-w-2xl mx-auto">
          {/* Confirmation head */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="flex justify-center mb-8"
          >
            <div className="relative w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" strokeWidth={1.6} />
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.08}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4 leading-tight text-center"
          >
            {firstName ? `Danke, ${firstName}.` : "Anfrage erhalten."}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.14}
            className="text-[15.5px] text-gray-500 leading-[1.75] mb-4 max-w-md mx-auto text-center"
          >
            Ihre Anfrage ist bei uns eingegangen und wird von uns persönlich gelesen —
            nicht von einem Ticketsystem.
          </motion.p>

          {recap.email && (
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.18}
              className="flex items-center justify-center gap-2 text-[13px] text-gray-400 mb-12"
            >
              <Mail size={13} className="text-gray-300" />
              Bestätigung geht an <span className="font-medium text-gray-600">{recap.email}</span>
            </motion.p>
          )}
          {!recap.email && <div className="mb-12" />}

          {/* Wunschtermin recap */}
          {recap.preferredTime && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.22}
              className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 mb-10 max-w-md mx-auto"
            >
              <CalendarCheck size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-medium text-gray-800">
                  Ihr Wunschtermin: {recap.preferredTime}
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5 leading-relaxed">
                  Wir bestätigen Ihnen den Termin in der Regel innerhalb von 24&nbsp;Stunden per E-Mail.
                </p>
              </div>
            </motion.div>
          )}

          {/* What happens next */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.26}
            className="mb-12"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-6 text-center">
              So geht es jetzt weiter
            </p>
            <div className="flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden" style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.04)" }}>
              {NEXT_STEPS.map((s, i) => (
                <div
                  key={s.n}
                  className={`flex items-start gap-4 p-5 ${i < NEXT_STEPS.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <span
                    className="text-gray-300 tabular-nums font-medium flex-shrink-0 pt-0.5"
                    style={{ fontSize: "11px", letterSpacing: "0.04em", minWidth: "22px" }}
                  >
                    {s.n}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <p className="text-[14px] font-semibold text-gray-900">{s.title}</p>
                      <p className="text-[11px] text-gray-400">{s.timing}</p>
                    </div>
                    <p className="text-[12.5px] text-gray-500 mt-1 leading-relaxed">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Fallback contact + nothing else to do */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.32}
            className="text-center"
          >
            <p className="text-[13px] text-gray-400 leading-relaxed mb-8 max-w-md mx-auto">
              Sie müssen jetzt nichts weiter tun. Falls Sie vorab etwas ergänzen möchten,
              erreichen Sie uns direkt unter{" "}
              <a
                href="mailto:info@cogniiq.de"
                className="font-medium text-gray-600 hover:text-gray-900 transition-colors underline decoration-gray-200 underline-offset-2"
              >
                info@cogniiq.de
              </a>
              .
            </p>
            <Link
              to="/leistungen"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              Bis dahin: unsere Leistungen im Detail
              <ArrowRight size={13} className="opacity-50" />
            </Link>
          </motion.div>
        </div>
      </main>
    </>
  );
}
