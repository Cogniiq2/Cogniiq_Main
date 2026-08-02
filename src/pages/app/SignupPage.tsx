import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthAlert, AuthField, AuthPageLayout, AuthSubmitButton } from '@/components/auth/AuthPageLayout';
import { supabase } from '@/lib/supabase';

export function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
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
    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        // Explicit confirmation surface, not the portal: the user must be told that activation
        // actually succeeded before being handed off through /auth/continue.
        emailRedirectTo: `${window.location.origin}/auth/confirmed?flow=signup`,
      },
    });
    setLoading(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    if (data.session) {
      navigate('/app', { replace: true });
      return;
    }

    setMessage('Check your email to confirm your account.');
  }

  return (
    <AuthPageLayout
      eyebrow="Secure Signup"
      title="Create your account"
      description="Start with identity only. Workspace provisioning happens later through a controlled Cogniiq flow."
      footer={
        <p className="text-[13.5px] text-gray-600">
          Already have an account?{' '}
          <Link to="/app/login" className="font-semibold text-gray-950 underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="signup-name"
          label="Full name"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Your name"
        />
        <AuthField
          id="signup-email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
        />
        <AuthField
          id="signup-password"
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 characters"
        />
        <AuthField
          id="signup-confirm-password"
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

        <AuthSubmitButton loading={loading} loadingLabel="Creating account...">Create account</AuthSubmitButton>
      </form>
    </AuthPageLayout>
  );
}
