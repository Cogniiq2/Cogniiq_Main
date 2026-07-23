import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

// Non-blocking toast notifications for the light dashboard system. Replaces alert()/confirm success
// feedback with an accessible, dismissible, auto-expiring queue. Reusable by the admin and owner
// areas.

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** milliseconds before auto-dismiss; 0 keeps it until dismissed */
  duration?: number;
  /** optional single action (e.g. retry) */
  action?: { label: string; onClick: () => void };
}

interface ToastRecord extends Required<Omit<ToastOptions, 'action' | 'description'>> {
  id: number;
  description?: string;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  toast: (options: ToastOptions) => number;
  success: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const toneConfig: Record<ToastTone, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', iconColor: 'text-emerald-600' },
  error: { icon: XCircle, ring: 'border-red-200', iconColor: 'text-red-600' },
  warning: { icon: TriangleAlert, ring: 'border-amber-200', iconColor: 'text-amber-600' },
  info: { icon: Info, ring: 'border-gray-200', iconColor: 'text-gray-600' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = (idRef.current += 1);
    const record: ToastRecord = {
      id,
      title: options.title,
      description: options.description,
      tone: options.tone ?? 'info',
      duration: options.duration ?? 5000,
      action: options.action,
    };
    setToasts((current) => [...current, record]);
    if (record.duration > 0) {
      const timer = setTimeout(() => dismiss(id), record.duration);
      timers.current.set(id, timer);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((title: string, description?: string) => toast({ title, description, tone: 'success' }), [toast]);
  const error = useCallback((title: string, description?: string) => toast({ title, description, tone: 'error', duration: 8000 }), [toast]);

  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach((t) => clearTimeout(t)); map.clear(); };
  }, []);

  const api = useMemo<ToastApi>(() => ({ toast, success, error, dismiss }), [toast, success, error, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-6 sm:items-end sm:pr-6"
        role="region"
        aria-label="Benachrichtigungen"
      >
        {toasts.map((t) => {
          const { icon: Icon, ring, iconColor } = toneConfig[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.14)]',
                'animate-in slide-in-from-bottom-4 fade-in duration-200',
                ring,
              )}
            >
              <Icon size={18} className={cn('mt-0.5 shrink-0', iconColor)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-gray-950">{t.title}</p>
                {t.description ? <p className="mt-0.5 text-[12px] leading-5 text-gray-500">{t.description}</p> : null}
                {t.action ? (
                  <button
                    type="button"
                    onClick={() => { t.action?.onClick(); dismiss(t.id); }}
                    className="mt-2 text-[12px] font-semibold text-gray-950 underline underline-offset-2 hover:text-gray-600"
                  >
                    {t.action.label}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
                aria-label="Schließen"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
