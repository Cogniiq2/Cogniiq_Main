// ─────────────────────────────────────────────────────────────────────────────
// Die Seitensuche von überall öffnen — ohne Kontext, ohne Prop-Drilling.
//
// Die Navigation besitzt den Zustand des Suchdialogs und hört auf dieses
// Ereignis. Eine Seite (z. B. die 404-Seite) kann die Suche so mit einer
// vorbelegten Eingabe öffnen, ohne die Navigation zu kennen. Winzig, damit es
// im Einstiegs-Chunk bleiben darf; der Dialog selbst wird nachgeladen.
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_SEARCH_OPEN_EVENT = 'cogniiq:site-search-open';

export interface SiteSearchOpenDetail {
  /** Vorbelegte Eingabe, z. B. die Wörter einer nicht gefundenen URL. */
  readonly query?: string;
}

export function openSiteSearch(detail: SiteSearchOpenDetail = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<SiteSearchOpenDetail>(SITE_SEARCH_OPEN_EVENT, { detail }));
}

/** Die Wörter eines URL-Pfads als Sucheingabe: „/webdesign-arzt-nuernberg" → „webdesign arzt nuernberg". */
export function queryFromPath(pathname: string): string {
  return pathname
    .split(/[/\-_.]+/)
    .filter((part) => part && !/^\d+$/.test(part))
    .join(' ')
    .trim();
}
