import { Shield, Clock, Users, Wrench, Lock, ArrowRight } from 'lucide-react';

import { IconTile, PubEyebrow, PubLinkButton } from '@/components/public/PublicUI';

/*
  One process section instead of three. The four stages are ProcessSection's,
  the five assurances are TrustStrip's — sentence for sentence. Nothing here is
  new copy; HowItWorksSection, ProcessSection and TrustStrip no longer render
  on the homepage.
*/
const stages = [
  {
    number: '01',
    title: 'Kennenlernen & Zieldefinition',
    description:
      'Kurzes Erstgespräch (30–45 Min.), in dem wir Ihr Geschäftsmodell, Ihre Ziele und den Status quo verstehen. Kostenlos und unverbindlich.',
  },
  {
    number: '02',
    title: 'Konzept & Angebot',
    description:
      'Wir skizzieren Website / Automation / AI-Setup und erstellen ein klares, individuelles Angebot – keine versteckten Kosten.',
  },
  {
    number: '03',
    title: 'Umsetzung & Feinschliff',
    description:
      'Umsetzung in klaren Sprints, regelmäßige Zwischenstände, Feedbackrunden, Tests. Fokus auf Performance und Stabilität.',
  },
  {
    number: '04',
    title: 'Go-Live & Optimierung',
    description:
      'Launch, Monitoring und Optimierung auf das, was zählt: Anfragen, Buchungen, Umsatz – nicht nur Pixel.',
  },
];

// Kanonisch: Go-Live erst nach Kundenfreigabe; keine Hosting-, Serverstandort-
// oder "DSGVO-konform"-Aussage (Inhaber-Antwort B).
const assurances = [
  { icon: Shield, label: 'Keine Gesprächsaufzeichnung', sub: 'Gespeichert wird nur das strukturierte Ergebnis' },
  { icon: Clock, label: 'Go-Live erst nach Ihrer Freigabe', sub: 'Kein Start gegen Ihren Willen' },
  { icon: Users, label: 'Direkter Ansprechpartner', sub: 'Kein Ticket-System' },
  { icon: Wrench, label: 'Keine Templates', sub: 'Gebaut für Ihren Prozess' },
  { icon: Lock, label: 'Festpreis', sub: 'Einmalposten stehen im Angebot' },
];

export function HowWeWorkSection() {
  return (
    <section
      className="border-t border-pub-hairline-soft bg-pub-paper-2 py-20 lg:py-28"
      aria-labelledby="how-we-work-heading"
      data-review-claim="go-live-zeitraum"
    >
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="mb-12 max-w-2xl">
          <PubEyebrow className="mb-4">Zusammenarbeit</PubEyebrow>
          <h2 id="how-we-work-heading" className="text-[clamp(30px,3.2vw,40px)] font-bold leading-[1.1] tracking-[-0.02em] text-pub-ink">
            So arbeiten wir zusammen.
          </h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <ol className="divide-y divide-pub-hairline">
            {stages.map((stage) => (
              <li key={stage.number} className="grid grid-cols-[48px_1fr] gap-4 py-6 first:pt-0 sm:grid-cols-[64px_1fr] sm:gap-6">
                <span className="text-[14px] font-semibold tabular-nums text-pub-ink-3">{stage.number}</span>
                <div>
                  <h3 className="mb-1.5 text-[19px] font-semibold leading-snug tracking-[-0.01em] text-pub-ink">{stage.title}</h3>
                  <p className="max-w-[56ch] text-[15px] leading-[1.6] text-pub-ink-2">{stage.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-2xl border border-pub-hairline bg-white p-5 sm:p-8">
            <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-pub-ink-3">Woran Sie uns messen können</p>
            <ul className="divide-y divide-pub-hairline-soft">
              {assurances.map(({ icon, label, sub }) => (
                <li key={label} className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
                  <IconTile icon={icon} size="sm" />
                  <div>
                    <p className="text-[14.5px] font-semibold leading-snug text-pub-ink">{label}</p>
                    <p className="text-[13.5px] leading-snug text-pub-ink-3">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <PubLinkButton to="/kontakt" variant="primary" size="md" icon={ArrowRight} iconTrailing className="w-full whitespace-normal text-center sm:w-auto">
                Erstgespräch vereinbaren
              </PubLinkButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
