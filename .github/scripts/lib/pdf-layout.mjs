// Geometry-level inspection of a rendered PDF.
//
// Text assertions alone cannot catch the defect this exists for: the old customer PDF
// contained all the right WORDS, it just painted them on top of each other and off the
// right edge. `pdftotext -bbox-layout` reports a bounding box for every word, which is what
// makes overlap, clipping and footer collisions measurable rather than a matter of opinion.
//
// Requires poppler (pdftotext). Callers should skip gracefully when it is absent.
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function hasPoppler(tool = 'pdftotext') {
  try { execFileSync(tool, ['-v'], { stdio: 'ignore' }); return true; } catch { return false; }
}

/** Parse `pdftotext -bbox-layout` into pages of lines of words with bounding boxes. */
export function readLayout(pdfPath) {
  const xml = execFileSync('pdftotext', ['-bbox-layout', pdfPath, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const pages = [];
  const pageRe = /<page width="([\d.]+)" height="([\d.]+)">([\s\S]*?)<\/page>/g;
  const lineRe = /<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([\s\S]*?)<\/line>/g;
  const wordRe = /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([\s\S]*?)<\/word>/g;
  const unescape = (t) => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");

  let p;
  while ((p = pageRe.exec(xml))) {
    const width = Number(p[1]);
    const height = Number(p[2]);
    const lines = [];
    let l;
    while ((l = lineRe.exec(p[3]))) {
      const words = [];
      let w;
      while ((w = wordRe.exec(l[5]))) {
        words.push({
          xMin: Number(w[1]), yMin: Number(w[2]), xMax: Number(w[3]), yMax: Number(w[4]),
          text: unescape(w[5]),
        });
      }
      lines.push({
        xMin: Number(l[1]), yMin: Number(l[2]), xMax: Number(l[3]), yMax: Number(l[4]),
        text: words.map((x) => x.text).join(' '), words,
      });
    }
    pages.push({ number: pages.length + 1, width, height, lines });
  }
  return pages;
}

const overlapArea = (a, b) => {
  const w = Math.min(a.xMax, b.xMax) - Math.max(a.xMin, b.xMin);
  const h = Math.min(a.yMax, b.yMax) - Math.max(a.yMin, b.yMin);
  return w > 0 && h > 0 ? w * h : 0;
};
const area = (b) => Math.max(0, b.xMax - b.xMin) * Math.max(0, b.yMax - b.yMin);

/**
 * Lines that collide with another line on the same page.
 *
 * Only lines on genuinely different baselines are compared — two boxes on the SAME text
 * line legitimately sit side by side, and poppler occasionally splits one visual line into
 * several boxes. `minRatio` ignores the sub-pixel touching that antialiased glyph boxes
 * produce; a real overprint covers a large fraction of the smaller box.
 */
export function findOverlaps(page, { minRatio = 0.35, baselineTolerance = 2 } = {}) {
  const hits = [];
  for (let i = 0; i < page.lines.length; i += 1) {
    for (let j = i + 1; j < page.lines.length; j += 1) {
      const a = page.lines[i];
      const b = page.lines[j];
      const sameBaseline = Math.abs(a.yMin - b.yMin) <= baselineTolerance
        && Math.abs(a.yMax - b.yMax) <= baselineTolerance;
      if (sameBaseline) continue;
      const shared = overlapArea(a, b);
      if (!shared) continue;
      const ratio = shared / Math.max(1, Math.min(area(a), area(b)));
      if (ratio >= minRatio) {
        hits.push({ page: page.number, ratio: Number(ratio.toFixed(2)), a: a.text.slice(0, 70), b: b.text.slice(0, 70) });
      }
    }
  }
  return hits;
}

/** Words painted outside the printable area — clipped or bleeding off the sheet. */
export function findOutOfBounds(page, { margin = 0 } = {}) {
  const hits = [];
  for (const line of page.lines) {
    for (const w of line.words) {
      if (!w.text.trim()) continue;
      if (w.xMin < margin - 0.5 || w.xMax > page.width - margin + 0.5
        || w.yMin < margin - 0.5 || w.yMax > page.height - margin + 0.5) {
        hits.push({ page: page.number, text: w.text.slice(0, 40), box: [w.xMin, w.yMin, w.xMax, w.yMax].map((n) => Number(n.toFixed(1))) });
      }
    }
  }
  return hits;
}

/**
 * Body text intruding into the footer band.
 *
 * The premium page reserves paddingBottom: 64pt, and the footer is drawn inside it. Body
 * content must stop above that band; the footer's own line is identified by `footerMatch`
 * and excluded.
 */
export function findFooterCollisions(page, { footerBand = 46, footerMatch = /Seite\s+\d+|cogniiq|USt-IdNr/i } = {}) {
  const threshold = page.height - footerBand;
  return page.lines
    .filter((l) => l.yMax > threshold && l.text.trim() && !footerMatch.test(l.text))
    .map((l) => ({ page: page.number, text: l.text.slice(0, 70), yMax: Number(l.yMax.toFixed(1)) }));
}

/** Rasterise every page to PNG. Returns the written paths. Requires pdftoppm. */
export function renderPagesToPng(pdfPath, outDir, prefix = 'page') {
  mkdirSync(outDir, { recursive: true });
  execFileSync('pdftoppm', ['-png', '-r', '110', pdfPath, resolve(outDir, prefix)]);
  const listing = execFileSync('ls', ['-1', outDir], { encoding: 'utf8' }).trim().split('\n');
  return listing.filter((f) => f.startsWith(prefix) && f.endsWith('.png')).map((f) => resolve(outDir, f));
}

/** Write bytes to a temp PDF path, creating parent dirs. */
export function writePdf(bytes, path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.from(bytes));
  return path;
}

export function removeIfPresent(path) { rmSync(path, { force: true }); }
