import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(async (args: unknown): Promise<{ data: { session: null }; error: null }> => {
    void args;
    return { data: { session: null }, error: null };
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signUp: (args: unknown) => mocks.signUp(args) } },
}));

const { SignupPage } = await import('./SignupPage');

beforeEach(() => {
  mocks.signUp.mockReset();
  mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
});

describe('SignupPage email redirect', () => {
  it('points Supabase confirmation links at the standalone confirmation surface', async () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-horse-1' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'correct-horse-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create account/ }));

    await waitFor(() => expect(mocks.signUp).toHaveBeenCalled());

    const args = mocks.signUp.mock.calls[0][0] as {
      options: { emailRedirectTo: string };
    };
    expect(args.options.emailRedirectTo).toBe(
      `${window.location.origin}/auth/confirmed?flow=signup`
    );
    expect(args.options.emailRedirectTo).not.toContain('/app');
  });
});

describe('admin-provision-client invite redirect', () => {
  it('defaults to the invite confirmation surface and keeps the env override', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'supabase/functions/admin-provision-client/index.ts'),
      'utf8'
    );

    expect(source).toContain('https://cogniiq.de/auth/confirmed?flow=invite');
    expect(source).toContain('Deno.env.get("CUSTOMER_PORTAL_INVITE_REDIRECT")');
    expect(source).not.toContain('?? "https://cogniiq.de/app/login"');
  });
});
