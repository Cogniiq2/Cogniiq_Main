// Prints the exact ElevenLabs request bodies the factory would send for the Haema DEV config, so they
// can be verified against the real API (through the connector) without any secret in the repo.
import { writeFileSync } from 'node:fs';
import { buildAgentBody, buildWebhookToolConfig, composeGoldenAgentPrompt, haemaLeipzigDevConfig, TOOL_NAMES } from '../../src/lib/goldenAgent/index.ts';

const config = haemaLeipzigDevConfig();
const prompt = composeGoldenAgentPrompt(config);
const target = { endpointUrl: 'https://example.invalid/functions/v1/receptionist-tools', authorization: { bearer: 'dev-placeholder' } as const };
const tools = Object.fromEntries(TOOL_NAMES.map((name) => [name, buildWebhookToolConfig(config, name, target)]));
const agent = buildAgentBody({ config, prompt, toolIds: ['TOOL_ID_PLACEHOLDER'], knowledgeBase: [], stage: 'dev' });
const out = process.argv[2] ?? 'elevenlabs-bodies.json';
writeFileSync(out, JSON.stringify({ tools, agent }, null, 2));
console.log(`wrote ${out}; prompt ${prompt.length} chars`);
