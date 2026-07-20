import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CircleAlert as AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { slugify } from './types';

const CATEGORIES = ['sales', 'follow_up', 'client_issue', 'delivery', 'finance', 'outreach', 'admin'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

const PRIORITY_VARS: Record<string, { bg: string; border: string; text: string }> = {
  critical: { bg: 'var(--admin-priority-critical-bg)', border: 'var(--admin-priority-critical-border)', text: 'var(--admin-priority-critical-text)' },
  high: { bg: 'var(--admin-priority-high-bg)', border: 'var(--admin-priority-high-border)', text: 'var(--admin-priority-high-text)' },
  medium: { bg: 'var(--admin-priority-medium-bg)', border: 'var(--admin-priority-medium-border)', text: 'var(--admin-priority-medium-text)' },
  low: { bg: 'var(--admin-priority-low-bg)', border: 'var(--admin-priority-low-border)', text: 'var(--admin-priority-low-text)' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  today: string;
}

export function CreateTaskPanel({ open, onClose, onCreated, today }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blank = () => ({
    title: '',
    description: '',
    category: 'sales',
    priority: 'high' as typeof PRIORITIES[number],
    due_date: today,
    due_time: '',
    money_impact: '',
    reason: '',
  });

  const [form, setForm] = useState(blank);
  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleClose = () => {
    setForm(blank());
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) { setError('Title is required.'); return; }

    setSaving(true);
    setError(null);

    const dueDate = form.due_date || today;
    const task_key = `${slugify(title)}_${dueDate.replace(/-/g, '')}`;

    const payload = {
      title,
      description: form.description.trim() || null,
      category: form.category || null,
      priority: form.priority,
      status: 'open',
      due_date: dueDate,
      due_time: form.due_time.trim() ? form.due_time.trim() : null,
      money_impact: form.money_impact.trim() ? Number(form.money_impact) : null,
      reason: form.reason.trim() || null,
      source: 'manual_admin',
      task_key,
    };

    const { data, error: err } = await supabase
      .from('tasks')
      .insert(payload)
      .select()
      .single();

    setSaving(false);

    if (err) {
      setError(`Error (${err.code ?? 'unknown'}): ${err.message}`);
      return;
    }

    if (!data) {
      setError('Insert returned no data. Check Supabase RLS policies.');
      return;
    }

    handleClose();
    onCreated();
  };

  const fieldWrap = 'flex flex-col gap-1.5';
  const label = 'text-[9px] font-bold tracking-[0.2em] uppercase font-mono';
  const input = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200';
  const inputStyle = {
    background: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    color: 'var(--admin-input-text)',
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--admin-border-focus)';
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--admin-input-border)';
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="fixed right-0 top-0 bottom-0 z-[201] w-full sm:w-[480px] overflow-y-auto flex flex-col"
            style={{ background: 'var(--admin-bg)', borderLeft: '1px solid var(--admin-border)', boxShadow: '-20px 0 60px rgba(0,0,0,0.3)' }}
          >
            {/* Panel header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <div>
                <p className="text-[9px] font-bold tracking-[0.24em] uppercase font-mono mb-1" style={{ color: 'var(--admin-accent-subtle)' }}>
                  Command Center
                </p>
                <h2 className="text-base font-bold" style={{ color: 'var(--admin-text-primary)' }}>Create New Task</h2>
              </div>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150" style={{ color: 'var(--admin-text-muted)', background: 'var(--admin-surface)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--admin-text-secondary)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--admin-text-muted)'; }}>
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">

              {/* Title */}
              <div className={fieldWrap}>
                <label className={label} style={{ color: 'var(--admin-text-muted)' }}>Task Title *</label>
                <input
                  type="text" required autoFocus
                  placeholder="What needs to be executed?"
                  value={form.title}
                  onChange={(e) => { set('title', e.target.value); setError(null); }}
                  className={input} style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>

              {/* Description */}
              <div className={fieldWrap}>
                <label className={label} style={{ color: 'var(--admin-text-muted)' }}>Description</label>
                <textarea
                  rows={2} placeholder="Context or details…"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  className={`${input} resize-none`} style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>

              {/* Priority selector */}
              <div className={fieldWrap}>
                <label className={label} style={{ color: 'var(--admin-text-muted)' }}>Priority</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRIORITIES.map((p) => {
                    const vars = PRIORITY_VARS[p];
                    return (
                      <button
                        key={p} type="button"
                        onClick={() => set('priority', p)}
                        className="py-2 rounded-lg text-[10px] font-bold uppercase font-mono tracking-wide transition-all duration-150"
                        style={form.priority === p
                          ? { background: vars.bg, color: vars.text, border: `1px solid ${vars.border}` }
                          : { background: 'var(--admin-surface)', color: 'var(--admin-text-muted)', border: '1px solid var(--admin-border)' }
                        }
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div className={fieldWrap}>
                <label className={label} style={{ color: 'var(--admin-text-muted)' }}>Category</label>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className={input} style={{ ...inputStyle, appearance: 'auto' }} onFocus={inputFocus} onBlur={inputBlur}>
                  {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: 'var(--admin-bg)' }}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className={fieldWrap}>
                  <label className={label} style={{ color: 'var(--admin-text-muted)' }}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} className={input} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                </div>
                <div className={fieldWrap}>
                  <label className={label} style={{ color: 'var(--admin-text-muted)' }}>Due Time</label>
                  <input type="time" value={form.due_time} onChange={(e) => set('due_time', e.target.value)} className={input} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                </div>
              </div>

              {/* Money impact */}
              <div className={fieldWrap}>
                <label className={label} style={{ color: 'var(--admin-text-muted)' }}>Revenue Impact (EUR)</label>
                <input
                  type="number" min="0" step="100" placeholder="e.g. 3000"
                  value={form.money_impact}
                  onChange={(e) => set('money_impact', e.target.value)}
                  className={input} style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>

              {/* Reason */}
              <div className={fieldWrap}>
                <label className={label} style={{ color: 'var(--admin-text-muted)' }}>Reason / Why</label>
                <input
                  type="text" placeholder="Why does this task exist?"
                  value={form.reason}
                  onChange={(e) => set('reason', e.target.value)}
                  className={input} style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs font-mono"
                    style={{ background: 'var(--admin-danger-bg)', border: '1px solid var(--admin-danger-border)', color: 'var(--admin-danger)' }}
                  >
                    <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200"
                  style={saving
                    ? { background: 'var(--admin-surface)', color: 'var(--admin-text-muted)', border: '1px solid var(--admin-border)', cursor: 'not-allowed' }
                    : { background: 'var(--admin-button-primary-bg)', color: 'var(--admin-accent)', border: '1px solid var(--admin-button-primary-border)' }
                  }
                  onMouseEnter={(e) => { if (!saving) { const el = e.currentTarget; el.style.background = 'var(--admin-button-primary-hover)'; } }}
                  onMouseLeave={(e) => { if (!saving) { const el = e.currentTarget; el.style.background = 'var(--admin-button-primary-bg)'; } }}
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      Creating…
                    </span>
                  ) : '+ Create Task'}
                </button>
                <button type="button" onClick={handleClose} className="px-4 py-3 rounded-xl text-sm transition-colors duration-150" style={{ color: 'var(--admin-text-muted)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--admin-text-secondary)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--admin-text-muted)'; }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
