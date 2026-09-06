import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The live catalogue carries no configured prices yet, so nothing in it can be
// ordered — by design. The selection experience is therefore exercised against
// a priced fixture catalogue; every other module under test is the real one.
vi.mock('@/private-bar/catalog', async () => {
  const actual = await vi.importActual<typeof import('@/private-bar/catalog')>('@/private-bar/catalog');
  const catalogue = [
    {
      id: 'fixture-prosecco',
      name: 'Fixture Prosecco',
      shortLabel: 'Fixture Prosecco',
      category: 'sparkling' as const,
      origin: null,
      volume: null,
      priceCents: 1290,
      image: null,
      available: true,
      sortOrder: 10,
    },
    {
      id: 'fixture-beer',
      name: 'Fixture Beer',
      shortLabel: 'Fixture Beer',
      category: 'beer' as const,
      origin: null,
      volume: null,
      priceCents: 360,
      image: null,
      available: true,
      sortOrder: 20,
    },
    {
      id: 'fixture-unpriced',
      name: 'Fixture Unpriced',
      shortLabel: 'Fixture Unpriced',
      category: 'wine' as const,
      origin: null,
      volume: null,
      priceCents: null,
      image: null,
      available: true,
      sortOrder: 30,
    },
  ];
  return {
    ...actual,
    PRIVATE_BAR_CATALOG: catalogue,
    productById: (id: string) => catalogue.find((p) => p.id === id),
    availableProducts: () => catalogue,
    productsByCategory: () => [
      { category: 'sparkling' as const, products: [catalogue[0]] },
      { category: 'wine' as const, products: [catalogue[2]] },
      { category: 'beer' as const, products: [catalogue[1]] },
    ],
  };
});

const { PrivateBarPage } = await import('./PrivateBarPage');
const { CART_STORAGE_KEY } = await import('@/private-bar/cart');
const { strings } = await import('@/private-bar/strings');

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/private-bar']}>
      <PrivateBarPage />
    </MemoryRouter>
  );
}

const addButton = (name: string) => screen.getByRole('button', { name: strings.catalogue.addAria(name) });
const plusButton = (name: string) => screen.getByRole('button', { name: strings.catalogue.increaseAria(name) });
const minusButton = (name: string) => screen.getByRole('button', { name: strings.catalogue.decreaseAria(name) });

beforeEach(() => {
  window.localStorage.clear();
});

describe('selection', () => {
  it('adds a product and reveals the action surface with the running total', async () => {
    const user = userEvent.setup();
    renderPage();

    // Nothing selected: no action surface at all.
    expect(screen.queryByRole('button', { name: strings.bar.ariaLabel })).toBeNull();

    await user.click(addButton('Fixture Prosecco'));

    const bar = await screen.findByRole('button', { name: strings.bar.ariaLabel });
    expect(within(bar).getByText('1 Artikel')).toBeInTheDocument();
    expect(within(bar).getByText(/12,90/)).toBeInTheDocument();
  });

  it('replaces the add affordance with a quantity control and totals in integer cents', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(addButton('Fixture Prosecco'));
    await user.click(plusButton('Fixture Prosecco'));
    await user.click(addButton('Fixture Beer'));

    const bar = await screen.findByRole('button', { name: strings.bar.ariaLabel });
    // 2 × 12,90 + 1 × 3,60 = 29,40
    expect(within(bar).getByText('3 Artikel')).toBeInTheDocument();
    expect(within(bar).getByText(/29,40/)).toBeInTheDocument();
  });

  it('returns a product to its unselected state at quantity zero', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(addButton('Fixture Prosecco'));
    await user.click(minusButton('Fixture Prosecco'));

    expect(addButton('Fixture Prosecco')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: strings.bar.ariaLabel })).toBeNull()
    );
  });

  it('offers no way to order a product without a configured price', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: strings.catalogue.addAria('Fixture Unpriced') })).toBeNull();
    expect(screen.getByText(strings.catalogue.priceUnconfigured)).toBeInTheDocument();
  });

  it('persists the selection and restores it on the next visit', async () => {
    const user = userEvent.setup();
    const first = renderPage();
    await user.click(addButton('Fixture Prosecco'));
    await waitFor(() =>
      expect(window.localStorage.getItem(CART_STORAGE_KEY)).toContain('fixture-prosecco')
    );
    first.unmount();

    renderPage();
    const bar = await screen.findByRole('button', { name: strings.bar.ariaLabel });
    expect(within(bar).getByText('1 Artikel')).toBeInTheDocument();
  });

  it('ignores a corrupted stored selection instead of failing to render', async () => {
    window.localStorage.setItem(CART_STORAGE_KEY, '{"lines":"broken"');
    renderPage();
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: strings.bar.ariaLabel })).toBeNull();
  });
});

describe('review sheet', () => {
  async function openSheet(user: ReturnType<typeof userEvent.setup>) {
    await user.click(addButton('Fixture Prosecco'));
    await user.click(await screen.findByRole('button', { name: strings.bar.ariaLabel }));
    return screen.findByRole('dialog');
  }

  it('opens with the selection, the total and the payment section', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openSheet(user);

    expect(within(dialog).getByText(strings.sheet.title)).toBeInTheDocument();
    expect(within(dialog).getByText('Fixture Prosecco')).toBeInTheDocument();
    expect(within(dialog).getByText(strings.sheet.totalLabel)).toBeInTheDocument();
    expect(within(dialog).getAllByText(/12,90/).length).toBeGreaterThan(0);
    expect(within(dialog).getByText(strings.payment.heading)).toBeInTheDocument();
  });

  it('edits quantities from inside the sheet', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openSheet(user);

    await user.click(within(dialog).getByRole('button', { name: strings.catalogue.increaseAria('Fixture Prosecco') }));
    await waitFor(() => expect(within(dialog).getAllByText(/25,80/).length).toBeGreaterThan(0));
  });

  it('empties to a designed state rather than a blank panel', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openSheet(user);

    await user.click(within(dialog).getByRole('button', { name: strings.catalogue.decreaseAria('Fixture Prosecco') }));
    expect(await within(dialog).findByText(strings.sheet.emptyHeading)).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the control that opened it', async () => {
    const user = userEvent.setup();
    renderPage();
    await openSheet(user);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    // Radix restores focus after the close transition, so this settles a tick later.
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: strings.bar.ariaLabel }))
    );
  });

  it('clears the selection only when the guest asks for it', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openSheet(user);

    await user.click(within(dialog).getByRole('button', { name: strings.sheet.clear }));
    expect(await within(dialog).findByText(strings.sheet.emptyHeading)).toBeInTheDocument();
    await waitFor(() => expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBeNull());
  });
});

describe('payment handoff', () => {
  it('keeps the PayPal control disabled while no link is configured', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(addButton('Fixture Prosecco'));
    await user.click(await screen.findByRole('button', { name: strings.bar.ariaLabel }));
    const dialog = await screen.findByRole('dialog');

    const paypal = within(dialog).getByRole('button', { name: strings.payment.paypal });
    expect(paypal).toBeDisabled();
    expect(within(dialog).queryByRole('link', { name: strings.payment.paypal })).toBeNull();
    expect(within(dialog).getByText(strings.payment.paypalUnavailable)).toBeInTheDocument();
    // Never a placeholder destination.
    expect(dialog.querySelector('a[href]')).toBeNull();
  });

  it('copies the plain amount and acknowledges it in place, without a browser dialog', async () => {
    // user-event installs its own clipboard stub, which is the one the component
    // will reach — so the assertion reads back from it rather than from a spy.
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const user = userEvent.setup();
    renderPage();
    await user.click(addButton('Fixture Prosecco'));
    await user.click(await screen.findByRole('button', { name: strings.bar.ariaLabel }));
    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: /Betrag/ }));
    await expect(navigator.clipboard.readText()).resolves.toBe('12,90');
    expect(await within(dialog).findByText(strings.payment.copied)).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('never claims that a payment happened', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await user.click(addButton('Fixture Prosecco'));
    await user.click(await screen.findByRole('button', { name: strings.bar.ariaLabel }));
    await screen.findByRole('dialog');

    const text = `${container.textContent ?? ''}${document.body.textContent ?? ''}`;
    for (const forbidden of [
      /zahlung (erhalten|bestätigt|eingegangen)/i,
      /erfolgreich bezahlt/i,
      /payment (confirmed|received)/i,
      /bezahlt\b(?!en)/i,
    ]) {
      expect(text).not.toMatch(forbidden);
    }
  });
});
