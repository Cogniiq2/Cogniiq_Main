import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { supabase } from '@/lib/supabase';

function getSafeRedirectPath(value: string | null): string {
  if (!value) return '/app';
  if (!value.startsWith('/') || value.startsWith('//')) return '/app';
  if (!value.startsWith('/app')) return '/app';
  return value;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = getSafeRedirectPath(searchParams.get('redirectTo'));

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
    <AuthPageLayout
      eyebrow="Kundenbereich"
      title="Kundenlogin"
      description="Melden Sie sich im sicheren Cogniiq Kundenbereich an."
      footer={
        <p className="text-sm leading-6 text-gray-500">
          Der Kundenbereich ist ein eingeladener Workspace. Neue Konten werden durch Cogniiq provisioniert.
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-gray-700">E-Mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400"
            placeholder="sie@unternehmen.de"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-gray-700">Passwort</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400"
            placeholder="Ihr Passwort"
          />
        </label>

        <div className="flex items-center justify-between">
          <Link to="/app/forgot-password" className="text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900">
            Passwort vergessen?
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group inline-flex w-full items-center justify-between rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? 'Anmeldung...' : 'Einloggen'}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>
    </AuthPageLayout>
  );
}
