import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  BatteryCharging,
  CalendarClock,
  Clock3,
  Footprints,
  HeartPulse,
  Link2,
  Moon,
  RefreshCw,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminGate } from '../components/admin/AdminGate';
import { AdminHeader } from '../components/admin/AdminHeader';
import { EmptyState } from '../components/admin/EmptyAndLoading';
import { useAdminTheme } from '../hooks/useAdminTheme';

const OURA_CALLBACK_URL = 'https://lqgtmoulqzmrhglabrms.supabase.co/functions/v1/oura-callback';
const OURA_SYNC_URL = 'https://lqgtmoulqzmrhglabrms.supabase.co/functions/v1/sync-oura';
const OURA_CONNECTION_STORAGE_KEY = 'oura_connection_id';
const OURA_SCOPE = 'email personal daily heartrate workout tag session spo2Daily';

type NumericValue = number | string | null;
type Notice = { type: 'success' | 'error' | 'warning'; message: string };

interface OuraScoreRow {
  day: string | null;
  score: NumericValue;
}

interface OuraActivityRow extends OuraScoreRow {
  steps: NumericValue;
}

interface OuraDailySummary {
  day: string;
  sleepScore: number | null;
  readinessScore: number | null;
  activityScore: number | null;
  steps: number | null;
}

interface CallbackParams {
  connected: string | null;
  connectionId: string | null;
  error: string | null;
  hasParams: boolean;
}

function getStoredConnectionId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(OURA_CONNECTION_STORAGE_KEY);
}

function toNumber(value: NumericValue): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function ensureSummary(map: Map<string, OuraDailySummary>, day: string): OuraDailySummary {
  const existing = map.get(day);
  if (existing) return existing;

  const summary: OuraDailySummary = {
    day,
    sleepScore: null,
    readinessScore: null,
    activityScore: null,
    steps: null,
  };
  map.set(day, summary);
  return summary;
}

function mergeDailyRows(
  sleepRows: OuraScoreRow[],
  readinessRows: OuraScoreRow[],
  activityRows: OuraActivityRow[],
): OuraDailySummary[] {
  const byDay = new Map<string, OuraDailySummary>();

  sleepRows.forEach((row) => {
    if (!row.day) return;
    ensureSummary(byDay, row.day).sleepScore = toNumber(row.score);
  });

  readinessRows.forEach((row) => {
    if (!row.day) return;
    ensureSummary(byDay, row.day).readinessScore = toNumber(row.score);
  });

  activityRows.forEach((row) => {
    if (!row.day) return;
    const summary = ensureSummary(byDay, row.day);
    summary.activityScore = toNumber(row.score);
    summary.steps = toNumber(row.steps);
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

function formatScore(value: number | null): string {
  return value === null ? 'No data' : String(Math.round(value));
}

function formatSteps(value: number | null): string {
  return value === null ? 'No data' : new Intl.NumberFormat('en-US').format(Math.round(value));
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

function AmbientLayer() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% -8%, color-mix(in srgb, var(--admin-accent) 10%, transparent), transparent 34%), radial-gradient(circle at 82% 10%, color-mix(in srgb, var(--admin-success) 7%, transparent), transparent 28%), linear-gradient(180deg, color-mix(in srgb, var(--admin-surface) 20%, transparent), transparent 44%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(var(--admin-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--admin-grid-line) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(to bottom, black, transparent 72%)',
          opacity: 0.35,
        }}
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  iconColor,
  label,
  value,
  subtext,
  delay = 0,
}: {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
  subtext: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-[1.45rem] border p-4 sm:p-5"
      style={{
        background: 'var(--admin-surface)',
        borderColor: 'var(--admin-border)',
        boxShadow: 'var(--admin-card-shadow, none)',
      }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
          style={{
            background: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${iconColor} 24%, transparent)`,
          }}
        >
          <Icon size={18} color={iconColor} />
        </div>
        <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: 'var(--admin-text-muted)' }}>
          {label}
        </span>
      </div>
      <p
        className="font-mono text-2xl font-semibold tracking-[-0.04em] sm:text-3xl"
        style={{ color: 'var(--admin-text-primary)' }}
      >
        {value}
      </p>
      <p className="mt-2 text-xs leading-5" style={{ color: 'var(--admin-text-muted)' }}>
        {subtext}
      </p>
    </motion.div>
  );
}

function StatusPill({ connected }: { connected: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em]"
      style={{
        background: connected ? 'var(--admin-success-bg)' : 'var(--admin-warning-bg)',
        borderColor: connected ? 'var(--admin-success-border)' : 'var(--admin-warning-border)',
        color: connected ? 'var(--admin-success)' : 'var(--admin-warning)',
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: connected ? 'var(--admin-success)' : 'var(--admin-warning)',
          boxShadow: connected ? '0 0 10px var(--admin-success)' : '0 0 10px var(--admin-warning)',
        }}
      />
      {connected ? 'Connected' : 'Not connected'}
    </span>
  );
}

function NoticeToast({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const isSuccess = notice.type === 'success';
  const color = isSuccess ? 'var(--admin-success)' : notice.type === 'warning' ? 'var(--admin-warning)' : 'var(--admin-danger)';
  const border = isSuccess ? 'var(--admin-success-border)' : notice.type === 'warning' ? 'var(--admin-warning-border)' : 'var(--admin-danger-border)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed bottom-6 right-6 z-[500] flex max-w-[360px] items-start gap-3 rounded-2xl border px-4 py-3 font-mono text-sm"
      style={{
        background: 'var(--admin-surface-elevated)',
        borderColor: border,
        color,
        boxShadow: 'var(--admin-card-shadow, none)',
      }}
    >
      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: color }} />
      <span className="min-w-0 flex-1 break-words">{notice.message}</span>
      <button type="button" onClick={onClose} className="rounded-lg p-1 transition-all hover:scale-105" style={{ color }}>
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
          <TriangleAlert size={17} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--admin-danger)' }} />
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold" style={{ color: 'var(--admin-danger)' }}>
              Oura data load failed
            </p>
            <p className="mt-1 break-words font-mono text-xs leading-5" style={{ color: 'var(--admin-danger)', opacity: 0.75 }}>
              {message}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-danger-border)', color: 'var(--admin-danger)' }}
        >
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    </motion.div>
  );
}

export function OuraAnalyticsPage() {
  const navigate = useNavigate();
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

  const showNotice = useCallback((nextNotice: Notice) => {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [sleepResult, readinessResult, activityResult] = await Promise.all([
        supabase.from('oura_daily_sleep').select('day, score').order('day', { ascending: false }).limit(30),
        supabase.from('oura_daily_readiness').select('day, score').order('day', { ascending: false }).limit(30),
        supabase.from('oura_daily_activity').select('day, score, steps').order('day', { ascending: false }).limit(30),
      ]);

      const firstError = sleepResult.error ?? readinessResult.error ?? activityResult.error;
      if (firstError) throw new Error(firstError.message);

      setDailyRows(mergeDailyRows(
        (sleepResult.data ?? []) as OuraScoreRow[],
        (readinessResult.data ?? []) as OuraScoreRow[],
        (activityResult.data ?? []) as OuraActivityRow[],
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

  const metricCards = useMemo(() => [
    {
      icon: Moon,
      iconColor: 'var(--admin-info)',
      label: 'Sleep Score',
      value: formatScore(latestRow?.sleepScore ?? null),
      subtext: latestRow ? formatDay(latestRow.day) : 'Latest synced daily sleep',
    },
    {
      icon: BatteryCharging,
      iconColor: 'var(--admin-success)',
      label: 'Readiness Score',
      value: formatScore(latestRow?.readinessScore ?? null),
      subtext: latestRow ? formatDay(latestRow.day) : 'Latest readiness snapshot',
    },
    {
      icon: Activity,
      iconColor: 'var(--admin-accent)',
      label: 'Activity Score',
      value: formatScore(latestRow?.activityScore ?? null),
      subtext: latestRow ? formatDay(latestRow.day) : 'Latest activity snapshot',
    },
    {
      icon: Footprints,
      iconColor: 'var(--admin-warning)',
      label: 'Steps',
      value: formatSteps(latestRow?.steps ?? null),
      subtext: latestRow ? formatDay(latestRow.day) : 'Daily movement total',
    },
    {
      icon: Clock3,
      iconColor: 'var(--admin-accent-subtle)',
      label: 'Last Sync',
      value: latestRow ? formatDay(latestRow.day) : 'No data',
      subtext: 'Most recent synced Oura day',
    },
  ], [latestRow]);

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
      showNotice({ type: 'warning', message: 'Connect Oura first.' });
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

  return (
    <AdminGate>
      <div className="admin-root min-h-screen overflow-hidden font-sans" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-primary)' }}>
        <AmbientLayer />

        <AdminHeader
          activeTab="oura-analytics"
          onTabChange={() => navigate('/admin')}
          todayCount={0}
          overdueCount={0}
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        <main className="relative z-10 mx-auto max-w-[1760px] px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <section
            className="relative overflow-hidden rounded-[1.9rem] border p-4 sm:p-5 lg:p-6"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--admin-surface) 96%, transparent), color-mix(in srgb, var(--admin-surface-hover) 72%, var(--admin-surface)))',
              borderColor: 'var(--admin-border-strong)',
              boxShadow: 'var(--admin-card-shadow, none)',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--admin-accent) 48%, transparent), color-mix(in srgb, var(--admin-success) 32%, transparent), transparent)' }} />
            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] xl:items-end">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-accent)' }}>
                    Health Intelligence
                  </span>
                  <StatusPill connected={isConnected} />
                </div>

                <h1 className="text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl lg:text-5xl" style={{ color: 'var(--admin-text-primary)' }}>
                  Oura Analytics
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: 'var(--admin-text-muted)' }}>
                  Sync and analyze Oura Ring health metrics inside Cogniiq.
                </p>
              </div>

              <div className="rounded-[1.45rem] border p-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: 'var(--admin-surface-hover)', border: '1px solid var(--admin-border-strong)' }}>
                    <HeartPulse size={20} style={{ color: 'var(--admin-accent)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: 'var(--admin-text-muted)' }}>
                      Connection status
                    </p>
                    <p className="mt-1 text-xs leading-5" style={{ color: 'var(--admin-text-secondary)' }}>
                      {isConnected
                        ? 'Connection ID is stored locally. Oura tokens stay server-side in Supabase.'
                        : 'Connect Oura to authorize server-side health data syncs.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <button
                    type="button"
                    onClick={connectOura}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border-strong)', color: 'var(--admin-text-secondary)' }}
                  >
                    <Link2 size={15} />
                    Connect Oura
                  </button>
                  <button
                    type="button"
                    onClick={syncOuraData}
                    disabled={isSyncing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: 'var(--admin-button-primary-bg)', border: '1px solid var(--admin-button-primary-border)', color: 'var(--admin-accent)', boxShadow: 'var(--accent-glow)' }}
                  >
                    <RefreshCw size={15} className={isSyncing ? 'animate-spin' : undefined} />
                    {isSyncing ? 'Syncing' : 'Sync Oura Data'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {loadError && <InlineError message={loadError} onRetry={loadDashboardData} />}
          </AnimatePresence>

          <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metricCards.map((card, index) => (
              <MetricCard key={card.label} {...card} delay={0.04 * index} />
            ))}
          </section>

          <section className="mt-5 overflow-hidden rounded-[1.65rem] border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', boxShadow: 'var(--admin-card-shadow, none)' }}>
            <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5" style={{ borderColor: 'var(--admin-border)' }}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: 'var(--admin-text-muted)' }}>
                  Latest daily data
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]" style={{ color: 'var(--admin-text-primary)' }}>
                  Sleep, readiness, activity and steps
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono" style={{ background: 'var(--admin-surface-hover)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}>
                <CalendarClock size={14} />
                {dailyRows.length > 0 ? `${dailyRows.length} days` : 'No synced days'}
              </div>
            </div>

            {isLoading ? (
              <div className="p-5">
                <div className="h-24 animate-pulse rounded-2xl" style={{ background: 'var(--admin-surface-hover)', border: '1px solid var(--admin-border)' }} />
              </div>
            ) : dailyRows.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  message="Connect Oura and run your first sync to see your health analytics."
                  action={{ label: 'Connect Oura', onClick: connectOura }}
                />
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr style={{ background: 'var(--admin-surface-hover)' }}>
                      {['Date', 'Sleep Score', 'Readiness Score', 'Activity Score', 'Steps'].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] sm:px-5"
                          style={{ color: 'var(--admin-text-muted)', textAlign: header === 'Date' ? 'left' : 'right' }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows.map((row) => (
                      <tr key={row.day} className="border-b transition-colors" style={{ borderColor: 'var(--admin-border)' }}>
                        <td className="px-4 py-4 font-mono text-xs font-semibold sm:px-5" style={{ color: 'var(--admin-text-primary)' }}>
                          {formatDay(row.day)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-xs sm:px-5" style={{ color: 'var(--admin-text-secondary)' }}>
                          {formatScore(row.sleepScore)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-xs sm:px-5" style={{ color: 'var(--admin-text-secondary)' }}>
                          {formatScore(row.readinessScore)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-xs sm:px-5" style={{ color: 'var(--admin-text-secondary)' }}>
                          {formatScore(row.activityScore)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-xs sm:px-5" style={{ color: 'var(--admin-text-secondary)' }}>
                          {formatSteps(row.steps)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        <AnimatePresence>
          {notice && <NoticeToast notice={notice} onClose={() => setNotice(null)} />}
        </AnimatePresence>
      </div>
    </AdminGate>
  );
}

export default OuraAnalyticsPage;
