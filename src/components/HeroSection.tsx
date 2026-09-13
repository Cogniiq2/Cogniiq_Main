import { lazy, startTransition, Suspense, useEffect, useState } from 'react';
import { MobileHero } from './MobileHero';

const DesktopHero = lazy(() =>
  import('./hero/DesktopHero').then((module) => ({
    default: module.DesktopHero,
  }))
);

function useIsDesktop() {
  // Starts `false` unconditionally — NOT from window.innerWidth. The homepage is
  // prerendered at build time (scripts/prerender.mjs), where there is no window, so
  // the server markup is always MobileHero. Seeding this from innerWidth would make
  // the first client render disagree with that markup on every desktop viewport,
  // which is a hydration mismatch on the single most important page of the site.
  // The effect below immediately promotes desktop viewports via matchMedia, and the
  // Suspense fallback for the lazy DesktopHero chunk is already MobileHero, so what
  // a desktop visitor sees is unchanged.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');

    /*
      Die Umschaltung ist NICHT DRINGEND — sie läuft deshalb als Transition.

      Der Effekt feuert unmittelbar nach dem Mount, also zu einem Zeitpunkt, an
      dem der Rest der Seite noch hydratisiert. Eine Aktualisierung mit
      normaler Priorität kann in diesem Fenster die Hydratation einer noch
      offenen Suspense-Grenze abbrechen; React nennt das #421 und verweist in
      der Fehlermeldung selbst auf `startTransition`.

      Die konkrete offene Grenze auf der Startseite — der nachgeladene Rechner —
      ist mit dem statischen Import in `TelefonRechnerSection` verschwunden.
      Diese Zeile hält die auslösende Seite in Ordnung: Wer der Startseite
      später einen weiteren `lazy`-Abschnitt hinzufügt, bringt damit nicht
      wieder die Hydratation zu Fall.

      Am sichtbaren Ablauf ändert sich nichts. Der erste Client-Render bleibt
      `MobileHero` und damit deckungsgleich mit dem Prerender, und da der
      Suspense-Fallback des Desktop-Heros ebenfalls `MobileHero` ist, sieht ein
      Desktop-Besucher denselben Übergang wie zuvor.
    */
    const umschalten = (matches: boolean) => {
      startTransition(() => {
        setIsDesktop(matches);
      });
    };

    const handler = (e: MediaQueryListEvent) => {
      umschalten(e.matches);
    };

    umschalten(mq.matches);
    mq.addEventListener('change', handler);

    return () => {
      mq.removeEventListener('change', handler);
    };
  }, []);

  return isDesktop;
}

export function HeroSection() {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return <MobileHero />;
  }

  return (
    <Suspense fallback={<MobileHero />}>
      <DesktopHero />
    </Suspense>
  );
}

export default HeroSection;