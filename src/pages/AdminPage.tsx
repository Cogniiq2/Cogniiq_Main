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

/* ── filter helper ─────────────────────────────────────────── */
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

/* ── page ──────────────────────────────────────────────────── */
export function AdminPage() {
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

  /* ── fetch ─────────────────────────────────────────────────── */
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

  /* ── complete ──────────────────────────────────────────────── */
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

  /* ── derived ───────────────────────────────────────────────── */
  const nextTask = todayOpen[0] ?? null;
  const filtered = applyFilter(todayOpen, filter, search);
  const moneyToday = todayOpen.reduce((s, t) => s + (t.money_impact ?? 0), 0);
  const criticalHigh = todayOpen.filter((t) => t.priority === 'critical' || t.priority === 'high').length;

  const showTodayQueue = activeTab === 'overview' || activeTab === 'today';
  const showOverdue = activeTab === 'overview' || activeTab === 'overdue';
  const showCompleted = activeTab === 'overview' || activeTab === 'completed';
  const showRevenue = activeTab === 'revenue';

  /* ── render ────────────────────────────────────────────────── */
  return (
    <AdminGate>
      <div className="admin-root min-h-screen text-white font-sans" style={{ background: '#04080f' }}>
        {/* Ambient layer */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,180,255,0.04) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,100,200,0.035) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/3 w-[600px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.025) 0%, transparent 70%)' }} />
          {/* Grid */}
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px', opacity: 0.7 }} />
          {/* Scan line */}
          <motion.div className="absolute left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.15) 50%, transparent 100%)' }} animate={{ top: ['0%', '100%'] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} />
        </div>

        {/* Header */}
        <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} todayCount={todayOpen.length} overdueCount={overdueOpen.length} />

        {/* Main layout */}
        <div className="relative z-10 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col xl:flex-row gap-6">

          {/* CENTER — main content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* DB Error */}
            <AnimatePresence>
              {dbError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-5 py-4">
                  <p className="text-sm font-semibold text-red-400 mb-1 font-mono">ERR: supabase_connection_failed</p>
                  <p className="text-xs text-red-400/50 font-mono">{dbError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* KPI strip */}
            <KpiStrip
              todayOpen={todayOpen.length}
              criticalHigh={criticalHigh}
              overdueCount={overdueOpen.length}
              moneyToday={moneyToday}
            />

            {/* Filters + create */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <TaskFilters active={filter} search={search} onChange={setFilter} onSearch={setSearch} />
              <button
                onClick={() => setCreateOpen(true)}
                className="sm:ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-[0.1em] uppercase transition-all duration-200 border whitespace-nowrap"
                style={{ background: 'rgba(0,212,255,0.07)', borderColor: 'rgba(0,212,255,0.2)', color: '#00d4ff', boxShadow: 'inset 0 1px 0 rgba(0,212,255,0.06)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.13)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.07)'; }}
              >
                <span className="text-base leading-none">+</span> New Task
              </button>
            </div>

            {/* NEXT BEST ACTION */}
            {!loading && nextTask && showTodayQueue && (
              <NextBestAction task={nextTask} onComplete={handleComplete} completing={!!completing[nextTask.id]} />
            )}

            {/* EXECUTION QUEUE */}
            {showTodayQueue && (
              <section>
                <SectionLabel text="Execution Queue" count={filtered.length} accent="#00d4ff" />
                {loading ? <LoadingSkeleton /> : filtered.length === 0 ? (
                  <EmptyState message="Execution queue is empty." sub="No tasks match the current filter — or create the first one." action={{ label: '+ New Task', onClick: () => setCreateOpen(true) }} />
                ) : (
                  <div className="space-y-2.5">
                    <AnimatePresence>
                      {filtered.map((task, i) => (
                        <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }} transition={{ duration: 0.3, delay: i * 0.035, ease: [0.22, 1, 0.36, 1] }}>
                          <TaskCard task={task} onComplete={handleComplete} completing={!!completing[task.id]} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            )}

            {/* OVERDUE */}
            {showOverdue && (
              <section>
                <SectionLabel text="Overdue — Fix These First" count={overdueOpen.length} accent="#f59e0b" />
                {loading ? <LoadingSkeleton /> : overdueOpen.length === 0 ? (
                  <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border" style={{ borderColor: 'rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.04)' }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                    <span className="text-sm font-mono" style={{ color: '#10b981' }}>No overdue tasks. Execution is clean.</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 rounded-2xl border p-4" style={{ borderColor: 'rgba(245,158,11,0.12)', background: 'rgba(245,158,11,0.02)' }}>
                    <AnimatePresence>
                      {overdueOpen.map((task, i) => (
                        <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}>
                          <TaskCard task={task} onComplete={handleComplete} completing={!!completing[task.id]} overdue />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            )}

            {/* COMPLETED */}
            {showCompleted && (
              <section>
                <SectionLabel text="Completed Today" count={todayCompleted.length} accent="#10b981" />
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

            {/* REVENUE FOCUS */}
            {showRevenue && (
              <section>
                <SectionLabel text="Revenue Focus" count={0} accent="#10b981" />
                {loading ? <LoadingSkeleton /> : (
                  <div className="space-y-2.5">
                    {[...todayOpen, ...overdueOpen]
                      .filter((t) => t.money_impact != null && t.money_impact > 0)
                      .sort((a, b) => (b.money_impact ?? 0) - (a.money_impact ?? 0))
                      .map((task) => (
                        <TaskCard key={task.id} task={task} onComplete={handleComplete} completing={!!completing[task.id]} />
                      ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* RIGHT — intelligence */}
          <div className="xl:w-[300px] flex-shrink-0">
            <div className="xl:sticky xl:top-[100px] space-y-4">
              <OperatorIntelligence todayOpen={todayOpen} overdueOpen={overdueOpen} dbStatus={dbError ? 'error' : 'ok'} dbError={dbError ?? undefined} />
            </div>
          </div>
        </div>

        {/* Create task panel */}
        <CreateTaskPanel open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); fetchAll(); showToast('Task created.', true); }} today={today} />

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-6 right-6 z-[500] flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-mono"
              style={{ background: '#060d1a', backdropFilter: 'blur(20px)', borderColor: toast.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)', color: toast.ok ? '#34d399' : '#f87171', boxShadow: `0 0 20px ${toast.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: toast.ok ? '#34d399' : '#f87171' }} />
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminGate>
  );
}

/* ── Section label ─────────────────────────────────────────── */
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
