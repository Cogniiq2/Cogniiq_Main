import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Task, FilterOption } from '../components/admin/types';
import { getLocalDateString, sortTasks, formatMoney } from '../components/admin/types';
import { AdminHeader } from '../components/admin/AdminHeader';
import { KpiCard } from '../components/admin/KpiCard';
import { TaskCard } from '../components/admin/TaskCard';
import { NextBestAction } from '../components/admin/NextBestAction';
import { TaskFilters } from '../components/admin/TaskFilters';
import { QuickCreateModal } from '../components/admin/QuickCreateModal';
import { OperatorIntelligence } from '../components/admin/OperatorIntelligence';
import { LoadingSkeleton, EmptyState } from '../components/admin/EmptyAndLoading';
import { AdminGate } from '../components/admin/AdminGate';
import { ListChecks, OctagonAlert as AlertOctagon, Clock4, TrendingUp } from 'lucide-react';

/* ── helpers ──────────────────────────────────────────────── */

function applyFilter(tasks: Task[], filter: FilterOption, search: string): Task[] {
  let result = tasks;
  if (filter === 'critical') result = result.filter((t) => t.priority === 'critical');
  else if (filter === 'high') result = result.filter((t) => t.priority === 'high');
  else if (filter !== 'all') result = result.filter((t) => t.category === filter);

  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.category ?? '').toLowerCase().includes(q) ||
        (t.reason ?? '').toLowerCase().includes(q)
    );
  }
  return result;
}

/* ── page ─────────────────────────────────────────────────── */

export function AdminPage() {
  const today = getLocalDateString();

  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [todayOpen, setTodayOpen] = useState<Task[]>([]);
  const [todayCompleted, setTodayCompleted] = useState<Task[]>([]);
  const [overdueOpen, setOverdueOpen] = useState<Task[]>([]);

  const [completing, setCompleting] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [search, setSearch] = useState('');

  /* ── fetch ──────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const [openToday, completedToday, overdue] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('due_date', today)
          .eq('status', 'open'),
        supabase
          .from('tasks')
          .select('*')
          .eq('due_date', today)
          .eq('status', 'completed'),
        supabase
          .from('tasks')
          .select('*')
          .lt('due_date', today)
          .eq('status', 'open'),
      ]);

      if (openToday.error) throw openToday.error;
      if (completedToday.error) throw completedToday.error;
      if (overdue.error) throw overdue.error;

      setTodayOpen(sortTasks(openToday.data ?? []));
      setTodayCompleted(completedToday.data ?? []);
      setOverdueOpen(sortTasks(overdue.data ?? []));
    } catch (err: unknown) {
      setDbError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── complete ───────────────────────────────────────────── */
  const handleComplete = useCallback(async (id: string) => {
    setCompleting((prev) => ({ ...prev, [id]: true }));
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id);
    setCompleting((prev) => ({ ...prev, [id]: false }));

    if (error) {
      showToast('Error completing task: ' + error.message);
      return;
    }

    // Optimistic update
    setTodayOpen((prev) => {
      const task = prev.find((t) => t.id === id);
      if (task) {
        setTodayCompleted((c) => [
          { ...task, status: 'completed', completed_at: new Date().toISOString() },
          ...c,
        ]);
      }
      return prev.filter((t) => t.id !== id);
    });
    setOverdueOpen((prev) => prev.filter((t) => t.id !== id));
    showToast('Task completed.');
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  /* ── derived ────────────────────────────────────────────── */
  const nextTask = todayOpen[0] ?? null;
  const moneyToday = todayOpen.reduce((s, t) => s + (t.money_impact ?? 0), 0);
  const criticalHighCount = todayOpen.filter(
    (t) => t.priority === 'critical' || t.priority === 'high'
  ).length;
  const filteredTodayOpen = applyFilter(todayOpen, filter, search);

  /* ── KPI cards ──────────────────────────────────────────── */
  const kpis = [
    {
      label: "Today's Open Tasks",
      value: todayOpen.length,
      description: 'Open tasks scheduled for today',
      icon: <ListChecks size={16} />,
      accentColor: '#2e6f8f',
      delay: 0,
    },
    {
      label: 'Critical / High',
      value: criticalHighCount,
      description: 'Highest priority tasks today',
      icon: <AlertOctagon size={16} />,
      accentColor: '#f87171',
      delay: 0.06,
    },
    {
      label: 'Overdue Tasks',
      value: overdueOpen.length,
      description: 'Open tasks past their due date',
      icon: <Clock4 size={16} />,
      accentColor: '#fbbf24',
      delay: 0.12,
    },
    {
      label: 'Money Impact Today',
      value: formatMoney(moneyToday),
      description: 'Revenue at stake today',
      icon: <TrendingUp size={16} />,
      accentColor: '#34d399',
      delay: 0.18,
    },
  ];

  /* ── render ─────────────────────────────────────────────── */
  return (
    <AdminGate>
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #050d14 0%, #060f1a 40%, #04090f 100%)',
      }}
    >
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #2e6f8f 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #1a4a62 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full opacity-[0.025]"
          style={{ background: 'radial-gradient(circle, #3d9fbe 0%, transparent 70%)' }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `linear-gradient(rgba(61,159,190,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(61,159,190,0.4) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-10 py-8">

        {/* DB Error */}
        <AnimatePresence>
          {dbError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.06] backdrop-blur-sm px-5 py-4"
            >
              <p className="text-sm font-semibold text-red-400 mb-1">Supabase connection failed</p>
              <p className="text-xs text-red-400/60">{dbError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col xl:flex-row gap-6">

          {/* LEFT: Task queue */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Filters + create */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <TaskFilters
                active={filter}
                search={search}
                onChange={setFilter}
                onSearch={setSearch}
              />
              <QuickCreateModal onCreated={fetchAll} />
            </div>

            {/* NEXT BEST ACTION */}
            {!loading && nextTask && (activeTab === 'overview' || activeTab === 'today') && (
              <NextBestAction
                task={nextTask}
                onComplete={handleComplete}
                completing={completing[nextTask.id]}
              />
            )}

            {/* EXECUTION QUEUE */}
            {(activeTab === 'overview' || activeTab === 'today') && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white/60 tracking-wide uppercase">
                    Execution Queue
                    <span className="ml-2 text-xs font-normal text-white/20">({filteredTodayOpen.length})</span>
                  </h2>
                </div>

                {loading ? (
                  <LoadingSkeleton />
                ) : filteredTodayOpen.length === 0 ? (
                  <EmptyState
                    message="Your execution queue is empty."
                    sub="Connect the morning Claude planner in n8n to generate daily tasks automatically."
                    action={{ label: 'Create first task', onClick: () => {} }}
                  />
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {filteredTodayOpen.map((task, i) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <TaskCard
                            task={task}
                            onComplete={handleComplete}
                            completing={completing[task.id]}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            )}

            {/* OVERDUE SECTION */}
            {(activeTab === 'overview' || activeTab === 'overdue') && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <h2 className="text-sm font-bold text-amber-400/70 tracking-wide uppercase">
                    Overdue — Fix These First
                    <span className="ml-2 text-xs font-normal text-amber-400/30">({overdueOpen.length})</span>
                  </h2>
                </div>

                {loading ? (
                  <LoadingSkeleton />
                ) : overdueOpen.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <p className="text-sm text-emerald-400/70">No overdue tasks. Execution is clean.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-500/[0.12] bg-amber-500/[0.03] p-4 space-y-3">
                    <AnimatePresence>
                      {overdueOpen.map((task, i) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <TaskCard
                            task={task}
                            onComplete={handleComplete}
                            completing={completing[task.id]}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            )}

            {/* COMPLETED SECTION */}
            {(activeTab === 'overview' || activeTab === 'completed') && (
              <section>
                <h2 className="text-sm font-bold text-white/30 tracking-wide uppercase mb-4">
                  Completed Today
                  <span className="ml-2 text-xs font-normal text-white/15">({todayCompleted.length})</span>
                </h2>

                {loading ? (
                  <LoadingSkeleton />
                ) : todayCompleted.length === 0 ? (
                  <EmptyState message="No completed tasks yet today." />
                ) : (
                  <div className="space-y-2">
                    {todayCompleted.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={() => {}}
                        muted
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* REVENUE FOCUS TAB */}
            {activeTab === 'revenue' && (
              <section>
                <h2 className="text-sm font-bold text-emerald-400/60 tracking-wide uppercase mb-4">
                  Revenue Focus — Highest Impact Tasks
                </h2>
                {loading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="space-y-3">
                    {[...todayOpen, ...overdueOpen]
                      .filter((t) => t.money_impact != null && t.money_impact > 0)
                      .sort((a, b) => (b.money_impact ?? 0) - (a.money_impact ?? 0))
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onComplete={handleComplete}
                          completing={completing[task.id]}
                        />
                      ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* RIGHT: Intelligence panel */}
          <div className="xl:w-72 flex-shrink-0">
            <div className="xl:sticky xl:top-28">
              <OperatorIntelligence
                todayOpen={todayOpen}
                overdueOpen={overdueOpen}
                dbStatus={dbError ? 'error' : 'ok'}
                dbError={dbError ?? undefined}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-[300] px-4 py-3 rounded-xl border border-white/[0.1] bg-[#0a1824] text-sm text-white/70 shadow-xl"
            style={{ backdropFilter: 'blur(16px)' }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </AdminGate>
  );
}
