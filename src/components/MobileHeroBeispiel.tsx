import { useState, type CSSProperties } from 'react';
import { ArrowDown, Phone } from 'lucide-react';

import { cn } from '@/lib/utils';

/*
  Mobile-only hero example: one enquiry, one structured result, both visible on
  the first paint.

  Why nothing is hidden behind a tap: the point of the surface is the RELATION
  between the sentence and the three fields. A tab that reveals the result would
  make the relation the reward for an interaction most visitors never perform.
  So both halves ship in the prerendered HTML, and the only interaction —
  selecting a field — deepens the example by marking the words that field was
  read from. Nothing essential depends on it, and nothing here runs an
  extraction: the segments below ARE the data, written out by hand.

  Imported statically. Desktop loads this module too (MobileHero is both the
  prerender markup and the Suspense fallback for the lazy desktop hero), so it
  stays dependency-free and small rather than becoming a second lazy boundary
  inside an already-hydrating tree.
*/

type FeldId = 'anliegen' | 'thema' | 'schritt';

const BEISPIEL: {
  anfrage: readonly { text: string; feld?: FeldId }[];
  felder: readonly { id: FeldId; label: string; wert: string }[];
} = {
  anfrage: [
    { text: 'Ich möchte ' },
    { text: 'einen Rückruf', feld: 'anliegen' },
    { text: ' ' },
    { text: 'zur Einrichtung', feld: 'schritt' },
    { text: ' eines ' },
    { text: 'Telefonassistenten', feld: 'thema' },
    { text: '.' },
  ],
  felder: [
    { id: 'anliegen', label: 'Anliegen', wert: 'Rückruf' },
    { id: 'thema', label: 'Thema', wert: 'Telefonassistent' },
    { id: 'schritt', label: 'Nächster Schritt', wert: 'Einrichtung besprechen' },
  ],
};

export function MobileHeroBeispiel({ className, style }: { className?: string; style?: CSSProperties }) {
  // A fixed starting field, not a stored, random or width-derived one: the
  // prerendered HTML and the first client render must agree exactly.
  const [aktiv, setAktiv] = useState<FeldId>('anliegen');

  return (
    <figure
      className={cn(
        // Left-aligned, not centred: above ~470px the card is narrower than the
        // column, and centring it would float it off the headline's edge.
        'w-full max-w-[420px] rounded-[22px] border border-pub-hairline bg-white p-3.5',
        'shadow-[0_1px_2px_rgba(11,15,20,0.04),0_16px_32px_-20px_rgba(11,15,20,0.28)]',
        className,
      )}
      style={style}
    >
      <figcaption className="mb-2.5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold tracking-[-0.01em] text-pub-ink">Cogniiq</span>
        <span className="rounded-full border border-pub-hairline px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-pub-ink-3">
          Beispiel
        </span>
      </figcaption>

      <div className="rounded-2xl bg-pub-paper-2 p-3">
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0 text-pub-ink-3" strokeWidth={1.75} aria-hidden="true" />
          <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-pub-ink-3">
            Beispielanfrage
          </span>
        </div>
        <p className="mt-2 text-[15.5px] leading-[1.45] tracking-[-0.005em] text-pub-ink">
          {BEISPIEL.anfrage.map((teil, i) =>
            teil.feld ? (
              <mark
                key={i}
                /*
                  The highlight bleeds outward (`-mx` cancelling `px`) instead of
                  taking up room. Padding alone widened every marked run whether
                  it was lit or not, which opened visible gaps mid-sentence and
                  pushed the closing full stop off on its own.
                */
                className={cn(
                  '-mx-[3px] rounded-[4px] bg-transparent px-[3px] text-pub-ink',
                  'transition-colors duration-200 [box-decoration-break:clone] motion-reduce:transition-none',
                  teil.feld === aktiv && 'bg-pub-signal-wash text-pub-signal-ink',
                )}
              >
                {teil.text}
              </mark>
            ) : (
              <span key={i}>{teil.text}</span>
            ),
          )}
        </p>
      </div>

      {/* Purely the visual join between sentence and fields. */}
      <div aria-hidden="true" className="flex flex-col items-center py-1.5">
        <span className="h-2.5 w-px bg-pub-hairline" />
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-pub-hairline bg-white text-pub-ink-3">
          <ArrowDown className="h-2.5 w-2.5" strokeWidth={2.25} />
        </span>
        <span className="h-2.5 w-px bg-pub-hairline" />
      </div>

      <ul className="space-y-0.5" role="group" aria-label="Felder der Zusammenfassung">
        {BEISPIEL.felder.map(({ id, label, wert }) => {
          const ausgewaehlt = id === aktiv;
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={ausgewaehlt}
                onClick={() => setAktiv(id)}
                className={cn(
                  'flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left',
                  'transition-colors duration-200 motion-reduce:transition-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                  // Same wash as the marked words above, on purpose: the lit row
                  // and the lit part of the sentence are one statement.
                  ausgewaehlt
                    ? 'border-pub-signal/20 bg-pub-signal-wash'
                    : 'border-transparent hover:bg-pub-paper-2',
                )}
              >
                <span
                  className={cn(
                    'shrink-0 text-[12.5px] font-medium',
                    ausgewaehlt ? 'text-pub-signal-ink' : 'text-pub-ink-3',
                  )}
                >
                  {label}
                </span>
                <span className="text-right text-[15px] font-semibold leading-[1.25] tracking-[-0.01em] text-pub-ink">
                  {wert}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-2.5 text-[12.5px] leading-snug text-pub-ink-3">
        So kann eine strukturierte Zusammenfassung aussehen.
      </p>
    </figure>
  );
}

export default MobileHeroBeispiel;
