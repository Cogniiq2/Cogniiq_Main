#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Visual blue-detail audit against the built `dist/` (local, no network).
//
//   node scripts/visual/blue-audit.mjs <outDir> [route ...]
//
// For every route and two viewports (desktop 1440×900, mobile 390×844) it
// writes a full-page PNG and a JSON report that counts the elements actually
// RENDERED in a design-system blue (pub-signal #1c4fd8 / #1539a6, pub-accent
// rgb(37 99 235) / rgb(29 78 216) / rgb(59 130 246)) as text, background,
// border or SVG stroke, broken down by role: buttons/CTA links, icons,
// inline highlights, other links. It is a measuring instrument, not a test:
// it never fails, it reports.
// ─────────────────────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { findChromium, launchChromium } from '../../.github/scripts/lib/chromium.mjs';
import { startStaticServer } from '../../.github/scripts/lib/static-server.mjs';

const out = resolve(process.argv[2] || 'visual-out');
const routes = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ['/ki-telefonassistent', '/ki-telefonassistent-arzt', '/ki-telefonassistent-zahnarztpraxis', '/kosten-ki-telefonassistent', '/praxen'];
mkdirSync(out, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];

const server = await startStaticServer(resolve('dist'));
const exe = findChromium();
if (!exe) { console.log('SKIP: no Chromium'); process.exit(0); }
const { page, close } = await launchChromium(exe);
await page.send('Page.enable');
await page.send('Runtime.enable');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const evaluate = async (expression) =>
  (await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

const AUDIT = `(() => {
  const BLUES = ['28, 79, 216', '21, 57, 166', '37, 99, 235', '29, 78, 216', '59, 130, 246'];
  const isBlue = (c) => c && BLUES.some((b) => c.includes(b));
  const res = { buttons: 0, icons: 0, highlights: 0, links: 0, other: 0, samples: [] };
  for (const el of document.querySelectorAll('main *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const tag = el.tagName.toLowerCase();
    const blueBg = isBlue(cs.backgroundColor);
    const blueText = isBlue(cs.color);
    const blueStroke = tag === 'svg' && (isBlue(cs.stroke) || isBlue(cs.color));
    if (!blueBg && !blueText && !blueStroke) continue;
    const parentBlue = el.parentElement && (isBlue(getComputedStyle(el.parentElement).color) && blueText && !blueBg);
    let kind = 'other';
    if (blueBg && (tag === 'a' || tag === 'button')) kind = 'buttons';
    else if (tag === 'svg') { if (parentBlue) continue; kind = 'icons'; }
    else if (tag === 'a' && blueText) kind = 'links';
    else if ((tag === 'span' || tag === 'strong' || tag === 'em' || tag === 'mark') && blueText) { if (parentBlue) continue; kind = 'highlights'; }
    else if (blueBg) kind = 'other';
    else if (parentBlue) continue;
    res[kind] += 1;
    if (res.samples.length < 40) res.samples.push(kind + ': <' + tag + '> ' + (el.textContent || '').trim().slice(0, 50));
  }
  // Primary CTAs still rendered in near-black (regression detector).
  res.blackButtons = [...document.querySelectorAll('main a, main button')].filter((el) => {
    const bg = getComputedStyle(el).backgroundColor;
    return /rgb\\((11, 15, 20|17, 24, 39|31, 41, 55)\\)/.test(bg);
  }).map((el) => (el.textContent || '').trim().slice(0, 40));
  res.h1 = document.querySelectorAll('h1').length;
  return res;
})()`;

const report = {};
for (const vp of VIEWPORTS) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile,
  });
  for (const route of routes) {
    await page.send('Page.navigate', { url: `${server.origin}${route}` });
    await sleep(2500);
    // Dismiss consent so it does not cover the page (choice is not stored server-side).
    await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>/Nur notwendige|Ablehnen|Alle akzeptieren/.test(x.textContent||'')); if(b) b.click(); return 1; })()`);
    await sleep(400);
    // Scroll through once so reveal-on-scroll content renders.
    await evaluate(`(async () => { const h=document.documentElement.scrollHeight; for(let y=0;y<h;y+=600){window.scrollTo(0,y); await new Promise(r=>setTimeout(r,40));} window.scrollTo(0,0); return h; })()`);
    await sleep(500);
    const audit = await evaluate(AUDIT);
    const height = await evaluate('document.documentElement.scrollHeight');
    const shot = await page.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: vp.width, height: Math.min(height, 16000), scale: 1 },
    });
    const file = `${route.replace(/\//g, '_') || '_home'}.${vp.name}.png`;
    writeFileSync(join(out, file), Buffer.from(shot.data, 'base64'));
    report[`${route} ${vp.name}`] = { height, ...audit };
    console.log(`${vp.name.padEnd(7)} ${route.padEnd(38)} h1=${audit.h1} buttons=${audit.buttons} icons=${audit.icons} highlights=${audit.highlights} links=${audit.links} other=${audit.other} blackButtons=${audit.blackButtons.length}`);
  }
}
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
await close();
await server.close();
