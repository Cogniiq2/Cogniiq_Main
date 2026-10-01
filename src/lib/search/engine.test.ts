import { describe, expect, it } from 'vitest';
import { buildSearchIndex } from './index';
import { readIntent, searchSite } from './engine';
import { editDistance, fold, stem, tokenize } from './normalize';

// Verhaltensdeckung der Seitensuche. Die Erwartungen sind die Seiten, die ein
// Besucher mit dieser Eingabe meint — nicht die Reihenfolge einer Liste.
//
// Keine der fünf eingefrorenen Experimentrouten wird hier beim Namen genannt:
// src/protectedExperiments.test.tsx zählt jede Erwähnung im Quellbaum.

const index = buildSearchIndex();

function top(query: string): string {
  const results = searchSite(index, query);
  return results[0]?.doc.path ?? '';
}

function paths(query: string): string[] {
  return searchSite(index, query).map((r) => r.doc.path);
}

describe('Normalisierung', () => {
  it('faltet Umlaute und ß', () => {
    expect(fold('Zahnärzte in München, Straße')).toBe('zahnaerzte in muenchen, strasse');
  });

  it('streicht Stoppwörter und kürzt Endungen', () => {
    expect(tokenize('ich brauche eine Website für meine Praxis')).toEqual(['websit', 'praxi']);
    expect(stem('anrufe')).toBe('anruf');
    expect(stem('praxis')).toBe('praxi');
  });

  it('behält eine Eingabe, die nur aus Stoppwörtern besteht', () => {
    expect(tokenize('was gibt es')).not.toHaveLength(0);
  });

  it('misst Tippfehler mit Vertauschung', () => {
    expect(editDistance('webdesgin', 'webdesign', 2)).toBe(1);
    expect(editDistance('telefonasistent', 'telefonassistent', 2)).toBe(1);
    expect(editDistance('abc', 'xyz', 1)).toBeGreaterThan(1);
  });
});

describe('Absicht lesen', () => {
  it('erkennt Leistung, Branche und Standort in einem Satz', () => {
    const intent = readIntent('Website für Zahnärzte in München');
    const ids = intent.facets.map((f) => f.id);
    expect(ids).toContain('webdesign');
    expect(ids).toContain('zahnarzt');
    expect(ids).toContain('muenchen');
  });

  it('erkennt die Seitenart „Preise"', () => {
    expect(readIntent('was kostet das').kinds).toContain('preise');
  });
});

describe('Index', () => {
  it('enthält nur veröffentlichte Ziele — keine Dankeseite, keine privaten Flächen', () => {
    const all = index.map((d) => d.path);
    expect(all).not.toContain('/anfrage-erhalten');
    expect(all.some((p) => p.startsWith('/app') || p.startsWith('/admin'))).toBe(false);
    expect(all).toContain('/');
    expect(all).toContain('/kontakt');
    expect(all.length).toBeGreaterThan(80);
  });

  it('bereinigt den Markenzusatz aus dem Titel', () => {
    const doc = index.find((d) => d.path === '/webdesign');
    expect(doc?.title.endsWith('Cogniiq')).toBe(false);
    expect(doc?.label).toBe('Webdesign');
  });
});

describe('Suche — die beste Seite zuerst', () => {
  it('ein Wort reicht', () => {
    expect(top('Webdesign')).toBe('/webdesign');
    expect(top('Telefonassistent')).toBe('/ki-telefonassistent');
    expect(top('Automatisierung')).toBe('/prozessautomatisierung');
    expect(top('Kontakt')).toBe('/kontakt');
    expect(top('Impressum')).toBe('/impressum');
    expect(top('Demo')).toBe('/ki-telefonassistent/demo');
    expect(top('FAQ')).toBe('/faq');
    expect(top('Blog')).toBe('/blog');
    expect(top('Leistungen')).toBe('/leistungen');
  });

  it('ganze Sätze in den Worten des Besuchers', () => {
    expect(top('Anrufe gehen verloren')).toBe('/verpasste-anrufe-verlust');
    expect(top('niemand geht ans Telefon')).toBe('/verpasste-anrufe-verlust');
    expect(top('Meine Website bringt keine Anfragen')).toBe('/keine-anfragen-website');
    expect(top('wir haben zu viel manuelle Arbeit')).toBe('/zu-viel-manuelle-arbeit');
    expect(top('wer seid ihr')).toBe('/ueber-uns');
    expect(top('ich möchte einen Termin vereinbaren')).toBe('/kontakt');
  });

  it('„was kostet" führt zur Preisseite der gemeinten Leistung', () => {
    expect(top('was kostet eine Website')).toBe('/kosten-webdesign');
    expect(top('Preis Telefonassistent')).toBe('/kosten-ki-telefonassistent');
    expect(top('Kosten Automatisierung')).toBe('/kosten-automatisierung');
  });

  it('Branche und Leistung zusammen treffen die Branchenseite', () => {
    expect(top('Telefonassistent Restaurant')).toBe('/ki-telefonassistent-restaurant');
    expect(top('Webdesign Hotel')).toBe('/webdesign-hotel');
    expect(top('Automatisierung Arzt')).toBe('/automatisierung-arzt');
    expect(top('Telefonassistent für Zahnarztpraxis')).toBe('/ki-telefonassistent-zahnarztpraxis');
    expect(top('Website Fitnessstudio')).toBe('/webdesign-sport');
  });

  it('Synonyme aus dem Alltag der Besucher', () => {
    expect(top('Homepage')).toBe('/webdesign');
    expect(top('Rezeptionistin')).toBe('/ki-telefonassistent');
    expect(top('Makler')).toMatch(/immobilien/);
    expect(top('Munich')).toBe('/muenchen');
  });

  it('ein Ort allein führt zur Stadtseite, mit Leistung zur Leistungsseite der Stadt', () => {
    expect(top('Bayreuth')).toBe('/bayreuth');
    expect(top('München')).toBe('/muenchen');
    expect(top('Webdesign in München')).toBe('/muenchen/webdesign');
    expect(top('Telefonassistent Regensburg')).toBe('/regensburg/ki-telefonassistent');
    expect(top('homepage für mein restaurant in regensburg')).toBe('/webdesign-gastronomie-regensburg');
  });

  it('eine andere Stadt steht nie vor der gemeinten', () => {
    const results = paths('Webdesign München');
    const firstOther = results.findIndex((p) => p.includes('bayreuth') || p.includes('regensburg'));
    const firstMuenchen = results.findIndex((p) => p.includes('muenchen'));
    expect(firstMuenchen).toBe(0);
    expect(firstOther === -1 || firstOther > 3).toBe(true);
  });

  it('Städte ohne eigene Seite landen auf der Region', () => {
    expect(top('Nürnberg')).toBe('/bayern');
    expect(top('Berlin')).toBe('/deutschland');
  });

  it('verzeiht Tippfehler und fehlende Umlaute', () => {
    expect(top('Webdesgin')).toBe('/webdesign');
    expect(top('Telefonasistent')).toBe('/ki-telefonassistent');
    expect(top('zahnaerzte')).toBe('/ki-telefonassistent-zahnarztpraxis');
  });

  it('findet Ratgeberartikel, wenn nach Ratgeber gefragt wird', () => {
    const results = paths('Ratgeber Webdesign');
    expect(results[0]).toBe('/blog');
    expect(results.slice(1, 4).every((p) => p.startsWith('/blog/'))).toBe(true);
  });

  it('liefert nichts für Unsinn und zu kurze Eingaben', () => {
    expect(searchSite(index, 'xqzv')).toHaveLength(0);
    expect(searchSite(index, 'a')).toHaveLength(0);
    expect(searchSite(index, '   ')).toHaveLength(0);
  });

  it('erklärt den Treffer', () => {
    const [first] = searchSite(index, 'Webdesign für Zahnärzte in München');
    expect(first.matched).toContain('Webdesign');
    expect(first.matched).toContain('München');
    expect(first.matched.length).toBeLessThanOrEqual(3);
  });

  it('gibt höchstens acht Ergebnisse', () => {
    expect(searchSite(index, 'Webdesign').length).toBeLessThanOrEqual(8);
  });
});
