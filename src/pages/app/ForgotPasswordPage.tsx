import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthAlert, AuthField, AuthPageLayout, AuthSubmitButton } from '@/components/auth/AuthPageLayout';
import { supabase } from '@/lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/app/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage('If an account exists for that email, a reset link has been sent.');
  }

  return (
    <AuthPageLayout
      eyebrow="Account Recovery"
      title="Reset your password"
      description="Send a secure password reset link to your email."
      footer={
        <p className="text-[13.5px] text-gray-600">
          Remembered it?{' '}
          <Link to="/app/login" className="font-semibold text-gray-950 underline-offset-2 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="forgot-email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
        />

        {message && <AuthAlert tone="success">{message}</AuthAlert>}
        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <AuthSubmitButton loading={loading} loadingLabel="Sending...">Send reset link</AuthSubmitButton>
      </form>
    </AuthPageLayout>
  );
}
