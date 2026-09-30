import {
  startTransition,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  MotionConfig,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import {
  Stethoscope,
  Utensils,
  Building2,
  Dumbbell,
  PhoneCall,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

import { PubEyebrow, PubLinkButton } from '@/components/public/PublicUI';
import { spotlightHandlers } from '@/lib/publicMotion';
import { ABWICKLUNG } from '@/lib/telefonassistent-copy';

type Industry = 'Arztpraxis' | 'Restaurant' | 'Immobilien' | 'Sport & Fitness';

interface Scenario {
  icon: React.ElementType;
  label: Industry;
  color: string;
  problem: {
    title: string;
    points: string[];
    stat: string;
    statLabel: string;
  };
  solution: {
    service: string;
    serviceIcon: React.ElementType;
    title: string;
    points: string[];
    stat: string;
    statLabel: string;
  };
  chat: ChatMessage[];
}

interface ChatMessage {
  role: 'caller' | 'ai';
  text: string;
  delay?: number;
}

const SCENARIOS: Scenario[] = [
  {
    icon: Stethoscope,
    label: 'Arztpraxis',
    color: 'sky',
    problem: {
      title: 'Ohne KI-Assistenten',
      points: [
        'Telefon klingelt — Rezeption bereits besetzt',
        'Anrufer legt auf, ruft Konkurrenz an',
        'Termin geht verloren — kein Follow-up',
        'Rezeptionistin macht regelmäßig Überstunden',
        'Keine Aufzeichnung verpasster Anrufe',
      ],
      stat: 'Häufig',
      statLabel: 'bleiben Anrufe in Praxen unbeantwortet',
    },
    solution: {
      service: 'KI Telefonassistent',
      serviceIcon: PhoneCall,
      title: 'Mit KI-Rezeptionistin',
      points: [
        'Anrufe werden angenommen, wenn die Anmeldung gebunden ist — auch außerhalb der Öffnungszeiten',
        'Terminwunsch mit Name und Rückrufnummer strukturiert aufgenommen',
        'Ergebnis geht strukturiert an das Praxisteam, im Dashboard oder in Ihrem System',
        'Rezeptionistin konzentriert sich auf Patienten',
        'Angenommene Gespräche protokolliert & nachvollziehbar',
      ],
      stat: 'Auch nachts',
      statLabel: 'Anrufannahme außerhalb der Öffnungszeiten',
    },
    chat: [
      { role: 'ai', text: 'Praxis Dr. Albrecht, hier spricht der KI-Assistent.' },
      { role: 'caller', text: 'Maier, geboren am 12. März 1968. Ich bräuchte diese Woche einen Termin, am liebsten vor eins.' },
      { role: 'ai', text: 'Ich habe Sie gefunden, Frau Maier. Vor eins wären Donnerstag, 9:40 Uhr, oder Freitag, 8:20 Uhr, frei.' },
      { role: 'caller', text: 'Donnerstag, bitte.' },
      { role: 'ai', text: 'Donnerstag, 9:40 Uhr, ist für Sie eingetragen. Bitte bringen Sie Ihre Versichertenkarte mit.' },
      { role: 'caller', text: 'Und wenn ich bis dahin Fieber bekomme – soll ich trotzdem kommen?' },
      { role: 'ai', text: 'Das darf ich medizinisch nicht beurteilen. Rufen Sie in dem Fall an, dann leite ich Sie direkt an das Praxisteam weiter.' },
      { role: 'caller', text: 'Gut. Und falls ich verschieben muss?' },
      { role: 'ai', text: 'Dann rufen Sie einfach wieder an – verschieben oder absagen erledige ich direkt im Gespräch. Auf Wiederhören, Frau Maier.' },
    ],
  },
  {
    icon: Utensils,
    label: 'Restaurant',
    color: 'amber',
    problem: {
      title: 'Ohne KI-Assistenten',
      points: [
        'Service nimmt Telefon an — Gäste warten',
        'Reservierungen landen auf Zetteln & gehen verloren',
        'Nach Feierabend nimmt niemand Reservierungen entgegen',
        'Abends & sonntags ist niemand erreichbar',
        'Stammgäste genervt, wechseln zur Konkurrenz',
      ],
      stat: 'Abends zu',
      statLabel: 'niemand nimmt Reservierungen an, wenn der Service läuft',
    },
    solution: {
      service: 'KI Telefonassistent',
      serviceIcon: PhoneCall,
      title: 'Mit KI-Rezeptionistin',
      points: [
        'Reservierungen auch außerhalb der Öffnungszeiten entgegennehmen',
        'Reservierungswunsch mit Personenzahl und Rückrufnummer strukturiert aufgenommen',
        'Mehrere Anrufe zur selben Zeit statt Besetztzeichen',
        'Service-Team fokussiert auf Gäste vor Ort',
        'Jede Reservierung strukturiert dokumentiert — kein Zettel geht verloren',
      ],
      stat: 'Auch abends',
      statLabel: 'Reservierungsannahme außerhalb der Öffnungszeiten',
    },
    chat: [
      { role: 'ai', text: 'Trattoria Lume, hier spricht der KI-Assistent.' },
      { role: 'caller', text: 'Berger hier. Haben Sie Samstag um 20 Uhr einen Tisch für vier? Wir feiern einen Geburtstag.' },
      { role: 'ai', text: 'Um 20 Uhr sind wir ausgebucht. Um 19:30 Uhr wäre der Ecktisch am Fenster frei – etwas ruhiger zum Feiern.' },
      { role: 'caller', text: 'Den nehmen wir. Einer von uns hat eine Nussallergie.' },
      { role: 'ai', text: 'Samstag, 19:30 Uhr, vier Personen, Ecktisch – ist reserviert. Allergie und Geburtstag sind für die Küche vermerkt.' },
      { role: 'caller', text: 'Könnten Sie zum Dessert eine Kerze vorbereiten lassen?' },
      { role: 'ai', text: 'Gern, das steht bei der Reservierung. Der Service weiß Bescheid, wenn Sie kommen.' },
      { role: 'caller', text: 'Und falls wir es doch nicht schaffen?' },
      { role: 'ai', text: 'Dann rufen Sie kurz an, ich gebe den Tisch wieder frei. Einen schönen Abend, Herr Berger.' },
    ],
  },
  {
    icon: Building2,
    label: 'Immobilien',
    color: 'emerald',
    problem: {
      title: 'Ohne Automatisierung',
      points: [
        'Interessenten-Anfragen stapeln sich im Postfach',
        'Qualifizierung per Telefon kostet Stunden täglich',
        'Follow-ups werden manuell und verspätet gesendet',
        'Besichtigungen kollidieren im Kalender',
        'Hochwertige Leads gehen an schnellere Mitbewerber',
      ],
      stat: 'Oft',
      statLabel: 'entscheidet der zuerst erreichbare Anbieter',
    },
    solution: {
      service: 'KI Telefonassistent',
      serviceIcon: PhoneCall,
      title: 'Mit KI-Automatisierung',
      points: [
        'Automatische Erstantwort auf eingehende Anfragen',
        'Automatische Lead-Qualifizierung per Fragebogen',
        'Besichtigungstermine selbst buchbar im Kalender',
        'Follow-up-Sequenzen laufen automatisiert',
        'Qualifizierte Leads landen sortiert beim Makler',
      ],
      stat: 'Mehr',
      statLabel: 'qualifizierte Besichtigungen durch automatische Vorqualifizierung',
    },
    chat: [
      { role: 'ai', text: 'Immobilien Hartmann, hier spricht der KI-Assistent.' },
      { role: 'caller', text: 'Keller hier. Ist die 3-Zimmer-Wohnung in der Sonnenstraße noch frei? Zu zweit, Finanzierung steht.' },
      { role: 'ai', text: 'Ja: 84 m², 3. OG, Aufzug, 1.290 € kalt. Besichtigung wäre Dienstag, 17 Uhr, oder Donnerstag, 18:30 Uhr.' },
      { role: 'caller', text: 'Donnerstag passt.' },
      { role: 'ai', text: 'Donnerstag, 18:30 Uhr, ist eingetragen. Der Makler hat Ihre Angaben schon vorliegen.' },
      { role: 'caller', text: 'Sind Katzen erlaubt?' },
      { role: 'ai', text: 'Laut Exposé ja. Ich notiere die Frage zusätzlich für den Makler, er bestätigt es Ihnen vor Ort. Bis Donnerstag, Herr Keller.' },
    ],
  },
  {
    icon: Dumbbell,
    label: 'Sport & Fitness',
    color: 'rose',
    problem: {
      title: 'Ohne Automatisierung',
      points: [
        'Kursanmeldungen laufen per Telefon & WhatsApp',
        'Wartelisten werden auf Papier verwaltet',
        'Bei Ausfall des Trainers: manuelle Absagen',
        'Mitglieder kündigen wegen schlechter Erreichbarkeit',
        'Keine automatischen Erinnerungen oder Feedback',
      ],
      stat: 'Weniger',
      statLabel: 'Kündigungen durch verlässliche Erreichbarkeit und Erinnerungen',
    },
    solution: {
      service: 'KI Telefonassistent',
      serviceIcon: PhoneCall,
      title: 'Mit KI & Buchungssystem',
      points: [
        'Online-Buchung für alle Kurse & Personal Training',
        'Warteliste automatisch verwaltet & benachrichtigt',
        'Trainer-Ausfälle automatisch kommuniziert',
        'Monatliche Check-in Nachrichten an Mitglieder',
        'Kunden-Feedback automatisch eingeholt',
      ],
      stat: 'Weniger',
      statLabel: 'Kündigungen durch aktive, verlässliche Bindung',
    },
    chat: [
      { role: 'ai', text: 'Studio Kern, hier spricht der KI-Assistent.' },
      { role: 'caller', text: 'Hallo, Mitgliedsnummer 4471. Ich möchte dauerhaft in den Yoga-Kurs dienstags um 18 Uhr.' },
      { role: 'ai', text: 'Danke, Frau Yilmaz. 18 Uhr ist dauerhaft voll – um 19:15 Uhr gibt Lena denselben Kurs, dort ist noch Platz.' },
      { role: 'caller', text: 'Dann 19:15 Uhr. Und falls um 18 Uhr etwas frei wird?' },
      { role: 'ai', text: 'Ab nächster Woche sind Sie dienstags um 19:15 Uhr gebucht. Für 18 Uhr setze ich Sie auf die Warteliste.' },
      { role: 'caller', text: 'Und wenn ich mal nicht kann?' },
      { role: 'ai', text: 'Dann sagen Sie bis zwei Stunden vorher ab, und Ihr Platz wird für diese Woche frei. Bis Dienstag, Frau Yilmaz.' },
    ],
  },
];


/*
  What stands in the customer's own system after each example call. Every
  value is taken from the transcript above it. The last row is the status —
  and the status is "gebucht", not "notiert": the assistant finishes the
  process in the call, so nobody transfers anything afterwards.

  This is `ABWICKLUNG.faehigkeit` shown rather than told, and it carries its
  condition in sight: the example runs on a verified calendar connection
  (`ABWICKLUNG.badge` on the card, `ABWICKLUNG.kurz` in the footnote). That is
  the owner's binding BOOKING_WRITE answer (OWNER-INPUT.md, 10.09.2026):
  booking may be shown wherever the customer-specific connection is set up
  and verified — which is how every Cogniiq deployment is set up.
*/
const SUMMARIES: Record<Industry, { label: string; value: string }[]> = {
  Arztpraxis: [
    { label: 'Anliegen', value: 'Sprechstunde, vor 13 Uhr' },
    { label: 'Termin', value: 'Donnerstag, 9:40 Uhr' },
    { label: 'Patientin', value: 'Maier, per Geburtsdatum identifiziert' },
    { label: 'Status', value: 'Gebucht, nichts nachzutragen' },
  ],
  Restaurant: [
    { label: 'Reservierung', value: 'Samstag, 19:30 Uhr' },
    { label: 'Tisch', value: '4 Personen, Ecktisch am Fenster' },
    { label: 'Hinweise', value: 'Nussallergie, Geburtstag mit Kerze' },
    { label: 'Status', value: 'Reserviert, nichts nachzutragen' },
  ],
  Immobilien: [
    { label: 'Objekt', value: '3 Zimmer, 84 m², Sonnenstraße' },
    { label: 'Interessent', value: 'Keller, zu zweit, Finanzierung steht' },
    { label: 'Besichtigung', value: 'Donnerstag, 18:30 Uhr' },
    { label: 'Status', value: 'Gebucht, im Kalender des Maklers' },
  ],
  'Sport & Fitness': [
    { label: 'Kurs', value: 'Yoga, dienstags 19:15 Uhr' },
    { label: 'Mitglied', value: 'Yilmaz, Nr. 4471' },
    { label: 'Warteliste', value: 'Dienstag, 18:00 Uhr' },
    { label: 'Status', value: 'Gebucht, ab nächster Woche' },
  ],
};

/*
  WIE DIESE GESPRÄCHE GEBAUT SIND — Stand 30.09.2026.

  Jedes Beispiel zeigt im Ausschnitt einen vollständigen Ablauf in fünf
  Zügen, so wie ein echtes Gespräch beginnt:

    1. Der Assistent meldet sich mit dem Namen des Betriebs und sagt, dass
       ein KI-System spricht. Das ist keine Stilfrage: Die Ansage ist nach
       Art. 50 KI-VO Pflicht, nicht abschaltbar (OWNER-INPUT.md, C), und die
       Website verspricht sie wörtlich. Ein Beispiel ohne sie widerspräche
       der eigenen Seite.
    2. Der Anrufer nennt sein Anliegen samt Randbedingung.
    3. Der Assistent zeigt, dass er MITDENKT: Er erkennt den Anrufer im
       System, hält die Randbedingung ein („vor eins"), löst einen Konflikt
       mit einer besseren Alternative („um 20 Uhr ausgebucht — der Ecktisch
       um 19:30 Uhr") oder nennt die Fakten aus dem Exposé.
    4. Der Anrufer wählt.
    5. Der Assistent bucht und liest den Termin vollständig zurück.

  Das vollständige Gespräch zeigt dann die zweite Hälfte der Kompetenz: wo
  der Assistent bewusst aufhört (medizinische Fragen gehen an das
  Praxisteam), was er zusätzlich festhält (Allergie, Warteliste, eine Frage
  an den Makler) und dass Verschieben und Absagen ebenfalls im Gespräch
  erledigt werden.

  Grenzen, die jede Zeile einhält: keine medizinische Einschätzung, keine
  SMS- oder E-Mail-Bestätigung als Standard (SMS_EMAIL_CONFIRMATION),
  Bestätigung mündlich im Gespräch; Namen, Betriebe und Zahlen sind
  erfunden, der Abschnitt ist als nachgestelltes Beispiel gekennzeichnet.

  LÄNGE IST TEIL DES ENTWURFS. Im gepinnten Modus muss die Bühne unter die
  Navigation eines Laptop-Fensters passen; jede Zeile im Ausschnitt ist
  deshalb auf höchstens zwei Bildschirmzeilen geschrieben.
*/
const AUSSCHNITT_LAENGE = 5;


/* ═══════════════════════════════════════════════════════════════════════════
   SCROLL-GESTEUERTE ERZÄHLUNG (Stand 30.09.2026)
   ═══════════════════════════════════════════════════════════════════════════
   Auf dem Desktop bleibt der Abschnitt für rund zweieinhalb Bildschirmhöhen
   stehen, und die Scrollposition erzählt den Ablauf: Erst der Anruf, dann das
   Gespräch Nachricht für Nachricht, dann die Buchung Zeile für Zeile, zuletzt
   der Status: erledigt — der Termin steht im System, niemand trägt nach. Der Besucher steuert das Tempo selbst —
   nichts läuft von allein, nichts wird übersprungen, und ein Scroll zurück
   spielt die Szene rückwärts.

   Drei Regeln halten das sicher:

   1. NUR AUF DEM CLIENT. `pinned` ist im Prerender und beim ersten Client-
      Render `false`; erst ein Effekt schaltet es für Desktop-Viewports mit
      genug Höhe und ohne `prefers-reduced-motion` ein. Im HTML steht also
      jede Nachricht und jede Zeile vollständig sichtbar — kein `opacity: 0`
      im Prerender, keine unsichtbaren Inhalte für Crawler oder ohne
      JavaScript.

   2. UNTER DEM ERSTEN BILDSCHIRM. Der Abschnitt folgt auf den Hero; nichts
      hier ist LCP-Kandidat.

   3. DERSELBE INHALT. Tabs, Ausschnitt, vollständiges Protokoll und
      Zusammenfassung sind Wort für Wort dieselben wie ohne Erzählung. Die
      Erzählung ist eine Darstellungsschicht über dem Markup, keine zweite
      Fassung. Auf Mobilgeräten und kleinen Bildschirmen übernimmt eine
      native CSS-Scroll-Timeline (`.cq-view-rise`) den gestaffelten Einstieg
      — ohne JavaScript und ohne Pinning.
   ═══════════════════════════════════════════════════════════════════════ */

/*
  Gepinnt wird nur, wenn die ganze Bühne unter der festen Navigation (72 px)
  Platz hat. Die Media Query ist die Vorbedingung (Desktop, Bewegung erlaubt,
  keine Zwergfenster); ob es WIRKLICH passt, wird danach GEMESSEN: Ein
  ResizeObserver vergleicht die Höhe der kompakten Bühne mit dem freien
  Fensterausschnitt und hebt den Pin auf, sobald ein Pixel fehlen würde.
  Damit hängt der Modus nicht an einer geratenen Schwelle, sondern am
  tatsächlichen Inhalt — Laptop-Fenster mit ~700 px freier Höhe bekommen die
  Erzählung, ein zu kleines Fenster die CSS-Scroll-Timeline, und nichts wird
  je abgeschnitten.

  Die gepinnte Bühne ist dafür KOMPAKTER gesetzt als der freie Abschnitt:
  Einleitung und Stationen stehen rechts neben der Überschrift statt darunter,
  die Abstände sind enger, das Gesprächsfeld hat weniger Innenabstand. Der
  Inhalt ist derselbe.
*/
const PINNED_MEDIA =
  '(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)';
const NAV_HEIGHT_PX = 72;
/** Luft zwischen Bühne und Fensterrand, die bei der Messung mitzählt. */
const STAGE_SLACK_PX = 16;

/** Bildschirmhöhen, die der Abschnitt im gepinnten Modus einnimmt. */
const STORY_HEIGHT_VH = 260;

/* Anteile am Scrollweg, an denen die Beats liegen. */
const BEAT = {
  gespraechStart: 0.06,
  gespraechEnde: 0.5,
  kartenStart: 0.5,
  zeilenStart: 0.56,
  zeilenEnde: 0.9,
  erledigt: 0.9,
} as const;

const STAGES = ['Anruf', 'Gespräch', 'Buchung', 'Erledigt'] as const;

function stageAt(p: number): number {
  if (p < BEAT.gespraechStart) return 0;
  if (p < BEAT.kartenStart) return 1;
  if (p < BEAT.erledigt) return 2;
  return 3;
}

/** Ein Element, das zwischen `von` und `bis` des Scrollwegs erscheint. */
function Beat({
  progress,
  von,
  bis,
  aktiv,
  index,
  as: Tag = 'div',
  className,
  children,
}: {
  progress: MotionValue<number>;
  von: number;
  bis: number;
  aktiv: boolean;
  /** Staffelung für die CSS-Scroll-Timeline im nicht gepinnten Modus. */
  index: number;
  as?: 'div' | 'li';
  className?: string;
  children: ReactNode;
}) {
  const opacity = useTransform(progress, [von, bis], [0, 1]);
  const y = useTransform(progress, [von, bis], [16, 0]);
  const Comp = Tag === 'li' ? motion.li : motion.div;
  return (
    <Comp
      className={className}
      style={aktiv ? { opacity, y } : ({ '--cq-i': index } as Record<string, number>)}
    >
      {children}
    </Comp>
  );
}

/*
  ZWEI ZUSTÄNDE, NICHT EINER.

  `compact` — das Layout. Gilt, sobald der Bildschirm grundsätzlich in Frage
  kommt (Media Query). Es hängt NICHT an der Messung.
  `pinned`  — das Verhalten (sticky Bühne, scrollgesteuerte Beats). Gilt nur,
  wenn die kompakte Bühne tatsächlich unter die Navigation passt.

  Getrennt, weil die Messung sonst sich selbst widerlegt: Hinge das Layout am
  Pin, wechselte ein zu hoher Tab auf das großzügige freie Layout — und das
  wäre bei jeder späteren Messung zu hoch, der Pin käme nie zurück. So wird
  immer dieselbe kompakte Bühne gemessen, und der Pin folgt ihr in beide
  Richtungen.
*/
function useStoryMode(stageRef: React.RefObject<HTMLDivElement>): { compact: boolean; pinned: boolean } {
  const [eligible, setEligible] = useState(false);
  const [fits, setFits] = useState(true);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(PINNED_MEDIA);
    const apply = (m: boolean) => startTransition(() => setEligible(m));
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!eligible || typeof ResizeObserver !== 'function') return;
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const available = window.innerHeight - NAV_HEIGHT_PX - STAGE_SLACK_PX;
      const next = stage.offsetHeight <= available;
      startTransition(() => setFits((cur) => (cur === next ? cur : next)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [eligible, stageRef]);

  return { compact: eligible, pinned: eligible && fits };
}

const spotlight = spotlightHandlers();
export function SolutionShowcase() {
  const [activeIndustry, setActiveIndustry] = useState<Industry>('Arztpraxis');
  const [transkriptOffen, setTranskriptOffen] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { compact, pinned } = useStoryMode(stageRef);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const [stage, setStage] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = stageAt(p);
    setStage((cur) => (cur === next ? cur : next));
  });
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const cardOpacity = useTransform(scrollYProgress, [BEAT.kartenStart, BEAT.zeilenStart], [0.35, 1]);
  const cardY = useTransform(scrollYProgress, [BEAT.kartenStart, BEAT.zeilenStart], [20, 0]);
  const statusOpacity = useTransform(scrollYProgress, [BEAT.erledigt, 0.97], [0, 1]);

  const scenario = SCENARIOS.find((s) => s.label === activeIndustry)!;
  const SvcIcon = scenario.solution.serviceIcon;
  const summary = SUMMARIES[activeIndustry];
  const hatMehr = scenario.chat.length > AUSSCHNITT_LAENGE;
  const sichtbareNachrichten =
    transkriptOffen || !hatMehr ? scenario.chat : scenario.chat.slice(0, AUSSCHNITT_LAENGE);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = SCENARIOS.length - 1;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = last;
    if (next === null) return;
    e.preventDefault();
    setActiveIndustry(SCENARIOS[next].label);
    setTranskriptOffen(false);
    tabRefs.current[next]?.focus();
  };

  const abschluss = (
    <div className={compact ? 'flex flex-col items-start gap-2.5' : 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'}>
      <p className="max-w-[54ch] text-[15px] leading-[1.6] text-pub-ink-2">
        Welche Abläufe der Assistent im Gespräch zu Ende führt, wo er an einen
        Menschen übergibt und was er ausdrücklich nicht tut, steht auf der Produktseite.
      </p>
      <PubLinkButton to="/ki-telefonassistent" variant="secondary" size="md" icon={ArrowRight} iconTrailing className="h-auto min-h-11 max-w-full whitespace-normal py-2.5 text-center sm:shrink-0">
        KI-Telefonassistent ansehen
      </PubLinkButton>
    </div>
  );

  const n = sichtbareNachrichten.length;
  const gespraechSchritt = (BEAT.gespraechEnde - BEAT.gespraechStart) / n;
  const zeilenSchritt = (BEAT.zeilenEnde - BEAT.zeilenStart) / summary.length;

  return (
    <MotionConfig reducedMotion="user">
    <section
      ref={sectionRef}
      className={`relative border-t border-pub-hairline-soft bg-white ${pinned ? '' : 'py-20 lg:py-28'}`}
      style={pinned ? { height: `${STORY_HEIGHT_VH}vh` } : undefined}
      aria-labelledby="showcase-heading"
    >
      <div
        className={pinned ? 'sticky flex items-center overflow-hidden' : undefined}
        style={pinned ? { top: NAV_HEIGHT_PX, height: `calc(100vh - ${NAV_HEIGHT_PX}px)` } : undefined}
      >
      <div ref={stageRef} className={`relative mx-auto w-full max-w-[1200px] px-6 lg:px-10 ${compact ? 'py-3' : ''}`}>
        {pinned && (
          <motion.div
            aria-hidden="true"
            className="cq-story-rail absolute inset-x-6 top-0 h-px bg-pub-ink lg:inset-x-10"
            style={{ scaleX: railScale }}
          />
        )}
        <div
          className={
            compact
              ? 'mb-5 grid items-end gap-x-10 gap-y-3 pt-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]'
              : 'mb-10 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between'
          }
        >
          <div className={compact ? 'min-w-0' : 'max-w-2xl'}>
            <PubEyebrow className={compact ? 'mb-2.5' : 'mb-4'}>Nachgestelltes Beispiel – kein echter Anruf</PubEyebrow>
            <h2
              id="showcase-heading"
              className={`font-bold leading-[1.1] tracking-[-0.02em] text-pub-ink ${
                compact ? 'whitespace-nowrap text-[clamp(26px,2.3vw,33px)]' : 'mb-4 text-[clamp(30px,3.2vw,40px)]'
              }`}
            >
              Vom Anruf zum gebuchten Termin.
            </h2>
            {!compact && (
              <p className="max-w-[58ch] text-[17px] leading-[1.6] text-pub-ink-2">
                Links das Gespräch, rechts das, was danach in Ihrem System steht: Der
                Termin ist gebucht und dokumentiert. Ihr Team muss nichts nachtragen.
              </p>
            )}
          </div>

          {/* Gepinnt steht die Einleitung RECHTS neben der Überschrift —
              gleicher Satz, halbe Höhe. */}
          {compact && (
            <p className="min-w-0 max-w-[52ch] text-[15px] leading-[1.55] text-pub-ink-2 lg:justify-self-end">
              Links das Gespräch, rechts das, was danach in Ihrem System steht: Der
                Termin ist gebucht und dokumentiert. Ihr Team muss nichts nachtragen.
            </p>
          )}
        </div>

        <div className={compact ? 'mb-3 flex flex-wrap items-center justify-between gap-x-8 gap-y-3' : 'mb-8'}>
        <div role="tablist" aria-label="Branche wählen" className="flex flex-wrap gap-2">
          {SCENARIOS.map((s, i) => {
            const Icon = s.icon;
            const isActive = s.label === activeIndustry;
            return (
              <button
                key={s.label}
                ref={(el) => { tabRefs.current[i] = el; }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${i}`}
                aria-selected={isActive}
                aria-controls={`${baseId}-panel`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => { setActiveIndustry(s.label); setTranskriptOffen(false); }}
                onKeyDown={(e) => onTabKey(e, i)}
                className={`relative inline-flex h-11 items-center gap-2 rounded-full border font-semibold transition-colors duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 ${
                  compact ? 'px-3.5 text-[13.5px]' : 'px-4 text-[14px]'
                } ${
                  isActive
                    ? 'border-transparent text-white'
                    : 'border-pub-ink/15 bg-white text-pub-ink-2 hover:border-pub-ink/40 hover:text-pub-ink'
                }`}
              >
                {/* Die Ink-Füllung ist EIN Element, das zwischen den Tabs
                    gleitet, statt auf dem einen zu verschwinden und auf dem
                    anderen zu erscheinen. */}
                {isActive && (
                  <motion.span
                    layoutId={`${baseId}-tab-indicator`}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-pub-ink"
                    transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.8 }}
                  />
                )}
                <Icon size={15} strokeWidth={1.75} aria-hidden="true" className={`relative ${isActive ? 'text-white/70' : 'text-pub-ink-3'}`} />
                <span className="relative">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Stationen der Erzählung — nur im gepinnten Modus, nur auf dem
            Client, rein dekorativ. Die aktive Station trägt Gewicht und
            einen gefüllten Punkt, nicht nur eine Farbe. */}
        {pinned && (
          <ol aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {STAGES.map((label, i) => {
              const aktiv = i === stage;
              const vorbei = i < stage;
              return (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-[background-color,transform] duration-300 ${
                      aktiv ? 'scale-125 bg-pub-ink' : vorbei ? 'bg-pub-ink/60' : 'bg-pub-ink/20'
                    }`}
                  />
                  <span
                    className={`text-[12px] uppercase tracking-[0.14em] transition-colors duration-300 ${
                      aktiv ? 'font-semibold text-pub-ink' : 'font-medium text-pub-ink-4'
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        </div>

        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${SCENARIOS.findIndex((s) => s.label === activeIndustry)}`}
          className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]"
        >
          {/* Conversation — excerpt by default, full transcript on request */}
          <div
            {...spotlight}
            className={`cq-surface cq-surface-edge relative flex min-w-0 flex-col rounded-[22px] border border-white/[0.06] bg-pub-ink p-5 ${compact ? '' : 'sm:p-8'}`}
          >
            <div className={`flex flex-wrap items-center justify-between gap-3 ${compact ? 'mb-4' : 'mb-6'}`}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Beispielgespräch · {scenario.label}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[11.5px] font-medium text-white/70">
                <SvcIcon size={12} aria-hidden="true" />
                {scenario.solution.service}
              </span>
            </div>
            <ol className={compact ? 'space-y-2.5' : 'space-y-3'}>
              {sichtbareNachrichten.map((msg, i) => {
                const isAi = msg.role === 'ai';
                const von = BEAT.gespraechStart + i * gespraechSchritt;
                return (
                  <Beat
                    key={`${activeIndustry}-${i}`}
                    as="li"
                    progress={scrollYProgress}
                    von={von}
                    bis={von + gespraechSchritt * 0.8}
                    aktiv={pinned}
                    index={i}
                    className={`flex ${isAi ? 'justify-start' : 'justify-end'} ${pinned ? '' : 'cq-view-rise'}`}
                  >
                    <p
                      className={`max-w-[92%] rounded-2xl px-4 text-[14px] leading-[1.55] sm:max-w-[85%] ${compact ? 'py-2.5' : 'py-3'} ${
                        isAi ? 'rounded-tl-md bg-white/[0.09] text-white/90' : 'rounded-tr-md bg-white text-pub-ink'
                      }`}
                    >
                      <span className="sr-only">{isAi ? 'Assistent: ' : 'Anrufer: '}</span>
                      {msg.text}
                    </p>
                  </Beat>
                );
              })}
            </ol>
            {hatMehr && (
              <div className={`border-t border-white/[0.08] ${compact ? 'mt-4 pt-3' : 'mt-5 pt-4'}`}>
                <button
                  type="button"
                  onClick={() => setTranskriptOffen((v) => !v)}
                  aria-expanded={transkriptOffen}
                  aria-controls={`${baseId}-transkript`}
                  className={`group inline-flex items-center gap-2 text-[14.5px] font-semibold text-white/85 ${compact ? 'h-9' : 'h-11'} transition-colors hover:text-white focus-visible:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pub-ink`}
                >
                  <span className="cq-underline">
                    {transkriptOffen
                      ? 'Ausschnitt zeigen'
                      : 'Vollständiges Beispielgespräch ansehen'}
                  </span>
                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className={`transition-transform duration-200 ${transkriptOffen ? 'rotate-180' : ''}`}
                  />
                </button>
                <p className="mt-1 text-[13px] text-white/60">
                  {transkriptOffen
                    ? `Alle ${scenario.chat.length} Nachrichten.`
                    : `Ausschnitt — ${AUSSCHNITT_LAENGE} von ${scenario.chat.length} Nachrichten.`}
                </p>
              </div>
            )}
          </div>

          {/* Summary + what changes */}
          <div className={`flex min-w-0 flex-col ${compact ? 'gap-4' : 'gap-5'}`}>
            <motion.div
              className={`rounded-[22px] border border-pub-hairline bg-white p-5 shadow-[0_1px_2px_rgba(11,15,20,0.03),0_24px_60px_-32px_rgba(11,15,20,0.18)] ${compact ? 'sm:p-5' : 'sm:p-8'} ${pinned ? '' : 'cq-view-rise'}`}
              style={pinned ? { opacity: cardOpacity, y: cardY } : undefined}
            >
              <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 ${compact ? 'mb-3' : 'mb-5'}`}>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-pub-ink-3">
                  In Ihrem System
                </p>
                {/* Die Bedingung steht am Beispiel selbst, nicht am Seitenende. */}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pub-accent-wash px-2.5 py-1 text-[11.5px] font-medium text-pub-accent-ink ring-1 ring-pub-accent-line">
                  <span className="h-1.5 w-1.5 rounded-full bg-pub-accent-soft" aria-hidden="true" />
                  {ABWICKLUNG.badge}
                </span>
              </div>
              <dl className="divide-y divide-pub-hairline-soft">
                {summary.map(({ label, value }, j) => {
                  const von = BEAT.zeilenStart + j * zeilenSchritt;
                  const letzte = j === summary.length - 1;
                  return (
                    <Beat
                      key={label}
                      progress={scrollYProgress}
                      von={von}
                      bis={von + zeilenSchritt * 0.85}
                      aktiv={pinned}
                      index={j}
                      className={`relative grid gap-1 min-[380px]:grid-cols-[120px_1fr] min-[380px]:gap-4 sm:grid-cols-[150px_1fr] ${compact ? 'py-2' : 'py-3'}`}
                    >
                      {/* Letzter Beat: Die Statuszeile bekommt einen Wash im
                          Accent-Ton — das ist der Moment, in dem der Termin
                          im System steht und der Vorgang erledigt ist. */}
                      {pinned && letzte && (
                        <motion.span
                          aria-hidden="true"
                          className="pointer-events-none absolute -inset-x-3 inset-y-0.5 rounded-xl bg-pub-accent-wash ring-1 ring-pub-accent-line"
                          style={{ opacity: statusOpacity }}
                        />
                      )}
                      <dt className="relative text-[13.5px] text-pub-ink-3">{label}</dt>
                      <dd className="relative text-[15px] font-medium leading-snug text-pub-ink">{value}</dd>
                    </Beat>
                  );
                })}
              </dl>
              <p className={`text-[13px] leading-relaxed text-pub-ink-3 ${compact ? 'mt-3' : 'mt-5'}`}>
                {ABWICKLUNG.kurz} Wir richten sie für Ihren Kalender oder Ihr
                Buchungssystem ein und prüfen sie vor dem Go-live — der Assistent bucht
                direkt dort, nicht in einer Liste für Ihr Team.
              </p>
            </motion.div>

            {/* Gepinnt steht der Abschluss unter der Zusammenfassung, wo die
                rechte Spalte ohnehin kürzer ist als das Gespräch — so wächst
                die Bühne nicht über den Bildschirm hinaus. */}
            {compact && abschluss}
          </div>
        </div>

        {!compact && <div className="mt-8">{abschluss}</div>}
      </div>
      </div>
    </section>
    </MotionConfig>
  );
}
