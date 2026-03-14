import { BUSINESS_INFO } from "./seo-data";

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
}

export function generateLocationMetadata(
  pageName?: string,
  customDescription?: string
): PageMetadata {
  const baseTitle = `${BUSINESS_INFO.name} | AI Agentur & Webdesign Agentur ${BUSINESS_INFO.address.addressLocality}`;
  const title = pageName ? `${pageName} | ${baseTitle}` : baseTitle;

  const description =
    customDescription ||
    `${BUSINESS_INFO.name} ist Ihre AI Agentur und Webdesign Agentur in ${BUSINESS_INFO.address.addressLocality}. Wir bieten KI Automationen, AI Rezeptionistin, hochkonvertierende Websites und Prozessautomatisierung für lokale Unternehmen in ganz Deutschland.`;

  return {
    title,
    description,
    keywords: BUSINESS_INFO.keywords,
    canonical: BUSINESS_INFO.website,
    ogImage: `${BUSINESS_INFO.website}/og-image.jpg`,
  };
}

export function generateServiceMetadata(
  serviceName: string,
  serviceDescription: string
): PageMetadata {
  const title = `${serviceName} in ${BUSINESS_INFO.address.addressLocality} | ${BUSINESS_INFO.name}`;
  const description = `${serviceDescription} ${BUSINESS_INFO.name} - Ihre AI Agentur und Webdesign Agentur in ${BUSINESS_INFO.address.addressLocality}, ${BUSINESS_INFO.address.addressRegion}.`;

  return {
    title,
    description,
    keywords: [...BUSINESS_INFO.keywords, serviceName.toLowerCase()],
    canonical: BUSINESS_INFO.website,
    ogImage: `${BUSINESS_INFO.website}/og-image.jpg`,
  };
}

export function generateGeoMetaTags() {
  return {
    "geo.region": `DE-${BUSINESS_INFO.address.addressRegion === "Bayern" ? "BY" : ""}`,
    "geo.placename": BUSINESS_INFO.address.addressLocality,
    "geo.position": `${BUSINESS_INFO.geo.latitude};${BUSINESS_INFO.geo.longitude}`,
    ICBM: `${BUSINESS_INFO.geo.latitude}, ${BUSINESS_INFO.geo.longitude}`,
  };
}

export function generateOpenGraphTags(metadata: PageMetadata) {
  return {
    "og:type": "website",
    "og:url": metadata.canonical || BUSINESS_INFO.website,
    "og:title": metadata.title,
    "og:description": metadata.description,
    "og:image": metadata.ogImage || `${BUSINESS_INFO.website}/og-image.jpg`,
    "og:locale": "de_DE",
    "og:site_name": BUSINESS_INFO.name,
  };
}

export function generateTwitterTags(metadata: PageMetadata) {
  return {
    "twitter:card": "summary_large_image",
    "twitter:url": metadata.canonical || BUSINESS_INFO.website,
    "twitter:title": metadata.title,
    "twitter:description": metadata.description,
    "twitter:image": metadata.ogImage || `${BUSINESS_INFO.website}/og-image.jpg`,
  };
}

export const LOCAL_SEO_TIPS = {
  title: "Local SEO Best Practices",
  tips: [
    {
      category: "NAP Consistency",
      description: "Ensure Name, Address, Phone are identical everywhere",
      importance: "Critical",
      checklist: [
        "Google Business Profile",
        "Website Footer",
        "Contact Page",
        "Social Media Profiles",
        "Business Directories",
        "Email Signatures",
      ],
    },
    {
      category: "Structured Data",
      description: "Implement LocalBusiness schema on all pages",
      importance: "High",
      implementation: "Use LocalBusinessSchema component in App.tsx",
    },
    {
      category: "Location-Specific Content",
      description: "Create content targeting your service areas",
      importance: "High",
      examples: [
        "AI Agentur Bayreuth",
        "Webdesign Agentur Bayern",
        "KI Automationen Deutschland",
      ],
    },
    {
      category: "Google Business Profile",
      description: "Claim and optimize your GBP listing",
      importance: "Critical",
      actions: [
        "Claim and verify listing",
        "Add all business information",
        "Upload high-quality photos",
        "Post weekly updates",
        "Respond to reviews",
        "Add services and products",
      ],
    },
    {
      category: "Local Citations",
      description: "List your business on relevant directories",
      importance: "Medium",
      platforms: [
        "Google Business Profile",
        "Bing Places",
        "Apple Maps",
        "Yelp",
        "Facebook Business",
      ],
    },
    {
      category: "Reviews",
      description: "Generate and respond to customer reviews",
      importance: "High",
      strategy: [
        "Request reviews from satisfied clients",
        "Respond to all reviews within 48 hours",
        "Address negative feedback professionally",
        "Use review schema markup",
      ],
    },
    {
      category: "Local Keywords",
      description: "Target location-specific search terms",
      importance: "High",
      keywords: [
        "[Service] in [City]",
        "[Service] [City]",
        "[Service] near me",
        "Best [Service] in [Region]",
      ],
    },
    {
      category: "Mobile Optimization",
      description: "Ensure fast, mobile-friendly experience",
      importance: "Critical",
      requirements: [
        "Responsive design",
        "Fast loading times (<3s)",
        "Click-to-call buttons",
        "Easy navigation",
        "Local business info visible",
      ],
    },
  ],
};

export function generateLocalSEOChecklist() {
  return {
    onPage: [
      "Add NAP to footer (consistent format)",
      "Include LocalBusiness schema markup",
      "Add location keywords naturally in content",
      "Create location-specific pages/sections",
      "Add Google Maps embed",
      "Include geo meta tags",
      "Add local testimonials",
      "Create locally-relevant blog content",
    ],
    offPage: [
      "Claim Google Business Profile",
      "Complete all GBP information",
      "Get listed on Bing Places",
      "Submit to Apple Maps",
      "Create Facebook Business page",
      "List on industry directories",
      "Build local backlinks",
      "Partner with local businesses",
    ],
    technical: [
      "Ensure fast page speed",
      "Mobile-responsive design",
      "Proper heading hierarchy (H1, H2, H3)",
      "Alt text for all images",
      "XML sitemap submitted",
      "robots.txt configured",
      "HTTPS enabled",
      "Structured data implemented",
    ],
    content: [
      "Location-specific service pages",
      "Blog posts about local topics",
      "Case studies from local clients",
      "Local event participation",
      "Area-specific FAQs",
      "Service area pages",
    ],
  };
}
