import { useEffect } from "react";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { routeMetadataForCanonical } from "@/lib/routing/routeMetadata";

interface FaqItem {
  question: string;
  answer: string;
}

interface PageSEOProps {
  title: string;
  description: string;
  canonical: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  faqItems?: FaqItem[];
  ogImage?: string;
  additionalSchema?: object;
  noIndex?: boolean;
  /**
   * The page has no public address of its own — the 404 document is the case
   * that matters: one file answers every unknown URL, so any canonical it
   * emitted would be a claim about a page that does not exist. Suppresses the
   * canonical, the hreflang alternates and the og:/twitter: URL claims, and
   * removes them if an earlier page left them behind.
   */
  noCanonical?: boolean;
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string, extra?: Record<string, string>) {
  const selector = extra
    ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
    }
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function removeElements(selector: string) {
  document.querySelectorAll(selector).forEach((el) => el.remove());
}

/**
 * JSON-LD als echtes Element im Komponentenbaum.
 *
 * Vorher wurden diese Blöcke in einem `useEffect` in den `<head>` geschrieben.
 * `useEffect` läuft im SSR nicht, deshalb fehlte sämtliches Seiten-Schema im
 * vorgerenderten HTML und entstand erst nach der Hydration (HONESTY-AUDIT §7.5).
 * Als JSX-Element rendert `react-dom/server` es mit, und React verwaltet
 * Einfügen, Aktualisieren und Entfernen bei Navigation selbst — es gibt also
 * genau eine Instanz je Block, nicht zusätzlich eine per Effekt.
 *
 * `<` wird escaped, damit ein `</script>` in einem Copy-String das Element
 * nicht vorzeitig beendet. JSON-LD ist laut Google an beliebiger Stelle im
 * Dokument gültig, auch außerhalb des `<head>`.
 */
function JsonLd({ id, data }: { id: string; data: object }) {
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function PageSEO({
  title: titleProp,
  description: descriptionProp,
  canonical,
  breadcrumbs,
  faqItems,
  ogImage = `${BUSINESS_INFO.website}/og-image.png`,
  additionalSchema,
  noIndex = false,
  noCanonical = false,
}: PageSEOProps) {
  // PUBLIC_ROUTES is the single source for a route's identity, on both sides of
  // the build: scripts/prerender.mjs writes these exact strings into the crawled
  // <head>, and resolving them here means the hydrated head, the OG/Twitter tags
  // and the WebPage JSON-LD are the same strings rather than a second opinion.
  // See src/lib/routing/routeMetadata.ts for why the manifest wins over the props.
  //
  // noCanonical marks a document with no canonical address of its own (the 404,
  // which answers every unknown URL), so there is nothing to resolve against and
  // the caller's own values stand.
  const routeMetadata = noCanonical ? undefined : routeMetadataForCanonical(canonical);
  const title = routeMetadata?.title ?? titleProp;
  const description = routeMetadata?.description ?? descriptionProp;
  const isNoIndex = routeMetadata ? !routeMetadata.indexable : noIndex;

  useEffect(() => {
    document.title = title;

    setMeta("description", description);
    setMeta("robots", isNoIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");

    if (noCanonical) {
      removeElements('link[rel="canonical"]');
      removeElements('link[rel="alternate"][hreflang]');
      removeElements('meta[property="og:url"]');
      removeElements('meta[name="twitter:url"]');
    } else {
      setLink("canonical", canonical);
      setLink("alternate", canonical, { hreflang: "de-DE" });
      setLink("alternate", canonical, { hreflang: "x-default" });
    }

    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    if (!noCanonical) setMeta("og:url", canonical, "property");
    setMeta("og:image", ogImage, "property");
    setMeta("og:image:width", "1200", "property");
    setMeta("og:image:height", "630", "property");
    setMeta("og:image:alt", title, "property");
    setMeta("og:locale", "de_DE", "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", BUSINESS_INFO.name, "property");

    setMeta("twitter:card", "summary_large_image", "name");
    setMeta("twitter:title", title, "name");
    setMeta("twitter:description", description, "name");
    if (!noCanonical) setMeta("twitter:url", canonical, "name");
    setMeta("twitter:image", ogImage, "name");
    setMeta("twitter:image:alt", title, "name");

  }, [title, description, canonical, ogImage, isNoIndex, noCanonical]);

  const breadcrumbList =
    breadcrumbs && breadcrumbs.length > 0
      ? {
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: crumb.url,
          })),
        }
      : undefined;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BUSINESS_INFO.website}/#website`,
      url: BUSINESS_INFO.website,
      name: BUSINESS_INFO.name,
      publisher: {
        "@type": "Organization",
        "@id": `${BUSINESS_INFO.website}/#organization`,
        name: BUSINESS_INFO.name,
      },
    },
    ...(breadcrumbList ? { breadcrumb: breadcrumbList } : {}),
    inLanguage: "de-DE",
  };

  return (
    <>
      <JsonLd id="page-webpage-schema" data={webPageSchema} />
      {breadcrumbList && (
        <JsonLd
          id="page-breadcrumb-schema"
          data={{ "@context": "https://schema.org", ...breadcrumbList }}
        />
      )}
      {faqItems && faqItems.length > 0 && (
        <JsonLd
          id="page-faq-schema"
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
      )}
      {additionalSchema && <JsonLd id="page-additional-schema" data={additionalSchema} />}
    </>
  );
}
