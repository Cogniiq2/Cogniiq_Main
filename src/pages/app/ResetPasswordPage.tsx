import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthAlert, AuthField, AuthPageLayout, AuthSubmitButton } from '@/components/auth/AuthPageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError('Please use at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage('Password updated. Redirecting to your account...');
    window.setTimeout(() => navigate('/app', { replace: true }), 900);
  }

  const noSession = !isLoading && !user;

  return (
    <AuthPageLayout
      eyebrow="Secure Reset"
      title="Choose a new password"
      description="This page works after opening a valid Supabase recovery link."
      footer={
        <p className="text-[13.5px] text-gray-600">
          Need a fresh link?{' '}
          <Link to="/app/forgot-password" className="font-semibold text-gray-950 underline-offset-2 hover:underline">
            Request one
          </Link>
        </p>
      }
    >
      {noSession ? (
        <div role="alert" className="rounded-control border border-amber-200/80 bg-amber-50 px-4 py-3 text-[13px] leading-6 text-amber-900">
          This reset link is invalid, expired, or has already been used. Request a new password reset link to continue.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            id="reset-password"
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
          />
          <AuthField
            id="reset-confirm-password"
            label="Confirm password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat password"
          />

          {message && <AuthAlert tone="success">{message}</AuthAlert>}
          {error && <AuthAlert tone="error">{error}</AuthAlert>}

          <AuthSubmitButton loading={loading || isLoading} loadingLabel="Updating...">Update password</AuthSubmitButton>
        </form>
      )}
    </AuthPageLayout>
  );
}
