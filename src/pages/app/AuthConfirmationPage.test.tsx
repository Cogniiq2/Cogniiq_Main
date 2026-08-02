import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SESSION_RESOLUTION_TIMEOUT_MS } from '@/lib/auth/authConfirmation';

// `vi.mock` factories are hoisted above the imports, so the mutable handles they close over have to
// be hoisted too.
const mocks = vi.hoisted(() => ({
  auth: {
    isLoading: false,
    authTimedOut: false,
    user: null as { email_confirmed_at?: string | null; confirmed_at?: string | null } | null,
    retryAuth: vi.fn(async () => {}),
  },
  updateUser: vi.fn(
    async (args: { password: string }): Promise<{ error: { message: string } | null }> => {
      void args;
      return { error: null };
    }
  ),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mocks.auth,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: (args: { password: string }) => mocks.updateUser(args),
    },
  },
}));

const { AuthConfirmationPage } = await import('./AuthConfirmationPage');

const CONFIRMED_USER = { email_confirmed_at: '2026-08-01T10:00:00.000Z' };

function renderPage(url: string) {
  // The page reads window.location for the Supabase error fragment, which the router does not model.
  window.history.replaceState({}, '', url);
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AuthConfirmationPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mocks.auth.isLoading = false;
  mocks.auth.authTimedOut = false;
  mocks.auth.user = null;
  mocks.auth.retryAuth.mockClear();
  mocks.updateUser.mockReset();
  mocks.updateUser.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState({}, '', '/');
});

describe('signup flow', () => {
  it('confirms activation and routes the primary action through /auth/continue', () => {
    mocks.auth.user = CONFIRMED_USER;
    renderPage('/auth/confirmed?flow=signup');

    expect(screen.getAllByText('E-Mail erfolgreich bestätigt').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ihr Cogniiq-Zugang wurde aktiviert.').length).toBeGreaterThan(0);

    const cta = screen.getByRole('link', { name: /Zum Kundenportal/ });
    expect(cta.getAttribute('href')).toBe('/auth/continue');
  });

  it('announces success politely rather than as an alert', () => {
    mocks.auth.user = CONFIRMED_USER;
    renderPage('/auth/confirmed?flow=signup');

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the loading state while authentication is still being resolved', () => {
    mocks.auth.isLoading = true;
    renderPage('/auth/confirmed?flow=signup');

    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-busy')).toBe('true');
    expect(screen.getAllByText('Zugang wird geprüft').length).toBeGreaterThan(0);
    // No false success while the session is unknown.
    expect(screen.queryByText('E-Mail erfolgreich bestätigt')).toBeNull();
    expect(screen.queryByRole('link', { name: /Zum Kundenportal/ })).toBeNull();
  });

  it('keeps waiting — without an error — until the bounded wait elapses', () => {
    vi.useFakeTimers();
    mocks.auth.user = null;
    renderPage('/auth/confirmed?flow=signup');

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');

    act(() => {
      vi.advanceTimersByTime(SESSION_RESOLUTION_TIMEOUT_MS + 10);
    });

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Keine gültige Sitzung gefunden');
    expect(screen.queryByText('E-Mail erfolgreich bestätigt')).toBeNull();
  });

  it('renders no marketing chrome', () => {
    mocks.auth.user = CONFIRMED_USER;
    const { container } = renderPage('/auth/confirmed?flow=signup');

    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

describe('error handling', () => {
  it('reports an expired or invalid link immediately, even while auth is loading', () => {
    mocks.auth.isLoading = true;
    renderPage('/auth/confirmed?flow=signup#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Bestätigungslink ungültig oder abgelaufen');
    // The provider's own description must never be rendered.
    expect(document.body.textContent).not.toContain('Email link is invalid');
    expect(document.body.textContent).not.toContain('otp_expired');
  });

  it('reports a network failure and offers retry plus support routes', async () => {
    mocks.auth.authTimedOut = true;
    renderPage('/auth/confirmed?flow=signup');

    expect(screen.getByRole('alert').textContent).toContain('Verbindung nicht möglich');

    fireEvent.click(screen.getByRole('button', { name: /Erneut versuchen/ }));
    await waitFor(() => expect(mocks.auth.retryAuth).toHaveBeenCalled());

    expect(screen.getByRole('link', { name: /Neue Einladung anfordern/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Support kontaktieren/ })).toBeTruthy();
  });
});

describe('invite flow', () => {
  it('asks for a password once the invitation session exists', () => {
    mocks.auth.user = CONFIRMED_USER;
    renderPage('/auth/confirmed?flow=invite');

    expect(screen.getAllByText('Einladung erfolgreich angenommen').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Legen Sie jetzt Ihr persönliches Passwort fest.').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Neues Passwort')).toBeTruthy();
    expect(screen.getByLabelText('Passwort bestätigen')).toBeTruthy();
  });

  it('does not show the password form before the session has resolved', () => {
    mocks.auth.isLoading = true;
    renderPage('/auth/confirmed?flow=invite');

    expect(screen.queryByLabelText('Neues Passwort')).toBeNull();
  });

  it('rejects a password shorter than 8 characters without calling Supabase', async () => {
    mocks.auth.user = CONFIRMED_USER;
    renderPage('/auth/confirmed?flow=invite');

    fireEvent.change(screen.getByLabelText('Neues Passwort'), { target: { value: 'short12' } });
    fireEvent.change(screen.getByLabelText('Passwort bestätigen'), { target: { value: 'short12' } });
    fireEvent.click(screen.getByRole('button', { name: /Passwort festlegen/ }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('mindestens 8 Zeichen');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('rejects a mismatched confirmation without calling Supabase', async () => {
    mocks.auth.user = CONFIRMED_USER;
    renderPage('/auth/confirmed?flow=invite');

    fireEvent.change(screen.getByLabelText('Neues Passwort'), { target: { value: 'correct-horse' } });
    fireEvent.change(screen.getByLabelText('Passwort bestätigen'), { target: { value: 'correct-hors' } });
    fireEvent.click(screen.getByRole('button', { name: /Passwort festlegen/ }));

    expect((await screen.findByRole('alert')).textContent).toContain('stimmen nicht überein');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('updates the authenticated user and then offers "Zugang öffnen" via /auth/continue', async () => {
    mocks.auth.user = CONFIRMED_USER;
    renderPage('/auth/confirmed?flow=invite');

    fireEvent.change(screen.getByLabelText('Neues Passwort'), { target: { value: 'correct-horse-1' } });
    fireEvent.change(screen.getByLabelText('Passwort bestätigen'), { target: { value: 'correct-horse-1' } });
    fireEvent.click(screen.getByRole('button', { name: /Passwort festlegen/ }));

    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'correct-horse-1' }));

    const cta = await screen.findByRole('link', { name: /Zugang öffnen/ });
    expect(cta.getAttribute('href')).toBe('/auth/continue');
    expect(screen.queryByLabelText('Neues Passwort')).toBeNull();
  });

  it('suppresses the raw Supabase message when the password update fails', async () => {
    mocks.auth.user = CONFIRMED_USER;
    const rawMessage = 'AuthApiError: New password should be different from the old password.';
    mocks.updateUser.mockResolvedValue({ error: { message: rawMessage } });

    renderPage('/auth/confirmed?flow=invite');
    fireEvent.change(screen.getByLabelText('Neues Passwort'), { target: { value: 'correct-horse-1' } });
    fireEvent.change(screen.getByLabelText('Passwort bestätigen'), { target: { value: 'correct-horse-1' } });
    fireEvent.click(screen.getByRole('button', { name: /Passwort festlegen/ }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Passwort konnte nicht gespeichert werden');
    expect(document.body.textContent).not.toContain(rawMessage);
    expect(document.body.textContent).not.toContain('AuthApiError');
    // No false success: the form stays available for another attempt.
    expect(screen.getByLabelText('Neues Passwort')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Zugang öffnen/ })).toBeNull();
  });

  it('suppresses a thrown network error during the password update', async () => {
    mocks.auth.user = CONFIRMED_USER;
    mocks.updateUser.mockRejectedValue(
      new Error('TypeError: Failed to fetch https://xyz.supabase.co/auth/v1/user')
    );

    renderPage('/auth/confirmed?flow=invite');
    fireEvent.change(screen.getByLabelText('Neues Passwort'), { target: { value: 'correct-horse-1' } });
    fireEvent.change(screen.getByLabelText('Passwort bestätigen'), { target: { value: 'correct-horse-1' } });
    fireEvent.click(screen.getByRole('button', { name: /Passwort festlegen/ }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Passwort konnte nicht gespeichert werden');
    expect(document.body.textContent).not.toContain('Failed to fetch');
    expect(document.body.textContent).not.toContain('supabase.co');
  });
});
