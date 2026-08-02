import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

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

afterEach(() => {
  cleanup();
});
