import type { InputHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

// The shared chrome for every authentication surface (login, signup, password reset,
// recovery). One card, one field style, one submit control, one alert — previously each
// page repeated the same input class string and its own button markup, which is how the
// four surfaces had drifted apart.

const authFocusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

interface AuthPageLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPageLayout({ eyebrow, title, description, children, footer }: AuthPageLayoutProps) {
  return (
    <div data-cq-surface="auth" className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className={cn('group inline-flex items-center gap-3 rounded-control', authFocusRing)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-control border border-gray-200 bg-white text-sm font-bold tracking-tight text-gray-950 shadow-sm transition-colors duration-fast ease-premium group-hover:border-gray-300">
              C
            </span>
            <span className="text-sm font-semibold tracking-tight text-gray-950">Cogniiq</span>
          </Link>
          <Link
            to="/ki-telefonassistent"
            className={cn('rounded-control px-1 text-sm font-medium text-gray-500 transition-colors duration-fast ease-premium hover:text-gray-950', authFocusRing)}
          >
            KI-Telefonassistent
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-12 sm:py-16">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_440px]">
            <section className="hidden lg:block">
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">{eyebrow}</p>
              <h1 className="max-w-2xl text-[44px] font-semibold leading-[1.06] tracking-[-0.025em] text-gray-950">
                Secure foundation for premium AI operations.
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-7 text-gray-600">
                The customer account area is private, tenant-scoped, and prepared for the future AI receptionist product.
              </p>
              <div className="mt-10 grid max-w-xl grid-cols-3 overflow-hidden rounded-card border border-hairline">
                {['Auth', 'Tenant', 'RLS'].map((item) => (
                  <div key={item} className="border-r border-hairline px-5 py-4 last:border-r-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">{item}</p>
                    <p className="mt-1 text-xs text-gray-600">Active</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="w-full rounded-panel border border-hairline bg-white p-6 shadow-panel sm:p-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{eyebrow}</p>
              <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-gray-950">{title}</h2>
              <p className="mt-3 text-[13.5px] leading-6 text-gray-600">{description}</p>
              <div className="mt-7">{children}</div>
              {footer && <div className="mt-6 border-t border-hairline pt-5">{footer}</div>}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

/** A labelled text input in the auth card. */
export function AuthField({
  label,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-gray-700">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          'h-12 w-full rounded-control border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none',
          'transition-colors duration-fast ease-premium placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-400',
          authFocusRing,
        )}
        {...props}
      />
    </div>
  );
}

/** Full-width submit control with a loading state. */
export function AuthSubmitButton({ loading, loadingLabel, children }: { loading: boolean; loadingLabel: string; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading || undefined}
      className={cn(
        'group inline-flex min-h-12 w-full items-center justify-between rounded-control bg-gray-950 px-5 text-[13.5px] font-semibold text-white',
        'transition-[background-color,transform] duration-fast ease-premium hover:bg-gray-800',
        'active:scale-[0.99] motion-reduce:active:scale-100',
        'disabled:cursor-not-allowed disabled:bg-gray-300 disabled:active:scale-100',
        authFocusRing,
      )}
    >
      {loading ? loadingLabel : children}
      {loading ? (
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70 motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        <ArrowRight size={16} className="transition-transform duration-fast ease-premium group-hover:translate-x-0.5" aria-hidden="true" />
      )}
    </button>
  );
}

/** Inline success or failure feedback inside the auth card. */
export function AuthAlert({ tone, children }: { tone: 'success' | 'error'; children: ReactNode }) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-control border px-4 py-3 text-[13px] leading-5',
        tone === 'success' ? 'border-emerald-200/80 bg-emerald-50 text-emerald-800' : 'border-red-200/80 bg-red-50 text-red-800',
      )}
    >
      <Icon size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
