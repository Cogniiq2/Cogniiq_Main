import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

function getSafeAdminRedirectPath(value: string | null): string {
  if (!value) return '/admin';
  if (!value.startsWith('/') || value.startsWith('//')) return '/admin';
  if (!value.startsWith('/admin')) return '/admin';
  return value;
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading, isPlatformAdmin, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectTo = getSafeAdminRedirectPath(searchParams.get('redirectTo'));

  useEffect(() => {
    if (!isLoading && user && isPlatformAdmin) {
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, isPlatformAdmin, navigate, redirectTo, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="group inline-flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white text-sm font-bold tracking-tight text-gray-950 shadow-sm transition-colors group-hover:bg-gray-100">
              C
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">Cogniiq</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-white/55 transition-colors hover:text-white">
            Zur Website
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-16">
          <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white">
              <ShieldCheck size={19} />
            </div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Admin Access</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Admin Login</h1>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Zugang nur fuer Cogniiq Plattform-Administratoren und Owner.
            </p>

            {user && !isLoading && !isPlatformAdmin ? (
              <div className="mt-7 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                Dieses Konto hat keine Admin-Berechtigung.
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="mt-3 block font-semibold text-white underline underline-offset-4"
                >
                  Abmelden
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">E-Mail</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition-colors placeholder:text-gray-400 focus:border-white/30"
                    placeholder="admin@cogniiq.de"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">Passwort</span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition-colors placeholder:text-gray-400 focus:border-white/30"
                    placeholder="Admin Passwort"
                  />
                </label>

                {error && (
                  <div className="rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-between rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-gray-950 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-white/40"
                >
                  {loading ? 'Pruefung...' : 'Einloggen'}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
