import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Utensils,
  Building2,
  Dumbbell,
  PhoneCall,
  Clock,
  Calendar,
  MessageSquare,
  X,
  Check,
  ArrowRight,
  ChevronRight,
  Zap,
} from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
        'Rezeptionistin macht 3× Überstunden/Woche',
        'Keine Aufzeichnung verpasster Anrufe',
      ],
      stat: '~38%',
      statLabel: 'der Anrufe in Praxen bleiben unbeantwortet',
    },
    solution: {
      service: 'KI Telefonassistent',
      serviceIcon: PhoneCall,
      title: 'Mit KI-Rezeptionistin',
      points: [
        'Jeder Anruf wird sofort entgegengenommen — 24/7',
        'Terminbuchung direkt in den Kalender eingetragen',
        'Erinnerungs-SMS automatisch versendet',
        'Rezeptionistin konzentriert sich auf Patienten',
        'Alle Anrufe protokolliert & analysierbar',
      ],
      stat: '100%',
      statLabel: 'Anrufannahme — auch nachts & am Wochenende',
    },
    chat: [
      { role: 'caller', text: 'Hallo, ich würde gerne einen Termin vereinbaren.' },
      { role: 'ai', text: 'Guten Tag! Ich bin die digitale Assistenz der Praxis Dr. Müller. Welchen Arzt möchten Sie besuchen — Allgemein oder Spezialsprechstunde?' },
      { role: 'caller', text: 'Allgemeinmedizin bitte, möglichst diese Woche.' },
      { role: 'ai', text: 'Kein Problem. Ich sehe freie Termine: Donnerstag 10:15 Uhr oder Freitag 14:30 Uhr. Welcher passt Ihnen besser?' },
      { role: 'caller', text: 'Donnerstag 10:15, perfekt.' },
      { role: 'ai', text: 'Eingetragen. Sie erhalten in Kürze eine Bestätigung per SMS. Noch etwas, wobei ich helfen kann?' },
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
        'Keine Erinnerungen → hohe No-Show-Rate',
        'Abends & sonntags ist niemand erreichbar',
        'Stammgäste genervt, wechseln zur Konkurrenz',
      ],
      stat: '~25%',
      statLabel: 'No-Show-Rate ohne Erinnerungssystem',
    },
    solution: {
      service: 'KI Telefonassistent',
      serviceIcon: PhoneCall,
      title: 'Mit KI-Rezeptionistin',
      points: [
        'Reservierungen rund um die Uhr entgegennehmen',
        'Automatische Erinnerungs-SMS 24h vorher',
        'Warteliste bei vollen Zeiten automatisch verwaltet',
        'Service-Team fokussiert auf Gäste vor Ort',
        'No-Show-Rate drastisch reduziert',
      ],
      stat: '−70%',
      statLabel: 'weniger No-Shows durch automatische Erinnerungen',
    },
    chat: [
      { role: 'caller', text: 'Guten Abend, kann ich für Samstag einen Tisch reservieren?' },
      { role: 'ai', text: 'Guten Abend! Herzlich willkommen beim Ristorante Bella Vista. Für wie viele Personen darf ich reservieren?' },
      { role: 'caller', text: 'Für 4 Personen, am liebsten 19:30 Uhr.' },
      { role: 'ai', text: 'Samstag 19:30 Uhr für 4 Personen ist verfügbar. Haben Sie besondere Wünsche — Fenstertisch oder Allergieinformationen?' },
      { role: 'caller', text: 'Einen Fenstertisch wäre toll.' },
      { role: 'ai', text: 'Perfekt, Fenstertisch ist reserviert. Sie erhalten gleich eine Bestätigungs-SMS mit allen Details. Wir freuen uns auf Sie!' },
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
      stat: '~40%',
      statLabel: 'der Leads kaufen beim ersten schnellen Anbieter',
    },
    solution: {
      service: 'Automatisierung & KI',
      serviceIcon: Zap,
      title: 'Mit KI-Automatisierung',
      points: [
        'Sofortantwort auf jede Anfrage — in Sekunden',
        'Automatische Lead-Qualifizierung per Fragebogen',
        'Besichtigungstermine selbst buchbar im Kalender',
        'Follow-up-Sequenzen vollautomatisch',
        'Nur qualifizierte Leads landen beim Makler',
      ],
      stat: '3×',
      statLabel: 'mehr qualifizierte Besichtigungen pro Woche',
    },
    chat: [
      { role: 'caller', text: 'Ich habe Interesse an der Wohnung in der Hauptstraße 12.' },
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
      stat: '~30%',
      statLabel: 'höhere Kündigungsrate ohne digitale Kommunikation',
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
      stat: '−45%',
      statLabel: 'niedrigere Kündigungsrate durch aktive Bindung',
    },
    chat: [
      { role: 'caller', text: 'Gibt es noch Plätze im Yoga-Kurs am Dienstag?' },
      { role: 'ai', text: 'Hi! Der Yoga-Kurs Dienstag 18:00 Uhr hat noch 2 freie Plätze. Soll ich Sie direkt einbuchen?' },
      { role: 'caller', text: 'Ja bitte, für diese Woche und alle weiteren Dienstage.' },
      { role: 'ai', text: 'Eingetragen — dauerhaft jeden Dienstag 18:00 Uhr. Sie erhalten immer montags eine Erinnerung per SMS.' },
      { role: 'caller', text: 'Super, danke!' },
      { role: 'ai', text: 'Gern! Falls ein Kurs ausfällt, werden Sie sofort benachrichtigt und können alternativ buchen.' },
    ],
  },
];

const COLOR_MAP: Record<string, { badge: string; dot: string; border: string }> = {
  sky: {
    badge: 'bg-sky-50 text-sky-700 border-sky-100',
    dot: 'bg-sky-500',
    border: 'border-sky-100',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-100',
    dot: 'bg-amber-500',
    border: 'border-amber-100',
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dot: 'bg-emerald-500',
    border: 'border-emerald-100',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 border-rose-100',
    dot: 'bg-rose-500',
    border: 'border-rose-100',
  },
};

function ChatBubble({ msg, index }: { msg: ChatMessage; index: number }) {
  const isAi = msg.role === 'ai';
  return (
    <motion.div
      className={`flex gap-2.5 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: EASE }}
    >
      {isAi && (
        <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquare size={10} className="text-gray-400" />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
          isAi
            ? 'bg-gray-800 text-gray-200 rounded-tl-sm'
            : 'bg-white border border-gray-100 text-gray-700 rounded-tr-sm'
        }`}
      >
        {msg.text}
      </div>
    </motion.div>
  );
}

export function SolutionShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.06 });
  const [activeIndustry, setActiveIndustry] = useState<Industry>('Arztpraxis');

  const scenario = SCENARIOS.find((s) => s.label === activeIndustry)!;
  const colors = COLOR_MAP[scenario.color];
  const SvcIcon = scenario.solution.serviceIcon;

  return (
    <section
      ref={ref}
      className="py-28 bg-white border-t border-gray-100"
      aria-labelledby="showcase-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: EASE }}
          className="max-w-2xl mb-14"
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-5">
            Vorher / Nachher
          </p>
          <h2
            id="showcase-heading"
            className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.08] tracking-tight mb-5"
          >
            So lösen wir
            <br />
            <span className="text-gray-300">Ihr konkretes Problem.</span>
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            Wählen Sie Ihre Branche — und sehen Sie genau, wie unser System den Alltag verändert.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {SCENARIOS.map((s) => {
            const Icon = s.icon;
            const isActive = s.label === activeIndustry;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => setActiveIndustry(s.label)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gray-950 text-white border-gray-950 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white/60' : 'text-gray-400'} />
                {s.label}
              </button>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndustry}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="grid lg:grid-cols-[1fr_1fr_380px] gap-4"
          >
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-5 h-5 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
                  <X size={10} className="text-red-500" strokeWidth={2.5} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  {scenario.problem.title}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {scenario.problem.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1 h-1 rounded-full bg-red-300 mt-2 flex-shrink-0" />
                    <p className="text-[13px] text-gray-600 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-red-100 p-5">
                <p className="text-3xl font-bold text-red-500 tabular-nums mb-1">
                  {scenario.problem.stat}
                </p>
                <p className="text-[12px] text-gray-500 leading-snug">
                  {scenario.problem.statLabel}
                </p>
              </div>
            </div>

            <div className="bg-gray-950 rounded-2xl border border-white/[0.05] p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Check size={10} className="text-emerald-400" strokeWidth={2.5} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  {scenario.solution.title}
                </p>
              </div>

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-6 ${colors.badge} border-opacity-50`}>
                <SvcIcon size={11} />
                <span className="text-[11px] font-semibold">{scenario.solution.service}</span>
              </div>

              <div className="space-y-3 mb-8">
                {scenario.solution.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-1 h-1 rounded-full ${colors.dot} mt-2 flex-shrink-0 opacity-70`} />
                    <p className="text-[13px] text-gray-400 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/[0.04] rounded-xl border border-white/[0.07] p-5">
                <p className="text-3xl font-bold text-white tabular-nums mb-1">
                  {scenario.solution.stat}
                </p>
                <p className="text-[12px] text-gray-500 leading-snug">
                  {scenario.solution.statLabel}
                </p>
              </div>
            </div>

            <div className="bg-gray-950 rounded-2xl border border-white/[0.05] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Live-Demo
                  </p>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-hidden">
                {scenario.chat.map((msg, i) => (
                  <ChatBubble key={`${activeIndustry}-${i}`} msg={msg} index={i} />
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-white/[0.06]">
                <Link
                  to="/ki-telefonassistent"
                  className="group w-full inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold text-[12.5px] rounded-xl h-10 px-5 hover:bg-gray-100 transition-colors"
                >
                  Demo ansehen
                  <ChevronRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.3, ease: EASE }}
          className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gray-50 rounded-2xl border border-gray-100 px-8 py-6"
        >
          <div>
            <p className="text-[14px] font-semibold text-gray-900 mb-1">
              Neugierig, wie das für Ihre Branche aussieht?
            </p>
            <p className="text-[13px] text-gray-500">
              30-minütiges Gespräch — wir zeigen Ihnen einen konkreten Systemvorschlag.
            </p>
          </div>
          <Link
            to="/kontakt"
            className="group flex-shrink-0 inline-flex items-center gap-2.5 bg-gray-950 text-white font-semibold text-[13px] rounded-xl h-11 px-6 hover:bg-gray-800 transition-colors"
          >
            Kostenloses Erstgespräch
            <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
