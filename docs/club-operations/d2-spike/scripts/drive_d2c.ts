// D2c driver — invokes the local Edge Function and reports each criterion.
//
// Everything it touches is on 127.0.0.1 and belongs to the disposable local stack.
//
//   deno run --allow-net=127.0.0.1 --allow-write scripts/drive_d2c.ts <phase> <db-host> <db-port>

const FUNCTION_URL = 'http://127.0.0.1:54321/functions/v1/d2c-spike';

const phase = Deno.args[0] ?? 'all';
const dbHost = Deno.args[1] ?? 'supavisor';
const dbPort = Number(Deno.args[2] ?? 6543);

const conn = {
  host: dbHost,
  port: dbPort,
  user: Deno.args[3] ?? 'cq_readonly_spike',
  // Supplied per run; the spike role is a throwaway created by sql/01_fixture.sql.
  password: Deno.args[4] ?? Deno.env.get('SPIKE_DB_PASSWORD') ?? '',
  database: 'postgres',
};

async function call(action: string): Promise<{ status: number; ms: number; body: unknown }> {
  const t0 = performance.now();
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, conn }),
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, ms: performance.now() - t0, body };
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

const report: Record<string, unknown> = { conn: { ...conn, password: '<redacted>' } };

if (phase === 'all' || phase === 'basics') {
  for (const action of [
    'identity',
    'read',
    'read_forbidden_column',
    'mutations',
    'execute',
    'timeout',
  ]) {
    const result = await call(action);
    report[action] = result;
    console.error(`[${action}] status=${result.status} ${Math.round(result.ms)}ms`);
  }
}

if (phase === 'all' || phase === 'escape') {
  const result = await call('escape');
  report.escape = result;
  console.error(`[escape] status=${result.status} ${Math.round(result.ms)}ms`);
}

if (phase === 'all' || phase === 'load') {
  // ── 100 sequential invocations ──────────────────────────────────────────────
  const sequential: number[] = [];
  let sequentialFailures = 0;
  for (let i = 0; i < 100; i += 1) {
    const result = await call('ping');
    if (result.status !== 200 || (result.body as { fatal?: unknown })?.fatal) sequentialFailures += 1;
    sequential.push(result.ms);
  }

  // ── 20 concurrent invocations ───────────────────────────────────────────────
  const concurrentStart = performance.now();
  const concurrentResults = await Promise.all(
    Array.from({ length: 20 }, () => call('connection_stats')),
  );
  const concurrentWall = performance.now() - concurrentStart;
  const concurrentFailures = concurrentResults.filter(
    (result) => result.status !== 200 || (result.body as { fatal?: unknown })?.fatal,
  ).length;
  const observedConnections = concurrentResults
    .map((result) => (result.body as { stats?: { connections?: number } })?.stats?.connections)
    .filter((value): value is number => typeof value === 'number');

  report.load = {
    sequential: {
      count: sequential.length,
      failures: sequentialFailures,
      p50Ms: Math.round(percentile(sequential, 50)),
      p95Ms: Math.round(percentile(sequential, 95)),
      maxMs: Math.round(Math.max(...sequential)),
    },
    concurrent: {
      count: concurrentResults.length,
      failures: concurrentFailures,
      wallMs: Math.round(concurrentWall),
      maxBackendsObservedForRole: observedConnections.length ? Math.max(...observedConnections) : null,
      observedConnections,
      errors: concurrentResults
        .filter((result) => (result.body as { fatal?: unknown })?.fatal)
        .map((result) => (result.body as { fatal?: unknown }).fatal),
    },
  };
  console.error(`[load] sequential failures=${sequentialFailures} concurrent failures=${concurrentFailures}`);
}

if (phase === 'coldstart') {
  // Each sample opens a brand-new pooled connection from the function, which is the honest local
  // analogue of a cold start: no client, no pool and no server connection is reused from the caller.
  const samples: number[] = [];
  for (let i = 0; i < 30; i += 1) {
    const result = await call('ping');
    if (result.status === 200) samples.push(result.ms);
  }
  report.coldstart = {
    samples: samples.length,
    p50Ms: Math.round(percentile(samples, 50)),
    p95Ms: Math.round(percentile(samples, 95)),
    minMs: Math.round(Math.min(...samples)),
    maxMs: Math.round(Math.max(...samples)),
    allMs: samples.map((value) => Math.round(value)),
  };
  console.error(`[coldstart] p50=${report.coldstart.p50Ms}ms p95=${report.coldstart.p95Ms}ms`);
}

console.log(JSON.stringify(report, null, 2));
