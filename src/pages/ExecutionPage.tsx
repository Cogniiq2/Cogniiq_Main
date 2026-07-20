import { useState, useEffect, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { AdminGate } from '../components/admin/AdminGate';
import { AdminHeader } from '../components/admin/AdminHeader';
import { useAdminTheme } from '../hooks/useAdminTheme';
import {
  Activity,
  BarChart3,
  Briefcase,
  Calendar,
  ChevronRight,
  CircleCheck as CheckCircle2,
  Clock,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  Gauge,
  ListChecks,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert as AlertTriangle,
  Trophy,
  Utensils,
  X,
  Zap,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ExecutionTask {
  id: string;
  execution_day_id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  points: number;
  is_non_negotiable: boolean;
  sort_order: number;
  planned_start: string | null;
  planned_end: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ExecutionDay {
  id: string;
  date: string;
  weekday?: number | null;
  title: string;
  plan_type: string;
  total_points: number;
  completed_points: number;
  score_percent: number;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoryMeta {
  label: string;
  shortLabel: string;
  icon: ReactNode;
  accent: string;
  soft: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function getBerlinDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  if (typeof error === 'object') {
    const e = error as {
      message?: string;
      error_description?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    const parts = [
      e.message,
      e.error_description,
      e.details,
      e.hint,
      e.code ? `Code: ${e.code}` : null,
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(' | ');

    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return 'Unknown object error';
    }
  }

  return String(error);
}

function formatTimeOnly(time: string | null): string {
  if (!time) return '--';

  if (/^\d{2}:\d{2}/.test(time)) {
    return time.slice(0, 5);
  }

  const parsed = new Date(time);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Berlin',
    });
  }

  return time.slice(0, 5);
}

function getPlanTypeLabel(planType: string): string {
  return planType.replace(/_/g, ' ');
}

function getScoreTone(score: number): 'elite' | 'strong' | 'danger' {
  if (score >= 85) return 'elite';
  if (score >= 60) return 'strong';
  return 'danger';
}

function clampPct(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  cogniiq: {
    label: 'Cogniiq',
    shortLabel: 'Biz',
    icon: <Briefcase size={14} />,
    accent: 'var(--admin-accent)',
    soft: 'color-mix(in srgb, var(--admin-accent) 10%, transparent)',
  },
  sales: {
    label: 'Sales',
    shortLabel: 'Sales',
    icon: <Zap size={14} />,
    accent: 'var(--admin-warning)',
    soft: 'color-mix(in srgb, var(--admin-warning) 12%, transparent)',
  },
  revenue: {
    label: 'Revenue',
    shortLabel: 'Rev',
    icon: <Zap size={14} />,
    accent: 'var(--admin-warning)',
    soft: 'color-mix(in srgb, var(--admin-warning) 12%, transparent)',
  },
  training: {
    label: 'Training',
    shortLabel: 'Train',
    icon: <Dumbbell size={14} />,
    accent: 'var(--admin-info)',
    soft: 'color-mix(in srgb, var(--admin-info) 12%, transparent)',
  },
  tennis: {
    label: 'Tennis',
    shortLabel: 'Court',
    icon: <Activity size={14} />,
    accent: 'var(--admin-success)',
    soft: 'color-mix(in srgb, var(--admin-success) 12%, transparent)',
  },
  recovery: {
    label: 'Recovery',
    shortLabel: 'Rec',
    icon: <Activity size={14} />,
    accent: 'var(--admin-success)',
    soft: 'color-mix(in srgb, var(--admin-success) 11%, transparent)',
  },
  nutrition: {
    label: 'Nutrition',
    shortLabel: 'Fuel',
    icon: <Utensils size={14} />,
    accent: 'var(--admin-warning)',
    soft: 'color-mix(in srgb, var(--admin-warning) 10%, transparent)',
  },
  sleep: {
    label: 'Sleep',
    shortLabel: 'Sleep',
    icon: <Moon size={14} />,
    accent: 'var(--admin-text-muted)',
    soft: 'color-mix(in srgb, var(--admin-text-muted) 10%, transparent)',
  },
  discipline: {
    label: 'Discipline',
    shortLabel: 'Disc',
    icon: <ShieldCheck size={14} />,
    accent: 'var(--admin-danger)',
    soft: 'color-mix(in srgb, var(--admin-danger) 10%, transparent)',
  },
  focus: {
    label: 'Focus',
    shortLabel: 'Focus',
    icon: <Target size={14} />,
    accent: 'var(--admin-accent)',
    soft: 'color-mix(in srgb, var(--admin-accent) 10%, transparent)',
  },
  planning: {
    label: 'Planning',
    shortLabel: 'Plan',
    icon: <Calendar size={14} />,
    accent: 'var(--admin-info)',
    soft: 'color-mix(in srgb, var(--admin-info) 10%, transparent)',
  },
  admin: {
    label: 'Admin',
    shortLabel: 'Admin',
    icon: <Clock size={14} />,
    accent: 'var(--admin-text-muted)',
    soft: 'color-mix(in srgb, var(--admin-text-muted) 10%, transparent)',
  },
  delivery: {
    label: 'Delivery',
    shortLabel: 'Ship',
    icon: <CheckCircle2 size={14} />,
    accent: 'var(--admin-success)',
    soft: 'color-mix(in srgb, var(--admin-success) 10%, transparent)',
  },
};

function getCategoryMeta(category: string): CategoryMeta {
  return (
    CATEGORY_META[category] || {
      label: category || 'General',
      shortLabel: category || 'Gen',
      icon: <Target size={14} />,
      accent: 'var(--admin-accent)',
      soft: 'color-mix(in srgb, var(--admin-accent) 10%, transparent)',
    }
  );
}

const PRIORITY_LABEL: Record<ExecutionTask['priority'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

// =============================================================================
// MAIN PAGE
// =============================================================================

export function ExecutionPage() {
  const { theme, toggleTheme } = useAdminTheme();
  const today = getBerlinDateString();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<ExecutionDay | null>(null);
  const [tasks, setTasks] = useState<ExecutionTask[]>([]);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [generating, setGenerating] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDay(null);
    setTasks([]);

    if (import.meta.env.DEV) {
      console.log('[ExecutionPage] todayDate:', today);
      console.log('[ExecutionPage] DIRECT SUPABASE TEST START');
    }

    try {
      const { data: directData, error: directError } = await supabase
        .from('execution_days')
        .select('*')
        .limit(1);

      if (import.meta.env.DEV) {
        console.log('[ExecutionPage] directData:', directData);
        console.log('[ExecutionPage] directError:', directError);
      }

      if (directError) {
        throw new Error(`Direct Supabase test failed: ${getErrorMessage(directError)}`);
      }

      const { data: dayData, error: dayError } = await supabase
        .from('execution_days')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (import.meta.env.DEV) {
        console.log('[ExecutionPage] day:', dayData);
        console.log('[ExecutionPage] dayError:', dayError);
      }

      if (dayError) {
        throw new Error(`Fetch execution day failed: ${getErrorMessage(dayError)}`);
      }

      setDay(dayData as ExecutionDay | null);

      if (!dayData) {
        setTasks([]);
        return;
      }

      const { data: taskData, error: taskError } = await supabase
        .from('execution_tasks')
        .select('*')
        .eq('execution_day_id', dayData.id)
        .order('sort_order', { ascending: true });

      if (import.meta.env.DEV) {
        console.log('[ExecutionPage] execution_day_id:', dayData.id);
        console.log('[ExecutionPage] tasks:', taskData);
        console.log('[ExecutionPage] tasks count:', taskData?.length ?? 0);
        console.log('[ExecutionPage] tasksError:', taskError);
      }

      if (taskError) {
        throw new Error(`Fetch execution tasks failed: ${getErrorMessage(taskError)}`);
      }

      setTasks((taskData || []) as ExecutionTask[]);
    } catch (e: unknown) {
      console.error('[ExecutionPage] Fetch error full object:', e);
      setError(`Fetch error: ${getErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (task: ExecutionTask) => {
    setUpdating((p) => ({ ...p, [task.id]: true }));
    setError(null);

    const newCompleted = !task.is_completed;
    const completedAt = newCompleted ? new Date().toISOString() : null;

    const { error: updateError } = await supabase
      .from('execution_tasks')
      .update({
        is_completed: newCompleted,
        completed_at: completedAt,
      })
      .eq('id', task.id);

    if (updateError) {
      console.error('[ExecutionPage] updateError:', updateError);
      setError(`Update task failed: ${getErrorMessage(updateError)}`);
      setUpdating((p) => ({ ...p, [task.id]: false }));
      return;
    }

    await fetchData();
    setUpdating((p) => ({ ...p, [task.id]: false }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const { error: rpcError } = await supabase.rpc('generate_daily_execution_plan', {
        target_date: today,
      });

      if (import.meta.env.DEV) {
        console.log('[ExecutionPage] generate rpcError:', rpcError);
      }

      if (rpcError) {
        throw new Error(`Generate today's plan failed: ${getErrorMessage(rpcError)}`);
      }

      await fetchData();
    } catch (e: unknown) {
      console.error('[ExecutionPage] Generate error full object:', e);
      setError(`Generate error: ${getErrorMessage(e)}`);
    } finally {
      setGenerating(false);
    }
  };

  const completedTaskCount = tasks.filter((t) => t.is_completed).length;
  const totalTaskCount = tasks.length;
  const completedPercent = totalTaskCount > 0 ? (completedTaskCount / totalTaskCount) * 100 : 0;
  const remainingTaskCount = Math.max(totalTaskCount - completedTaskCount, 0);
  const nonNegotiables = tasks.filter((t) => t.is_non_negotiable && !t.is_completed);
  const completedNonNegotiables = tasks.filter((t) => t.is_non_negotiable && t.is_completed).length;
  const totalNonNegotiables = tasks.filter((t) => t.is_non_negotiable).length;

  const categoryBreakdown = tasks.reduce((acc, t) => {
    const cat = t.category || 'general';
    if (!acc[cat]) acc[cat] = { total: 0, completed: 0, count: 0, completedCount: 0 };
    acc[cat].total += t.points;
    acc[cat].count += 1;
    if (t.is_completed) {
      acc[cat].completed += t.points;
      acc[cat].completedCount += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number; count: number; completedCount: number }>);

  return (
    <AdminGate>
      <div
        className="min-h-screen overflow-hidden font-sans"
        style={{
          background: 'var(--admin-bg)',
          color: 'var(--admin-text-primary)',
        }}
      >
        <AmbientLayer />

        <AdminHeader
          activeTab="execution"
          todayCount={remainingTaskCount}
          overdueCount={0}
          theme={theme}
          onThemeToggle={toggleTheme}
          utilityAction={
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                color: 'var(--admin-text-secondary)',
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          }
        />

        <main className="relative z-10 mx-auto max-w-[1720px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <DiagnosticsToggle
            today={today}
            day={day}
            taskCount={tasks.length}
            showDiagnostics={showDiagnostics}
            setShowDiagnostics={setShowDiagnostics}
          />

          <AnimatePresence>
            {error && <ErrorCard error={error} onClose={() => setError(null)} onRetry={fetchData} />}
          </AnimatePresence>

          {loading ? (
            <LoadingSkeleton />
          ) : !day ? (
            <EmptyExecutionState onGenerate={handleGenerate} generating={generating} />
          ) : (
            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-5">
                <ExecutiveHero
                  day={day}
                  completedTaskCount={completedTaskCount}
                  totalTaskCount={totalTaskCount}
                  remainingTaskCount={remainingTaskCount}
                  completedPercent={completedPercent}
                  completedNonNegotiables={completedNonNegotiables}
                  totalNonNegotiables={totalNonNegotiables}
                />

                <TaskTimeline tasks={tasks} updating={updating} onToggle={handleToggle} />
              </div>

              <aside className="min-w-0 2xl:sticky 2xl:top-[96px] 2xl:self-start">
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
                  <FocusCard planType={day.plan_type} />
                  <NonNegotiablesCard tasks={nonNegotiables} total={totalNonNegotiables} completed={completedNonNegotiables} />
                  <CategoryBreakdown breakdown={categoryBreakdown} />
                  <ProtocolCard day={day} tasks={tasks} />
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </AdminGate>
  );
}

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

function AmbientLayer() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--admin-accent) 10%, transparent), transparent 34%), radial-gradient(circle at 82% 10%, color-mix(in srgb, var(--admin-success) 7%, transparent), transparent 28%), linear-gradient(180deg, color-mix(in srgb, var(--admin-surface) 20%, transparent), transparent 42%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(var(--admin-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--admin-grid-line) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(to bottom, black, transparent 70%)',
          opacity: 0.34,
        }}
      />
    </div>
  );
}

function DiagnosticsToggle({
  today,
  day,
  taskCount,
  showDiagnostics,
  setShowDiagnostics,
}: {
  today: string;
  day: ExecutionDay | null;
  taskCount: number;
  showDiagnostics: boolean;
  setShowDiagnostics: (value: boolean) => void;
}) {
  return (
    <div className="relative mb-4 flex justify-end">
      <button
        type="button"
        onClick={() => setShowDiagnostics(!showDiagnostics)}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5"
        style={{
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          color: 'var(--admin-text-muted)',
        }}
      >
        {showDiagnostics ? <EyeOff size={12} /> : <Eye size={12} />}
        Diagnostics
        <ChevronRight size={12} className={cx('transition-transform', showDiagnostics && 'rotate-90')} />
      </button>

      <AnimatePresence>
        {showDiagnostics && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="absolute right-0 top-10 z-30 rounded-2xl p-4 font-mono text-[10px] shadow-2xl"
            style={{
              background: 'var(--admin-surface)',
              border: '1px solid var(--admin-border-strong)',
              color: 'var(--admin-text-secondary)',
              minWidth: 280,
            }}
          >
            <div className="mb-2 flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: 'var(--admin-accent)' }}>
              <Gauge size={12} /> Runtime
            </div>
            <p><span style={{ color: 'var(--admin-text-muted)' }}>today:</span> {today}</p>
            <p><span style={{ color: 'var(--admin-text-muted)' }}>day:</span> {day ? 'found' : 'not found'}</p>
            <p><span style={{ color: 'var(--admin-text-muted)' }}>tasks:</span> {taskCount}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// MAIN CONTENT COMPONENTS
// =============================================================================

function ExecutiveHero({
  day,
  completedTaskCount,
  totalTaskCount,
  remainingTaskCount,
  completedPercent,
  completedNonNegotiables,
  totalNonNegotiables,
}: {
  day: ExecutionDay;
  completedTaskCount: number;
  totalTaskCount: number;
  remainingTaskCount: number;
  completedPercent: number;
  completedNonNegotiables: number;
  totalNonNegotiables: number;
}) {
  const score = clampPct(day.score_percent || 0);
  const tone = getScoreTone(score);
  const scoreColor =
    tone === 'elite'
      ? 'var(--admin-success)'
      : tone === 'strong'
        ? 'var(--admin-warning)'
        : 'var(--admin-danger)';

  return (
    <section
      className="relative overflow-hidden rounded-[1.75rem] p-4 sm:p-5 lg:p-6"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--admin-surface) 96%, transparent), color-mix(in srgb, var(--admin-surface-hover) 76%, var(--admin-surface)))',
        border: '1px solid var(--admin-border-strong)',
        boxShadow: 'var(--admin-card-shadow, 0 24px 70px rgba(0,0,0,0.12))',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, color-mix(in srgb, var(--admin-accent) 50%, transparent), color-mix(in srgb, var(--admin-success) 38%, transparent), transparent)',
        }}
      />
      <div
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ background: `color-mix(in srgb, ${scoreColor} 10%, transparent)` }}
      />

      <div className="relative grid gap-5 xl:grid-cols-[230px_minmax(0,1fr)] xl:items-stretch">
        <div className="grid gap-4 sm:grid-cols-[190px_minmax(0,1fr)] xl:block">
          <ScoreOrb score={score} color={scoreColor} />

          <div className="rounded-3xl p-4 xl:mt-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: 'var(--admin-text-muted)' }}>
                Completion
              </span>
              <span className="font-mono text-xs" style={{ color: 'var(--admin-text-secondary)' }}>
                {Math.round(completedPercent)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--admin-surface-hover)' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${clampPct(completedPercent)}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                style={{
                  background: 'linear-gradient(90deg, var(--admin-accent), var(--admin-success))',
                }}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <LuxuryBadge icon={<Trophy size={12} />} label="Daily Plan" tone="accent" />
                <LuxuryBadge icon={<ShieldCheck size={12} />} label={day.status || 'pending'} tone={tone} />
              </div>
              <h2 className="text-2xl font-semibold leading-tight tracking-[-0.04em] sm:text-3xl lg:text-4xl" style={{ color: 'var(--admin-text-primary)' }}>
                {day.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: 'var(--admin-text-muted)' }}>
                Win the day by finishing the highest-leverage blocks first: critical tasks, body, recovery and business momentum.
              </p>
            </div>

            <div
              className="grid min-w-[210px] grid-cols-2 gap-2 rounded-3xl p-3"
              style={{
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
              }}
            >
              <MiniInfo label="Plan" value={getPlanTypeLabel(day.plan_type || 'standard')} />
              <MiniInfo label="Status" value={day.status || 'pending'} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile icon={<BarChart3 size={15} />} label="Points" value={`${day.completed_points || 0}/${day.total_points || 0}`} accent="var(--admin-accent)" />
            <MetricTile icon={<ListChecks size={15} />} label="Tasks" value={`${completedTaskCount}/${totalTaskCount}`} accent="var(--admin-success)" />
            <MetricTile icon={<Flame size={15} />} label="Open" value={`${remainingTaskCount}`} accent="var(--admin-warning)" />
            <MetricTile icon={<ShieldCheck size={15} />} label="Protocols" value={`${completedNonNegotiables}/${totalNonNegotiables}`} accent="var(--admin-danger)" />
          </div>

          {day.notes && (
            <div className="mt-4 rounded-3xl p-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: 'var(--admin-text-muted)' }}>
                Notes
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--admin-text-secondary)' }}>
                {day.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ScoreOrb({ score, color }: { score: number; color: string }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mx-auto flex h-[190px] w-[190px] items-center justify-center">
      <div
        className="absolute inset-4 rounded-full"
        style={{
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--admin-border) 60%, transparent)',
        }}
      />
      <svg className="relative h-[168px] w-[168px] -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r="54"
          fill="none"
          stroke="color-mix(in srgb, var(--admin-border-strong) 70%, transparent)"
          strokeWidth="9"
        />
        <motion.circle
          cx="64"
          cy="64"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--admin-text-muted)' }}>
          Score
        </p>
        <div className="flex items-start justify-center">
          <span className="text-5xl font-semibold tabular-nums tracking-[-0.07em]" style={{ color }}>
            {Math.round(score)}
          </span>
          <span className="ml-1 mt-2 text-sm font-mono" style={{ color: 'var(--admin-text-muted)' }}>
            %
          </span>
        </div>
      </div>
    </div>
  );
}

function TaskTimeline({
  tasks,
  updating,
  onToggle,
}: {
  tasks: ExecutionTask[];
  updating: Record<string, boolean>;
  onToggle: (task: ExecutionTask) => void;
}) {
  return (
    <section
      className="rounded-[1.75rem] p-4 sm:p-5"
      style={{
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        boxShadow: 'var(--admin-card-shadow, none)',
      }}
    >
      <SectionHeader
        icon={<ListChecks size={15} />}
        eyebrow="Execution Queue"
        title="Today's operating blocks"
        count={tasks.length}
      />

      <div className="mt-5 grid gap-3">
        <AnimatePresence>
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24, delay: i * 0.018, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            >
              <TaskCard task={task} onToggle={onToggle} updating={!!updating[task.id]} index={i + 1} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function TaskCard({
  task,
  onToggle,
  updating,
  index,
}: {
  task: ExecutionTask;
  onToggle: (t: ExecutionTask) => void;
  updating: boolean;
  index: number;
}) {
  const meta = getCategoryMeta(task.category);
  const timeRange =
    task.planned_start && task.planned_end
      ? `${formatTimeOnly(task.planned_start)}-${formatTimeOnly(task.planned_end)}`
      : null;

  const priorityTone = task.priority === 'critical' ? 'danger' : task.priority === 'high' ? 'warning' : 'muted';

  return (
    <div
      className={cx(
        'group relative overflow-hidden rounded-3xl p-3 transition-all duration-300 hover:-translate-y-[2px] sm:p-4',
        updating && 'opacity-60',
      )}
      style={{
        background: task.is_completed
          ? 'linear-gradient(135deg, color-mix(in srgb, var(--admin-success-bg) 78%, var(--admin-surface)), var(--admin-surface))'
          : 'linear-gradient(135deg, var(--admin-surface-hover), color-mix(in srgb, var(--admin-surface) 86%, var(--admin-surface-hover)))',
        border: `1px solid ${task.is_completed ? 'var(--admin-success-border)' : task.is_non_negotiable ? 'var(--admin-danger-border)' : 'var(--admin-border)'}`,
        boxShadow: task.is_completed ? 'none' : 'var(--admin-card-shadow, 0 18px 45px rgba(0,0,0,0.08))',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-[4px]"
        style={{ background: task.is_completed ? 'var(--admin-success)' : task.is_non_negotiable ? 'var(--admin-danger)' : meta.accent }}
      />

      <div className="relative grid gap-3 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-start">
        <div className="flex items-center gap-3 sm:block">
          <button
            type="button"
            onClick={() => onToggle(task)}
            disabled={updating}
            aria-label={task.is_completed ? 'Mark task incomplete' : 'Mark task complete'}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-200 hover:scale-105 disabled:cursor-not-allowed"
            style={{
              background: task.is_completed ? 'var(--admin-success-bg)' : 'var(--admin-surface)',
              border: `1px solid ${task.is_completed ? 'var(--admin-success)' : 'var(--admin-border-strong)'}`,
              color: task.is_completed ? 'var(--admin-success)' : 'var(--admin-text-muted)',
            }}
          >
            {updating ? <RefreshCw size={15} className="animate-spin" /> : task.is_completed ? <CheckCircle2 size={18} /> : <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'currentColor', opacity: 0.35 }} />}
          </button>

          <span className="font-mono text-[10px] sm:mt-2 sm:block sm:text-center" style={{ color: 'var(--admin-text-muted)' }}>
            #{String(index).padStart(2, '0')}
          </span>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {timeRange && <Badge label={timeRange} icon={<Clock size={11} />} tone="muted" />}
            <Badge label={meta.shortLabel || meta.label} icon={meta.icon} tone="custom" customColor={meta.accent} />
            <Badge label={PRIORITY_LABEL[task.priority] || task.priority} tone={priorityTone} />
            {task.is_non_negotiable && <Badge label="Non-negotiable" icon={<ShieldCheck size={11} />} tone="danger" />}
            <Badge label={`+${task.points} pts`} tone="accent" />
          </div>

          <h3
            className={cx('text-[15px] font-semibold leading-snug tracking-[-0.015em]', task.is_completed && 'line-through decoration-[1.5px]')}
            style={{ color: task.is_completed ? 'var(--admin-text-muted)' : 'var(--admin-text-primary)' }}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="mt-1.5 text-xs leading-5" style={{ color: task.is_completed ? 'var(--admin-text-faint)' : 'var(--admin-text-muted)' }}>
              {task.description}
            </p>
          )}

          {task.completed_at && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono" style={{ color: 'var(--admin-success)' }}>
              <CheckCircle2 size={11} /> Completed {formatTimeOnly(task.completed_at)}
            </p>
          )}
        </div>

        <div
          className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl sm:flex"
          style={{ background: meta.soft, color: meta.accent, border: '1px solid var(--admin-border)' }}
        >
          {meta.icon}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SIDEBAR COMPONENTS
// =============================================================================

function FocusCard({ planType }: { planType: string }) {
  const focusMessages: Record<string, { title: string; desc: string; icon: ReactNode }> = {
    heavy_lower_speed: {
      title: 'Heavy Lower + Speed',
      desc: 'Explosive speed, heavy legs, revenue work. No junk volume.',
      icon: <Dumbbell size={16} />,
    },
    upper_zone2: {
      title: 'Upper + Zone 2',
      desc: 'Build the engine, protect shoulders, improve systems.',
      icon: <Activity size={16} />,
    },
    conditioning_tennis: {
      title: 'Conditioning + Tennis',
      desc: 'Hard intervals, footwork, outreach and recovery discipline.',
      icon: <Flame size={16} />,
    },
    power_full_body: {
      title: 'Power + Full Body',
      desc: 'Explosive power, controlled strength, one finished business asset.',
      icon: <Zap size={16} />,
    },
    pre_match_activation: {
      title: 'Pre-Match Activation',
      desc: 'Prime the body, load carbs, prepare tactics. No ego fatigue.',
      icon: <ShieldCheck size={16} />,
    },
    matchday: {
      title: 'Matchday',
      desc: 'Perform, compete, recover, review. Everything serves the match.',
      icon: <Trophy size={16} />,
    },
    post_match_recovery: {
      title: 'Post-Match Recovery',
      desc: 'Recover, review, rebuild and prepare the next attack.',
      icon: <Activity size={16} />,
    },
    focus_day: {
      title: 'Focus Day',
      desc: 'Deep work first. Interruptions lose.',
      icon: <Target size={16} />,
    },
    revenue_day: {
      title: 'Revenue Day',
      desc: 'Sales, follow-ups and lead generation front and center.',
      icon: <Zap size={16} />,
    },
    admin_day: {
      title: 'Admin Day',
      desc: 'Clear backlog, organize systems, prepare the next block.',
      icon: <Clock size={16} />,
    },
    standard: {
      title: 'Standard Day',
      desc: 'Balanced execution across high-value priorities.',
      icon: <Gauge size={16} />,
    },
  };

  const focus = focusMessages[planType] || {
    title: getPlanTypeLabel(planType || 'Standard Day'),
    desc: 'Execute the plan. No excuses, no random task switching.',
    icon: <Gauge size={16} />,
  };

  return (
    <PremiumPanel>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: 'var(--admin-success-bg)', color: 'var(--admin-success)', border: '1px solid var(--admin-success-border)' }}>
          {focus.icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: 'var(--admin-success)' }}>
            Today's Focus
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-[-0.025em]" style={{ color: 'var(--admin-text-primary)' }}>
            {focus.title}
          </h3>
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--admin-text-muted)' }}>
            {focus.desc}
          </p>
        </div>
      </div>
    </PremiumPanel>
  );
}

function NonNegotiablesCard({ tasks, total, completed }: { tasks: ExecutionTask[]; total: number; completed: number }) {
  return (
    <PremiumPanel>
      <SectionHeader icon={<ShieldCheck size={15} />} eyebrow="Protocol" title="Non-negotiables" count={Math.max(total - completed, 0)} compact />

      <div className="mt-4 rounded-2xl p-3" style={{ background: 'var(--admin-danger-bg)', border: '1px solid var(--admin-danger-border)' }}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-mono" style={{ color: 'var(--admin-danger)' }}>
            {completed}/{total} complete
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--admin-text-muted)' }}>
            {total > 0 ? Math.round((completed / total) * 100) : 100}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--admin-surface-hover)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? (completed / total) * 100 : 100}%`, background: 'var(--admin-danger)' }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {tasks.length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl p-3" style={{ background: 'var(--admin-success-bg)', border: '1px solid var(--admin-success-border)' }}>
            <CheckCircle2 size={14} style={{ color: 'var(--admin-success)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--admin-text-secondary)' }}>
              All critical protocols complete.
            </p>
          </div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-2 rounded-2xl p-3" style={{ background: 'var(--admin-surface-hover)', border: '1px solid var(--admin-border)' }}>
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: 'var(--admin-danger)' }} />
              <p className="text-xs leading-5" style={{ color: 'var(--admin-text-secondary)' }}>
                {t.title}
              </p>
            </div>
          ))
        )}
      </div>
    </PremiumPanel>
  );
}

function CategoryBreakdown({
  breakdown,
}: {
  breakdown: Record<string, { total: number; completed: number; count: number; completedCount: number }>;
}) {
  const entries = Object.entries(breakdown).sort(([, a], [, b]) => b.total - a.total);
  if (entries.length === 0) return null;

  return (
    <PremiumPanel>
      <SectionHeader icon={<BarChart3 size={15} />} eyebrow="Distribution" title="Category breakdown" count={entries.length} compact />

      <div className="mt-4 space-y-3">
        {entries.map(([cat, { total, completed, count, completedCount }]) => {
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          const meta = getCategoryMeta(cat);

          return (
            <div key={cat}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: meta.soft, color: meta.accent }}>
                    {meta.icon}
                  </span>
                  <span className="truncate text-xs font-semibold" style={{ color: 'var(--admin-text-secondary)' }}>
                    {meta.label}
                  </span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'var(--admin-text-muted)' }}>
                  {completed}/{total} pts - {completedCount}/{count}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--admin-surface-hover)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                  style={{ background: pct >= 100 ? 'var(--admin-success)' : meta.accent }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </PremiumPanel>
  );
}

function ProtocolCard({ day, tasks }: { day: ExecutionDay; tasks: ExecutionTask[] }) {
  const firstTask = tasks[0];
  const lastTask = tasks[tasks.length - 1];

  return (
    <PremiumPanel>
      <SectionHeader icon={<Calendar size={15} />} eyebrow="Schedule" title="Operating window" compact />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniInfo label="Start" value={formatTimeOnly(firstTask?.planned_start || null)} />
        <MiniInfo label="Close" value={formatTimeOnly(lastTask?.planned_end || null)} />
        <MiniInfo label="Date" value={day.date} />
        <MiniInfo label="System" value="Active" />
      </div>
    </PremiumPanel>
  );
}

// =============================================================================
// STATE COMPONENTS
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <div className="h-72 animate-pulse rounded-[1.75rem]" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }} />
        <div className="space-y-3 rounded-[1.75rem] p-5" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl" style={{ background: 'var(--admin-surface-hover)' }} />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-[1.65rem]" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }} />
        ))}
      </div>
    </div>
  );
}

function EmptyExecutionState({
  onGenerate,
  generating,
}: {
  onGenerate: () => void;
  generating: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-2xl flex-col items-center justify-center py-24 text-center"
    >
      <div
        className="relative mb-7 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem]"
        style={{
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border-strong)',
          boxShadow: 'var(--admin-card-shadow, none)',
        }}
      >
        <Sparkles size={34} style={{ color: 'var(--admin-accent)' }} />
      </div>

      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--admin-accent-subtle)' }}>
        No active command file
      </p>
      <h2 className="text-3xl font-semibold tracking-[-0.045em]" style={{ color: 'var(--admin-text-primary)' }}>
        Generate today's execution plan
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-6" style={{ color: 'var(--admin-text-muted)' }}>
        Pull the correct weekday protocol from Supabase and start tracking the day with points, non-negotiables and execution status.
      </p>

      <button
        onClick={onGenerate}
        disabled={generating}
        className="mt-8 inline-flex items-center gap-3 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: generating ? 'var(--admin-surface-hover)' : 'var(--admin-button-primary-bg)',
          border: '1px solid var(--admin-button-primary-border)',
          color: 'var(--admin-accent)',
          boxShadow: 'var(--accent-glow)',
        }}
      >
        {generating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {generating ? 'Generating' : 'Generate Plan'}
      </button>
    </motion.div>
  );
}

function ErrorCard({ error, onClose, onRetry }: { error: string; onClose: () => void; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-5 overflow-hidden rounded-3xl border p-4"
      style={{ borderColor: 'var(--admin-danger-border)', background: 'var(--admin-danger-bg)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: 'var(--admin-surface)', color: 'var(--admin-danger)', border: '1px solid var(--admin-danger-border)' }}>
            <AlertTriangle size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: 'var(--admin-danger)' }}>
              Execution OS Error
            </p>
            <pre className="mt-2 max-w-full whitespace-pre-wrap break-words text-xs leading-5" style={{ color: 'var(--admin-danger)' }}>
              {error}
            </pre>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-danger-border)', color: 'var(--admin-danger)' }}
            >
              <RefreshCw size={13} /> Retry fetch
            </button>
          </div>
        </div>
        <button onClick={onClose} className="rounded-xl p-2 transition-all hover:scale-105" style={{ color: 'var(--admin-danger)' }}>
          <X size={15} />
        </button>
      </div>
    </motion.div>
  );
}

// =============================================================================
// SMALL UI PRIMITIVES
// =============================================================================

function PremiumPanel({ children }: { children: ReactNode }) {
  const panelStyle: CSSProperties = {
    background: 'var(--admin-surface)',
    border: '1px solid var(--admin-border)',
    boxShadow: 'var(--admin-card-shadow, none)',
  };

  return (
    <div className="rounded-[1.65rem] p-4" style={panelStyle}>
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  eyebrow,
  title,
  count,
  compact = false,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  count?: number;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: 'var(--admin-surface-hover)', color: 'var(--admin-accent)', border: '1px solid var(--admin-border)' }}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--admin-text-muted)' }}>
            {eyebrow}
          </p>
          <h3 className={cx('font-semibold tracking-[-0.03em]', compact ? 'text-sm' : 'text-lg')} style={{ color: 'var(--admin-text-primary)' }}>
            {title}
          </h3>
        </div>
      </div>
      {typeof count === 'number' && (
        <span className="rounded-full px-2.5 py-1 text-[10px] font-mono" style={{ background: 'var(--admin-surface-hover)', color: 'var(--admin-accent)', border: '1px solid var(--admin-border)' }}>
          {count}
        </span>
      )}
    </div>
  );
}

function LuxuryBadge({ icon, label, tone }: { icon?: ReactNode; label: string; tone: 'accent' | 'elite' | 'strong' | 'danger' }) {
  const color =
    tone === 'accent'
      ? 'var(--admin-accent)'
      : tone === 'elite'
        ? 'var(--admin-success)'
        : tone === 'strong'
          ? 'var(--admin-warning)'
          : 'var(--admin-danger)';

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 24%, transparent)`,
        color,
      }}
    >
      {icon}
      {label}
    </span>
  );
}

function Badge({
  label,
  icon,
  tone,
  customColor,
}: {
  label: string;
  icon?: ReactNode;
  tone: 'accent' | 'danger' | 'warning' | 'muted' | 'custom';
  customColor?: string;
}) {
  const color =
    tone === 'custom'
      ? customColor || 'var(--admin-accent)'
      : tone === 'accent'
        ? 'var(--admin-accent)'
        : tone === 'danger'
          ? 'var(--admin-danger)'
          : tone === 'warning'
            ? 'var(--admin-warning)'
            : 'var(--admin-text-muted)';

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em]"
      style={{
        background: `color-mix(in srgb, ${color} 9%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
        color,
      }}
    >
      {icon}
      {label}
    </span>
  );
}

function MetricTile({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}>
          {icon}
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: 'var(--admin-text-muted)' }}>
          {label}
        </span>
      </div>
      <p className="font-mono text-lg font-semibold tracking-[-0.03em]" style={{ color: 'var(--admin-text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: 'var(--admin-surface-hover)', border: '1px solid var(--admin-border)' }}>
      <p className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: 'var(--admin-text-muted)' }}>
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-xs capitalize" style={{ color: 'var(--admin-text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

export default ExecutionPage;
