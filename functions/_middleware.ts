interface CloudflarePagesContext {
  request: Request;
  next: () => Promise<Response>;
  env: {
    ASSETS: {
      fetch: (request: Request) => Promise<Response>;
    };
  };
}

export async function onRequest(context: CloudflarePagesContext) {
  const url = new URL(context.request.url);
  let pathname = url.pathname;

  // ============================================================
  // CRITICAL GUARD: never process file/asset requests.
  //
  // Any path with a file extension (.js, .css, .png, .xml, ...)
  // or under /assets/ is passed through UNTOUCHED:
  //  - reading them via response.text() corrupts binary files
  //  - converting their 404s into index.html-with-200 poisons
  //    browser/edge caches and breaks ES module loading
  //    ("Expected JavaScript but got text/plain" white pages)
  //  - a missing hashed chunk MUST return a real 404 so the
  //    client-side vite:preloadError handler can recover
  // ============================================================
  const isFileRequest = /\.[a-zA-Z0-9]+$/.test(pathname);
  if (isFileRequest || pathname.startsWith('/assets/')) {
    return context.next();
  }

  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  const isPrivateSurface =
    pathname === '/app' ||
    pathname.startsWith('/app/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/');

  const seoConfig: Record<string, { title: string; description: string; canonical: string; keywords?: string }> = {
    '/': {
      title: 'Cogniiq – KI-Telefonassistent, Webdesign & Automatisierung für Unternehmen in Bayern',
      description: 'Cogniiq entwickelt operative KI-Systeme für Unternehmen in Bayern: KI-Telefonassistent, hochkonvertierende Websites und Prozessautomatisierung. Kein Anruf geht verloren. Go-Live in 7–14 Tagen.',
      canonical: 'https://cogniiq.de/',
      keywords: 'AI Agentur Bayern, KI Telefonassistent, Webdesign Agentur Bayern, Prozessautomatisierung, Cogniiq',
    },
    '/leistungen': {
      title: 'Leistungen | KI-Telefonassistent, Webdesign & Automatisierung – Cogniiq',
      description: 'Drei operative Systeme für Ihr Unternehmen: KI-Telefonassistent, der jeden Anruf beantwortet – Webdesign, das konvertiert – Automatisierung, die manuelle Arbeit eliminiert.',
      canonical: 'https://cogniiq.de/leistungen',
      keywords: 'KI Leistungen, Webdesign Leistungen, Automatisierung Leistungen, Cogniiq Services',
    },
    '/ueber-uns': {
      title: 'Über Uns | KI-Agentur Bayreuth – Lazar & Djordje Popovic – Cogniiq',
      description: 'Cogniiq wurde von Lazar und Djordje Popovic in Bayreuth gegründet. Wir bauen operative KI-Systeme – keine Beratungsfolien, keine generischen Pakete. Direkter Kontakt, messbare Ergebnisse.',
      canonical: 'https://cogniiq.de/ueber-uns',
      keywords: 'Cogniiq Team, AI Agentur Gründer, Lazar Popovic, Djordje Popovic, Bayreuth',
    },
    '/faq': {
      title: 'FAQ – Kosten, Ablauf & KI-Systeme | Cogniiq Bayreuth',
      description: 'Antworten zu KI-Telefonassistent, Webdesign-Kosten, Projektstart und Automatisierung. Was kostet ein Projekt? Wie schnell geht es? Was ist realistisch? Hier, konkret.',
      canonical: 'https://cogniiq.de/faq',
      keywords: 'FAQ KI Agentur, Webdesign Kosten FAQ, Automatisierung FAQ, Cogniiq Fragen',
    },
    '/kontakt': {
      title: 'Kostenloses Erstgespräch vereinbaren – Cogniiq | KI-Agentur Bayern',
      description: '30 Minuten – wir schauen uns Ihre konkrete Situation an und zeigen, wo KI-Telefonie, Webdesign oder Automatisierung sofort wirkt. Kein Pitch. Kein Standardangebot.',
      canonical: 'https://cogniiq.de/kontakt',
      keywords: 'Cogniiq Kontakt, KI Erstgespräch, Webdesign Anfrage, Automatisierung Anfrage',
    },
    '/ki-telefonassistent': {
      title: 'KI-Telefonassistent für Unternehmen | Nie wieder verpasste Anrufe – Cogniiq',
      description: 'Der KI-Telefonassistent von Cogniiq nimmt jeden Anruf an, bucht Termine direkt ins System und beantwortet Fragen – rund um die Uhr, ohne Wartezeit. Einsatzbereit in 7 Tagen.',
      canonical: 'https://cogniiq.de/ki-telefonassistent',
      keywords: 'KI Telefonassistent, AI Rezeptionistin, KI Telefon Unternehmen, Anruf automatisieren, 24/7 Telefonie',
    },
    '/ki-telefonassistent/demo': {
      title: 'KI-Telefonassistent Demo | Live-Vorführung AI-Rezeptionistin – Cogniiq',
      description: 'Testen Sie den KI-Telefonassistenten von Cogniiq live. Hören Sie, wie die AI-Rezeptionistin Anrufe annimmt, Termine bucht und Fragen beantwortet – rund um die Uhr.',
      canonical: 'https://cogniiq.de/ki-telefonassistent/demo',
      keywords: 'KI Telefonassistent Demo, AI Rezeptionistin testen, KI Telefon Demo, Cogniiq Demo',
    },
    '/webdesign': {
      title: 'Webdesign Agentur – Hochkonvertierende Websites für Unternehmen | Cogniiq',
      description: 'Cogniiq entwickelt individuelle Websites, die bei Google ranken und Besucher in Anfragen verwandeln. Kein Template, kein Baukasten – sauberer Code, Core Web Vitals, Local SEO.',
      canonical: 'https://cogniiq.de/webdesign',
      keywords: 'Webdesign Agentur, Website erstellen lassen, professionelle Website, SEO Webdesign, Core Web Vitals',
    },
    '/prozessautomatisierung': {
      title: 'Prozessautomatisierung für Unternehmen | KI-Workflows – Cogniiq',
      description: 'Cogniiq automatisiert wiederkehrende Prozesse: Buchungen, Lead-Nachverfolgung, E-Mail-Workflows und mehr. Weniger manuelle Arbeit, mehr Kapazität für das Wesentliche.',
      canonical: 'https://cogniiq.de/prozessautomatisierung',
      keywords: 'Prozessautomatisierung, KI Automatisierung, Workflow Automatisierung, AI Workflows, Automatisierung Unternehmen',
    },
    '/webdesign-agentur-deutschland': {
      title: 'Webdesign Agentur Deutschland | Individuelle Websites national – Cogniiq',
      description: 'Cogniiq ist Ihre Webdesign Agentur für ganz Deutschland. Wir entwickeln individuelle, SEO-optimierte Websites die konvertieren – remote oder persönlich in Bayern.',
      canonical: 'https://cogniiq.de/webdesign-agentur-deutschland',
      keywords: 'Webdesign Agentur Deutschland, Website Agentur Deutschland, professionelle Website Deutschland',
    },
    '/ki-agentur-deutschland': {
      title: 'KI Agentur Deutschland | AI-Systeme für Unternehmen – Cogniiq',
      description: 'Cogniiq ist Ihre KI-Agentur für ganz Deutschland. KI-Telefonassistenten, Chatbots und Automatisierungssysteme – entwickelt für den deutschen Markt, einsatzbereit in 7–14 Tagen.',
      canonical: 'https://cogniiq.de/ki-agentur-deutschland',
      keywords: 'KI Agentur Deutschland, AI Agentur Deutschland, KI Systeme Unternehmen, Artificial Intelligence Deutschland',
    },
    '/automatisierung-unternehmen': {
      title: 'Automatisierung für Unternehmen | KI-gestützte Workflows – Cogniiq',
      description: 'Automatisieren Sie wiederkehrende Aufgaben in Ihrem Unternehmen. Cogniiq entwickelt KI-gestützte Workflows für Gastronomie, Praxen, Immobilien und Handwerk.',
      canonical: 'https://cogniiq.de/automatisierung-unternehmen',
      keywords: 'Automatisierung Unternehmen, KI Workflows, Business Automation, Prozessoptimierung KI',
    },
    '/kosten-webdesign': {
      title: 'Webdesign Kosten 2025 – Was kostet eine professionelle Website? | Cogniiq',
      description: 'Was kostet Webdesign wirklich? Preise für individuelle Websites, Ladezeiten, SEO-Optimierung und Wartung. Transparente Kostenübersicht von der AI-Agentur Cogniiq.',
      canonical: 'https://cogniiq.de/kosten-webdesign',
      keywords: 'Webdesign Kosten, Website Preise, Was kostet Webdesign, Homepage Kosten 2025',
    },
    '/kosten-ki-telefonassistent': {
      title: 'KI-Telefonassistent Kosten – Was kostet ein AI Rezeptionist? | Cogniiq',
      description: 'Transparente Preisübersicht für KI-Telefonassistenten: Einrichtung, monatliche Kosten, ROI-Berechnung. Was kostet ein AI-Rezeptionist für Praxen, Restaurants und Dienstleister?',
      canonical: 'https://cogniiq.de/kosten-ki-telefonassistent',
      keywords: 'KI Telefonassistent Kosten, AI Rezeptionist Preis, KI Telefonie Kosten, Automatisierung Kosten',
    },
    '/kosten-automatisierung': {
      title: 'Automatisierung Kosten – Was kostet Prozessautomatisierung? | Cogniiq',
      description: 'Realistische Kostenübersicht für Prozessautomatisierung: von einfachen Workflows bis zu komplexen KI-Systemen. ROI und Amortisierungszeiten für verschiedene Unternehmensgrößen.',
      canonical: 'https://cogniiq.de/kosten-automatisierung',
      keywords: 'Automatisierung Kosten, Prozessautomatisierung Preis, KI Automation Kosten, Workflow Automatisierung Kosten',
    },
    '/deutschland': {
      title: 'AI-Systeme & Webdesign für Unternehmen in Deutschland | Cogniiq',
      description: 'Cogniiq entwickelt KI-Telefonassistenten, hochkonvertierende Websites und Automatisierungssysteme für Unternehmen in ganz Deutschland. Remote oder persönlich in Bayern.',
      canonical: 'https://cogniiq.de/deutschland',
      keywords: 'AI Agentur Deutschland, Webdesign Deutschland, KI Systeme Deutschland, Automatisierung Deutschland',
    },
    '/bayern': {
      title: 'AI-Systeme & Webdesign für Unternehmen in Bayern | Cogniiq',
      description: 'Cogniiq betreut Unternehmen in Bayern mit KI-Telefonassistenten, Webdesign und Automatisierung. Persönliche Betreuung in Bayreuth, München, Nürnberg und Regensburg.',
      canonical: 'https://cogniiq.de/bayern',
      keywords: 'AI Agentur Bayern, Webdesign Bayern, KI Telefonassistent Bayern, Automatisierung Bayern',
    },
    '/bayern/ki-telefonassistent': {
      title: 'KI-Telefonassistent Bayern | AI-Rezeptionistin für bayerische Unternehmen – Cogniiq',
      description: 'Der KI-Telefonassistent für Unternehmen in Bayern: nimmt Anrufe an, bucht Termine, beantwortet Fragen – rund um die Uhr. Persönliche Einrichtung durch Cogniiq in Bayreuth.',
      canonical: 'https://cogniiq.de/bayern/ki-telefonassistent',
      keywords: 'KI Telefonassistent Bayern, AI Rezeptionistin Bayern, KI Telefon Bayern',
    },
    '/bayreuth': {
      title: 'AI-Systeme & Webdesign in Bayreuth | KI-Telefonassistent & Automatisierung – Cogniiq',
      description: 'Cogniiq – Ihre AI-Agentur in Bayreuth. KI-Telefonassistent, hochkonvertierende Websites und Prozessautomatisierung für Unternehmen in Oberfranken. Persönliche Betreuung vor Ort.',
      canonical: 'https://cogniiq.de/bayreuth',
      keywords: 'AI Agentur Bayreuth, Webdesign Bayreuth, KI Telefonassistent Bayreuth, Automatisierung Bayreuth',
    },
    '/muenchen': {
      title: 'AI-Systeme & Webdesign in München | KI-Telefonassistent & Automatisierung – Cogniiq',
      description: 'Cogniiq betreut Unternehmen in München mit KI-Telefonassistenten, Webdesign und Prozessautomatisierung. Kein Template, kein Overhead – Systeme, die täglich arbeiten.',
      canonical: 'https://cogniiq.de/muenchen',
      keywords: 'AI Agentur München, Webdesign München, KI Telefonassistent München, Automatisierung München',
    },
    '/regensburg': {
      title: 'AI-Systeme & Webdesign in Regensburg | KI-Telefonassistent & Automatisierung – Cogniiq',
      description: 'Cogniiq entwickelt KI-Telefonassistenten, Webdesign und Automatisierungslösungen für Unternehmen in Regensburg. Persönliche Betreuung, Go-Live in 7–14 Tagen.',
      canonical: 'https://cogniiq.de/regensburg',
      keywords: 'AI Agentur Regensburg, Webdesign Regensburg, KI Telefonassistent Regensburg, Automatisierung Regensburg',
    },
    '/bayreuth/webdesign': {
      title: 'Webdesign Agentur Bayreuth | Website erstellen lassen – Cogniiq',
      description: 'Webdesign in Bayreuth: individuelle, SEO-optimierte und DSGVO-konforme Websites für Unternehmen in Bayreuth und Oberfranken. Core Web Vitals, Local SEO, Conversion-Optimierung.',
      canonical: 'https://cogniiq.de/bayreuth/webdesign',
      keywords: 'Webdesign Bayreuth, Webdesign Agentur Bayreuth, Website erstellen Bayreuth, Homepage Bayreuth',
    },
    '/muenchen/webdesign': {
      title: 'Webdesign Agentur München | Website erstellen lassen – Cogniiq',
      description: 'Webdesign in München: professionelle, SEO-optimierte Websites für Münchner Unternehmen. Individuelle Entwicklung ohne Baukasten – schnell, sicher, skalierbar.',
      canonical: 'https://cogniiq.de/muenchen/webdesign',
      keywords: 'Webdesign München, Webdesign Agentur München, Website erstellen München, Homepage München',
    },
    '/regensburg/webdesign': {
      title: 'Webdesign Agentur Regensburg | Website erstellen lassen – Cogniiq',
      description: 'Webdesign in Regensburg: individuelle Websites, die ranken und konvertieren. Cogniiq entwickelt DSGVO-konforme, schnelle Websites für Unternehmen in Regensburg und Ostbayern.',
      canonical: 'https://cogniiq.de/regensburg/webdesign',
      keywords: 'Webdesign Regensburg, Webdesign Agentur Regensburg, Website erstellen Regensburg, Homepage Regensburg',
    },
    '/bayreuth/webdesign-kosten': {
      title: 'Webdesign Kosten Bayreuth – Preise für Websites in der Region | Cogniiq',
      description: 'Was kostet Webdesign in Bayreuth? Transparente Preisübersicht für individuelle Websites, SEO-Pakete und Wartung. Kostenloser Kostenvoranschlag für Ihr Projekt.',
      canonical: 'https://cogniiq.de/bayreuth/webdesign-kosten',
      keywords: 'Webdesign Kosten Bayreuth, Website Preise Bayreuth, Homepage Kosten Bayreuth',
    },
    '/bayreuth/website-erstellen': {
      title: 'Website erstellen lassen in Bayreuth | Professionell & schnell – Cogniiq',
      description: 'Website in Bayreuth erstellen lassen: individuelle Entwicklung, SEO von Anfang an, DSGVO-konform. Go-Live in 7–14 Tagen. Persönliche Betreuung in Bayreuth.',
      canonical: 'https://cogniiq.de/bayreuth/website-erstellen',
      keywords: 'Website erstellen Bayreuth, Homepage erstellen Bayreuth, Webseite erstellen Bayreuth',
    },
    '/bayreuth/landingpage': {
      title: 'Landingpage Bayreuth – Conversion-optimierte Seiten für Kampagnen | Cogniiq',
      description: 'Professionelle Landingpages für Unternehmen in Bayreuth. Für Google Ads, Social Media und lokale Kampagnen – mit klarem CTA, schnell geladen und messbar.',
      canonical: 'https://cogniiq.de/bayreuth/landingpage',
      keywords: 'Landingpage Bayreuth, Landing Page erstellen Bayreuth, Kampagnenseite Bayreuth',
    },
    '/bayreuth/website-relaunch': {
      title: 'Website Relaunch Bayreuth – Alte Website modernisieren | Cogniiq',
      description: 'Website Relaunch in Bayreuth: Ihre bestehende Website modernisieren ohne Rankingverlust. Neues Design, bessere Performance, stärkeres SEO – persönliche Betreuung.',
      canonical: 'https://cogniiq.de/bayreuth/website-relaunch',
      keywords: 'Website Relaunch Bayreuth, Website modernisieren Bayreuth, Homepage Relaunch Bayreuth',
    },
    '/bayreuth/lokales-seo': {
      title: 'Lokales SEO Bayreuth – Google Maps & lokale Suche optimieren | Cogniiq',
      description: 'Lokales SEO für Unternehmen in Bayreuth: Google Maps Optimierung, lokale Suchanfragen, NAP-Konsistenz. Mehr Kunden aus der Region durch bessere lokale Sichtbarkeit.',
      canonical: 'https://cogniiq.de/bayreuth/lokales-seo',
      keywords: 'Lokales SEO Bayreuth, Google Maps Bayreuth, Local SEO Bayreuth, Lokale Suche Bayreuth',
    },
    '/muenchen/webdesign-kosten': {
      title: 'Webdesign Kosten München – Preise für professionelle Websites | Cogniiq',
      description: 'Was kostet Webdesign in München? Ehrliche Preisübersicht für individuelle Website-Entwicklung im Münchner Markt. Jetzt kostenlosen Kostenvoranschlag anfragen.',
      canonical: 'https://cogniiq.de/muenchen/webdesign-kosten',
      keywords: 'Webdesign Kosten München, Website Preise München, Homepage Kosten München',
    },
    '/muenchen/website-erstellen': {
      title: 'Website erstellen lassen in München | Professionell & schnell – Cogniiq',
      description: 'Website in München erstellen lassen: maßgeschneiderte Entwicklung, SEO, DSGVO-konform. Keine Templates, kein Baukasten – Go-Live in 7–14 Tagen.',
      canonical: 'https://cogniiq.de/muenchen/website-erstellen',
      keywords: 'Website erstellen München, Homepage erstellen München, Webseite erstellen München',
    },
    '/muenchen/landingpage': {
      title: 'Landingpage München – Conversion-starke Seiten für den Münchner Markt | Cogniiq',
      description: 'Professionelle Landingpages für Unternehmen in München. Optimiert für Google Ads, Social Media Kampagnen und lokale Suchanfragen im Münchner Raum.',
      canonical: 'https://cogniiq.de/muenchen/landingpage',
      keywords: 'Landingpage München, Landing Page München, Kampagnenseite München',
    },
    '/muenchen/website-relaunch': {
      title: 'Website Relaunch München – Modernisierung ohne Rankingverlust | Cogniiq',
      description: 'Website Relaunch in München: bestehende Seite modernisieren, Performance verbessern, SEO sichern. Professionelle Umsetzung für Münchner Unternehmen.',
      canonical: 'https://cogniiq.de/muenchen/website-relaunch',
      keywords: 'Website Relaunch München, Homepage Relaunch München, Website modernisieren München',
    },
    '/muenchen/lokales-seo': {
      title: 'Lokales SEO München – Google Maps & lokale Sichtbarkeit | Cogniiq',
      description: 'Lokales SEO für Münchner Unternehmen: Google Maps Optimierung, lokale Suchanfragen und NAP-Konsistenz für mehr Kunden aus München.',
      canonical: 'https://cogniiq.de/muenchen/lokales-seo',
      keywords: 'Lokales SEO München, Google Maps München, Local SEO München, Lokale Suche München',
    },
    '/regensburg/webdesign-kosten': {
      title: 'Webdesign Kosten Regensburg – Transparente Preise für Websites | Cogniiq',
      description: 'Was kostet Webdesign in Regensburg? Realistische Preisübersicht für professionelle Websites in Regensburg und Ostbayern. Jetzt Kostenvoranschlag anfragen.',
      canonical: 'https://cogniiq.de/regensburg/webdesign-kosten',
      keywords: 'Webdesign Kosten Regensburg, Website Preise Regensburg, Homepage Kosten Regensburg',
    },
    '/regensburg/website-erstellen': {
      title: 'Website erstellen lassen in Regensburg | Professionell & schnell – Cogniiq',
      description: 'Website in Regensburg erstellen lassen: individuelle Entwicklung, SEO von Anfang an, DSGVO-konform. Persönliche Betreuung vor Ort in Regensburg.',
      canonical: 'https://cogniiq.de/regensburg/website-erstellen',
      keywords: 'Website erstellen Regensburg, Homepage erstellen Regensburg, Webseite erstellen Regensburg',
    },
    '/regensburg/landingpage': {
      title: 'Landingpage Regensburg – Conversion-optimierte Seiten | Cogniiq',
      description: 'Professionelle Landingpages für Unternehmen in Regensburg. Für Google Ads, Social Media und lokale Kampagnen – schnell, messbar, conversion-stark.',
      canonical: 'https://cogniiq.de/regensburg/landingpage',
      keywords: 'Landingpage Regensburg, Landing Page Regensburg, Kampagnenseite Regensburg',
    },
    '/regensburg/website-relaunch': {
      title: 'Website Relaunch Regensburg – Modernisierung ohne Rankingverlust | Cogniiq',
      description: 'Website Relaunch in Regensburg: alte Website modernisieren, Performance verbessern, lokales SEO optimieren. Professionelle Umsetzung für Unternehmen in Ostbayern.',
      canonical: 'https://cogniiq.de/regensburg/website-relaunch',
      keywords: 'Website Relaunch Regensburg, Homepage Relaunch Regensburg, Website modernisieren Regensburg',
    },
    '/regensburg/lokales-seo': {
      title: 'Lokales SEO Regensburg – Google Maps & lokale Suche | Cogniiq',
      description: 'Lokales SEO für Unternehmen in Regensburg: Google Maps Optimierung, lokale Suchanfragen, mehr Sichtbarkeit in Ostbayern. Messbare Ergebnisse durch technisches SEO.',
      canonical: 'https://cogniiq.de/regensburg/lokales-seo',
      keywords: 'Lokales SEO Regensburg, Google Maps Regensburg, Local SEO Regensburg',
    },
    '/bayreuth/ki-telefonassistent': {
      title: 'KI-Telefonassistent Bayreuth | AI-Rezeptionistin für lokale Unternehmen – Cogniiq',
      description: 'KI-Telefonassistent für Unternehmen in Bayreuth: nimmt Anrufe an, bucht Termine, beantwortet Fragen – 24/7. Eingerichtet in 7 Tagen, persönlich betreut vor Ort.',
      canonical: 'https://cogniiq.de/bayreuth/ki-telefonassistent',
      keywords: 'KI Telefonassistent Bayreuth, AI Rezeptionistin Bayreuth, KI Telefon Bayreuth',
    },
    '/bayreuth/automatisierung': {
      title: 'Prozessautomatisierung Bayreuth | KI-Workflows für lokale Unternehmen – Cogniiq',
      description: 'Prozessautomatisierung für Unternehmen in Bayreuth: Buchungen, Lead-Nachverfolgung, Workflows. Cogniiq automatisiert manuelle Prozesse – persönlich betreut in Oberfranken.',
      canonical: 'https://cogniiq.de/bayreuth/automatisierung',
      keywords: 'Automatisierung Bayreuth, Prozessautomatisierung Bayreuth, KI Workflows Bayreuth',
    },
    '/muenchen/ki-telefonassistent': {
      title: 'KI-Telefonassistent München | AI-Rezeptionistin für Münchner Unternehmen – Cogniiq',
      description: 'KI-Telefonassistent für Unternehmen in München: rund um die Uhr erreichbar, Terminbuchung automatisiert, Anrufe nie wieder verpassen. Einsatzbereit in 7 Tagen.',
      canonical: 'https://cogniiq.de/muenchen/ki-telefonassistent',
      keywords: 'KI Telefonassistent München, AI Rezeptionistin München, KI Telefon München',
    },
    '/muenchen/automatisierung': {
      title: 'Prozessautomatisierung München | KI-Workflows für Münchner Unternehmen – Cogniiq',
      description: 'Prozessautomatisierung für Unternehmen in München: KI-gestützte Workflows für Buchungen, Leads und Kundenkommunikation. Weniger manueller Aufwand, mehr Kapazität.',
      canonical: 'https://cogniiq.de/muenchen/automatisierung',
      keywords: 'Automatisierung München, Prozessautomatisierung München, KI Workflows München',
    },
    '/regensburg/ki-telefonassistent': {
      title: 'KI-Telefonassistent Regensburg | AI-Rezeptionistin für lokale Unternehmen – Cogniiq',
      description: 'KI-Telefonassistent für Unternehmen in Regensburg: Anrufe automatisch annehmen, Termine buchen, Fragen beantworten – 24/7. Go-Live in 7 Tagen, persönliche Betreuung.',
      canonical: 'https://cogniiq.de/regensburg/ki-telefonassistent',
      keywords: 'KI Telefonassistent Regensburg, AI Rezeptionistin Regensburg, KI Telefon Regensburg',
    },
    '/regensburg/automatisierung': {
      title: 'Prozessautomatisierung Regensburg | KI-Workflows für lokale Unternehmen – Cogniiq',
      description: 'Prozessautomatisierung für Unternehmen in Regensburg und Ostbayern: Buchungen, Leads, Workflows automatisieren. Cogniiq entwickelt KI-Systeme, die täglich arbeiten.',
      canonical: 'https://cogniiq.de/regensburg/automatisierung',
      keywords: 'Automatisierung Regensburg, Prozessautomatisierung Regensburg, KI Workflows Regensburg',
    },
    '/webdesign-arzt': {
      title: 'Webdesign für Ärzte & Praxen | Patientengewinnung online – Cogniiq',
      description: 'Professionelle Websites für Arztpraxen und medizinische Einrichtungen. DSGVO-konform, mit Online-Terminbuchung, lokales SEO für mehr Neupatienten.',
      canonical: 'https://cogniiq.de/webdesign-arzt',
      keywords: 'Webdesign Arzt, Website Praxis, Arztwebsite erstellen, Webdesign Praxis, Patientenakquise Online',
    },
    '/webdesign-gastronomie': {
      title: 'Webdesign für Restaurants & Gastronomie | Online Reservierungen – Cogniiq',
      description: 'Websites für Restaurants, Cafés und Gastronomie: mit Online-Reservierung, Speisekarte, Google Maps. Mehr Tischreservierungen durch professionelles Webdesign.',
      canonical: 'https://cogniiq.de/webdesign-gastronomie',
      keywords: 'Webdesign Restaurant, Website Gastronomie, Webdesign Café, Restaurant Website erstellen',
    },
    '/webdesign-immobilien': {
      title: 'Webdesign für Immobilienmakler | Objekte präsentieren & Leads gewinnen – Cogniiq',
      description: 'Websites für Immobilienmakler und Immobilienbüros: Objektpräsentation, Anfragen-Formulare, lokales SEO. Mehr qualifizierte Anfragen durch professionelles Webdesign.',
      canonical: 'https://cogniiq.de/webdesign-immobilien',
      keywords: 'Webdesign Immobilien, Website Immobilienmakler, Immobilien Website erstellen',
    },
    '/webdesign-hotel': {
      title: 'Webdesign für Hotels & Pensionen | Direktbuchungen steigern – Cogniiq',
      description: 'Professionelle Hotel-Websites: Direktbuchungssystem, Zimmerpräsentation, SEO für mehr organische Buchungen. Weniger OTA-Provisionen, mehr Direktgäste.',
      canonical: 'https://cogniiq.de/webdesign-hotel',
      keywords: 'Webdesign Hotel, Website Hotel erstellen, Hotel Direktbuchungen, Pension Website',
    },
    '/webdesign-sport': {
      title: 'Webdesign für Sportvereine & Fitnessstudios | Mitgliederwachstum – Cogniiq',
      description: 'Websites für Sportvereine, Fitnessstudios und Trainingsanbieter: mit Online-Anmeldung, Kursplan, Mitgliederbereichen. Mehr Mitglieder durch digitale Präsenz.',
      canonical: 'https://cogniiq.de/webdesign-sport',
      keywords: 'Webdesign Sportverein, Website Fitnessstudio, Webdesign Sport, Vereinswebsite',
    },
    '/webdesign-arzt-bayreuth': {
      title: 'Webdesign für Ärzte in Bayreuth | Praxis-Website erstellen – Cogniiq',
      description: 'Webdesign für Arztpraxen in Bayreuth: DSGVO-konforme Praxis-Websites mit Online-Terminbuchung, Patienteninformationen und lokalem SEO für mehr Neupatienten in Bayreuth.',
      canonical: 'https://cogniiq.de/webdesign-arzt-bayreuth',
      keywords: 'Webdesign Arzt Bayreuth, Praxis Website Bayreuth, Arztwebsite Bayreuth',
    },
    '/webdesign-gastronomie-bayreuth': {
      title: 'Webdesign für Restaurants in Bayreuth | Online Reservierungen – Cogniiq',
      description: 'Webdesign für Restaurants und Gastronomie in Bayreuth: Online-Reservierung, Speisekarte digital, Google Maps. Mehr Gäste durch professionelle Website.',
      canonical: 'https://cogniiq.de/webdesign-gastronomie-bayreuth',
      keywords: 'Webdesign Restaurant Bayreuth, Gastronomie Website Bayreuth, Restaurant Website Bayreuth',
    },
    '/webdesign-immobilien-bayreuth': {
      title: 'Webdesign für Immobilienmakler in Bayreuth | Leads gewinnen – Cogniiq',
      description: 'Websites für Immobilienmakler in Bayreuth: Objektpräsentation, Anfragen-Formulare, lokales SEO. Mehr qualifizierte Immobilienanfragen durch professionelles Webdesign.',
      canonical: 'https://cogniiq.de/webdesign-immobilien-bayreuth',
      keywords: 'Webdesign Immobilien Bayreuth, Immobilienmakler Website Bayreuth, Immobilien Webdesign Bayreuth',
    },
    '/webdesign-arzt-muenchen': {
      title: 'Webdesign für Ärzte in München | Praxis-Website erstellen – Cogniiq',
      description: 'Webdesign für Arztpraxen in München: DSGVO-konforme Websites mit Online-Terminbuchung und lokalem SEO für mehr Neupatienten in München.',
      canonical: 'https://cogniiq.de/webdesign-arzt-muenchen',
      keywords: 'Webdesign Arzt München, Praxis Website München, Arztwebsite München',
    },
    '/webdesign-gastronomie-muenchen': {
      title: 'Webdesign für Restaurants in München | Online Reservierungen – Cogniiq',
      description: 'Webdesign für Restaurants und Gastronomie in München: Online-Reservierung, digitale Speisekarte, Google Maps. Mehr Gäste für Ihr Münchner Restaurant.',
      canonical: 'https://cogniiq.de/webdesign-gastronomie-muenchen',
      keywords: 'Webdesign Restaurant München, Gastronomie Website München, Restaurant Website München',
    },
    '/webdesign-immobilien-muenchen': {
      title: 'Webdesign für Immobilienmakler in München | Leads gewinnen – Cogniiq',
      description: 'Websites für Immobilienmakler in München: Objektpräsentation, Anfragen, lokales SEO. Mehr qualifizierte Immobilienanfragen in der Münchner Immobilienbranche.',
      canonical: 'https://cogniiq.de/webdesign-immobilien-muenchen',
      keywords: 'Webdesign Immobilien München, Immobilienmakler Website München, Immobilien Webdesign München',
    },
    '/webdesign-arzt-regensburg': {
      title: 'Webdesign für Ärzte in Regensburg | Praxis-Website erstellen – Cogniiq',
      description: 'Webdesign für Arztpraxen in Regensburg: DSGVO-konforme Praxis-Websites mit Online-Terminbuchung und lokalem SEO für mehr Neupatienten in Regensburg.',
      canonical: 'https://cogniiq.de/webdesign-arzt-regensburg',
      keywords: 'Webdesign Arzt Regensburg, Praxis Website Regensburg, Arztwebsite Regensburg',
    },
    '/webdesign-gastronomie-regensburg': {
      title: 'Webdesign für Restaurants in Regensburg | Online Reservierungen – Cogniiq',
      description: 'Webdesign für Restaurants und Gastronomie in Regensburg: Online-Reservierung, Speisekarte, Google Maps. Mehr Gäste durch professionelle Website in Ostbayern.',
      canonical: 'https://cogniiq.de/webdesign-gastronomie-regensburg',
      keywords: 'Webdesign Restaurant Regensburg, Gastronomie Website Regensburg, Restaurant Website Regensburg',
    },
    '/webdesign-immobilien-regensburg': {
      title: 'Webdesign für Immobilienmakler in Regensburg | Leads gewinnen – Cogniiq',
      description: 'Websites für Immobilienmakler in Regensburg: Objektpräsentation, Anfragen-Formulare, lokales SEO für mehr Immobilienanfragen in Regensburg und Ostbayern.',
      canonical: 'https://cogniiq.de/webdesign-immobilien-regensburg',
      keywords: 'Webdesign Immobilien Regensburg, Immobilienmakler Website Regensburg, Immobilien Webdesign Regensburg',
    },
    '/ki-telefonassistent-arzt': {
      title: 'KI-Telefonassistent für Arztpraxen | Termine automatisch buchen – Cogniiq',
      description: 'Der KI-Telefonassistent für Praxen: nimmt Patientenanrufe an, bucht Termine ins System, beantwortet häufige Fragen – rund um die Uhr, ohne Praxismitarbeiterin am Telefon.',
      canonical: 'https://cogniiq.de/ki-telefonassistent-arzt',
      keywords: 'KI Telefonassistent Arzt, AI Rezeptionistin Praxis, Terminbuchung Praxis KI, Arztpraxis Automatisierung',
    },
    '/ki-telefonassistent-restaurant': {
      title: 'KI-Telefonassistent für Restaurants | Reservierungen automatisch annehmen – Cogniiq',
      description: 'KI-Telefonassistent für Restaurants: Tischreservierungen automatisch annehmen, Fragen beantworten, Öffnungszeiten mitteilen – kein Anruf geht mehr verloren.',
      canonical: 'https://cogniiq.de/ki-telefonassistent-restaurant',
      keywords: 'KI Telefonassistent Restaurant, Reservierungen KI, AI Rezeptionistin Restaurant, Gastronomie Automatisierung',
    },
    '/ki-telefonassistent-hotel': {
      title: 'KI-Telefonassistent für Hotels | Buchungsanfragen 24/7 bearbeiten – Cogniiq',
      description: 'KI-Telefonassistent für Hotels: Buchungsanfragen annehmen, Zimmerverfügbarkeiten mitteilen, Fragen beantworten – rund um die Uhr ohne Personalkosten.',
      canonical: 'https://cogniiq.de/ki-telefonassistent-hotel',
      keywords: 'KI Telefonassistent Hotel, AI Rezeptionistin Hotel, Hotel Automatisierung, Buchungen KI Hotel',
    },
    '/ki-telefonassistent-praxis': {
      title: 'KI-Telefonassistent für medizinische Praxen | Terminverwaltung automatisieren – Cogniiq',
      description: 'KI-Telefonassistent für Arzt- und Facharztpraxen: Termine buchen, Rezeptanfragen bearbeiten, Patientenkommunikation automatisieren – DSGVO-konform.',
      canonical: 'https://cogniiq.de/ki-telefonassistent-praxis',
      keywords: 'KI Telefonassistent Praxis, Praxis Telefonassistent, Terminverwaltung Praxis KI, AI Praxis',
    },
    '/automatisierung-restaurant': {
      title: 'Automatisierung für Restaurants | Bestellungen, Reservierungen & mehr – Cogniiq',
      description: 'Prozessautomatisierung für Restaurants: Reservierungen, Bestellungen, Dienstpläne und Kundenkommunikation automatisieren. Mehr Zeit für das Wesentliche.',
      canonical: 'https://cogniiq.de/automatisierung-restaurant',
      keywords: 'Automatisierung Restaurant, Gastronomie Automatisierung, KI Restaurant, Bestellsystem Automatisierung',
    },
    '/automatisierung-arzt': {
      title: 'Automatisierung für Arztpraxen | Terminbuchung & Kommunikation – Cogniiq',
      description: 'Prozessautomatisierung für Arztpraxen: Terminbuchung, Erinnerungen, Patientenkommunikation und Dokumentenverwaltung automatisieren. Mehr Zeit für Patienten.',
      canonical: 'https://cogniiq.de/automatisierung-arzt',
      keywords: 'Automatisierung Arztpraxis, Praxis Automatisierung, Terminbuchung Automatisierung, Arzt KI Systeme',
    },
    '/automatisierung-immobilien': {
      title: 'Automatisierung für Immobilienmakler | Lead-Nachverfolgung & CRM – Cogniiq',
      description: 'Prozessautomatisierung für Immobilienmakler: Lead-Nachverfolgung, Expose-Versand, Besichtigungen und Kundenkommunikation automatisieren. Mehr Abschlüsse, weniger Aufwand.',
      canonical: 'https://cogniiq.de/automatisierung-immobilien',
      keywords: 'Automatisierung Immobilien, Immobilienmakler KI, Lead-Nachverfolgung Immobilien, CRM Automatisierung Immobilien',
    },
    '/automatisierung-sport': {
      title: 'Automatisierung für Sportvereine & Studios | Mitgliederverwaltung KI – Cogniiq',
      description: 'Prozessautomatisierung für Sportvereine und Fitnessstudios: Mitgliederverwaltung, Anmeldungen, Kursplanung und Zahlungen automatisieren.',
      canonical: 'https://cogniiq.de/automatisierung-sport',
      keywords: 'Automatisierung Sportverein, Fitnessstudio Automatisierung, Mitgliederverwaltung KI, Sport Digitalisierung',
    },
    '/verpasste-anrufe-verlust': {
      title: 'Verpasste Anrufe kosten täglich Umsatz – So hören Sie damit auf | Cogniiq',
      description: 'Jeder verpasste Anruf ist ein verlorener Auftrag. Der KI-Telefonassistent von Cogniiq stellt sicher, dass kein Anruf mehr unbeantwortet bleibt – auch nachts und am Wochenende.',
      canonical: 'https://cogniiq.de/verpasste-anrufe-verlust',
      keywords: 'Verpasste Anrufe, Anrufe verpassen Unternehmen, KI Telefonassistent lösung, nie wieder verpasste Anrufe',
    },
    '/keine-anfragen-website': {
      title: 'Warum Ihre Website keine Anfragen bringt – und wie Sie das ändern | Cogniiq',
      description: 'Eine schöne Website bringt noch keine Anfragen. Hier sind die echten Gründe warum Besucher abspringen – und wie Cogniiq das technisch und inhaltlich löst.',
      canonical: 'https://cogniiq.de/keine-anfragen-website',
      keywords: 'Website keine Anfragen, Website konvertiert nicht, Webdesign Conversion Problem, Websitebesucher keine Kunden',
    },
    '/keine-terminbuchung-online': {
      title: 'Keine Online-Terminbuchung? Das kostet Sie täglich Patienten & Kunden | Cogniiq',
      description: 'Ohne Online-Terminbuchung verlieren Sie Patienten und Kunden an Wettbewerber. Cogniiq integriert Terminbuchungssysteme in Ihre Website – in wenigen Tagen.',
      canonical: 'https://cogniiq.de/keine-terminbuchung-online',
      keywords: 'Keine Online Terminbuchung, Terminbuchung Website, Online Buchungssystem integrieren',
    },
    '/zu-viel-manuelle-arbeit': {
      title: 'Zu viel manuelle Arbeit im Unternehmen? KI löst das | Cogniiq',
      description: 'Wiederkehrende manuelle Aufgaben bremsen Ihr Wachstum. Cogniiq automatisiert Buchungen, Kommunikation und Verwaltung mit KI – damit Ihr Team sich auf das Wesentliche konzentriert.',
      canonical: 'https://cogniiq.de/zu-viel-manuelle-arbeit',
      keywords: 'Manuelle Arbeit automatisieren, Prozesse automatisieren, KI gegen manuelle Aufgaben, Automatisierung KMU',
    },
    '/digitale-automatisierung-unternehmen': {
      title: 'Digitale Automatisierung für Unternehmen – Praxisnah & sofort einsetzbar | Cogniiq',
      description: 'Digitale Automatisierung für KMU: Vom Erstgespräch bis zum laufenden System in 7–14 Tagen. Cogniiq entwickelt Automatisierungssysteme, die wirklich eingesetzt werden.',
      canonical: 'https://cogniiq.de/digitale-automatisierung-unternehmen',
      keywords: 'Digitale Automatisierung, Automatisierung KMU, KI Digitalisierung Unternehmen, Digital Transformation',
    },
    '/referenzen': {
      title: 'Referenzen & Projektbeispiele | Cogniiq KI- und Webdesign-Projekte',
      description: 'Echte Projekte, messbare Ergebnisse: Webdesign, KI-Telefonassistenten und Automatisierungslösungen von Cogniiq für Unternehmen in Bayern und Deutschland.',
      canonical: 'https://cogniiq.de/referenzen',
      keywords: 'Cogniiq Referenzen, Webdesign Projekte, KI Projekte, Automatisierung Beispiele',
    },
    '/bewertungen': {
      title: 'Bewertungen & Kundenstimmen | Cogniiq AI-Agentur Bayern',
      description: 'Was Kunden über Cogniiq sagen: echte Bewertungen zu Webdesign, KI-Telefonassistenten und Automatisierung. Überzeugen Sie sich von unserer Arbeit.',
      canonical: 'https://cogniiq.de/bewertungen',
      keywords: 'Cogniiq Bewertungen, Kundenstimmen AI Agentur, Webdesign Bewertungen, KI Telefonassistent Erfahrungen',
    },
    '/blog': {
      title: 'Blog – KI, Webdesign & Automatisierung für Unternehmen | Cogniiq',
      description: 'Praktisches Wissen zu KI-Systemen, Webdesign und Prozessautomatisierung: Praxistipps, Fallstudien und Brancheneinblicke für Unternehmer in Bayern.',
      canonical: 'https://cogniiq.de/blog',
      keywords: 'Cogniiq Blog, KI Unternehmen Blog, Webdesign Tipps, Automatisierung Blog',
    },
  };

  const config = seoConfig[pathname];
  let response = await context.next();

  // SPA fallback: ONLY for extension-less route paths (real pages).
  // Asset 404s never reach this point — they returned real 404s above.
  if (response.status === 404) {
    const indexRequest = new Request(
      new URL('/index.html', context.request.url).toString(),
      context.request
    );
    response = await context.env.ASSETS.fetch(indexRequest);
  }

  let html = await response.text();

  // ============================================================
  // Cache semantics for HTML (the pointer to hashed assets):
  //  - HTML must ALWAYS revalidate, otherwise stale HTML keeps
  //    referencing chunk hashes deleted by newer deployments
  //    -> white pages after every deploy.
  //  - Hashed assets under /assets/ keep Cloudflare Pages'
  //    default immutable long-term caching (handled above by
  //    passing them through untouched).
  // ============================================================
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'no-cache');

  if (isPrivateSurface) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    html = html.replace(
      /<title>[^<]*<\/title>/,
      pathname.startsWith('/admin') ? '<title>Cogniiq Admin</title>' : '<title>Cogniiq Kundenbereich</title>'
    );
    html = html.replace(/(<meta\s+name="robots"\s+content=")[^"]*/i, '$1noindex, nofollow');

    return new Response(html, {
      status: 200,
      headers,
    });
  }

  if (!config) {
    return new Response(html, {
      status: 200,
      headers,
    });
  }

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${config.title}</title>`);
  html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*/i, `$1${config.description}`);
  html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*/i, `$1${config.canonical}`);
  html = html.replace(/(<link\s+rel="alternate"\s+hreflang="de-DE"\s+href=")[^"]*/gi, `$1${config.canonical}`);
  html = html.replace(/(<link\s+rel="alternate"\s+hreflang="x-default"\s+href=")[^"]*/gi, `$1${config.canonical}`);
  html = html.replace(/(<meta\s+property="og:url"\s+content=")[^"]*/i, `$1${config.canonical}`);
  html = html.replace(/(<meta\s+property="og:title"\s+content=")[^"]*/i, `$1${config.title}`);
  html = html.replace(/(<meta\s+property="og:description"\s+content=")[^"]*/i, `$1${config.description}`);
  html = html.replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*/i, `$1${config.title}`);
  html = html.replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*/i, `$1${config.description}`);
  html = html.replace(/(<meta\s+name="twitter:url"\s+content=")[^"]*/i, `$1${config.canonical}`);

  if (config.keywords) {
    html = html.replace(/(<meta\s+name="keywords"\s+content=")[^"]*/i, `$1${config.keywords}`);
  }

  return new Response(html, {
    status: 200,
    headers,
  });
}
