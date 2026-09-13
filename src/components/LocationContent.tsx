import { MapPin, Users, Building2, Zap, Clock, Phone, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { BUSINESS_INFO, PHONE_HREF, getGoogleMapsUrl } from "@/lib/seo-data";
import { ConsentMapEmbed } from "@/components/ConsentMapEmbed";

const SERVICE_CITIES: Array<{ label: string; href: string }> = [
  { label: "Bayreuth", href: "/bayreuth" },
  { label: "München", href: "/muenchen" },
  { label: "Regensburg", href: "/regensburg" },
  { label: "Nürnberg", href: "#" },
  { label: "Bamberg", href: "#" },
  { label: "Würzburg", href: "#" },
  { label: "Erlangen", href: "#" },
  { label: "Fürth", href: "#" },
  { label: "Ingolstadt", href: "#" },
  { label: "Augsburg", href: "#" },
];

const BAYREUTH_SERVICES = [
  { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
  { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
  { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
];

const BAYERN_SERVICES = [
  { label: "Webdesign München", href: "/muenchen/webdesign" },
  { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
  { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
  { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
  { label: "Automatisierung München", href: "/muenchen/automatisierung" },
  { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
];

const DEUTSCHLAND_SERVICES = [
  { label: "Webdesign Deutschland", href: "/deutschland" },
  { label: "KI-Telefonassistent Deutschland", href: "/deutschland" },
  { label: "Automatisierung Deutschland", href: "/deutschland" },
];

const LOKAL_LINKS = [
  { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
  { label: "Webdesign München", href: "/muenchen/webdesign" },
  { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
  { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
  { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
  { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
  { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
  { label: "Automatisierung München", href: "/muenchen/automatisierung" },
  { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
];

function InternalLink({ href, label }: { href: string; label: string }) {
  const isExternal = href === "#";
  if (isExternal) {
    return <span className="font-medium text-pub-ink-2 dark:text-gray-300">{label}</span>;
  }
  return (
    <Link
      to={href}
      className="font-medium text-pub-ink underline decoration-pub-hairline underline-offset-2 transition-colors hover:decoration-pub-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 dark:text-gray-200"
    >
      {label}
    </Link>
  );
}

export function LocationContent() {
  return (
    <section
      id="standort"
      aria-labelledby="location-heading"
      className="border-t border-pub-hairline-soft bg-white py-16 dark:bg-gray-950 lg:py-20"
      itemScope
      itemType="https://schema.org/LocalBusiness"
    >
      <meta itemProp="name" content={BUSINESS_INFO.name} />
      <meta itemProp="telephone" content={BUSINESS_INFO.contact.phone} />
      <meta itemProp="email" content={BUSINESS_INFO.contact.email} />
      <meta itemProp="url" content={BUSINESS_INFO.website} />
      <div
        itemProp="address"
        itemScope
        itemType="https://schema.org/PostalAddress"
        className="hidden"
      >
        <span itemProp="streetAddress">{BUSINESS_INFO.address.streetAddress}</span>
        <span itemProp="addressLocality">{BUSINESS_INFO.address.addressLocality}</span>
        <span itemProp="addressRegion">{BUSINESS_INFO.address.addressRegion}</span>
        <span itemProp="postalCode">{BUSINESS_INFO.address.postalCode}</span>
        <span itemProp="addressCountry">{BUSINESS_INFO.address.addressCountry}</span>
      </div>
      <div
        itemProp="geo"
        itemScope
        itemType="https://schema.org/GeoCoordinates"
        className="hidden"
      >
        <meta itemProp="latitude" content={BUSINESS_INFO.geo.latitude} />
        <meta itemProp="longitude" content={BUSINESS_INFO.geo.longitude} />
      </div>

      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <div
          className="mb-10 max-w-3xl"
        >
          <h2
            id="location-heading"
            className="mb-4 text-[clamp(26px,2.6vw,34px)] font-bold leading-[1.15] tracking-[-0.018em] text-gray-900 dark:text-gray-100"
          >
            Ihre AI &amp; Webdesign Agentur in{" "}
            <span className="text-pub-ink-3">Bayreuth</span>
          </h2>
          <p className="text-[16.5px] leading-[1.6] text-pub-ink-2 dark:text-gray-400">
            Als AI- und Webdesign-Agentur in Bayreuth entwickelt Cogniiq Websites,{" "}
            <InternalLink href="/bayreuth/ki-telefonassistent" label="KI-Telefonassistenten" />{" "}
            und{" "}
            <InternalLink href="/bayreuth/automatisierung" label="Automatisierungssysteme" />{" "}
            für Unternehmen jeder Größe. Unsere Lösungen verbinden{" "}
            <InternalLink href="/bayreuth/webdesign" label="Webdesign Bayreuth" />,
            künstliche Intelligenz und Prozessautomatisierung zu einem durchgängigen digitalen Vertriebssystem.
          </p>
        </div>

        <div className="mb-10 grid gap-x-10 gap-y-8 border-y border-pub-hairline-soft py-8 md:grid-cols-3">
          <div
            className="relative"
          >
            <span className="absolute right-0 top-0 rounded-full border border-pub-hairline px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-pub-ink-3">
              Hauptsitz
            </span>
            <MapPin size={20} className="mb-3 text-pub-ink-3" aria-hidden="true" />
            <h3 className="mb-2 text-[19px] font-semibold text-pub-ink dark:text-gray-100">Bayreuth</h3>
            <p className="mb-4 text-[15px] leading-[1.6] text-pub-ink-2 dark:text-gray-400">
              Unser Hauptsitz im Herzen von Bayreuth. Persönliche Beratung vor Ort jederzeit möglich.
            </p>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-pub-ink-3">
              Leistungen in Bayreuth
            </p>
            <ul className="space-y-1.5">
              {BAYREUTH_SERVICES.map((s) => (
                <li key={s.href}>
                  <Link
                    to={s.href}
                    className="text-[14.5px] text-pub-ink-2 underline decoration-pub-hairline underline-offset-2 transition-colors hover:text-pub-ink hover:decoration-pub-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 dark:text-gray-400"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="relative"
          >
            <Building2 size={20} className="mb-3 text-pub-ink-3" aria-hidden="true" />
            <h3 className="mb-2 text-[19px] font-semibold text-pub-ink dark:text-gray-100">Bayern</h3>
            <p className="mb-4 text-[15px] leading-[1.6] text-pub-ink-2 dark:text-gray-400">
              Wir betreuen Unternehmen in ganz Bayern – von München bis Nürnberg, von Augsburg bis Regensburg.
            </p>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-pub-ink-3">
              Leistungen in Bayern
            </p>
            <ul className="space-y-1.5">
              {BAYERN_SERVICES.map((s) => (
                <li key={s.href}>
                  <Link
                    to={s.href}
                    className="text-[14.5px] text-pub-ink-2 underline decoration-pub-hairline underline-offset-2 transition-colors hover:text-pub-ink hover:decoration-pub-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 dark:text-gray-400"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="relative"
          >
            <Users size={20} className="mb-3 text-pub-ink-3" aria-hidden="true" />
            <h3 className="mb-2 text-[19px] font-semibold text-pub-ink dark:text-gray-100">Deutschland</h3>
            <p className="mb-4 text-[15px] leading-[1.6] text-pub-ink-2 dark:text-gray-400">
              Remote-Zusammenarbeit mit Kunden in ganz Deutschland und darüber hinaus.
            </p>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-pub-ink-3">
              Digitale Leistungen
            </p>
            <ul className="space-y-1.5">
              {DEUTSCHLAND_SERVICES.map((s) => (
                <li key={s.label}>
                  <Link
                    to={s.href}
                    className="text-[14.5px] text-pub-ink-2 underline decoration-pub-hairline underline-offset-2 transition-colors hover:text-pub-ink hover:decoration-pub-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 dark:text-gray-400"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="rounded-2xl border border-pub-hairline bg-white p-6 dark:bg-gray-900/40 sm:p-8"
        >
          <div className="grid items-start gap-10 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={20} className="text-pub-ink-3" aria-hidden="true" />
                <h3 className="text-[21px] font-semibold tracking-[-0.012em] text-pub-ink dark:text-gray-100">
                  Lokal verwurzelt, digital vernetzt
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
                Als <strong className="text-gray-800 dark:text-gray-200">AI- und Webdesign-Agentur in Bayreuth</strong> verstehen
                wir die Anforderungen lokaler Unternehmen. Gleichzeitig betreuen wir Kunden in{" "}
                <Link to="/muenchen" className="font-medium text-pub-ink underline decoration-pub-hairline underline-offset-2 hover:decoration-pub-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 dark:text-gray-200">München</Link>{" "}
                und{" "}
                <Link to="/regensburg" className="font-medium text-pub-ink underline decoration-pub-hairline underline-offset-2 hover:decoration-pub-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 dark:text-gray-200">Regensburg</Link>{" "}
                mit denselben hochwertigen Systemen.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
                In Regensburg lassen sich{" "}
                <Link
                  to="/regensburg/website-relaunch"
                  className="font-medium text-pub-ink underline decoration-pub-hairline underline-offset-2 hover:decoration-pub-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 dark:text-gray-200"
                >
                  bestehende Websites modernisieren
                </Link>{" "}
                – mit sauberer SEO-Migration, ohne bestehende Rankings zu verlieren.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Unsere Kernleistungen stehen für alle drei Standorte zur Verfügung:
              </p>

              <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {LOKAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-[14.5px] font-medium text-pub-ink-2 underline decoration-pub-hairline underline-offset-2 transition-colors hover:text-pub-ink hover:decoration-pub-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 dark:text-gray-400"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-pub-ink-2 transition-colors hover:text-pub-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 dark:text-gray-400"
                  aria-label={`Cogniiq auf Google Maps öffnen: ${BUSINESS_INFO.address.streetAddress}, ${BUSINESS_INFO.address.postalCode} ${BUSINESS_INFO.address.addressLocality}`}
                >
                  <MapPin size={16} />
                  <span>
                    {BUSINESS_INFO.address.streetAddress},{" "}
                    {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.addressLocality}
                  </span>
                </a>

                <a
                  href={PHONE_HREF}
                  className="flex items-center gap-2 text-pub-ink-2 transition-colors hover:text-pub-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 dark:text-gray-400"
                  aria-label={`Cogniiq anrufen: ${BUSINESS_INFO.contact.phoneDisplay}`}
                >
                  <Phone size={16} />
                  <span>{BUSINESS_INFO.contact.phoneDisplay}</span>
                </a>

                <div className="flex items-center gap-2 text-[14.5px] text-pub-ink-3">
                  <Clock size={15} />
                  <span>
                    Mo–Fr {BUSINESS_INFO.businessHours.opens} – {BUSINESS_INFO.businessHours.closes}&nbsp;Uhr
                  </span>
                </div>
              </div>

              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-pub-ink/20 bg-white px-5 text-[14.5px] font-semibold text-pub-ink transition-colors hover:border-pub-ink/45 hover:bg-pub-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-transparent dark:text-gray-200"
              >
                <ExternalLink size={15} />
                In Google Maps öffnen
              </a>
            </div>

            <ConsentMapEmbed minHeight={340} />
          </div>
        </div>

        <div
          className="mt-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-pub-ink-3 dark:text-gray-500 text-center mb-4">
            Servicegebiete
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SERVICE_CITIES.map((city) => (
              city.href === "#" ? (
                <span
                  key={city.label}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-full transition-colors duration-300"
                  itemProp="areaServed"
                >
                  {city.label}
                </span>
              ) : (
                <Link
                  key={city.label}
                  to={city.href}
                  className="rounded-full border border-pub-hairline bg-white px-3 py-1 text-[14px] font-medium text-pub-ink-2 transition-colors hover:border-pub-ink/40 hover:text-pub-ink dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  itemProp="areaServed"
                >
                  {city.label}
                </Link>
              )
            ))}
            <span className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500 rounded-full italic transition-colors duration-300">
              &amp; ganz Deutschland
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
