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

  return (
    <div className={`${containerClass} ${className}`}>
      <address className={`not-italic ${itemClassName}`}>
        <a
          href={getGoogleMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          itemProp="address"
          itemScope
          itemType="https://schema.org/PostalAddress"
        >
          {showIcons && <MapPin size={16} className="mt-1 flex-shrink-0" />}
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
        className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors ${itemClassName}`}
        itemProp="email"
      >
        {showIcons && <Mail size={16} className="flex-shrink-0" />}
        <span>{BUSINESS_INFO.contact.email}</span>
      </a>

      <a
        href={`tel:${BUSINESS_INFO.contact.phone}`}
        className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors ${itemClassName}`}
        itemProp="telephone"
      >
        {showIcons && <Phone size={16} className="flex-shrink-0" />}
        <span>{BUSINESS_INFO.contact.phoneDisplay}</span>
      </a>
    </div>
  );
}

export function NAPSchema() {
  return (
    <div itemScope itemType="https://schema.org/LocalBusiness" className="hidden">
      <span itemProp="name">{BUSINESS_INFO.name}</span>
      <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
        <span itemProp="streetAddress">{BUSINESS_INFO.address.streetAddress}</span>
        <span itemProp="addressLocality">{BUSINESS_INFO.address.addressLocality}</span>
        <span itemProp="postalCode">{BUSINESS_INFO.address.postalCode}</span>
        <span itemProp="addressCountry">{BUSINESS_INFO.address.addressCountry}</span>
      </div>
      <span itemProp="telephone">{BUSINESS_INFO.contact.phone}</span>
      <span itemProp="email">{BUSINESS_INFO.contact.email}</span>
    </div>
  );
}
