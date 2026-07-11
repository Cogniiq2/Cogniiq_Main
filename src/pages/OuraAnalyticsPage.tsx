import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BatteryCharging,
  Brain,
  CalendarClock,
  Clock3,
  Footprints,
  Gauge,
  HeartPulse,
  Link2,
  Moon,
  RefreshCw,
  Sparkles,
  Thermometer,
  TriangleAlert,
  Waves,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { AdminGate } from '../components/admin/AdminGate';
import { AdminHeader } from '../components/admin/AdminHeader';
import { useAdminTheme } from '../hooks/useAdminTheme';

const OURA_CALLBACK_URL = 'https://lqgtmoulqzmrhglabrms.supabase.co/functions/v1/oura-callback';
const OURA_SYNC_URL = 'https://lqgtmoulqzmrhglabrms.supabase.co/functions/v1/sync-oura';
const OURA_CONNECTION_STORAGE_KEY = 'oura_connection_id';
const OURA_SCOPE = 'email personal daily heartrate workout tag session spo2Daily';

const COLORS = {
  cyan: 'var(--oura-accent)',
  cyanSoft: 'var(--oura-accent-soft)',
  emerald: 'var(--oura-recovery)',
  blue: 'var(--oura-sleep)',
  violet: 'var(--oura-strain)',
  amber: 'var(--oura-warning)',
  rose: 'var(--oura-danger)',
  text: 'var(--oura-text)',
  muted: 'var(--oura-muted)',
  faint: 'var(--oura-faint)',
  panel: 'var(--oura-panel)',
  panelStrong: 'var(--oura-panel-strong)',
  border: 'var(--oura-border)',
  grid: 'var(--oura-grid)',
  heroSurface: 'var(--oura-hero-surface)',
  chartBar: 'var(--oura-chart-bar)',
};

type NumericValue = number | string | null;
type JsonRecord = Record<string, unknown>;
type Notice = { type: 'success' | 'error' | 'warning'; message: string };
type StatusTone = 'optimal' | 'good' | 'fair' | 'attention' | 'neutral';

interface OuraTableRow extends JsonRecord {
  day?: string | null;
  score?: NumericValue;
  steps?: NumericValue;
}

interface OuraContributors {
  hrvBalance: number | null;
  recoveryIndex: number | null;
  restingHeartRate: number | null;
  bodyTemperature: number | null;
  previousDayActivity: number | null;
  sleepBalance: number | null;
  activityBalance: number | null;
}

interface OuraDailySummary {
  day: string;
  sleepScore: number | null;
  readinessScore: number | null;
  activityScore: number | null;
  steps: number | null;
  hrv: number | null;
  restingHeartRate: number | null;
  lowestHeartRate: number | null;
  respiratoryRate: number | null;
  temperatureDeviation: number | null;
  totalSleepDuration: number | null;
  timeInBed: number | null;
  sleepEfficiency: number | null;
  latency: number | null;
  remSleep: number | null;
  deepSleep: number | null;
  lightSleep: number | null;
  awakeTime: number | null;
  restfulness: number | null;
  activeCalories: number | null;
  walkingDistance: number | null;
  highActivityTime: number | null;
  mediumActivityTime: number | null;
  lowActivityTime: number | null;
  contributors: OuraContributors;
  lastSyncAt: string | null;
}

interface CallbackParams {
  connected: string | null;
  connectionId: string | null;
  error: string | null;
  hasParams: boolean;
}

interface ChartPoint {
  day: string;
  label: string;
  sleepScore: number | null;
  readinessScore: number | null;
  activityScore: number | null;
  steps: number | null;
  hrv: number | null;
  restingHeartRate: number | null;
  lowestHeartRate: number | null;
  respiratoryRate: number | null;
  temperatureDeviation: number | null;
  remSleepHours: number | null;
  deepSleepHours: number | null;
  lightSleepHours: number | null;
  awakeHours: number | null;
}

interface SummaryMetric {
  key: string;
  label: string;
  icon: LucideIcon;
  value: string;
  rawValue: number | null;
  unit?: string;
  status: string;
  tone: StatusTone;
  trend: string;
  trendDirection: 'up' | 'down' | 'flat';
  sparkline: Array<{ label: string; value: number | null }>;
}

interface Insight {
  tone: StatusTone;
  title: string;
  description: string;
}

const emptyContributors: OuraContributors = {
  hrvBalance: null,
  recoveryIndex: null,
  restingHeartRate: null,
  bodyTemperature: null,
  previousDayActivity: null,
  sleepBalance: null,
  activityBalance: null,
};

const glassPanelStyle: CSSProperties = {
  background: 'linear-gradient(145deg, color-mix(in srgb, var(--oura-panel-strong) 92%, transparent), color-mix(in srgb, var(--oura-panel) 82%, transparent))',
  border: `1px solid ${COLORS.border}`,
  boxShadow: 'var(--oura-panel-shadow)',
  backdropFilter: 'blur(22px)',
};

function getStoredConnectionId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(OURA_CONNECTION_STORAGE_KEY);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJsonRecord(value: unknown): JsonRecord | null {
  if (isRecord(value)) return value;
  if (typeof value !== 'string') return null;

  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getByPath(record: JsonRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, record);
}

function findDeepValue(record: JsonRecord, key: string, depth = 0): unknown {
  if (depth > 4) return undefined;
  if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];

  for (const value of Object.values(record)) {
    if (!isRecord(value)) continue;
    const nested = findDeepValue(value, key, depth + 1);
    if (nested !== undefined) return nested;
  }

  return undefined;
}

function candidateRecords(row: OuraTableRow): JsonRecord[] {
  const candidates: JsonRecord[] = [row];
  const rawKeys = ['raw', 'raw_json', 'raw_data', 'data', 'payload', 'oura_data', 'json', 'details'];

  rawKeys.forEach((key) => {
    const parsed = parseJsonRecord(row[key]);
    if (!parsed) return;
    candidates.push(parsed);

    const nestedData = parseJsonRecord(parsed.data);
    if (nestedData) candidates.push(nestedData);
  });

  return candidates;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readNumber(row: OuraTableRow, keys: string[]): number | null {
  for (const record of candidateRecords(row)) {
    for (const key of keys) {
      const direct = getByPath(record, key);
      const parsedDirect = toNumber(direct);
      if (parsedDirect !== null) return parsedDirect;

      const deep = findDeepValue(record, key);
      const parsedDeep = toNumber(deep);
      if (parsedDeep !== null) return parsedDeep;
    }
  }

  return null;
}

function readString(row: OuraTableRow, keys: string[]): string | null {
  for (const record of candidateRecords(row)) {
    for (const key of keys) {
      const direct = getByPath(record, key);
      if (typeof direct === 'string' && direct.trim()) return direct;

      const deep = findDeepValue(record, key);
      if (typeof deep === 'string' && deep.trim()) return deep;
    }
  }

  return null;
}

function createEmptySummary(day: string): OuraDailySummary {
  return {
    day,
    sleepScore: null,
    readinessScore: null,
    activityScore: null,
    steps: null,
    hrv: null,
    restingHeartRate: null,
    lowestHeartRate: null,
    respiratoryRate: null,
    temperatureDeviation: null,
    totalSleepDuration: null,
    timeInBed: null,
    sleepEfficiency: null,
    latency: null,
    remSleep: null,
    deepSleep: null,
    lightSleep: null,
    awakeTime: null,
    restfulness: null,
    activeCalories: null,
    walkingDistance: null,
    highActivityTime: null,
    mediumActivityTime: null,
    lowActivityTime: null,
    contributors: { ...emptyContributors },
    lastSyncAt: null,
  };
}

function ensureSummary(map: Map<string, OuraDailySummary>, day: string): OuraDailySummary {
  const existing = map.get(day);
  if (existing) return existing;

  const summary = createEmptySummary(day);
  map.set(day, summary);
  return summary;
}

function firstNumber(...values: Array<number | null>): number | null {
  return values.find((value) => value !== null) ?? null;
}

function updateLastSync(summary: OuraDailySummary, row: OuraTableRow) {
  summary.lastSyncAt = summary.lastSyncAt ?? readString(row, ['synced_at', 'updated_at', 'created_at', 'timestamp']);
}

function applySleepRow(summary: OuraDailySummary, row: OuraTableRow) {
  summary.sleepScore = firstNumber(summary.sleepScore, readNumber(row, ['score', 'sleep_score']));
  summary.hrv = firstNumber(summary.hrv, readNumber(row, ['average_hrv', 'hrv', 'heart_rate_variability', 'hrv_rmssd']));
  summary.restingHeartRate = firstNumber(summary.restingHeartRate, readNumber(row, ['resting_heart_rate', 'average_heart_rate', 'average_hr']));
  summary.lowestHeartRate = firstNumber(summary.lowestHeartRate, readNumber(row, ['lowest_heart_rate', 'lowest_hr']));
  summary.respiratoryRate = firstNumber(summary.respiratoryRate, readNumber(row, ['respiratory_rate', 'average_breath', 'average_breathing_rate']));
  summary.temperatureDeviation = firstNumber(summary.temperatureDeviation, readNumber(row, ['temperature_deviation', 'temperature_delta', 'body_temperature_deviation']));
  summary.totalSleepDuration = firstNumber(summary.totalSleepDuration, readNumber(row, ['total_sleep_duration', 'total_sleep', 'sleep_duration']));
  summary.timeInBed = firstNumber(summary.timeInBed, readNumber(row, ['time_in_bed']));
  summary.sleepEfficiency = firstNumber(summary.sleepEfficiency, readNumber(row, ['efficiency', 'sleep_efficiency']));
  summary.latency = firstNumber(summary.latency, readNumber(row, ['latency', 'sleep_latency']));
  summary.remSleep = firstNumber(summary.remSleep, readNumber(row, ['rem_sleep_duration', 'rem_sleep']));
  summary.deepSleep = firstNumber(summary.deepSleep, readNumber(row, ['deep_sleep_duration', 'deep_sleep']));
  summary.lightSleep = firstNumber(summary.lightSleep, readNumber(row, ['light_sleep_duration', 'light_sleep']));
  summary.awakeTime = firstNumber(summary.awakeTime, readNumber(row, ['awake_time', 'awake_duration']));
  summary.restfulness = firstNumber(summary.restfulness, readNumber(row, ['restfulness', 'contributors.restfulness']));
  updateLastSync(summary, row);
}

function applyReadinessRow(summary: OuraDailySummary, row: OuraTableRow) {
  summary.readinessScore = firstNumber(summary.readinessScore, readNumber(row, ['score', 'readiness_score']));
  summary.hrv = firstNumber(summary.hrv, readNumber(row, ['hrv', 'average_hrv', 'heart_rate_variability']));
  summary.restingHeartRate = firstNumber(summary.restingHeartRate, readNumber(row, ['resting_heart_rate', 'average_heart_rate']));
  summary.temperatureDeviation = firstNumber(summary.temperatureDeviation, readNumber(row, ['temperature_deviation', 'temperature_delta', 'body_temperature_deviation']));
  summary.contributors = {
    hrvBalance: firstNumber(summary.contributors.hrvBalance, readNumber(row, ['contributors.hrv_balance', 'hrv_balance'])),
    recoveryIndex: firstNumber(summary.contributors.recoveryIndex, readNumber(row, ['contributors.recovery_index', 'recovery_index'])),
    restingHeartRate: firstNumber(summary.contributors.restingHeartRate, readNumber(row, ['contributors.resting_heart_rate', 'resting_heart_rate_score'])),
    bodyTemperature: firstNumber(summary.contributors.bodyTemperature, readNumber(row, ['contributors.body_temperature', 'body_temperature'])),
    previousDayActivity: firstNumber(summary.contributors.previousDayActivity, readNumber(row, ['contributors.previous_day_activity', 'previous_day_activity'])),
    sleepBalance: firstNumber(summary.contributors.sleepBalance, readNumber(row, ['contributors.sleep_balance', 'sleep_balance'])),
    activityBalance: firstNumber(summary.contributors.activityBalance, readNumber(row, ['contributors.activity_balance', 'activity_balance'])),
  };
  updateLastSync(summary, row);
}

function applyActivityRow(summary: OuraDailySummary, row: OuraTableRow) {
  summary.activityScore = firstNumber(summary.activityScore, readNumber(row, ['score', 'activity_score']));
  summary.steps = firstNumber(summary.steps, readNumber(row, ['steps']));
  summary.activeCalories = firstNumber(summary.activeCalories, readNumber(row, ['active_calories', 'active_calorie']));
  summary.walkingDistance = firstNumber(summary.walkingDistance, readNumber(row, ['equivalent_walking_distance', 'walking_distance', 'distance']));
  summary.highActivityTime = firstNumber(summary.highActivityTime, readNumber(row, ['high_activity_time', 'high_activity_duration']));
  summary.mediumActivityTime = firstNumber(summary.mediumActivityTime, readNumber(row, ['medium_activity_time', 'medium_activity_duration']));
  summary.lowActivityTime = firstNumber(summary.lowActivityTime, readNumber(row, ['low_activity_time', 'low_activity_duration']));
  updateLastSync(summary, row);
}

function mergeDailyRows(
  sleepRows: OuraTableRow[],
  readinessRows: OuraTableRow[],
  activityRows: OuraTableRow[],
): OuraDailySummary[] {
  const byDay = new Map<string, OuraDailySummary>();

  sleepRows.forEach((row) => {
    const day = typeof row.day === 'string' ? row.day : readString(row, ['day', 'date']);
    if (!day) return;
    applySleepRow(ensureSummary(byDay, day), row);
  });

  readinessRows.forEach((row) => {
    const day = typeof row.day === 'string' ? row.day : readString(row, ['day', 'date']);
    if (!day) return;
    applyReadinessRow(ensureSummary(byDay, day), row);
  });

  activityRows.forEach((row) => {
    const day = typeof row.day === 'string' ? row.day : readString(row, ['day', 'date']);
    if (!day) return;
    applyActivityRow(ensureSummary(byDay, day), row);
  });

  return Array.from(byDay.values())
    .sort((a, b) => b.day.localeCompare(a.day))
    .slice(0, 30);
}

function getCallbackParams(): CallbackParams {
  const sources = [new URLSearchParams(window.location.search)];
  const hashQueryIndex = window.location.hash.indexOf('?');

  if (hashQueryIndex >= 0) {
    sources.push(new URLSearchParams(window.location.hash.slice(hashQueryIndex + 1)));
  }

  const readParam = (key: string): string | null => {
    for (const source of sources) {
      const value = source.get(key);
      if (value) return value;
    }
    return null;
  };

  const connected = readParam('connected');
  const connectionId = readParam('connection_id');
  const error = readParam('error');

  return {
    connected,
    connectionId,
    error,
    hasParams: Boolean(connected || connectionId || error),
  };
}

function clearCallbackParams() {
  const hash = window.location.hash;
  const hashQueryIndex = hash.indexOf('?');
  const cleanHash = hashQueryIndex >= 0 ? hash.slice(0, hashQueryIndex) : hash;
  const cleanUrl = `${window.location.origin}${window.location.pathname}${cleanHash}`;
  window.history.replaceState(null, document.title, cleanUrl);
}

function numericAverage(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (present.length === 0) return null;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

function formatScore(value: number | null): string {
  return value === null ? 'No data' : String(Math.round(value));
}

function formatInteger(value: number | null): string {
  return value === null ? 'No data' : new Intl.NumberFormat('en-US').format(Math.round(value));
}

function formatDecimal(value: number | null, digits = 1): string {
  return value === null ? 'No data' : value.toFixed(digits);
}

function formatSignedDecimal(value: number | null, digits = 1): string {
  if (value === null) return 'No data';
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;
}

function secondsToHours(value: number | null): number | null {
  if (value === null) return null;
  return value / 3600;
}

function formatDuration(value: number | null): string {
  if (value === null) return 'No data';

  const totalMinutes = Math.round(value / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function formatDistanceMeters(value: number | null): string {
  if (value === null) return 'No data';
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  return `${Math.round(value)} m`;
}

function formatDay(value: string | null): string {
  if (!value) return 'No data';

  const dateParts = value.split('-').map(Number);
  if (dateParts.length === 3 && dateParts.every(Number.isFinite)) {
    const [year, month, day] = dateParts;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  return value;
}

function shortDay(value: string): string {
  const dateParts = value.split('-').map(Number);
  if (dateParts.length !== 3 || !dateParts.every(Number.isFinite)) return value;

  const [year, month, day] = dateParts;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'No synced rows yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return formatDay(value);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function statusFromScore(value: number | null): { label: string; tone: StatusTone } {
  if (value === null) return { label: 'Not available', tone: 'neutral' };
  if (value >= 85) return { label: 'Optimal', tone: 'optimal' };
  if (value >= 75) return { label: 'Good', tone: 'good' };
  if (value >= 60) return { label: 'Fair', tone: 'fair' };
  return { label: 'Pay attention', tone: 'attention' };
}

function statusFromHrv(value: number | null, baseline: number | null): { label: string; tone: StatusTone } {
  if (value === null) return { label: 'Not available', tone: 'neutral' };
  if (baseline === null || baseline <= 0) return { label: 'Good', tone: 'good' };
  if (value >= baseline) return { label: 'Optimal', tone: 'optimal' };
  if (value >= baseline * 0.9) return { label: 'Good', tone: 'good' };
  if (value >= baseline * 0.8) return { label: 'Fair', tone: 'fair' };
  return { label: 'Pay attention', tone: 'attention' };
}

function statusFromRestingHeartRate(value: number | null, baseline: number | null): { label: string; tone: StatusTone } {
  if (value === null) return { label: 'Not available', tone: 'neutral' };
  if (baseline === null || baseline <= 0) return { label: 'Good', tone: 'good' };
  if (value <= baseline) return { label: 'Optimal', tone: 'optimal' };
  if (value <= baseline * 1.04) return { label: 'Good', tone: 'good' };
  if (value <= baseline * 1.08) return { label: 'Fair', tone: 'fair' };
  return { label: 'Pay attention', tone: 'attention' };
}

function statusFromTemperature(value: number | null): { label: string; tone: StatusTone } {
  if (value === null) return { label: 'Not available', tone: 'neutral' };
  const absolute = Math.abs(value);
  if (absolute <= 0.2) return { label: 'Optimal', tone: 'optimal' };
  if (absolute <= 0.5) return { label: 'Good', tone: 'good' };
  if (absolute <= 0.9) return { label: 'Fair', tone: 'fair' };
  return { label: 'Pay attention', tone: 'attention' };
}

function statusFromSteps(value: number | null): { label: string; tone: StatusTone } {
  if (value === null) return { label: 'Not available', tone: 'neutral' };
  if (value >= 10000) return { label: 'Optimal', tone: 'optimal' };
  if (value >= 7500) return { label: 'Good', tone: 'good' };
  if (value >= 4500) return { label: 'Fair', tone: 'fair' };
  return { label: 'Pay attention', tone: 'attention' };
}

function trendText(current: number | null, previousValues: Array<number | null>, lowerIsBetter = false): { text: string; direction: 'up' | 'down' | 'flat' } {
  const baseline = numericAverage(previousValues);
  if (current === null || baseline === null) return { text: 'No 7-day trend', direction: 'flat' };

  const delta = current - baseline;
  const displayDelta = Math.abs(delta) >= 10 ? Math.round(delta) : Number(delta.toFixed(1));
  if (Math.abs(delta) < 0.5) return { text: 'Flat vs 7-day avg', direction: 'flat' };

  const positive = lowerIsBetter ? delta < 0 : delta > 0;
  return {
    text: `${positive ? '+' : '-'}${Math.abs(displayDelta)} vs 7-day avg`,
    direction: positive ? 'up' : 'down',
  };
}

function metricValue(row: OuraDailySummary, key: keyof OuraDailySummary): number | null {
  const value = row[key];
  return typeof value === 'number' ? value : null;
}

function buildSparkline(rows: OuraDailySummary[], key: keyof OuraDailySummary) {
  return rows
    .slice(0, 7)
    .reverse()
    .map((row) => ({ label: shortDay(row.day), value: metricValue(row, key) }));
}

function buildSummaryMetrics(rows: OuraDailySummary[]): SummaryMetric[] {
  const latest = rows[0] ?? null;
  const previousSeven = rows.slice(1, 8);
  const hrvBaseline = numericAverage(previousSeven.map((row) => row.hrv));
  const rhrBaseline = numericAverage(previousSeven.map((row) => row.restingHeartRate));
  const recoveryIndex = latest?.contributors.recoveryIndex ?? latest?.readinessScore ?? null;
  const recoveryTrend = trendText(recoveryIndex, previousSeven.map((row) => row.contributors.recoveryIndex ?? row.readinessScore));
  const sleepTrend = trendText(latest?.sleepScore ?? null, previousSeven.map((row) => row.sleepScore));
  const readinessTrend = trendText(latest?.readinessScore ?? null, previousSeven.map((row) => row.readinessScore));
  const activityTrend = trendText(latest?.activityScore ?? null, previousSeven.map((row) => row.activityScore));
  const hrvTrend = trendText(latest?.hrv ?? null, previousSeven.map((row) => row.hrv));
  const rhrTrend = trendText(latest?.restingHeartRate ?? null, previousSeven.map((row) => row.restingHeartRate), true);
  const stepsTrend = trendText(latest?.steps ?? null, previousSeven.map((row) => row.steps));
  const tempTrend = trendText(latest?.temperatureDeviation ?? null, previousSeven.map((row) => row.temperatureDeviation), true);
  const recoveryStatus = statusFromScore(recoveryIndex);
  const sleepStatus = statusFromScore(latest?.sleepScore ?? null);
  const readinessStatus = statusFromScore(latest?.readinessScore ?? null);
  const activityStatus = statusFromScore(latest?.activityScore ?? null);
  const hrvStatus = statusFromHrv(latest?.hrv ?? null, hrvBaseline);
  const rhrStatus = statusFromRestingHeartRate(latest?.restingHeartRate ?? null, rhrBaseline);
  const stepsStatus = statusFromSteps(latest?.steps ?? null);
  const tempStatus = statusFromTemperature(latest?.temperatureDeviation ?? null);

  return [
    {
      key: 'recovery',
      label: 'Recovery Index',
      icon: Brain,
      value: formatScore(recoveryIndex),
      rawValue: recoveryIndex,
      status: recoveryStatus.label,
      tone: recoveryStatus.tone,
      trend: recoveryTrend.text,
      trendDirection: recoveryTrend.direction,
      sparkline: rows.slice(0, 7).reverse().map((row) => ({
        label: shortDay(row.day),
        value: row.contributors.recoveryIndex ?? row.readinessScore,
      })),
    },
    {
      key: 'sleep',
      label: 'Sleep Score',
      icon: Moon,
      value: formatScore(latest?.sleepScore ?? null),
      rawValue: latest?.sleepScore ?? null,
      status: sleepStatus.label,
      tone: sleepStatus.tone,
      trend: sleepTrend.text,
      trendDirection: sleepTrend.direction,
      sparkline: buildSparkline(rows, 'sleepScore'),
    },
    {
      key: 'readiness',
      label: 'Readiness Score',
      icon: BatteryCharging,
      value: formatScore(latest?.readinessScore ?? null),
      rawValue: latest?.readinessScore ?? null,
      status: readinessStatus.label,
      tone: readinessStatus.tone,
      trend: readinessTrend.text,
      trendDirection: readinessTrend.direction,
      sparkline: buildSparkline(rows, 'readinessScore'),
    },
    {
      key: 'activity',
      label: 'Activity Score',
      icon: Activity,
      value: formatScore(latest?.activityScore ?? null),
      rawValue: latest?.activityScore ?? null,
      status: activityStatus.label,
      tone: activityStatus.tone,
      trend: activityTrend.text,
      trendDirection: activityTrend.direction,
      sparkline: buildSparkline(rows, 'activityScore'),
    },
    {
      key: 'hrv',
      label: 'HRV',
      icon: Waves,
      value: formatDecimal(latest?.hrv ?? null, 0),
      rawValue: latest?.hrv ?? null,
      unit: 'ms',
      status: hrvStatus.label,
      tone: hrvStatus.tone,
      trend: hrvTrend.text,
      trendDirection: hrvTrend.direction,
      sparkline: buildSparkline(rows, 'hrv'),
    },
    {
      key: 'rhr',
      label: 'Resting Heart Rate',
      icon: HeartPulse,
      value: formatDecimal(latest?.restingHeartRate ?? null, 0),
      rawValue: latest?.restingHeartRate ?? null,
      unit: 'bpm',
      status: rhrStatus.label,
      tone: rhrStatus.tone,
      trend: rhrTrend.text,
      trendDirection: rhrTrend.direction,
      sparkline: buildSparkline(rows, 'restingHeartRate'),
    },
    {
      key: 'steps',
      label: 'Steps',
      icon: Footprints,
      value: formatInteger(latest?.steps ?? null),
      rawValue: latest?.steps ?? null,
      status: stepsStatus.label,
      tone: stepsStatus.tone,
      trend: stepsTrend.text,
      trendDirection: stepsTrend.direction,
      sparkline: buildSparkline(rows, 'steps'),
    },
    {
      key: 'temperature',
      label: 'Body Temperature Deviation',
      icon: Thermometer,
      value: formatSignedDecimal(latest?.temperatureDeviation ?? null, 1),
      rawValue: latest?.temperatureDeviation ?? null,
      unit: 'C',
      status: tempStatus.label,
      tone: tempStatus.tone,
      trend: tempTrend.text,
      trendDirection: tempTrend.direction,
      sparkline: buildSparkline(rows, 'temperatureDeviation'),
    },
  ];
}

function buildChartPoints(rows: OuraDailySummary[]): ChartPoint[] {
  return rows
    .slice()
    .reverse()
    .map((row) => ({
      day: row.day,
      label: shortDay(row.day),
      sleepScore: row.sleepScore,
      readinessScore: row.readinessScore,
      activityScore: row.activityScore,
      steps: row.steps,
      hrv: row.hrv,
      restingHeartRate: row.restingHeartRate,
      lowestHeartRate: row.lowestHeartRate,
      respiratoryRate: row.respiratoryRate,
      temperatureDeviation: row.temperatureDeviation,
      remSleepHours: secondsToHours(row.remSleep),
      deepSleepHours: secondsToHours(row.deepSleep),
      lightSleepHours: secondsToHours(row.lightSleep),
      awakeHours: secondsToHours(row.awakeTime),
    }));
}

function buildInsights(rows: OuraDailySummary[]): Insight[] {
  const latest = rows[0];
  if (!latest) return [];

  const previousSeven = rows.slice(1, 8);
  const readinessAverage = numericAverage(previousSeven.map((row) => row.readinessScore));
  const hrvAverage = numericAverage(previousSeven.map((row) => row.hrv));
  const rhrAverage = numericAverage(previousSeven.map((row) => row.restingHeartRate));
  const insights: Insight[] = [];

  if (latest.readinessScore !== null && readinessAverage !== null && latest.readinessScore < readinessAverage - 10) {
    insights.push({
      tone: 'attention',
      title: 'Recovery warning',
      description: `Readiness is ${Math.round(readinessAverage - latest.readinessScore)} points below the 7-day baseline. Reduce load and prioritize recovery today.`,
    });
  }

  if (latest.sleepScore !== null && latest.sleepScore < 70) {
    insights.push({
      tone: 'fair',
      title: 'Sleep priority',
      description: 'Sleep score is below 70. Shift the next cycle toward earlier wind-down, lower evening stimulation, and more time in bed.',
    });
  }

  if ((latest.activityScore ?? 0) >= 85 && (latest.readinessScore ?? 100) < 70) {
    insights.push({
      tone: 'attention',
      title: 'Overreaching risk',
      description: 'Activity is high while readiness is low. This pattern can signal accumulated strain. Keep intensity controlled.',
    });
  }

  if (latest.hrv !== null && hrvAverage !== null && latest.hrv < hrvAverage * 0.85) {
    insights.push({
      tone: 'attention',
      title: 'Nervous-system fatigue',
      description: 'HRV is more than 15% below the 7-day average. Favor low-intensity work, hydration, and sleep consistency.',
    });
  }

  if (latest.restingHeartRate !== null && rhrAverage !== null && latest.restingHeartRate > rhrAverage * 1.05) {
    insights.push({
      tone: 'fair',
      title: 'Recovery stress signal',
      description: 'Resting heart rate is elevated versus baseline. Watch caffeine, illness signals, heat, and training load.',
    });
  }

  if (insights.length === 0) {
    insights.push({
      tone: 'optimal',
      title: 'Stable biometric profile',
      description: 'No major recovery warnings detected from the synced Oura metrics. Keep the routine steady and continue monitoring trends.',
    });
  }

  return insights.slice(0, 4);
}

function hasAnyValue(points: ChartPoint[], keys: Array<keyof ChartPoint>): boolean {
  return points.some((point) => keys.some((key) => typeof point[key] === 'number'));
}

function toneColor(tone: StatusTone): string {
  if (tone === 'optimal') return COLORS.emerald;
  if (tone === 'good') return COLORS.cyan;
  if (tone === 'fair') return COLORS.amber;
  if (tone === 'attention') return COLORS.rose;
  return COLORS.faint;
}

function AmbientLayer() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 15% -8%, color-mix(in srgb, var(--oura-accent) 16%, transparent), transparent 32%), radial-gradient(circle at 84% 8%, color-mix(in srgb, var(--oura-recovery) 12%, transparent), transparent 28%), linear-gradient(180deg, var(--admin-bg) 0%, var(--admin-bg-subtle) 48%, var(--admin-bg) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(var(--admin-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--admin-grid-line) 1px, transparent 1px)',
          backgroundSize: '58px 58px',
          maskImage: 'linear-gradient(to bottom, black, transparent 78%)',
        }}
      />
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--oura-accent) 45%, transparent), transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

function ChartShell({ title, eyebrow, children, action }: { title: string; eyebrow: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-[1.75rem] p-4 sm:p-5" style={glassPanelStyle}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: COLORS.cyan }}>
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]" style={{ color: COLORS.text }}>
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyPanel({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.5rem] border px-6 py-12 text-center" style={{ borderColor: COLORS.border, background: COLORS.heroSurface }}>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl" style={{ background: COLORS.cyanSoft, border: `1px solid ${COLORS.border}` }}>
        <Sparkles size={24} color={COLORS.cyan} />
      </div>
      <h3 className="text-xl font-semibold tracking-[-0.035em]" style={{ color: COLORS.text }}>
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6" style={{ color: COLORS.muted }}>
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function SummaryCard({ metric }: { metric: SummaryMetric }) {
  const Icon = metric.icon;
  const accent = toneColor(metric.tone);
  const hasSparkline = metric.sparkline.some((point) => typeof point.value === 'number');

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[1.55rem] border p-4"
      style={{
        background: 'linear-gradient(145deg, color-mix(in srgb, var(--oura-panel-strong) 82%, transparent), color-mix(in srgb, var(--oura-panel) 74%, transparent))',
        borderColor: COLORS.border,
        boxShadow: 'var(--oura-panel-shadow)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)` }}>
          <Icon size={19} color={accent} />
        </div>
        <span className="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]" style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, border: `1px solid color-mix(in srgb, ${accent} 24%, transparent)` }}>
          {metric.status}
        </span>
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: COLORS.faint }}>
        {metric.label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-mono text-3xl font-semibold tracking-[-0.05em]" style={{ color: COLORS.text }}>
          {metric.value}
        </p>
        {metric.unit && metric.rawValue !== null && (
          <span className="font-mono text-xs" style={{ color: COLORS.muted }}>
            {metric.unit}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs" style={{ color: metric.trendDirection === 'down' ? COLORS.rose : metric.trendDirection === 'up' ? COLORS.emerald : COLORS.muted }}>
        {metric.trend}
      </p>

      <div className="mt-4 h-12">
        {hasSparkline ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metric.sparkline}>
              <Line type="monotone" dataKey="value" stroke={accent} strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center text-xs" style={{ color: COLORS.faint }}>
            No trend data
          </div>
        )}
      </div>
    </motion.div>
  );
}

function HeroButton({ icon: Icon, label, onClick, disabled, primary = false }: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background: primary ? 'linear-gradient(135deg, color-mix(in srgb, var(--oura-accent) 18%, transparent), color-mix(in srgb, var(--oura-recovery) 14%, transparent))' : 'var(--oura-button-bg)',
        border: `1px solid ${primary ? 'color-mix(in srgb, var(--oura-accent) 35%, transparent)' : COLORS.border}`,
        color: primary ? COLORS.cyan : COLORS.text,
        boxShadow: primary ? '0 0 34px color-mix(in srgb, var(--oura-accent) 13%, transparent)' : 'none',
      }}
    >
      <Icon size={15} className={disabled ? 'animate-spin' : undefined} />
      {label}
    </button>
  );
}

function MetricMini({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: COLORS.border, background: COLORS.heroSurface }}>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={14} color={COLORS.cyan} />
        <span className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: COLORS.faint }}>
          {label}
        </span>
      </div>
      <p className="font-mono text-sm font-semibold" style={{ color: COLORS.text }}>
        {value}
      </p>
    </div>
  );
}

function ContributorCard({ label, value }: { label: string; value: number | null }) {
  const status = statusFromScore(value);
  const accent = toneColor(status.tone);

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: COLORS.border, background: COLORS.heroSurface }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold" style={{ color: COLORS.text }}>
          {label}
        </p>
        <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 14px ${accent}` }} />
      </div>
      <p className="font-mono text-2xl font-semibold" style={{ color: value === null ? COLORS.faint : accent }}>
        {value === null ? 'Not available' : Math.round(value)}
      </p>
      {value !== null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: COLORS.grid }}>
          <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: accent }} />
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const accent = toneColor(insight.tone);

  return (
    <div className="rounded-3xl border p-4" style={{ borderColor: `color-mix(in srgb, ${accent} 28%, transparent)`, background: `linear-gradient(145deg, color-mix(in srgb, ${accent} 10%, transparent), var(--oura-hero-surface))` }}>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={15} color={accent} />
        <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: accent }}>
          Insight Engine
        </p>
      </div>
      <h3 className="text-base font-semibold tracking-[-0.025em]" style={{ color: COLORS.text }}>
        {insight.title}
      </h3>
      <p className="mt-2 text-sm leading-6" style={{ color: COLORS.muted }}>
        {insight.description}
      </p>
    </div>
  );
}

function NoticeToast({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const accent = notice.type === 'success' ? COLORS.emerald : notice.type === 'warning' ? COLORS.amber : COLORS.rose;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed bottom-6 right-6 z-[500] flex max-w-[380px] items-start gap-3 rounded-2xl border px-4 py-3 font-mono text-sm"
      style={{
        background: COLORS.panelStrong,
        borderColor: `color-mix(in srgb, ${accent} 34%, transparent)`,
        color: accent,
        boxShadow: 'var(--oura-panel-shadow)',
      }}
    >
      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: accent }} />
      <span className="min-w-0 flex-1 break-words">{notice.message}</span>
      <button type="button" onClick={onClose} className="rounded-lg p-1 transition-all hover:scale-105" style={{ color: accent }}>
        <X size={14} />
      </button>
    </motion.div>
  );
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 rounded-[1.4rem] border px-5 py-4"
      style={{ borderColor: 'var(--admin-danger-border)', background: 'var(--admin-danger-bg)' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <TriangleAlert size={17} className="mt-0.5 flex-shrink-0" style={{ color: COLORS.rose }} />
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold" style={{ color: COLORS.rose }}>
              Oura data load failed
            </p>
            <p className="mt-1 break-words font-mono text-xs leading-5" style={{ color: COLORS.rose, opacity: 0.8 }}>
              {message}
            </p>
          </div>
        </div>
        <HeroButton icon={RefreshCw} label="Retry" onClick={onRetry} />
      </div>
    </motion.div>
  );
}

export function OuraAnalyticsPage() {
  const { theme, toggleTheme } = useAdminTheme();
  const [connectionId, setConnectionId] = useState<string | null>(() => getStoredConnectionId());
  const [dailyRows, setDailyRows] = useState<OuraDailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const handledCallbackRef = useRef(false);

  const latestRow = dailyRows[0] ?? null;
  const isConnected = Boolean(connectionId);
  const chartPoints = useMemo(() => buildChartPoints(dailyRows), [dailyRows]);
  const summaryMetrics = useMemo(() => buildSummaryMetrics(dailyRows), [dailyRows]);
  const insights = useMemo(() => buildInsights(dailyRows), [dailyRows]);
  const hasData = dailyRows.length > 0;
  const lastSyncLabel = formatTimestamp(latestRow?.lastSyncAt ?? latestRow?.day ?? null);
  const sleepStageAvailable = hasAnyValue(chartPoints, ['remSleepHours', 'deepSleepHours', 'lightSleepHours', 'awakeHours']);
  const heartSignalsAvailable = hasAnyValue(chartPoints, ['hrv', 'restingHeartRate', 'lowestHeartRate', 'respiratoryRate', 'temperatureDeviation']);

  const showNotice = useCallback((nextNotice: Notice) => {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [sleepResult, readinessResult, activityResult] = await Promise.all([
        supabase.from('oura_daily_sleep').select('*').order('day', { ascending: false }).limit(30),
        supabase.from('oura_daily_readiness').select('*').order('day', { ascending: false }).limit(30),
        supabase.from('oura_daily_activity').select('*').order('day', { ascending: false }).limit(30),
      ]);

      const firstError = sleepResult.error ?? readinessResult.error ?? activityResult.error;
      if (firstError) throw new Error(firstError.message);

      setDailyRows(mergeDailyRows(
        (sleepResult.data ?? []) as OuraTableRow[],
        (readinessResult.data ?? []) as OuraTableRow[],
        (activityResult.data ?? []) as OuraTableRow[],
      ));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load Oura data.';
      setLoadError(message);
      showNotice({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (handledCallbackRef.current) return;

    const params = getCallbackParams();
    if (!params.hasParams) return;

    handledCallbackRef.current = true;

    if (params.connectionId) {
      window.localStorage.setItem(OURA_CONNECTION_STORAGE_KEY, params.connectionId);
      setConnectionId(params.connectionId);
      showNotice({ type: 'success', message: 'Oura connected successfully.' });
    }

    if (params.connected === 'true' && !params.connectionId) {
      showNotice({ type: 'success', message: 'Oura connected successfully.' });
    }

    if (params.error) {
      showNotice({ type: 'error', message: params.error });
    }

    clearCallbackParams();
  }, [showNotice]);

  const connectOura = () => {
    const clientId = import.meta.env.VITE_OURA_CLIENT_ID;

    if (!clientId) {
      alert('Missing VITE_OURA_CLIENT_ID');
      return;
    }

    const redirectUri = encodeURIComponent(OURA_CALLBACK_URL);
    const scope = encodeURIComponent(OURA_SCOPE);

    window.location.href =
      'https://cloud.ouraring.com/oauth/authorize' +
      '?response_type=code' +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}`;
  };

  const syncOuraData = async () => {
    const storedConnectionId = getStoredConnectionId();

    if (!storedConnectionId) {
      showNotice({ type: 'warning', message: 'Connect Oura first' });
      return;
    }

    setIsSyncing(true);

    try {
      const response = await fetch(OURA_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: storedConnectionId }),
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(details || `Sync failed with status ${response.status}`);
      }

      setConnectionId(storedConnectionId);
      showNotice({ type: 'success', message: 'Oura data synced successfully.' });
      await loadDashboardData();
    } catch (error) {
      showNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Oura sync failed.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshDashboard = () => {
    loadDashboardData();
  };

  return (
    <AdminGate>
      <div className="admin-root min-h-screen overflow-hidden font-sans" style={{ background: 'var(--admin-bg)', color: COLORS.text }}>
        <AmbientLayer />

        <AdminHeader
          activeTab="oura-analytics"
          todayCount={0}
          overdueCount={0}
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        <main className="relative z-10 mx-auto max-w-[1760px] px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <section className="relative overflow-hidden rounded-[2rem] border p-5 sm:p-6 lg:p-8" style={glassPanelStyle}>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, ${COLORS.emerald}, transparent)` }} />
            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] xl:items-end">
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]" style={{ borderColor: COLORS.border, background: COLORS.cyanSoft, color: COLORS.cyan }}>
                    Health Intelligence
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em]" style={{ background: isConnected ? 'var(--admin-success-bg)' : 'var(--admin-warning-bg)', borderColor: isConnected ? 'var(--admin-success-border)' : 'var(--admin-warning-border)', color: isConnected ? COLORS.emerald : COLORS.amber }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: isConnected ? COLORS.emerald : COLORS.amber, boxShadow: `0 0 14px ${isConnected ? COLORS.emerald : COLORS.amber}` }} />
                    {isConnected ? 'Connected' : 'Not connected'}
                  </span>
                  <span className="rounded-full border px-3 py-1.5 text-[10px] font-mono" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
                    Last sync: {lastSyncLabel}
                  </span>
                </div>

                <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl lg:text-6xl" style={{ color: COLORS.text }}>
                  Health Intelligence
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-6 sm:text-base" style={{ color: COLORS.muted }}>
                  Biometric recovery, sleep, stress, and performance analytics powered by Oura.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <HeroButton icon={Link2} label="Connect Oura" onClick={connectOura} />
                  <HeroButton icon={RefreshCw} label={isSyncing ? 'Syncing' : 'Sync Oura Data'} onClick={syncOuraData} disabled={isSyncing} primary />
                  <HeroButton icon={Gauge} label="Refresh Dashboard" onClick={refreshDashboard} disabled={isLoading} />
                </div>
              </div>

              <div className="rounded-[1.6rem] border p-5" style={{ borderColor: COLORS.border, background: COLORS.heroSurface }}>
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-3xl" style={{ background: COLORS.cyanSoft, border: `1px solid ${COLORS.border}` }}>
                    <HeartPulse size={22} color={COLORS.cyan} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: COLORS.faint }}>
                      Biometric Command Center
                    </p>
                    <p className="mt-1 text-sm leading-6" style={{ color: COLORS.muted }}>
                      {isConnected
                        ? hasData
                          ? 'Your latest synced biometric timeline is active.'
                          : 'Connected. Run your first sync.'
                        : 'Connect Oura and sync your first 30 days of data.'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricMini label="Rows" value={formatInteger(dailyRows.length)} icon={CalendarClock} />
                  <MetricMini label="Latest day" value={latestRow ? formatDay(latestRow.day) : 'No data'} icon={Clock3} />
                  <MetricMini label="Recovery" value={formatScore(latestRow?.readinessScore ?? null)} icon={BatteryCharging} />
                  <MetricMini label="Sleep" value={formatScore(latestRow?.sleepScore ?? null)} icon={Moon} />
                </div>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {loadError && <InlineError message={loadError} onRetry={loadDashboardData} />}
          </AnimatePresence>

          {!isLoading && !hasData && (
            <div className="mt-5">
              <EmptyPanel
                title={isConnected ? 'Connected. Run your first sync.' : 'No Oura data yet'}
                description={isConnected ? 'Sync Oura Data to load your first biometric timeline.' : 'Connect Oura and sync your first 30 days of data.'}
                action={<HeroButton icon={isConnected ? RefreshCw : Link2} label={isConnected ? 'Sync Oura Data' : 'Connect Oura'} onClick={isConnected ? syncOuraData : connectOura} primary />}
              />
            </div>
          )}

          <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryMetrics.map((metric) => (
              <SummaryCard key={metric.key} metric={metric} />
            ))}
          </section>

          <div className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <ChartShell
              eyebrow="Recovery Matrix"
              title="30-day readiness, sleep and activity signal"
              action={<span className="rounded-full border px-3 py-1.5 text-xs font-mono" style={{ borderColor: COLORS.border, color: COLORS.muted }}>Last 30 days</span>}
            >
              {hasAnyValue(chartPoints, ['sleepScore', 'readinessScore', 'activityScore']) ? (
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartPoints}>
                      <CartesianGrid stroke={COLORS.grid} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: COLORS.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: COLORS.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: COLORS.panelStrong, border: `1px solid ${COLORS.border}`, borderRadius: 16, color: COLORS.text }} />
                      <Line type="monotone" dataKey="sleepScore" name="Sleep Score" stroke={COLORS.blue} strokeWidth={2.4} dot={false} connectNulls />
                      <Line type="monotone" dataKey="readinessScore" name="Readiness Score" stroke={COLORS.emerald} strokeWidth={2.4} dot={false} connectNulls />
                      <Line type="monotone" dataKey="activityScore" name="Activity Score" stroke={COLORS.cyan} strokeWidth={2.4} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyPanel title="No matrix data" description="Sync Oura scores to unlock the recovery matrix." />
              )}
            </ChartShell>

            <ChartShell eyebrow="Insight Engine" title="Rule-based biometric intelligence">
              <div className="grid gap-3">
                {insights.map((insight) => (
                  <InsightCard key={insight.title} insight={insight} />
                ))}
              </div>
            </ChartShell>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ChartShell eyebrow="Sleep Architecture" title="Nightly sleep-stage composition">
              <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricMini label="Total sleep" value={formatDuration(latestRow?.totalSleepDuration ?? null)} icon={Moon} />
                <MetricMini label="Time in bed" value={formatDuration(latestRow?.timeInBed ?? null)} icon={Clock3} />
                <MetricMini label="Efficiency" value={latestRow?.sleepEfficiency !== null && latestRow?.sleepEfficiency !== undefined ? `${Math.round(latestRow.sleepEfficiency)}%` : 'No data'} icon={Gauge} />
                <MetricMini label="Latency" value={formatDuration(latestRow?.latency ?? null)} icon={Zap} />
                <MetricMini label="REM" value={formatDuration(latestRow?.remSleep ?? null)} icon={Brain} />
                <MetricMini label="Deep" value={formatDuration(latestRow?.deepSleep ?? null)} icon={BatteryCharging} />
                <MetricMini label="Light" value={formatDuration(latestRow?.lightSleep ?? null)} icon={Waves} />
                <MetricMini label="Awake" value={formatDuration(latestRow?.awakeTime ?? null)} icon={Activity} />
                <MetricMini label="Restfulness" value={formatScore(latestRow?.restfulness ?? null)} icon={Sparkles} />
              </div>

              {sleepStageAvailable ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartPoints}>
                      <CartesianGrid stroke={COLORS.grid} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: COLORS.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: COLORS.faint, fontSize: 11 }} tickLine={false} axisLine={false} unit="h" />
                      <Tooltip contentStyle={{ background: COLORS.panelStrong, border: `1px solid ${COLORS.border}`, borderRadius: 16, color: COLORS.text }} />
                      <Bar dataKey="deepSleepHours" name="Deep" stackId="sleep" fill={COLORS.emerald} radius={[0, 0, 6, 6]} />
                      <Bar dataKey="remSleepHours" name="REM" stackId="sleep" fill={COLORS.cyan} />
                      <Bar dataKey="lightSleepHours" name="Light" stackId="sleep" fill={COLORS.blue} />
                      <Bar dataKey="awakeHours" name="Awake" stackId="sleep" fill={COLORS.rose} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyPanel title="Sleep-stage fields unavailable" description="This view appears when Oura raw sleep-stage durations are present in the synced rows." />
              )}
            </ChartShell>

            <ChartShell eyebrow="Readiness Deep Dive" title="Contributor-level recovery drivers">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ContributorCard label="HRV Balance" value={latestRow?.contributors.hrvBalance ?? null} />
                <ContributorCard label="Recovery Index" value={latestRow?.contributors.recoveryIndex ?? null} />
                <ContributorCard label="Resting Heart Rate" value={latestRow?.contributors.restingHeartRate ?? null} />
                <ContributorCard label="Body Temperature" value={latestRow?.contributors.bodyTemperature ?? null} />
                <ContributorCard label="Previous Day Activity" value={latestRow?.contributors.previousDayActivity ?? null} />
                <ContributorCard label="Sleep Balance" value={latestRow?.contributors.sleepBalance ?? null} />
                <ContributorCard label="Activity Balance" value={latestRow?.contributors.activityBalance ?? null} />
              </div>
            </ChartShell>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ChartShell eyebrow="Activity & Load" title="Movement, steps and activity pressure">
              <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
                <MetricMini label="Activity Score" value={formatScore(latestRow?.activityScore ?? null)} icon={Activity} />
                <MetricMini label="Steps" value={formatInteger(latestRow?.steps ?? null)} icon={Footprints} />
                <MetricMini label="Active Calories" value={formatInteger(latestRow?.activeCalories ?? null)} icon={Zap} />
                <MetricMini label="Walk Distance" value={formatDistanceMeters(latestRow?.walkingDistance ?? null)} icon={Gauge} />
                <MetricMini label="High Activity" value={formatDuration(latestRow?.highActivityTime ?? null)} icon={Activity} />
                <MetricMini label="Medium Activity" value={formatDuration(latestRow?.mediumActivityTime ?? null)} icon={Waves} />
                <MetricMini label="Low Activity" value={formatDuration(latestRow?.lowActivityTime ?? null)} icon={Clock3} />
              </div>

              {hasAnyValue(chartPoints, ['steps', 'activityScore']) ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartPoints}>
                      <CartesianGrid stroke={COLORS.grid} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: COLORS.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" tick={{ fill: COLORS.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: COLORS.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: COLORS.panelStrong, border: `1px solid ${COLORS.border}`, borderRadius: 16, color: COLORS.text }} />
                      <Bar yAxisId="left" dataKey="steps" name="Steps" fill={COLORS.chartBar} radius={[8, 8, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="activityScore" name="Activity Score" stroke={COLORS.emerald} strokeWidth={2.4} dot={false} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyPanel title="No activity timeline" description="Steps and activity score will appear after synced activity rows are available." />
              )}
            </ChartShell>

            <ChartShell eyebrow="Heart & Recovery Signals" title="HRV, heart rate, breath and temperature">
              {heartSignalsAvailable ? (
                <div className="h-[390px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPoints}>
                      <defs>
                        <linearGradient id="hrvFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.32} />
                          <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="tempFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.rose} stopOpacity={0.22} />
                          <stop offset="95%" stopColor={COLORS.rose} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={COLORS.grid} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: COLORS.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: COLORS.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: COLORS.panelStrong, border: `1px solid ${COLORS.border}`, borderRadius: 16, color: COLORS.text }} />
                      <Area type="monotone" dataKey="hrv" name="HRV" stroke={COLORS.cyan} fill="url(#hrvFill)" strokeWidth={2.2} connectNulls />
                      <Line type="monotone" dataKey="restingHeartRate" name="Resting HR" stroke={COLORS.rose} strokeWidth={2.2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="lowestHeartRate" name="Lowest HR" stroke={COLORS.violet} strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="respiratoryRate" name="Respiratory Rate" stroke={COLORS.emerald} strokeWidth={2} dot={false} connectNulls />
                      <Area type="monotone" dataKey="temperatureDeviation" name="Temperature Deviation" stroke={COLORS.amber} fill="url(#tempFill)" strokeWidth={2} connectNulls />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyPanel title="Heart signals unavailable" description="HRV, resting heart rate, respiratory rate and temperature trends appear when those raw Oura fields are synced." />
              )}
            </ChartShell>
          </div>

          <ChartShell eyebrow="Data Table" title="Compact biometric ledger" action={<span className="text-xs font-mono" style={{ color: COLORS.faint }}>Secondary view</span>}>
            <div className="w-full overflow-x-auto rounded-[1.25rem] border" style={{ borderColor: COLORS.border }}>
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr style={{ background: COLORS.cyanSoft }}>
                    {['Date', 'Sleep', 'Readiness', 'Activity', 'Steps', 'HRV', 'RHR', 'Temperature'].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ color: COLORS.faint, textAlign: header === 'Date' ? 'left' : 'right' }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyRows.map((row) => (
                    <tr key={row.day} className="border-b" style={{ borderColor: COLORS.grid }}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: COLORS.text }}>
                        {formatDay(row.day)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: COLORS.muted }}>{formatScore(row.sleepScore)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: COLORS.muted }}>{formatScore(row.readinessScore)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: COLORS.muted }}>{formatScore(row.activityScore)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: COLORS.muted }}>{formatInteger(row.steps)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: COLORS.muted }}>{formatDecimal(row.hrv, 0)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: COLORS.muted }}>{formatDecimal(row.restingHeartRate, 0)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: COLORS.muted }}>{formatSignedDecimal(row.temperatureDeviation, 1)}</td>
                    </tr>
                  ))}
                  {!isLoading && dailyRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm" style={{ color: COLORS.muted }}>
                        {isConnected ? 'Connected. Run your first sync.' : 'Connect Oura and sync your first 30 days of data.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartShell>
        </main>

        <AnimatePresence>
          {notice && <NoticeToast notice={notice} onClose={() => setNotice(null)} />}
        </AnimatePresence>
      </div>
    </AdminGate>
  );
}

export default OuraAnalyticsPage;
