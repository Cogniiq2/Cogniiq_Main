// Golden Agent — evaluation runner.
//
// evaluateTranscript: score one transcript against one scenario (any source).
// runOfflineEvaluation: replay the whole catalog through the reference conversation and score it.
// summarize: aggregate per dimension and category, listing every failure with its findings.

import type { ClientConfig } from '../clientConfig.ts';
import { runReferenceConversation } from './referencePolicy.ts';
import { SCORERS } from './scorers.ts';
import { buildScenarioCatalog } from './scenarios.ts';
import type { DimensionScore, EvaluationSummary, ExpectedOutcome, Finding, Scenario, ScenarioResult, ScoreDimension, Transcript } from './types.ts';
import { SCORE_DIMENSIONS } from './types.ts';

export function detectOutcome(transcript: Transcript): ExpectedOutcome | 'unknown' {
  const results = transcript.turns.flatMap((turn) => turn.toolResults ?? []);
  if (results.some((r) => r.name === 'create_appointment' && r.ok)) return 'booked';
  if (results.some((r) => r.name === 'reschedule_appointment' && r.ok)) return 'rescheduled';
  if (results.some((r) => r.name === 'cancel_appointment' && r.ok)) return 'cancelled';
  if (results.some((r) => r.name === 'request_callback' && r.ok)) return 'callback';
  if (results.some((r) => r.name === 'escalate_to_human' && r.ok)) return 'escalated';
  const speech = transcript.turns.filter((t) => t.role === 'agent').map((t) => t.text).join(' ');
  if (/\b112\b/.test(speech)) return 'emergency_routed';
  if (results.some((r) => r.ok && ['find_appointment', 'get_opening_hours', 'get_service_information'].includes(r.name))) return 'answered';
  return 'unknown';
}

export function evaluateTranscript(scenario: Scenario, transcript: Transcript): ScenarioResult {
  const scores: DimensionScore[] = SCORERS.map((scorer) => scorer(scenario, transcript));
  const findings: Finding[] = scores.flatMap((score) => score.findings);
  const passed = scores.every((score) => score.passed);
  const toolCalls = transcript.turns.flatMap((turn) => (turn.toolCalls ?? []).map((call) => call.name));
  return { scenarioId: scenario.id, category: scenario.category, title: scenario.title, passed, scores, findings, transcript, outcome: detectOutcome(transcript), toolCalls };
}

export interface OfflineEvaluationOptions {
  /** Restrict to these categories (default all). */
  categories?: string[];
  /** Restrict to scenario ids. */
  ids?: string[];
}

export async function runOfflineEvaluation(config: ClientConfig, options: OfflineEvaluationOptions = {}): Promise<{ results: ScenarioResult[]; summary: EvaluationSummary }> {
  const catalog = buildScenarioCatalog().filter((scenario) => (!options.categories || options.categories.includes(scenario.category)) && (!options.ids || options.ids.includes(scenario.id)));
  const results: ScenarioResult[] = [];
  for (const scenario of catalog) {
    const { transcript } = await runReferenceConversation(config, scenario);
    results.push(evaluateTranscript(scenario, transcript));
  }
  return { results, summary: summarize(results) };
}

export function summarize(results: ScenarioResult[]): EvaluationSummary {
  const byDimension = {} as EvaluationSummary['byDimension'];
  for (const dimension of SCORE_DIMENSIONS) {
    const applicable = results.flatMap((r) => r.scores.filter((s) => s.dimension === dimension && s.applicable));
    byDimension[dimension as ScoreDimension] = {
      applicable: applicable.length,
      passed: applicable.filter((s) => s.passed).length,
      averageScore: applicable.length ? Number((applicable.reduce((sum, s) => sum + s.score, 0) / applicable.length).toFixed(3)) : 1,
    };
  }
  const byCategory: Record<string, { total: number; passed: number }> = {};
  for (const result of results) {
    byCategory[result.category] = byCategory[result.category] ?? { total: 0, passed: 0 };
    byCategory[result.category].total += 1;
    if (result.passed) byCategory[result.category].passed += 1;
  }
  return {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    byDimension,
    byCategory,
    failures: results.filter((r) => !r.passed).map((r) => ({ scenarioId: r.scenarioId, title: r.title, category: r.category, findings: r.findings.filter((f) => f.severity === 'fail') })),
  };
}
