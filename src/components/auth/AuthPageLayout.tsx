import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthPageLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPageLayout({ eyebrow, title, description, children, footer }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="group inline-flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold tracking-tight text-gray-950 shadow-sm transition-colors group-hover:border-gray-300">
              C
            </span>
            <span className="text-sm font-semibold tracking-tight text-gray-950">Cogniiq</span>
          </Link>
          <Link to="/ki-telefonassistent" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
            KI-Telefonassistent
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-16">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_440px]">
            <section className="hidden lg:block">
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">{eyebrow}</p>
              <h1 className="max-w-2xl text-5xl font-bold leading-[1.04] tracking-tight text-gray-950">
                Secure foundation for premium AI operations.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-gray-500">
                The customer account area is private, tenant-scoped, and prepared for the future AI receptionist product.
              </p>
              <div className="mt-10 grid max-w-xl grid-cols-3 overflow-hidden rounded-2xl border border-gray-100">
                {['Auth', 'Tenant', 'RLS'].map((item) => (
                  <div key={item} className="border-r border-gray-100 px-5 py-4 last:border-r-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{item}</p>
                    <p className="mt-1 text-xs text-gray-500">Active</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{eyebrow}</p>
              <h2 className="text-2xl font-bold tracking-tight text-gray-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">{description}</p>
              <div className="mt-7">{children}</div>
              {footer && <div className="mt-6 border-t border-gray-100 pt-5">{footer}</div>}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
