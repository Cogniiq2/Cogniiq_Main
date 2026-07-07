import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Task, FilterOption } from '../components/admin/types';
import { getLocalDateString, sortTasks, formatMoney } from '../components/admin/types';
import { AdminGate } from '../components/admin/AdminGate';
import { CreateTaskPanel } from '../components/admin/QuickCreateModal';
import { useAdminTheme } from '../hooks/useAdminTheme';

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

  return (
    <AdminGate>
      <div className="min-h-screen overflow-hidden font-sans" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-primary)' }}>
        <LuxuryBackdrop />

        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          todayCount={todayOpen.length}
          overdueCount={overdueOpen.length}
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        <main className="relative z-10 mx-auto max-w-[1780px] px-4 pb-10 pt-5 sm:px-6 lg:px-8 xl:px-10">
          <PrivateOfficeHero
            today={today}
            loading={loading}
            todayOpen={todayOpen}
            todayCompleted={todayCompleted}
            overdueOpen={overdueOpen}
            criticalHigh={criticalHigh}
            moneyToday={moneyToday}
            onCreate={() => setCreateOpen(true)}
          />

          <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_370px]">
            <div className="min-w-0 space-y-6">
              <AnimatePresence>
                {dbError && <ConnectionNotice error={dbError} />}
              </AnimatePresence>

              <FilterBar
                tasks={todayOpen}
                active={filter}
                search={search}
                onChange={setFilter}
                onSearch={setSearch}
                onCreate={() => setCreateOpen(true)}
              />

              {!loading && nextTask && showTodayQueue && (
                <PrioritySuite task={nextTask} completing={!!completing[nextTask.id]} onComplete={handleComplete} />
              )}

              {showTodayQueue && (
                <TaskSection
                  title="Today"
                  subtitle="The work that deserves your full attention now."
                  count={filtered.length}
                >
                  {loading ? <LoadingGallery /> : filtered.length === 0 ? (
                    <EmptyPanel
                      title="Nothing here right now"
                      text="No tasks match this view. Adjust the filter or create a new priority."
                      actionLabel="New Task"
                      onAction={() => setCreateOpen(true)}
                    />
                  ) : (
                    <TaskGallery>
                      {filtered.map((task, i) => (
                        <LuxuryTaskCard
                          key={task.id}
                          task={task}
                          index={i + 1}
                          completing={!!completing[task.id]}
                          onComplete={handleComplete}
                        />
                      ))}
                    </TaskGallery>
                  )}
                </TaskSection>
              )}

              {showOverdue && (
                <TaskSection
                  title="Needs attention"
                  subtitle="Clear these first so the day feels expensive again."
                  count={overdueOpen.length}
                  tone="warning"
                >
                  {loading ? <LoadingGallery /> : overdueOpen.length === 0 ? (
                    <CleanSlate />
                  ) : (
                    <TaskGallery>
                      {overdueOpen.map((task, i) => (
                        <LuxuryTaskCard
                          key={task.id}
                          task={task}
                          index={i + 1}
                          completing={!!completing[task.id]}
                          onComplete={handleComplete}
                          overdue
                        />
                      ))}
                    </TaskGallery>
                  )}
                </TaskSection>
              )}

              {showCompleted && (
                <TaskSection
                  title="Finished"
                  subtitle="Proof that the day is moving."
                  count={todayCompleted.length}
                  tone="success"
                >
                  {loading ? <LoadingGallery /> : todayCompleted.length === 0 ? (
                    <EmptyPanel title="No finished tasks yet" text="Complete the first important item and let the momentum begin." />
                  ) : (
                    <TaskGallery>
                      {todayCompleted.map((task, i) => (
                        <LuxuryTaskCard key={task.id} task={task} index={i + 1} onComplete={() => {}} muted />
                      ))}
                    </TaskGallery>
                  )}
                </TaskSection>
              )}

              {showRevenue && (
                <TaskSection
                  title="Revenue room"
                  subtitle="Every task here has a direct money signal."
                  count={revenueTasks.length}
                  tone="success"
                >
                  {loading ? <LoadingGallery /> : revenueTasks.length === 0 ? (
                    <EmptyPanel title="No revenue-linked tasks" text="Add money impact to the tasks that move the business forward." />
                  ) : (
                    <TaskGallery>
                      {revenueTasks.map((task, i) => (
                        <LuxuryTaskCard
                          key={task.id}
                          task={task}
                          index={i + 1}
                          completing={!!completing[task.id]}
                          onComplete={handleComplete}
                        />
                      ))}
                    </TaskGallery>
                  )}
                </TaskSection>
              )}
            </div>

            <aside className="min-w-0">
              <PrivateBriefing
                todayOpen={todayOpen}
                todayCompleted={todayCompleted}
                overdueOpen={overdueOpen}
                dbError={dbError}
                moneyToday={moneyToday}
                criticalHigh={criticalHigh}
                nextTask={nextTask}
                revenueTasks={revenueTasks}
              />
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

function LuxuryBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--admin-bg) 96%, white), var(--admin-bg) 48%, color-mix(in srgb, var(--admin-surface) 34%, var(--admin-bg)))',
        }}
      />
      <div
        className="absolute left-[-12%] top-[-20%] h-[560px] w-[560px] rounded-full blur-3xl"
        style={{ background: 'color-mix(in srgb, var(--admin-accent) 10%, transparent)' }}
      />
      <div
        className="absolute bottom-[-18%] right-[-10%] h-[620px] w-[620px] rounded-full blur-3xl"
        style={{ background: 'color-mix(in srgb, var(--admin-success) 8%, transparent)' }}
      />
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{
          background: 'linear-gradient(180deg, color-mix(in srgb, white 5%, transparent), transparent)',
        }}
      />
    </div>
  );
}

function TopBar({
  activeTab,
  onTabChange,
  todayCount,
  overdueCount,
  theme,
  onThemeToggle,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  todayCount: number;
  overdueCount: number;
  theme: string;
  onThemeToggle: () => void;
}) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'today', label: 'Today', count: todayCount },
    { id: 'overdue', label: 'Attention', count: overdueCount },
    { id: 'completed', label: 'Finished' },
    { id: 'revenue', label: 'Revenue' },
  ];

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        background: 'color-mix(in srgb, var(--admin-bg) 86%, transparent)',
        borderColor: 'var(--admin-border)',
        backdropFilter: 'blur(24px)',
      }}
    >
      <div className="mx-auto flex max-w-[1780px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em]" style={{ color: 'var(--admin-text-muted)' }}>
              COGNIIQ
            </p>
            <h1 className="text-xl font-semibold tracking-[-0.03em] sm:text-2xl" style={{ color: 'var(--admin-text-primary)' }}>
              Private Office
            </h1>
          </div>

          <button
            type="button"
            onClick={onThemeToggle}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'var(--admin-surface)',
              borderColor: 'var(--admin-border)',
              color: 'var(--admin-text-secondary)',
              boxShadow: 'var(--admin-card-shadow, none)',
            }}
          >
            {theme === 'dark' ? 'Evening' : 'Daylight'}
          </button>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? 'var(--admin-text-primary)' : 'var(--admin-surface)',
                  borderColor: active ? 'var(--admin-text-primary)' : 'var(--admin-border)',
                  color: active ? 'var(--admin-bg)' : 'var(--admin-text-secondary)',
                }}
              >
                {tab.label}
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px]"
                    style={{
                      background: active ? 'color-mix(in srgb, var(--admin-bg) 18%, transparent)' : 'var(--admin-surface-hover)',
                      color: active ? 'var(--admin-bg)' : 'var(--admin-text-muted)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function PrivateOfficeHero({
  today,
  loading,
  todayOpen,
  todayCompleted,
  overdueOpen,
  criticalHigh,
  moneyToday,
  onCreate,
}: {
  today: string;
  loading: boolean;
  todayOpen: Task[];
  todayCompleted: Task[];
  overdueOpen: Task[];
  criticalHigh: number;
  moneyToday: number;
  onCreate: () => void;
}) {
  const total = todayOpen.length + todayCompleted.length;
  const completion = total > 0 ? Math.round((todayCompleted.length / total) * 100) : 0;

  return (
    <section
      className="relative overflow-hidden rounded-lg border p-5 sm:p-7 lg:p-8"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--admin-surface) 94%, white), color-mix(in srgb, var(--admin-surface-hover) 72%, var(--admin-surface)))',
        borderColor: 'var(--admin-border-strong)',
        boxShadow: 'var(--admin-card-shadow, 0 34px 90px rgba(0,0,0,0.10))',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--admin-accent), transparent)' }}
      />

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_480px] xl:items-end">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Pill label={loading ? 'Preparing the room' : 'Everything is live'} tone={loading ? 'warning' : 'success'} />
            <Pill label={today} />
          </div>

          <h2 className="max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl" style={{ color: 'var(--admin-text-primary)' }}>
            The calmest place to run your day.
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-7" style={{ color: 'var(--admin-text-muted)' }}>
            A focused command room for the tasks that build Cogniiq, protect your standards and move revenue forward.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCreate}
              className="rounded-lg border px-5 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'var(--admin-text-primary)',
                borderColor: 'var(--admin-text-primary)',
                color: 'var(--admin-bg)',
              }}
            >
              New Task
            </button>
            <div
              className="rounded-lg border px-5 py-3 text-sm"
              style={{
                background: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text-secondary)',
              }}
            >
              Revenue in motion: <span className="font-semibold" style={{ color: 'var(--admin-success)' }}>{formatMoney(moneyToday)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <HeroStat label="Open" value={todayOpen.length} />
          <HeroStat label="Finished" value={todayCompleted.length} tone="success" />
          <HeroStat label="Critical" value={criticalHigh} tone="warning" />
          <HeroStat label="Overdue" value={overdueOpen.length} tone="danger" />

          <div className="col-span-2 rounded-lg border p-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--admin-text-secondary)' }}>
                Day completion
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--admin-text-primary)' }}>
                {completion}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--admin-surface-hover)' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: 'linear-gradient(90deg, var(--admin-accent), var(--admin-success))' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterBar({
  tasks,
  active,
  search,
  onChange,
  onSearch,
  onCreate,
}: {
  tasks: Task[];
  active: FilterOption;
  search: string;
  onChange: (filter: FilterOption) => void;
  onSearch: (value: string) => void;
  onCreate: () => void;
}) {
  const categories = Array.from(new Set(tasks.map((t) => t.category).filter(Boolean))).slice(0, 6);
  const filters: Array<{ label: string; value: FilterOption }> = [
    { label: 'All', value: 'all' as FilterOption },
    { label: 'Critical', value: 'critical' as FilterOption },
    { label: 'High', value: 'high' as FilterOption },
    ...categories.map((category) => ({
      label: titleCase(category),
      value: category as FilterOption,
    })),
  ];

  return (
    <section
      className="rounded-lg border p-3 sm:p-4"
      style={{
        background: 'color-mix(in srgb, var(--admin-surface) 92%, transparent)',
        borderColor: 'var(--admin-border)',
        boxShadow: 'var(--admin-card-shadow, none)',
      }}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1 xl:pb-0">
          {filters.map((item) => {
            const selected = active === item.value;
            return (
              <button
                key={String(item.value)}
                type="button"
                onClick={() => onChange(item.value)}
                className="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  background: selected ? 'var(--admin-text-primary)' : 'var(--admin-surface)',
                  borderColor: selected ? 'var(--admin-text-primary)' : 'var(--admin-border)',
                  color: selected ? 'var(--admin-bg)' : 'var(--admin-text-secondary)',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row xl:w-[460px]">
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search your priorities"
            className="h-11 min-w-0 flex-1 rounded-lg border px-4 text-sm outline-none transition-all"
            style={{
              background: 'var(--admin-surface)',
              borderColor: 'var(--admin-border)',
              color: 'var(--admin-text-primary)',
            }}
          />
          <button
            type="button"
            onClick={onCreate}
            className="h-11 rounded-lg border px-4 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'var(--admin-text-primary)',
              borderColor: 'var(--admin-text-primary)',
              color: 'var(--admin-bg)',
            }}
          >
            New Task
          </button>
        </div>
      </div>
    </section>
  );
}

function PrioritySuite({
  task,
  completing,
  onComplete,
}: {
  task: Task;
  completing: boolean;
  onComplete: (id: string) => void;
}) {
  const priority = priorityDesign(task.priority);

  return (
    <section
      className="rounded-lg border p-5 sm:p-6"
      style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--admin-surface) 96%, white), color-mix(in srgb, var(--admin-surface-hover) 72%, var(--admin-surface)))',
        borderColor: 'var(--admin-border-strong)',
        boxShadow: 'var(--admin-card-shadow, none)',
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>
            First move
          </p>
          <h3 className="text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-3xl" style={{ color: 'var(--admin-text-primary)' }}>
            {task.title}
          </h3>
          {(task.description || task.reason) && (
            <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: 'var(--admin-text-muted)' }}>
              {task.description || task.reason}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill label={titleCase(task.category || 'General')} />
            <Pill label={priority.label} tone={priority.tone} />
            {(task.money_impact ?? 0) > 0 && <Pill label={formatMoney(task.money_impact ?? 0)} tone="success" />}
          </div>
        </div>

        <button
          type="button"
          disabled={completing}
          onClick={() => onComplete(task.id)}
          className="rounded-lg border px-5 py-4 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: 'var(--admin-text-primary)',
            borderColor: 'var(--admin-text-primary)',
            color: 'var(--admin-bg)',
          }}
        >
          {completing ? 'Finishing...' : 'Mark Complete'}
        </button>
      </div>
    </section>
  );
}

function TaskSection({
  title,
  subtitle,
  count,
  tone = 'default',
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  tone?: 'default' | 'warning' | 'success';
  children: React.ReactNode;
}) {
  const accent =
    tone === 'warning'
      ? 'var(--admin-warning)'
      : tone === 'success'
        ? 'var(--admin-success)'
        : 'var(--admin-accent)';

  return (
    <section>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 h-px w-16" style={{ background: accent }} />
          <h2 className="text-2xl font-semibold tracking-[-0.035em]" style={{ color: 'var(--admin-text-primary)' }}>
            {title}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--admin-text-muted)' }}>
            {subtitle}
          </p>
        </div>
        <span
          className="w-fit rounded-full border px-3 py-1 text-sm font-medium"
          style={{
            background: 'var(--admin-surface)',
            borderColor: 'var(--admin-border)',
            color: 'var(--admin-text-secondary)',
          }}
        >
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      </div>
      {children}
    </section>
  );
}

function TaskGallery({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3">{children}</div>;
}

function LuxuryTaskCard({
  task,
  index,
  onComplete,
  completing = false,
  muted = false,
  overdue = false,
}: {
  task: Task;
  index: number;
  onComplete: (id: string) => void;
  completing?: boolean;
  muted?: boolean;
  overdue?: boolean;
}) {
  const priority = priorityDesign(task.priority);
  const hasMoney = (task.money_impact ?? 0) > 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-lg border p-4 transition-all duration-300 hover:-translate-y-0.5 sm:p-5"
      style={{
        background: muted
          ? 'color-mix(in srgb, var(--admin-surface) 82%, transparent)'
          : 'linear-gradient(135deg, var(--admin-surface), color-mix(in srgb, var(--admin-surface-hover) 42%, var(--admin-surface)))',
        borderColor: overdue ? 'var(--admin-warning-border)' : muted ? 'var(--admin-success-border)' : 'var(--admin-border)',
        boxShadow: muted ? 'none' : 'var(--admin-card-shadow, 0 18px 44px rgba(0,0,0,0.07))',
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[56px_minmax(0,1fr)_auto] lg:items-start">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-semibold"
          style={{
            background: 'var(--admin-surface-hover)',
            borderColor: 'var(--admin-border)',
            color: muted ? 'var(--admin-success)' : 'var(--admin-text-muted)',
          }}
        >
          {muted ? 'Done' : String(index).padStart(2, '0')}
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <Pill label={titleCase(task.category || 'General')} />
            <Pill label={priority.label} tone={priority.tone} />
            {overdue && <Pill label="Needs attention" tone="warning" />}
            {hasMoney && <Pill label={formatMoney(task.money_impact ?? 0)} tone="success" />}
          </div>

          <h3
            className="text-lg font-semibold leading-snug tracking-[-0.02em]"
            style={{ color: muted ? 'var(--admin-text-muted)' : 'var(--admin-text-primary)' }}
          >
            {task.title}
          </h3>

          {(task.description || task.reason) && (
            <p className="mt-2 max-w-4xl text-sm leading-6" style={{ color: 'var(--admin-text-muted)' }}>
              {task.description || task.reason}
            </p>
          )}

          {task.reason && task.description && (
            <p className="mt-3 rounded-lg border px-3 py-2 text-sm" style={{ background: 'var(--admin-surface-hover)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-secondary)' }}>
              {task.reason}
            </p>
          )}
        </div>

        {!muted && (
          <button
            type="button"
            disabled={completing}
            onClick={() => onComplete(task.id)}
            className="rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: 'var(--admin-text-primary)',
              borderColor: 'var(--admin-text-primary)',
              color: 'var(--admin-bg)',
            }}
          >
            {completing ? 'Finishing...' : 'Complete'}
          </button>
        )}
      </div>
    </motion.article>
  );
}

function PrivateBriefing({
  todayOpen,
  todayCompleted,
  overdueOpen,
  dbError,
  moneyToday,
  criticalHigh,
  nextTask,
  revenueTasks,
}: {
  todayOpen: Task[];
  todayCompleted: Task[];
  overdueOpen: Task[];
  dbError: string | null;
  moneyToday: number;
  criticalHigh: number;
  nextTask: Task | null;
  revenueTasks: Task[];
}) {
  const total = todayOpen.length + todayCompleted.length;
  const completion = total > 0 ? Math.round((todayCompleted.length / total) * 100) : 0;
  const topRevenue = revenueTasks[0] ?? null;

  return (
    <div className="space-y-4 2xl:sticky 2xl:top-[116px]">
      <Panel>
        <p className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>Room status</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold tracking-[-0.03em]" style={{ color: 'var(--admin-text-primary)' }}>
            {dbError ? 'Needs attention' : 'Composed'}
          </h3>
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background: dbError ? 'var(--admin-danger)' : 'var(--admin-success)',
              boxShadow: dbError ? '0 0 12px var(--admin-danger)' : '0 0 12px var(--admin-success)',
            }}
          />
        </div>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--admin-text-muted)' }}>
          {dbError ? 'The task room is visible, but the connection needs a look.' : 'Tasks, focus and progress are flowing cleanly.'}
        </p>
      </Panel>

      <Panel>
        <p className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>Daily rhythm</p>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-4xl font-semibold tracking-[-0.06em]" style={{ color: 'var(--admin-text-primary)' }}>{completion}%</span>
          <span className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>{todayCompleted.length}/{total || 0} finished</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: 'var(--admin-surface-hover)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: 'linear-gradient(90deg, var(--admin-accent), var(--admin-success))' }}
          />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>Signals</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <SmallBrief label="Open" value={todayOpen.length} />
          <SmallBrief label="Critical" value={criticalHigh} />
          <SmallBrief label="Overdue" value={overdueOpen.length} tone="warning" />
          <SmallBrief label="Revenue" value={formatMoney(moneyToday)} tone="success" />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>First priority</p>
        {nextTask ? (
          <>
            <h3 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.02em]" style={{ color: 'var(--admin-text-primary)' }}>
              {nextTask.title}
            </h3>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--admin-text-muted)' }}>
              {nextTask.description || nextTask.reason || 'This is the cleanest next move.'}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm leading-6" style={{ color: 'var(--admin-text-muted)' }}>
            No open priority is waiting.
          </p>
        )}
      </Panel>

      <Panel>
        <p className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>Largest money move</p>
        {topRevenue ? (
          <>
            <h3 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.02em]" style={{ color: 'var(--admin-text-primary)' }}>
              {topRevenue.title}
            </h3>
            <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--admin-success)' }}>
              {formatMoney(topRevenue.money_impact ?? 0)}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm leading-6" style={{ color: 'var(--admin-text-muted)' }}>
            No money impact is attached yet.
          </p>
        )}
      </Panel>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="rounded-lg border p-5"
      style={{
        background: 'color-mix(in srgb, var(--admin-surface) 94%, transparent)',
        borderColor: 'var(--admin-border)',
        boxShadow: 'var(--admin-card-shadow, none)',
      }}
    >
      {children}
    </section>
  );
}

function HeroStat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const color =
    tone === 'success'
      ? 'var(--admin-success)'
      : tone === 'warning'
        ? 'var(--admin-warning)'
        : tone === 'danger'
          ? 'var(--admin-danger)'
          : 'var(--admin-text-primary)';

  return (
    <div className="rounded-lg border p-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
      <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]" style={{ color }}>{value}</p>
    </div>
  );
}

function SmallBrief({ label, value, tone = 'default' }: { label: string; value: number | string; tone?: 'default' | 'success' | 'warning' }) {
  const color = tone === 'success' ? 'var(--admin-success)' : tone === 'warning' ? 'var(--admin-warning)' : 'var(--admin-text-primary)';

  return (
    <div className="rounded-lg border p-3" style={{ background: 'var(--admin-surface-hover)', borderColor: 'var(--admin-border)' }}>
      <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-[-0.03em]" style={{ color }}>{value}</p>
    </div>
  );
}

function Pill({ label, tone = 'default' }: { label: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const color =
    tone === 'success'
      ? 'var(--admin-success)'
      : tone === 'warning'
        ? 'var(--admin-warning)'
        : tone === 'danger'
          ? 'var(--admin-danger)'
          : 'var(--admin-text-muted)';

  return (
    <span
      className="inline-flex rounded-full border px-3 py-1 text-xs font-medium"
      style={{
        background: `color-mix(in srgb, ${color} 7%, var(--admin-surface))`,
        borderColor: `color-mix(in srgb, ${color} 20%, var(--admin-border))`,
        color,
      }}
    >
      {label}
    </span>
  );
}

function LoadingGallery() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-28 animate-pulse rounded-lg border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }} />
      ))}
    </div>
  );
}

function EmptyPanel({ title, text, actionLabel, onAction }: { title: string; text?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-lg border p-8 text-center" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
      <h3 className="text-xl font-semibold tracking-[-0.03em]" style={{ color: 'var(--admin-text-primary)' }}>{title}</h3>
      {text && <p className="mx-auto mt-2 max-w-md text-sm leading-6" style={{ color: 'var(--admin-text-muted)' }}>{text}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-lg border px-5 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'var(--admin-text-primary)', borderColor: 'var(--admin-text-primary)', color: 'var(--admin-bg)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function CleanSlate() {
  return (
    <div className="rounded-lg border p-5" style={{ background: 'var(--admin-success-bg)', borderColor: 'var(--admin-success-border)' }}>
      <h3 className="text-lg font-semibold tracking-[-0.02em]" style={{ color: 'var(--admin-success)' }}>
        Nothing is overdue.
      </h3>
      <p className="mt-1 text-sm" style={{ color: 'var(--admin-text-muted)' }}>
        The room is clean. Stay ahead of the day.
      </p>
    </div>
  );
}

function ConnectionNotice({ error }: { error: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-lg border p-5"
      style={{ background: 'var(--admin-danger-bg)', borderColor: 'var(--admin-danger-border)' }}
    >
      <h3 className="text-lg font-semibold" style={{ color: 'var(--admin-danger)' }}>
        Connection needs attention
      </h3>
      <p className="mt-2 text-sm leading-6" style={{ color: 'var(--admin-danger)', opacity: 0.75 }}>
        {error}
      </p>
    </motion.div>
  );
}

function Toast({ toast }: { toast: { msg: string; ok: boolean } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 right-6 z-[500] rounded-lg border px-5 py-4 text-sm font-medium"
      style={{
        background: 'var(--admin-surface-elevated, var(--admin-surface))',
        backdropFilter: 'blur(20px)',
        borderColor: toast.ok ? 'var(--admin-success-border)' : 'var(--admin-danger-border)',
        color: toast.ok ? 'var(--admin-success)' : 'var(--admin-danger)',
        boxShadow: '0 18px 60px rgba(0,0,0,0.14)',
      }}
    >
      {toast.msg}
    </motion.div>
  );
}

function priorityDesign(priority: Task['priority']): { label: string; tone: 'default' | 'success' | 'warning' | 'danger' } {
  if (priority === 'critical') return { label: 'Critical', tone: 'danger' };
  if (priority === 'high') return { label: 'High priority', tone: 'warning' };
  if (priority === 'medium') return { label: 'Medium priority', tone: 'default' };
  return { label: 'Low priority', tone: 'default' };
}

function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default AdminPage;