import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const INITIAL: FormState = { name: '', email: '', phone: '', message: '' };

function FormLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-gray-700 mb-1.5"
      style={{ fontSize: '12.5px', fontWeight: 500, letterSpacing: '0.01em' }}
    >
      {children}
      {optional && (
        <span className="text-gray-400 ml-1.5 font-normal" style={{ fontSize: '11px' }}>
          optional
        </span>
      )}
    </label>
  );
}

const inputClass =
  'w-full h-11 px-3.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-colors focus:border-gray-400';

export function FAQQuestionModal({ open, onClose }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setSuccess(false);
      setForm(INITIAL);
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [success, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      question: form.message.trim(),
    };
    try {
      await Promise.all([
        supabase.from('faq_questions').insert({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          message: payload.question,
        }),
        fetch('https://n8n.cogniiq.co/webhook/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      ]);
      setSuccess(true);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(9,11,17,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full bg-white rounded-2xl overflow-hidden"
            style={{ maxWidth: '540px', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-modal-title"
          >
            <AnimatePresence mode="wait">
              {success ? (
                <SuccessView key="success" />
              ) : (
                <FormView
                  key="form"
                  form={form}
                  set={set}
                  submitting={submitting}
                  onSubmit={handleSubmit}
                  onClose={onClose}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FormView({
  form,
  set,
  submitting,
  onSubmit,
  onClose,
}: {
  form: FormState;
  set: (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header bar */}
      <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-gray-100">
        <div>
          <p
            className="text-gray-400 uppercase mb-1.5"
            style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.20em' }}
          >
            Frage stellen
          </p>
          <h2
            id="faq-modal-title"
            className="text-gray-900"
            style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            Stellen Sie Ihre Frage.
          </h2>
          <p className="text-gray-400 mt-1" style={{ fontSize: '13px', lineHeight: 1.5 }}>
            Wir antworten direkt — persönlich, nicht automatisiert.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-colors flex-shrink-0 ml-4 mt-0.5"
          aria-label="Schließen"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Form body */}
      <form onSubmit={onSubmit} className="px-7 pb-7 pt-6 flex flex-col gap-5">

        {/* Name + Email */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="fq-name">Name</FormLabel>
            <input
              id="fq-name"
              type="text"
              required
              value={form.name}
              onChange={set('name')}
              placeholder="Max Mustermann"
              className={inputClass}
            />
          </div>
          <div>
            <FormLabel htmlFor="fq-email">E-Mail</FormLabel>
            <input
              id="fq-email"
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="max@firma.de"
              className={inputClass}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <FormLabel htmlFor="fq-phone" optional>Telefon</FormLabel>
          <input
            id="fq-phone"
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="+49 123 456 789"
            className={inputClass}
          />
        </div>

        {/* Message */}
        <div>
          <FormLabel htmlFor="fq-message">Ihre Frage</FormLabel>
          <textarea
            id="fq-message"
            required
            rows={4}
            value={form.message}
            onChange={set('message')}
            placeholder="Was möchten Sie wissen? Beschreiben Sie Ihre Frage so konkret wie möglich …"
            className="w-full px-3.5 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-colors focus:border-gray-400 resize-none leading-relaxed"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 -mx-1" />

        {/* Footer row */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-gray-400 leading-relaxed" style={{ fontSize: '11.5px', maxWidth: '30ch' }}>
            Ihre Daten werden vertraulich behandelt und nicht weitergegeben.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="flex-shrink-0 flex items-center gap-2 text-white transition-opacity"
            style={{
              background: '#111827',
              fontSize: '13.5px',
              fontWeight: 500,
              letterSpacing: '0.01em',
              borderRadius: '8px',
              height: '42px',
              padding: '0 20px',
              border: 'none',
              cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.6 : 1,
              boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            }}
          >
            {submitting ? (
              <span>Wird gesendet …</span>
            ) : (
              <>
                <span>Frage absenden</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

      </form>
    </motion.div>
  );
}

function SuccessView() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center text-center px-10 py-16"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        className="flex items-center justify-center w-16 h-16 rounded-2xl border border-gray-200 mb-8"
        style={{ background: '#fafafa' }}
      >
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.15 }}
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#111827"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.polyline
            points="20 6 9 17 4 12"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.2 }}
          />
        </motion.svg>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="text-gray-900 mb-3"
        style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}
      >
        Frage eingegangen.
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="text-gray-500"
        style={{ fontSize: '14px', lineHeight: 1.65, maxWidth: '30ch' }}
      >
        Wir melden uns persönlich — in der Regel innerhalb von 24 Stunden.
      </motion.p>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 3, ease: 'linear', delay: 0.5 }}
        className="mt-10 h-px bg-gray-900 w-12 origin-left rounded-full"
        style={{ opacity: 0.15 }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="text-gray-300 mt-2"
        style={{ fontSize: '11px', letterSpacing: '0.08em' }}
      >
        Schließt automatisch …
      </motion.p>
    </motion.div>
  );
}
