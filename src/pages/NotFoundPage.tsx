import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Chrome as Home, Search } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";

const suggestions = [
  { label: "Leistungen", href: "/leistungen" },
  { label: "KI-Telefonassistent", href: "/ki-telefonassistent" },
  { label: "Webdesign Agentur", href: "/webdesign-agentur-deutschland" },
  { label: "Über uns", href: "/ueber-uns" },
  { label: "Kontakt", href: "/kontakt" },
];

export function NotFoundPage() {
  // The requested path is shown only AFTER mount, never in the initial markup.
  // dist/404.html is one prerendered document that Netlify serves for every
  // unknown URL, so anything URL-specific baked into it would be wrong for
  // almost every visitor — and would disagree with what the browser renders,
  // which is a hydration mismatch (React #425) on every 404.
  const [requestedPath, setRequestedPath] = useState("");

  useEffect(() => {
    setRequestedPath(window.location.pathname);
  }, []);

  return (
    <>
      <PageSEO
        title="Seite nicht gefunden (404) | Cogniiq"
        description="Diese Seite existiert nicht. Die URL wurde möglicherweise geändert oder entfernt. Zurück zur Startseite oder direkt zu unseren Leistungen."
        // A 404 is served under countless URLs and none of them is a page. It
        // must claim no canonical, no hreflang and no og:url — before or after
        // hydration, because search engines run JavaScript.
        canonical=""
        noIndex
        noCanonical
      />

      <main className="min-h-screen flex items-center justify-center px-6 py-32">
        <div className="max-w-xl w-full text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] mb-8">
              <Search size={13} className="text-gray-400 dark:text-gray-600" />
              <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400 tracking-wide font-mono">
                {requestedPath || "404"}
              </span>
            </div>

            <h1 className="text-[80px] font-bold leading-none tracking-tight text-gray-900 dark:text-white mb-4">
              404
            </h1>

            <p className="text-[18px] font-medium text-gray-700 dark:text-gray-300 mb-3">
              Diese Seite existiert nicht.
            </p>

            <p className="text-[15px] text-gray-500 dark:text-gray-500 leading-relaxed mb-10">
              Die URL wurde möglicherweise geändert oder entfernt.
              Versuchen Sie eine der Seiten unten.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {suggestions.map((s) => (
                <Link
                  key={s.href}
                  to={s.href}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
                >
                  {s.label}
                  <ArrowRight size={12} />
                </Link>
              ))}
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-[14px] font-semibold rounded-full hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all"
            >
              <Home size={15} />
              Zur Startseite
            </Link>
          </motion.div>

        </div>
      </main>
    </>
  );
}
