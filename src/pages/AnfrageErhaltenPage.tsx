import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, CircleCheck as CheckCircle2 } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function AnfrageErhaltenPage() {
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

      <main className="min-h-screen flex items-center justify-center px-6 py-32">
        <div className="w-full max-w-lg text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="flex justify-center mb-10"
          >
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 animate-ping opacity-20" />
              <div className="relative w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <CheckCircle2 size={34} className="text-emerald-400" strokeWidth={1.6} />
              </div>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-5 leading-tight"
          >
            Anfrage erfolgreich gesendet.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="text-base sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-12 max-w-md mx-auto"
          >
            Vielen Dank. Ihre Anfrage ist bei uns eingegangen. Wir melden uns innerhalb von 24&nbsp;Stunden mit einer ersten Einschätzung.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 text-sm font-semibold tracking-wide hover:opacity-80 transition-opacity duration-200"
            >
              <ArrowLeft size={15} strokeWidth={2} />
              Zur Startseite
            </Link>
          </motion.div>
        </div>
      </main>
    </>
  );
}
