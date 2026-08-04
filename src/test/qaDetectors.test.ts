import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// FALSIFICATION TEST — route QA must reject a page stuck in a skeleton state.
//
// The reason this exists: a permanent skeleton photographs beautifully. Without an explicit
// rule, a harness will happily capture 23 shimmering placeholder pages and a report will
// call them "rendered". These assertions pin down that `skeleton` and `blank` can never be
// accepted as evidence for any scenario.
//
// The detectors are plain ESM under scripts/qa, imported here by URL so the production
// bundle graph is untouched (see qaFixtureIsolation.test.ts, which forbids the reverse).

const DETECTORS = resolve(__dirname, '../../scripts/qa/detectors.mjs');

const {
  classifyRouteState,
  isAcceptable,
  rejectionReason,
  overflowFinding,
  touchTargetFinding,
  MIN_CONTENT_CHARS,
} = await import(DETECTORS);

const snapshot = (over: Partial<Record<string, number | boolean>> = {}) => ({
  skeletonCount: 0,
  contentTextLength: 0,
  hasEmptyState: false,
  hasErrorState: false,
  ...over,
});

describe('classifyRouteState', () => {
  it('calls a page with only skeletons a skeleton', () => {
    expect(classifyRouteState(snapshot({ skeletonCount: 12, contentTextLength: 0 }))).toBe('skeleton');
  });

  it('still calls it a skeleton when a header rendered but no content did', () => {
    // The realistic failure: the page shell and title paint immediately, the data never
    // arrives. A length check alone would call this populated.
    expect(classifyRouteState(snapshot({ skeletonCount: 8, contentTextLength: MIN_CONTENT_CHARS - 1 })))
      .toBe('skeleton');
  });

  it('calls a page with real content populated, even while a skeleton is still on screen', () => {
    expect(classifyRouteState(snapshot({ skeletonCount: 2, contentTextLength: MIN_CONTENT_CHARS + 500 })))
      .toBe('populated');
  });

  it('recognises a deliberate empty state', () => {
    expect(classifyRouteState(snapshot({ hasEmptyState: true }))).toBe('empty');
  });

  it('recognises a deliberate error state, and prefers it over empty', () => {
    expect(classifyRouteState(snapshot({ hasErrorState: true }))).toBe('error');
    expect(classifyRouteState(snapshot({ hasErrorState: true, hasEmptyState: true }))).toBe('error');
  });

  it('calls an entirely blank page blank, not populated', () => {
    expect(classifyRouteState(snapshot())).toBe('blank');
  });
});

describe('isAcceptable', () => {
  it('never accepts a skeleton as evidence for any scenario', () => {
    for (const scenario of ['populated', 'empty', 'error']) {
      expect(isAcceptable(scenario, 'skeleton'), `${scenario} must reject skeleton`).toBe(false);
    }
  });

  it('never accepts a blank page as evidence for any scenario', () => {
    for (const scenario of ['populated', 'empty', 'error']) {
      expect(isAcceptable(scenario, 'blank')).toBe(false);
    }
  });

  it('requires the populated scenario to actually reach populated', () => {
    expect(isAcceptable('populated', 'populated')).toBe(true);
    expect(isAcceptable('populated', 'empty')).toBe(false);
    expect(isAcceptable('populated', 'error')).toBe(false);
  });

  it('requires the error scenario to actually reach an error state', () => {
    expect(isAcceptable('error', 'error')).toBe(true);
    expect(isAcceptable('error', 'populated')).toBe(false);
  });

  it('accepts either an empty state or content for the empty scenario', () => {
    // With every table emptied, a page that has no list at all legitimately still renders
    // its own content (settings forms, for instance).
    expect(isAcceptable('empty', 'empty')).toBe(true);
    expect(isAcceptable('empty', 'populated')).toBe(true);
  });

  it('rejects an unknown scenario rather than defaulting to pass', () => {
    expect(isAcceptable('whatever', 'populated')).toBe(false);
  });
});

describe('rejectionReason', () => {
  it('names the permanent-skeleton failure explicitly', () => {
    const reason = rejectionReason('owner-01-dashboard', 'populated', 'skeleton');
    expect(reason).toContain('PERMANENTLY IN SKELETON STATE');
    expect(reason).toContain('does not count as evidence');
  });
});

describe('layout findings', () => {
  it('reports horizontal overflow above one pixel and ignores sub-pixel rounding', () => {
    expect(overflowFinding('r', '390x844', 0)).toBeNull();
    expect(overflowFinding('r', '390x844', 1)).toBeNull();
    expect(overflowFinding('r', '390x844', 17)).toContain('17px');
  });

  it('reports option rows under the 44px mobile minimum', () => {
    expect(touchTargetFinding('r', 0)).toBeNull();
    expect(touchTargetFinding('r', 3)).toContain('3 option row(s) under 44px');
  });
});

describe('the harness wires the detectors to a non-zero exit', () => {
  // A detector that classifies correctly but is never acted on is worthless. This asserts
  // the harness actually fails the process rather than printing a warning.
  const harness = readFileSync(resolve(__dirname, '../../scripts/qa/route-qa.mjs'), 'utf8');

  it('imports the detectors rather than reimplementing them', () => {
    expect(harness).toContain("from './detectors.mjs'");
    expect(harness).toContain('classifyRouteState');
    expect(harness).toContain('isAcceptable');
  });

  it('exits non-zero when a route has no populated capture or any finding exists', () => {
    expect(harness).toContain('missingPopulated.length || findings.length');
    expect(harness).toContain('process.exit(1)');
  });

  it('does not screenshot a route it has already rejected', () => {
    // `captureRoute` must return before `page.screenshot` when the state is unacceptable.
    const body = harness.slice(harness.indexOf('async function captureRoute'));
    const reject = body.indexOf('rejectionReason(');
    const shoot = body.indexOf('page.screenshot');
    expect(reject).toBeGreaterThan(-1);
    expect(shoot).toBeGreaterThan(reject);
    expect(body.slice(reject, shoot)).toContain('return null;');
  });
});

describe('the product marks its intentional states for QA', () => {
  it('EmptyState, ErrorState and Skeleton carry data-qa markers', () => {
    const primitives = readFileSync(resolve(__dirname, '../components/dashboard/primitives.tsx'), 'utf8');
    expect(primitives).toContain('data-qa="empty-state"');
    expect(primitives).toContain('data-qa="error-state"');
    expect(primitives).toContain('data-qa="skeleton"');
  });

  it('the customer portal primitives carry the same markers', () => {
    const app = readFileSync(resolve(__dirname, '../components/app/CustomerAppPrimitives.tsx'), 'utf8');
    expect(app).toContain('data-qa="empty-state"');
    expect(app).toContain('data-qa="error-state"');
    expect(app).toContain('data-qa="skeleton"');
  });
});
