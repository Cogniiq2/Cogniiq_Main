import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { shouldSuppressCanonical } from "@/lib/routing/indexability";
import { isKnownPublicRoute } from "@/lib/routing/publicRoutes";

const BASE_URL = BUSINESS_INFO.website.replace(/\/$/, "");

function buildCanonical(pathname: string): string {
  if (pathname === "/" || pathname === "") {
    return `${BASE_URL}/`;
  }
  return `${BASE_URL}${pathname.replace(/\/+$/, "")}`;
}

export function CanonicalManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const existing = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    // Surfaces reachable only through a token (/d/:token) or a one-time email link (/auth/*) have
    // no public address: they must never advertise a canonical marketing URL. Remove any existing
    // canonical link while there.
    //
    // An UNKNOWN url has no public address either — Netlify answers it with the 404 document, so
    // claiming a canonical would invite indexing of a page that does not exist. The hreflang and
    // og:url claims that accompany a canonical are removed with it, because a crawler that runs
    // JavaScript sees the post-hydration head, not just the served one.
    if (shouldSuppressCanonical(pathname) || !isKnownPublicRoute(pathname)) {
      if (existing) existing.remove();
      document
        .querySelectorAll('link[rel="alternate"][hreflang]')
        .forEach((el) => el.remove());
      document
        .querySelectorAll('meta[property="og:url"], meta[name="twitter:url"]')
        .forEach((el) => el.remove());
      return;
    }

    const canonical = buildCanonical(pathname);
    let el = existing;
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      document.head.appendChild(el);
    }
    el.setAttribute("href", canonical);
  }, [pathname]);

  return null;
}
