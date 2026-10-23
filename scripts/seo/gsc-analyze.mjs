#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Google Search Console export analysis — the numbers behind an SEO decision,
// recomputed from the files instead of trusted from a summary.
//
// Usage:
//   node scripts/seo/gsc-analyze.mjs <dir-with-gsc-export> [--compare <dir-of-earlier-export>]
//
// <dir> is an unpacked Search Console export ("Export → Download CSV"): it may
// contain Queries.csv / Abfragen.csv, Pages.csv / Seiten.csv, Dates.csv / Datum.csv,
// Devices.csv / Geräte.csv, Countries.csv / Länder.csv and — if exported from the
// Performance report with a page filter — a Query×Page file. German and English
// headers are both understood. Nothing is sent anywhere; the script only reads.
//
// What it prints (markdown, paste-ready for docs/seo/organic-growth-scoreboard.md):
//   • totals per file, with the GSC caveat that the three axes never sum alike
//   • brand vs. non-brand split (brand = /cogniiq/i)
//   • query clusters (telefonassistent generic / cost / dentist / doctor / automation /
//     industry automation / hotel & webdesign / local / brand / informational …)
//   • position buckets 1–3, 4–10, 11–20, 21–50, 51+ with impression share
//   • page-1 candidates: positions 4–20 weighted by impressions
//   • CTR under-performance: pages/queries in the top 10 with CTR below the bucket median
//   • cannibalisation: queries that appear on more than one page (needs Query×Page)
//   • pages with zero clicks and high impressions; pages with no visibility at all
//   • optional window-over-window comparison
//
// Deliberately NOT here: any estimate, any "search volume", any fabricated value.
// A column that the export does not carry prints as "—".
// ─────────────────────────────────────────────────────────────────────────────
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const dir = args[0];
const cmpIndex = args.indexOf('--compare');
const compareDir = cmpIndex >= 0 ? args[cmpIndex + 1] : null;
if (!dir || !existsSync(dir)) {
  console.error('Usage: node scripts/seo/gsc-analyze.mjs <export-dir> [--compare <earlier-export-dir>]');
  process.exit(1);
}

// ── CSV ──────────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',' || c === ';') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r[0] ?? '').trim() !== '');
}

const num = (v) => {
  if (v == null) return 0;
  const s = String(v).replace('%', '').replace(/\./g, (m, i, str) => (str.indexOf(',') > i ? '' : m)).replace(',', '.').trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const HEAD = {
  query: /^(top queries|queries|query|suchanfragen|häufigste suchanfragen|abfrage)$/i,
  page: /^(top pages|pages|page|seiten|häufigste seiten|seite)$/i,
  clicks: /^(clicks|klicks)$/i,
  impressions: /^(impressions|impressionen)$/i,
  ctr: /^(ctr|klickrate)$/i,
  position: /^(position|durchschnittliche position|durchschn\. position|avg\. position)$/i,
  date: /^(date|datum)$/i,
  device: /^(device|gerät)$/i,
  country: /^(country|land)$/i,
};

function loadTable(file) {
  const rows = parseCsv(readFileSync(file, 'utf8'));
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (re) => header.findIndex((h) => re.test(h));
  const idx = {
    query: col(HEAD.query), page: col(HEAD.page), clicks: col(HEAD.clicks), impressions: col(HEAD.impressions),
    ctr: col(HEAD.ctr), position: col(HEAD.position), date: col(HEAD.date), device: col(HEAD.device), country: col(HEAD.country),
  };
  return rows.slice(1).map((r) => ({
    query: idx.query >= 0 ? r[idx.query] : undefined,
    page: idx.page >= 0 ? r[idx.page] : undefined,
    date: idx.date >= 0 ? r[idx.date] : undefined,
    device: idx.device >= 0 ? r[idx.device] : undefined,
    country: idx.country >= 0 ? r[idx.country] : undefined,
    clicks: num(r[idx.clicks]), impressions: num(r[idx.impressions]),
    ctr: idx.ctr >= 0 ? num(r[idx.ctr]) : 0, position: idx.position >= 0 ? num(r[idx.position]) : 0,
  }));
}

function findFiles(d) {
  const files = readdirSync(d).filter((f) => f.toLowerCase().endsWith('.csv'));
  const pick = (re) => files.filter((f) => re.test(f)).map((f) => join(d, f));
  return {
    queries: pick(/^(queries|abfragen|suchanfragen)/i)[0],
    pages: pick(/^(pages|seiten)/i)[0],
    dates: pick(/^(dates|datum|chart)/i)[0],
    devices: pick(/^(devices|geräte)/i)[0],
    countries: pick(/^(countries|länder)/i)[0],
    queryPage: pick(/query.*page|seite.*abfrage|abfrage.*seite|page.*query/i)[0],
    all: files,
  };
}

// ── Clusters ─────────────────────────────────────────────────────────────────
const CLUSTERS = [
  ['brand', /cogniiq/i],
  ['telefonassistent · kosten', /(telefon|anruf|rezeption|empfang).*(kosten|preis|was kostet)|(kosten|preis).*(telefon|anruf|rezeption)/i],
  ['telefonassistent · zahnarzt', /zahn|dental|kfo|kieferorth/i],
  ['telefonassistent · arzt/praxis', /(telefon|anruf|rezeption|empfang|assistent).*(arzt|praxis|mvz|medizin|hausarzt|facharzt)|(arzt|praxis|mvz).*(telefon|anruf|assistent)/i],
  ['telefonassistent · hotel/gastro', /(telefon|anruf|assistent).*(hotel|restaurant|gastro)|(hotel|restaurant|gastro).*(telefon|anruf|assistent)/i],
  ['telefonassistent · generic', /telefonassist|telefon(service|zentrale|annahme)|anrufassist|sprachassistent.*telefon|ki telefon|voice ?bot|telefonbot|ai rezeption|ki rezeption/i],
  ['automatisierung · kosten', /automatisier.*(kosten|preis)|(kosten|preis).*automatisier/i],
  ['automatisierung · branche', /automatisier.*(arzt|praxis|immobil|makler|restaurant|gastro|hotel|sport|fitness|verein)|(arzt|praxis|immobil|makler|restaurant|gastro|hotel|fitness).*automatisier/i],
  ['automatisierung · generic', /automatisier|workflow|prozess|digitalisier/i],
  ['webdesign · hotel', /(web|internet|homepage|website).*(hotel)|hotel.*(web|internet|homepage|website)/i],
  ['webdesign · kosten', /(web|website|homepage).*(kosten|preis|was kostet)|(kosten|preis).*(web|website|homepage)/i],
  ['webdesign · relaunch', /relaunch/i],
  ['webdesign · generic', /webdesign|webseite|website|homepage|internetagentur|webagentur|webentwicklung|landingpage|seo/i],
  ['verpasste anrufe / problem', /verpasst|nicht erreichbar|anrufe verloren|keine anfragen/i],
  ['ki agentur', /ki[- ]?agentur|ai[- ]?agentur/i],
];
const CITY = /bayreuth|münchen|muenchen|regensburg|bayern|nürnberg|bamberg|erlangen|hof\b|kulmbach|oberfranken|franken/i;
const INFORMATIONAL = /^(was|wie|warum|wann|welche|wer|wo|wieviel|wie viel|lohnt|kann|ist|gibt es|unterschied|definition|erfahrung|vergleich|test|beispiel)/i;
const COMMERCIAL = /anbieter|agentur|kaufen|kosten|preis|angebot|beauftragen|erstellen lassen|einführen|software|lösung|dienstleister|vergleich|test|beste/i;

function clusterOf(q) {
  for (const [name, re] of CLUSTERS) if (re.test(q)) return name;
  return 'other';
}
const intentOf = (q) => (INFORMATIONAL.test(q) ? 'informational' : COMMERCIAL.test(q) ? 'commercial' : 'navigational/other');

// ── Helpers ──────────────────────────────────────────────────────────────────
const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(1)} %` : '—');
const f1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : '—');
const sum = (rows, k) => rows.reduce((s, r) => s + (r[k] || 0), 0);
const wpos = (rows) => { const i = sum(rows, 'impressions'); return i ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / i : NaN; };
const bucket = (p) => (p <= 3 ? '1–3' : p <= 10 ? '4–10' : p <= 20 ? '11–20' : p <= 50 ? '21–50' : '51+');
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const path = (u) => { try { return new URL(u).pathname.replace(/\/$/, '') || '/'; } catch { return u; } };

function summarize(d, label) {
  const files = findFiles(d);
  const out = [];
  out.push(`# GSC export analysis — ${label}`, '', `Files: ${files.all.join(', ') || 'none'}`, '');

  const queries = files.queries ? loadTable(files.queries) : [];
  const pages = files.pages ? loadTable(files.pages) : [];
  const dates = files.dates ? loadTable(files.dates) : [];
  const devices = files.devices ? loadTable(files.devices) : [];
  const countries = files.countries ? loadTable(files.countries) : [];
  const qp = files.queryPage ? loadTable(files.queryPage).filter((r) => r.query && r.page) : [];

  if (dates.length) {
    const ds = dates.map((r) => r.date).filter(Boolean).sort();
    out.push(`## Window`, `${ds[0]} → ${ds[ds.length - 1]} (${ds.length} days)`, '');
    out.push(table(['Axis', 'Clicks', 'Impressions', 'CTR', 'Ø Position (impression-weighted)'], [
      ['Dates.csv', sum(dates, 'clicks'), sum(dates, 'impressions'), pct(sum(dates, 'clicks'), sum(dates, 'impressions')), f1(wpos(dates))],
      ['Queries.csv', sum(queries, 'clicks'), sum(queries, 'impressions'), pct(sum(queries, 'clicks'), sum(queries, 'impressions')), f1(wpos(queries))],
      ['Pages.csv', sum(pages, 'clicks'), sum(pages, 'impressions'), pct(sum(pages, 'clicks'), sum(pages, 'impressions')), f1(wpos(pages))],
    ]), '', '_The three axes never sum to the same value (GSC aggregation); Queries.csv is capped at 1,000 rows._', '');
    // weekly movement
    const byWeek = new Map();
    for (const r of dates) { const w = r.date.slice(0, 7) + '-W' + String(Math.ceil(Number(r.date.slice(8, 10)) / 7)); const a = byWeek.get(w) ?? { clicks: 0, impressions: 0, pos: 0, n: 0 }; a.clicks += r.clicks; a.impressions += r.impressions; a.pos += r.position * r.impressions; a.n++; byWeek.set(w, a); }
    out.push('### Weekly', table(['Week', 'Clicks', 'Impressions', 'Ø Pos.'], [...byWeek].map(([w, a]) => [w, a.clicks, a.impressions, f1(a.impressions ? a.pos / a.impressions : NaN)])), '');
  }

  if (queries.length) {
    const brand = queries.filter((r) => /cogniiq/i.test(r.query));
    const nonBrand = queries.filter((r) => !/cogniiq/i.test(r.query));
    out.push('## Brand vs. non-brand (Queries.csv)', table(['', 'Rows', 'Clicks', 'Impressions', 'CTR', 'Ø Pos.'], [
      ['brand', brand.length, sum(brand, 'clicks'), sum(brand, 'impressions'), pct(sum(brand, 'clicks'), sum(brand, 'impressions')), f1(wpos(brand))],
      ['non-brand', nonBrand.length, sum(nonBrand, 'clicks'), sum(nonBrand, 'impressions'), pct(sum(nonBrand, 'clicks'), sum(nonBrand, 'impressions')), f1(wpos(nonBrand))],
    ]), '');

    const byCluster = new Map();
    for (const r of nonBrand) { const c = clusterOf(r.query); const a = byCluster.get(c) ?? []; a.push(r); byCluster.set(c, a); }
    out.push('## Query clusters (non-brand)', table(['Cluster', 'Queries', 'Clicks', 'Impressions', 'Impr. share', 'Ø Pos.', 'Top 10 share'],
      [...byCluster].sort((a, b) => sum(b[1], 'impressions') - sum(a[1], 'impressions')).map(([c, rows]) => [c, rows.length, sum(rows, 'clicks'), sum(rows, 'impressions'), pct(sum(rows, 'impressions'), sum(nonBrand, 'impressions')), f1(wpos(rows)), pct(sum(rows.filter((r) => r.position <= 10), 'impressions'), sum(rows, 'impressions'))])), '');

    const byBucket = new Map();
    for (const r of nonBrand) { const b = bucket(r.position); const a = byBucket.get(b) ?? []; a.push(r); byBucket.set(b, a); }
    out.push('## Position buckets (non-brand)', table(['Bucket', 'Queries', 'Impressions', 'Share', 'Clicks', 'CTR'],
      ['1–3', '4–10', '11–20', '21–50', '51+'].map((b) => { const rows = byBucket.get(b) ?? []; return [b, rows.length, sum(rows, 'impressions'), pct(sum(rows, 'impressions'), sum(nonBrand, 'impressions')), sum(rows, 'clicks'), pct(sum(rows, 'clicks'), sum(rows, 'impressions'))]; })), '');

    const near = nonBrand.filter((r) => r.position > 3 && r.position <= 20).sort((a, b) => b.impressions - a.impressions).slice(0, 30);
    out.push('## Page-1 candidates — queries at positions 4–20, by impressions', table(['Query', 'Cluster', 'Intent', 'Impr.', 'Clicks', 'Pos.'], near.map((r) => [r.query, clusterOf(r.query), intentOf(r.query), r.impressions, r.clicks, f1(r.position)])), '');

    const far = nonBrand.filter((r) => r.position > 20 && r.position <= 50).sort((a, b) => b.impressions - a.impressions).slice(0, 25);
    out.push('## Positions 21–50 with demand', table(['Query', 'Cluster', 'Impr.', 'Pos.'], far.map((r) => [r.query, clusterOf(r.query), r.impressions, f1(r.position)])), '');

    const top10 = nonBrand.filter((r) => r.position <= 10 && r.impressions >= 10);
    const medianCtr = (() => { const v = top10.map((r) => r.impressions ? r.clicks / r.impressions : 0).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : 0; })();
    out.push(`## CTR under-performance in the top 10 (median CTR of the set: ${(100 * medianCtr).toFixed(1)} %)`, table(['Query', 'Impr.', 'Clicks', 'CTR', 'Pos.'], top10.filter((r) => r.clicks / r.impressions < medianCtr).sort((a, b) => b.impressions - a.impressions).slice(0, 20).map((r) => [r.query, r.impressions, r.clicks, pct(r.clicks, r.impressions), f1(r.position)])), '');

    const intents = new Map();
    for (const r of nonBrand) { const i = intentOf(r.query); const a = intents.get(i) ?? []; a.push(r); intents.set(i, a); }
    out.push('## Intent split (heuristic)', table(['Intent', 'Queries', 'Impressions', 'Ø Pos.'], [...intents].map(([i, rows]) => [i, rows.length, sum(rows, 'impressions'), f1(wpos(rows))])), '');
    const local = nonBrand.filter((r) => CITY.test(r.query));
    out.push(`## Local queries: ${local.length} queries, ${sum(local, 'impressions')} impressions (${pct(sum(local, 'impressions'), sum(nonBrand, 'impressions'))} of non-brand)`, '');
  }

  if (pages.length) {
    const rows = pages.map((r) => ({ ...r, p: path(r.page) })).sort((a, b) => b.impressions - a.impressions);
    out.push('## Pages by impressions', table(['Page', 'Impr.', 'Clicks', 'CTR', 'Pos.'], rows.slice(0, 40).map((r) => [r.p, r.impressions, r.clicks, pct(r.clicks, r.impressions), f1(r.position)])), '');
    const clusterOfPage = (p) => /telefonassistent|praxen|verpasste-anrufe|keine-terminbuchung/.test(p) ? 'telefonassistent' : /automatisierung|manuelle-arbeit/.test(p) ? 'automation' : /webdesign|website|landingpage|lokales-seo|relaunch/.test(p) ? 'webdesign' : 'other';
    const byC = new Map();
    for (const r of rows) { const c = clusterOfPage(r.p); const a = byC.get(c) ?? []; a.push(r); byC.set(c, a); }
    out.push('## Visibility by page cluster', table(['Cluster', 'Pages', 'Impressions', 'Share', 'Clicks', 'Ø Pos.'], [...byC].map(([c, rs]) => [c, rs.length, sum(rs, 'impressions'), pct(sum(rs, 'impressions'), sum(rows, 'impressions')), sum(rs, 'clicks'), f1(wpos(rs))])), '');
    out.push('## Pages near page 1 (pos. 4–20)', table(['Page', 'Impr.', 'Pos.'], rows.filter((r) => r.position > 3 && r.position <= 20).map((r) => [r.p, r.impressions, f1(r.position)])), '');
    out.push('## Zero-click pages with ≥ 50 impressions', table(['Page', 'Impr.', 'Pos.'], rows.filter((r) => r.clicks === 0 && r.impressions >= 50).map((r) => [r.p, r.impressions, f1(r.position)])), '');
  }

  if (qp.length) {
    const byQ = new Map();
    for (const r of qp) { const a = byQ.get(r.query) ?? []; a.push({ ...r, p: path(r.page) }); byQ.set(r.query, a); }
    const cann = [...byQ].filter(([, rs]) => new Set(rs.map((r) => r.p)).size > 1).sort((a, b) => sum(b[1], 'impressions') - sum(a[1], 'impressions')).slice(0, 40);
    out.push('## Cannibalisation — one query, several pages (Query×Page)', table(['Query', 'Impr.', 'Pages (impr. · pos.)'], cann.map(([q, rs]) => [q, sum(rs, 'impressions'), rs.sort((a, b) => b.impressions - a.impressions).map((r) => `${r.p} (${r.impressions} · ${f1(r.position)})`).join('<br>')])), '');
    const byP = new Map();
    for (const r of qp) { const p = path(r.page); const a = byP.get(p) ?? []; a.push(r); byP.set(p, a); }
    out.push('## Top queries per page (Query×Page)', ...[...byP].sort((a, b) => sum(b[1], 'impressions') - sum(a[1], 'impressions')).slice(0, 25).map(([p, rs]) => `**${p}** — ${rs.sort((a, b) => b.impressions - a.impressions).slice(0, 6).map((r) => `${r.query} (${r.impressions} · ${f1(r.position)})`).join('; ')}`), '');
  } else {
    out.push('## Cannibalisation', '_No Query×Page file in this export. Export the Performance report with a page filter per priority URL, or use the API, to get query-to-page pairs._', '');
  }

  if (devices.length) out.push('## Devices', table(['Device', 'Clicks', 'Impressions', 'Pos.'], devices.map((r) => [r.device, r.clicks, r.impressions, f1(r.position)])), '');
  if (countries.length) out.push('## Countries (top 5)', table(['Country', 'Clicks', 'Impressions', 'Pos.'], countries.sort((a, b) => b.impressions - a.impressions).slice(0, 5).map((r) => [r.country, r.clicks, r.impressions, f1(r.position)])), '');

  return { text: out.join('\n'), queries, pages };
}

const current = summarize(dir, dir);
console.log(current.text);

if (compareDir && existsSync(compareDir)) {
  const earlier = summarize(compareDir, compareDir);
  const idx = new Map(earlier.pages.map((r) => [path(r.page), r]));
  const rows = current.pages.map((r) => { const e = idx.get(path(r.page)); return [path(r.page), r.impressions, e ? e.impressions : '—', f1(r.position), e ? f1(e.position) : '—', e ? f1(e.position - r.position) : '—']; }).sort((a, b) => b[1] - a[1]).slice(0, 40);
  console.log('\n## Window-over-window (pages)\n' + table(['Page', 'Impr. now', 'Impr. before', 'Pos. now', 'Pos. before', 'Δ pos. (+ = better)'], rows));
}
