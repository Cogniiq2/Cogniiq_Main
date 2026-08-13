// D2c — proof-of-mechanism Edge Function.
//
// Runs inside the LOCAL Supabase Edge runtime and connects to the LOCAL Supavisor pooler in
// transaction mode as a dedicated LOGIN role. Every connection parameter arrives in the request
// body from the local driver script: the function reads no environment variable and holds no
// credential of its own.
//
// `prepare: false` is mandatory in transaction mode — the pooler multiplexes server connections, so
// a prepared statement created on one is not available on the next.

import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js';

interface Conn {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function connect(conn: Conn) {
  return postgres({
    host: conn.host,
    port: conn.port,
    user: conn.user,
    password: conn.password,
    database: conn.database,
    // Transaction mode does not support prepared statements.
    prepare: false,
    max: 1,
    idle_timeout: 2,
    connect_timeout: 10,
    ssl: false,
    onnotice: () => {},
  });
}

interface Attempt {
  label: string;
  ok: boolean;
  error?: string;
  code?: string;
  detail?: unknown;
}

async function attempt(label: string, run: () => Promise<unknown>): Promise<Attempt> {
  try {
    const detail = await run();
    return { label, ok: true, detail };
  } catch (error) {
    const err = error as { message?: string; code?: string; routine?: string };
    return { label, ok: false, error: err?.message ?? String(error), code: err?.code };
  }
}

Deno.serve(async (req) => {
  const started = performance.now();
  let body: { action?: string; conn?: Conn };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'bad request body' }), { status: 400 });
  }

  const action = body.action ?? 'ping';
  const conn = body.conn;
  if (!conn) return new Response(JSON.stringify({ error: 'no conn' }), { status: 400 });

  const sql = connect(conn);
  const out: Record<string, unknown> = {
    action,
    runtime: {
      deno: Deno.version.deno,
      v8: Deno.version.v8,
      typescript: Deno.version.typescript,
    },
  };

  try {
    switch (action) {
      case 'ping': {
        const rows = await sql`select 1 as one`;
        out.rows = rows.length;
        break;
      }

      case 'identity': {
        const rows = await sql`
          select current_user            as current_user,
                 session_user            as session_user,
                 current_setting('default_transaction_read_only') as default_read_only,
                 current_setting('transaction_read_only')         as transaction_read_only,
                 current_setting('statement_timeout')             as statement_timeout,
                 inet_server_port()      as server_port,
                 version()               as server_version`;
        out.identity = rows[0];
        break;
      }

      case 'read': {
        const rows = await sql`
          select id, reference, court_key, amount_total, provider, status
          from spike.synthetic_bookings
          order by id
          limit 5`;
        const count = await sql`select count(*)::int as n from spike.synthetic_bookings`;
        out.sample = rows;
        out.total = count[0].n;
        break;
      }

      case 'read_forbidden_column': {
        out.attempt = await attempt('select secret_column', async () => {
          const rows = await sql`select secret_column from spike.synthetic_bookings limit 1`;
          return rows.length;
        });
        break;
      }

      case 'mutations': {
        const attempts: Attempt[] = [];
        attempts.push(
          await attempt('INSERT', async () => {
            const r = await sql`
              insert into spike.synthetic_bookings (reference, court_key, starts_at, amount_total, provider, status)
              values ('HACK-0001', 'padel-1', now(), 1.00, 'stripe', 'CONFIRMED')`;
            return r.count;
          }),
        );
        attempts.push(
          await attempt('UPDATE', async () => {
            const r = await sql`update spike.synthetic_bookings set status = 'HACKED' where id = 1`;
            return r.count;
          }),
        );
        attempts.push(
          await attempt('DELETE', async () => {
            const r = await sql`delete from spike.synthetic_bookings where id = 1`;
            return r.count;
          }),
        );
        attempts.push(
          await attempt('TRUNCATE', async () => {
            await sql`truncate spike.synthetic_bookings`;
            return 'truncated';
          }),
        );
        out.attempts = attempts;
        break;
      }

      case 'escape': {
        // Every documented way a client could try to leave read-only mode.
        const attempts: Attempt[] = [];

        attempts.push(
          await attempt('SET transaction_read_only = off (then INSERT)', async () => {
            await sql.unsafe(`set transaction_read_only = off`);
            const r = await sql.unsafe(
              `insert into spike.synthetic_bookings (reference, court_key, starts_at, amount_total, provider, status)
               values ('ESC-SET', 'padel-1', now(), 1.00, 'stripe', 'CONFIRMED')`,
            );
            return r.count;
          }),
        );

        attempts.push(
          await attempt('SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE (then INSERT)', async () => {
            await sql.unsafe(`set session characteristics as transaction read write`);
            const r = await sql.unsafe(
              `insert into spike.synthetic_bookings (reference, court_key, starts_at, amount_total, provider, status)
               values ('ESC-SESSCHAR', 'padel-1', now(), 1.00, 'stripe', 'CONFIRMED')`,
            );
            return r.count;
          }),
        );

        attempts.push(
          await attempt('BEGIN; SET TRANSACTION READ WRITE; INSERT; COMMIT', async () => {
            return await sql.begin(async (tx: ReturnType<typeof connect>) => {
              await tx.unsafe(`set transaction read write`);
              const r = await tx.unsafe(
                `insert into spike.synthetic_bookings (reference, court_key, starts_at, amount_total, provider, status)
                 values ('ESC-TXRW', 'padel-1', now(), 1.00, 'stripe', 'CONFIRMED')`,
              );
              return r.count;
            });
          }),
        );

        attempts.push(
          await attempt('fresh read-write transaction on a new connection', async () => {
            const fresh = connect(conn);
            try {
              return await fresh.begin(async (tx: ReturnType<typeof connect>) => {
                await tx.unsafe(`set transaction read write`);
                const r = await tx.unsafe(
                  `insert into spike.synthetic_bookings (reference, court_key, starts_at, amount_total, provider, status)
                   values ('ESC-FRESH', 'padel-1', now(), 1.00, 'stripe', 'CONFIRMED')`,
                );
                return r.count;
              });
            } finally {
              await fresh.end({ timeout: 5 });
            }
          }),
        );

        attempts.push(
          await attempt('RESET ALL then INSERT', async () => {
            await sql.unsafe(`reset all`);
            const r = await sql.unsafe(
              `insert into spike.synthetic_bookings (reference, court_key, starts_at, amount_total, provider, status)
               values ('ESC-RESET', 'padel-1', now(), 1.00, 'stripe', 'CONFIRMED')`,
            );
            return r.count;
          }),
        );

        attempts.push(
          await attempt('ALTER ROLE self SET default_transaction_read_only = off', async () => {
            await sql.unsafe(`alter role cq_readonly_spike set default_transaction_read_only = off`);
            return 'altered';
          }),
        );

        out.attempts = attempts;
        break;
      }

      case 'execute': {
        const attempts: Attempt[] = [];
        attempts.push(
          await attempt('EXECUTE spike.arbitrary_function()', async () => {
            const rows = await sql`select spike.arbitrary_function() as v`;
            return rows[0];
          }),
        );
        attempts.push(
          await attempt('EXECUTE spike.writing_function()', async () => {
            const rows = await sql`select spike.writing_function()`;
            return rows.length;
          }),
        );
        attempts.push(
          await attempt('EXECUTE pg_read_file (superuser function)', async () => {
            const rows = await sql`select pg_read_file('/etc/hostname') as v`;
            return rows[0];
          }),
        );
        attempts.push(
          await attempt('COPY FROM PROGRAM', async () => {
            await sql.unsafe(`copy spike.synthetic_payments from program 'echo hi'`);
            return 'copied';
          }),
        );
        out.attempts = attempts;
        break;
      }

      case 'timeout': {
        const t0 = performance.now();
        const result = await attempt('pg_sleep(10) against a 2s statement_timeout', async () => {
          const rows = await sql`select spike.sleep_seconds(10) as v`;
          return rows[0];
        });
        out.attempt = result;
        out.elapsedMs = Math.round(performance.now() - t0);
        break;
      }

      case 'connection_stats': {
        const rows = await sql`
          select count(*)::int as connections
          from pg_stat_activity
          where usename = current_user`;
        out.stats = rows[0];
        break;
      }

      default:
        out.error = `unknown action ${action}`;
    }
  } catch (error) {
    const err = error as { message?: string; code?: string };
    out.fatal = { message: err?.message ?? String(error), code: err?.code };
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {});
  }

  out.serverElapsedMs = Math.round(performance.now() - started);
  return new Response(JSON.stringify(out), {
    headers: { 'content-type': 'application/json' },
  });
});
