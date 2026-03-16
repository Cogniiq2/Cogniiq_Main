import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, Globe, Phone, Zap, Mail, MapPin, Clock, CircleCheck as CheckCircle2, Building2, Calendar, ChevronDown, Check, ChevronLeft, Loader as Loader2 } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO, getGoogleMapsUrl, getGoogleMapsEmbedUrl } from "@/lib/seo-data";
import { ContactSection } from "@/components/ContactSection";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const FOCUS_CARDS = [
  {
    icon: Zap,
    title: "KI-Automatisierung",
    description:
      "Unternehmen, die Prozesse automatisieren und manuelle Arbeit systematisch reduzieren wollen.",
    href: "/leistungen",
    label: "Mehr erfahren",
  },
  {
    icon: Globe,
    title: "Webdesign & Conversion",
    description:
      "Unternehmen, die mehr Anfragen und Kunden über ihre Website gewinnen wollen.",
    href: "/leistungen",
    label: "Mehr erfahren",
  },
  {
    icon: Phone,
    title: "KI-Telefonassistent",
    description:
      "Unternehmen mit vielen Anrufen, Terminen oder Kundenanfragen die automatisiert bearbeitet werden sollen.",
    href: "/leistungen",
    label: "Mehr erfahren",
  },
];

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Anfrage senden",
    description: "Kurze Beschreibung Ihrer Situation – kein Aufwand, keine Vorbereitung nötig.",
  },
  {
    number: "02",
    title: "Kurzanalyse Ihres Status quo",
    description: "Wir analysieren Ihren Fall strukturiert und bereiten das Gespräch vor.",
  },
  {
    number: "03",
    title: "Strategiegespräch (Video)",
    description: "30–45 Minuten fokussiertes Gespräch über konkrete Potenziale und nächste Schritte.",
  },
  {
    number: "04",
    title: "Klare Empfehlung & nächste Schritte",
    description: "Sie erhalten eine ehrliche Einschätzung – kein Pitch, keine Verkaufsveranstaltung.",
  },
];

const REGIONS = [
  { label: "KI Agentur Bayreuth", href: "/bayreuth" },
  { label: "KI Agentur München", href: "/muenchen" },
  { label: "KI Agentur Regensburg", href: "/regensburg" },
  { label: "KI Agentur Deutschland", href: "/deutschland" },
];

const SERVICES_LINKS = [
  { label: "Webdesign", href: "/leistungen" },
  { label: "KI-Telefonassistent", href: "/leistungen" },
  { label: "Automatisierung", href: "/leistungen" },
];

const BRANCHEN_ITEMS = [
  { label: "Arztpraxis Bayreuth", href: "/webdesign-arzt-bayreuth" },
  { label: "Gastronomie München", href: "/webdesign-gastronomie-muenchen" },
  { label: "Immobilien Regensburg", href: "/webdesign-immobilien-regensburg" },
];

const INTEREST_OPTIONS = [
  "Webdesign",
  "KI Telefonassistent",
  "Automatisierung",
  "KI Systeme",
];

const BRANCHE_OPTIONS = [
  "Arzt / Praxis",
  "Gastronomie",
  "Immobilien",
  "Industrie",
  "Dienstleistung",
  "Sonstige",
];

const STANDORT_OPTIONS = [
  "Bayreuth",
  "München",
  "Regensburg",
  "Deutschlandweit",
];

interface PremiumSelectProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  options: string[];
}

function PremiumSelect({ value, onChange, placeholder, options }: PremiumSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-900 text-sm transition-all duration-200 focus:outline-none ${
          open
            ? "border-gray-400 dark:border-gray-500"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
      >
        <span className={value ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-600"}>
          {value || placeholder}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/60 dark:shadow-black/40 overflow-hidden"
          >
            <div className="p-1.5">
              {options.map((opt, i) => {
                const selected = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); }}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${
                      selected
                        ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    } ${i > 0 ? "" : ""}`}
                  >
                    <span>{opt}</span>
                    {selected && (
                      <Check size={13} className="flex-shrink-0 text-white dark:text-gray-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

interface DateTimePickerProps {
  value: { date: Date | null; time: string };
  onChange: (val: { date: Date | null; time: string }) => void;
}

function PremiumDateTimePicker({ value, onChange }: DateTimePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    onChange({ ...value, date: d });
  }

  const displayLabel = value.date
    ? `${value.date.getDate()}. ${MONTHS[value.date.getMonth()]} ${value.date.getFullYear()}${value.time ? " · " + value.time + " Uhr" : ""}`
    : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-900 text-sm transition-all duration-200 focus:outline-none ${
          open ? "border-gray-400 dark:border-gray-500" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
      >
        <span className={displayLabel ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-600"}>
          {displayLabel ?? "Datum & Uhrzeit wählen"}
        </span>
        <div className="flex items-center gap-2">
          {value.date && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange({ date: null, time: "" }); }}
              className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold leading-none">✕</span>
            </button>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/60 dark:shadow-black/40 overflow-hidden"
          >
            <div className="p-4">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <ChevronDown size={14} className="rotate-[-90deg]" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-600 py-1">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const thisDate = new Date(viewYear, viewMonth, day);
                  const isPast = thisDate < today;
                  const isSelected = value.date &&
                    value.date.getDate() === day &&
                    value.date.getMonth() === viewMonth &&
                    value.date.getFullYear() === viewYear;
                  const isToday = thisDate.getTime() === today.getTime();
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isPast}
                      onClick={() => selectDay(day)}
                      className={`w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-150 ${
                        isPast ? "text-gray-300 dark:text-gray-700 cursor-not-allowed" :
                        isSelected ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900" :
                        isToday ? "border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800" :
                        "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              {value.date && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-600 mb-2.5">Uhrzeit</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => { onChange({ ...value, time: slot }); setOpen(false); }}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                          value.time === slot
                            ? "bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export function KontaktPage() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    unternehmen: "",
    branche: "",
    standort: "",
    ziel: "",
  });
  const [termin, setTermin] = useState<{ date: Date | null; time: string }>({ date: null, time: "" });
  // --- Premium Package Modal State (required) ---
type ServiceKey = "Webdesign" | "KI Telefonassistent" | "Automatisierung";

const [selectedPackages, setSelectedPackages] = useState<Record<ServiceKey, string | null>>({
  Webdesign: null,
  "KI Telefonassistent": null,
  Automatisierung: null,
});

const [pkgModalOpen, setPkgModalOpen] = useState(false);
const [pkgModalService, setPkgModalService] = useState<ServiceKey | null>(null);

function openPackageModal(service: ServiceKey) {
  setPkgModalService(service);
  setPkgModalOpen(true);
}

function closePackageModal() {
  setPkgModalOpen(false);
  setPkgModalService(null);
}

function confirmPackageSelection() {
  // modal closes only if selection exists
  if (!pkgModalService) return;
  if (!selectedPackages[pkgModalService]) return;
  closePackageModal();
}
type InterestKey = (typeof INTEREST_OPTIONS)[number];

type PackageOption = {
  id: string;
  label: string;
  subtitle: string;
  bullets: string[];
  badge?: string;
};

const PACKAGE_CATALOG: Partial<Record<InterestKey, PackageOption[]>> = {
  Webdesign: [
    {
      id: "website-launch",
      label: "Website Launch",
      subtitle: "Professionelle Präsenz – schnell und solide",
      bullets: [
        "Responsive Website (bis 6 Seiten)",
        "Individuelles Design nach Marke",
        "On-Page SEO Grundoptimierung",
        "DSGVO: Impressum, Datenschutz, Cookie-Consent",
        "Kontaktformular + Bestätigungs-Mail",
        "Übergabe & Kurzschulung",
      ],
      badge: "Schnellster Start",
    },
    {
      id: "website-wachstum",
      label: "Website Wachstum",
      subtitle: "Conversion & Local SEO für nachhaltiges Wachstum",
      bullets: [
        "Alles aus Website Launch",
        "Erweiterte Seitenstruktur (bis 12 Seiten)",
        "Conversion-optimierte Texte & CTAs",
        "Lokale SEO-Strategie (Bayreuth/Oberfranken)",
        "Strukturierte Daten (Schema.org)",
        "GA4 + Search Console Setup",
        "Performance (Core Web Vitals)",
        "3 Monate Nachbetreuung",
      ],
      badge: "Bester ROI",
    },
    {
      id: "website-marktfuehrer",
      label: "Website Marktführer",
      subtitle: "Marktführer-Positionierung & Skalierung",
      bullets: [
        "Alles aus Website Wachstum",
        "Unbegrenzte Seitenstruktur & Unterseiten",
        "KI-gestützte Conversion-Optimierung",
        "Regionale SEO-Dominanz",
        "Blog-/Content-Strategie für Reichweite",
        "Lokale Backlink-Strategie",
        "Integration KI-Telefonassistent & Automatisierung",
        "Laufende Betreuung & monatliches Reporting",
      ],
      badge: "Maximale Dominanz",
    },
  ],

  "KI Telefonassistent": [
    {
      id: "telefon-essentials",
      label: "Assistant Essentials",
      subtitle: "Einstieg für strukturierte Anrufannahme",
      bullets: [
        "Anrufannahme + Basis-FAQ",
        "Kontakt-/Lead-Erfassung",
        "Weiterleitung & Rückruflogik",
        "Grundlegendes Reporting",
      ],
      badge: "Start",
    },
    {
      id: "telefon-growth",
      label: "Assistant Growth",
      subtitle: "Mehr Logik, bessere Qualifizierung",
      bullets: [
        "Alles aus Essentials",
        "Intent-Routing (Termine / Fragen / Anliegen)",
        "Qualifizierungsfragen + Datenstruktur",
        "Integrationen (z. B. Mail/Sheets)",
      ],
      badge: "Empfohlen",
    },
    {
      id: "telefon-scale",
      label: "Assistant Scale",
      subtitle: "Workflows, Automationen, Multi-Step",
      bullets: [
        "Alles aus Growth",
        "Mehrstufige Workflows",
        "Erweiterte Ausnahmen & Eskalation",
        "Monatliches Optimierungs-Review",
      ],
      badge: "Premium",
    },
  ],

  Automatisierung: [
    {
      id: "auto-essentials",
      label: "Automation Essentials",
      subtitle: "Schnelle Entlastung im Tagesgeschäft",
      bullets: [
        "1–2 Kern-Workflows",
        "Datenfluss in Sheets/CRM",
        "Benachrichtigungen & Routing",
        "Basis-Logging",
      ],
      badge: "Start",
    },
    {
      id: "auto-growth",
      label: "Automation Growth",
      subtitle: "Mehr Systeme, mehr Zuverlässigkeit",
      bullets: [
        "Alles aus Essentials",
        "3–5 Workflows",
        "Fehlerhandling & Retries",
        "Monitoring / Alerts",
      ],
      badge: "Empfohlen",
    },
    {
      id: "auto-scale",
      label: "Automation Scale",
      subtitle: "Systemlandschaft + Reporting + Skalierung",
      bullets: [
        "Alles aus Growth",
        "Erweiterte Datenmodelle",
        "Reporting + KPI-Tracking",
        "Monatliche Iterationen",
      ],
      badge: "Premium",
    },
  ],
};

const SERVICE_ACCENT: Record<string, { color: string; glow: string; ring: string; badge: string; icon: React.ElementType }> = {
  Webdesign: {
    color: "from-blue-500 to-cyan-400",
    glow: "rgba(59,130,246,0.18)",
    ring: "ring-blue-500/40",
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    icon: Globe,
  },
  "KI Telefonassistent": {
    color: "from-emerald-400 to-teal-400",
    glow: "rgba(52,211,153,0.18)",
    ring: "ring-emerald-400/40",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    icon: Phone,
  },
  Automatisierung: {
    color: "from-amber-400 to-orange-400",
    glow: "rgba(251,191,36,0.18)",
    ring: "ring-amber-400/40",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    icon: Zap,
  },
};

function PremiumPackageModal({
  open,
  service,
  options,
  selectedId,
  onSelect,
  onClose,
  onConfirm,
}: {
  open: boolean;
  service: InterestKey | null;
  options: PackageOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const accent = service ? SERVICE_ACCENT[service] ?? SERVICE_ACCENT["Webdesign"] : SERVICE_ACCENT["Webdesign"];
  const AccentIcon = accent.icon;

  return (
    <AnimatePresence>
      {open && service && (
        <motion.div
          key="package-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center sm:px-6 px-0"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            backgroundColor: "rgba(0,0,0,0.72)",
          }}
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full sm:max-w-4xl overflow-hidden rounded-t-3xl sm:rounded-3xl"
            style={{
              background: "linear-gradient(160deg, #0f1117 0%, #131620 50%, #0a0d14 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Ambient glow behind modal */}
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, ${accent.glow} 0%, transparent 70%)`,
                filter: "blur(40px)",
              }}
            />

            {/* Header */}
            <div className="relative flex items-start justify-between gap-4 px-7 sm:px-9 pt-8 pb-7 border-b border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${accent.color} flex items-center justify-center flex-shrink-0`}
                  style={{ boxShadow: `0 0 20px ${accent.glow}` }}
                >
                  <AccentIcon size={20} className="text-white" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/30 mb-1">
                    Paket wählen
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                    {service}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                aria-label="Schließen"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Cards */}
            <div className="px-7 sm:px-9 pt-7 pb-8">
              <div className="grid md:grid-cols-3 gap-3.5">
                {options.map((opt, idx) => {
                  const active = selectedId === opt.id;
                  const isRecommended = opt.badge === "Bester ROI" || opt.badge === "Empfohlen";
                  return (
                    <motion.button
                      key={opt.id}
                      type="button"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => onSelect(opt.id)}
                      className={`relative text-left rounded-2xl p-5 transition-all duration-300 focus:outline-none ${
                        active ? `ring-2 ${accent.ring}` : ""
                      }`}
                      style={
                        active
                          ? {
                              background: "linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
                              border: "1px solid rgba(255,255,255,0.14)",
                              boxShadow: `0 0 30px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
                            }
                          : {
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.07)",
                            }
                      }
                    >
                      {/* Recommended pill */}
                      {isRecommended && (
                        <div
                          className={`absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.14em] border ${accent.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${accent.color}`} />
                          Empfohlen
                        </div>
                      )}

                      {/* Card header */}
                      <div className="flex items-start justify-between gap-3 mb-3.5">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 mb-1">
                            {String(idx + 1).padStart(2, "0")}
                          </p>
                          <h4 className="text-[15px] font-semibold text-white leading-tight">
                            {opt.label}
                          </h4>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                            active
                              ? `bg-gradient-to-br ${accent.color}`
                              : "border border-white/15"
                          }`}
                        >
                          {active && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                              <Check size={11} className="text-white" strokeWidth={2.5} />
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Subtitle */}
                      <p className="text-[12.5px] text-white/45 leading-relaxed mb-4">
                        {opt.subtitle}
                      </p>

                      {/* Divider */}
                      <div className="w-full h-px bg-white/[0.06] mb-4" />

                      {/* Bullets */}
                      <ul className="space-y-2.5">
                        {opt.bullets.slice(0, 6).map((b, bi) => (
                          <motion.li
                            key={b}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: active ? bi * 0.04 : 0 }}
                            className="flex items-start gap-2.5"
                          >
                            <span
                              className={`mt-[5px] flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center ${
                                active
                                  ? `bg-gradient-to-br ${accent.color}`
                                  : "bg-white/[0.06] border border-white/10"
                              }`}
                            >
                              <Check size={8} className="text-white" strokeWidth={2.5} />
                            </span>
                            <span className={`text-[12px] leading-relaxed ${active ? "text-white/75" : "text-white/35"}`}>
                              {b}
                            </span>
                          </motion.li>
                        ))}
                      </ul>

                      {/* Bottom badge */}
                      {opt.badge && (
                        <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
                          <span
                            className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full border ${
                              active ? accent.badge : "border-white/10 text-white/25"
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-7 pt-6 border-t border-white/[0.06]">
                <p className="text-[11.5px] text-white/25 leading-relaxed">
                  Wählen Sie ein Paket — wir passen das Gespräch darauf ab.
                </p>

                <motion.button
                  type="button"
                  onClick={onConfirm}
                  disabled={!selectedId}
                  whileHover={selectedId ? { scale: 1.02 } : {}}
                  whileTap={selectedId ? { scale: 0.98 } : {}}
                  className={`relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden`}
                  style={
                    selectedId
                      ? {
                          background: `linear-gradient(135deg, white 0%, rgba(230,240,255,0.9) 100%)`,
                          color: "#0a0d14",
                          boxShadow: "0 4px 20px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
                        }
                      : {
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.3)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }
                  }
                >
                  Paket bestätigen
                  <ArrowRight size={15} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
 function toggleInterest(item: string) {
  const isService = item === "Webdesign" || item === "KI Telefonassistent" || item === "Automatisierung";

  setInterests((prev) => {
    const next = prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item];

    // If user just selected a service → open premium package modal
    if (isService && !prev.includes(item)) {
      openPackageModal(item as ServiceKey);
    }

    return next;
  });
}

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  // ✅ Required: if user selected a service with packages, they must pick exactly one
  for (const interest of interests as InterestKey[]) {
    const hasPackages = !!PACKAGE_CATALOG[interest]?.length;
    if (hasPackages && !selectedPackages[interest]) {
      openPackageModal(interest);
      return;
    }
  }

  setLoading(true);

  const terminStr = termin.date
    ? `${termin.date.getDate()}. ${MONTHS[termin.date.getMonth()]} ${termin.date.getFullYear()}${termin.time ? " " + termin.time + " Uhr" : ""}`
    : "";

  try {
    await fetch("https://n8n.cogniiq.co/webhook/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        interessensfelder: interests.map((svc) => ({
          service: svc,
          paket: selectedPackages[svc as InterestKey] ?? null,
        })),
        termin: terminStr,
        primaryInterest: interests[0] ?? "",
        source: "kontakt-page",
      }),
    });
  } catch {}

  setLoading(false);
  navigate("/anfrage-erhalten");
}

  return (
    <>
      <PageSEO
        title="KI Beratung & Kontakt | Cogniiq AI Agentur Deutschland"
        description="Kontaktieren Sie Cogniiq für KI-Automatisierung, Webdesign und KI-Telefonassistent. Analysegespräch für Unternehmen in Deutschland, München, Regensburg und Bayreuth."
        canonical="https://cogniiq.de/kontakt"
        breadcrumbs={[
          { name: "Start", url: "https://cogniiq.de" },
          { name: "Kontakt", url: "https://cogniiq.de/kontakt" },
        ]}
      />

      <div className="min-h-screen bg-white dark:bg-gray-950">

        {/* SECTION 1: HERO */}
        <section className="relative pt-32 pb-24 px-6 lg:px-8 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(15,23,42,0.04) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 60%, rgba(2,132,199,0.03) 0%, transparent 55%)',
            }}
          />
          <div className="relative max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="flex items-center gap-2 mb-8"
            >
              <Link
                to="/"
                className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Start
              </Link>
              <ChevronRight size={10} className="text-gray-300" />
              <span className="text-[11px] text-gray-700 font-medium">Kontakt</span>
            </motion.div>

            <div className="grid lg:grid-cols-[1fr_420px] gap-16 lg:gap-20 items-start">
              {/* Left: Headline */}
              <div>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.04}
                  className="flex items-center gap-2 mb-5"
                >
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-500">
                      Analysegespräch
                    </span>
                  </div>
                </motion.div>

                <motion.h1
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.08}
                  className="text-4xl sm:text-5xl lg:text-[3.6rem] font-bold text-gray-900 leading-[1.06] tracking-[-0.024em] mb-6"
                >
                  KI-Systeme für Ihr
                  <br />
                  <span className="text-gray-200">Unternehmen besprechen</span>
                </motion.h1>

                <motion.p
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.13}
                  className="text-[16px] text-gray-500 leading-[1.75] mb-8 max-w-[560px]"
                >
                  In einem strukturierten Analysegespräch prüfen wir, wo KI-Automatisierung,
                  Webdesign oder digitale Systeme in Ihrem Unternehmen konkret Umsatz,
                  Effizienz und Anfragen steigern können.
                </motion.p>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.18}
                  className="flex flex-col sm:flex-row gap-3 mb-10"
                >
                  <a
                    href="#kontaktformular"
                    className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gray-950 text-white text-[13.5px] font-semibold hover:bg-gray-800 transition-colors"
                    style={{ borderRadius: '4px' }}
                  >
                    Analysegespräch starten
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </a>
                  <Link
                    to="/leistungen"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                  >
                    Leistungen ansehen
                    <ArrowRight size={13} className="opacity-50" />
                  </Link>
                </motion.div>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.23}
                  className="flex flex-wrap gap-x-6 gap-y-2.5"
                >
                  {[
                    { icon: Clock, text: '30–45 Min. Strategiegespräch' },
                    { icon: CheckCircle2, text: 'Einschätzung statt Verkauf' },
                    { icon: MapPin, text: 'Für Unternehmen in Deutschland' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <Icon size={12} className="text-gray-300 flex-shrink-0" />
                      <span className="text-[12.5px] text-gray-500">{text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right: Value card */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.14}
                className="hidden lg:block"
              >
                <div className="bg-gray-950 rounded-2xl p-8 relative overflow-hidden">
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 70% 20%, rgba(2,132,199,0.09) 0%, transparent 55%)' }}
                  />
                  <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(2,132,199,0.35), transparent)' }}
                  />

                  <div className="relative">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-4">
                      Was Sie mitnehmen
                    </p>

                    <div className="space-y-4 mb-7">
                      {[
                        { n: '01', text: 'Klares Bild Ihrer Verlustquellen' },
                        { n: '02', text: 'Konkrete Automatisierungspotenziale' },
                        { n: '03', text: 'Realistische ROI-Einschätzung' },
                        { n: '04', text: 'Klarer nächster Schritt — kein Pitch' },
                      ].map(({ n, text }) => (
                        <div key={n} className="flex items-start gap-3.5">
                          <span className="text-[10px] font-medium text-gray-700 tabular-nums mt-0.5 min-w-[20px]">{n}</span>
                          <p className="text-[13px] text-gray-400 leading-snug">{text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="w-full h-px bg-white/[0.05] mb-6" />

                    <div className="flex items-center gap-2 mb-2">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Garantien
                      </span>
                    </div>
                    <p className="text-[11.5px] text-gray-600 leading-relaxed">
                      Antwort innerhalb 24h · Go-Live in 14 Tagen oder Geld zurück ·
                      kein Formular-Loop — persönliches Gespräch
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 2: FÜR WEN */}
        <section className="py-20 px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                Für wen
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Für welche Unternehmen<br />
                <span className="font-light text-gray-500 dark:text-gray-400">Cogniiq arbeitet</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {FOCUS_CARDS.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={fadeUp}
                    custom={i * 0.07}
                    className="group relative bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-7 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-gray-50 flex items-center justify-center mb-5">
                      <Icon size={18} className="text-white dark:text-gray-900" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                      {card.description}
                    </p>
                    <Link
                      to={card.href}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {card.label}
                      <ArrowRight size={12} />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: ABLAUF */}
        <section className="py-20 px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-16 lg:gap-24 items-start">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={0}
                className="lg:sticky lg:top-32"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                  Ablauf
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight mb-5">
                  So läuft das<br />
                  <span className="font-light text-gray-500 dark:text-gray-400">Analysegespräch ab</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Keine Vorbereitung nötig. Wir analysieren Ihre Situation strukturiert
                  und zeigen konkrete Möglichkeiten in Ihrem spezifischen Kontext.
                </p>
              </motion.div>

              <div className="space-y-0">
                {PROCESS_STEPS.map((step, i) => (
                  <motion.div
                    key={step.number}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={fadeUp}
                    custom={i * 0.08}
                    className="relative flex gap-6 pb-10 last:pb-0"
                  >
                    {i < PROCESS_STEPS.length - 1 && (
                      <div className="absolute left-[19px] top-10 w-px h-full bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-700" />
                    )}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wide">
                        {step.number}
                      </span>
                    </div>
                    <div className="pt-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: KONTAKTFORMULAR */}
        <div id="kontaktformular" className="scroll-mt-20">
          <ContactSection />
        </div>

        {/* SECTION 5: STANDORT & KONTAKT */}
        <section className="py-20 px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                Standort
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Direkter Kontakt
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0.05}
                className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 space-y-7"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500 mb-4">
                    Adresse
                  </p>
                  <a
                    href={getGoogleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                      <MapPin size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                        {BUSINESS_INFO.address.streetAddress}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.addressLocality}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Deutschland</p>
                    </div>
                  </a>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-7 space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500 mb-4">
                    Kontakt
                  </p>
                  <a
                    href={`mailto:${BUSINESS_INFO.contact.email}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                      <Mail size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {BUSINESS_INFO.contact.email}
                    </span>
                  </a>
                  <a
                    href={`tel:${BUSINESS_INFO.contact.phone}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                      <Phone size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {BUSINESS_INFO.contact.phoneDisplay}
                    </span>
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0.1}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[320px]"
              >
                <iframe
                  src={getGoogleMapsEmbedUrl()}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "320px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Cogniiq Standort Bayreuth"
                  className="grayscale hover:grayscale-0 transition-all duration-500"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 6 + 7: REGIONEN & LEISTUNGEN */}
        <section className="py-20 px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="mb-10"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                Regionen & Leistungen
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Beratung für Unternehmen<br />
                <span className="font-light text-gray-500 dark:text-gray-400">in ganz Deutschland</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0.04}
                className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 p-7"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500 mb-4">
                  Standorte
                </p>
                <ul className="space-y-2">
                  {REGIONS.map((r) => (
                    <li key={r.href}>
                      <Link
                        to={r.href}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                      >
                        <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                        {r.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0.08}
                className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 p-7"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500 mb-4">
                  Unsere Systeme
                </p>
                <ul className="space-y-2">
                  {SERVICES_LINKS.map((s) => (
                    <li key={s.label}>
                      <Link
                        to={s.href}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                      >
                        <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0.12}
                className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 p-7"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500 mb-4">
                  Branchen
                </p>
                <ul className="space-y-2">
                  {BRANCHEN_ITEMS.map((b) => (
                    <li key={b.label}>
                      <Link
                        to={b.href}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                      >
                        <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                        {b.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 8: FINAL CTA */}
        <section className="py-20 px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="max-w-[640px]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
                Analysegespräch
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight mb-5">
                KI-Potenziale in Ihrem<br />
                <span className="font-light text-gray-500 dark:text-gray-400">Unternehmen erkennen</span>
              </h2>
              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                In einem kurzen Analysegespräch zeigen wir, wo digitale Systeme konkret
                Umsatz, Effizienz und Wachstum steigern können.
              </p>
              <a
                href="#kontaktformular"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors duration-200"
              >
                Analysegespräch starten
                <ArrowRight size={15} />
              </a>
            </motion.div>
          </div>
        </section>

      </div>
    </>
  );
}
