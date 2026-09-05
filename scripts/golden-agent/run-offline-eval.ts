// Runs the offline Golden Agent evaluation (reference conversations through the real tool runtime)
// and prints a per-dimension / per-category summary plus every failure with its findings.
// Usage: npx vite-node scripts/golden-agent/run-offline-eval.ts [--json] [--category booking_simple]
import { runOfflineEvaluation, testClinicConfig, scenarioCategoriesCovered, buildScenarioCatalog } from '../../src/lib/goldenAgent/index.ts';

const args = process.argv.slice(2);
const json = args.includes('--json');
const categoryIndex = args.indexOf('--category');
const categories = categoryIndex >= 0 ? [args[categoryIndex + 1]] : undefined;

const { results, summary } = await runOfflineEvaluation(testClinicConfig(), { categories });
if (json) {
  console.log(JSON.stringify({ summary, results: results.map((r) => ({ id: r.scenarioId, passed: r.passed, outcome: r.outcome, findings: r.findings })) }, null, 2));
} else {
  console.log(`Scenarios in catalog: ${buildScenarioCatalog().length}`);
  console.log(`Evaluated: ${summary.total}  passed: ${summary.passed}  failed: ${summary.failed}`);
  console.log('\nBy dimension:');
  for (const [dimension, stats] of Object.entries(summary.byDimension)) console.log(`  ${dimension.padEnd(26)} ${stats.passed}/${stats.applicable}  avg ${stats.averageScore}`);
  console.log('\nBy category:');
  for (const [category, stats] of Object.entries(summary.byCategory)) console.log(`  ${category.padEnd(28)} ${stats.passed}/${stats.total}`);
  console.log('\nCoverage:', JSON.stringify(scenarioCategoriesCovered(buildScenarioCatalog())));
  if (summary.failures.length) {
    console.log('\nFailures:');
    for (const failure of summary.failures) {
      console.log(`- ${failure.scenarioId} (${failure.category}) ${failure.title}`);
      for (const finding of failure.findings) console.log(`    [${finding.dimension}] ${finding.message}${finding.turn !== undefined ? ` (turn ${finding.turn})` : ''}`);
    }
  }
}
