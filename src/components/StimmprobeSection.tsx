// ─────────────────────────────────────────────────────────────────────────────
// M13 · Stimmprobe (Brief II §4.1) — Audio-Beispiel eines Anrufs.
//
// Asset-gated: solange STIMMPROBE.src null ist, rendert die Komponente NICHTS —
// kein Platzhalter, kein DOM-Knoten. Es wird keine Stock- oder Synthesestimme
// eingesetzt. Sobald die Datei vorliegt, wird `src`, `transcript` und `caption`
// hier eingetragen; das Pflicht-Label ist fest verdrahtet und nicht abschaltbar.
//
// [[ASSET: Audiodatei des nachgestellten Beispielanrufs — Vorgabe des Inhabers:
// nachgestellt, keine Patientendaten; Spezifikation in ASSETS-REQUIRED.md]]
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface StimmprobeAsset {
  /** Pfad zur Audiodatei (z. B. /audio/beispielanruf.mp3). null = nicht rendern. */
  src: string | null;
  /** Worum es im Gespräch geht — eine Zeile, z. B. "Terminwunsch am Montagmorgen". */
  caption: string;
  /** Transkript des Gesprächs, ein Eintrag pro Sprecherwechsel. */
  transcript: Array<{ speaker: "anrufer" | "assistent"; text: string }>;
}

// Zentraler Schalter: Datei eintragen, sobald sie vom Inhaber geliefert wurde.
export const STIMMPROBE: StimmprobeAsset = {
  src: null,
  caption: "",
  transcript: [],
};

// Vom Inhaber vorgegebenes Pflicht-Label — bei jeder Wiedergabe sichtbar.
const PFLICHT_LABEL = "Beispielanruf, nachgestellt — kein echter Patientenanruf.";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function StimmprobeSection() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  if (!STIMMPROBE.src) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play();
    }
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/40" aria-labelledby="stimmprobe-heading">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
          Stimmprobe
        </p>
        <h2
          id="stimmprobe-heading"
          className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4"
        >
          So klingt der Assistent
        </h2>
        <p className="text-gray-500 dark:text-gray-400 leading-[1.7] mb-2 max-w-xl">
          Hören Sie selbst, bevor Sie mit uns sprechen: ein Anruf, wie er in einer
          Praxis ankommt. Stimme, Begrüßungssatz und
          Formulierungen stammen aus der jeweiligen Konfiguration. Anrufer können
          während des Gesprächs jederzeit zu einem Menschen wechseln.
        </p>
        <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-500 mb-6">
          {PFLICHT_LABEL}
        </p>

        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Wiedergabe pausieren" : "Beispielanruf abspielen"}
              className="w-12 h-12 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center flex-shrink-0 hover:bg-gray-700 dark:hover:bg-white transition-colors"
            >
              {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                {STIMMPROBE.caption}
              </p>
              <p className="text-[12px] text-gray-400 dark:text-gray-500 tabular-nums">
                {formatTime(position)} / {formatTime(duration)}
              </p>
            </div>
          </div>
          <audio
            ref={audioRef}
            src={STIMMPROBE.src}
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          />

          {STIMMPROBE.transcript.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                Transkript
              </p>
              {STIMMPROBE.transcript.map((line, i) => (
                <p key={i} className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {line.speaker === "assistent" ? "Assistent: " : "Anrufer: "}
                  </span>
                  {line.text}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
