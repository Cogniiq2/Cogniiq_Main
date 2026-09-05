// Runs the generated customer suite for the Haema Leipzig DEV config (and the Test Clinic) through the
// offline reference runner — proves a customer defined only by configuration passes the same checks.
import { generateCustomerScenarios, runReferenceConversation, evaluateTranscript, summarize, haemaLeipzigDevConfig, testClinicConfig } from '../../src/lib/goldenAgent/index.ts';

for (const [label, config] of [['Haema Leipzig DEV', haemaLeipzigDevConfig()], ['Test Clinic', testClinicConfig()]] as const) {
  const scenarios = generateCustomerScenarios(config);
  const results = [];
  for (const scenario of scenarios) {
    const { transcript } = await runReferenceConversation(config, scenario);
    results.push(evaluateTranscript(scenario, transcript));
  }
  const summary = summarize(results);
  console.log(`\n${label}: ${summary.passed}/${summary.total} passed`);
  for (const failure of summary.failures) {
    console.log(`- ${failure.scenarioId} ${failure.title}`);
    for (const finding of failure.findings) console.log(`    [${finding.dimension}] ${finding.message}`);
  }
}
