// Golden Agent — public surface of the core.
//
// Browser code imports from here (dashboard, tests). Edge functions import the individual modules
// with relative `.ts` paths (Deno). Nothing in this tree reads environment variables or secrets.

export * from './clientConfig.ts';
export * from './toolContracts.ts';
export { ToolRuntime, localNowIso, describeLocationsForPrompt } from './toolRuntime.ts';
export type { ToolCallEvent, ToolRuntimeDependencies, ToolCallRequest } from './toolRuntime.ts';
export * from './openingHours.ts';
export * from './knowledge.ts';
export * from './prompt.ts';
export * from './agentFactory.ts';
export * from './elevenlabs/mapping.ts';
export type { BookingProvider, ProviderContext, CallerIdentity } from './adapters/bookingProvider.ts';
export { MockBookingProvider } from './adapters/mockBookingProvider.ts';
export { N8nBookingProvider } from './adapters/n8nBookingProvider.ts';
export * from './evaluation/types.ts';
export { buildScenarioCatalog, EVAL_NOW, scenarioCategoriesCovered } from './evaluation/scenarios.ts';
export { evaluateTranscript, runOfflineEvaluation, summarize, detectOutcome } from './evaluation/runner.ts';
export { runReferenceConversation } from './evaluation/referencePolicy.ts';
export { compileSimulationTest, normaliseElevenLabsTranscript, toolIdsFromWorkspace, EVAL_TEST_NAME_PREFIX } from './evaluation/elevenlabsEvaluation.ts';
export { testClinicConfig, TEST_CLINIC_CLIENT_ID } from './examples/testClinic.ts';
export { haemaLeipzigDevConfig } from './examples/haemaLeipzig.ts';
