import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BUSINESS_INFO } from "@/lib/seo-data";

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
    const canonical = buildCanonical(pathname);

    let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      document.head.appendChild(el);
    }
    el.setAttribute("href", canonical);
  }, [pathname]);

  return null;
}
