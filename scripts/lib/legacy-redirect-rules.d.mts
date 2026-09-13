// Typen für ./legacy-redirect-rules.mjs.
//
// Das Modul bleibt bewusst reines JavaScript: Es wird von .mjs-CI-Skripten
// geladen, die keinen TypeScript-Loader haben — dieselbe Bedingung wie bei
// ./private-routing.mjs. Jenes Modul brauchte nie eine Deklaration, weil es
// nur aus `functions/` importiert wird und tsconfig.app.json nur `src`
// einschließt. Dieses hier wird zusätzlich aus einer Testdatei unter `src/`
// gelesen, und dort soll `any` nicht durchrutschen.

/** [von, nach] je zurückgezogener Route, in Deklarationsreihenfolge. */
export type LegacyRedirectPair = readonly [from: string, to: string];

/** Eine Regel aus `_redirects`, an Leerraum zerlegt: [von, nach, Status?]. */
export type RedirectRule = readonly string[];

export const LEGACY_REDIRECTS_SOURCE: string;

export function parseLegacyRedirects(source: string): LegacyRedirectPair[];

export function slashVariant(path: string): string;

export function checkNetlifyTrailingSlashRules(
  rules: readonly RedirectRule[],
  legacyPairs: readonly LegacyRedirectPair[]
): string[];
