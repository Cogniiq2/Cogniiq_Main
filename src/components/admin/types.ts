export type Priority = 'critical' | 'high' | 'medium' | 'low' | string;
export type Status = 'open' | 'completed' | string;

export type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: Priority;
  status: Status;
  due_date: string | null;
  due_time: string | null;
  money_impact: number | null;
  related_lead_id: string | null;
  related_client_id: string | null;
  source: string | null;
  reason: string | null;
  task_key: string | null;
  created_at: string | null;
  completed_at: string | null;
};

export type FilterOption =
  | 'all'
  | 'critical'
  | 'high'
  | 'sales'
  | 'follow_up'
  | 'client_issue'
  | 'delivery'
  | 'finance'
  | 'outreach'
  | 'admin';

export const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

export function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_WEIGHT[a.priority] ?? 5;
    const pb = PRIORITY_WEIGHT[b.priority] ?? 5;
    if (pa !== pb) return pa - pb;
    const ta = a.due_time ?? '99:99';
    const tb = b.due_time ?? '99:99';
    return ta.localeCompare(tb);
  });
}

export function formatMoney(val: number | null): string {
  if (val == null) return '—';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}
