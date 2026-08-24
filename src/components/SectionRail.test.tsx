// The rail's job is orientation: at any point on a long page the reader must be able to see
// which section they are in. It previously failed that on exactly the pages that need it most —
// the tracked list was capped at MAX_LINES, so /praxen (19 sections, ~21.000px) kept the ninth
// line active for the final ~66% of the page: pricing, support and the FAQ all read as
// "section 9".
//
// These tests hold the separation that fixes it: TRACKING covers every section, DISPLAY is
// windowed to at most MAX_LINES slots.

import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SectionRail } from '@/components/SectionRail';
import { railWindow, MAX_LINES as MAX, type RailItem } from '@/components/sectionRailWindow';

const sectionIndices = (items: RailItem[]) =>
  items.filter((i): i is Extract<RailItem, { kind: 'section' }> => i.kind === 'section').map((i) => i.index);

describe('railWindow — compact display over a complete section list', () => {
  it('shows every line when the page fits within the cap', () => {
    for (const n of [3, 5, 8, 9]) {
      const items = railWindow(n, 0);
      expect(items).toHaveLength(n);
      expect(sectionIndices(items)).toEqual([...Array(n).keys()]);
      expect(items.some((i) => i.kind === 'gap')).toBe(false);
    }
  });

  it('never renders more than MAX_LINES slots, however long the page', () => {
    for (const n of [10, 13, 14, 19, 40]) {
      for (let active = 0; active < n; active += 1) {
        expect(railWindow(n, active).length).toBeLessThanOrEqual(MAX);
      }
    }
  });

  it('always includes the active section — at every position on a 19-section page', () => {
    for (let active = 0; active < 19; active += 1) {
      expect(sectionIndices(railWindow(19, active))).toContain(active);
    }
  });

  it('keeps the first and last section permanently anchored', () => {
    for (let active = 0; active < 19; active += 1) {
      const shown = sectionIndices(railWindow(19, active));
      expect(shown).toContain(0);
      expect(shown).toContain(18);
    }
  });

  it('renders section indices in ascending order', () => {
    for (let active = 0; active < 19; active += 1) {
      const shown = sectionIndices(railWindow(19, active));
      expect([...shown].sort((a, b) => a - b)).toEqual(shown);
    }
  });

  it('moves calmly: one step of the active line changes at most two visible lines', () => {
    // The anchored design exists to avoid a whole-list shift on every section change.
    for (let active = 1; active < 19; active += 1) {
      const before = new Set(sectionIndices(railWindow(19, active - 1)));
      const after = sectionIndices(railWindow(19, active));
      const appeared = after.filter((i) => !before.has(i));
      expect(appeared.length).toBeLessThanOrEqual(2);
    }
  });

  it('marks collapsed stretches, and only where lines are actually hidden', () => {
    const middle = railWindow(19, 9);
    expect(middle.filter((i) => i.kind === 'gap')).toHaveLength(2);

    const atTop = railWindow(19, 0);
    expect(atTop.filter((i) => i.kind === 'gap')).toHaveLength(1); // nothing hidden above

    const atBottom = railWindow(19, 18);
    expect(atBottom.filter((i) => i.kind === 'gap')).toHaveLength(1); // nothing hidden below
  });

  it('does not pin to the ninth line — late sections take the active slot', () => {
    // The precise regression: on a 19-section page, sections 10..19 must be representable.
    for (const active of [9, 12, 15, 17, 18]) {
      expect(sectionIndices(railWindow(19, active))).toContain(active);
    }
  });
});

/* ------------------------------------------------------------------ component behaviour */

/**
 * Build a page of N sections, each tall enough to qualify, at known document offsets.
 * Only the page content is replaced — the mounted rail is left alone, so this can also
 * stand in for content that arrives after the first scan.
 */
function buildPage(count: number, height = 800) {
  document.querySelectorAll('body > section, body > nav:not([aria-label])').forEach((el) => el.remove());
  const nav = document.createElement('nav');
  document.body.appendChild(nav); // chrome must be ignored
  for (let i = 0; i < count; i += 1) {
    const s = document.createElement('section');
    const h2 = document.createElement('h2');
    h2.textContent = `Abschnitt Nummer ${i + 1}`;
    s.appendChild(h2);
    Object.defineProperty(s, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ top: i * height - window.scrollY, height, bottom: (i + 1) * height - window.scrollY, left: 0, right: 0, width: 1000, x: 0, y: 0, toJSON() {} }),
    });
    document.body.appendChild(s);
  }
}

/** Move the viewport and let the rail's rAF-throttled scroll handler settle. */
async function scrollTo(y: number) {
  await act(async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
    window.dispatchEvent(new Event('scroll'));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  });
}

const renderRail = () => render(<MemoryRouter><SectionRail /></MemoryRouter>);
const activeLabel = () => document.querySelector('[aria-current="true"]')?.getAttribute('aria-label') ?? null;

describe('SectionRail — tracking covers the whole page', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });
  afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); });

  it('discovers more than nine sections', async () => {
    buildPage(19);
    renderRail();
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    // Display is capped...
    expect(screen.getAllByRole('button').length).toBeLessThanOrEqual(MAX);
    // ...but the last section is reachable, which is only possible if all 19 are tracked.
    await scrollTo(18 * 800);
    expect(activeLabel()).toBe('Abschnitt Nummer 19');
  });

  it('activates sections beyond the ninth instead of pinning to it', async () => {
    buildPage(19);
    renderRail();
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    // 38 % reading line of an 800px viewport = 304px.
    for (const idx of [0, 5, 9, 12, 16, 18]) {
      await scrollTo(idx * 800);
      expect(activeLabel()).toBe(`Abschnitt Nummer ${idx + 1}`);
    }
  });

  it('lets the final section become active at the bottom of the page', async () => {
    buildPage(19);
    renderRail();
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    await scrollTo(19 * 800);
    expect(activeLabel()).toBe('Abschnitt Nummer 19');
  });

  it('never leaves the ninth section active for the back half of the page', async () => {
    buildPage(19);
    renderRail();
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    const seen = new Set<string | null>();
    for (let idx = 9; idx < 19; idx += 1) {
      await scrollTo(idx * 800);
      seen.add(activeLabel());
    }
    expect(seen.has('Abschnitt Nummer 9')).toBe(false);
    expect(seen.size).toBe(10); // a distinct section for each position
  });

  it('picks up sections mounted after the first scan', async () => {
    vi.useFakeTimers();
    buildPage(4);
    renderRail();
    act(() => { vi.advanceTimersByTime(50); });
    const before = screen.getAllByRole('button').length;

    act(() => { buildPage(12); vi.advanceTimersByTime(3000); });
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(before);
    vi.useRealTimers();

    // A late section is tracked, not just counted.
    await scrollTo(11 * 800);
    expect(activeLabel()).toBe('Abschnitt Nummer 12');
  });

  it('hides itself on a thin page', async () => {
    buildPage(2);
    const { container } = renderRail();
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(container.querySelector('nav')).toBeNull();
  });

  it('stays desktop-only and keeps its accessible affordances', async () => {
    buildPage(19);
    const { container } = renderRail();
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    const nav = container.querySelector('nav')!;

    // Mobile hiding is a class contract (jsdom has no viewport breakpoints).
    expect(nav.className).toContain('hidden');
    expect(nav.className).toContain('lg:flex');
    expect(nav.getAttribute('aria-label')).toBe('Abschnitte dieser Seite');
    // Every line is a real button with a name, and collapse markers are inert.
    for (const b of screen.getAllByRole('button')) {
      expect(b.getAttribute('aria-label')).toBeTruthy();
      expect(b.className).toContain('focus-visible:ring-pub-signal');
    }
    for (const gap of container.querySelectorAll('[aria-hidden="true"]')) {
      expect(gap.tagName).toBe('SPAN');
      expect(gap.querySelector('button')).toBeNull();
    }
  });

  it('uses the blue signal token for the active mark, not a hardcoded colour', async () => {
    buildPage(19);
    const { container } = renderRail();
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(container.innerHTML).toContain('--pub-signal');
  });
});

describe('SectionRail — reduced motion', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });
  afterEach(() => { document.body.innerHTML = ''; });

  it('still tracks the correct late section when motion is reduced', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('prefers-reduced-motion'),
      media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    buildPage(19);
    renderRail();
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    await scrollTo(15 * 800);
    expect(activeLabel()).toBe('Abschnitt Nummer 16');
    expect(screen.getAllByRole('button').length).toBeLessThanOrEqual(MAX);
    vi.unstubAllGlobals();
  });
});
