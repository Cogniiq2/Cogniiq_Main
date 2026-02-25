import { BUSINESS_INFO, SERVICES, getGoogleMapsUrl } from "@/lib/seo-data";

export function LocalBusinessSchema() {
  const sameAsUrls = Object.values(BUSINESS_INFO.socialMedia).filter(Boolean);

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BUSINESS_INFO.website}/#organization`,
        name: BUSINESS_INFO.name,
        legalName: BUSINESS_INFO.legalName,
        url: BUSINESS_INFO.website,
        logo: {
          "@type": "ImageObject",
          "@id": `${BUSINESS_INFO.website}/#logo`,
          url: `${BUSINESS_INFO.website}/logo.png`,
          contentUrl: `${BUSINESS_INFO.website}/logo.png`,
          width: 512,
          height: 512,
          caption: BUSINESS_INFO.name,
        },
        image: `${BUSINESS_INFO.website}/og-image.jpg`,
        description: BUSINESS_INFO.description,
        foundingDate: BUSINESS_INFO.foundingDate,
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS_INFO.address.streetAddress,
          addressLocality: BUSINESS_INFO.address.addressLocality,
          addressRegion: BUSINESS_INFO.address.addressRegion,
          postalCode: BUSINESS_INFO.address.postalCode,
          addressCountry: BUSINESS_INFO.address.addressCountry,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: BUSINESS_INFO.geo.latitude,
          longitude: BUSINESS_INFO.geo.longitude,
        },
        hasMap: getGoogleMapsUrl(),
        telephone: BUSINESS_INFO.contact.phone,
        email: BUSINESS_INFO.contact.email,
        areaServed: BUSINESS_INFO.serviceAreas.map((area) => ({
          "@type": ["Bayreuth", "München", "Nürnberg", "Regensburg", "Bamberg", "Würzburg", "Erlangen", "Fürth", "Ingolstadt", "Augsburg"].includes(area)
            ? "City"
            : area === "Bayern"
            ? "State"
            : "Country",
          name: area,
        })),
        founder: BUSINESS_INFO.founders.map((founder) => ({
          "@type": "Person",
          name: founder.name,
          jobTitle: founder.jobTitle,
        })),
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: BUSINESS_INFO.contact.phone,
            email: BUSINESS_INFO.contact.email,
            contactType: "customer service",
            areaServed: "DE",
            availableLanguage: ["German", "English"],
            hoursAvailable: {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: BUSINESS_INFO.businessHours.dayOfWeek,
              opens: BUSINESS_INFO.businessHours.opens,
              closes: BUSINESS_INFO.businessHours.closes,
            },
          },
        ],
        sameAs: sameAsUrls.length > 0 ? sameAsUrls : undefined,
      },

      {
        "@type": ["LocalBusiness", "ProfessionalService"],
        "@id": `${BUSINESS_INFO.website}/#localbusiness`,
        name: BUSINESS_INFO.name,
        image: [
          `${BUSINESS_INFO.website}/og-image.jpg`,
          `${BUSINESS_INFO.website}/logo.png`,
        ],
        description: BUSINESS_INFO.description,
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS_INFO.address.streetAddress,
          addressLocality: BUSINESS_INFO.address.addressLocality,
          addressRegion: BUSINESS_INFO.address.addressRegion,
          postalCode: BUSINESS_INFO.address.postalCode,
          addressCountry: BUSINESS_INFO.address.addressCountry,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: BUSINESS_INFO.geo.latitude,
          longitude: BUSINESS_INFO.geo.longitude,
        },
        hasMap: getGoogleMapsUrl(),
        url: BUSINESS_INFO.website,
        telephone: BUSINESS_INFO.contact.phone,
        email: BUSINESS_INFO.contact.email,
        priceRange: BUSINESS_INFO.priceRange,
        currenciesAccepted: "EUR",
        paymentAccepted: "Cash, Credit Card, Bank Transfer",
        openingHoursSpecification: BUSINESS_INFO.businessHours.dayOfWeek.map((day) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: `https://schema.org/${day}`,
          opens: BUSINESS_INFO.businessHours.opens,
          closes: BUSINESS_INFO.businessHours.closes,
        })),
        areaServed: BUSINESS_INFO.serviceAreas.map((area) => ({
          "@type": ["Bayreuth", "München", "Nürnberg", "Regensburg", "Bamberg", "Würzburg", "Erlangen", "Fürth", "Ingolstadt", "Augsburg"].includes(area)
            ? "City"
            : area === "Bayern"
            ? "State"
            : "Country",
          name: area,
        })),
        parentOrganization: {
          "@id": `${BUSINESS_INFO.website}/#organization`,
        },
      },

      {
        "@type": "WebSite",
        "@id": `${BUSINESS_INFO.website}/#website`,
        name: BUSINESS_INFO.name,
        url: BUSINESS_INFO.website,
        description: BUSINESS_INFO.description,
        inLanguage: "de-DE",
        publisher: {
          "@id": `${BUSINESS_INFO.website}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${BUSINESS_INFO.website}/?s={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },

      ...SERVICES.map((service) => ({
        "@type": "Service",
        "@id": `${BUSINESS_INFO.website}/#${service.id}`,
        serviceType: service.category,
        name: service.name,
        description: service.description,
        url: service.url,
        provider: {
          "@id": `${BUSINESS_INFO.website}/#organization`,
        },
        areaServed: {
          "@type": "Country",
          name: "Deutschland",
        },
        availableLanguage: {
          "@type": "Language",
          name: "German",
        },
      })),

      {
        "@type": "BreadcrumbList",
        "@id": `${BUSINESS_INFO.website}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: BUSINESS_INFO.website,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Leistungen",
            item: `${BUSINESS_INFO.website}/leistungen`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Über Uns",
            item: `${BUSINESS_INFO.website}/ueber-uns`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: "FAQ",
            item: `${BUSINESS_INFO.website}/faq`,
          },
          {
            "@type": "ListItem",
            position: 5,
            name: "Kontakt",
            item: `${BUSINESS_INFO.website}/kontakt`,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph, null, 0) }}
    />
  );
}