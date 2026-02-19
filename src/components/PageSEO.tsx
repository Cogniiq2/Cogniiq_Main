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

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
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
}: PageSEOProps) {
  useEffect(() => {
    document.title = title;

    setMeta("description", description);
    setLink("canonical", canonical);

    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:image", ogImage, "property");

    setMeta("twitter:title", title, "name");
    setMeta("twitter:description", description, "name");
    setMeta("twitter:url", canonical, "name");
    setMeta("twitter:image", ogImage, "name");

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
      removeScript("page-breadcrumb-schema");
      removeScript("page-faq-schema");
      removeScript("page-additional-schema");
    };
  }, [title, description, canonical, breadcrumbs, faqItems, ogImage, additionalSchema]);

  return null;
}
