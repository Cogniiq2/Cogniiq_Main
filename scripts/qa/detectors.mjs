// Pure detectors used by the route harness.
//
// Split out from the harness so they can be unit-tested without a browser
// (`src/test/qaDetectors.test.ts`). Each takes a plain snapshot object of the kind
// `page.evaluate` returns and decides whether the route passed.
//
// TEST-ONLY — never imported from `src/`.

/**
 * A route is only "populated" if real content is on screen. The failure this guards
 * against is the one the whole fixture layer exists to remove: a page that renders its
 * skeleton forever because a query never resolved, and is then screenshotted and reported
 * as if it were the finished design.
 *
 * @param {object} snapshot
 * @param {number} snapshot.skeletonCount     elements matching the skeleton selector
 * @param {number} snapshot.contentTextLength visible text length outside nav/skeletons
 * @param {boolean} snapshot.hasEmptyState    an intentional empty state is rendered
 * @param {boolean} snapshot.hasErrorState    an intentional error state is rendered
 */
export function classifyRouteState(snapshot) {
  const { skeletonCount, contentTextLength, hasEmptyState, hasErrorState } = snapshot;

  if (hasErrorState) return 'error';

  // Content wins over an empty state. A real page routinely carries BOTH — the customer
  // portal shows its projects and, beside them, "noch keine offenen Rechnungen". Checking
  // the empty-state marker first would misreport every one of those as an empty page.
  // `contentTextLength` is measured with empty-state and error-state blocks removed, so
  // this is genuinely "is there content in addition to them".
  if (contentTextLength >= MIN_CONTENT_CHARS) return 'populated';
  if (hasEmptyState) return 'empty';

  // A skeleton with no content behind it is the permanent-skeleton failure.
  if (skeletonCount > 0) return 'skeleton';
  return 'blank';
}

/**
 * Enough characters that a page header plus one row of real data has rendered, but low
 * enough that a genuinely terse route is not misreported. Calibrated against the shortest
 * populated route in the product — /app/solutions with a single assigned solution renders
 * 119 characters — while a permanent skeleton renders 0.
 */
export const MIN_CONTENT_CHARS = 80;

/**
 * Decide whether a captured route counts as evidence for the scenario it was run under.
 * `skeleton` and `blank` never count — a screenshot of a permanent skeleton is exactly the
 * artefact this harness exists to reject.
 */
export function isAcceptable(scenario, state) {
  switch (scenario) {
    case 'populated': return state === 'populated';
    case 'empty': return state === 'empty' || state === 'populated';
    case 'error': return state === 'error';
    default: return false;
  }
}

/** Human-readable reason for a rejected capture, for the findings report. */
export function rejectionReason(route, scenario, state) {
  if (state === 'skeleton') {
    return `${route} @ ${scenario}: page is PERMANENTLY IN SKELETON STATE — no content rendered. `
      + 'A screenshot of this does not count as evidence.';
  }
  if (state === 'blank') {
    return `${route} @ ${scenario}: page rendered no content and no skeleton (blank).`;
  }
  return `${route} @ ${scenario}: expected ${scenario} state, page reached "${state}".`;
}

/** Report a horizontal-overflow measurement. */
export function overflowFinding(route, viewport, overflowPx) {
  if (overflowPx <= 1) return null;
  return `OVERFLOW ${route} @ ${viewport}: document is ${overflowPx}px wider than the viewport`;
}

/** Report option rows below the 44px mobile minimum. */
export function touchTargetFinding(route, shortRowCount) {
  if (shortRowCount <= 0) return null;
  return `TOUCHTARGET ${route}: ${shortRowCount} option row(s) under 44px`;
}
