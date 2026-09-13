import { useId, useRef, useState, type KeyboardEvent } from 'react';
import {
  Stethoscope,
  Utensils,
  Building2,
  Dumbbell,
  PhoneCall,
  Calendar,
  ArrowRight,
  ChevronDown,
  Zap,
} from 'lucide-react';

import { PubEyebrow, PubLinkButton } from '@/components/public/PublicUI';

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
      { role: 'caller', text: 'Hallo, ich würde gerne einen Termin vereinbaren.' },
      { role: 'ai', text: 'Guten Tag! Hier ist die digitale Assistenz der Praxis. Welchen Arzt möchten Sie besuchen — Allgemein- oder Spezialsprechstunde?' },
      { role: 'caller', text: 'Allgemeinmedizin bitte, möglichst diese Woche.' },
      { role: 'ai', text: 'Kein Problem. Für die Allgemeinsprechstunde nimmt die Anmeldung Wunschzeiten entgegen — passt Ihnen Donnerstagvormittag oder Freitagnachmittag besser?' },
      { role: 'caller', text: 'Donnerstagvormittag passt gut.' },
      { role: 'ai', text: 'Donnerstagvormittag notiere ich. Unter welcher Nummer erreicht Sie die Anmeldung für die Bestätigung?' },
      { role: 'caller', text: '0151 2345678.' },
      { role: 'ai', text: 'Danke. Ihr Terminwunsch geht mit Ihrer Rückrufnummer an die Anmeldung. Noch etwas, wobei ich helfen kann?' },
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
      { role: 'caller', text: 'Guten Abend, kann ich für Samstag einen Tisch reservieren?' },
      { role: 'ai', text: 'Guten Abend, herzlich willkommen! Für wie viele Personen darf ich den Wunsch notieren?' },
      { role: 'caller', text: 'Für 4 Personen, am liebsten 19:30 Uhr.' },
      { role: 'ai', text: 'Samstag 19:30 Uhr für 4 Personen notiere ich als Wunsch. Haben Sie besondere Wünsche — Fenstertisch oder Allergieinformationen?' },
      { role: 'caller', text: 'Einen Fenstertisch wäre toll.' },
      { role: 'ai', text: 'Fenstertisch ist notiert. Unter welcher Nummer erreicht Sie das Team für die Bestätigung?' },
      { role: 'caller', text: '0151 2345678.' },
      { role: 'ai', text: 'Danke. Ihr Reservierungswunsch geht mit allen Angaben an den Service. Einen schönen Abend!' },
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
      service: 'Automatisierung & KI',
      serviceIcon: Zap,
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
      { role: 'caller', text: 'Ich habe Interesse an der inserierten 3-Zimmer-Wohnung.' },
      { role: 'ai', text: 'Hallo! Danke für Ihr Interesse. Darf ich Ihnen kurz ein paar Fragen stellen, damit wir den Termin optimal vorbereiten können?' },
      { role: 'caller', text: 'Ja, natürlich.' },
      { role: 'ai', text: 'Suchen Sie zur Eigennutzung oder als Kapitalanlage? Und haben Sie bereits eine Finanzierungszusage?' },
      { role: 'caller', text: 'Eigennutzung, Finanzierung ist bereits in Klärung.' },
      { role: 'ai', text: 'Hervorragend. Ich schlage Ihnen jetzt drei Besichtigungstermine vor. Welcher passt Ihnen am besten?' },
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
      service: 'Website & Automatisierung',
      serviceIcon: Calendar,
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
      { role: 'caller', text: 'Gibt es noch Plätze im Yoga-Kurs am Dienstag?' },
      { role: 'ai', text: 'Hi! Der Yoga-Kurs Dienstag 18:00 Uhr hat noch 2 freie Plätze. Soll ich Sie auf die Liste setzen?' },
      { role: 'caller', text: 'Ja bitte, für diese Woche und alle weiteren Dienstage.' },
      { role: 'ai', text: 'Notiert — dauerhaft jeden Dienstag 18:00 Uhr. Das Team bestätigt Ihnen den Platz.' },
      { role: 'caller', text: 'Super, danke!' },
      { role: 'ai', text: 'Gern! Fällt ein Kurs aus, meldet sich das Studio bei Ihnen und nennt Ihnen die Alternativen.' },
    ],
  },
];


/*
  What the team would receive after each example call. Every value is taken from
  the transcript above it; nothing is a confirmed booking — the assistant records
  a wish and hands it over, the team confirms.
*/
const SUMMARIES: Record<Industry, { label: string; value: string }[]> = {
  Arztpraxis: [
    { label: 'Anliegen', value: 'Termin, Allgemeinsprechstunde' },
    { label: 'Terminwunsch', value: 'Donnerstagvormittag, diese Woche' },
    { label: 'Rückruf', value: 'Nummer hinterlegt' },
    { label: 'Übergabe', value: 'An die Anmeldung, zur Bestätigung' },
  ],
  Restaurant: [
    { label: 'Anliegen', value: 'Reservierung, Samstag' },
    { label: 'Wunsch', value: '19:30 Uhr, 4 Personen, Fenstertisch' },
    { label: 'Rückruf', value: 'Nummer hinterlegt' },
    { label: 'Übergabe', value: 'An den Service, zur Bestätigung' },
  ],
  Immobilien: [
    { label: 'Anliegen', value: 'Interesse an 3-Zimmer-Wohnung' },
    { label: 'Vorqualifizierung', value: 'Eigennutzung, Finanzierung in Klärung' },
    { label: 'Nächster Schritt', value: 'Besichtigungstermin vorgeschlagen' },
    { label: 'Übergabe', value: 'An den Makler, sortiert' },
  ],
  'Sport & Fitness': [
    { label: 'Anliegen', value: 'Yoga-Kurs, Dienstag 18:00 Uhr' },
    { label: 'Wunsch', value: 'Dauerhaft, jeden Dienstag' },
    { label: 'Status', value: 'Auf der Liste, Bestätigung durch das Team' },
    { label: 'Übergabe', value: 'An das Studio' },
  ],
};

/*
  Der Ausschnitt zeigt genug, damit das Gespräch verständlich ist: Anliegen,
  Rückfrage, Antwort, Abschluss des ersten Schritts. Das vollständige Protokoll
  bleibt einen Klick entfernt — es ist Beleg, nicht Einstieg, und acht
  Nachrichten haben auf der Startseite zwischen Produkt und Preis mehr Platz
  belegt als die Ergebnisdarstellung, um die es geht.
*/
const AUSSCHNITT_LAENGE = 4;

export function SolutionShowcase() {
  const [activeIndustry, setActiveIndustry] = useState<Industry>('Arztpraxis');
  const [transkriptOffen, setTranskriptOffen] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

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

  return (
    <section
      className="border-t border-pub-hairline-soft bg-white py-20 lg:py-28"
      aria-labelledby="showcase-heading"
    >
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="mb-10 max-w-2xl lg:mb-14">
          <PubEyebrow className="mb-4">Nachgestelltes Beispiel – kein echter Anruf</PubEyebrow>
          <h2
            id="showcase-heading"
            className="mb-4 text-[clamp(30px,3.2vw,40px)] font-bold leading-[1.1] tracking-[-0.02em] text-pub-ink"
          >
            Vom Anruf zum Ergebnis.
          </h2>
          <p className="max-w-[58ch] text-[17px] leading-[1.6] text-pub-ink-2">
            Links ein Ausschnitt aus dem Gespräch, rechts das, was danach bei Ihrem
            Team ankommt: strukturiert, mit Rückrufnummer, zur Bestätigung durch
            einen Menschen.
          </p>
        </div>

        <div role="tablist" aria-label="Branche wählen" className="mb-8 flex flex-wrap gap-2">
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
                className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 ${
                  isActive
                    ? 'border-pub-ink bg-pub-ink text-white'
                    : 'border-pub-ink/15 bg-white text-pub-ink-2 hover:border-pub-ink/40 hover:text-pub-ink'
                }`}
              >
                <Icon size={15} strokeWidth={1.75} aria-hidden="true" className={isActive ? 'text-white/70' : 'text-pub-ink-3'} />
                {s.label}
              </button>
            );
          })}
        </div>

        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${SCENARIOS.findIndex((s) => s.label === activeIndustry)}`}
          className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]"
        >
          {/* Conversation — excerpt by default, full transcript on request */}
          <div className="flex flex-col rounded-2xl border border-white/[0.06] bg-pub-ink p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Beispielgespräch · {scenario.label}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[11.5px] font-medium text-white/70">
                <SvcIcon size={12} aria-hidden="true" />
                {scenario.solution.service}
              </span>
            </div>
            <ol className="space-y-3">
              {sichtbareNachrichten.map((msg, i) => {
                const isAi = msg.role === 'ai';
                return (
                  <li key={`${activeIndustry}-${i}`} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                    <p
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-[1.55] ${
                        isAi ? 'rounded-tl-md bg-white/[0.09] text-white/90' : 'rounded-tr-md bg-white text-pub-ink'
                      }`}
                    >
                      <span className="sr-only">{isAi ? 'Assistent: ' : 'Anrufer: '}</span>
                      {msg.text}
                    </p>
                  </li>
                );
              })}
            </ol>
            {hatMehr && (
              <div className="mt-5 border-t border-white/[0.08] pt-4">
                <button
                  type="button"
                  onClick={() => setTranskriptOffen((v) => !v)}
                  aria-expanded={transkriptOffen}
                  aria-controls={`${baseId}-transkript`}
                  className="inline-flex h-11 items-center gap-2 text-[14.5px] font-semibold text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pub-ink"
                >
                  {transkriptOffen
                    ? 'Ausschnitt zeigen'
                    : 'Vollständiges Beispielgespräch ansehen'}
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
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-pub-hairline bg-white p-6 shadow-[0_12px_32px_rgba(11,15,20,0.06)] sm:p-8">
              <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-pub-ink-3">
                Beispiel einer Gesprächszusammenfassung
              </p>
              <dl className="divide-y divide-pub-hairline-soft">
                {summary.map(({ label, value }) => (
                  <div key={label} className="grid grid-cols-[120px_1fr] gap-4 py-3 sm:grid-cols-[150px_1fr]">
                    <dt className="text-[13.5px] text-pub-ink-3">{label}</dt>
                    <dd className="text-[15px] font-medium leading-snug text-pub-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-[13px] leading-relaxed text-pub-ink-3">
                Notiert wird ein Wunsch, keine Buchung. Die Bestätigung bleibt bei Ihrem Team,
                bis eine Anbindung an Ihr System geprüft und eingerichtet ist.
              </p>
            </div>

          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[54ch] text-[15px] leading-[1.6] text-pub-ink-2">
            Welche Anliegen der Assistent übernimmt, wo er an einen Menschen
            übergibt und was er ausdrücklich nicht tut, steht auf der Produktseite.
          </p>
          <PubLinkButton to="/ki-telefonassistent" variant="secondary" size="md" icon={ArrowRight} iconTrailing className="shrink-0">
            KI-Telefonassistent ansehen
          </PubLinkButton>
        </div>
      </div>
    </section>
  );
}
