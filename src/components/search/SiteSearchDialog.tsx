// ─────────────────────────────────────────────────────────────────────────────
// Seitensuche — der Dialog.
//
// WAS ER TUT
//
// Der Besucher tippt ein Wort oder einen ganzen Satz („Anrufe gehen verloren",
// „Website für Zahnarzt in München"), und die Liste zeigt sofort die Seiten,
// die dazu passen — die beste zuerst, mit dem Grund, warum sie passt. Jede
// Zeile ist ein echter Verweis; Pfeiltasten und Eingabetaste reichen.
//
// WAS ER BEWUSST NICHT TUT
//
// Keine Volltextsuche über Fließtext, keine Serveranfrage, keine Speicherung
// der Eingabe. Der Index entsteht aus dem Routen-Manifest (Titel, Beschreibung,
// Schlagwörter) plus Wortschatz und liegt vollständig im Browser; er wird erst
// beim ersten Öffnen nachgeladen (siehe Navigation.tsx).
//
// GESTALTUNG nach COPY-BRIEF-3 §1: Bewegung 150 ms, nur Deckkraft und kleine
// Verschiebung; kein Text unter 14 px; Tap-Ziele ab 44 px; `--pub-*`-Tokens.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CornerDownLeft, Search, X } from 'lucide-react';

import { pubFocus } from '@/components/public/PublicUI';
import { cn } from '@/lib/utils';
import { LEISTUNGEN, STANDORTE } from '@/lib/navigation-data';
import { buildSearchIndex } from '@/lib/search/index';
import { searchSite, type SearchResult } from '@/lib/search/engine';
import { EXAMPLE_QUERIES, KIND_LABEL } from '@/lib/search/lexicon';

export interface SiteSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Eingabe beim Öffnen, z. B. aus einer nicht gefundenen URL. */
  initialQuery?: string;
  /** Element, das beim Schließen den Fokus zurückbekommt — außer nach einem Seitenwechsel. */
  returnFocusTo?: RefObject<HTMLElement | null>;
}

const MIN_QUERY = 2;

export function SiteSearchDialog({ open, onOpenChange, initialQuery = '', returnFocusTo }: SiteSearchDialogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const listId = useId();
  // Nach einem Seitenwechsel gehört der Fokus der neuen Seite, nicht dem Auslöser.
  const navigated = useRef(false);

  // Jede Öffnung beginnt mit der übergebenen Eingabe — vorhersehbar statt
  // „wo war ich". Die Vorbelegung kommt von der 404-Seite.
  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setActive(0);
    }
  }, [open, initialQuery]);

  const index = useMemo(() => buildSearchIndex(), []);
  const results = useMemo<SearchResult[]>(
    () => (deferredQuery.trim().length >= MIN_QUERY ? searchSite(index, deferredQuery) : []),
    [index, deferredQuery]
  );
  const searching = query.trim().length >= MIN_QUERY;

  // Neue Ergebnisse: Auswahl zurück an den Anfang.
  useEffect(() => {
    setActive(0);
  }, [results]);

  // Aktive Zeile im Blick halten.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const closeAfterNavigation = useCallback(() => {
    navigated.current = true;
    onOpenChange(false);
  }, [onOpenChange]);

  const go = useCallback(
    (path: string) => {
      navigated.current = true;
      close();
      navigate(path);
    },
    [close, navigate]
  );

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(results.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[active] ?? results[0];
      if (target) go(target.doc.path);
    }
  };

  const activeId = results[active] ? optionId(listId, active) : undefined;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[80] bg-pub-ink/40 backdrop-blur-[2px]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-150'
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            // Radix sucht sonst einen DialogPrimitive.Trigger, den es hier nicht gibt.
            e.preventDefault();
            if (!navigated.current) returnFocusTo?.current?.focus();
            navigated.current = false;
          }}
          className={cn(
            'fixed inset-x-0 top-0 z-[81] mx-auto flex h-[100dvh] w-full flex-col bg-pub-paper text-pub-ink',
            'sm:top-[9vh] sm:h-auto sm:max-h-[82vh] sm:max-w-[700px] sm:rounded-[28px] sm:border sm:border-pub-hairline',
            'sm:shadow-[0_40px_90px_-30px_rgba(11,15,20,0.45)]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-150 ease-out',
            'motion-reduce:data-[state=open]:slide-in-from-top-0',
            'focus:outline-none'
          )}
        >
          {/* Radix verknüpft Titel und Dialog selbst (aria-labelledby). */}
          <DialogPrimitive.Title className="sr-only">Seite finden</DialogPrimitive.Title>

          {/* EINGABE */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const target = results[active] ?? results[0];
              if (target) go(target.doc.path);
            }}
            className="flex shrink-0 items-center gap-3 border-b border-pub-hairline px-5 sm:px-6"
          >
            <Search size={22} aria-hidden="true" className="shrink-0 text-pub-ink-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Was möchten Sie erreichen?"
              aria-label="Seite finden"
              aria-autocomplete="list"
              aria-controls={listId}
              aria-expanded={results.length > 0}
              aria-activedescendant={activeId}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="go"
              className={cn(
                'h-[72px] min-w-0 flex-1 bg-transparent text-[19px] font-medium tracking-[-0.01em] text-pub-ink',
                'placeholder:font-normal placeholder:text-pub-ink-4 focus:outline-none sm:h-[80px] sm:text-[22px]'
              )}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                aria-label="Eingabe löschen"
                className={cn(
                  'inline-flex h-11 shrink-0 items-center justify-center rounded-full px-3 text-[14px] font-medium text-pub-ink-3',
                  'transition-colors duration-150 hover:bg-pub-paper-2 hover:text-pub-ink',
                  pubFocus
                )}
              >
                Löschen
              </button>
            )}
            <DialogPrimitive.Close
              aria-label="Suche schließen"
              className={cn(
                'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pub-hairline text-pub-ink-2',
                'transition-colors duration-150 hover:bg-pub-paper-2 hover:text-pub-ink',
                pubFocus
              )}
            >
              <X size={18} aria-hidden="true" />
            </DialogPrimitive.Close>
          </form>

          {/* ERGEBNISSE */}
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
            <p className="sr-only" aria-live="polite">
              {searching
                ? results.length === 0
                  ? 'Keine passende Seite.'
                  : `${results.length} passende Seiten. Beste Übereinstimmung: ${results[0].doc.label}.`
                : ''}
            </p>

            {!searching && <StartZustand onPick={(q) => setQuery(q)} onNavigate={closeAfterNavigation} />}

            {searching && results.length === 0 && (
              <LeerZustand query={query} onPick={(q) => setQuery(q)} onNavigate={closeAfterNavigation} />
            )}

            {searching && results.length > 0 && (
              <div id={listId} role="listbox" aria-label="Passende Seiten">
                {results.map((r, i) => (
                  <Treffer
                    key={r.doc.path}
                    result={r}
                    index={i}
                    id={optionId(listId, i)}
                    active={i === active}
                    best={i === 0}
                    onHover={() => setActive(i)}
                    onNavigate={() => {
                      navigated.current = true;
                      close();
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* FUSS */}
          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-pub-hairline px-5 py-3 text-[14px] text-pub-ink-3 sm:px-6">
            <div className="hidden items-center gap-4 sm:flex" aria-hidden="true">
              <span className="inline-flex items-center gap-1.5">
                <Taste>↑</Taste>
                <Taste>↓</Taste>
                wählen
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Taste>
                  <CornerDownLeft size={12} />
                </Taste>
                öffnen
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Taste>Esc</Taste>
                schließen
              </span>
            </div>
            <Link
              to="/kontakt"
              onClick={closeAfterNavigation}
              className={cn(
                'group inline-flex min-h-[44px] items-center gap-1.5 rounded-full font-medium text-pub-ink-2',
                'transition-colors duration-150 hover:text-pub-ink',
                pubFocus
              )}
            >
              Nicht dabei? Fragen Sie uns direkt
              <ArrowUpRight
                size={15}
                aria-hidden="true"
                className="transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function optionId(listId: string, index: number): string {
  return `${listId}-option-${index}`;
}

/* ─── Eine Trefferzeile ───────────────────────────────────────────────── */
function Treffer({
  result,
  index,
  id,
  active,
  best,
  onHover,
  onNavigate,
}: {
  result: SearchResult;
  index: number;
  id: string;
  active: boolean;
  best: boolean;
  onHover: () => void;
  onNavigate: () => void;
}) {
  const { doc, matched } = result;
  return (
    <Link
      to={doc.path}
      id={id}
      role="option"
      aria-selected={active}
      data-index={index}
      data-active={active}
      onMouseMove={onHover}
      onClick={onNavigate}
      className={cn(
        'group relative block rounded-2xl transition-colors duration-150',
        best ? 'mb-2 px-4 py-4 sm:px-5' : 'px-4 py-3 sm:px-5',
        active ? 'bg-pub-paper-2' : 'hover:bg-pub-paper-2/70',
        // Der Fokus liegt im Eingabefeld; die Markierung übernimmt die Rolle des Fokusrings.
        'focus:outline-none'
      )}
    >
      {best && (
        <span className="mb-2 block text-[14px] font-semibold uppercase tracking-[0.08em] text-pub-ink-3">
          Beste Übereinstimmung
        </span>
      )}
      <span className="flex items-start gap-3">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span
              className={cn(
                'font-semibold tracking-[-0.01em] text-pub-ink',
                best ? 'text-[20px] leading-snug sm:text-[22px]' : 'text-[16.5px] leading-snug'
              )}
            >
              {doc.label}
            </span>
            <Art kind={doc.kind} />
          </span>
          <span
            className={cn(
              'mt-1 block text-pub-ink-3',
              best ? 'text-[15.5px] leading-relaxed' : 'line-clamp-1 text-[14.5px] leading-relaxed'
            )}
          >
            {doc.description}
          </span>
          {matched.length > 0 && (
            <span className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] text-pub-ink-3">
              <span className="text-pub-ink-4">Trifft:</span>
              {matched.map((m, i) => (
                <span key={m} className="font-medium text-pub-ink-2">
                  {m}
                  {i < matched.length - 1 && <span className="ml-1.5 text-pub-ink-4">·</span>}
                </span>
              ))}
            </span>
          )}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-150',
            active ? 'border-pub-ink bg-pub-ink text-white' : 'border-pub-hairline text-pub-ink-3 group-hover:border-pub-ink/30'
          )}
        >
          <ArrowRight size={16} />
        </span>
      </span>
    </Link>
  );
}

function Art({ kind }: { kind: keyof typeof KIND_LABEL }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full border border-pub-hairline px-2 text-[14px] font-medium leading-none text-pub-ink-3">
      {KIND_LABEL[kind]}
    </span>
  );
}

/* ─── Leer: noch nichts getippt ───────────────────────────────────────── */
function StartZustand({ onPick, onNavigate }: { onPick: (q: string) => void; onNavigate: () => void }) {
  const preise = LEISTUNGEN.flatMap((l) => l.abschluss.filter((z) => z.label === 'Preise').map((z) => ({ label: `Preise ${l.label}`, href: z.href })));
  return (
    <div className="px-2 pb-2 pt-1 sm:px-2">
      <Abschnitt titel="Tippen Sie ein Wort oder einen ganzen Satz">
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
              className={cn(
                'inline-flex min-h-[40px] items-center rounded-full border border-pub-hairline bg-pub-paper px-4 text-[15px] font-medium text-pub-ink-2',
                'transition-colors duration-150 hover:border-pub-ink/30 hover:text-pub-ink',
                pubFocus
              )}
            >
              „{q}“
            </button>
          ))}
        </div>
      </Abschnitt>

      <div className="mt-7 grid gap-7 sm:grid-cols-3">
        <Abschnitt titel="Leistungen">
          <Schnellziele ziele={LEISTUNGEN.map((l) => ({ label: l.label, href: l.href }))} onNavigate={onNavigate} />
        </Abschnitt>
        <Abschnitt titel="Preise">
          <Schnellziele ziele={preise} onNavigate={onNavigate} />
        </Abschnitt>
        <Abschnitt titel="Standorte">
          <Schnellziele ziele={STANDORTE.staedte} onNavigate={onNavigate} />
        </Abschnitt>
      </div>
    </div>
  );
}

/* ─── Leer: nichts gefunden ───────────────────────────────────────────── */
function LeerZustand({ query, onPick, onNavigate }: { query: string; onPick: (q: string) => void; onNavigate: () => void }) {
  return (
    <div className="px-3 py-6 sm:px-4">
      <p className="text-[18px] font-semibold text-pub-ink">
        Zu „{query.trim()}“ haben wir keine eigene Seite.
      </p>
      <p className="mt-1.5 text-[15.5px] leading-relaxed text-pub-ink-3">
        Versuchen Sie ein anderes Wort – oder beschreiben Sie Ihr Anliegen, wir antworten persönlich.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {EXAMPLE_QUERIES.slice(0, 4).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className={cn(
              'inline-flex min-h-[40px] items-center rounded-full border border-pub-hairline px-4 text-[15px] font-medium text-pub-ink-2',
              'transition-colors duration-150 hover:border-pub-ink/30 hover:text-pub-ink',
              pubFocus
            )}
          >
            „{q}“
          </button>
        ))}
      </div>
      <Link
        to="/kontakt"
        onClick={onNavigate}
        className={cn(
          'group mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-pub-ink px-5 text-[15px] font-semibold text-white',
          'transition-colors duration-150 hover:bg-[#1f2933]',
          pubFocus
        )}
      >
        Anliegen schildern
        <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

/* ─── Bausteine ───────────────────────────────────────────────────────── */
function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-[14px] font-semibold uppercase tracking-[0.08em] text-pub-ink-4">{titel}</h3>
      {children}
    </section>
  );
}

function Schnellziele({ ziele, onNavigate }: { ziele: ReadonlyArray<{ label: string; href: string }>; onNavigate: () => void }) {
  return (
    <ul className="space-y-0.5">
      {ziele.map((z) => (
        <li key={z.href}>
          <Link
            to={z.href}
            onClick={onNavigate}
            className={cn(
              'group -mx-2 flex min-h-[40px] items-center justify-between gap-2 rounded-lg px-2 text-[15.5px] font-medium text-pub-ink-2',
              'transition-colors duration-150 hover:bg-pub-paper-2 hover:text-pub-ink',
              pubFocus
            )}
          >
            {z.label}
            <ArrowRight
              size={14}
              aria-hidden="true"
              className="text-pub-ink-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Taste({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-pub-hairline bg-pub-paper-2 px-1.5 font-sans text-[14px] text-pub-ink-2">
      {children}
    </kbd>
  );
}
