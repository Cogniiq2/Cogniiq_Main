import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
// Registers the DOM matchers (toBeInTheDocument, toBeDisabled, toHaveAccessibleDescription, …)
// on vitest's expect. Additive: existing assertions are unaffected.
import '@testing-library/jest-dom/vitest';

// jsdom has no layout engine; a few components observe element size on mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverStub {
  root = null;
  rootMargin = '';
  thresholds: number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

const stubs = globalThis as unknown as Record<string, unknown>;
if (!('ResizeObserver' in globalThis)) stubs.ResizeObserver = ResizeObserverStub;
// framer-motion's viewport features observe intersection on mount; jsdom has neither observer.
if (!('IntersectionObserver' in globalThis)) stubs.IntersectionObserver = IntersectionObserverStub;
const win = window as unknown as Record<string, unknown>;
if (typeof win.matchMedia !== 'function') {
  win.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// Radix popper-based controls (Select, Popover) drive pointer capture and scroll the active item
// into view. jsdom implements neither, so they are stubbed here rather than in each test.
const el = Element.prototype as unknown as Record<string, unknown>;
if (typeof el.hasPointerCapture !== 'function') el.hasPointerCapture = () => false;
if (typeof el.setPointerCapture !== 'function') el.setPointerCapture = () => {};
if (typeof el.releasePointerCapture !== 'function') el.releasePointerCapture = () => {};
if (typeof el.scrollIntoView !== 'function') el.scrollIntoView = () => {};

afterEach(() => {
  cleanup();
});
