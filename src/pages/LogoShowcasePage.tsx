import { useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

const CONCEPTS: {
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  tagline: string;
  marks: string[];
}[] = [
  {
    id: 1,
    name: "Neural Chip",
    tagline: "Literaler Chip mit umlaufenden Pin-Traces. Sofort lesbar als \"Silizium-Intelligenz\".",
    marks: [
      "IC-Chip Körper mit 8 Anschluss-Pins auf allen Seiten",
      "Inneres quadratisches Detail + zentraler Kern-Dot",
      "\"Cogni\" medium weight · \"IQ\" light, leicht gesperrt",
    ],
  },
  {
    id: 2,
    name: "Data Pulse",
    tagline: "EEG-Wellenform läuft durch den Chip — Datenfluss in Echtzeit, visuell eingefroren.",
    marks: [
      "Chip-Quadrat als Rahmen, Puls-Kurve innen geclippt",
      "Vier Corner-Dots für Präzisions-Hardware-Optik",
      "\"IQ\" mit feiner Unterstreichung — technische Annotation",
    ],
  },
  {
    id: 3,
    name: "Quantum Core",
    tagline: "Hexagon-Geometrie — die Sprache von Halbleitern, Bienenwaben, Molekülstrukturen.",
    marks: [
      "Äußeres Hex + inneres Hex mit Speichen zum Kern",
      "Zentraler Dot als Kernintelligenz",
      "\"Cogni\" normal · \"IQ\" bold — stärkster Kontrast aller Varianten",
    ],
  },
  {
    id: 4,
    name: "Signal Node",
    tagline: "Weiterentwicklung des aktuellen Marks — maximale Reife, minimales Rauschen.",
    marks: [
      "Feine Kreuz-Achsen + Fadenkreuz-Optik",
      "Lade-Bogen oben rechts: \"Daten werden empfangen\"",
      "\"Cogni\" | \"IQ\" durch vertikalen Haarstrich getrennt",
    ],
  },
  {
    id: 5,
    name: "Circuit Brain",
    tagline: "Chip trifft Gehirn-Halbkreis — am dynamischsten, am deutlichsten KI.",
    marks: [
      "Doppelter Halbkreisbogen über Chip = Hirnhemisphäre / Signal-Scan",
      "Zwei PCB-Trace-Routen aus Chip-Unterseite",
      "\"IQ\" größer + halbfett — dominanter als \"Cogni\"",
    ],
  },
];

export function LogoShowcasePage() {
  const [selected, setSelected] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-6 py-24">
      <div className="max-w-4xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-gray-400 dark:text-gray-500 mb-3">
            Logo Konzepte
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-gray-950 dark:text-white mb-2">
            Cogniiq — 5 Marken-Varianten
          </h1>
          <p className="text-[14px] text-gray-500 dark:text-gray-400">
            Klicke auf eine Karte um sie auszuwählen. Hell / Dunkel Vorschau jeweils inklusive.
          </p>
        </motion.div>

        <div className="space-y-6">
          {CONCEPTS.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              onClick={() => setSelected(selected === c.id ? null : c.id)}
              className={[
                "rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden",
                selected === c.id
                  ? "border-gray-950 dark:border-white shadow-[0_0_0_1px_rgba(13,24,33,0.08)] dark:shadow-none bg-gray-50 dark:bg-white/[0.04]"
                  : "border-gray-150 dark:border-white/[0.07] hover:border-gray-300 dark:hover:border-white/[0.14] bg-white dark:bg-white/[0.02] hover:bg-gray-50/60 dark:hover:bg-white/[0.035]",
              ].join(" ")}
            >
              {/* Top bar — number + name */}
              <div className="flex items-center gap-4 px-7 pt-6 pb-0">
                <span className={[
                  "text-[11px] font-mono tracking-widest font-medium px-2 py-0.5 rounded",
                  selected === c.id
                    ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950"
                    : "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400",
                ].join(" ")}>
                  0{c.id}
                </span>
                <span className="text-[15px] font-semibold text-gray-800 dark:text-gray-200 tracking-tight">
                  {c.name}
                </span>
                <span className="ml-auto text-[12px] text-gray-400 dark:text-gray-600">
                  {selected === c.id ? "Ausgewählt ✓" : "Auswählen"}
                </span>
              </div>

              {/* Logo previews — light + dark */}
              <div className="grid grid-cols-2 gap-4 px-7 py-6">
                {/* Light background */}
                <div className="rounded-xl bg-white border border-gray-100 flex items-center justify-center py-5 px-6">
                  <Logo concept={c.id} variant="default" className="h-8" />
                </div>

                {/* Dark background */}
                <div className="rounded-xl bg-gray-950 flex items-center justify-center py-5 px-6">
                  <Logo concept={c.id} variant="light" className="h-8" />
                </div>
              </div>

              {/* Description */}
              <div className="px-7 pb-6">
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                  {c.tagline}
                </p>
                <ul className="space-y-1">
                  {c.marks.map((m, mi) => (
                    <li key={mi} className="flex items-start gap-2">
                      <span className="mt-[5px] w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                      <span className="text-[12px] text-gray-400 dark:text-gray-500">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]"
        >
          <p className="text-[12px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
            Das aktuelle Logo in der Navigationsleiste ist <strong className="text-gray-600 dark:text-gray-300">Konzept 4 "Signal Node"</strong> — die verfeinerte Weiterentwicklung des bestehenden Marks.
            <br />
            Um ein anderes zu testen, ändere in <code className="font-mono text-[11px] px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.06] rounded">Navigation.tsx</code> den Wert von <code className="font-mono text-[11px] px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.06] rounded">concept=</code> auf 1–5.
          </p>
        </motion.div>

      </div>
    </main>
  );
}
