import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { AdminGate } from '../components/admin/AdminGate';
import { AdminThemeToggle } from '../components/admin/AdminThemeToggle';
import { useAdminTheme } from '../hooks/useAdminTheme';
import {
  Calendar,
  CircleCheck as CheckCircle2,
  Clock,
  Target,
  Zap,
  TriangleAlert as AlertTriangle,
  ChevronRight,
  RefreshCw,
  X,
  Sparkles,
  Dumbbell,
  Moon,
  Utensils,
  Activity,
  Briefcase,
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

// =============================================================================
// HELPERS
// =============================================================================

function getBerlinDateString(): string {
  const now = new Date();

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
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
  if (!time) return '—';

  // Handles DB time values like "05:00:00"
  if (/^\d{2}:\d{2}/.test(time)) {
    return time.slice(0, 5);
  }

  // Handles ISO timestamps like completed_at
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

function formatDateGerman(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getPlanTypeLabel(planType: string): string {
  return planType.replace(/_/g, ' ');
}

const CATEGORY_ICONS: Record<string, ReactNode> = {
  focus: <Target size={12} />,
  revenue: <Zap size={12} />,
  planning: <Calendar size={12} />,
  admin: <Clock size={12} />,
  delivery: <CheckCircle2 size={12} />,
  cogniiq: <Briefcase size={12} />,
  sales: <Zap size={12} />,
  training: <Dumbbell size={12} />,
  tennis: <Activity size={12} />,
  recovery: <Activity size={12} />,
  nutrition: <Utensils size={12} />,
  sleep: <Moon size={12} />,
  discipline: <Target size={12} />,
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDay(null);
    setTasks([]);

    console.log('[ExecutionPage] todayDate:', today);
    console.log('[ExecutionPage] DIRECT SUPABASE TEST START');

    try {
      const { data: directData, error: directError } = await supabase
        .from('execution_days')
        .select('*')
        .limit(1);

      console.log('[ExecutionPage] directData:', directData);
      console.log('[ExecutionPage] directError:', directError);

      if (directError) {
        throw new Error(`Direct Supabase test failed: ${getErrorMessage(directError)}`);
      }

      const { data: dayData, error: dayError } = await supabase
        .from('execution_days')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      console.log('[ExecutionPage] day:', dayData);
      console.log('[ExecutionPage] dayError:', dayError);

      if (dayError) {
        throw new Error(`Fetch execution day failed: ${getErrorMessage(dayError)}`);
      }

      setDay(dayData as ExecutionDay | null);

      if (!dayData) {
        console.log('[ExecutionPage] No day found, setting empty tasks');
        setTasks([]);
        return;
      }

      const { data: taskData, error: taskError } = await supabase
        .from('execution_tasks')
        .select('*')
        .eq('execution_day_id', dayData.id)
        .order('sort_order', { ascending: true });

      console.log('[ExecutionPage] execution_day_id:', dayData.id);
      console.log('[ExecutionPage] tasks:', taskData);
      console.log('[ExecutionPage] tasks count:', taskData?.length ?? 0);
      console.log('[ExecutionPage] tasksError:', taskError);

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

      console.log('[ExecutionPage] generate rpcError:', rpcError);

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

  const nonNegotiables = tasks.filter((t) => t.is_non_negotiable && !t.is_completed);

  const categoryBreakdown = tasks.reduce((acc, t) => {
    const cat = t.category || 'general';
    if (!acc[cat]) acc[cat] = { total: 0, completed: 0 };
    acc[cat].total += t.points;
    if (t.is_completed) acc[cat].completed += t.points;
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  return (
    <AdminGate>
      <div
        className="min-h-screen font-sans"
        style={{
          background: 'var(--admin-bg)',
          color: 'var(--admin-text-primary)',
        }}
      >
        {/* Ambient layer */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
            style={{ background: 'var(--admin-glow-radial)' }}
          />
          <div
            className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full"
            style={{ background: 'var(--admin-glow-radial)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(var(--admin-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--admin-grid-line) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              opacity: 0.7,
            }}
          />
          <motion.div
            className="absolute left-0 right-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, var(--admin-scan-line) 50%, transparent 100%)',
            }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Header */}
        <header
          className="relative z-20 border-b"
          style={{
            borderColor: 'var(--admin-header-border)',
            background: 'var(--admin-header-bg)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, var(--admin-header-scan) 30%, var(--admin-header-scan) 50%, var(--admin-header-scan) 70%, transparent 100%)',
            }}
          />
          <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'var(--admin-surface-hover)',
                    border: '1px solid var(--admin-border-strong)',
                    boxShadow: 'var(--accent-glow)',
                  }}
                >
                  <Zap size={18} style={{ color: 'var(--admin-accent)' }} />
                </div>
                <div>
                  <p
                    className="text-[9px] font-bold tracking-[0.28em] uppercase"
                    style={{ color: 'var(--admin-accent-subtle)' }}
                  >
                    Cogniiq Execution OS
                  </p>
                  <h1
                    className="text-base font-bold tracking-tight"
                    style={{ color: 'var(--admin-text-primary)' }}
                  >
                    Daily Command Center
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p
                    className="text-[10px] font-mono tracking-wide"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    {today}
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--admin-text-secondary)' }}
                  >
                    {formatDateGerman(today)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchData}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: 'var(--admin-surface-hover)',
                    border: '1px solid var(--admin-border)',
                    color: 'var(--admin-text-secondary)',
                  }}
                >
                  <RefreshCw size={13} />
                  Refresh
                </button>
                <AdminThemeToggle theme={theme} onToggle={toggleTheme} />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="relative z-10 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
          {/* Debug info */}
          <div
            className="rounded-xl p-3 mb-4 font-mono text-[10px]"
            style={{
              background: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
            }}
          >
            <span style={{ color: 'var(--admin-text-muted)' }}>Debug: </span>
            <span style={{ color: 'var(--admin-accent)' }}>todayDate={today}</span>
            <span style={{ color: 'var(--admin-text-faint)' }}> | </span>
            <span style={{ color: day ? 'var(--admin-success)' : 'var(--admin-warning)' }}>
              day={day ? 'found' : 'not found'}
            </span>
            <span style={{ color: 'var(--admin-text-faint)' }}> | </span>
            <span style={{ color: 'var(--admin-text-secondary)' }}>tasks={tasks.length}</span>
          </div>

          {/* Error state */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border p-4 mb-6"
                style={{
                  borderColor: 'var(--admin-danger-border)',
                  background: 'var(--admin-danger-bg)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: 'var(--admin-danger)' }}
                    />
                    <div>
                      <p
                        className="text-xs font-bold mb-1"
                        style={{ color: 'var(--admin-danger)' }}
                      >
                        Execution OS Error
                      </p>
                      <pre
                        className="text-xs font-mono whitespace-pre-wrap break-words max-w-full"
                        style={{ color: 'var(--admin-danger)' }}
                      >
                        {error}
                      </pre>
                    </div>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ color: 'var(--admin-danger)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <LoadingSkeleton />
          ) : !day ? (
            <EmptyExecutionState onGenerate={handleGenerate} generating={generating} />
          ) : (
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Main column */}
              <div className="flex-1 min-w-0 space-y-5">
                {/* Score header */}
                <ScoreHeader
                  day={day}
                  completedTaskCount={completedTaskCount}
                  totalTaskCount={totalTaskCount}
                />

                {/* Task timeline */}
                <div className="space-y-2.5">
                  <SectionLabel text="Execution Timeline" count={tasks.length} accent="#00d4ff" />
                  <AnimatePresence>
                    {tasks.map((task, i) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{
                          duration: 0.3,
                          delay: i * 0.04,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <TaskCard
                          task={task}
                          onToggle={handleToggle}
                          updating={!!updating[task.id]}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sidebar */}
              <div className="xl:w-[300px] flex-shrink-0">
                <div className="xl:sticky xl:top-[120px] space-y-4">
                  {/* Non-negotiables */}
                  <NonNegotiablesCard tasks={nonNegotiables} />

                  {/* Category breakdown */}
                  <CategoryBreakdown breakdown={categoryBreakdown} />

                  {/* Focus indicator */}
                  <FocusCard planType={day.plan_type} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGate>
  );
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
        }}
      >
        <div
          className="h-20 w-full rounded-xl"
          style={{ background: 'var(--admin-surface-hover)' }}
        />
      </div>

      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-4"
          style={{
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
          }}
        >
          <div
            className="h-16 w-full rounded-lg"
            style={{ background: 'var(--admin-surface-hover)' }}
          />
        </div>
      ))}
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: 'var(--admin-surface-hover)',
          border: '1px solid var(--admin-border-strong)',
          boxShadow: 'var(--accent-glow)',
        }}
      >
        <Calendar size={32} style={{ color: 'var(--admin-accent)' }} />
      </div>

      <h2
        className="text-xl font-bold mb-2"
        style={{ color: 'var(--admin-text-primary)' }}
      >
        No Plan for Today
      </h2>

      <p
        className="text-sm text-center max-w-md mb-8"
        style={{ color: 'var(--admin-text-muted)' }}
      >
        Generate your daily execution plan to start tracking progress and maximizing output.
      </p>

      <button
        onClick={onGenerate}
        disabled={generating}
        className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200"
        style={{
          background: generating ? 'var(--admin-surface-hover)' : 'var(--admin-button-primary-bg)',
          border: '1px solid var(--admin-button-primary-border)',
          color: 'var(--admin-accent)',
          opacity: generating ? 0.6 : 1,
        }}
      >
        {generating ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Generate Today&apos;s Plan
          </>
        )}
      </button>
    </motion.div>
  );
}

function ScoreHeader({
  day,
  completedTaskCount,
  totalTaskCount,
}: {
  day: ExecutionDay;
  completedTaskCount: number;
  totalTaskCount: number;
}) {
  const scoreColor =
    day.score_percent >= 80
      ? 'var(--admin-success)'
      : day.score_percent >= 50
        ? 'var(--admin-warning)'
        : 'var(--admin-danger)';

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Score circle */}
        <div className="flex-shrink-0">
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, color-mix(in srgb, ${scoreColor} 8%, transparent) 0%, transparent 70%)`,
              border: `2px solid color-mix(in srgb, ${scoreColor} 30%, transparent)`,
            }}
          >
            <div className="text-center">
              <span
                className="text-3xl font-bold tabular-nums"
                style={{ color: scoreColor }}
              >
                {Math.round(day.score_percent || 0)}
              </span>
              <span
                className="text-xs font-mono block"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                %
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBlock
            label="Points"
            value={`${day.completed_points || 0}/${day.total_points || 0}`}
            colorKey="accent"
          />
          <StatBlock
            label="Tasks"
            value={`${completedTaskCount}/${totalTaskCount}`}
            colorKey="success"
          />
          <StatBlock
            label="Status"
            value={day.status || 'pending'}
            colorKey={
              day.status === 'completed'
                ? 'success'
                : day.status === 'in_progress'
                  ? 'warning'
                  : 'muted'
            }
          />
          <StatBlock
            label="Type"
            value={getPlanTypeLabel(day.plan_type || 'standard')}
            colorKey="info"
          />
        </div>

        {/* Title */}
        <div className="lg:text-right">
          <p
            className="text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: 'var(--admin-text-muted)' }}
          >
            Plan Title
          </p>
          <p
            className="text-sm font-semibold"
            style={{ color: 'var(--admin-text-primary)' }}
          >
            {day.title}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  colorKey,
}: {
  label: string;
  value: string;
  colorKey: 'accent' | 'success' | 'warning' | 'info' | 'muted';
}) {
  const colorMap: Record<string, string> = {
    accent: 'var(--admin-accent)',
    success: 'var(--admin-success)',
    warning: 'var(--admin-warning)',
    info: 'var(--admin-info)',
    muted: 'var(--admin-text-muted)',
  };

  return (
    <div
      className="px-4 py-3 rounded-xl"
      style={{
        background: 'var(--admin-surface-hover)',
        border: '1px solid var(--admin-border)',
      }}
    >
      <p
        className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1"
        style={{ color: 'var(--admin-text-muted)' }}
      >
        {label}
      </p>
      <p
        className="text-sm font-semibold font-mono"
        style={{ color: colorMap[colorKey] || 'var(--admin-text-secondary)' }}
      >
        {value}
      </p>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  updating,
}: {
  task: ExecutionTask;
  onToggle: (t: ExecutionTask) => void;
  updating: boolean;
}) {
  const timeRange =
    task.planned_start && task.planned_end
      ? `${formatTimeOnly(task.planned_start)}–${formatTimeOnly(task.planned_end)}`
      : null;

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-200 ${updating ? 'opacity-60' : ''}`}
      style={{
        background: task.is_completed ? 'var(--admin-success-bg)' : 'var(--admin-surface)',
        border: `1px solid ${
          task.is_completed ? 'var(--admin-success-border)' : 'var(--admin-border)'
        }`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task)}
          disabled={updating}
          className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 mt-0.5"
          style={{
            background: task.is_completed ? 'var(--admin-success-bg)' : 'var(--admin-surface-hover)',
            border: `2px solid ${
              task.is_completed ? 'var(--admin-success)' : 'var(--admin-border-strong)'
            }`,
          }}
        >
          {task.is_completed && (
            <CheckCircle2 size={14} style={{ color: 'var(--admin-success)' }} />
          )}
          {updating && !task.is_completed && (
            <RefreshCw
              size={12}
              className="animate-spin"
              style={{ color: 'var(--admin-accent)' }}
            />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {timeRange && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{
                  background: 'var(--admin-surface-hover)',
                  color: 'var(--admin-text-muted)',
                }}
              >
                {timeRange}
              </span>
            )}

            <span
              className="text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded"
              style={{
                background: `var(--admin-priority-${task.priority}-bg)`,
                color: `var(--admin-priority-${task.priority}-text)`,
                border: `1px solid var(--admin-priority-${task.priority}-border)`,
              }}
            >
              {task.priority}
            </span>

            {task.is_non_negotiable && (
              <span
                className="text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded"
                style={{
                  background: 'var(--admin-danger-bg)',
                  color: 'var(--admin-danger)',
                  border: '1px solid var(--admin-danger-border)',
                }}
              >
                NON-NEG
              </span>
            )}

            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded"
              style={{
                background: 'var(--admin-points-bg)',
                color: 'var(--admin-points-text)',
                border: '1px solid var(--admin-points-border)',
              }}
            >
              +{task.points}pts
            </span>
          </div>

          <h3
            className={`text-sm font-semibold mb-1 ${
              task.is_completed ? 'line-through opacity-50' : ''
            }`}
            style={{
              color: task.is_completed
                ? 'var(--admin-text-muted)'
                : 'var(--admin-text-primary)',
            }}
          >
            {task.title}
          </h3>

          {task.description && (
            <p
              className="text-xs leading-relaxed"
              style={{
                color: task.is_completed
                  ? 'var(--admin-text-faint)'
                  : 'var(--admin-text-muted)',
              }}
            >
              {task.description}
            </p>
          )}

          {task.completed_at && (
            <p
              className="text-[10px] font-mono mt-2"
              style={{ color: 'var(--admin-success)' }}
            >
              Completed {formatTimeOnly(task.completed_at)}
            </p>
          )}
        </div>

        {/* Category icon */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'var(--admin-surface-hover)',
            color: 'var(--admin-text-muted)',
          }}
        >
          {CATEGORY_ICONS[task.category] || <Target size={12} />}
        </div>
      </div>
    </div>
  );
}

function NonNegotiablesCard({ tasks }: { tasks: ExecutionTask[] }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--admin-danger-bg)',
        border: '1px solid var(--admin-danger-border)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} style={{ color: 'var(--admin-danger)' }} />
        <span
          className="text-[10px] font-bold tracking-[0.15em] uppercase"
          style={{ color: 'var(--admin-danger)' }}
        >
          Non-Negotiables
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
          All non-negotiables complete.
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--admin-text-secondary)' }}
            >
              <span
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{ background: 'var(--admin-danger)' }}
              />
              {t.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryBreakdown({
  breakdown,
}: {
  breakdown: Record<string, { total: number; completed: number }>;
}) {
  const entries = Object.entries(breakdown);
  if (entries.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Target size={14} style={{ color: 'var(--admin-accent)' }} />
        <span
          className="text-[10px] font-bold tracking-[0.15em] uppercase"
          style={{ color: 'var(--admin-text-muted)' }}
        >
          Category Breakdown
        </span>
      </div>

      <div className="space-y-2.5">
        {entries.map(([cat, { total, completed }]) => {
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <div key={cat} className="flex items-center gap-3">
              <span
                className="text-[10px] font-mono uppercase flex-shrink-0 w-20"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                {cat}
              </span>
              <div
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--admin-surface-hover)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 100 ? 'var(--admin-success)' : 'var(--admin-accent)',
                  }}
                />
              </div>
              <span
                className="text-[10px] font-mono flex-shrink-0"
                style={{ color: 'var(--admin-text-secondary)' }}
              >
                {completed}/{total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FocusCard({ planType }: { planType: string }) {
  const focusMessages: Record<string, { title: string; desc: string }> = {
    heavy_lower_speed: {
      title: 'Heavy Lower + Speed',
      desc: 'Explosive speed, heavy legs, and serious business output. No junk volume.',
    },
    upper_zone2: {
      title: 'Upper + Zone 2',
      desc: 'Build the engine, protect the shoulders, and improve systems.',
    },
    conditioning_tennis: {
      title: 'Conditioning + Tennis Movement',
      desc: 'Hard intervals, tennis footwork, outreach, and recovery discipline.',
    },
    power_full_body: {
      title: 'Power + Full Body',
      desc: 'Explosive power, controlled strength, and one finished business asset.',
    },
    pre_match_activation: {
      title: 'Pre-Match Activation',
      desc: 'Prime the body, load carbs, prepare tactics. No ego fatigue.',
    },
    matchday: {
      title: 'Matchday',
      desc: 'Perform, compete, recover, and review. Everything serves the match.',
    },
    post_match_recovery: {
      title: 'Post-Match Recovery',
      desc: 'Recover, review, rebuild, and prepare the next attack.',
    },
    focus_day: {
      title: 'Focus Day',
      desc: 'Deep work takes priority. Minimize meetings and interruptions.',
    },
    revenue_day: {
      title: 'Revenue Day',
      desc: 'Sales, outreach, and lead generation front and center.',
    },
    admin_day: {
      title: 'Admin Day',
      desc: 'Clear backlog, organize systems, prepare for the week ahead.',
    },
    standard: {
      title: 'Standard Day',
      desc: 'Balanced execution across all priorities.',
    },
  };

  const focus = focusMessages[planType] || {
    title: getPlanTypeLabel(planType || 'Standard Day'),
    desc: 'Execute the plan. No excuses, no random task switching.',
  };

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--admin-success-bg)',
        border: '1px solid var(--admin-success-border)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <ChevronRight size={14} style={{ color: 'var(--admin-success)' }} />
        <span
          className="text-[10px] font-bold tracking-[0.15em] uppercase"
          style={{ color: 'var(--admin-success)' }}
        >
          Today&apos;s Focus
        </span>
      </div>
      <p
        className="text-sm font-semibold mb-1"
        style={{ color: 'var(--admin-text-primary)' }}
      >
        {focus.title}
      </p>
      <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
        {focus.desc}
      </p>
    </div>
  );
}

function SectionLabel({
  text,
  count,
  accent,
}: {
  text: string;
  count: number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-1 h-4 rounded-full"
        style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
      />
      <span
        className="text-[10px] font-bold tracking-[0.2em] uppercase"
        style={{ color: 'var(--admin-text-muted)' }}
      >
        {text}
      </span>
      {count > 0 && (
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
          style={{
            background: `${accent}15`,
            color: accent,
            border: `1px solid ${accent}25`,
          }}
        >
          {count}
        </span>
      )}
      <div className="flex-1 h-px" style={{ background: 'var(--admin-border)' }} />
    </div>
  );
}

export default ExecutionPage;