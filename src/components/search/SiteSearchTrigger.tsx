// ─────────────────────────────────────────────────────────────────────────────
// Auslöser der Seitensuche — zwei Formen, eine Wirkung.
//
// `feld`: in der Desktop-Kopfzeile. Sieht aus wie ein Eingabefeld („Wonach
// suchen Sie?"), damit auf den ersten Blick klar ist, dass man hier sein
// Anliegen eintippen kann — nicht nur ein Lupensymbol, das man deuten muss.
// Dazu der Tastaturkürzel-Hinweis, der erst nach dem Mount gesetzt wird: Das
// vorgerenderte Dokument kennt das Betriebssystem nicht (Hydration).
//
// `knopf`: runder Knopf neben „Menü" unterhalb von `lg`.
// ─────────────────────────────────────────────────────────────────────────────
import { forwardRef, useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { pubFocus } from '@/components/public/PublicUI';
import { cn } from '@/lib/utils';

export interface SiteSearchTriggerProps {
  form: 'feld' | 'knopf';
  open: boolean;
  controls?: string;
  onOpen: () => void;
  /** Dialog-Chunk vorab laden, sobald der Besucher Interesse zeigt. */
  onWarm?: () => void;
  className?: string;
}

export const SiteSearchTrigger = forwardRef<HTMLButtonElement, SiteSearchTriggerProps>(function SiteSearchTrigger(
  { form, open, controls, onOpen, onWarm, className },
  ref
) {
  const [kuerzel, setKuerzel] = useState<string | null>(null);
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const apple = /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? '') || /Mac OS X/.test(navigator.userAgent ?? '');
    setKuerzel(apple ? '⌘K' : 'Strg K');
  }, []);

  const shared = {
    ref,
    type: 'button' as const,
    onClick: onOpen,
    onPointerEnter: onWarm,
    onFocus: onWarm,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    'aria-controls': open ? controls : undefined,
  };

  if (form === 'knopf') {
    return (
      <button
        {...shared}
        aria-label="Seite finden"
        className={cn(
          'inline-flex h-11 w-11 items-center justify-center rounded-full border border-pub-hairline bg-white/95 text-pub-ink',
          'shadow-[0_1px_2px_rgba(11,15,20,0.05)] backdrop-blur transition-colors duration-150 active:bg-pub-paper-2',
          pubFocus,
          className
        )}
      >
        <Search size={18} aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      {...shared}
      className={cn(
        'group inline-flex h-10 items-center gap-2.5 rounded-full border border-pub-hairline bg-white/80 pl-3.5 pr-2 text-left',
        'text-sm text-pub-ink-3 transition-[border-color,color,background-color] duration-150',
        'hover:border-pub-ink/30 hover:bg-white hover:text-pub-ink',
        'xl:min-w-[232px]',
        pubFocus,
        className
      )}
    >
      <Search size={16} aria-hidden="true" className="shrink-0 text-pub-ink-3 transition-colors duration-150 group-hover:text-pub-ink" />
      <span className="flex-1 whitespace-nowrap font-medium">
        <span className="xl:hidden">Suche</span>
        <span className="hidden xl:inline">Wonach suchen Sie?</span>
      </span>
      <kbd
        aria-hidden="true"
        className={cn(
          'inline-flex h-6 min-w-[44px] items-center justify-center rounded-md border border-pub-hairline bg-pub-paper-2 px-1.5',
          'font-sans text-[14px] text-pub-ink-3 transition-opacity duration-150',
          kuerzel ? 'opacity-100' : 'opacity-0'
        )}
      >
        {kuerzel ?? ''}
      </kbd>
    </button>
  );
});
