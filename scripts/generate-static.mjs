import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../public');
console.log('DIST DIR EXISTS:', fs.existsSync(distDir));
console.log('DIST INDEX EXISTS:', fs.existsSync(path.join(distDir, 'index.html')));
const seoConfigPath = path.resolve(__dirname, '../src/config/seoConfig.ts');

// ── Routes to generate ────────────────────────────────────────────────────────
const ROUTES = [
  '/leistungen',
  '/ueber-uns',
  '/faq',
  '/kontakt',
  '/ki-telefonassistent',
  '/ki-telefonassistent/demo',
  '/webdesign',
  '/prozessautomatisierung',
  '/deutschland',
  '/bayern',
  '/bayern/ki-telefonassistent',
  '/referenzen',
  '/bewertungen',
  '/blog',
  '/kosten-webdesign',
  '/kosten-ki-telefonassistent',
  '/kosten-automatisierung',
  '/webdesign-agentur-deutschland',
  '/ki-agentur-deutschland',
  '/automatisierung-unternehmen',
  '/webdesign-arzt',
  '/webdesign-gastronomie',
  '/webdesign-immobilien',
  '/webdesign-hotel',
  '/webdesign-sport',
  '/ki-telefonassistent-arzt',
  '/ki-telefonassistent-restaurant',
  '/ki-telefonassistent-hotel',
  '/ki-telefonassistent-praxis',
  '/automatisierung-restaurant',
  '/automatisierung-arzt',
  '/automatisierung-immobilien',
  '/automatisierung-sport',
  '/verpasste-anrufe-verlust',
  '/keine-anfragen-website',
  '/keine-terminbuchung-online',
  '/zu-viel-manuelle-arbeit',
  '/digitale-automatisierung-unternehmen',
  '/bayreuth',
  '/muenchen',
  '/regensburg',
  '/bayreuth/webdesign',
  '/muenchen/webdesign',
  '/regensburg/webdesign',
  '/bayreuth/ki-telefonassistent',
  '/bayreuth/automatisierung',
  '/muenchen/ki-telefonassistent',
  '/muenchen/automatisierung',
  '/regensburg/ki-telefonassistent',
  '/regensburg/automatisierung',
  '/bayreuth/webdesign-kosten',
  '/bayreuth/website-erstellen',
  '/bayreuth/landingpage',
  '/bayreuth/website-relaunch',
  '/bayreuth/lokales-seo',
  '/muenchen/webdesign-kosten',
  '/muenchen/website-erstellen',
  '/muenchen/landingpage',
  '/muenchen/website-relaunch',
  '/muenchen/lokales-seo',
  '/regensburg/webdesign-kosten',
  '/regensburg/website-erstellen',
  '/regensburg/landingpage',
  '/regensburg/website-relaunch',
  '/regensburg/lokales-seo',
  '/webdesign-arzt-bayreuth',
  '/webdesign-gastronomie-bayreuth',
  '/webdesign-immobilien-bayreuth',
  '/webdesign-arzt-muenchen',
  '/webdesign-gastronomie-muenchen',
  '/webdesign-immobilien-muenchen',
  '/webdesign-arzt-regensburg',
  '/webdesign-gastronomie-regensburg',
  '/webdesign-immobilien-regensburg',
];

// ── Parse seoConfig.ts ────────────────────────────────────────────────────────
function parseSeoConfig(tsSource) {
  const config = {};

  const keyPattern = /\n\s+'([^']+)':\s*\{/g;
  let match;

  while ((match = keyPattern.exec(tsSource)) !== null) {
    const routeKey = match[1];
    const blockStart = match.index + match[0].length - 1;

    let depth = 0;
    let i = blockStart;
    while (i < tsSource.length) {
      if (tsSource[i] === '{') depth++;
      else if (tsSource[i] === '}') {
        depth--;
        if (depth === 0) break;
      }
      i++;
    }
    const blockBody = tsSource.slice(blockStart, i + 1);

    const extractField = (field) => {
      const re = new RegExp(`${field}:\\s*(['"\`])([\\s\\S]*?)\\1`, 'm');
      const m = blockBody.match(re);
      if (!m) return null;
      return m[2].replace(/\$\{[^}]+\}/g, '').trim();
    };

    const extractCanonical = () => {
      const re = /canonical:\s*`([^`]+)`/m;
      const m = blockBody.match(re);
      if (m) {
        return m[1].replace(/\$\{BASE\}/g, 'https://cogniiq.de');
      }
      const re2 = /canonical:\s*'([^']+)'/m;
      const m2 = blockBody.match(re2);
      return m2 ? m2[1] : null;
    };

    config[routeKey] = {
      title: extractField('title'),
      description: extractField('description'),
      canonical: extractCanonical(),
      keywords: extractField('keywords'),
    };
  }

  return config;
}

// ── Load SEO config ───────────────────────────────────────────────────────────
const seoSource = fs.readFileSync(seoConfigPath, 'utf-8');
const SEO_CONFIG = parseSeoConfig(seoSource);

function getSEO(route) {
  const cfg = SEO_CONFIG[route];
  if (cfg && cfg.title) return cfg;

  return {
    title: 'Cogniiq | AI Agentur & KI-Automatisierung Deutschland',
    description: 'Cogniiq ist Ihre AI Agentur für KI-Telefonassistenten, Webdesign und Prozessautomatisierung für Unternehmen in Bayern.',
    canonical: `https://cogniiq.de${route === '/' ? '' : route}`,
    keywords: 'AI Agentur Deutschland, KI Telefonassistent, Webdesign Bayern',
  };
}

// ── HTML tag replacement helpers ──────────────────────────────────────────────
function replaceTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
}

function replaceMeta(html, attr, attrVal, newContent) {
  const re = new RegExp(`(<meta\\s+${attr}="${escapeRegex(attrVal)}"\\s+content=")[^"]*(")`,'i');
  const re2 = new RegExp(`(<meta\\s+content=")[^"]*("\\s+${attr}="${escapeRegex(attrVal)}")`, 'i');
  if (re.test(html)) return html.replace(re, `$1${escapeHtml(newContent)}$2`);
  if (re2.test(html)) return html.replace(re2, `$1${escapeHtml(newContent)}$2`);
  return html;
}

function replacePropertyMeta(html, property, newContent) {
  const re = new RegExp(`(<meta\\s+property="${escapeRegex(property)}"\\s+content=")[^"]*(")`,'i');
  const re2 = new RegExp(`(<meta\\s+content=")[^"]*("\\s+property="${escapeRegex(property)}")`, 'i');
  if (re.test(html)) return html.replace(re, `$1${escapeHtml(newContent)}$2`);
  if (re2.test(html)) return html.replace(re2, `$1${escapeHtml(newContent)}$2`);
  return html;
}

function replaceCanonical(html, canonical) {
  return html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/i,
    `$1${canonical}$2`
  );
}

function replaceHreflang(html, canonical) {
  html = html.replace(
    /(<link\s+rel="alternate"\s+hreflang="de-DE"\s+href=")[^"]*(")/gi,
    `$1${canonical}$2`
  );
  html = html.replace(
    /(<link\s+rel="alternate"\s+hreflang="x-default"\s+href=")[^"]*(")/gi,
    `$1${canonical}$2`
  );
  return html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Generate HTML for one route ───────────────────────────────────────────────
const baseHTML = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');

function generateHTML(route) {
  const seo = getSEO(route);
  const canonical = seo.canonical || `https://cogniiq.de${route === '/' ? '' : route}`;

  let html = baseHTML;

  html = replaceTitle(html, seo.title);
  html = replaceMeta(html, 'name', 'description', seo.description);
  if (seo.keywords) {
    html = replaceMeta(html, 'name', 'keywords', seo.keywords);
  }
  html = replaceCanonical(html, canonical);
  html = replaceHreflang(html, canonical);

  html = replacePropertyMeta(html, 'og:title', seo.title);
  html = replacePropertyMeta(html, 'og:description', seo.description);
  html = replacePropertyMeta(html, 'og:url', canonical);

  html = replaceMeta(html, 'name', 'twitter:title', seo.title);
  html = replaceMeta(html, 'name', 'twitter:description', seo.description);
  html = replaceMeta(html, 'name', 'twitter:url', canonical);

  return html;
}

// ── Write files ───────────────────────────────────────────────────────────────
function writeRoute(route) {
  const html = generateHTML(route);

  if (route === '/') {
    // Skip writing public/index.html — Vite uses root index.html as its
    // entry point. Writing here corrupts the build template.
    // Homepage SEO is already correct in root index.html.
    return path.join(distDir, 'index.html');
  }

  const dir = path.join(distDir, route.slice(1));
  fs.mkdirSync(dir, { recursive: true });
  const outputPath = path.join(dir, 'index.html');
  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('');
console.log('Generating static HTML files...');
console.log(`Output: ${distDir}`);
console.log('');

let generated = 0;
let fallbacks = 0;

for (const route of ROUTES) {
  const seo = getSEO(route);
  const hasSEO = SEO_CONFIG[route]?.title;
  const outputPath = writeRoute(route);
  const relPath = path.relative(distDir, outputPath);

  if (hasSEO) {
    console.log(`  ok  /${relPath}`);
    generated++;
  } else {
    console.log(`  fb  /${relPath}  (fallback)`);
    fallbacks++;
  }
}

console.log('');
console.log(`Done. ${generated} with config, ${fallbacks} fallback, ${ROUTES.length} total.`);