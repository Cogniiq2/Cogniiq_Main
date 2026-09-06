import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A small fixture catalogue keeps the interaction tests independent of the live
// price list; everything else under test — cart, stock ceilings, confirmation,
// payment handoff — is the real implementation.
vi.mock('@/private-bar/catalog', async () => {
  const actual = await vi.importActual<typeof import('@/private-bar/catalog')>('@/private-bar/catalog');
  const make = (
    id: string,
    name: string,
    category: 'sparkling' | 'wine' | 'beer' | 'water',
    priceCents: number,
    sortOrder: number
  ) => ({
    id,
    name,
    shortLabel: name,
    category,
    origin: null,
    volume: null,
    priceCents,
    image: null,
    available: true,
    sortOrder,
  });
  const catalogue = [
    make('fixture-prosecco', 'Fixture Prosecco', 'sparkling', 1290, 10),
    make('fixture-wine', 'Fixture Wine', 'wine', 2400, 20),
    make('fixture-beer', 'Fixture Beer', 'beer', 360, 30),
  ];
  return {
    ...actual,
    PRIVATE_BAR_CATALOG: catalogue,
    productById: (id: string) => catalogue.find((p) => p.id === id),
    availableProducts: () => catalogue,
    productsByCategory: () => [
      { category: 'sparkling' as const, products: [catalogue[0]] },
      { category: 'wine' as const, products: [catalogue[1]] },
      { category: 'beer' as const, products: [catalogue[2]] },
    ],
  };
});

const { PrivateBarPage } = await import('./PrivateBarPage');
const { strings } = await import('@/private-bar/strings');
const { PAYPAL_PAYMENT_URL } = await import('@/private-bar/config');

const PROSECCO = 'fixture-prosecco';
const BEER = 'fixture-beer';

interface Recorded {
  url: string;
  body: unknown;
}

let recorded: Recorded[] = [];

/** Stands in for our own two endpoints. */
function stubApi(options: {
  stock?: Record<string, number>;
  inventoryFails?: boolean;
  confirm?: (body: Record<string, unknown>) => Response;
}) {
  const stock = options.stock ?? { [PROSECCO]: 5, 'fixture-wine': 5, [BEER]: 5 };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      recorded.push({ url, body });

      if (url.includes('/api/private-bar/inventory')) {
        if (options.inventoryFails) return new Response('nope', { status: 502 });
        return new Response(JSON.stringify({ apartmentId: 'a', stock }), { status: 200 });
      }
      if (url.includes('/api/private-bar/confirm-order')) {
        if (options.confirm) return options.confirm(body as Record<string, unknown>);
        const items = (body as { items: { productId: string; quantity: number }[] }).items;
        const priced = items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitAmountCents: item.productId === PROSECCO ? 1290 : 360,
          amountCents: (item.productId === PROSECCO ? 1290 : 360) * item.quantity,
        }));
        return new Response(
          JSON.stringify({
            orderId: 'order-1',
            clientOrderId: (body as { clientOrderId: string }).clientOrderId,
            totalCents: priced.reduce((sum, i) => sum + i.amountCents, 0),
            currency: 'EUR',
            status: 'awaiting_payment',
            items: priced,
            stock,
          }),
          { status: 200 }
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    })
  );
}

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
const bar = () => screen.findByRole('button', { name: new RegExp(strings.bar.ariaLabel) });

/** Waits for inventory to arrive, which is what enables the add controls. */
async function waitForInventory() {
  await screen.findByRole('heading', { level: 1 });
  await waitFor(() => expect(addButton('Fixture Prosecco')).toBeEnabled());
}

beforeEach(() => {
  recorded = [];
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('live inventory', () => {
  it('offers nothing until stock is known, then enables what is in the apartment', async () => {
    stubApi({ stock: { [PROSECCO]: 2, 'fixture-wine': 0, [BEER]: 1 } });
    renderPage();
    await waitForInventory();

    expect(addButton('Fixture Prosecco')).toBeInTheDocument();
    // Sold out: shown, priced, and not orderable.
    expect(screen.queryByRole('button', { name: strings.catalogue.addAria('Fixture Wine') })).toBeNull();
    expect(screen.getAllByText(strings.catalogue.unavailable).length).toBe(1);
  });

  it('caps the quantity at one for the last bottle', async () => {
    const user = userEvent.setup();
    stubApi({ stock: { [PROSECCO]: 1, 'fixture-wine': 5, [BEER]: 5 } });
    renderPage();
    await waitForInventory();

    await user.click(addButton('Fixture Prosecco'));
    expect(plusButton('Fixture Prosecco')).toBeDisabled();
    await user.click(plusButton('Fixture Prosecco'));
    expect(within(await bar()).getByText('1 Artikel')).toBeInTheDocument();
  });

  it('caps the quantity at the available count', async () => {
    const user = userEvent.setup();
    stubApi({ stock: { [PROSECCO]: 3, 'fixture-wine': 5, [BEER]: 5 } });
    renderPage();
    await waitForInventory();

    await user.click(addButton('Fixture Prosecco'));
    await user.click(plusButton('Fixture Prosecco'));
    await user.click(plusButton('Fixture Prosecco'));
    expect(plusButton('Fixture Prosecco')).toBeDisabled();
    expect(within(await bar()).getByText('3 Artikel')).toBeInTheDocument();
  });

  it('trims a stored selection when stock has fallen since', async () => {
    window.localStorage.setItem(
      'bolagio:private-bar:cart:v1',
      JSON.stringify([{ productId: PROSECCO, quantity: 4 }])
    );
    stubApi({ stock: { [PROSECCO]: 1, 'fixture-wine': 5, [BEER]: 5 } });
    renderPage();
    // The product stays selected (at the reduced quantity), so the add control
    // never returns — the action surface is what reports the trim.
    expect(within(await bar()).getByText('1 Artikel')).toBeInTheDocument();
  });

  it('says so calmly when inventory cannot be loaded, and offers a retry', async () => {
    stubApi({ inventoryFails: true });
    renderPage();
    expect(await screen.findByText(strings.errors.inventoryUnavailable)).toBeInTheDocument();
    // Fails closed: nothing can be selected while availability is unknown.
    expect(screen.queryByRole('button', { name: strings.catalogue.addAria('Fixture Prosecco') })).toBeNull();
    expect(screen.getByRole('button', { name: strings.errors.retry })).toBeInTheDocument();
  });
});

describe('confirmation', () => {
  async function openSheet(user: ReturnType<typeof userEvent.setup>) {
    await user.click(addButton('Fixture Prosecco'));
    await user.click(await bar());
    return screen.findByRole('dialog');
  }

  it('sends only ids and quantities — never a price or a total', async () => {
    const user = userEvent.setup();
    stubApi({});
    renderPage();
    await waitForInventory();
    const dialog = await openSheet(user);

    await user.click(within(dialog).getByRole('button', { name: strings.payment.confirmCta }));
    await waitFor(() => expect(recorded.some((r) => r.url.includes('confirm-order'))).toBe(true));

    const sent = recorded.find((r) => r.url.includes('confirm-order'))!.body as Record<string, unknown>;
    expect(sent.items).toEqual([{ productId: PROSECCO, quantity: 1 }]);
    expect(JSON.stringify(sent)).not.toMatch(/total|price|amount/i);
    expect(typeof sent.clientOrderId).toBe('string');
  });

  it('moves to the payment step, freezes the order and empties the selection', async () => {
    const user = userEvent.setup();
    stubApi({});
    renderPage();
    await waitForInventory();
    const dialog = await openSheet(user);
    await user.click(within(dialog).getByRole('button', { name: strings.payment.confirmCta }));

    expect(await within(dialog).findByText(strings.payment.confirmedNote)).toBeInTheDocument();
    // The confirmed order is a record now: no quantity controls remain.
    expect(within(dialog).queryByRole('button', { name: /eine Einheit/ })).toBeNull();
    expect(within(dialog).getByRole('link', { name: strings.payment.paypal })).toBeInTheDocument();
    expect(window.localStorage.getItem('bolagio:private-bar:cart:v1')).toBeNull();
    expect(window.localStorage.getItem('bolagio:private-bar:order:v1')).toContain('order-1');
  });

  it('reuses one idempotency key across a retry, so stock cannot be taken twice', async () => {
    const user = userEvent.setup();
    let attempt = 0;
    stubApi({
      confirm: (body) => {
        attempt += 1;
        if (attempt === 1) return new Response('boom', { status: 500 });
        return new Response(
          JSON.stringify({
            orderId: 'order-1',
            clientOrderId: body.clientOrderId,
            totalCents: 1290,
            currency: 'EUR',
            status: 'awaiting_payment',
            items: [{ productId: PROSECCO, quantity: 1, unitAmountCents: 1290, amountCents: 1290 }],
            stock: { [PROSECCO]: 4 },
          }),
          { status: 200 }
        );
      },
    });
    renderPage();
    await waitForInventory();
    const dialog = await openSheet(user);

    await user.click(within(dialog).getByRole('button', { name: strings.payment.confirmCta }));
    expect(await within(dialog).findByText(strings.errors.confirmFailed)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: strings.payment.confirmCta }));
    await within(dialog).findByText(strings.payment.confirmedNote);

    const ids = recorded
      .filter((r) => r.url.includes('confirm-order'))
      .map((r) => (r.body as { clientOrderId: string }).clientOrderId);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
  });

  it('reconciles the selection when stock changed under it, without decrementing', async () => {
    const user = userEvent.setup();
    stubApi({
      stock: { [PROSECCO]: 2, 'fixture-wine': 5, [BEER]: 5 },
      confirm: () =>
        new Response(JSON.stringify({ error: 'out_of_stock', stock: { [PROSECCO]: 0 } }), { status: 409 }),
    });
    renderPage();
    await waitForInventory();
    const dialog = await openSheet(user);

    await user.click(within(dialog).getByRole('button', { name: strings.payment.confirmCta }));
    expect(await within(dialog).findByText(strings.errors.stockChanged)).toBeInTheDocument();
    // Nothing was confirmed, and the selection now matches reality.
    expect(within(dialog).queryByText(strings.payment.confirmedNote)).toBeNull();
    expect(await within(dialog).findByText(strings.sheet.emptyHeading)).toBeInTheDocument();
  });

  it('restores a confirmed order after a reload instead of creating a second one', async () => {
    const user = userEvent.setup();
    stubApi({});
    const first = renderPage();
    await waitForInventory();
    const dialog = await openSheet(user);
    await user.click(within(dialog).getByRole('button', { name: strings.payment.confirmCta }));
    await within(dialog).findByText(strings.payment.confirmedNote);
    first.unmount();

    recorded = [];
    renderPage();
    const reopened = await screen.findByRole('button', {
      name: new RegExp(strings.bar.ariaLabelConfirmed),
    });
    expect(within(reopened).getByText(strings.bar.openAmount)).toBeInTheDocument();
    expect(recorded.some((r) => r.url.includes('confirm-order'))).toBe(false);
  });

  it('starts a fresh order only when the guest asks for one', async () => {
    const user = userEvent.setup();
    stubApi({});
    renderPage();
    await waitForInventory();
    const dialog = await openSheet(user);
    await user.click(within(dialog).getByRole('button', { name: strings.payment.confirmCta }));
    await within(dialog).findByText(strings.payment.confirmedNote);

    await user.click(within(dialog).getByRole('button', { name: strings.payment.newSelection }));
    expect(await within(dialog).findByText(strings.sheet.emptyHeading)).toBeInTheDocument();
    expect(window.localStorage.getItem('bolagio:private-bar:order:v1')).toBeNull();
  });
});

describe('payment handoff', () => {
  async function confirmAndOpenPayment(user: ReturnType<typeof userEvent.setup>) {
    await user.click(addButton('Fixture Prosecco'));
    await user.click(await bar());
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: strings.payment.confirmCta }));
    await within(dialog).findByText(strings.payment.confirmedNote);
    return dialog;
  }

  it('opens the exact configured PayPal link, with nothing appended', async () => {
    const user = userEvent.setup();
    stubApi({});
    renderPage();
    await waitForInventory();
    const dialog = await confirmAndOpenPayment(user);

    const link = within(dialog).getByRole('link', { name: strings.payment.paypal });
    expect(link).toHaveAttribute('href', 'https://www.paypal.com/ncp/payment/G6BPUTG3WZQEE');
    expect(link).toHaveAttribute('href', PAYPAL_PAYMENT_URL);
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('copies the plain German amount and acknowledges it in place', async () => {
    const user = userEvent.setup();
    stubApi({});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderPage();
    await waitForInventory();
    const dialog = await confirmAndOpenPayment(user);

    await user.click(within(dialog).getByRole('button', { name: /Betrag/ }));
    await expect(navigator.clipboard.readText()).resolves.toBe('12,90');
    expect(await within(dialog).findByText(strings.payment.copied)).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('keeps the confirmed order after PayPal is opened and claims nothing about payment', async () => {
    const user = userEvent.setup();
    stubApi({});
    renderPage();
    await waitForInventory();
    const dialog = await confirmAndOpenPayment(user);

    const link = within(dialog).getByRole('link', { name: strings.payment.paypal });
    // jsdom cannot navigate; the click handler is what the interface reacts to.
    link.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(await within(dialog).findByText(strings.payment.handedOff)).toBeInTheDocument();
    expect(window.localStorage.getItem('bolagio:private-bar:order:v1')).toContain('order-1');

    const text = `${document.body.textContent ?? ''}`;
    for (const forbidden of [
      /zahlung (erhalten|bestätigt|eingegangen|erfolgreich)/i,
      /erfolgreich bezahlt/i,
      /payment (confirmed|received|successful)/i,
    ]) {
      expect(text).not.toMatch(forbidden);
    }
  });

  it('closes on Escape and returns focus to the control that opened it', async () => {
    const user = userEvent.setup();
    stubApi({});
    renderPage();
    await waitForInventory();
    await user.click(addButton('Fixture Prosecco'));
    await user.click(await bar());
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(async () => expect(document.activeElement).toBe(await bar()));
  });

  it('returns a product to its unselected state at quantity zero', async () => {
    const user = userEvent.setup();
    stubApi({});
    renderPage();
    await waitForInventory();

    await user.click(addButton('Fixture Beer'));
    await user.click(minusButton('Fixture Beer'));
    expect(addButton('Fixture Beer')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: new RegExp(strings.bar.ariaLabel) })).toBeNull()
    );
  });
});
