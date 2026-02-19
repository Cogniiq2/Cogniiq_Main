import { Mail, Phone, MapPin } from "lucide-react";
import { BUSINESS_INFO, formatAddress, getGoogleMapsUrl } from "@/lib/seo-data";

interface NAPProps {
  variant?: "vertical" | "horizontal" | "compact";
  showIcons?: boolean;
  className?: string;
  itemClassName?: string;
}

export function NAP({
  variant = "vertical",
  showIcons = true,
  className = "",
  itemClassName = ""
}: NAPProps) {
  const isVertical = variant === "vertical";
  const isCompact = variant === "compact";

  const containerClass = isVertical
    ? "space-y-3"
    : isCompact
    ? "inline-flex gap-4 flex-wrap"
    : "flex gap-6 flex-wrap";

  const linkClass = `flex items-start gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${itemClassName}`;

  return (
    <div
      className={`${containerClass} ${className}`}
      itemScope
      itemType="https://schema.org/LocalBusiness"
    >
      <meta itemProp="name" content={BUSINESS_INFO.name} />

      <address className={`not-italic ${itemClassName}`}>
        <a
          href={getGoogleMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          itemProp="address"
          itemScope
          itemType="https://schema.org/PostalAddress"
          aria-label={`Adresse: ${formatAddress(true)}`}
        >
          {showIcons && <MapPin size={16} className="mt-0.5 flex-shrink-0" />}
          <span>
            <span itemProp="streetAddress">{BUSINESS_INFO.address.streetAddress}</span>
            <br />
            <span itemProp="postalCode">{BUSINESS_INFO.address.postalCode}</span>{" "}
            <span itemProp="addressLocality">{BUSINESS_INFO.address.addressLocality}</span>
            {!isCompact && (
              <>
                <br />
                <span itemProp="addressCountry">Deutschland</span>
              </>
            )}
          </span>
        </a>
      </address>

      <a
        href={`mailto:${BUSINESS_INFO.contact.email}`}
        className={linkClass}
        itemProp="email"
        aria-label={`E-Mail: ${BUSINESS_INFO.contact.email}`}
      >
        {showIcons && <Mail size={16} className="mt-0.5 flex-shrink-0" />}
        <span>{BUSINESS_INFO.contact.email}</span>
      </a>

      <a
        href={`tel:${BUSINESS_INFO.contact.phone}`}
        className={linkClass}
        itemProp="telephone"
        aria-label={`Telefon: ${BUSINESS_INFO.contact.phoneDisplay}`}
      >
        {showIcons && <Phone size={16} className="mt-0.5 flex-shrink-0" />}
        <span>{BUSINESS_INFO.contact.phoneDisplay}</span>
      </a>
    </div>
  );
}

export function NAPSchema() {
  return (
    <div itemScope itemType="https://schema.org/LocalBusiness" className="hidden" aria-hidden="true">
      <span itemProp="name">{BUSINESS_INFO.name}</span>
      <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
        <span itemProp="streetAddress">{BUSINESS_INFO.address.streetAddress}</span>
        <span itemProp="addressLocality">{BUSINESS_INFO.address.addressLocality}</span>
        <span itemProp="addressRegion">{BUSINESS_INFO.address.addressRegion}</span>
        <span itemProp="postalCode">{BUSINESS_INFO.address.postalCode}</span>
        <span itemProp="addressCountry">{BUSINESS_INFO.address.addressCountry}</span>
      </div>
      <span itemProp="telephone">{BUSINESS_INFO.contact.phone}</span>
      <span itemProp="email">{BUSINESS_INFO.contact.email}</span>
      <div itemProp="geo" itemScope itemType="https://schema.org/GeoCoordinates">
        <meta itemProp="latitude" content={BUSINESS_INFO.geo.latitude} />
        <meta itemProp="longitude" content={BUSINESS_INFO.geo.longitude} />
      </div>
    </div>
  );
}
