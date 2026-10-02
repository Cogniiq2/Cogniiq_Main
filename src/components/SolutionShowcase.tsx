import {
  startTransition,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
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
import {
  UHR_RUHE,
  aufZeitplan,
  enthuellteHoehe,
  uhrDauer,
  zeitplanAb,
  zeitplanFuer,
  type Zeitplan,
} from '@/lib/gespraechsuhr';
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
      { role: 'ai', text: 'Guten Morgen, Praxis Albrecht – Ihr KI-Assistent.' },
      { role: 'caller', text: 'Maier, geboren am 12.03.1968. Ich bräuchte diese Woche einen Termin, gern vor eins.' },
      { role: 'ai', text: 'Danke, Frau Maier. Vor eins hätte ich Donnerstag um 9:40 Uhr oder Freitag um 8:20 Uhr.' },
      { role: 'caller', text: 'Donnerstag ist super.' },
      { role: 'ai', text: 'Sehr gern – Donnerstag, 9:40 Uhr, ist eingetragen. Denken Sie bitte an Ihre Versichertenkarte.' },
      { role: 'caller', text: 'Und wenn ich bis dahin Fieber bekomme?' },
      { role: 'ai', text: 'Das kann ich medizinisch nicht beurteilen. Rufen Sie dann einfach an, ich leite Sie gleich an das Praxisteam weiter.' },
      { role: 'caller', text: 'Prima. Und falls ich verschieben muss?' },
      { role: 'ai', text: 'Dann rufen Sie einfach wieder an – das erledige ich direkt im Gespräch. Bis Donnerstag, Frau Maier.' },
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
      { role: 'ai', text: 'Guten Abend, Trattoria Lume – Ihr KI-Assistent.' },
      { role: 'caller', text: 'Berger hier. Haben Sie Samstag um 20 Uhr einen Tisch für vier? Wir feiern Geburtstag.' },
      { role: 'ai', text: 'Wie schön. Um 20 Uhr sind wir voll, aber um 19:30 Uhr wäre der ruhige Ecktisch am Fenster frei.' },
      { role: 'caller', text: 'Den nehmen wir. Einer von uns hat eine Nussallergie.' },
      { role: 'ai', text: 'Reserviert: Samstag, 19:30 Uhr, Ecktisch für vier. Die Küche weiß von Allergie und Geburtstag.' },
      { role: 'caller', text: 'Könnten Sie zum Dessert eine Kerze vorbereiten?' },
      { role: 'ai', text: 'Sehr gern, das steht bei Ihrer Reservierung. Der Service kümmert sich darum.' },
      { role: 'caller', text: 'Und falls wir es doch nicht schaffen?' },
      { role: 'ai', text: 'Dann rufen Sie kurz an, ich gebe den Tisch wieder frei. Einen schönen Abend – und alles Gute zum Geburtstag.' },
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
      { role: 'ai', text: 'Guten Tag, Immobilien Hartmann – Ihr KI-Assistent.' },
      { role: 'caller', text: 'Keller hier. Ist die 3-Zimmer-Wohnung in der Sonnenstraße noch frei? Zu zweit, Finanzierung steht.' },
      { role: 'ai', text: 'Ja, noch frei: 84 m², 3. OG mit Aufzug. Besichtigung ginge Dienstag, 17 Uhr, oder Donnerstag, 18:30 Uhr.' },
      { role: 'caller', text: 'Donnerstag passt uns gut.' },
      { role: 'ai', text: 'Wunderbar – Donnerstag, 18:30 Uhr, ist eingetragen. Herr Hartmann hat Ihre Angaben schon vorliegen.' },
      { role: 'caller', text: 'Eine Frage noch: Sind Katzen erlaubt?' },
      { role: 'ai', text: 'Laut Exposé ja. Ich gebe die Frage zur Sicherheit an Herrn Hartmann weiter, er bestätigt es Ihnen vor Ort. Bis Donnerstag.' },
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
      { role: 'ai', text: 'Hallo, Studio Kern – Ihr KI-Assistent.' },
      { role: 'caller', text: 'Hi, Mitgliedsnummer 4471. Ich würde gern dauerhaft in Yoga, dienstags um 18 Uhr.' },
      { role: 'ai', text: 'Hallo Frau Yilmaz. 18 Uhr ist leider voll – um 19:15 Uhr gibt Lena denselben Kurs, da ist noch Platz.' },
      { role: 'caller', text: 'Dann 19:15 Uhr. Und falls um 18 Uhr was frei wird?' },
      { role: 'ai', text: 'Gebucht: ab nächster Woche jeden Dienstag um 19:15 Uhr. Für 18 Uhr stehen Sie auf der Warteliste.' },
      { role: 'caller', text: 'Und wenn ich mal nicht kann?' },
      { role: 'ai', text: 'Dann einfach bis zwei Stunden vorher absagen, und Ihr Platz ist für die Woche frei. Viel Spaß bei Lena.' },
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
/*
  EINPASSEN STATT AUFGEBEN. Ist die Bühne ein paar Pixel zu hoch für das
  Fenster, wird sie als Ganzes leicht verkleinert (transform: scale), statt
  den Pin fallen zu lassen. Vorher hing die ganze Erzählung an einer harten
  Schwelle: 8 px mehr Inhalt, und auf einem typischen Laptop verschwand sie.
  Unter diesem Faktor wäre der Text zu klein — dann übernimmt der Fluss.
*/
const MIN_FIT_SCALE = 0.78;

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

/**
 * Ein Element, das zwischen `von` und `bis` des (gefederten) Scrollwegs
 * erscheint. Nachrichten wachsen dabei aus der Ecke, aus der sie kommen —
 * Anrufer rechts unten, Assistent links unten —, wie in einem Messenger.
 * Nur Opacity und Transform: kein Layout, keine Neuberechnung beim Scrollen.
 */
function Beat({
  progress,
  von,
  bis,
  aktiv,
  index,
  herkunft = 'mitte',
  stil = 'fluss',
  as: Tag = 'div',
  className,
  children,
}: {
  progress: MotionValue<number>;
  von: number;
  bis: number;
  aktiv: boolean;
  /** Staffelung für die CSS-Scroll-Timeline, solange JavaScript nicht läuft. */
  index: number;
  herkunft?: 'links' | 'rechts' | 'mitte';
  /**
   * `buehne` — die gepinnte Erzählung: Opacity und 16 px Anstieg am rohen
   * Scrollweg, exakt die freigegebene Fassung (Stand 19840d0). Kein Scale,
   * keine Feder: Die Bühne steht still, und die Nachricht folgt dem Finger
   * ohne Nachlauf.
   * `fluss` — Telefone und Tablets ohne Pin.
   */
  stil?: 'buehne' | 'fluss';
  as?: 'div' | 'li';
  className?: string;
  children: ReactNode;
}) {
  const buehne = stil === 'buehne';
  const opacity = useTransform(progress, [von, bis], [0, 1]);
  const y = useTransform(progress, [von, bis], [buehne ? 16 : 18, 0]);
  const scale = useTransform(progress, [von, bis], [buehne || herkunft === 'mitte' ? 1 : 0.965, 1]);
  const Comp = Tag === 'li' ? motion.li : motion.div;
  const transformOrigin =
    herkunft === 'links' ? 'left bottom' : herkunft === 'rechts' ? 'right bottom' : 'center';
  return (
    <Comp
      className={className}
      style={
        !aktiv
          ? ({ '--cq-i': index } as Record<string, number>)
          : buehne
            ? { opacity, y }
            : { opacity, y, scale, transformOrigin, willChange: 'transform, opacity' }
      }
    >
      {children}
    </Comp>
  );
}

/*
  Feder für den Scrollweg. Rohes scrollYProgress springt mit jedem Wheel-
  Ereignis; die Feder läuft ihm mit etwas Masse nach und macht aus Stufen
  eine Bewegung. Die Werte sind so gewählt, dass die Verzögerung unter
  einer Zehntelsekunde bleibt — gefühlt direkt, sichtbar weich.
*/
const SCROLL_SPRING = { stiffness: 170, damping: 30, mass: 0.35, restDelta: 0.0005 } as const;

/** Im Fluss: Anteil des Gesprächswegs, auf dem die Nachrichten erscheinen.
 *  Der Rest gehört der Buchung auf der Karte. */
const GESPRAECH_FLUSS_ENDE = 0.66;

/* ═══════════════════════════════════════════════════════════════════════
   GESPRÄCHSUHR — ein Zeitstrahl für Ausschnitt UND vollständiges Gespräch

   Gemessen am 02.10.2026: Das Aufklappen machte die Bühne 250 px höher
   (669 → 919 px). Bei 1440×900 schrumpfte deshalb die ganze Bühne auf 88 %,
   bei 1280×800 fiel der Pin weg — der Abschnitt verlor schlagartig 936 px
   Höhe, die Seite sprang ans Ende der Erzählung. Zusätzlich wurden die
   Fenster aller Nachrichten neu auf 9 statt 5 verteilt: Was gerade erschien,
   sprang auf volle Deckkraft, und wer nach dem Ausschnitt aufklappte, bekam
   die vier neuen Nachrichten ohne jede Bewegung.

   Die Rechnung liegt in lib/gespraechsuhr.ts (mit Tests).

   Jetzt läuft das Gespräch auf EINER Größe, gemessen in Nachrichten:
   Nachricht i erscheint, während der Wert von i nach i + 0,8 läuft. Der Wert
   ist das Minimum aus Scrollweg und Uhr, im Fluss nach unten begrenzt durch
   einen Boden:

     gespraech = max(boden, min(scrollweg, uhr))

   - Scrollweg (gepinnt): eine stückweise lineare Abbildung des Abschnitts-
     Fortschritts. Im Ausschnitt exakt die freigegebene Zeitachse
     (6 % → 50 % für 5 Nachrichten). Beim Aufklappen wird sie AB DER AKTUELLEN
     STELLE neu geplant: Was schon steht, bleibt; der Rest teilt sich den
     verbleibenden Weg.
   - Uhr: in Ruhe unbegrenzt. Beim Umschalten läuft sie von der aktuellen
     Stelle zum Ziel — so kommen Nachrichten, deren Scrollweg schon hinter
     dem Besucher liegt, nacheinander an statt alle zugleich.
   - Boden (Fluss): Was beim Aufklappen schon gelesen wurde, blendet nicht
     wieder aus, wenn die Liste wächst und sich ihr eigener Fortschritt ändert.

   Gepinnt bleibt die Bühne dabei gleich hoch: Das Gespräch steht in einem
   Fenster von der Höhe des Ausschnitts und rückt wie ein Messenger nach
   oben, sobald eine neue Nachricht ankommt. Ebenfalls nur Transform.
   ═══════════════════════════════════════════════════════════════════════ */

/** Abschnitt des Scrollwegs, auf dem das Gespräch läuft. */
const GESPRAECHSPHASE = { start: BEAT.gespraechStart, ende: BEAT.gespraechEnde } as const;
/** Anteil einer Nachrichteneinheit, über den eine Nachricht einblendet. */
const EINBLENDEN_BUEHNE = 0.8;
const EINBLENDEN_FLUSS = 0.9;
/** Gleichmäßige Ankunft: sanft an, sanft aus — kein Ruck am Anfang oder Ende. */
const UHR_EASE = [0.4, 0, 0.2, 1] as const;
/** Höhe des weichen Ausblendens am oberen Fensterrand. */
const FENSTER_MASKE_PX = 56;

/** Layout-Effekt im Browser, im Prerender (renderToString) ein normaler Effekt. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

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
function useStoryMode(stageRef: React.RefObject<HTMLDivElement>): {
  compact: boolean;
  pinned: boolean;
  animated: boolean;
  fitScale: number;
} {
  const [eligible, setEligible] = useState(false);
  // 1 = passt in natürlicher Größe. Gemessen wird die UNSKALIERTE Höhe
  // (offsetHeight ignoriert transform), daher kein Rückkopplungseffekt.
  const [fitScale, setFitScale] = useState(1);
  // Scrollgesteuerte Beats laufen auf JEDEM Gerät mit erlaubter Bewegung —
  // gepinnt, wo die Bühne passt, sonst im Fluss. Im Prerender `false`.
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const apply = (m: boolean) => startTransition(() => setAnimated(m));
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
      const natural = stage.offsetHeight;
      // Auf zwei Nachkommastellen gerundet: keine Neuberechnung für
      // Sub-Pixel-Schwankungen beim Scrollen mobiler Browserleisten.
      const next = natural > 0 ? Math.min(1, Math.floor((available / natural) * 100) / 100) : 1;
      startTransition(() => setFitScale((cur) => (cur === next ? cur : next)));
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

  return { compact: eligible, pinned: eligible && fitScale >= MIN_FIT_SCALE, animated, fitScale };
}

const spotlight = spotlightHandlers();
export function SolutionShowcase() {
  const [activeIndustry, setActiveIndustry] = useState<Industry>('Arztpraxis');
  const [transkriptOffen, setTranskriptOffen] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLOListElement>(null);
  const cardRef = useRef<HTMLDListElement>(null);
  const { compact, pinned, animated, fitScale } = useStoryMode(stageRef);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  /*
    FLUSS-MODUS: Ist die Bühne nicht gepinnt (kleinere Fenster, Tablets,
    Telefone), hängt jede Liste an ihrer EIGENEN Lage im Fenster. Das
    Gespräch beginnt, wenn seine Oberkante bei 88 % der Fensterhöhe steht,
    und ist vollständig, wenn seine Unterkante 58 % erreicht — die
    Nachrichten erscheinen also genau dort, wo das Auge gerade liest.
  */
  const chatScroll = useScroll({ target: chatRef, offset: ['start 0.88', 'end 0.58'] });
  const cardScroll = useScroll({ target: cardRef, offset: ['start 0.88', 'end 0.62'] });
  const chatSmooth = useSpring(chatScroll.scrollYProgress, SCROLL_SPRING);
  const cardSmooth = useSpring(cardScroll.scrollYProgress, SCROLL_SPRING);
  const [stage, setStage] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = stageAt(p);
    setStage((cur) => (cur === next ? cur : next));
  });
  // Die gepinnte Bühne läuft am ROHEN Scrollweg — so wie freigegeben.
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const cardOpacity = useTransform(scrollYProgress, [BEAT.kartenStart, BEAT.zeilenStart], [0.35, 1]);
  const cardY = useTransform(scrollYProgress, [BEAT.kartenStart, BEAT.zeilenStart], [20, 0]);
  const statusPinned = useTransform(scrollYProgress, [BEAT.erledigt, 0.97], [0, 1]);
  /*
    REIHENFOLGE IM FLUSS. Nebeneinander (Desktop, nicht gepinnt) steht die
    Karte höher als das Ende des Gesprächs — sie würde „gebucht" zeigen,
    bevor der Assistent gebucht hat. Die Zeilen folgen deshalb dem SPÄTEREN
    von zwei Signalen: dem Ende des Gesprächs (letztes Drittel seines Wegs) und
    der eigenen Lage der Karte. Nebeneinander entscheidet das Gespräch,
    untereinander (Telefon) die Karte — ohne Sonderfall im Layout.
  */
  const rowsFlow = useTransform([cardSmooth, chatSmooth], ([karte, gespraech]: number[]) =>
    Math.min(karte, Math.max(0, Math.min(1, (gespraech - GESPRAECH_FLUSS_ENDE) / (1 - GESPRAECH_FLUSS_ENDE)))),
  );
  const statusFlow = useTransform(rowsFlow, [0.86, 1], [0, 1]);

  /* ── Gesprächsuhr (siehe Kopfkommentar oben) ─────────────────────── */
  // Eingehängte Nachrichten. Folgt `transkriptOffen` beim Aufklappen sofort,
  // beim Zuklappen erst, wenn die zusätzlichen Nachrichten ausgeblendet sind.
  const [anzahl, setAnzahl] = useState(AUSSCHNITT_LAENGE);
  const anzahlRef = useRef(AUSSCHNITT_LAENGE);
  const pinnedRef = useRef(pinned);
  const zeitplanRef = useRef<Zeitplan>(zeitplanFuer(GESPRAECHSPHASE, AUSSCHNITT_LAENGE));
  const unterkantenRef = useRef<number[]>([]);
  const uhrLauf = useRef<AnimationPlaybackControls | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const ankerRef = useRef<number | null>(null);
  const uhr = useMotionValue(UHR_RUHE);
  const boden = useMotionValue(0);
  const fensterHoehe = useMotionValue(0);
  // Zählt hoch, wenn sich Zeitplan, Modus oder Messung ändern — Refs lösen
  // selbst keine Neuberechnung der abgeleiteten Werte aus.
  const takt = useMotionValue(0);
  const neuBerechnen = () => takt.set(takt.get() + 1);

  const gespraech = useTransform(
    [scrollYProgress, chatSmooth, uhr, boden, takt],
    ([p, fluss, u, b]: number[]) => {
      const weg = pinnedRef.current
        ? aufZeitplan(zeitplanRef.current, p)
        : (fluss * anzahlRef.current) / GESPRAECH_FLUSS_ENDE;
      return Math.max(b, Math.min(weg, u));
    },
  );
  // Messenger-Versatz: wie weit die Liste im Fenster nach oben gerückt ist.
  // Ungefedert wie alle Beats der Bühne — folgt dem Finger ohne Nachlauf;
  // die Uhr liefert beim Umschalten ihre eigene, weiche Kurve.
  const versatz = useTransform([gespraech, fensterHoehe, takt], ([u, h]: number[]) =>
    pinnedRef.current && anzahlRef.current > AUSSCHNITT_LAENGE
      ? Math.max(0, enthuellteHoehe(u, unterkantenRef.current, EINBLENDEN_BUEHNE) - h)
      : 0,
  );
  const listeY = useTransform(versatz, (v) => -v);
  const fensterMaske = useTransform(versatz, (v) => {
    const deckung = 1 - Math.min(1, v / FENSTER_MASKE_PX);
    return `linear-gradient(to bottom, rgba(0,0,0,${deckung.toFixed(3)}) 0px, #000 ${FENSTER_MASKE_PX}px)`;
  });

  const anzahlSetzen = (n: number) => {
    anzahlRef.current = n;
    setAnzahl(n);
    neuBerechnen();
  };

  useIsoLayoutEffect(() => {
    pinnedRef.current = pinned;
    neuBerechnen();
  }, [pinned]);

  useEffect(() => () => uhrLauf.current?.stop(), []);

  // Unterkanten der Nachrichten in der Liste. offsetTop/-Height ignorieren
  // transform — weder Bühnenskalierung noch Messenger-Versatz verfälschen sie.
  useIsoLayoutEffect(() => {
    const liste = chatRef.current;
    if (!liste) return;
    const messen = () => {
      const kanten = Array.from(liste.children, (el) => {
        const li = el as HTMLElement;
        return li.offsetTop + li.offsetHeight;
      });
      unterkantenRef.current = kanten;
      fensterHoehe.set(kanten[Math.min(AUSSCHNITT_LAENGE, kanten.length) - 1] ?? 0);
      neuBerechnen();
    };
    messen();
    if (typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(messen);
    ro.observe(liste);
    return () => ro.disconnect();
  }, [anzahl, activeIndustry, pinned, compact]);

  // Zuklappen im Fluss: Die Liste wird kürzer, der Schalter bleibt, wo er war.
  useIsoLayoutEffect(() => {
    const vorher = ankerRef.current;
    ankerRef.current = null;
    const knopf = toggleRef.current;
    if (vorher === null || !knopf || pinnedRef.current) return;
    const delta = knopf.getBoundingClientRect().top - vorher;
    if (Math.abs(delta) > 0.5) window.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
  }, [anzahl]);

  const transkriptUmschalten = () => {
    const oeffnen = !transkriptOffen;
    const ziel = oeffnen ? scenario.chat.length : AUSSCHNITT_LAENGE;
    setTranskriptOffen(oeffnen);
    uhrLauf.current?.stop();

    if (!animated) {
      if (!oeffnen && toggleRef.current) ankerRef.current = toggleRef.current.getBoundingClientRect().top;
      anzahlSetzen(ziel);
      return;
    }

    const jetzt = Math.min(gespraech.get(), anzahlRef.current);

    if (oeffnen) {
      if (pinnedRef.current) {
        zeitplanRef.current = zeitplanAb(GESPRAECHSPHASE, scrollYProgress.get(), jetzt, ziel);
        boden.set(0);
      } else {
        boden.set(Math.max(boden.get(), jetzt));
      }
      uhr.set(jetzt);
      anzahlSetzen(ziel);
      uhrLauf.current = animate(uhr, ziel, {
        duration: uhrDauer(ziel - jetzt),
        ease: UHR_EASE,
        onComplete: () => uhr.set(UHR_RUHE),
      });
      return;
    }

    boden.set(Math.min(boden.get(), ziel));
    const abschliessen = () => {
      if (pinnedRef.current) {
        zeitplanRef.current = zeitplanAb(GESPRAECHSPHASE, scrollYProgress.get(), Math.min(gespraech.get(), ziel), ziel);
      }
      if (toggleRef.current) ankerRef.current = toggleRef.current.getBoundingClientRect().top;
      anzahlSetzen(ziel);
      uhr.set(UHR_RUHE);
    };
    if (jetzt <= ziel) {
      abschliessen();
      return;
    }
    uhr.set(jetzt);
    uhrLauf.current = animate(uhr, ziel, {
      duration: uhrDauer(jetzt - ziel) * 0.7,
      ease: UHR_EASE,
      onComplete: abschliessen,
    });
  };

  const brancheWaehlen = (label: Industry) => {
    uhrLauf.current?.stop();
    uhr.set(UHR_RUHE);
    boden.set(0);
    zeitplanRef.current = zeitplanFuer(GESPRAECHSPHASE, AUSSCHNITT_LAENGE);
    setActiveIndustry(label);
    setTranskriptOffen(false);
    anzahlSetzen(AUSSCHNITT_LAENGE);
  };

  const scenario = SCENARIOS.find((s) => s.label === activeIndustry)!;
  const SvcIcon = scenario.solution.serviceIcon;
  const summary = SUMMARIES[activeIndustry];
  const hatMehr = scenario.chat.length > AUSSCHNITT_LAENGE;
  const sichtbareNachrichten = hatMehr ? scenario.chat.slice(0, anzahl) : scenario.chat;
  // Gepinnt und aufgeklappt: Das Gespräch steht im Messenger-Fenster.
  const fenster = pinned && animated && anzahl > AUSSCHNITT_LAENGE;

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = SCENARIOS.length - 1;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = last;
    if (next === null) return;
    e.preventDefault();
    brancheWaehlen(SCENARIOS[next].label);
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
      <div
        ref={stageRef}
        className={`relative mx-auto w-full max-w-[1200px] px-6 lg:px-10 ${compact ? 'py-3' : ''}`}
        style={pinned && fitScale < 1 ? { transform: `scale(${fitScale})`, transformOrigin: 'center center' } : undefined}
      >
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
                onClick={() => brancheWaehlen(s.label)}
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
            {/* Messenger-Fenster: gepinnt und aufgeklappt so hoch wie der
                Ausschnitt; die Liste rückt nach oben, oben blendet sie weich aus. */}
            <motion.div
              style={
                fenster
                  ? { height: fensterHoehe, overflow: 'hidden', maskImage: fensterMaske, WebkitMaskImage: fensterMaske }
                  : undefined
              }
            >
            <motion.ol
              ref={chatRef}
              className={`relative ${compact ? 'space-y-2.5' : 'space-y-3'}`}
              style={fenster ? { y: listeY } : undefined}
            >
              {sichtbareNachrichten.map((msg, i) => {
                const isAi = msg.role === 'ai';
                // Einheit: Nachrichten. Gepinnt bildet der Zeitplan den Weg des
                // Abschnitts darauf ab, im Fluss der Weg der Liste selbst.
                return (
                  <Beat
                    key={`${activeIndustry}-${i}`}
                    as="li"
                    progress={gespraech}
                    stil={pinned ? 'buehne' : 'fluss'}
                    von={i}
                    bis={i + (pinned ? EINBLENDEN_BUEHNE : EINBLENDEN_FLUSS)}
                    aktiv={animated}
                    herkunft={isAi ? 'links' : 'rechts'}
                    index={i}
                    className={`flex ${isAi ? 'justify-start' : 'justify-end'} ${animated ? '' : 'cq-view-rise'}`}
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
            </motion.ol>
            </motion.div>
            {hatMehr && (
              <div className={`border-t border-white/[0.08] ${compact ? 'mt-4 pt-3' : 'mt-5 pt-4'}`}>
                <button
                  ref={toggleRef}
                  type="button"
                  onClick={transkriptUmschalten}
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
              className={`rounded-[22px] border border-pub-hairline bg-white p-5 shadow-[0_1px_2px_rgba(11,15,20,0.03),0_24px_60px_-32px_rgba(11,15,20,0.18)] ${compact ? 'sm:p-5' : 'sm:p-8'} ${animated ? '' : 'cq-view-rise'}`}
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
              <dl ref={cardRef} className="divide-y divide-pub-hairline-soft">
                {summary.map(({ label, value }, j) => {
                  const flussSchritt = 0.86 / summary.length;
                  const von = pinned ? BEAT.zeilenStart + j * zeilenSchritt : j * flussSchritt;
                  const bis = pinned ? von + zeilenSchritt * 0.85 : von + flussSchritt * 0.9;
                  const letzte = j === summary.length - 1;
                  return (
                    <Beat
                      key={`${activeIndustry}-${label}`}
                      progress={pinned ? scrollYProgress : rowsFlow}
                      stil={pinned ? 'buehne' : 'fluss'}
                      von={von}
                      bis={bis}
                      aktiv={animated}
                      index={j}
                      className={`relative grid gap-1 min-[380px]:grid-cols-[120px_1fr] min-[380px]:gap-4 sm:grid-cols-[150px_1fr] ${compact ? 'py-2' : 'py-3'}`}
                    >
                      {/* Letzter Beat: Die Statuszeile bekommt einen Wash im
                          Accent-Ton — das ist der Moment, in dem der Termin
                          im System steht und der Vorgang erledigt ist. */}
                      {animated && letzte && (
                        <motion.span
                          aria-hidden="true"
                          className="pointer-events-none absolute -inset-x-3 inset-y-0.5 rounded-xl bg-pub-accent-wash ring-1 ring-pub-accent-line"
                          style={{ opacity: pinned ? statusPinned : statusFlow }}
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
