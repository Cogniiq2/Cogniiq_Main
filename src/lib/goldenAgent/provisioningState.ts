// Golden Agent — the one place that decides "where is this receptionist, really?".
//
// The dashboard used to infer readiness from whatever field was nearest (a provider agent id, a
// green toast). That reads as "done" in states that are not done: a run that created three tools
// and then failed still has no agent, and an offline evaluation says nothing about live behaviour.
//
// This module is pure and shared by the operator UI and the admin handler so both tell the same
// story. It never claims more than the stored facts support.

import { TOOL_NAMES } from './toolContracts.ts';
import type { ToolName } from './toolContracts.ts';

export type ProvisioningPhase =
  | 'config_invalid'
  | 'not_provisioned'
  | 'partially_provisioned'
  | 'provisioning_failed'
  | 'provisioned'
  | 'provider_drift';

export interface ProvisioningFacts {
  configValid: boolean;
  providerAgentId: string | null;
  /** The `toolIds` map from provider_state. */
  toolIds: Partial<Record<ToolName, string>>;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  /** Tool ids the provider does not currently have attached to the agent, from a `status` read. */
  toolDrift?: string[];
}

export interface ProvisioningStatus {
  phase: ProvisioningPhase;
  /** German, operator-facing. */
  label: string;
  /** What the operator should do next. Empty when nothing is required. */
  nextAction: string;
  toolsProvisioned: number;
  toolsExpected: number;
}

export function describeProvisioning(facts: ProvisioningFacts): ProvisioningStatus {
  const toolsExpected = TOOL_NAMES.length;
  const toolsProvisioned = TOOL_NAMES.filter((tool) => typeof facts.toolIds[tool] === 'string').length;
  const base = { toolsProvisioned, toolsExpected };

  if (!facts.configValid) {
    return { ...base, phase: 'config_invalid', label: 'Konfiguration ungültig', nextAction: 'ClientConfig im Tab Configuration korrigieren und speichern.' };
  }
  if (facts.lastSyncError) {
    return { ...base, phase: 'provisioning_failed', label: 'Provisionierung fehlgeschlagen', nextAction: 'Fehlermeldung unten lesen, Ursache beheben, dann erneut provisionieren. Bereits erstellte Ressourcen werden wiederverwendet.' };
  }
  if (!facts.providerAgentId) {
    return toolsProvisioned === 0
      ? { ...base, phase: 'not_provisioned', label: 'Nicht provisioniert', nextAction: 'Plan prüfen, dann „Agent erstellen (DEV)“.' }
      : { ...base, phase: 'partially_provisioned', label: 'Teilweise provisioniert', nextAction: `${toolsProvisioned} von ${toolsExpected} Tools existieren, aber noch kein Agent. Erneut provisionieren — der Lauf setzt auf dem Vorhandenen auf.` };
  }
  if (toolsProvisioned < toolsExpected) {
    return { ...base, phase: 'partially_provisioned', label: 'Teilweise provisioniert', nextAction: `Nur ${toolsProvisioned} von ${toolsExpected} Tools sind hinterlegt. Erneut provisionieren.` };
  }
  if (facts.toolDrift && facts.toolDrift.length > 0) {
    return { ...base, phase: 'provider_drift', label: 'Abweichung bei ElevenLabs', nextAction: `${facts.toolDrift.length} Tools sind am Agenten nicht verknüpft (manuell geändert?). Erneut provisionieren, um den Sollzustand zu schreiben.` };
  }
  if (!facts.lastSyncedAt) {
    return { ...base, phase: 'partially_provisioned', label: 'Agent vorhanden, nie synchronisiert', nextAction: 'Provisionierung ausführen, damit Prompt, Tools und Wissen geschrieben werden.' };
  }
  return { ...base, phase: 'provisioned', label: 'Provisioniert', nextAction: '' };
}

/**
 * What a given evaluation mode is actually evidence for. Kept next to the provisioning phases
 * because both answer the same operator question — "is this thing ready?" — and both are easy to
 * overclaim.
 */
export const EVALUATION_MODE_MEANING: Record<string, { label: string; evidence: string; provesLiveBehaviour: boolean }> = {
  offline_reference: {
    label: 'Offline-Referenz',
    evidence: 'Deterministische Prüfung der Tool-Verträge, Regeln und Adapter-Antworten gegen eine Referenz-Policy. Kein LLM, kein ElevenLabs-Agent. Beweist NICHT, wie das Sprachmodell im echten Gespräch antwortet.',
    provesLiveBehaviour: false,
  },
  elevenlabs_simulation: {
    label: 'ElevenLabs-Simulation',
    evidence: 'Der echte provisionierte Agent spricht mit einem LLM-Anrufer; Tools werden mit festen Ergebnissen gemockt. Beweist Prompt- und Tool-Verhalten, aber keine echte Buchung und keine Telefonqualität.',
    provesLiveBehaviour: true,
  },
  conversation_replay: {
    label: 'Echtgespräch-Auswertung',
    evidence: 'Auswertung eines tatsächlich geführten Gesprächs. Einziger Nachweis für reales Verhalten am Telefon.',
    provesLiveBehaviour: true,
  },
};
