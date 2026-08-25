// Multiline list fields ("Nicht enthalten", "Annahmen") must render one row per entry.
//
// The reported bug: ten exclusions, one per line, printed as a single running paragraph
// ("Vollständige Finanzzentrale und Finanzbuchhaltung Automatische Stripe- und PayPal-Abstimmung
// Bankkontenabgleich …"), because both premium renderers joined single newlines with a space.
// Typing "•" by hand did not help — it produced "• a • b • c" on that same one line.
//
// These tests pin the parsing contract. The three surfaces are pinned in
// listFieldRendering.test.tsx, which renders them.

import { describe, expect, it } from 'vitest';

import { parseListEntries, asListOrProse } from './listFields';

/** The real "Nicht enthalten" text from the SV Heinersreuth Admin offer. */
const EXCLUSIONS = [
  'Vollständige Finanzzentrale und Finanzbuchhaltung',
  'Automatische Stripe- und PayPal-Abstimmung',
  'Bankkontenabgleich',
  'Automatische Zuordnung von Auszahlungen zu Bankbewegungen',
  'Monatliche Finanz- und Steuerberaterberichte',
  'DATEV- oder vergleichbare Buchhaltungsexporte',
  'Erweiterte Gutscheinverwaltung',
  'Automatisierte Behandlung fehlgeschlagener E-Mails',
  'Individuelle Neuentwicklungen außerhalb des beschriebenen Leistungsumfangs',
  'Steuer- oder Rechtsberatung',
];

describe('1. newline-separated exclusions become separate entries', () => {
  it('splits the real ten-line exclusions block into ten entries', () => {
    expect(parseListEntries(EXCLUSIONS.join('\n'))).toEqual(EXCLUSIONS);
  });

  it('resolves to a list, not to prose', () => {
    expect(asListOrProse(EXCLUSIONS.join('\n'))).toEqual({ kind: 'list', items: EXCLUSIONS });
  });

  it('never fuses the entries into one running line (the reported bug)', () => {
    const block = asListOrProse(EXCLUSIONS.join('\n'));
    expect(block?.kind).toBe('list');
    // The old renderer produced exactly this.
    const fused = EXCLUSIONS.join(' ');
    expect(block).not.toEqual({ kind: 'prose', text: fused });
    if (block?.kind === 'list') {
      for (const item of block.items) expect(item).not.toContain('  ');
    }
  });
});

describe('2. CRLF and LF both work', () => {
  it('parses LF', () => {
    expect(parseListEntries('a\nb\nc')).toEqual(['a', 'b', 'c']);
  });

  it('parses CRLF identically — a Windows-entered field is not one long line', () => {
    expect(parseListEntries('a\r\nb\r\nc')).toEqual(['a', 'b', 'c']);
  });

  it('parses a mixed CRLF/LF field', () => {
    expect(parseListEntries('a\r\nb\nc\r\nd')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('leaves no stray carriage return on any entry', () => {
    for (const item of parseListEntries('a\r\nb\r\nc')) expect(item).not.toMatch(/\r/);
  });
});

describe('3. blank lines are ignored', () => {
  it('drops empty and whitespace-only lines', () => {
    expect(parseListEntries('a\n\nb\n   \n\t\nc\n')).toEqual(['a', 'b', 'c']);
  });

  it('drops leading and trailing blank lines', () => {
    expect(parseListEntries('\n\na\nb\n\n')).toEqual(['a', 'b']);
  });

  it('treats a whitespace-only field as absent', () => {
    expect(asListOrProse('   \n\n  ')).toBeNull();
    expect(asListOrProse('')).toBeNull();
    expect(asListOrProse(null)).toBeNull();
    expect(asListOrProse(undefined)).toBeNull();
  });
});

describe('4. manually prefixed markers do not create duplicate bullets', () => {
  it('strips a typed "•"', () => {
    expect(parseListEntries('• Punkt 1\n• Punkt 2\n• Punkt 3')).toEqual(['Punkt 1', 'Punkt 2', 'Punkt 3']);
  });

  it('strips a typed "-"', () => {
    expect(parseListEntries('- Punkt 1\n- Punkt 2')).toEqual(['Punkt 1', 'Punkt 2']);
  });

  it('strips en/em dashes and asterisks too', () => {
    expect(parseListEntries('– a\n— b\n* c\n+ d\n· e')).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('strips a marker that is indented', () => {
    expect(parseListEntries('   • a\n\t- b')).toEqual(['a', 'b']);
  });

  it('does NOT strip a hyphen that is part of a word', () => {
    expect(parseListEntries('DATEV- oder vergleichbare Buchhaltungsexporte\nE-Mail-Support'))
      .toEqual(['DATEV- oder vergleichbare Buchhaltungsexporte', 'E-Mail-Support']);
  });

  it('does NOT strip a leading minus that carries meaning', () => {
    expect(parseListEntries('-5 % Rabatt\n-10 % ab Jahr 2')).toEqual(['-5 % Rabatt', '-10 % ab Jahr 2']);
  });
});

describe('6. ordinary prose stays prose', () => {
  const PROSE = 'Das Angebot basiert auf der bestehenden technischen Plattform und den aktuell '
    + 'vorhandenen Buchungs-, Mitglieder- und Zahlungsprozessen des SV Heinersreuth.';

  it('keeps a single paragraph as prose, not a one-item list', () => {
    expect(asListOrProse(PROSE)).toEqual({ kind: 'prose', text: PROSE });
  });

  it('keeps the real one-paragraph "Annahmen" of a historical offer as prose', () => {
    const block = asListOrProse(PROSE);
    expect(block?.kind).toBe('prose');
  });

  it('trims surrounding whitespace but does not otherwise rewrite prose', () => {
    expect(asListOrProse(`\n  ${PROSE}  \n`)).toEqual({ kind: 'prose', text: PROSE });
  });

  it('a single line that happens to start with a dash stays prose and keeps its text', () => {
    expect(asListOrProse('- nur ein Punkt')).toEqual({ kind: 'prose', text: '- nur ein Punkt' });
  });
});

describe('regression safety for historical offers', () => {
  it('preserves entry order exactly', () => {
    expect(parseListEntries(EXCLUSIONS.join('\r\n'))).toEqual(EXCLUSIONS);
  });

  it('does not drop, merge or reword any entry', () => {
    const parsed = parseListEntries(EXCLUSIONS.join('\n'));
    expect(parsed).toHaveLength(EXCLUSIONS.length);
    expect(parsed.join('|')).toBe(EXCLUSIONS.join('|'));
  });

  it('is idempotent — re-parsing rendered entries changes nothing', () => {
    const once = parseListEntries(EXCLUSIONS.join('\n'));
    expect(parseListEntries(once.join('\n'))).toEqual(once);
    // And re-parsing after the renderer's bullet is prefixed is still stable.
    expect(parseListEntries(once.map((i) => `• ${i}`).join('\n'))).toEqual(once);
  });
});
