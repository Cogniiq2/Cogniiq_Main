import { useEffect, useRef, useState } from 'react';

// Personalised, full-viewport welcome sequence shown once per portal load, AFTER a valid
// token + recipient are known. Refined type, clean ground, a single animated accent line,
// a restrained blur-to-sharp text reveal, then a smooth handoff into the offer. No
// particles, no gradients-gone-wild, no spinner, no fake terminal, no sound. A "Überspringen"
// control appears quickly. prefers-reduced-motion collapses to a short fade with no
// artificial delay. Nothing is written to local/session storage.

const FULL_DURATION_MS = 3600; // within the 3.2–4.0s budget
const REDUCED_DURATION_MS = 500;
const SKIP_VISIBLE_AFTER_MS = 500;

interface WelcomeSequenceProps {
  greeting: string;         // e.g. "Guten Tag, Herr Pensel"
  primaryLine: string;      // e.g. "Ihr persönliches Angebot von Cogniiq ist bereit."
  secondaryLine?: string;
  accent?: string;
  onDone: () => void;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function WelcomeSequence({ greeting, primaryLine, secondaryLine, accent = '#0F766E', onDone }: WelcomeSequenceProps) {
  const [leaving, setLeaving] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const doneRef = useRef(false);
  const reduced = prefersReducedMotion();

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    // allow the fade-out to play (skipped under reduced motion)
    window.setTimeout(onDone, reduced ? 0 : 420);
  };

  useEffect(() => {
    const total = reduced ? REDUCED_DURATION_MS : FULL_DURATION_MS;
    const t1 = window.setTimeout(finish, total);
    const t2 = window.setTimeout(() => setShowSkip(true), reduced ? 0 : SKIP_VISIBLE_AFTER_MS);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#f8f8f5] px-6 transition-opacity duration-[420ms] ${leaving ? 'opacity-0' : 'opacity-100'}`}
      style={{ minHeight: '100dvh' }}
      role="status"
      aria-live="polite"
    >
      <style>{`
        @keyframes cq-line { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes cq-rise { from { opacity: 0; filter: blur(10px); transform: translateY(10px); } to { opacity: 1; filter: blur(0); transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .cq-anim { animation: none !important; opacity: 1 !important; filter: none !important; transform: none !important; }
        }
      `}</style>

      <div className="w-full max-w-2xl text-center">
        <div
          className="cq-anim mx-auto mb-8 h-[3px] w-24 origin-left rounded-full"
          style={{ background: accent, animation: reduced ? 'none' : 'cq-line 900ms cubic-bezier(0.22,1,0.36,1) forwards' }}
        />
        <p
          className="cq-anim text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
          style={{ animation: reduced ? 'none' : 'cq-rise 800ms cubic-bezier(0.22,1,0.36,1) 150ms both' }}
        >
          {greeting}.
        </p>
        <p
          className="cq-anim mx-auto mt-4 max-w-xl text-base text-slate-500 sm:text-lg"
          style={{ animation: reduced ? 'none' : 'cq-rise 800ms cubic-bezier(0.22,1,0.36,1) 500ms both' }}
        >
          {primaryLine}
        </p>
        {secondaryLine ? (
          <p
            className="cq-anim mx-auto mt-2 max-w-lg text-sm text-slate-400"
            style={{ animation: reduced ? 'none' : 'cq-rise 800ms cubic-bezier(0.22,1,0.36,1) 850ms both' }}
          >
            {secondaryLine}
          </p>
        ) : null}
      </div>

      {showSkip ? (
        <button
          type="button"
          onClick={finish}
          className="absolute bottom-8 right-8 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-[13px] font-medium text-slate-500 backdrop-blur transition hover:text-slate-900"
        >
          Überspringen
        </button>
      ) : null}
    </div>
  );
}

export default WelcomeSequence;
