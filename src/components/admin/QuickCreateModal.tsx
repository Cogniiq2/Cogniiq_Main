import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getLocalDateString, slugify } from './types';

const CATEGORIES = ['sales', 'follow_up', 'client_issue', 'delivery', 'finance', 'outreach', 'admin'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

interface Props {
  onCreated: () => void;
}

export function QuickCreateModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = getLocalDateString();

  const blank = () => ({
    title: '',
    description: '',
    category: 'sales',
    priority: 'high',
    due_date: today,
    due_time: '',
    money_impact: '',
    reason: '',
  });

  const [form, setForm] = useState(blank);

  const set = (k: keyof ReturnType<typeof blank>, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    setForm(blank());
    setError(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) { setError('Title is required.'); return; }

    setSaving(true);
    setError(null);

    const dueDate = form.due_date || today;
    const task_key = `${slugify(trimmedTitle)}_${dueDate.replace(/-/g, '')}`;

    // Strictly convert empty strings to null for every nullable field
    const payload = {
      title: trimmedTitle,
      description: form.description.trim() || null,
      category: form.category || null,
      priority: form.priority || 'medium',
      status: 'open',
      due_date: dueDate,
      due_time: form.due_time.trim() || null,
      money_impact: form.money_impact.trim() ? Number(form.money_impact) : null,
      reason: form.reason.trim() || null,
      source: 'manual_admin',
      task_key,
    };

    const { error: insertError } = await supabase.from('tasks').insert(payload);

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setOpen(false);
    setForm(blank());
    onCreated();
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl text-sm text-white/70 placeholder-white/20 bg-white/[0.04] border border-white/[0.07] focus:outline-none focus:border-[#2e6f8f]/50 focus:bg-white/[0.07] transition-all duration-200';
  const labelCls =
    'block text-[10px] font-semibold tracking-[0.14em] uppercase text-white/30 mb-1.5';

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#2e6f8f]/15 text-[#7dd3e8] border border-[#2e6f8f]/25 hover:bg-[#2e6f8f]/25 hover:border-[#2e6f8f]/40 transition-all duration-200 whitespace-nowrap"
      >
        <Plus size={15} />
        Create Task
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[200]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 top-[5vh] sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-[8vh] sm:w-[540px] max-h-[86vh] overflow-y-auto z-[201] rounded-2xl border border-white/[0.1] bg-[#080f18]"
              style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(61,159,190,0.1)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#3d9fbe]/60 mb-0.5">
                    Quick Create
                  </p>
                  <h2 className="text-base font-bold text-white">New Task</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Title */}
                <div>
                  <label className={labelCls}>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="What needs to be done?"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    className={inputCls}
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    rows={2}
                    placeholder="Optional details…"
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {/* Category + Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                      className={inputCls}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[#080f18]">
                          {c.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => set('priority', e.target.value)}
                      className={inputCls}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p} className="bg-[#080f18]">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due date + time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Due Date</label>
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => set('due_date', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Due Time</label>
                    <input
                      type="time"
                      value={form.due_time}
                      onChange={(e) => set('due_time', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Money impact */}
                <div>
                  <label className={labelCls}>Money Impact (EUR)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="e.g. 3000"
                    value={form.money_impact}
                    onChange={(e) => set('money_impact', e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className={labelCls}>Reason / Context</label>
                  <input
                    type="text"
                    placeholder="Why does this task exist?"
                    value={form.reason}
                    onChange={(e) => set('reason', e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/25 text-xs text-red-400"
                    >
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1 pb-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#2e6f8f]/20 text-[#7dd3e8] border border-[#2e6f8f]/35 hover:bg-[#2e6f8f]/32 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {saving ? 'Creating…' : 'Create Task'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white/30 hover:text-white/60 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
