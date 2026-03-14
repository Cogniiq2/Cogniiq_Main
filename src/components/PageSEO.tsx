import { useEffect } from "react";
import { BUSINESS_INFO } from "@/lib/seo-data";

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

function injectScript(id: string, content: string) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = content;
}

function removeScript(id: string) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

export function PageSEO({
  title,
  description,
  canonical,
  breadcrumbs,
  faqItems,
  ogImage = `${BUSINESS_INFO.website}/og-image.jpg`,
  additionalSchema,
  noIndex = false,
}: PageSEOProps) {
  useEffect(() => {
    document.title = title;

    setMeta("description", description);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");

    setLink("canonical", canonical);

    setLink("alternate", canonical, { hreflang: "de-DE" });
    setLink("alternate", canonical, { hreflang: "x-default" });

    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonical, "property");
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
    setMeta("twitter:url", canonical, "name");
    setMeta("twitter:image", ogImage, "name");
    setMeta("twitter:image:alt", title, "name");

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
      breadcrumb: breadcrumbs && breadcrumbs.length > 0
        ? {
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbs.map((crumb, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: crumb.name,
              item: crumb.url,
            })),
          }
        : undefined,
      inLanguage: "de-DE",
    };
    injectScript("page-webpage-schema", JSON.stringify(webPageSchema));

    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      };
      injectScript("page-breadcrumb-schema", JSON.stringify(breadcrumbSchema));
    } else {
      removeScript("page-breadcrumb-schema");
    }

    if (faqItems && faqItems.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      };
      injectScript("page-faq-schema", JSON.stringify(faqSchema));
    } else {
      removeScript("page-faq-schema");
    }

    if (additionalSchema) {
      injectScript("page-additional-schema", JSON.stringify(additionalSchema));
    } else {
      removeScript("page-additional-schema");
    }

    return () => {
      removeScript("page-webpage-schema");
      removeScript("page-breadcrumb-schema");
      removeScript("page-faq-schema");
      removeScript("page-additional-schema");
    };
  }, [title, description, canonical, breadcrumbs, faqItems, ogImage, additionalSchema, noIndex]);

  return null;
}
