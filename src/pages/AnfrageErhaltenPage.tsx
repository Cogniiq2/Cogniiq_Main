import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, CircleCheck as CheckCircle2 } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { trackEvent } from "@/lib/consent";


/*
  Diese Seite ist die einzige Stelle, an der eine Anfrage ueber das
  Kontaktformular als abgeschlossen gilt — und deshalb die einzige, die sie
  melden darf.

  ContactSection navigiert hierher ausschliesslich nach einem gelesenen 2xx des
  Endpunkts und reicht dabei `state.submitted` mit. Genau dafuer war der
  Zustand seit jeher gedacht ("so it can fire the conversion event without
  counting failures"), nur hat ihn niemand gelesen: die Seite hat das Ereignis
  nie ausgeloest. GA4 kannte damit 27 Absichtssignale und keinen einzigen
  bestaetigten Lead.

  Der Zustand wird geprueft, nicht der Pfad. /anfrage-erhalten ist eine
  indexierbare Route in PUBLIC_ROUTES: ein Direktaufruf aus der Suche, ein
  Lesezeichen, ein Reload oder ein Crawler erreicht sie ohne `state` — und darf
  keine Anfrage erzeugen, die es nicht gab.

  Der Ref-Riegel ist kein Zierat: unter React.StrictMode laeuft der Effekt im
  Entwicklungsmodus zweimal, und ein doppelt gemeldeter Lead waere hier nicht
  auffaellig, sondern nur falsch.
*/
export function AnfrageErhaltenPage() {
  const location = useLocation();
  const gemeldet = useRef(false);

  useEffect(() => {
    if (gemeldet.current) return;
    const state = location.state as { submitted?: boolean } | null;
    if (state?.submitted !== true) return;
    gemeldet.current = true;
    trackEvent("lead_submitted", "kontakt");
  }, [location.state]);

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
          <motion.div className="cq-rise flex justify-center mb-10">
            <div className="relative w-20 h-20">
              <div className="relative w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <CheckCircle2 size={34} className="text-emerald-400" strokeWidth={1.6} />
              </div>
            </div>
          </motion.div>

          <motion.h1
            className="cq-rise cq-rise-d1 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-5 leading-tight"
          >
            Anfrage erfolgreich gesendet.
          </motion.h1>

          <motion.p
            className="cq-rise cq-rise-d3 text-base sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-12 max-w-md mx-auto"
          >
            Vielen Dank. Ihre Anfrage ist bei uns eingegangen. Wir melden uns innerhalb von 24&nbsp;Stunden mit einer ersten Einschätzung.
          </motion.p>

          <motion.div className="cq-rise cq-rise-d3">
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
