import { useState } from "react";
import { Mail, Phone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo"; // ← IMPORTANT

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [openPanel, setOpenPanel] = useState<"impressum" | "datenschutz" | null>(null);

  return (
    <>
      {/* ====== FOOTER ====== */}
      <footer className="bg-gray-50 border-t border-gray-200 py-16" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">

            {/* LEFT */}
            <div>
              <div className="mb-4">
                <Logo className="h-10" />
              </div>

              <p className="text-gray-600 leading-relaxed">
                <strong>AI Agentur und Webdesign Agentur in Bayreuth.</strong>{" "}
                Wir bieten KI Automationen, AI Rezeptionisten und
                hochkonvertierende Websites für Unternehmen in ganz Deutschland.
              </p>
            </div>

            {/* CONTACT */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Kontakt</h4>
              <div className="space-y-3 text-gray-600">
                <address className="not-italic">
                  <div className="flex items-center">
                    <Logo className="h-6" />
                  </div>
                  <br />
                  Lazar & Djordje Popovic<br />
                  Am Main Straße 3<br />
                  95444 Bayreuth, Deutschland
                </address>

                <a
                  href="mailto:info@cogniiq.de"
                  className="flex items-center gap-2 text-[#515A61] hover:text-[#434A51] transition-colors"
                >
                  <Mail size={16} /> info@cogniiq.de
                </a>

                <a
                  href="tel:01601832917"
                  className="flex items-center gap-2 text-[#515A61] hover:text-[#434A51] transition-colors"
                >
                  <Phone size={16} /> 0160 1832917
                </a>
              </div>
            </div>

            {/* LINKS */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Links</h4>
              <div className="space-y-2 text-gray-600">
                <button
                  onClick={() => setOpenPanel("impressum")}
                  className="block hover:text-gray-900 transition-colors text-left w-full"
                >
                  Impressum
                </button>

                <button
                  onClick={() => setOpenPanel("datenschutz")}
                  className="block hover:text-gray-900 transition-colors text-left w-full"
                >
                  Datenschutz
                </button>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © {currentYear} <Logo className="inline-block h-4 align-text-bottom" />. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>

      {/* PANEL (UNCHANGED) */}
      <AnimatePresence>{/* ... unchanged ... */}</AnimatePresence>
    </>
  );
}
