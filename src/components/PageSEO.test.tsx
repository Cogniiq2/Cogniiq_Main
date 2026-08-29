import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageSEO } from './PageSEO';
import { PUBLIC_ROUTES, SITE_ORIGIN } from '@/lib/routing/publicRoutes';

const route = PUBLIC_ROUTES.find((r) => r.path === '/kontakt')!;
const canonical = `${SITE_ORIGIN}/kontakt`;

const webPageNode = (container: HTMLElement | Document) => {
  const el = (container as Document).getElementById
    ? (container as Document).getElementById('page-webpage-schema')
    : null;
  return JSON.parse((el ?? document.getElementById('page-webpage-schema'))!.textContent!);
};

describe('PageSEO metadata resolution', () => {
  // This is the property that makes drift impossible rather than merely detected:
  // for a route the manifest knows about, whatever the component passes is inert.
  // Before this, /kontakt was served as "Kostenloses Erstgespräch vereinbaren…"
  // and hydrated as "KI Beratung & Kontakt…" — two different pages to a crawler.
  it('ignores component props and uses the manifest for a known route', () => {
    render(
      <PageSEO
        title="EIN VÖLLIG ANDERER TITEL"
        description="Eine völlig andere Beschreibung."
        canonical={canonical}
      />
    );

    expect(document.title).toBe(route.title);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      route.description
    );
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      route.title
    );
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe(
      route.title
    );

    const node = webPageNode(document);
    expect(node.name).toBe(route.title);
    expect(node.description).toBe(route.description);
  });

  it('derives robots from the manifest, not from the noIndex prop, for a known route', () => {
    render(<PageSEO title="t" description="d" canonical={canonical} noIndex />);
    // /kontakt is indexable in the manifest, so a stray noIndex prop must not
    // be able to deindex it from the client after the crawler saw index,follow.
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain(
      'index, follow'
    );
  });

  it('honours a manifest route that is deliberately noindex', () => {
    const hidden = PUBLIC_ROUTES.find((r) => !r.indexable)!;
    render(<PageSEO title="t" description="d" canonical={`${SITE_ORIGIN}${hidden.path}`} />);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow'
    );
  });

  it('falls back to the component props when the URL has no manifest entry', () => {
    render(
      <PageSEO
        title="Seite nicht gefunden (404) | Cogniiq"
        description="Diese Seite existiert nicht."
        canonical="about:blank"
        noCanonical
      />
    );
    expect(document.title).toBe('Seite nicht gefunden (404) | Cogniiq');
    expect(webPageNode(document).name).toBe('Seite nicht gefunden (404) | Cogniiq');
  });
});
