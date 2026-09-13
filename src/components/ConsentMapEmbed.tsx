import { useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

import { BUSINESS_INFO, getGoogleMapsEmbedUrl, getGoogleMapsUrl } from '@/lib/seo-data';

/*
  Google Maps only after an explicit click.

  The embed is an external resource that contacts Google the moment the iframe
  is rendered. The consent banner promises that external services load only
  after a choice, and its two purposes (analytics, marketing) do not cover a map,
  so the map is not tied to either: it waits for its own click, every visit,
  and never touches consent state.
*/
export function ConsentMapEmbed({ className = '', minHeight = 320 }: { className?: string; minHeight?: number }) {
  const [loaded, setLoaded] = useState(false);
  const { streetAddress, postalCode, addressLocality } = BUSINESS_INFO.address;

  if (loaded) {
    return (
      <div className={className} style={{ minHeight }}>
        <iframe
          title={`Standort von ${BUSINESS_INFO.name} in ${addressLocality}`}
          src={getGoogleMapsEmbedUrl()}
          width="100%"
          height="100%"
          style={{ border: 0, minHeight }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-start justify-center gap-4 rounded-2xl border border-pub-hairline bg-pub-paper-2 p-6 sm:p-8 ${className}`}
      style={{ minHeight }}
      data-testid="consent-map-placeholder"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-pub-hairline-soft" aria-hidden="true">
        <MapPin size={19} strokeWidth={1.75} className="text-pub-ink-2" />
      </span>
      <address className="not-italic text-[15px] leading-relaxed text-pub-ink">
        {BUSINESS_INFO.name}
        <br />
        {streetAddress}
        <br />
        {postalCode} {addressLocality}
      </address>
      <p className="max-w-[46ch] text-[13.5px] leading-relaxed text-pub-ink-3">
        Die Karte wird erst geladen, wenn Sie es möchten. Beim Laden werden Daten an Google übertragen.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="inline-flex h-11 items-center rounded-full bg-pub-ink px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1f2933] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2"
        >
          Google Maps laden
        </button>
        <a
          href={getGoogleMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-1.5 text-[14px] font-medium text-pub-ink-2 underline-offset-4 hover:text-pub-ink hover:underline focus-visible:outline-none focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2"
        >
          <ExternalLink size={14} aria-hidden="true" />
          In Google Maps öffnen
        </a>
      </div>
    </div>
  );
}
