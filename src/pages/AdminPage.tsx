import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Task, FilterOption } from '../components/admin/types';
import { getLocalDateString, sortTasks, formatMoney } from '../components/admin/types';
import { AdminGate } from '../components/admin/AdminGate';
import { AdminHeader } from '../components/admin/AdminHeader';
import { KpiStrip } from '../components/admin/KpiCard';
import { TaskCard } from '../components/admin/TaskCard';
import { NextBestAction } from '../components/admin/NextBestAction';
import { TaskFilters } from '../components/admin/TaskFilters';
import { CreateTaskPanel } from '../components/admin/QuickCreateModal';
import { OperatorIntelligence } from '../components/admin/OperatorIntelligence';
import { LoadingSkeleton, EmptyState } from '../components/admin/EmptyAndLoading';
import { useAdminTheme } from '../hooks/useAdminTheme';

/* filter helper */
function applyFilter(tasks: Task[], filter: FilterOption, search: string): Task[] {
  let r = tasks;
  if (filter === 'critical') r = r.filter((t) => t.priority === 'critical');
  else if (filter === 'high') r = r.filter((t) => t.priority === 'high');
  else if (filter !== 'all') r = r.filter((t) => t.category === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    r = r.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.category ?? '').toLowerCase().includes(q) ||
        (t.reason ?? '').toLowerCase().includes(q),
    );
  }
  return r;
}

/* page */
export function AdminPage() {
  const { theme, toggleTheme } = useAdminTheme();
  const today = getLocalDateString();

  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [todayOpen, setTodayOpen] = useState<Task[]>([]);
  const [todayCompleted, setTodayCompleted] = useState<Task[]>([]);
  const [overdueOpen, setOverdueOpen] = useState<Task[]>([]);
  const [completing, setCompleting] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  /* fetch */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const [a, b, c] = await Promise.all([
        supabase.from('tasks').select('*').eq('due_date', today).eq('status', 'open'),
        supabase.from('tasks').select('*').eq('due_date', today).eq('status', 'completed'),
        supabase.from('tasks').select('*').lt('due_date', today).eq('status', 'open'),
      ]);
      if (a.error) throw a.error;
      if (b.error) throw b.error;
      if (c.error) throw c.error;
      setTodayOpen(sortTasks(a.data ?? []));
      setTodayCompleted(b.data ?? []);
      setOverdueOpen(sortTasks(c.data ?? []));
    } catch (e: unknown) {
      setDbError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* complete */
  const handleComplete = useCallback(async (id: string) => {
    setCompleting((p) => ({ ...p, [id]: true }));
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: now })
      .eq('id', id);
    setCompleting((p) => ({ ...p, [id]: false }));
    if (error) { showToast('Failed: ' + error.message, false); return; }
    setTodayOpen((prev) => {
      const t = prev.find((x) => x.id === id);
      if (t) setTodayCompleted((c) => [{ ...t, status: 'completed', completed_at: now }, ...c]);
      return prev.filter((x) => x.id !== id);
    });
    setOverdueOpen((prev) => prev.filter((x) => x.id !== id));
    showToast('Task completed.', true);
  }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  /* derived */
  const nextTask = todayOpen[0] ?? null;
  const filtered = applyFilter(todayOpen, filter, search);
  const moneyToday = todayOpen.reduce((s, t) => s + (t.money_impact ?? 0), 0);
  const criticalHigh = todayOpen.filter((t) => t.priority === 'critical' || t.priority === 'high').length;
  const revenueTasks = [...todayOpen, ...overdueOpen]
    .filter((t) => t.money_impact != null && t.money_impact > 0)
    .sort((a, b) => (b.money_impact ?? 0) - (a.money_impact ?? 0));

  const showTodayQueue = activeTab === 'overview' || activeTab === 'today';
  const showOverdue = activeTab === 'overview' || activeTab === 'overdue';
  const showCompleted = activeTab === 'overview' || activeTab === 'completed';
  const showRevenue = activeTab === 'revenue';

  /* render */
  return (
    <AdminGate>
      <div className="admin-root min-h-screen overflow-hidden font-sans" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-primary)' }}>
        <AmbientLayer />

        <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} todayCount={todayOpen.length} overdueCount={overdueOpen.length} theme={theme} onThemeToggle={toggleTheme} />

        <main className="relative z-10 mx-auto max-w-[1760px] px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <CommandOverview
            today={today}
            activeTab={activeTab}
            todayOpen={todayOpen}
            todayCompleted={todayCompleted}
            overdueOpen={overdueOpen}
            criticalHigh={criticalHigh}
            moneyToday={moneyToday}
            loading={loading}
            onCreate={() => setCreateOpen(true)}
          />

          <div className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
              <AnimatePresence>
                {dbError && <DbErrorBanner error={dbError} />}
              </AnimatePresence>

              <section className="rounded-[1.65rem] border p-3 sm:p-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', boxShadow: 'var(--admin-card-shadow, none)' }}>
                <KpiStrip
                  todayOpen={todayOpen.length}
                  criticalHigh={criticalHigh}
                  overdueCount={overdueOpen.length}
                  moneyToday={moneyToday}
                />
              </section>

              <section className="rounded-[1.65rem] border p-3 sm:p-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', boxShadow: 'var(--admin-card-shadow, none)' }}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <TaskFilters active={filter} search={search} onChange={setFilter} onSearch={setSearch} />
                  </div>
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-0.5 lg:ml-auto"
                    style={{ background: 'var(--admin-button-primary-bg)', borderColor: 'var(--admin-button-primary-border)', color: 'var(--admin-accent)', boxShadow: 'var(--accent-glow)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--admin-button-primary-hover)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--admin-button-primary-bg)'; }}
                  >
                    <span className="text-base leading-none">+</span> New Task
                  </button>
                </div>
              </section>

              {!loading && nextTask && showTodayQueue && (
                <section>
                  <SectionLabel text="Next Best Action" count={1} accent="var(--admin-accent)" />
                  <NextBestAction task={nextTask} onComplete={handleComplete} completing={!!completing[nextTask.id]} />
                </section>
              )}

              {showTodayQueue && (
                <section>
                  <SectionLabel text="Execution Queue" count={filtered.length} accent="var(--admin-accent)" />
                  {loading ? <LoadingSkeleton /> : filtered.length === 0 ? (
                    <EmptyState message="Execution queue is empty." sub="No tasks match the current filter - or create the first one." action={{ label: '+ New Task', onClick: () => setCreateOpen(true) }} />
                  ) : (
                    <div className="space-y-2.5">
                      <AnimatePresence>
                        {filtered.map((task, i) => (
                          <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }} transition={{ duration: 0.28, delay: i * 0.025, ease: [0.22, 1, 0.36, 1] }}>
                            <TaskCard task={task} onComplete={handleComplete} completing={!!completing[task.id]} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </section>
              )}

              {showOverdue && (
                <section>
                  <SectionLabel text="Overdue - Fix These First" count={overdueOpen.length} accent="var(--admin-warning)" />
                  {loading ? <LoadingSkeleton /> : overdueOpen.length === 0 ? (
                    <CleanState />
                  ) : (
                    <div className="space-y-2.5 rounded-[1.65rem] border p-3 sm:p-4" style={{ borderColor: 'var(--admin-warning-border)', background: 'var(--admin-warning-bg)' }}>
                      <AnimatePresence>
                        {overdueOpen.map((task, i) => (
                          <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.28, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}>
                            <TaskCard task={task} onComplete={handleComplete} completing={!!completing[task.id]} overdue />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </section>
              )}

              {showCompleted && (
                <section>
                  <SectionLabel text="Completed Today" count={todayCompleted.length} accent="var(--admin-success)" />
                  {loading ? <LoadingSkeleton /> : todayCompleted.length === 0 ? (
                    <EmptyState message="No completed tasks yet today." />
                  ) : (
                    <div className="space-y-2">
                      {todayCompleted.map((task) => (
                        <TaskCard key={task.id} task={task} onComplete={() => {}} muted />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {showRevenue && (
                <section>
                  <SectionLabel text="Revenue Focus" count={revenueTasks.length} accent="var(--admin-success)" />
                  {loading ? <LoadingSkeleton /> : revenueTasks.length === 0 ? (
                    <EmptyState message="No revenue-linked tasks." sub="Add money impact to the tasks that move the business forward." />
                  ) : (
                    <div className="space-y-2.5">
                      {revenueTasks.map((task, i) => (
                        <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, delay: i * 0.025, ease: [0.22, 1, 0.36, 1] }}>
                          <TaskCard task={task} onComplete={handleComplete} completing={!!completing[task.id]} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

            <aside className="min-w-0">
              <div className="space-y-4 2xl:sticky 2xl:top-[100px]">
                <div className="rounded-[1.65rem] border p-3" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', boxShadow: 'var(--admin-card-shadow, none)' }}>
                  <OperatorIntelligence todayOpen={todayOpen} overdueOpen={overdueOpen} dbStatus={dbError ? 'error' : 'ok'} dbError={dbError ?? undefined} />
                </div>
              </div>
            </aside>
          </div>
        </main>

        <CreateTaskPanel open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); fetchAll(); showToast('Task created.', true); }} today={today} />

        <AnimatePresence>
          {toast && <Toast toast={toast} />}
        </AnimatePresence>
      </div>
    </AdminGate>
  );
}

function AmbientLayer() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% -8%, color-mix(in srgb, var(--admin-accent) 12%, transparent), transparent 34%), radial-gradient(circle at 85% 12%, color-mix(in srgb, var(--admin-success) 8%, transparent), transparent 30%), linear-gradient(180deg, color-mix(in srgb, var(--admin-surface) 18%, transparent), transparent 48%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(var(--admin-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--admin-grid-line) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(to bottom, black, transparent 72%)',
          opacity: 0.35,
        }}
      />
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--admin-scan-line) 50%, transparent 100%)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

function CommandOverview({
  today,
  activeTab,
  todayOpen,
  todayCompleted,
  overdueOpen,
  criticalHigh,
  moneyToday,
  loading,
  onCreate,
}: {
  today: string;
  activeTab: string;
  todayOpen: Task[];
  todayCompleted: Task[];
  overdueOpen: Task[];
  criticalHigh: number;
  moneyToday: number;
  loading: boolean;
  onCreate: () => void;
}) {
  const totalToday = todayOpen.length + todayCompleted.length;
  const completion = totalToday > 0 ? Math.round((todayCompleted.length / totalToday) * 100) : 0;

  return (
    <section
      className="relative overflow-hidden rounded-[1.9rem] border p-4 sm:p-5 lg:p-6"
      style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--admin-surface) 96%, transparent), color-mix(in srgb, var(--admin-surface-hover) 72%, var(--admin-surface)))',
        borderColor: 'var(--admin-border-strong)',
        boxShadow: 'var(--admin-card-shadow, 0 24px 70px rgba(0,0,0,0.12))',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--admin-accent) 48%, transparent), color-mix(in srgb, var(--admin-success) 32%, transparent), transparent)' }} />
      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-accent)' }}>
              Command Center
            </span>
            <span className="rounded-full border px-2.5 py-1 text-[10px] font-mono capitalize" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text-muted)' }}>
              {activeTab}
            </span>
            <span className="rounded-full border px-2.5 py-1 text-[10px] font-mono" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)', color: loading ? 'var(--admin-warning)' : 'var(--admin-success)' }}>
              {loading ? 'Syncing' : 'Live'}
            </span>
          </div>

          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl lg:text-5xl" style={{ color: 'var(--admin-text-primary)' }}>
            Operate the day from one clean cockpit.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: 'var(--admin-text-muted)' }}>
            Today is {today}. Protect attention, clear critical work first, and keep revenue momentum visible.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCreate}
              className="rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'var(--admin-button-primary-bg)', borderColor: 'var(--admin-button-primary-border)', color: 'var(--admin-accent)', boxShadow: 'var(--accent-glow)' }}
            >
              + New Task
            </button>
            <div className="rounded-2xl border px-4 py-3 text-xs font-mono" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}>
              Revenue at stake: <span style={{ color: 'var(--admin-success)' }}>{formatMoney(moneyToday)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <HeroMetric label="Open" value={todayOpen.length} tone="accent" />
          <HeroMetric label="Completed" value={todayCompleted.length} tone="success" />
          <HeroMetric label="Critical/High" value={criticalHigh} tone="warning" />
          <HeroMetric label="Overdue" value={overdueOpen.length} tone="danger" />
          <div className="col-span-2 rounded-3xl border p-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: 'var(--admin-text-muted)' }}>Daily Completion</span>
              <span className="font-mono text-xs" style={{ color: 'var(--admin-text-secondary)' }}>{completion}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--admin-surface-hover)' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: 'linear-gradient(90deg, var(--admin-accent), var(--admin-success))' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ label, value, tone }: { label: string; value: number; tone: 'accent' | 'success' | 'warning' | 'danger' }) {
  const color =
    tone === 'success'
      ? 'var(--admin-success)'
      : tone === 'warning'
        ? 'var(--admin-warning)'
        : tone === 'danger'
          ? 'var(--admin-danger)'
          : 'var(--admin-accent)';

  return (
    <div className="rounded-3xl border p-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: 'var(--admin-text-muted)' }}>{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.05em]" style={{ color }}>{value}</p>
    </div>
  );
}

function DbErrorBanner({ error }: { error: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-[1.4rem] border px-5 py-4"
      style={{ borderColor: 'var(--admin-danger-border)', background: 'var(--admin-danger-bg)' }}
    >
      <p className="mb-1 font-mono text-sm font-semibold" style={{ color: 'var(--admin-danger)' }}>ERR: supabase_connection_failed</p>
      <p className="font-mono text-xs leading-5" style={{ color: 'var(--admin-danger)', opacity: 0.72 }}>{error}</p>
    </motion.div>
  );
}

function CleanState() {
  return (
    <div className="flex items-center gap-3 rounded-[1.4rem] border px-5 py-4" style={{ borderColor: 'var(--admin-success-border)', background: 'var(--admin-success-bg)' }}>
      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: 'var(--admin-success)', boxShadow: '0 0 10px var(--admin-success)' }} />
      <span className="font-mono text-sm" style={{ color: 'var(--admin-success)' }}>No overdue tasks. Execution is clean.</span>
    </div>
  );
}

function Toast({ toast }: { toast: { msg: string; ok: boolean } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 right-6 z-[500] flex items-center gap-2.5 rounded-2xl border px-4 py-3 font-mono text-sm"
      style={{
        background: 'var(--admin-surface-elevated)',
        backdropFilter: 'blur(20px)',
        borderColor: toast.ok ? 'var(--admin-success-border)' : 'var(--admin-danger-border)',
        color: toast.ok ? 'var(--admin-success)' : 'var(--admin-danger)',
        boxShadow: `0 18px 60px ${toast.ok ? 'rgba(90,138,106,0.18)' : 'rgba(184,90,90,0.18)'}`,
      }}
    >
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: toast.ok ? 'var(--admin-success)' : 'var(--admin-danger)' }} />
      {toast.msg}
    </motion.div>
  );
}

/* Section label */
function SectionLabel({ text, count, accent }: { text: string; count: number; accent: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="h-4 w-1 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
      <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--admin-text-muted)' }}>{text}</span>
      {count > 0 && (
        <span className="rounded-full px-2 py-0.5 font-mono text-[10px]" style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, border: `1px solid color-mix(in srgb, ${accent} 24%, transparent)` }}>
          {count}
        </span>
      )}
      <div className="h-px flex-1" style={{ background: 'var(--admin-border)' }} />
    </div>
  );
}