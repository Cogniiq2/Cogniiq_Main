// The customer document route must never fail as a blank white page.
//
// Regression origin: a freshly emailed offer link opened to a completely empty <div id="root">.
// The offer, token and backend projection were all healthy — public_offer_by_token was never
// called. The route's lazy chunk 404'd (a deploy changed every asset hash), React re-threw the
// rejected dynamic import, and with no boundary above the Suspense the whole root unmounted.

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  DocumentRouteBoundary, DocumentRouteFallback, isChunkLoadError, scrubToken,
} from './DocumentRouteBoundary';

const CHUNK_MESSAGES = [
  'Failed to fetch dynamically imported module: https://cogniiq.de/assets/PublicDocumentPortal-abc123.js',
  'error loading dynamically imported module',
  'Importing a module script failed.',
  'ChunkLoadError: Loading chunk 42 failed.',
];

function Boom({ message }: { message: string }): never {
  throw new Error(message);
}

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => { consoleError = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { consoleError.mockRestore(); });

describe('classifying a failed chunk', () => {
  for (const message of CHUNK_MESSAGES) {
    it(`recognises: ${message.slice(0, 42)}`, () => {
      expect(isChunkLoadError(new Error(message))).toBe(true);
    });
  }

  it('does not misclassify an ordinary runtime error as a stale chunk', () => {
    expect(isChunkLoadError(new TypeError("Cannot read properties of null (reading 'lines')"))).toBe(false);
  });

  it('tolerates a non-Error throw', () => {
    expect(isChunkLoadError('boom')).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});

describe('the token never reaches the console', () => {
  const TOKEN = 'a'.repeat(48);

  it('scrubs the token out of a URL', () => {
    expect(scrubToken(`https://cogniiq.de/d/${TOKEN}`)).toBe('https://cogniiq.de/d/[token]');
    expect(scrubToken(`https://cogniiq.de/d/${TOKEN}`)).not.toContain(TOKEN);
  });

  it('scrubs every occurrence in a longer stack', () => {
    const stack = `at PublicDocumentPortal (https://cogniiq.de/d/${TOKEN})\nat Lazy (https://cogniiq.de/d/${TOKEN})`;
    expect(scrubToken(stack)).not.toContain(TOKEN);
  });

  it('logs a caught error without the token', () => {
    render(
      <DocumentRouteBoundary>
        <Boom message={`Failed to fetch dynamically imported module: https://cogniiq.de/d/${TOKEN}`} />
      </DocumentRouteBoundary>,
    );
    // Scoped to OUR log line. React itself also console.errors the raw error, which we cannot
    // intercept — which is exactly why the boundary must not add the token a second time, and
    // why nothing here is ever sent anywhere off-device.
    const ourCall = consoleError.mock.calls.find((args) => String(args[0]).includes('[DocumentRoute]'));
    expect(ourCall).toBeTruthy();
    expect(ourCall!.join(' ')).not.toContain(TOKEN);
    expect(ourCall!.join(' ')).toContain('/d/[token]');
  });
});

describe('a failed chunk shows a recovery screen, never a blank page', () => {
  it('renders the stale-version recovery screen', () => {
    render(
      <DocumentRouteBoundary>
        <Boom message="Failed to fetch dynamically imported module: /assets/PublicDocumentPortal-abc.js" />
      </DocumentRouteBoundary>,
    );
    expect(screen.getByRole('heading', { name: 'Neue Version verfügbar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Erneut laden' })).toBeTruthy();
  });

  it('renders a generic recovery screen for a non-chunk runtime error', () => {
    render(
      <DocumentRouteBoundary>
        <Boom message="Cannot read properties of undefined" />
      </DocumentRouteBoundary>,
    );
    expect(screen.getByRole('heading', { name: 'Anzeige unterbrochen' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Erneut laden' })).toBeTruthy();
  });

  it('renders something — the whole point is that the page is never empty', () => {
    const { container } = render(
      <DocumentRouteBoundary>
        <Boom message="Failed to fetch dynamically imported module" />
      </DocumentRouteBoundary>,
    );
    expect((container.textContent ?? '').trim().length).toBeGreaterThan(0);
  });

  it('does NOT reload automatically — an unavailable chunk would reload-loop', () => {
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true, value: { ...original, reload },
    });
    try {
      render(
        <DocumentRouteBoundary>
          <Boom message="Failed to fetch dynamically imported module" />
        </DocumentRouteBoundary>,
      );
      expect(reload).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });

  it('passes healthy children straight through', () => {
    render(<DocumentRouteBoundary><p>Ihr Angebot</p></DocumentRouteBoundary>);
    expect(screen.getByText('Ihr Angebot')).toBeTruthy();
  });
});

describe('the document route has a visible loading state', () => {
  it('renders a non-empty skeleton rather than null', () => {
    const { container } = render(<DocumentRouteFallback />);
    expect(container.querySelector('[role="status"]')).toBeTruthy();
    expect((container.textContent ?? '').trim().length).toBeGreaterThan(0);
    expect(container.innerHTML.length).toBeGreaterThan(100);
  });
});
