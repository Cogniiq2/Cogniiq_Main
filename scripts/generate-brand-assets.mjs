#!/usr/bin/env node
/**
 * Generates the public brand assets (favicon, apple-touch-icon, logo, OG image) from
 * the production Cogniiq logo mark.
 *
 * Source of truth is Concept 3 ("Quantum Core") in src/components/Logo.tsx, which is the
 * concept the site actually renders: <Logo /> defaults to `concept = 3` and both
 * Navigation and Footer use it bare. The geometry below is the same hexagon construction
 * (outer hex, structural mid hex, six spokes, core), re-centred on a square canvas and
 * with the decorative feGaussianBlur dropped so it rasterises identically everywhere.
 *
 * Rasterisation uses a headless Chromium binary rather than an npm rasteriser, so the
 * project gains no new dependency. The generated files are committed, so this script only
 * needs to run when the mark changes.
 *
 * Usage:
 *   node scripts/generate-brand-assets.mjs
 *
 * Browser lookup: if CHROME_BIN is set it is used as-is. Otherwise the script probes a
 * PLAYWRIGHT_BROWSERS_PATH install and then the usual Linux system locations.
 *
 * On Windows (and on any machine where auto-detection fails) set CHROME_BIN explicitly to
 * the local Chrome/Edge/Chromium executable before running, for example:
 *   PowerShell:  $env:CHROME_BIN="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
 *   cmd.exe:     set CHROME_BIN=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
 * No Windows path is hardcoded here on purpose — installation locations differ per machine.
 *
 * This script is a manual, occasional tool: it is wired into no npm script and no CI job.
 * The generated files under public/ are committed artifacts, so it only needs to run when
 * the brand mark itself changes.
 */
import { writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const TMP = join(ROOT, '.brand-assets-tmp');

const INK = '#0d1821';
const INK_MID = '#5a8fa8';
const INK_FAINT = 'rgba(13,24,33,0.15)';

/** Concept 3 hexagon: vertices at 60°·i − 30°, matching Logo.tsx's hexPts(). */
function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(3)},${(cy + r * Math.sin(a)).toFixed(3)}`;
  }).join(' ');
}

/** The square Quantum Core mark, scaled to `size`. */
function markSvg(size, { background = '#ffffff' } = {}) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.34;
  const midR = R * 0.58;
  const coreR = size * 0.035;
  const sw = size * 0.028; // outer stroke
  const swMid = size * 0.016;
  const swSpoke = size * 0.012;

  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    const x2 = (cx + midR * Math.cos(a)).toFixed(3);
    const y2 = (cy + midR * Math.sin(a)).toFixed(3);
    return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${INK_FAINT}" stroke-width="${swSpoke}" />`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="hexGrad" x1="${cx - R}" y1="${cy - R}" x2="${cx + R}" y2="${cy + R}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${INK_MID}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${INK}" stop-opacity="0.85" />
    </linearGradient>
    <linearGradient id="coreGrad" x1="${cx - coreR}" y1="${cy - coreR}" x2="${cx + coreR}" y2="${cy + coreR}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${INK_MID}" />
      <stop offset="100%" stop-color="${INK}" />
    </linearGradient>
  </defs>
  ${background === 'none' ? '' : `<rect width="${size}" height="${size}" fill="${background}" />`}
  <polygon points="${hexPoints(cx, cy, R)}" fill="none" stroke="url(#hexGrad)" stroke-width="${sw}" stroke-linejoin="round" />
  <polygon points="${hexPoints(cx, cy, midR)}" fill="none" stroke="${INK_FAINT}" stroke-width="${swMid}" stroke-linejoin="round" />
    ${spokes}
  <circle cx="${cx}" cy="${cy}" r="${coreR}" fill="url(#coreGrad)" />
</svg>`;
}

/** 1200x630 Open Graph card: mark + wordmark + descriptor. */
function ogSvg() {
  const W = 1200;
  const H = 630;
  const markSize = 200;
  const mx = W / 2;
  const my = 250;
  const R = markSize * 0.34;
  const midR = R * 0.58;

  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `<line x1="${mx}" y1="${my}" x2="${(mx + midR * Math.cos(a)).toFixed(3)}" y2="${(my + midR * Math.sin(a)).toFixed(3)}" stroke="${INK_FAINT}" stroke-width="2.4" />`;
  }).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="hexGrad" x1="${mx - R}" y1="${my - R}" x2="${mx + R}" y2="${my + R}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${INK_MID}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${INK}" stop-opacity="0.85" />
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#ffffff" />
  <rect width="${W}" height="6" fill="${INK_MID}" opacity="0.5" />
  <polygon points="${hexPoints(mx, my, R)}" fill="none" stroke="url(#hexGrad)" stroke-width="5.6" stroke-linejoin="round" />
  <polygon points="${hexPoints(mx, my, midR)}" fill="none" stroke="${INK_FAINT}" stroke-width="3.2" stroke-linejoin="round" />
  ${spokes}
  <circle cx="${mx}" cy="${my}" r="7" fill="${INK}" />
  <text x="${mx}" y="435" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="76" font-weight="700" fill="${INK}" letter-spacing="-1.5">Cogniiq</text>
  <text x="${mx}" y="492" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="27" font-weight="500" fill="${INK_MID}">KI-Telefonassistent · Webdesign · Automatisierung</text>
  <text x="${mx}" y="536" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="23" font-weight="400" fill="rgba(13,24,33,0.45)">Bayreuth · Bayern</text>
</svg>`;
}

function findChrome() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  const pwRoot = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(pwRoot)) {
    for (const entry of readdirSync(pwRoot)) {
      for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
        const candidate = join(pwRoot, entry, rel);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  for (const candidate of [
    '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function rasterize(chrome, svgPath, outPath, width, height) {
  execFileSync(chrome, [
    '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--screenshot=${outPath}`,
    `--window-size=${width},${height}`,
    svgPath,
  ], { stdio: 'pipe' });
}

const chrome = findChrome();
if (!chrome) {
  console.error(
    'No Chromium binary found automatically.\n' +
    'Set CHROME_BIN to a local Chrome/Edge/Chromium executable and re-run, e.g.:\n' +
    '  Windows (PowerShell): $env:CHROME_BIN="<path>\\chrome.exe"\n' +
    '  macOS/Linux:          CHROME_BIN=/path/to/chrome node scripts/generate-brand-assets.mjs'
  );
  process.exit(1);
}
console.log(`Using browser: ${chrome}`);

mkdirSync(TMP, { recursive: true });
mkdirSync(PUBLIC, { recursive: true });

// Committed vector source of the square mark.
writeFileSync(join(PUBLIC, 'logo.svg'), markSvg(512), 'utf8');

const jobs = [
  { name: 'favicon.png', svg: markSvg(512), size: 512 },
  { name: 'apple-touch-icon.png', svg: markSvg(180), size: 180 },
  { name: 'logo.png', svg: markSvg(512), size: 512 },
];

for (const job of jobs) {
  const svgPath = join(TMP, `${job.name}.svg`);
  writeFileSync(svgPath, job.svg, 'utf8');
  rasterize(chrome, svgPath, join(PUBLIC, job.name), job.size, job.size);
  console.log(`  wrote public/${job.name} (${job.size}x${job.size})`);
}

const ogPath = join(TMP, 'og-image.svg');
writeFileSync(ogPath, ogSvg(), 'utf8');
rasterize(chrome, ogPath, join(PUBLIC, 'og-image.png'), 1200, 630);
console.log('  wrote public/og-image.png (1200x630)');

rmSync(TMP, { recursive: true, force: true });
console.log('Brand assets generated.');
