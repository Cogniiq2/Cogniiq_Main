import { BUSINESS_INFO } from "./seo-data";

export function getGoogleBusinessLinks() {
  return {
    dashboard: "https://business.google.com/dashboard",
    create: "https://business.google.com/create",
    reviews: "https://business.google.com/reviews",
    posts: "https://business.google.com/posts",
    insights: "https://business.google.com/insights",
  };
}

export function getGoogleReviewLink(): string {
  return `https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`;
}

export function getGoogleSearchUrl(): string {
  const query = encodeURIComponent(
    `${BUSINESS_INFO.name} ${BUSINESS_INFO.address.addressLocality}`
  );
  return `https://www.google.com/search?q=${query}`;
}

export function generateGooglePostsContent() {
  return {
    services: [
      {
        title: "Neue Website benötigt?",
        description:
          "Wir erstellen hochkonvertierende Websites mit Fokus auf Performance und SEO. Kostenloses Erstgespräch vereinbaren!",
        callToAction: "Mehr erfahren",
        link: `${BUSINESS_INFO.website}#leistungen`,
      },
      {
        title: "AI Automationen für Ihr Business",
        description:
          "Automatisieren Sie wiederkehrende Aufgaben und sparen Sie Zeit mit unseren Make.com Automationen.",
        callToAction: "Jetzt beraten lassen",
        link: `${BUSINESS_INFO.website}#kontakt`,
      },
      {
        title: "AI Rezeptionistin",
        description:
          "24/7 Kundenservice mit unserer AI Rezeptionistin. Perfekt für Kliniken, Restaurants und Dienstleister.",
        callToAction: "Demo anfragen",
        link: `${BUSINESS_INFO.website}#kontakt`,
      },
    ],
    updates: [
      {
        title: "Wir sind für Sie da!",
        description: `Besuchen Sie uns in ${BUSINESS_INFO.address.addressLocality} oder kontaktieren Sie uns für ein kostenloses Erstgespräch.`,
        callToAction: "Termin vereinbaren",
        link: `${BUSINESS_INFO.website}#kontakt`,
      },
    ],
  };
}

export const GOOGLE_BUSINESS_SETUP_GUIDE = {
  title: "Google Business Profile Setup Guide",
  steps: [
    {
      step: 1,
      title: "Claim Your Business",
      description: "Visit Google Business Profile and claim your business listing",
      action: "Go to business.google.com and sign in with your Google account",
      link: "https://business.google.com/create",
    },
    {
      step: 2,
      title: "Verify Your Business",
      description: "Complete the verification process (usually via postcard or phone)",
      action:
        "Follow Google's verification instructions and enter the verification code when received",
      link: "https://support.google.com/business/answer/7107242",
    },
    {
      step: 3,
      title: "Complete Your Profile",
      description: "Add all business information",
      details: [
        `Business Name: ${BUSINESS_INFO.name}`,
        `Address: ${BUSINESS_INFO.address.streetAddress}, ${BUSINESS_INFO.address.postalCode} ${BUSINESS_INFO.address.addressLocality}`,
        `Phone: ${BUSINESS_INFO.contact.phoneDisplay}`,
        `Website: ${BUSINESS_INFO.website}`,
        `Category: Web Design Agency, Marketing Agency`,
        "Business Hours: Mon-Fri 9:00 AM - 6:00 PM",
      ],
    },
    {
      step: 4,
      title: "Add Photos",
      description: "Upload high-quality photos of your business",
      action: "Add logo, cover photo, team photos, and workspace images (min 720x720px)",
      recommendations: [
        "Logo (square, transparent background preferred)",
        "Cover photo (landscape, 1024x576px recommended)",
        "Team photos",
        "Office/workspace photos",
        "Service/product photos",
      ],
    },
    {
      step: 5,
      title: "Add Services",
      description: "List your services with descriptions",
      services: [
        "Webdesign & Website Development",
        "AI Automationen & Make.com Integration",
        "AI Rezeptionistin & Chatbots",
        "AI Content Creation",
        "SEO Optimization",
        "Website Performance Optimization",
      ],
    },
    {
      step: 6,
      title: "Add Business Description",
      description: "Write a compelling business description (750 chars max)",
      example: `${BUSINESS_INFO.description} Wir sind Ihre Ansprechpartner für moderne Webtechnologien und KI-gestützte Lösungen in ${BUSINESS_INFO.address.addressLocality} und ganz Deutschland.`,
    },
    {
      step: 7,
      title: "Enable Messaging",
      description: "Turn on messaging to let customers contact you directly",
      action: "Enable the messaging feature in your Google Business Profile settings",
    },
    {
      step: 8,
      title: "Add Booking Link",
      description: "Add your contact/booking page URL",
      action: `Set appointment URL to: ${BUSINESS_INFO.website}#kontakt`,
    },
    {
      step: 9,
      title: "Request Reviews",
      description: "Ask satisfied customers to leave reviews",
      action: "Share your Google review link with customers after successful projects",
    },
    {
      step: 10,
      title: "Post Regular Updates",
      description: "Keep your profile active with weekly posts",
      action: "Post about services, updates, offers, and events regularly",
    },
  ],
  bestPractices: [
    "Keep NAP (Name, Address, Phone) consistent across all platforms",
    "Respond to all reviews (positive and negative) within 24-48 hours",
    "Post updates at least once per week",
    "Use high-quality images (min 720x720px)",
    "Add keywords naturally in your description",
    "Keep business hours up to date",
    "Use Google Posts to highlight services and promotions",
    "Monitor insights to understand customer behavior",
    "Add Q&A preemptively to address common questions",
  ],
  reviewRequestTemplate: {
    subject: "Wie war Ihre Erfahrung mit Cogniiq?",
    message: `Hallo [Name],\n\nvielen Dank für Ihr Vertrauen in unsere Arbeit! Wir hoffen, Sie sind mit [Projektname/Service] zufrieden.\n\nWenn Sie einen Moment Zeit haben, würden wir uns sehr über eine kurze Bewertung auf Google freuen. Ihr Feedback hilft uns, unseren Service weiter zu verbessern und anderen Unternehmen bei der Entscheidung zu helfen.\n\nHier ist der direkte Link zur Bewertung:\n[REVIEW_LINK]\n\nVielen Dank und beste Grüße,\nIhr Cogniiq Team`,
  },
};

export function getLocalBusinessCitations() {
  return [
    {
      platform: "Google Business Profile",
      url: "https://business.google.com",
      priority: "Critical",
      status: "Setup Required",
    },
    {
      platform: "Bing Places",
      url: "https://www.bingplaces.com",
      priority: "High",
      status: "Recommended",
    },
    {
      platform: "Apple Maps",
      url: "https://mapsconnect.apple.com",
      priority: "High",
      status: "Recommended",
    },
    {
      platform: "Yelp",
      url: "https://biz.yelp.com",
      priority: "Medium",
      status: "Optional",
    },
    {
      platform: "Facebook Business",
      url: "https://business.facebook.com",
      priority: "High",
      status: "Recommended",
    },
    {
      platform: "LinkedIn Company Page",
      url: "https://linkedin.com/company",
      priority: "High",
      status: "Recommended",
    },
  ];
}
