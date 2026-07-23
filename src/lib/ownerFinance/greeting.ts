// Deterministic, gender-safe recipient greeting. Used by the customer portal welcome
// screen, the premium web view and the success state. It NEVER infers gender from a
// name: "Herr"/"Frau" appear only when the owner explicitly selected that salutation
// on the offer. Missing fields never throw — they degrade to a polished neutral form.
//
// Examples:
//   { salutation: 'herr',    lastName: 'Pensel' }                    -> "Herr Pensel"
//   { salutation: 'frau', title: 'Dr.', lastName: 'Schneider' }      -> "Frau Dr. Schneider"
//   { salutation: 'neutral', firstName: 'Anna', lastName: 'Schneider'} -> "Anna Schneider"
//   { }                                                              -> "" (=> "Willkommen")

export type Salutation = 'herr' | 'frau' | 'neutral';

export interface GreetingInput {
  salutation?: string | null;
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** Explicit owner-authored display name; when present it wins verbatim. */
  greetingName?: string | null;
}

const SALUTATION_WORD: Record<string, string> = { herr: 'Herr', frau: 'Frau' };

function clean(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Build just the recipient's display name (no "Guten Tag"). Returns '' when nothing
 * usable is known so callers can fall back to a neutral greeting.
 */
export function buildRecipientName(input: GreetingInput): string {
  const explicit = clean(input.greetingName);
  if (explicit) return explicit;

  const salutation = clean(input.salutation).toLowerCase();
  const title = clean(input.title);
  const first = clean(input.firstName);
  const last = clean(input.lastName);
  const person = last || first;

  // Gendered salutation is used ONLY when explicitly selected AND we have a name to
  // attach it to (never a bare "Herr").
  if ((salutation === 'herr' || salutation === 'frau') && person) {
    return [SALUTATION_WORD[salutation], title, person].filter(Boolean).join(' ');
  }

  // Neutral / unspecified: never a gendered word. Prefer full name, then any part.
  const neutral = [title, first, last].filter(Boolean).join(' ');
  return neutral;
}

export interface GreetingOptions {
  /** Leading phrase, default "Guten Tag". */
  prefix?: string;
  /** Used when no recipient name is known, default "Willkommen". */
  fallback?: string;
}

/** Full greeting line, e.g. "Guten Tag, Herr Pensel" or "Willkommen". */
export function buildGreetingLine(input: GreetingInput, options: GreetingOptions = {}): string {
  const name = buildRecipientName(input);
  const prefix = options.prefix ?? 'Guten Tag';
  const fallback = options.fallback ?? 'Willkommen';
  return name ? `${prefix}, ${name}` : fallback;
}

/** Success-state thanks line, e.g. "Vielen Dank, Herr Pensel." or "Vielen Dank." */
export function buildThanksLine(input: GreetingInput): string {
  const name = buildRecipientName(input);
  return name ? `Vielen Dank, ${name}.` : 'Vielen Dank.';
}
