import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Route intents — how a command starts an action it does not own.
 *
 * ⌘K's "Neuen Kunden anlegen" must actually begin creating a customer, not drop the
 * owner on a list and leave them to find the button. But the palette must not own the
 * form either: the composer lives on its page, with that page's validation, its RPC and
 * its reload. Duplicating it, or writing from the palette, would create a second way to
 * create the same record.
 *
 * So the command navigates to the real destination with `?create=1`, and the destination
 * consumes that intent by opening the dialog it already has. One create path, one form,
 * no new mutation, and the intent is a URL rather than shared state — which also makes
 * it linkable and testable.
 *
 * The parameter is removed with a history *replacement* the moment it is consumed, so:
 *   - a refresh does not reopen the dialog,
 *   - Back leaves the page instead of stepping onto a URL that reopens it,
 *   - and the plain list URL never opens anything.
 */

export const CREATE_INTENT_PARAM = 'create';

/** The href a command uses to ask `path` to open its create UI. */
export function createIntentHref(path: string): string {
  return `${path}?${CREATE_INTENT_PARAM}=1`;
}

/**
 * Consume a pending create intent exactly once.
 *
 * `open` is called only when the URL actually carries the intent; the plain list URL
 * calls nothing. The callback is held in a ref so a caller can pass an inline arrow
 * without the effect re-running on every render.
 */
export function useCreateIntent(open: () => void): void {
  const [params, setParams] = useSearchParams();
  const requested = params.get(CREATE_INTENT_PARAM) === '1';
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!requested) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(CREATE_INTENT_PARAM);
        return next;
      },
      { replace: true },
    );
    openRef.current();
  }, [requested, setParams]);
}
