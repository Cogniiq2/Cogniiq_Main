import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { AdminGate } from '../components/admin/AdminGate';
import { Calendar, CircleCheck as CheckCircle2, Clock, Target, Zap, TriangleAlert as AlertTriangle, ChevronRight, RefreshCw, X, Sparkles } from 'lucide-react';

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
  plan_date: string;
  title: string;
  plan_type: string;
  total_points: number;
  completed_points: number;
  score_percent: number;
  total_tasks: number;
  completed_tasks: number;
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
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const y = berlinTime.getFullYear();
  const m = String(berlinTime.getMonth() + 1).padStart(2, '0');
  const d = String(berlinTime.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimeOnly(time: string | null): string {
  if (!time) return '—';
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

const PRIORITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  critical: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#f87171' },
  high: { bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)', text: '#fb923c' },
  medium: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', text: '#60a5fa' },
  low: { bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.25)', text: '#9ca3af' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  focus: <Target size={12} />,
  revenue: <Zap size={12} />,
  planning: <Calendar size={12} />,
  admin: <Clock size={12} />,
  delivery: <CheckCircle2 size={12} />,
};

// =============================================================================
// MAIN PAGE
// =============================================================================

export function ExecutionPage() {
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

    console.log('[ExecutionPage] todayDate:', today);

    try {
      const { data: dayData, error: dayError } = await supabase
        .from('execution_days')
        .select('*')
        .eq('plan_date', today)
        .maybeSingle();

      console.log('[ExecutionPage] day:', dayData);
      console.log('[ExecutionPage] dayError:', dayError);

      if (dayError) throw dayError;

      setDay(dayData);

      if (dayData) {
        const { data: taskData, error: taskError } = await supabase
          .from('execution_tasks')
          .select('*')
          .eq('execution_day_id', dayData.id)
          .order('sort_order', { ascending: true });

        console.log('[ExecutionPage] tasks:', taskData);
        console.log('[ExecutionPage] tasksError:', taskError);

        if (taskError) throw taskError;
        setTasks(taskData || []);
      } else {
        console.log('[ExecutionPage] No day found, setting empty tasks');
        setTasks([]);
      }
    } catch (e: unknown) {
      console.error('[ExecutionPage] Fetch error:', e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      setError(`Fetch error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (task: ExecutionTask) => {
    setUpdating((p) => ({ ...p, [task.id]: true }));
    const newCompleted = !task.is_completed;
    const completedAt = newCompleted ? new Date().toISOString() : null;

    const { error: updateError } = await supabase
      .from('execution_tasks')
      .update({ is_completed: newCompleted, completed_at: completedAt })
      .eq('id', task.id);

    if (updateError) {
      setError(updateError.message);
      setUpdating((p) => ({ ...p, [task.id]: false }));
      return;
    }

    // Refetch to get updated scores from trigger
    await fetchData();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('generate_daily_execution_plan', {
        target_date: today,
      });
      if (rpcError) throw rpcError;
      await fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

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
      <div className="min-h-screen text-white font-sans" style={{ background: '#04080f' }}>
        {/* Ambient layer */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,180,255,0.04) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,100,200,0.035) 0%, transparent 70%)' }} />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px', opacity: 0.7 }} />
          <motion.div className="absolute left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.12) 50%, transparent 100%)' }} animate={{ top: ['0%', '100%'] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} />
        </div>

        {/* Header */}
        <header className="relative z-20 border-b" style={{ borderColor: 'rgba(0,212,255,0.07)', background: 'rgba(4,8,15,0.92)', backdropFilter: 'blur(20px)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.4) 30%, rgba(0,212,255,0.6) 50%, rgba(0,212,255,0.4) 70%, transparent 100%)' }} />
          <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 0 30px rgba(0,212,255,0.06)' }}>
                  <Zap size={18} style={{ color: '#00d4ff' }} />
                </div>
                <div>
                  <p className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: 'rgba(0,212,255,0.5)' }}>Cogniiq Execution OS</p>
                  <h1 className="text-base font-bold text-white/90 tracking-tight">Daily Command Center</h1>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>{today}</p>
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{formatDateGerman(today)}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="relative z-10 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
          {/* Debug info */}
          <div className="rounded-xl p-3 mb-4 font-mono text-[10px]" style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.1)' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Debug: </span>
            <span style={{ color: '#00d4ff' }}>todayDate={today}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}> | </span>
            <span style={{ color: day ? '#10b981' : '#f59e0b' }}>day={day ? 'found' : 'not found'}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}> | </span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>tasks={tasks.length}</span>
          </div>

          {/* Error state */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border p-4 mb-6" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} style={{ color: '#f87171' }} />
                    <span className="text-sm font-mono" style={{ color: '#f87171' }}>{error}</span>
                  </div>
                  <button onClick={() => setError(null)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#f87171' }}>
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
                <ScoreHeader day={day} />

                {/* Task timeline */}
                <div className="space-y-2.5">
                  <SectionLabel text="Execution Timeline" count={tasks.length} accent="#00d4ff" />
                  <AnimatePresence>
                    {tasks.map((task, i) => (
                      <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}>
                        <TaskCard task={task} onToggle={handleToggle} updating={!!updating[task.id]} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sidebar */}
              <div className="xl:w-[300px] flex-shrink-0">
                <div className="xl:sticky xl:top-[120px] space-y-4">
                  {/* Non-negotiables */}
                  {nonNegotiables.length > 0 && (
                    <NonNegotiablesCard tasks={nonNegotiables} />
                  )}

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
      <div className="rounded-2xl p-6" style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}>
        <div className="h-20 w-full rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}>
          <div className="h-16 w-full rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }} />
        </div>
      ))}
    </div>
  );
}

function EmptyExecutionState({ onGenerate, generating }: { onGenerate: () => void; generating: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', boxShadow: '0 0 40px rgba(0,212,255,0.06)' }}>
        <Calendar size={32} style={{ color: '#00d4ff' }} />
      </div>
      <h2 className="text-xl font-bold text-white/80 mb-2">No Plan for Today</h2>
      <p className="text-sm text-center max-w-md mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Generate your daily execution plan to start tracking progress and maximizing output.
      </p>
      <button
        onClick={onGenerate}
        disabled={generating}
        className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200"
        style={{
          background: generating ? 'rgba(0,212,255,0.08)' : 'rgba(0,212,255,0.12)',
          border: '1px solid rgba(0,212,255,0.25)',
          color: '#00d4ff',
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
            Generate Today's Plan
          </>
        )}
      </button>
    </motion.div>
  );
}

function ScoreHeader({ day }: { day: ExecutionDay }) {
  const scoreColor = day.score_percent >= 80 ? '#10b981' : day.score_percent >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Score circle */}
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle, ${scoreColor}08 0%, transparent 70%)`, border: `2px solid ${scoreColor}30` }}>
            <div className="text-center">
              <span className="text-3xl font-bold tabular-nums" style={{ color: scoreColor }}>{Math.round(day.score_percent)}</span>
              <span className="text-xs font-mono block" style={{ color: 'rgba(255,255,255,0.4)' }}>%</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBlock label="Points" value={`${day.completed_points}/${day.total_points}`} accent="#00d4ff" />
          <StatBlock label="Tasks" value={`${day.completed_tasks}/${day.total_tasks}`} accent="#10b981" />
          <StatBlock label="Status" value={day.status} accent={day.status === 'completed' ? '#10b981' : day.status === 'in_progress' ? '#f59e0b' : '#9ca3af'} />
          <StatBlock label="Type" value={day.plan_type.replace('_', ' ')} accent="#60a5fa" />
        </div>

        {/* Title */}
        <div className="lg:text-right">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Plan Title</p>
          <p className="text-sm font-semibold text-white/80">{day.title}</p>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
      <p className="text-sm font-semibold font-mono" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function TaskCard({ task, onToggle, updating }: { task: ExecutionTask; onToggle: (t: ExecutionTask) => void; updating: boolean }) {
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const timeRange = task.planned_start && task.planned_end ? `${formatTimeOnly(task.planned_start)}–${formatTimeOnly(task.planned_end)}` : null;

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-200 ${updating ? 'opacity-60' : ''}`}
      style={{
        background: task.is_completed ? 'rgba(16,185,129,0.04)' : 'rgba(0,212,255,0.03)',
        border: `1px solid ${task.is_completed ? 'rgba(16,185,129,0.12)' : 'rgba(0,212,255,0.08)'}`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task)}
          disabled={updating}
          className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 mt-0.5"
          style={{
            background: task.is_completed ? 'rgba(16,185,129,0.15)' : 'rgba(0,212,255,0.06)',
            border: `2px solid ${task.is_completed ? '#10b981' : 'rgba(0,212,255,0.3)'}`,
          }}
        >
          {task.is_completed && <CheckCircle2 size={14} style={{ color: '#10b981' }} />}
          {updating && !task.is_completed && <RefreshCw size={12} className="animate-spin" style={{ color: '#00d4ff' }} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {timeRange && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}>
                {timeRange}
              </span>
            )}
            <span className="text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded" style={{ background: priorityStyle.bg, color: priorityStyle.text, border: `1px solid ${priorityStyle.border}` }}>
              {task.priority}
            </span>
            {task.is_non_negotiable && (
              <span className="text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                NON-NEG
              </span>
            )}
            <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.06)', color: '#34d399', border: '1px solid rgba(16,185,129,0.12)' }}>
              +{task.points}pts
            </span>
          </div>

          <h3 className={`text-sm font-semibold mb-1 ${task.is_completed ? 'line-through opacity-50' : ''}`} style={{ color: task.is_completed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)' }}>
            {task.title}
          </h3>

          {task.description && (
            <p className="text-xs leading-relaxed" style={{ color: task.is_completed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.4)' }}>
              {task.description}
            </p>
          )}

          {task.completed_at && (
            <p className="text-[10px] font-mono mt-2" style={{ color: '#10b981' }}>
              Completed {formatTimeOnly(task.completed_at)}
            </p>
          )}
        </div>

        {/* Category icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.35)' }}>
          {CATEGORY_ICONS[task.category] || <Target size={12} />}
        </div>
      </div>
    </div>
  );
}

function NonNegotiablesCard({ tasks }: { tasks: ExecutionTask[] }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.1)' }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} style={{ color: '#f87171' }} />
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: '#f87171' }}>Non-Negotiables</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>All non-negotiables complete.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#f87171' }} />
              {t.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryBreakdown({ breakdown }: { breakdown: Record<string, { total: number; completed: number }> }) {
  const entries = Object.entries(breakdown);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Target size={14} style={{ color: '#00d4ff' }} />
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>Category Breakdown</span>
      </div>
      <div className="space-y-2.5">
        {entries.map(([cat, { total, completed }]) => {
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase flex-shrink-0 w-16" style={{ color: 'rgba(255,255,255,0.4)' }}>{cat}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : '#00d4ff' }} />
              </div>
              <span className="text-[10px] font-mono flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>{completed}/{total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FocusCard({ planType }: { planType: string }) {
  const focusMessages: Record<string, { title: string; desc: string }> = {
    focus_day: { title: 'Focus Day', desc: 'Deep work takes priority. Minimize meetings and interruptions.' },
    revenue_day: { title: 'Revenue Day', desc: 'Sales, outreach, and lead generation front and center.' },
    admin_day: { title: 'Admin Day', desc: 'Clear backlog, organize systems, prepare for the week ahead.' },
    standard: { title: 'Standard Day', desc: 'Balanced execution across all priorities.' },
  };
  const focus = focusMessages[planType] || focusMessages.standard;

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.1)' }}>
      <div className="flex items-center gap-2 mb-2">
        <ChevronRight size={14} style={{ color: '#10b981' }} />
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: '#10b981' }}>Today's Focus</span>
      </div>
      <p className="text-sm font-semibold text-white/80 mb-1">{focus.title}</p>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{focus.desc}</p>
    </div>
  );
}

function SectionLabel({ text, count, accent }: { text: string; count: number; accent: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-1 h-4 rounded-full" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
      <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>{text}</span>
      {count > 0 && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md" style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}>
          {count}
        </span>
      )}
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
  );
}

export default ExecutionPage;
