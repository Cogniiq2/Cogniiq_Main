import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  CONFIRMATION_ERROR_COPY,
  CONTINUE_PATH,
  INVITE_CTA_LABEL,
  INVITE_READY_COPY,
  INVITE_SUCCESS_COPY,
  MIN_PASSWORD_LENGTH,
  RESOLVING_COPY,
  SESSION_RESOLUTION_TIMEOUT_MS,
  SIGNUP_CTA_LABEL,
  SIGNUP_SUCCESS_COPY,
  describePasswordUpdateFailure,
  hasLinkError,
  normalizeFlow,
  resolveConfirmationPhase,
  validatePasswordPair,
  type AuthConfirmationCopy,
} from '@/lib/auth/authConfirmation';

// Standalone authentication completion surface, mounted at /auth/confirmed.
//
// Supabase confirmation and invitation links used to drop the user straight into the portal (or the
// login form), which gave no signal that activation had actually worked. This page is the explicit
// confirmation step: it waits for Supabase to turn the URL into a session, reports success only once
// a confirmed authenticated session exists, and — for invitations — takes the user's own password
// before handing off.
//
// It sits outside the marketing and dashboard layouts (no Navigation, no Footer, no dashboard shell)
// and is marked noindex by the route-indexability manager in App.tsx.
//
// Invitation membership claiming is NOT done here: AuthContext already runs
// claim_my_client_invitations exactly once per authenticated user as part of its account load, and
// that stays the single place it happens.

type InvitePhase = 'form' | 'saving' | 'done';

function StatusPanel({
  tone,
  copy,
  children,
}: {
  tone: 'pending' | 'success' | 'error';
  copy: AuthConfirmationCopy;
  children?: ReactNode;
}) {
  const icon =
    tone === 'success' ? (
      <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-emerald-600" />
    ) : tone === 'error' ? (
      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
    ) : (
      <Loader2 size={18} className="mt-0.5 flex-shrink-0 animate-spin text-gray-400" />
    );

  const frame =
    tone === 'success'
      ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
      : tone === 'error'
        ? 'border-amber-100 bg-amber-50 text-amber-900'
        : 'border-gray-100 bg-gray-50 text-gray-700';

  return (
    <div className="space-y-5">
      <div
        // Errors interrupt (assertive); progress and success are polite announcements.
        role={tone === 'error' ? 'alert' : 'status'}
        aria-live={tone === 'error' ? 'assertive' : 'polite'}
        aria-busy={tone === 'pending' ? true : undefined}
        className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-6 ${frame}`}
      >
        {icon}
        <div>
          <p className="font-semibold">{copy.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{copy.description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function PrimaryAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex w-full items-center justify-between rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
    >
      {label}
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function AuthConfirmationPage() {
  const [params] = useSearchParams();
  const { isLoading, authTimedOut, user, retryAuth } = useAuth();

  const flow = normalizeFlow(params.get('flow'));

  // Read once per mount: Supabase strips the fragment after it consumes it, so a later read would
  // wrongly look clean.
  const [linkFailed] = useState(() =>
    typeof window === 'undefined'
      ? false
      : hasLinkError(window.location.search, window.location.hash)
  );

  // Bounded wait for the URL session. Until it elapses, "no session yet" means "still resolving",
  // never "failed" — which is what keeps the page from flashing an error on a slow connection.
  const [waitElapsed, setWaitElapsed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [invitePhase, setInvitePhase] = useState<InvitePhase>('form');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  // A failed password update keeps the form on screen (with our own copy, never the provider's) so
  // the user can simply try again — it is not a dead end.
  const [updateFailed, setUpdateFailed] = useState(false);

  useEffect(() => {
    setWaitElapsed(false);
    const timer = window.setTimeout(() => setWaitElapsed(true), SESSION_RESOLUTION_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [attempt]);

  const isEmailConfirmed = Boolean(user?.email_confirmed_at ?? user?.confirmed_at);

  const phase = resolveConfirmationPhase({
    linkFailed,
    isLoading,
    authTimedOut,
    hasSession: Boolean(user),
    isEmailConfirmed,
    waitElapsed,
  });

  async function handleRetry() {
    setAttempt((value) => value + 1);
    await retryAuth();
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUpdateFailed(false);

    const validation = validatePasswordPair(password, confirmation);
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError(null);
    setInvitePhase('saving');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        // The provider message is deliberately dropped — users see our own copy only.
        setInvitePhase('form');
        setUpdateFailed(true);
        return;
      }
    } catch {
      setInvitePhase('form');
      setUpdateFailed(true);
      return;
    }

    setPassword('');
    setConfirmation('');
    setInvitePhase('done');
  }

  const supportFooter = (
    <div className="space-y-2 text-sm text-gray-500">
      <p>
        Problem mit diesem Link?{' '}
        <Link to="/app/login" className="font-semibold text-gray-900 hover:text-gray-600">
          Neue Einladung anfordern
        </Link>
      </p>
      <p>
        Weiterhin blockiert?{' '}
        <Link to="/kontakt" className="font-semibold text-gray-900 hover:text-gray-600">
          Support kontaktieren
        </Link>
      </p>
    </div>
  );

  if (phase.kind === 'error') {
    return (
      <AuthPageLayout
        eyebrow="Kontoaktivierung"
        title="Aktivierung nicht abgeschlossen"
        description="Der Zugang konnte über diesen Link nicht bestätigt werden."
        footer={supportFooter}
      >
        <StatusPanel tone="error" copy={CONFIRMATION_ERROR_COPY[phase.reason]}>
          <button
            type="button"
            onClick={handleRetry}
            className="group inline-flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-300"
          >
            Erneut versuchen
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </StatusPanel>
      </AuthPageLayout>
    );
  }

  if (phase.kind === 'resolving') {
    return (
      <AuthPageLayout
        eyebrow="Kontoaktivierung"
        title={RESOLVING_COPY.title}
        description={RESOLVING_COPY.description}
      >
        <StatusPanel tone="pending" copy={RESOLVING_COPY} />
      </AuthPageLayout>
    );
  }

  // From here on: a confirmed, authenticated session exists.
  if (flow === 'signup') {
    return (
      <AuthPageLayout
        eyebrow="Kontoaktivierung"
        title={SIGNUP_SUCCESS_COPY.title}
        description={SIGNUP_SUCCESS_COPY.description}
        footer={
          <p className="text-sm text-gray-500">
            Fragen zu Ihrem Zugang?{' '}
            <Link to="/kontakt" className="font-semibold text-gray-900 hover:text-gray-600">
              Support kontaktieren
            </Link>
          </p>
        }
      >
        <StatusPanel tone="success" copy={SIGNUP_SUCCESS_COPY}>
          <PrimaryAction to={CONTINUE_PATH} label={SIGNUP_CTA_LABEL} />
        </StatusPanel>
      </AuthPageLayout>
    );
  }

  if (invitePhase === 'done') {
    return (
      <AuthPageLayout
        eyebrow="Einladung"
        title={INVITE_SUCCESS_COPY.title}
        description={INVITE_SUCCESS_COPY.description}
      >
        <StatusPanel tone="success" copy={INVITE_SUCCESS_COPY}>
          <PrimaryAction to={CONTINUE_PATH} label={INVITE_CTA_LABEL} />
        </StatusPanel>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      eyebrow="Einladung"
      title={INVITE_READY_COPY.title}
      description={INVITE_READY_COPY.description}
      footer={supportFooter}
    >
      <div className="space-y-5">
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-sm leading-6 text-emerald-800"
        >
          <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold">{INVITE_READY_COPY.title}</p>
            <p className="mt-1 opacity-90">{INVITE_READY_COPY.description}</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-700">Neues Passwort</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400"
              placeholder={`Mindestens ${MIN_PASSWORD_LENGTH} Zeichen`}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-700">Passwort bestätigen</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400"
              placeholder="Passwort wiederholen"
            />
          </label>

          {formError && (
            <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {updateFailed && (
            <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">{describePasswordUpdateFailure().title}</p>
              <p className="mt-1 leading-6">{describePasswordUpdateFailure().description}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={invitePhase === 'saving'}
            className="group inline-flex w-full items-center justify-between rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {invitePhase === 'saving' ? 'Passwort wird gespeichert...' : 'Passwort festlegen'}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>
      </div>
    </AuthPageLayout>
  );
}

export default AuthConfirmationPage;
