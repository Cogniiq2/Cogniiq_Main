// Golden Agent — client knowledge model.
//
// Five kinds of knowledge, kept explicitly apart so the agent (and the evaluation) can tell where an
// answer must come from:
//   configured      facts in the ClientConfig (locations, hours, services, FAQs) — spoken from prompt
//   knowledge_base  reviewed documents attached to the provider knowledge base — spoken with attribution
//   tool_required   live or personal data (free slots, a caller's appointments) — only via a tool result
//   must_escalate   topics the client wants a human for (medical judgement, complaints, ...)
//   unknown         nothing configured — the agent must say so and offer a callback, never guess
//
// The classifier is a deterministic keyword heuristic used for (a) building the prompt's "what to
// do when asked about X" section, (b) evaluation scoring of knowledge grounding, and (c) onboarding
// gap detection. It is not used at call time — the LLM follows the rendered rules.

import type { ClientConfig, FaqEntry, KnowledgeSource } from './clientConfig.ts';
import { formatWeeklyHoursDe } from './openingHours.ts';

export type KnowledgeClass = 'configured' | 'knowledge_base' | 'tool_required' | 'must_escalate' | 'unknown';

export interface KnowledgeClassification {
  class: KnowledgeClass;
  /** What matched: a FAQ id, a source id, a tool name, a topic. */
  reference?: string;
  reason: string;
}

const TOOL_TOPICS: Array<{ tool: string; patterns: RegExp[] }> = [
  { tool: 'get_available_slots', patterns: [/\bfrei(e|er|en)?\b/i, /verf[üu]gbar/i, /\bwann.*(termin|platz)/i, /n[äa]chste[nr]? (freie[nr]? )?termin/i, /noch (was|etwas) frei/i] },
  { tool: 'find_appointment', patterns: [/mein(en|em)? termin/i, /wann (ist|war|habe ich) mein/i, /terminnummer/i, /meine buchung/i] },
  { tool: 'cancel_appointment', patterns: [/absagen/i, /stornier/i, /nicht kommen/i] },
  { tool: 'reschedule_appointment', patterns: [/verschieben/i, /umbuchen/i, /anderen tag/i, /andere uhrzeit/i] },
];

const ESCALATION_TOPICS_UNIVERSAL: Array<{ topic: string; patterns: RegExp[] }> = [
  { topic: 'medical_judgement', patterns: [/diagnose/i, /darf ich (mit|trotz)/i, /medikament/i, /schwanger/i, /krank(heit)?\b/i, /symptom/i, /schmerz/i, /ist das gef[äa]hrlich/i, /welche[sr]? (mittel|medikament)/i] },
  { topic: 'complaint', patterns: [/beschwer/i, /unversch[äa]mt/i, /unzufrieden/i, /geschäftsf[üu]hr/i, /anwalt/i] },
  { topic: 'billing', patterns: [/rechnung/i, /mahnung/i, /erstattung/i, /r[üu]ckzahlung/i] },
  { topic: 'data_protection', patterns: [/datenschutz/i, /auskunft.*daten/i, /daten l[öo]schen/i, /dsgvo/i] },
];

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

const STOPWORDS = new Set(['gibt', 'ihnen', 'eine', 'einen', 'einem', 'einer', 'kann', 'muss', 'sind', 'wann', 'dass', 'bitte', 'haben', 'habe', 'gerne', 'welche', 'welcher', 'sich', 'auch', 'nicht', 'oder', 'doch', 'noch', 'nach', 'über', 'mich', 'mein', 'meine', 'meinen', 'ihre', 'ihren', 'denn', 'wird', 'werden', 'darf', 'soll', 'sollte', 'könnte', 'wie', 'was', 'wer', 'bei', 'brauche', 'bekomme', 'bekommen', 'möchte', 'hätte', 'wollen', 'will', 'mal', 'nochmal']);

function tokens(text: string): string[] {
  return normalise(text).split(' ').filter((token) => token.length > 3 && !STOPWORDS.has(token));
}

/** Overlap score between a question and a FAQ (question + variants), 0..1. */
export function faqMatchScore(faq: FaqEntry, question: string): number {
  const q = new Set(tokens(question));
  if (q.size === 0) return 0;
  const candidates = [faq.question, ...(faq.variants ?? [])];
  let best = 0;
  for (const candidate of candidates) {
    const c = tokens(candidate);
    if (c.length === 0) continue;
    const overlap = c.filter((token) => q.has(token)).length;
    if (overlap === 0 || (overlap < 2 && c.length > 1)) continue;
    best = Math.max(best, overlap / Math.max(c.length, 1));
  }
  return best;
}

export function classifyKnowledgeRequest(config: ClientConfig, question: string): KnowledgeClassification {
  const text = normalise(question);

  for (const topic of config.alwaysEscalateTopics ?? []) {
    if (text.includes(normalise(topic))) return { class: 'must_escalate', reference: topic, reason: 'client-configured escalation topic' };
  }
  for (const { topic, patterns } of ESCALATION_TOPICS_UNIVERSAL) {
    if (patterns.some((pattern) => pattern.test(question))) return { class: 'must_escalate', reference: topic, reason: 'universal escalation topic' };
  }
  for (const { tool, patterns } of TOOL_TOPICS) {
    if (patterns.some((pattern) => pattern.test(question))) return { class: 'tool_required', reference: tool, reason: 'live or personal data' };
  }

  let bestFaq: { id: string; score: number } | null = null;
  for (const faq of config.faqs) {
    const score = faqMatchScore(faq, question);
    if (score >= 0.5 && (!bestFaq || score > bestFaq.score)) bestFaq = { id: faq.id, score };
  }
  if (bestFaq) return { class: 'configured', reference: `faq:${bestFaq.id}`, reason: `faq match ${bestFaq.score.toFixed(2)}` };

  if (/[öo]ffnungszeit|ge[öo]ffnet|geschlossen|feiertag|wann.*(auf|offen)/i.test(question)) return { class: 'configured', reference: 'opening_hours', reason: 'configured hours' };
  if (/adresse|\bwo\b.*\b(sind|seid|ist|liegt|finde)\b|anfahrt|park|standort|wie komme ich/i.test(question)) return { class: 'configured', reference: 'locations', reason: 'configured locations' };
  for (const service of config.services) {
    const names = [service.name, ...(service.aliases ?? [])].map(normalise);
    if (names.some((name) => name && text.includes(name))) return { class: 'configured', reference: `service:${service.id}`, reason: 'configured service' };
  }

  const reviewedSources = config.knowledgeSources.filter((source) => source.reviewed);
  if (reviewedSources.length > 0) {
    // Without embeddings we cannot know if a document covers the question. The honest answer is
    // "consult the knowledge base, attribute the source, otherwise say unknown".
    return { class: 'knowledge_base', reference: reviewedSources.map((s) => s.id).join(','), reason: 'reviewed sources available' };
  }
  return { class: 'unknown', reason: 'no configured or reviewed knowledge' };
}

/* ------------------------------------------------------------------ documents */

export interface GeneratedKnowledgeDocument {
  /** Stable key so re-sync updates instead of duplicating. */
  key: string;
  name: string;
  text: string;
}

/**
 * Renders the configured facts into knowledge-base documents. The prompt already carries the
 * compact version; these documents give the retrieval layer the full detail (all FAQs, every
 * closure) without bloating the system prompt.
 */
export function buildKnowledgeDocuments(config: ClientConfig): GeneratedKnowledgeDocument[] {
  const documents: GeneratedKnowledgeDocument[] = [];
  const company = config.spokenName ?? config.companyName;

  const locationLines = config.locations.map((location) => {
    const closures = (location.specialClosures ?? []).map((closure) => `  - ${closure.from}${closure.to ? ` bis ${closure.to}` : ''}: ${closure.hours?.length ? closure.hours.map((h) => `${h.open}–${h.close}`).join(', ') : 'geschlossen'}${closure.reason ? ` (${closure.reason})` : ''}`);
    return [
      `## ${location.name} (Standort-ID: ${location.id})`,
      `Adresse: ${location.address.street}, ${location.address.postalCode} ${location.address.city}${location.address.country ? `, ${location.address.country}` : ''}`,
      location.phone ? `Telefon: ${location.phone}` : null,
      `Reguläre Öffnungszeiten: ${formatWeeklyHoursDe(location)}`,
      location.address.directions ? `Hinweis zur Anfahrt: ${location.address.directions}` : null,
      location.address.parking ? `Parken: ${location.address.parking}` : null,
      location.address.publicTransport ? `ÖPNV: ${location.address.publicTransport}` : null,
      closures.length ? `Sonderöffnungszeiten / Schließungen:\n${closures.join('\n')}` : null,
      location.serviceIds?.length ? `Angebotene Leistungen: ${location.serviceIds.join(', ')}` : 'Angebotene Leistungen: alle',
    ].filter(Boolean).join('\n');
  });
  documents.push({ key: 'locations', name: `${company} – Standorte und Öffnungszeiten`, text: `# Standorte von ${company}\n\n${locationLines.join('\n\n')}` });

  const serviceLines = config.services.map((service) => [
    `## ${service.name} (Leistungs-ID: ${service.id})`,
    service.aliases?.length ? `Auch genannt: ${service.aliases.join(', ')}` : null,
    service.description ? service.description : null,
    `Dauer: ca. ${service.durationMinutes} Minuten`,
    service.priceText ? `Preis-Hinweis: ${service.priceText}` : null,
    `Telefonisch buchbar: ${service.bookable ? 'ja' : 'nein'}`,
    service.newCallersAllowed === false ? 'Nur für bestehende Kunden buchbar.' : null,
    service.requirements?.length ? `Voraussetzungen / Mitbringen:\n${service.requirements.map((r) => `  - ${r}`).join('\n')}` : null,
  ].filter(Boolean).join('\n'));
  documents.push({ key: 'services', name: `${company} – Leistungen`, text: `# Leistungen von ${company}\n\n${serviceLines.join('\n\n')}` });

  if (config.faqs.length > 0) {
    const faqLines = config.faqs.map((faq) => `## ${faq.question}\n${faq.answer}${faq.locationIds?.length ? `\n(Gilt für: ${faq.locationIds.join(', ')})` : ''}`);
    documents.push({ key: 'faq', name: `${company} – Häufige Fragen`, text: `# Häufige Fragen zu ${company}\n\n${faqLines.join('\n\n')}` });
  }

  for (const source of config.knowledgeSources) {
    if (source.kind === 'text' && source.reviewed && source.text) {
      documents.push({ key: `source:${source.id}`, name: `${company} – ${source.name}`, text: source.text });
    }
  }
  return documents;
}

/* ------------------------------------------------------------------ onboarding review */

export interface KnowledgeGap {
  severity: 'blocker' | 'warning';
  area: string;
  message: string;
}

/** What an operator must still provide/review before the agent may leave DEV. */
export function findKnowledgeGaps(config: ClientConfig): KnowledgeGap[] {
  const gaps: KnowledgeGap[] = [];
  if (config.locations.length === 0) gaps.push({ severity: 'blocker', area: 'locations', message: 'Kein Standort konfiguriert.' });
  for (const location of config.locations) {
    if (Object.keys(location.hours).length === 0) gaps.push({ severity: 'blocker', area: `locations.${location.id}`, message: `Keine Öffnungszeiten für ${location.name}.` });
  }
  if (config.services.length === 0) gaps.push({ severity: 'blocker', area: 'services', message: 'Keine Leistung konfiguriert.' });
  if (config.services.some((s) => s.bookable) && config.bookingIntegration.provider === 'none') gaps.push({ severity: 'blocker', area: 'bookingIntegration', message: 'Buchbare Leistungen ohne Buchungsanbindung.' });
  if (config.faqs.length < 5) gaps.push({ severity: 'warning', area: 'faqs', message: `Nur ${config.faqs.length} FAQ-Einträge. Empfohlen: mindestens 5 für Erstanrufer.` });
  if (config.escalationContacts.length === 0) gaps.push({ severity: 'blocker', area: 'escalationContacts', message: 'Kein menschlicher Ansprechpartner für Eskalationen.' });
  if (!config.escalationContacts.some((c) => c.phone)) gaps.push({ severity: 'warning', area: 'escalationContacts', message: 'Keine Weiterleitungsnummer: Eskalation ist nur per Rückruf möglich.' });
  const unreviewed: KnowledgeSource[] = config.knowledgeSources.filter((s) => !s.reviewed);
  for (const source of unreviewed) gaps.push({ severity: 'blocker', area: `knowledgeSources.${source.id}`, message: `Quelle "${source.name}" ist noch nicht freigegeben.` });
  if (!config.voice.voiceId) gaps.push({ severity: 'warning', area: 'voice', message: 'Keine Stimme gewählt; die Werkseinstellung wird verwendet.' });
  if ((config.scopeLimits ?? []).length === 0) gaps.push({ severity: 'warning', area: 'scopeLimits', message: 'Keine fachlichen Grenzen hinterlegt (z. B. "keine medizinische Beratung").' });
  return gaps;
}
