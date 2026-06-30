import { Context } from "https://edge.netlify.com";

const seoConfig: Record<string, { title: string; description: string; canonical: string; keywords?: string }> = {
  '/': {
    title: 'Cogniiq | AI Agentur & KI-Automatisierung Deutschland',
    description: 'Cogniiq ist Ihre AI Agentur für KI-Telefonassistenten, Webdesign und Prozessautomatisierung für Unternehmen in Bayern.',
    canonical: 'https://cogniiq.de/',
  },
  '/bayreuth/ki-telefonassistent': {
    title: 'KI-Telefonassistent Bayreuth | Cogniiq – 24/7 AI Rezeptionistin',
    description: 'KI-Telefonassistent für Unternehmen in Bayreuth. Cogniiq automatisiert Ihre Telefonkommunikation – für Arztpraxen, Kanzleien und KMUs. Jetzt Demo anfragen.',
    canonical: 'https://cogniiq.de/bayreuth/ki-telefonassistent',
    keywords: 'KI-Telefonassistent Bayreuth, AI Rezeptionistin Bayreuth',
  },
  '/bayreuth/webdesign': {
    title: 'Webdesign Bayreuth | Cogniiq – Premium Websites für KMUs',
    description: 'Professionelles Webdesign für Unternehmen in Bayreuth. Hochkonvertierende Websites mit Premium-Design und lokalem SEO.',
    canonical: 'https://cogniiq.de/bayreuth/webdesign',
    keywords: 'Webdesign Bayreuth, Webdesign Agentur Bayreuth',
  },
  '/bayreuth/automatisierung': {
    title: 'Prozessautomatisierung Bayreuth | Cogniiq – KI & Make.com',
    description: 'Prozessautomatisierung mit KI für Unternehmen in Bayreuth. Cogniiq automatisiert Workflows mit Make.com und n8n.',
    canonical: 'https://cogniiq.de/bayreuth/automatisierung',
    keywords: 'Prozessautomatisierung Bayreuth, Make.com Bayreuth',
  },
  '/muenchen/ki-telefonassistent': {
    title: 'KI-Telefonassistent München | Cogniiq – AI Telefonanlage Bayern',
    description: 'KI-Telefonassistent für Münchner Unternehmen und Arztpraxen. Cogniiq liefert intelligente 24/7-Telefonie mit natürlicher Sprache.',
    canonical: 'https://cogniiq.de/muenchen/ki-telefonassistent',
    keywords: 'KI-Telefonassistent München, AI Telefonassistent München',
  },
  '/muenchen/webdesign': {
    title: 'Webdesign München | Cogniiq – Premium AI-Websites für Bayern',
    description: 'Webdesign Agentur für München: Cogniiq erstellt hochkonvertierende Premium-Websites für Münchner KMUs und Arztpraxen.',
    canonical: 'https://cogniiq.de/muenchen/webdesign',
    keywords: 'Webdesign München, Webdesign Agentur München',
  },
  '/muenchen/automatisierung': {
    title: 'Prozessautomatisierung München | Cogniiq – KI-Workflows Bayern',
    description: 'Intelligente Prozessautomatisierung für Münchner Unternehmen. Cogniiq automatisiert Ihre Geschäftsprozesse mit KI und Make.com.',
    canonical: 'https://cogniiq.de/muenchen/automatisierung',
    keywords: 'Prozessautomatisierung München, KI Workflows München',
  },
  '/regensburg/ki-telefonassistent': {
    title: 'KI-Telefonassistent Regensburg | Cogniiq – AI Rezeptionistin Oberpfalz',
    description: 'KI-Telefonassistent für Unternehmen in Regensburg. Cogniiq automatisiert Anrufmanagement für Arztpraxen und KMUs in der Oberpfalz.',
    canonical: 'https://cogniiq.de/regensburg/ki-telefonassistent',
    keywords: 'KI-Telefonassistent Regensburg, AI Rezeptionistin Regensburg',
  },
  '/regensburg/webdesign': {
    title: 'Webdesign Regensburg | Cogniiq – Premium Websites Oberpfalz',
    description: 'Premium Webdesign für Unternehmen in Regensburg. Cogniiq baut schnelle, SEO-optimierte Websites für KMUs in der Oberpfalz.',
    canonical: 'https://cogniiq.de/regensburg/webdesign',
    keywords: 'Webdesign Regensburg, Webdesign Agentur Regensburg',
  },
  '/regensburg/automatisierung': {
    title: 'Prozessautomatisierung Regensburg | Cogniiq – KI Automation Oberpfalz',
    description: 'KI-gestützte Prozessautomatisierung für Regensburger Unternehmen. Cogniiq optimiert Ihre Workflows mit Make.com und AI-Agenten.',
    canonical: 'https://cogniiq.de/regensburg/automatisierung',
    keywords: 'Prozessautomatisierung Regensburg, Make.com Regensburg',
  },
  '/ki-telefonassistent': {
    title: 'KI-Telefonassistent | Cogniiq – 24/7 AI Rezeptionistin für Unternehmen',
    description: 'Cogniiq KI-Telefonassistent: Automatische Anrufannahme, Terminvergabe und Kundenservice rund um die Uhr. Für Unternehmen in ganz Deutschland.',
    canonical: 'https://cogniiq.de/ki-telefonassistent',
    keywords: 'KI-Telefonassistent, AI Rezeptionistin, Telefonassistent Deutschland',
  },
  '/webdesign': {
    title: 'Webdesign Agentur | Cogniiq – Premium Websites für KMUs',
    description: 'Cogniiq Webdesign: Hochkonvertierende Premium-Websites für KMUs in Bayern und Deutschland. Schnell, SEO-optimiert, conversion-stark.',
    canonical: 'https://cogniiq.de/webdesign',
    keywords: 'Webdesign Agentur, Premium Webdesign Deutschland',
  },
  '/prozessautomatisierung': {
    title: 'Prozessautomatisierung | Cogniiq – KI-Workflows für Unternehmen',
    description: 'Cogniiq automatisiert Ihre Geschäftsprozesse mit KI, Make.com und n8n. Für KMUs in Bayern und Deutschland.',
    canonical: 'https://cogniiq.de/prozessautomatisierung',
    keywords: 'Prozessautomatisierung, Make.com Agentur, KI Automation',
  },
  '/arztpraxen/ki-telefonassistent': {
    title: 'KI-Telefonassistent für Arztpraxen | Cogniiq – AI Rezeptionistin',
    description: 'KI-Telefonassistenten für Arztpraxen: automatische Terminvergabe, Patientenmanagement und 24/7-Erreichbarkeit. DSGVO-konform.',
    canonical: 'https://cogniiq.de/arztpraxen/ki-telefonassistent',
    keywords: 'KI-Telefonassistent Arztpraxis, AI Rezeptionistin Arztpraxis',
  },
  '/arztpraxen/webdesign': {
    title: 'Webdesign für Arztpraxen | Cogniiq – Premium Praxis-Websites',
    description: 'Professionelles Webdesign für Arztpraxen: DSGVO-konforme, patientenfreundliche Praxis-Websites mit Online-Terminbuchung.',
    canonical: 'https://cogniiq.de/arztpraxen/webdesign',
    keywords: 'Webdesign Arztpraxis, Praxis Website',
  },
};

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  let pathname = url.pathname;

  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  const acceptHeader = request.headers.get('accept') || '';
  if (!acceptHeader.includes('text/html')) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('text/html')) {
    return response;
  }

  const config = seoConfig[pathname];
  if (!config) return response;

  let html = await response.text();

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
    status: response.status,
    headers: response.headers,
  });
}

export const config = { path: "/*" };