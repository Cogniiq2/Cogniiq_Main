import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const OURA_API_BASE = "https://api.ouraring.com/v2/usercollection";
const DEFAULT_SYNC_DAYS = 30;
const MAX_SYNC_DAYS = 90;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type JsonRecord = Record<string, unknown>;
type OuraEndpointKey =
  | "daily_sleep"
  | "daily_readiness"
  | "daily_activity"
  | "sleep_sessions"
  | "workouts"
  | "sessions"
  | "tags"
  | "heartrate"
  | "spo2"
  | "daily_stress"
  | "daily_resilience";

interface SyncRequest {
  connection_id?: string;
  days?: number;
  start_date?: string;
  end_date?: string;
}

interface OuraConnection extends JsonRecord {
  id: string;
  access_token?: string | null;
  refresh_token?: string | null;
}

interface EndpointResult {
  endpoint: OuraEndpointKey;
  table: string;
  ok: boolean;
  fetched: number;
  upserted: number;
  error: string | null;
}

interface EndpointConfig {
  endpoint: OuraEndpointKey;
  table: string;
  path: string;
  params: "date" | "datetime";
  onConflict: string;
  mapItem: (item: JsonRecord, index: number, connectionId: string) => JsonRecord | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asInteger(value: unknown): number | null {
  const parsed = asNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

function asDate(value: unknown): string | null {
  const text = asString(value);
  if (!text) return null;
  return text.slice(0, 10);
}

function asDateTime(value: unknown): string | null {
  const text = asString(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function getByPath(record: JsonRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, record);
}

function numberFrom(record: JsonRecord, paths: string[]): number | null {
  for (const path of paths) {
    const parsed = asNumber(getByPath(record, path));
    if (parsed !== null) return parsed;
  }
  return null;
}

function integerFrom(record: JsonRecord, paths: string[]): number | null {
  for (const path of paths) {
    const parsed = asInteger(getByPath(record, path));
    if (parsed !== null) return parsed;
  }
  return null;
}

function stringFrom(record: JsonRecord, paths: string[]): string | null {
  for (const path of paths) {
    const parsed = asString(getByPath(record, path));
    if (parsed) return parsed;
  }
  return null;
}

function recordFrom(record: JsonRecord, path: string): JsonRecord | null {
  const value = getByPath(record, path);
  return isRecord(value) ? value : null;
}

function stableId(item: JsonRecord, index: number, prefix: string): string {
  return stringFrom(item, ["id", "oura_id", "session_id", "workout_id", "tag_id"]) ??
    `${prefix}-${asDate(item.day) ?? asDate(item.date) ?? "unknown"}-${index}`;
}

function dateRange(body: SyncRequest): { startDate: string; endDate: string; startDateTime: string; endDateTime: string } {
  const now = new Date();
  const requestedDays = typeof body.days === "number" && Number.isFinite(body.days)
    ? Math.min(Math.max(Math.round(body.days), 1), MAX_SYNC_DAYS)
    : DEFAULT_SYNC_DAYS;

  const endDate = body.end_date ?? now.toISOString().slice(0, 10);
  const start = new Date(`${endDate}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - requestedDays + 1);
  const startDate = body.start_date ?? start.toISOString().slice(0, 10);

  return {
    startDate,
    endDate,
    startDateTime: `${startDate}T00:00:00.000Z`,
    endDateTime: `${endDate}T23:59:59.999Z`,
  };
}

function endpointUrl(config: EndpointConfig, range: ReturnType<typeof dateRange>): string {
  const url = new URL(`${OURA_API_BASE}${config.path}`);

  if (config.params === "datetime") {
    url.searchParams.set("start_datetime", range.startDateTime);
    url.searchParams.set("end_datetime", range.endDateTime);
  } else {
    url.searchParams.set("start_date", range.startDate);
    url.searchParams.set("end_date", range.endDate);
  }

  return url.toString();
}

function rowBase(connectionId: string, raw: JsonRecord): JsonRecord {
  return {
    connection_id: connectionId,
    raw,
    synced_at: new Date().toISOString(),
  };
}

const endpointConfigs: EndpointConfig[] = [
  {
    endpoint: "daily_sleep",
    table: "oura_daily_sleep",
    path: "/daily_sleep",
    params: "date",
    onConflict: "connection_id,day",
    mapItem: (item, _index, connectionId) => ({
      ...rowBase(connectionId, item),
      day: asDate(item.day),
      score: numberFrom(item, ["score"]),
      contributors: recordFrom(item, "contributors"),
    }),
  },
  {
    endpoint: "daily_readiness",
    table: "oura_daily_readiness",
    path: "/daily_readiness",
    params: "date",
    onConflict: "connection_id,day",
    mapItem: (item, _index, connectionId) => {
      const contributors = recordFrom(item, "contributors");
      return {
        ...rowBase(connectionId, item),
        day: asDate(item.day),
        score: numberFrom(item, ["score"]),
        contributors,
        temperature_deviation: numberFrom(item, ["temperature_deviation"]),
        hrv_balance: contributors ? numberFrom(contributors, ["hrv_balance"]) : null,
        recovery_index: contributors ? numberFrom(contributors, ["recovery_index"]) : null,
        resting_heart_rate_score: contributors ? numberFrom(contributors, ["resting_heart_rate"]) : null,
        body_temperature: contributors ? numberFrom(contributors, ["body_temperature"]) : null,
        previous_day_activity: contributors ? numberFrom(contributors, ["previous_day_activity"]) : null,
        sleep_balance: contributors ? numberFrom(contributors, ["sleep_balance"]) : null,
        activity_balance: contributors ? numberFrom(contributors, ["activity_balance"]) : null,
      };
    },
  },
  {
    endpoint: "daily_activity",
    table: "oura_daily_activity",
    path: "/daily_activity",
    params: "date",
    onConflict: "connection_id,day",
    mapItem: (item, _index, connectionId) => ({
      ...rowBase(connectionId, item),
      day: asDate(item.day),
      score: numberFrom(item, ["score"]),
      steps: integerFrom(item, ["steps"]),
      active_calories: numberFrom(item, ["active_calories", "active_calorie"]),
      equivalent_walking_distance: numberFrom(item, ["equivalent_walking_distance"]),
      high_activity_time: integerFrom(item, ["high_activity_time"]),
      medium_activity_time: integerFrom(item, ["medium_activity_time"]),
      low_activity_time: integerFrom(item, ["low_activity_time"]),
    }),
  },
  {
    endpoint: "sleep_sessions",
    table: "oura_sleep_sessions",
    path: "/sleep",
    params: "date",
    onConflict: "connection_id,oura_id",
    mapItem: (item, index, connectionId) => ({
      ...rowBase(connectionId, item),
      oura_id: stableId(item, index, "sleep"),
      day: asDate(item.day),
      type: stringFrom(item, ["type"]),
      bedtime_start: asDateTime(item.bedtime_start),
      bedtime_end: asDateTime(item.bedtime_end),
      score: numberFrom(item, ["score"]),
    }),
  },
  {
    endpoint: "workouts",
    table: "oura_workouts",
    path: "/workout",
    params: "date",
    onConflict: "connection_id,oura_id",
    mapItem: (item, index, connectionId) => ({
      ...rowBase(connectionId, item),
      oura_id: stableId(item, index, "workout"),
      day: asDate(item.day),
      activity: stringFrom(item, ["activity", "type"]),
      start_datetime: asDateTime(item.start_datetime),
      end_datetime: asDateTime(item.end_datetime),
      calories: numberFrom(item, ["calories"]),
      distance: numberFrom(item, ["distance"]),
    }),
  },
  {
    endpoint: "sessions",
    table: "oura_sessions",
    path: "/session",
    params: "date",
    onConflict: "connection_id,oura_id",
    mapItem: (item, index, connectionId) => ({
      ...rowBase(connectionId, item),
      oura_id: stableId(item, index, "session"),
      day: asDate(item.day),
      type: stringFrom(item, ["type"]),
      start_datetime: asDateTime(item.start_datetime),
      end_datetime: asDateTime(item.end_datetime),
    }),
  },
  {
    endpoint: "tags",
    table: "oura_tags",
    path: "/tag",
    params: "date",
    onConflict: "connection_id,oura_id",
    mapItem: (item, index, connectionId) => ({
      ...rowBase(connectionId, item),
      oura_id: stableId(item, index, "tag"),
      day: asDate(item.day) ?? asDate(item.start_datetime),
      tag: stringFrom(item, ["tag", "text", "type"]),
      start_datetime: asDateTime(item.start_datetime),
      end_datetime: asDateTime(item.end_datetime),
    }),
  },
  {
    endpoint: "heartrate",
    table: "oura_heart_rate",
    path: "/heartrate",
    params: "datetime",
    onConflict: "connection_id,timestamp",
    mapItem: (item, _index, connectionId) => ({
      ...rowBase(connectionId, item),
      timestamp: asDateTime(item.timestamp),
      bpm: numberFrom(item, ["bpm"]),
      source: stringFrom(item, ["source"]),
    }),
  },
  {
    endpoint: "spo2",
    table: "oura_spo2",
    path: "/daily_spo2",
    params: "date",
    onConflict: "connection_id,day",
    mapItem: (item, _index, connectionId) => ({
      ...rowBase(connectionId, item),
      day: asDate(item.day),
      spo2_percentage: numberFrom(item, ["spo2_percentage.average", "average", "spo2_percentage"]),
    }),
  },
  {
    endpoint: "daily_stress",
    table: "oura_daily_stress",
    path: "/daily_stress",
    params: "date",
    onConflict: "connection_id,day",
    mapItem: (item, _index, connectionId) => ({
      ...rowBase(connectionId, item),
      day: asDate(item.day),
      stress_high: integerFrom(item, ["stress_high"]),
      recovery_high: integerFrom(item, ["recovery_high"]),
      day_summary: stringFrom(item, ["day_summary"]),
    }),
  },
  {
    endpoint: "daily_resilience",
    table: "oura_daily_resilience",
    path: "/daily_resilience",
    params: "date",
    onConflict: "connection_id,day",
    mapItem: (item, _index, connectionId) => ({
      ...rowBase(connectionId, item),
      day: asDate(item.day),
      level: stringFrom(item, ["level"]),
      score: numberFrom(item, ["score"]),
    }),
  },
];

async function chunkedUpsert(
  supabase: ReturnType<typeof createClient>,
  table: string,
  rows: JsonRecord[],
  onConflict: string,
): Promise<number> {
  const chunkSize = 500;
  let upserted = 0;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict });

    if (error) throw new Error(error.message);
    upserted += chunk.length;
  }

  return upserted;
}

async function fetchOura(url: string, accessToken: string): Promise<JsonRecord[]> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Oura ${response.status}: ${detail || response.statusText}`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload)) return [];
  const data = payload.data;
  return Array.isArray(data) ? data.filter(isRecord) : [];
}

async function syncEndpoint(
  supabase: ReturnType<typeof createClient>,
  config: EndpointConfig,
  connectionId: string,
  accessToken: string,
  range: ReturnType<typeof dateRange>,
): Promise<EndpointResult> {
  try {
    const items = await fetchOura(endpointUrl(config, range), accessToken);
    const rows = items
      .map((item, index) => config.mapItem(item, index, connectionId))
      .filter((row): row is JsonRecord => {
        if (!row) return false;
        if (config.onConflict.includes("day") && !row.day) return false;
        if (config.onConflict.includes("timestamp") && !row.timestamp) return false;
        if (config.onConflict.includes("oura_id") && !row.oura_id) return false;
        return true;
      });

    const upserted = rows.length > 0
      ? await chunkedUpsert(supabase, config.table, rows, config.onConflict)
      : 0;

    return {
      endpoint: config.endpoint,
      table: config.table,
      ok: true,
      fetched: items.length,
      upserted,
      error: null,
    };
  } catch (error) {
    return {
      endpoint: config.endpoint,
      table: config.table,
      ok: false,
      fetched: 0,
      upserted: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase server environment variables" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: SyncRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const connectionId = body.connection_id;
  if (!connectionId) {
    return jsonResponse({ error: "Missing connection_id" }, 400);
  }

  const { data: connection, error: connectionError } = await supabase
    .from("oura_connections")
    .select("*")
    .eq("id", connectionId)
    .maybeSingle();

  if (connectionError) {
    return jsonResponse({ error: connectionError.message }, 500);
  }

  const ouraConnection = connection as OuraConnection | null;

  if (!ouraConnection?.access_token) {
    return jsonResponse({ error: "Oura connection not found or missing access token" }, 404);
  }

  const range = dateRange(body);
  const startedAt = new Date().toISOString();
  const results: EndpointResult[] = [];

  for (const config of endpointConfigs) {
    const result = await syncEndpoint(
      supabase,
      config,
      connectionId,
      ouraConnection.access_token,
      range,
    );
    results.push(result);
  }

  const failed = results.filter((result) => !result.ok);
  const totalUpserted = results.reduce((sum, result) => sum + result.upserted, 0);

  return jsonResponse({
    ok: failed.length === 0,
    connection_id: connectionId,
    range,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    total_upserted: totalUpserted,
    endpoint_count: results.length,
    success_count: results.length - failed.length,
    error_count: failed.length,
    endpoints: results,
  });
});
