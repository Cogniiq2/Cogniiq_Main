import { describe, expect, it } from 'vitest';

import { BLOG_ARTICLES } from './blog-data';
import { isProtectedExperiment } from './routing/protectedExperiments';
import { routeFor } from './routing/publicRoutes';

/**
 * The blog is the only informational surface on the site. Its articles used to
 * be dead ends: no contextual link to any service page, so neither link equity
 * nor readers reached the pages that generate enquiries. Every article now
 * declares the service pages that follow from it. These checks keep those links
 * valid and keep them away from the frozen search experiments, whose inbound
 * link topology must not change while they are being measured.
 */
describe('blog service links', () => {
  it('every article links to at least one service page', () => {
    for (const article of BLOG_ARTICLES) {
      expect(article.serviceLinks.length, article.slug).toBeGreaterThan(0);
    }
  });

  it('every link targets an indexable route from the manifest', () => {
    for (const article of BLOG_ARTICLES) {
      for (const link of article.serviceLinks) {
        const route = routeFor(link.href);
        expect(route, `${article.slug} -> ${link.href} is not a manifest route`).toBeDefined();
        expect(route?.indexable, `${article.slug} -> ${link.href} is noindex`).toBe(true);
        expect(link.href.startsWith('/blog'), `${article.slug} -> ${link.href} is not a service page`).toBe(false);
      }
    }
  });

  it('never links into a frozen search experiment', () => {
    for (const article of BLOG_ARTICLES) {
      for (const link of article.serviceLinks) {
        expect(isProtectedExperiment(link.href), `${article.slug} -> ${link.href}`).toBe(false);
      }
    }
  });

  it('uses descriptive anchor text and a note on every link', () => {
    for (const article of BLOG_ARTICLES) {
      const hrefs = article.serviceLinks.map((l) => l.href);
      expect(new Set(hrefs).size, `${article.slug} repeats a target`).toBe(hrefs.length);
      for (const link of article.serviceLinks) {
        expect(link.label.trim().length, `${article.slug} -> ${link.href} label`).toBeGreaterThan(3);
        expect(link.note.trim().length, `${article.slug} -> ${link.href} note`).toBeGreaterThan(20);
        expect(/^(hier|mehr|klicken)/i.test(link.label.trim()), `${article.slug} generic anchor`).toBe(false);
      }
    }
  });
});

/**
 * The Article JSON-LD (datePublished/dateModified) and the sitemap <lastmod>
 * are two freshness claims about the same document. They used to disagree by
 * more than a year (schema said 2025-03, sitemap said 2026-07). A crawler that
 * sees two dates trusts neither.
 */
describe('blog article dates', () => {
  it('dateModified is never before datePublished', () => {
    for (const article of BLOG_ARTICLES) {
      expect(article.updatedAt >= article.publishedAt, article.slug).toBe(true);
    }
  });

  it('sitemap lastmod equals the article dateModified', () => {
    for (const article of BLOG_ARTICLES) {
      const route = routeFor(`/blog/${article.slug}`);
      expect(route?.sitemap?.lastmod, article.slug).toBe(article.updatedAt);
    }
  });

  it('titles do not carry a stale year', () => {
    const currentYear = new Date().getFullYear();
    for (const article of BLOG_ARTICLES) {
      const route = routeFor(`/blog/${article.slug}`);
      for (const text of [article.title, article.metaTitle, route?.title ?? '']) {
        const years = text.match(/\b20\d\d\b/g) ?? [];
        for (const year of years) {
          expect(Number(year) >= currentYear, `${article.slug}: "${text}" names ${year}`).toBe(true);
        }
      }
    }
  });
});
