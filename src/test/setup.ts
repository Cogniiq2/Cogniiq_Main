import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
// Registers toBeInTheDocument / toHaveFocus / toHaveAttribute and friends. The dependency was
// already declared; it had simply never been wired into the setup file.
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

// Radix's Select and DropdownMenu drive their open/close and typeahead behaviour through
// Pointer Events and scroll an item into view on open. jsdom implements neither, so without
// these the primitives throw the moment a menu opens. These are jsdom gaps, not product
// behaviour — nothing here changes what the components do in a browser.
const elementProto = window.HTMLElement.prototype as unknown as Record<string, unknown>;
if (typeof elementProto.hasPointerCapture !== 'function') {
  elementProto.hasPointerCapture = () => false;
  elementProto.setPointerCapture = () => {};
  elementProto.releasePointerCapture = () => {};
}
if (typeof elementProto.scrollIntoView !== 'function') {
  elementProto.scrollIntoView = () => {};
}
if (!('PointerEvent' in globalThis)) {
  stubs.PointerEvent = window.MouseEvent;
}

afterEach(() => {
  cleanup();
});
