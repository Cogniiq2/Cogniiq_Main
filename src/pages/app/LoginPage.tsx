import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthAlert, AuthField, AuthPageLayout, AuthSubmitButton } from '@/components/auth/AuthPageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { sanitizeRedirect } from '@/lib/auth/authorizedRedirect';

// The one canonical Cogniiq login for customers, admins and the owner. It never decides the landing
// itself: on success it hands off to /auth/continue, which waits for the database-backed role and
// routes to the authorized destination. This avoids navigating on stale React role state.
function continueUrl(rawRedirect: string | null): string {
  const safe = sanitizeRedirect(rawRedirect);
  return safe ? `/auth/continue?redirectTo=${encodeURIComponent(safe)}` : '/auth/continue';
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = continueUrl(searchParams.get('redirectTo'));

  // An already-authenticated visitor is sent through the same role-resolution flow (so an owner lands
  // on Finance, not /app).
  useEffect(() => {
    if (!isLoading && user) navigate(target, { replace: true });
  }, [isLoading, user, navigate, target]);

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

    navigate(target, { replace: true });
  }

  return (
    <AuthPageLayout
      eyebrow="Sicherer Zugang"
      title="Cogniiq Login"
      description="Melden Sie sich sicher in Ihrem Cogniiq-Bereich an."
      footer={
        <p className="text-[13.5px] text-gray-600">
          Noch kein Konto?{' '}
          <Link to="/app/signup" className="font-semibold text-gray-950 underline-offset-2 hover:underline">
            Kundenkonto erstellen
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="login-email"
          label="E-Mail"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="sie@unternehmen.de"
        />
        <AuthField
          id="login-password"
          label="Passwort"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Ihr Passwort"
        />

        <div className="flex items-center justify-between">
          <Link
            to="/app/forgot-password"
            className="text-[12px] font-semibold text-gray-600 transition-colors duration-fast ease-premium hover:text-gray-950"
          >
            Passwort vergessen?
          </Link>
        </div>

        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <AuthSubmitButton loading={loading} loadingLabel="Anmeldung...">Einloggen</AuthSubmitButton>
      </form>
    </AuthPageLayout>
  );
}
