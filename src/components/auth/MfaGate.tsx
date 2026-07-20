import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface MfaFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
}

interface PendingEnrollment {
  id: string;
  qrCode: string;
  secret: string;
}

export function MfaGate({ onVerified }: { onVerified?: () => void }) {
  const { signOut, refreshMfaLevel } = useAuth();
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [pendingEnrollment, setPendingEnrollment] = useState<PendingEnrollment | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifiedTotpFactors = useMemo(
    () => factors.filter((factor) => factor.factor_type === 'totp' && factor.status === 'verified'),
    [factors]
  );
  const unverifiedTotpFactor = useMemo(
    () => factors.find((factor) => factor.factor_type === 'totp' && factor.status === 'unverified') ?? null,
    [factors]
  );

  const loadFactors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setFactors([]);
      setError(factorsError.message);
    } else {
      setFactors((data?.all ?? []) as MfaFactor[]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadFactors();
  }, [loadFactors]);

  const enrollTotp = async () => {
    setIsSubmitting(true);
    setError(null);

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Cogniiq Kundenbereich',
    });

    setIsSubmitting(false);

    if (enrollError) {
      setError(enrollError.message);
      return;
    }

    setPendingEnrollment({
      id: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
    await loadFactors();
  };

  const verifyExistingFactor = async (factorId: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Bitte geben Sie den sechsstelligen Code ein.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: trimmedCode,
    });

    setIsSubmitting(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    setCode('');
    await refreshMfaLevel();
    onVerified?.();
  };

  const verifyEnrollment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingEnrollment) return;

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Bitte geben Sie den sechsstelligen Code ein.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const challenge = await supabase.auth.mfa.challenge({ factorId: pendingEnrollment.id });
    if (challenge.error) {
      setIsSubmitting(false);
      setError(challenge.error.message);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: pendingEnrollment.id,
      challengeId: challenge.data.id,
      code: trimmedCode,
    });

    setIsSubmitting(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    setPendingEnrollment(null);
    setCode('');
    await refreshMfaLevel();
    onVerified?.();
  };

  const restartEnrollment = async () => {
    const factorId = pendingEnrollment?.id ?? unverifiedTotpFactor?.id;
    if (factorId) {
      await supabase.auth.mfa.unenroll({ factorId });
    }
    setPendingEnrollment(null);
    setCode('');
    await loadFactors();
  };

  const firstVerifiedFactor = verifiedTotpFactors[0] ?? null;

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-4 py-10 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center">
        <section className="w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
            <ShieldCheck size={21} aria-hidden="true" />
          </div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Sicherheitsprüfung</p>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-gray-950">
            Zwei-Faktor-Authentifizierung erforderlich
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-500">
            Der Kundenbereich enthält sensible System- und Betriebsdaten. Bitte bestätigen Sie Ihre Sitzung mit einem Authenticator-Code.
          </p>

          <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            {isLoading ? (
              <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                <RefreshCw size={15} className="animate-spin" aria-hidden="true" />
                Sicherheitsstatus wird geladen
              </div>
            ) : null}

            {!isLoading && firstVerifiedFactor ? (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void verifyExistingFactor(firstVerifiedFactor.id);
                }}
              >
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Code aus {firstVerifiedFactor.friendly_name || 'Ihrer Authenticator-App'}
                  </span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold tracking-[0.24em] text-gray-950 outline-none transition-colors focus:border-gray-400"
                    placeholder="000000"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <KeyRound size={15} aria-hidden="true" />
                  {isSubmitting ? 'Prüfung läuft...' : 'Sitzung bestätigen'}
                </button>
              </form>
            ) : null}

            {!isLoading && !firstVerifiedFactor && !pendingEnrollment ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-gray-600">
                  Für dieses Konto ist noch kein bestätigter TOTP-Faktor vorhanden.
                </p>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void enrollTotp()}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <ShieldCheck size={15} aria-hidden="true" />
                  Authenticator einrichten
                </button>
              </div>
            ) : null}

            {pendingEnrollment ? (
              <form className="space-y-5" onSubmit={verifyEnrollment}>
                <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                  <div className="rounded-2xl border border-gray-200 bg-white p-3">
                    <img src={pendingEnrollment.qrCode} alt="TOTP QR-Code" className="h-auto w-full" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Authenticator-App scannen</p>
                    <p className="mt-2 break-all rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs font-semibold text-gray-500">
                      {pendingEnrollment.secret}
                    </p>
                  </div>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-700">Bestätigungscode</span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold tracking-[0.24em] text-gray-950 outline-none transition-colors focus:border-gray-400"
                    placeholder="000000"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gray-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isSubmitting ? 'Prüfung läuft...' : 'Einrichtung abschließen'}
                </button>
              </form>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void restartEnrollment()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950"
            >
              Einrichtung neu starten
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950"
            >
              <LogOut size={15} aria-hidden="true" />
              Abmelden
            </button>
            <a
              href="mailto:info@cogniiq.de"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950"
            >
              Support
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
