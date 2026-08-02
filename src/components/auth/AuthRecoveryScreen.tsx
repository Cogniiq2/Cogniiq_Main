import { LogOut, RefreshCw, WifiOff } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';

/**
 * Shown when the authentication bootstrap did not finish within its deadline.
 *
 * This replaces what used to be an English spinner that spun forever: a stalled
 * backend left every guarded route rendering "Checking secure session" with no
 * retry, no sign out and no explanation.
 *
 * Deliberately NOT a redirect to the login page. The session may well be valid —
 * the request simply never came back — so bouncing the user to a login form
 * would state something untrue about their account and lose their destination.
 * It offers the two actions that can actually help instead.
 */
export function AuthRecoveryScreen() {
  const { retryAuth, signOut } = useAuth();
  const [busy, setBusy] = useState<'retry' | 'signout' | null>(null);

  const retry = async () => {
    setBusy('retry');
    await retryAuth();
    setBusy(null);
  };

  const leave = async () => {
    setBusy('signout');
    await signOut();
    setBusy(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 text-gray-950">
      <div
        role="alert"
        className="w-full max-w-md rounded-card border border-gray-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
      >
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
          <WifiOff size={19} aria-hidden="true" />
        </div>

        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          Verbindung
        </p>
        <h1 className="mb-3 text-2xl font-bold tracking-tight">Anmeldung dauert zu lange</h1>
        <p className="mb-6 text-sm leading-6 text-gray-600">
          Ihre Sitzung konnte nicht geprüft werden. Möglicherweise ist Ihre Internetverbindung
          unterbrochen oder unser Dienst antwortet gerade nicht. Ihre Daten sind davon nicht
          betroffen.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void retry()}
            disabled={busy !== null}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2"
          >
            <RefreshCw size={15} aria-hidden="true" />
            {busy === 'retry' ? 'Wird erneut geprüft …' : 'Erneut versuchen'}
          </button>

          <button
            type="button"
            onClick={() => void leave()}
            disabled={busy !== null}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2"
          >
            <LogOut size={15} aria-hidden="true" />
            {busy === 'signout' ? 'Wird abgemeldet …' : 'Abmelden'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthRecoveryScreen;
