import { BUSINESS_INFO, SERVICES, FAQ_ITEMS } from "@/lib/seo-data";

export function LocalBusinessSchema() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BUSINESS_INFO.website}#organization`,
    name: BUSINESS_INFO.name,
    legalName: BUSINESS_INFO.legalName,
    url: BUSINESS_INFO.website,
    logo: `${BUSINESS_INFO.website}/logo.png`,
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
    areaServed: BUSINESS_INFO.serviceAreas.map((area) => ({
      "@type": area === "Deutschland" ? "Country" : "City",
      name: area,
    })),
    founder: BUSINESS_INFO.founders.map((founder) => ({
      "@type": "Person",
      name: founder.name,
      jobTitle: founder.jobTitle,
    })),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: BUSINESS_INFO.contact.phone,
      email: BUSINESS_INFO.contact.email,
      contactType: "Customer Service",
      areaServed: "DE",
      availableLanguage: ["German", "English"],
    },
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${BUSINESS_INFO.website}#localbusiness`,
    name: BUSINESS_INFO.name,
    image: `${BUSINESS_INFO.website}/logo.png`,
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
    url: BUSINESS_INFO.website,
    telephone: BUSINESS_INFO.contact.phone,
    email: BUSINESS_INFO.contact.email,
    priceRange: BUSINESS_INFO.priceRange,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: BUSINESS_INFO.businessHours.dayOfWeek,
      opens: BUSINESS_INFO.businessHours.opens,
      closes: BUSINESS_INFO.businessHours.closes,
    },
    areaServed: BUSINESS_INFO.serviceAreas.map((area) => ({
      "@type": area === "Deutschland" ? "Country" : "City",
      name: area,
    })),
    sameAs: Object.values(BUSINESS_INFO.socialMedia).filter(Boolean),
  };

  const serviceSchemas = SERVICES.map((service) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${BUSINESS_INFO.website}#${service.id}`,
    serviceType: service.category,
    name: service.name,
    description: service.description,
    provider: {
      "@id": `${BUSINESS_INFO.website}#organization`,
    },
    areaServed: {
      "@type": "Country",
      name: "Deutschland",
    },
  }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BUSINESS_INFO.website}#website`,
    name: BUSINESS_INFO.name,
    url: BUSINESS_INFO.website,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BUSINESS_INFO.website}/?s={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BUSINESS_INFO.website,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      {serviceSchemas.map((schema, index) => (
        <script
          key={`service-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
