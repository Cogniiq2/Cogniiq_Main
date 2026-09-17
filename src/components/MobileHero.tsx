import { ArrowRight, Globe, PhoneCall, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PubLinkButton } from '@/components/public/PublicUI';

/*
  Mobile hero (also the prerendered markup for every viewport, see HeroSection).

  Same H1 as the desktop hero, so crawlers and visitors read one headline. The
  former neural grid, particles, scan beam and touch ripples are gone: they cost
  a horizontal scrollbar at 320px and competed with the copy. Everything above
  the fold is plain HTML painted on the first frame; `.cq-rise` moves transform
  only, so the H1 remains the LCP candidate.
*/
const services = [
  { icon: PhoneCall, label: 'KI-Telefonassistent', href: '/ki-telefonassistent' },
  { icon: Globe, label: 'Webdesign', href: '/webdesign' },
  { icon: Zap, label: 'Prozessautomatisierung', href: '/prozessautomatisierung' },
];

export function MobileHero() {
  return (
    <section
      className="relative w-full overflow-hidden bg-white"
      aria-label="Cogniiq — Operative KI-Systeme"
    >
      <div className="relative z-10 mx-auto w-full max-w-[640px] px-6 pb-14 pt-28 sm:px-8">
        <div className="cq-rise mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ animationDelay: '0.1s', animationDuration: '0.42s' }}>
          {services.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              to={href}
              className="inline-flex h-9 items-center gap-1.5 text-[13px] font-medium text-pub-ink-3 hover:text-pub-ink focus-visible:outline-none focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2"
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>

        <h1 className="mb-4 text-[clamp(30px,8.2vw,42px)] font-bold leading-[1.06] tracking-[-0.022em] text-pub-ink">
          <span className="cq-rise block" style={{ animationDelay: '0.16s', animationDuration: '0.42s' }}>Erreichbar, wenn</span>
          <span className="cq-rise block" style={{ animationDelay: '0.24s', animationDuration: '0.42s' }}>niemand frei ist.</span>
        </h1>

        <p className="cq-rise mb-4 text-[19px] font-medium leading-[1.3] tracking-[-0.01em] text-pub-ink-3" style={{ animationDelay: '0.32s', animationDuration: '0.42s' }}>
          Auch nachts. Auch samstags.
        </p>

        <p className="cq-rise mb-8 max-w-[46ch] text-[16.5px] leading-[1.65] text-pub-ink-2" style={{ animationDelay: '0.4s', animationDuration: '0.42s' }}>
          Ihr KI-Telefonassistent nimmt Anrufe an, wenn Ihr Team gebunden ist —
          abends, am Wochenende, zu Stoßzeiten. Anliegen kommen strukturiert
          bei Ihnen an, statt auf der Mailbox zu enden.
        </p>

        <div className="cq-rise flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '0.48s', animationDuration: '0.42s' }}>
          <PubLinkButton to="/kontakt" variant="primary" size="lg" icon={ArrowRight} iconTrailing className="w-full sm:w-auto">
            Erstgespräch vereinbaren
          </PubLinkButton>
          <PubLinkButton to="#preis-roi-rechner" variant="secondary" size="lg" className="w-full sm:w-auto">
            Preis berechnen
          </PubLinkButton>
        </div>

        <p
          data-review-claim="go-live-zeitraum"
          className="cq-rise mt-6 flex items-start gap-2 text-[14px] leading-snug text-pub-ink-3"
          style={{ animationDelay: '0.56s', animationDuration: '0.42s' }}
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pub-verify" strokeWidth={1.75} aria-hidden="true" />
          Kostenlos und unverbindlich · Go-Live erst nach Ihrer Freigabe
        </p>
      </div>
    </section>
  );
}

export default MobileHero;
