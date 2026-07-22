// Minimal @react-pdf/renderer stand-in for the browser-render regression test
// (test-premium-offer-browser-render.mjs). It implements only the surface premiumOfferPdf.tsx
// touches. `pdf(element).toBlob()` succeeds like the real browser build; `renderToBuffer` throws,
// mirroring the real bug where the browser build exposes it as a function-shaped Node-only stub
// that throws "renderToBuffer is a Node specific API" the moment it's actually called.

const passthrough = (props) => props;

export const Document = passthrough;
export const Page = passthrough;
export const View = passthrough;
export const Text = passthrough;
export const StyleSheet = { create: (styles) => styles };
export const Font = {
  register: () => {},
  registerHyphenationCallback: () => {},
};

// esbuild inlines this module's source into the bundled renderer (rather than importing it as an
// external module), so the bundle ends up with its own copy of this file's module scope, separate
// from the copy the test script imports directly. Call counts live on `globalThis` so both copies
// observe the same counters.
const calls = (globalThis.__mockReactPdfCalls ??= { pdf: 0, toBlob: 0, renderToBuffer: 0 });

export function pdf(_element) {
  calls.pdf++;
  return {
    toBlob: async () => {
      calls.toBlob++;
      // %PDF header bytes — enough to assert "a real-looking PDF payload came back".
      return new Blob([new Uint8Array([37, 80, 68, 70])], { type: 'application/pdf' });
    },
  };
}

export function renderToBuffer(_element) {
  calls.renderToBuffer++;
  throw new Error('Node API must not be called');
}

export function __getCallCounts() {
  return { ...calls };
}
