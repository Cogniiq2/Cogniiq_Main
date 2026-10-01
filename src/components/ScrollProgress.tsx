import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

/*
  Lesefortschritt am oberen Bildschirmrand.

  Eine 2-px-Linie über der klebenden Navigation, die sich beim Scrollen von
  links nach rechts füllt und am Seitenende genau die volle Breite erreicht.

  Bewusst ohne Prozent-Chip, Punkt oder Schimmer: Die Vorgängerversion trug
  all das, der Chip wurde am Viewport-Rand abgeschnitten, und sie wurde
  ausgehängt (siehe Navigation.tsx). Hier bleibt nur die Linie.

  - Nur `transform: scaleX` — läuft auf dem Compositor, löst kein Layout aus.
  - Federgedämpft, damit Mausrad-Sprünge weich ausgleiten statt zu ruckeln.
    `restDelta` klein genug, dass die Linie am Ende wirklich bei 100 % steht.
  - Unter `prefers-reduced-motion` folgt sie dem Scrollwert direkt, ohne Feder.
  - Farbe: `accent-soft` ist laut index.css für Linien und Icons vorgesehen;
    `signal` bleibt der einen Handlung pro Ansicht vorbehalten.
  - Ganz oben (Fortschritt 0) unsichtbar, damit kein Pixelrest stehen bleibt.
  - Dekorativ (`aria-hidden`): Die Scrollposition kennt der Browser selbst.
*/

const SPRING = { stiffness: 160, damping: 32, mass: 0.5, restDelta: 0.0005 };

export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, SPRING);
  const scaleX = reduceMotion ? scrollYProgress : smooth;
  const opacity = useTransform(scaleX, [0, 0.004], [0, 1]);

  return (
    <motion.div
      aria-hidden="true"
      data-testid="scroll-progress"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left"
      style={{
        scaleX,
        opacity,
        background:
          'linear-gradient(90deg, rgb(var(--pub-accent-line)) 0%, rgb(var(--pub-accent-soft)) 55%, rgb(var(--pub-accent)) 100%)',
        boxShadow: '0 0 6px rgb(var(--pub-accent-soft) / 0.35)',
        willChange: 'transform',
      }}
    />
  );
}
