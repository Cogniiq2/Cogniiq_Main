import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarCheck, CheckCircle2, Plus, Search, TrendingUp, Zap } from 'lucide-react';

import {
  Button, Card, EmptyState, ErrorState, Field, KpiCard, PageHeader, Select, StatusBadge, Textarea,
  SlideOver, Skeleton, useToast, type BadgeTone,
} from '@/components/dashboard';
import { supabase } from '@/lib/supabase';
import type { FilterOption, Task } from '@/components/admin/types';
import { formatMoney, getLocalDateString, slugify, sortTasks } from '@/components/admin/types';

// The internal Task Dashboard, redesigned as premium light content that renders inside the shared
// DashboardShell. All real Supabase task operations (load / complete / create) and the operational
// model (today queue, overdue, completed, revenue focus, Next Best Action, money impact) are
// preserved — only the crypto/cyberpunk presentation layer was removed. Views are driven by real
// routes (/admin/tasks/*) rather than hash navigation.

export type TaskView = 'overview' | 'today' | 'overdue' | 'completed' | 'revenue';

const CATEGORIES = ['sales', 'follow_up', 'client_issue', 'delivery', 'finance', 'outreach', 'admin'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

const priorityTone: Record<string, BadgeTone> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'neutral',
};

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'critical', label: 'Kritisch' },
  { value: 'high', label: 'Hohe Priorität' },
  { value: 'sales', label: 'Sales' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'client_issue', label: 'Kundenanliegen' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'finance', label: 'Finance' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'admin', label: 'Admin' },
];

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

export function TaskDashboardContent({ view = 'overview' }: { view?: TaskView }) {
  const toast = useToast();
  const today = getLocalDateString();

  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [todayOpen, setTodayOpen] = useState<Task[]>([]);
  const [todayCompleted, setTodayCompleted] = useState<Task[]>([]);
  const [overdueOpen, setOverdueOpen] = useState<Task[]>([]);
  const [completing, setCompleting] = useState<Record<string, boolean>>({});
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

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const handleComplete = useCallback(async (id: string) => {
    setCompleting((p) => ({ ...p, [id]: true }));
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: now })
      .eq('id', id);
    setCompleting((p) => ({ ...p, [id]: false }));
    if (error) { toast.error('Aufgabe konnte nicht abgeschlossen werden', error.message); return; }
    setTodayOpen((prev) => {
      const t = prev.find((x) => x.id === id);
      if (t) setTodayCompleted((cc) => [{ ...t, status: 'completed', completed_at: now }, ...cc]);
      return prev.filter((x) => x.id !== id);
    });
    setOverdueOpen((prev) => prev.filter((x) => x.id !== id));
    toast.success('Aufgabe abgeschlossen');
  }, [toast]);

  const nextTask = todayOpen[0] ?? null;
  const filtered = useMemo(() => applyFilter(todayOpen, filter, search), [todayOpen, filter, search]);
  const moneyToday = todayOpen.reduce((s, t) => s + (t.money_impact ?? 0), 0);
  const criticalHigh = todayOpen.filter((t) => t.priority === 'critical' || t.priority === 'high').length;
  const revenueTasks = useMemo(
    () => [...todayOpen, ...overdueOpen]
      .filter((t) => t.money_impact != null && t.money_impact > 0)
      .sort((a, b) => (b.money_impact ?? 0) - (a.money_impact ?? 0)),
    [todayOpen, overdueOpen],
  );

  const showTodayQueue = view === 'overview' || view === 'today';
  const showOverdue = view === 'overview' || view === 'overdue';
  const showCompleted = view === 'overview' || view === 'completed';
  const showRevenue = view === 'revenue';
  const showNextBest = view === 'overview' || view === 'today';

  const viewDescription: Record<TaskView, string> = {
    overview: 'Der operative Tagesüberblick: kritische Arbeit zuerst, Umsatz im Blick.',
    today: 'Alle heute fälligen, offenen Aufgaben.',
    overdue: 'Überfällige Aufgaben — zuerst erledigen.',
    completed: 'Heute abgeschlossene Aufgaben.',
    revenue: 'Aufgaben mit hinterlegtem Umsatzpotenzial, nach Wirkung sortiert.',
  };

  return (
    <>
      <PageHeader
        title="Task-Dashboard"
        description={viewDescription[view]}
        actions={<Button icon={Plus} onClick={() => setCreateOpen(true)}>Neue Aufgabe</Button>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Heute offen" value={loading ? '—' : String(todayOpen.length)} icon={CalendarCheck} />
        <KpiCard label="Kritisch / hohe Priorität" value={loading ? '—' : String(criticalHigh)} icon={Zap} tone={criticalHigh > 0 ? 'negative' : 'neutral'} />
        <KpiCard label="Überfällig" value={loading ? '—' : String(overdueOpen.length)} icon={AlertTriangle} tone={overdueOpen.length > 0 ? 'negative' : 'neutral'} />
        <KpiCard label="Umsatzpotenzial" value={loading ? '—' : formatMoney(moneyToday)} icon={TrendingUp} tone={moneyToday > 0 ? 'positive' : 'neutral'} hint="Heute offen" />
      </div>

      {dbError ? <div className="mb-6"><ErrorState title="Datenbankverbindung fehlgeschlagen" message={dbError} onRetry={() => void fetchAll()} /></div> : null}

      {showNextBest && !loading && nextTask ? (
        <Card className="mb-6 border-gray-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">Next Best Action</p>
              <p className="truncate text-lg font-semibold tracking-tight text-gray-950">{nextTask.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge label={nextTask.priority} tone={priorityTone[nextTask.priority] ?? 'neutral'} />
                {nextTask.category ? <StatusBadge label={nextTask.category.replace(/_/g, ' ')} tone="neutral" /> : null}
                {nextTask.money_impact ? <span className="text-[13px] font-semibold tabular-nums text-emerald-700">{formatMoney(nextTask.money_impact)}</span> : null}
              </div>
              {nextTask.reason ? <p className="mt-2 text-[13px] leading-6 text-gray-500">{nextTask.reason}</p> : null}
            </div>
            <Button variant="success" icon={CheckCircle2} loading={!!completing[nextTask.id]} onClick={() => void handleComplete(nextTask.id)}>
              Abschließen
            </Button>
          </div>
        </Card>
      ) : null}

      {(showTodayQueue || showRevenue) ? (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Aufgaben durchsuchen…"
              aria-label="Aufgaben durchsuchen"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400"
            />
          </div>
          {showTodayQueue ? (
            <div className="sm:w-56">
              <Select id="task-filter" value={filter} onChange={(v) => setFilter(v as FilterOption)} options={filterOptions} />
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-[20px]" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {showTodayQueue ? (
            <TaskSection title="Ausführungs-Queue" count={filtered.length}>
              {filtered.length === 0 ? (
                <EmptyState icon={CalendarCheck} title="Queue ist leer" description="Keine Aufgabe passt zum Filter — oder legen Sie die erste an."
                  action={<Button icon={Plus} onClick={() => setCreateOpen(true)}>Neue Aufgabe</Button>} />
              ) : (
                <div className="space-y-2.5">
                  {filtered.map((t) => <TaskRow key={t.id} task={t} completing={!!completing[t.id]} onComplete={handleComplete} />)}
                </div>
              )}
            </TaskSection>
          ) : null}

          {showOverdue ? (
            <TaskSection title="Überfällig — zuerst erledigen" count={overdueOpen.length} tone="danger">
              {overdueOpen.length === 0 ? (
                <div className="flex items-center gap-2.5 rounded-[20px] border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-sm font-medium text-emerald-700">
                  <CheckCircle2 size={17} aria-hidden="true" /> Keine überfälligen Aufgaben.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {overdueOpen.map((t) => <TaskRow key={t.id} task={t} completing={!!completing[t.id]} onComplete={handleComplete} overdue />)}
                </div>
              )}
            </TaskSection>
          ) : null}

          {showCompleted ? (
            <TaskSection title="Heute erledigt" count={todayCompleted.length} tone="success">
              {todayCompleted.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="Noch nichts erledigt" description="Heute wurden noch keine Aufgaben abgeschlossen." />
              ) : (
                <div className="space-y-2">
                  {todayCompleted.map((t) => <TaskRow key={t.id} task={t} muted />)}
                </div>
              )}
            </TaskSection>
          ) : null}

          {showRevenue ? (
            <TaskSection title="Umsatzfokus" count={revenueTasks.length} tone="success">
              {revenueTasks.length === 0 ? (
                <EmptyState icon={TrendingUp} title="Keine umsatzrelevanten Aufgaben" description="Hinterlegen Sie Umsatzpotenzial bei den Aufgaben, die das Geschäft voranbringen." />
              ) : (
                <div className="space-y-2.5">
                  {revenueTasks.map((t) => <TaskRow key={t.id} task={t} completing={!!completing[t.id]} onComplete={handleComplete} />)}
                </div>
              )}
            </TaskSection>
          ) : null}
        </div>
      )}

      <CreateTaskSlideOver
        open={createOpen}
        today={today}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); void fetchAll(); toast.success('Aufgabe erstellt'); }}
      />
    </>
  );
}

function TaskSection({ title, count, tone = 'neutral', children }: { title: string; count: number; tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <h2 className="text-sm font-semibold tracking-tight text-gray-950">{title}</h2>
        <StatusBadge label={String(count)} tone={tone} />
      </div>
      {children}
    </section>
  );
}

function TaskRow({ task, completing, onComplete, overdue, muted }: {
  task: Task; completing?: boolean; onComplete?: (id: string) => void; overdue?: boolean; muted?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-[20px] border bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.04)] ${overdue ? 'border-red-100' : 'border-gray-100'}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`truncate text-[14px] font-semibold ${muted ? 'text-gray-400 line-through' : 'text-gray-950'}`}>{task.title}</p>
          {!muted ? <StatusBadge label={task.priority} tone={priorityTone[task.priority] ?? 'neutral'} /> : null}
          {task.category ? <StatusBadge label={task.category.replace(/_/g, ' ')} tone="neutral" /> : null}
        </div>
        {task.reason && !muted ? <p className="mt-1 truncate text-[12.5px] text-gray-500">{task.reason}</p> : null}
      </div>
      {task.money_impact ? <span className="shrink-0 text-[13px] font-semibold tabular-nums text-emerald-700">{formatMoney(task.money_impact)}</span> : null}
      {!muted && onComplete ? (
        <Button size="sm" variant="secondary" icon={CheckCircle2} loading={completing} onClick={() => onComplete(task.id)}>
          Erledigt
        </Button>
      ) : muted ? (
        <CheckCircle2 size={18} className="shrink-0 text-emerald-500" aria-hidden="true" />
      ) : null}
    </div>
  );
}

function CreateTaskSlideOver({ open, today, onClose, onCreated }: {
  open: boolean; today: string; onClose: () => void; onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('sales');
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>('high');
  const [dueDate, setDueDate] = useState(today);
  const [dueTime, setDueTime] = useState('');
  const [money, setMoney] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle(''); setDescription(''); setCategory('sales'); setPriority('high');
    setDueDate(today); setDueTime(''); setMoney(''); setReason(''); setError(null);
  };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) { setError('Titel ist erforderlich.'); return; }
    setSaving(true);
    setError(null);
    const dd = dueDate || today;
    const payload = {
      title: trimmed,
      description: description.trim() || null,
      category: category || null,
      priority,
      status: 'open',
      due_date: dd,
      due_time: dueTime.trim() || null,
      money_impact: money.trim() ? Number(money) : null,
      reason: reason.trim() || null,
      source: 'manual_admin',
      task_key: `${slugify(trimmed)}_${dd.replace(/-/g, '')}`,
    };
    const { data, error: err } = await supabase.from('tasks').insert(payload).select().single();
    setSaving(false);
    if (err) { setError(`Fehler (${err.code ?? 'unbekannt'}): ${err.message}`); return; }
    if (!data) { setError('Kein Datensatz zurückgegeben. Bitte RLS-Richtlinien prüfen.'); return; }
    reset();
    onCreated();
  };

  return (
    <SlideOver
      open={open}
      onClose={close}
      title="Neue Aufgabe"
      description="Legen Sie eine Aufgabe für die Ausführungs-Queue an."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>Abbrechen</Button>
          <Button onClick={() => void submit()} loading={saving}>Aufgabe erstellen</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field id="task-title" label="Titel" value={title} onChange={(v) => { setTitle(v); setError(null); }} placeholder="Was muss ausgeführt werden?" required autoFocus error={error && !title.trim() ? error : undefined} />
        <Textarea id="task-desc" label="Beschreibung" value={description} onChange={setDescription} placeholder="Kontext oder Details…" rows={2} />
        <div className="grid grid-cols-2 gap-3">
          <Select id="task-priority" label="Priorität" value={priority} onChange={(v) => setPriority(v as typeof PRIORITIES[number])} options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
          <Select id="task-category" label="Kategorie" value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="task-date" label="Fällig am" type="date" value={dueDate} onChange={setDueDate} />
          <Field id="task-time" label="Uhrzeit" type="time" value={dueTime} onChange={setDueTime} />
        </div>
        <Field id="task-money" label="Umsatzpotenzial (EUR)" value={money} onChange={setMoney} placeholder="z. B. 3000" inputMode="decimal" />
        <Field id="task-reason" label="Grund / Warum" value={reason} onChange={setReason} placeholder="Warum existiert diese Aufgabe?" />
        {error && title.trim() ? <p className="text-[13px] text-red-600">{error}</p> : null}
      </div>
    </SlideOver>
  );
}

export default TaskDashboardContent;
