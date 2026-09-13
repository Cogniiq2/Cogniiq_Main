import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, CircleCheck as CheckCircle } from 'lucide-react';


/*
  EINE Liste, EIN Versprechen je Zeile. Hier standen bis heute drei Listen
  übereinander: drei „outcomes" links, drei „guarantees" in der Karte und zwei
  Kennzahlenkacheln („Auch nachts", „Strukturiert"), die beide weiter oben auf
  der Seite schon standen. Dazu „Kein Pitch" zweimal und die Reaktionszeit
  zweimal — einmal in der Karte, einmal darunter. Ein Abschluss, der seine
  eigenen Argumente wiederholt, liest sich unsicher.
*/
const outcomes = [
  'Wir analysieren Ihre konkreten Verlustquellen',
  'Sie sehen, wo Automatisierung sofort wirkt',
  'Sie erhalten ein realistisches Konzept — kein Pitch',
];


/*
  Kein `opacity: 0` mit Sichtbarkeitsauslöser mehr. Der Abschluss stand im
  vorgerenderten HTML unsichtbar und wurde erst durch einen IntersectionObserver
  eingeblendet: ohne JavaScript gar nicht, mit JavaScript verzögert — und das
  ausgerechnet an der Stelle, an der die Entscheidung fällt.
*/
export function FinalCTASection() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="border-t border-pub-hairline-soft bg-white py-20 lg:py-28"
    >
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20">

          <div className="cq-rise">
            <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-pub-ink-3">
              Der erste Schritt
            </p>

            <h2
              id="final-cta-heading"
              className="mb-6 text-[clamp(30px,3.2vw,44px)] font-bold leading-[1.08] tracking-[-0.02em] text-pub-ink"
            >
              Besprechen wir,
              <br />
              <span className="text-pub-ink-3">was bei Ihnen möglich ist.</span>
            </h2>

            <p className="mb-9 max-w-[56ch] text-[17px] leading-[1.65] text-pub-ink-2">
              Kein Pitch, kein Standardangebot. Wir schauen uns Ihre konkrete Situation an und
              zeigen, wo Automatisierung sofort wirkt — und was das{' '}
              <Link
                to="/leistungen"
                className="font-medium text-pub-ink underline decoration-pub-hairline underline-offset-2 transition-colors hover:decoration-pub-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2"
              >
                realistisch bringt
              </Link>
              .
            </p>

            <ul className="space-y-3">
              {outcomes.map((o) => (
                <li key={o} className="flex items-start gap-3">
                  <CheckCircle size={17} className="mt-0.5 shrink-0 text-pub-verify" aria-hidden="true" />
                  <span className="text-[15.5px] leading-relaxed text-pub-ink-2">{o}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="cq-rise cq-rise-d1 lg:sticky lg:top-28">
            <div className="rounded-2xl bg-pub-ink p-8 sm:p-9">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/60">
                Kostenloses Erstgespräch
              </p>
              <h3 className="mb-7 text-[23px] font-bold leading-tight tracking-tight text-white">
                Gespräch vereinbaren
              </h3>

              <Link
                to="/kontakt"
                className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-pub-ink transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pub-ink"
              >
                <Calendar size={15} className="text-pub-ink-3" aria-hidden="true" />
                Erstgespräch vereinbaren
              </Link>

              {/*
                Zwei Wege mit verschiedenem Einsatz, nicht zweimal dieselbe
                Verpflichtung: reden — oder erst das Produkt sehen.
              */}
              <Link
                to="/ki-telefonassistent/demo"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 text-[14px] font-medium text-white/75 transition-colors hover:border-white/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pub-ink"
              >
                Demo-Termin anfragen
                <ArrowRight size={14} aria-hidden="true" />
              </Link>

              <div className="mt-7 space-y-2.5 border-t border-white/10 pt-6 text-[13.5px] leading-relaxed text-white/70">
                <p>Unverbindlich — Sie entscheiden nach dem Gespräch.</p>
                <p data-review-claim="reaktionszeit">Antwort in der Regel innerhalb von 24&nbsp;Stunden.</p>
                <p>Live geschaltet wird erst nach Ihrer Freigabe.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
