// Rendered proof that unavailable upstream data stays unavailable on screen.
//
// The contract correction types 25 fields as `| null` because no granted column can supply them.
// That is a claim about the *data*; this file is the claim about the *pixels*. Every assertion below
// runs the real sections against the `source-absent` scenario — the shape a live gateway response
// actually has — and checks what a member of club staff would read.
//
// The failure this exists to catch is not a crash. It is a dashboard that quietly renders an unknown
// refund as `0,00 €`, an unlinkable member as `0` bookings, or an untracked voucher history as "not
// yet redeemed". Each of those is a confident statement about money or activity that nobody can
// actually make, and each is more damaging than an error state because it looks like an answer.
//
// So the assertions come in pairs wherever possible: the truthful rendering is present **and** the
// flattering substitute is absent.

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { createFixtureAdapter } from './adapter/fixtureAdapter';
import { ClubOperationsModule } from './ClubOperationsModule';
import { clubOperationsNavItems, type ClubOperationsSectionId } from './navigation';

function renderSourceAbsent(section: ClubOperationsSectionId) {
  return render(
    <ClubOperationsModule
      adapter={createFixtureAdapter({ scenario: 'source-absent' })}
      initialSection={section}
    />,
  );
}

/**
 * The card, tile or metric that carries `label`.
 *
 * Climbs from the label element until the ancestor holds more than the label itself, which is the
 * point at which the value and the hint have come into scope. Works for `Metric`, `PrimaryMetric`
 * and `MetricStrip` alike without depending on any of their class names.
 */
function tile(label: string): HTMLElement {
  // Several labels double as table column headers ("Erstattet" is both a metric and a column), so
  // header cells are excluded rather than the query being made vaguer.
  const candidates = screen.getAllByText(label).filter((element) => !element.closest('th'));
  let node: HTMLElement | null = candidates[0] ?? screen.getByText(label);
  while (node?.parentElement && node.textContent?.trim() === label) {
    node = node.parentElement;
  }
  return node as HTMLElement;
}

/**
 * A monetary zero, standing alone.
 *
 * The lookbehind matters: `1.380,00 €` contains the characters of `0,00 €` without being one, and a
 * naive substring check would pass or fail for the wrong reason.
 */
const STANDALONE_ZERO_EUROS = /(?<!\d)0,00\s*€/;
const STANDALONE_ZERO_PERCENT = /(?<!\d)0,0\s*%/;

/** Opens the first table row and returns the detail panel. */
async function openFirstRow(): Promise<HTMLElement> {
  const table = await screen.findByRole('table');
  await userEvent.click(within(table).getAllByRole('row')[1]);
  const close = await screen.findByRole('button', { name: 'Detailansicht schließen' });
  return close.closest('section') as HTMLElement;
}

/* ------------------------------------------------------------------- Payments */

describe('payments with no upstream refund amount, name or classification', () => {
  it('renders every unavailable money figure as an em dash and never as zero euros', async () => {
    const { container } = renderSourceAbsent('payments');
    await screen.findByRole('heading', { name: 'Zahlungen' });

    expect(tile('Erstattet').textContent).toContain('—');
    expect(tile('Verbleibt').textContent).toContain('—');

    // The strongest form of the assertion: nowhere in the whole section does a standalone zero
    // amount appear. Gross and pending are genuinely non-zero here, so any `0,00 €` would be a
    // substituted unknown rather than a real figure.
    expect(container.textContent).not.toMatch(STANDALONE_ZERO_EUROS);
  });

  it('renders unavailable counts as an em dash rather than zero', async () => {
    renderSourceAbsent('payments');
    await screen.findByRole('heading', { name: 'Zahlungen' });

    for (const label of ['Doppelbuchungen', 'Kundenstornierungen']) {
      const text = tile(label).textContent ?? '';
      expect(text, label).toContain('—');
      // "0 Vorgänge" or a bare 0 would claim the club had none of these.
      expect(text, label).not.toMatch(/(?<!\d)0(?!\d)/);
    }
  });

  it('labels an unclassifiable payment as such, never as a regular one', async () => {
    renderSourceAbsent('payments');
    await screen.findByRole('heading', { name: 'Zahlungen' });
    const panel = await openFirstRow();

    expect(within(panel).getByText('Nicht klassifiziert')).toBeInTheDocument();
    // "Regulär" is the label for a payment examined and found ordinary. This one was not examined.
    expect(within(panel).queryByText('Regulär')).toBeNull();
  });

  it('shows an unavailable customer name as an em dash, not an empty cell', async () => {
    renderSourceAbsent('payments');
    await screen.findByRole('heading', { name: 'Zahlungen' });
    const panel = await openFirstRow();

    const customerRow = within(panel).getByText('Kunde').parentElement as HTMLElement;
    expect(customerRow.textContent).toContain('—');
  });
});

/* ------------------------------------------------------------------- Vouchers */

describe('vouchers with no upstream expiry or redemption history', () => {
  it('renders the expired tally as unavailable rather than zero', async () => {
    renderSourceAbsent('vouchers');
    await screen.findByRole('heading', { name: 'Gutscheine' });

    const text = tile('Verfallen').textContent ?? '';
    expect(text).toContain('—');
    expect(text).not.toMatch(/(?<!\d)0(?!\d)/);
  });

  it('reports stranded voucher value as unknown rather than as none', async () => {
    renderSourceAbsent('vouchers');
    await screen.findByRole('heading', { name: 'Gutscheine' });

    // Value the club still owes on vouchers that lapsed unredeemed. Without an expiry date nothing
    // can be shown to have lapsed, and "0" would tell the treasurer there is no such exposure.
    const text = tile('Verfallen mit Restwert').textContent ?? '';
    expect(text).toContain('—');
    expect(text).not.toMatch(STANDALONE_ZERO_EUROS);
    expect(text).not.toMatch(/(?<!\d)0(?!\d)/);
  });

  it('states that redemptions are not recorded, rather than claiming none happened', async () => {
    renderSourceAbsent('vouchers');
    await screen.findByRole('heading', { name: 'Gutscheine' });
    const panel = await openFirstRow();

    expect(
      within(panel).getByText('Einlösungen werden im Vereinssystem nicht erfasst.'),
    ).toBeInTheDocument();
    // The populated wording asserts a fact about this voucher that an untracked history cannot support.
    expect(within(panel).queryByText('Dieser Gutschein wurde noch nicht eingelöst.')).toBeNull();
  });

  it('renders an unavailable expiry date as an em dash', async () => {
    renderSourceAbsent('vouchers');
    await screen.findByRole('heading', { name: 'Gutscheine' });
    const panel = await openFirstRow();

    const validUntil = within(panel).getByText('Gültig bis').parentElement as HTMLElement;
    expect(validUntil.textContent).toContain('—');
  });
});

/* -------------------------------------------------------------------- Members */

describe('members that cannot be linked to bookings', () => {
  it('renders no fabricated address, booking count or booking revenue', async () => {
    renderSourceAbsent('members');
    await screen.findByRole('heading', { name: 'Mitglieder' });
    const panel = await openFirstRow();

    for (const label of ['Ort', 'Anzahl', 'Umsatz']) {
      const row = within(panel).getByText(label).parentElement as HTMLElement;
      expect(row.textContent, label).toContain('—');
    }
  });

  it('reports members-wide booking revenue as unattributable instead of as zero', async () => {
    renderSourceAbsent('members');
    await screen.findByRole('heading', { name: 'Mitglieder' });

    const revenue = tile('Umsatz aus Mitgliederbuchungen');
    expect(revenue.textContent).toContain('—');
    expect(revenue.textContent).toContain('Buchungen nicht zuordenbar');
    // Summing an all-unlinkable register would print 0,00 € and read as "members spent nothing".
    expect(revenue.textContent).not.toMatch(STANDALONE_ZERO_EUROS);
  });
});

/* -------------------------------------------------------------------- Reports */

describe('the period report with no upstream refund amounts', () => {
  it('renders the refund share as unavailable rather than as nought percent', async () => {
    renderSourceAbsent('reports');
    await screen.findByRole('heading', { name: 'Berichte' });

    const refunds = tile('Erstattet gesamt');
    expect(refunds.textContent).toContain('—');
    expect(refunds.textContent).toContain('Anteil nicht verfügbar');
    expect(refunds.textContent).not.toMatch(STANDALONE_ZERO_PERCENT);
  });

  it('renders both refund reasons as unavailable', async () => {
    renderSourceAbsent('reports');
    await screen.findByRole('heading', { name: 'Berichte' });

    for (const label of ['Davon Stornierungen', 'Davon Doppelbuchungen']) {
      const text = tile(label).textContent ?? '';
      expect(text, label).toContain('—');
      expect(text, label).not.toMatch(STANDALONE_ZERO_EUROS);
    }
  });
});

/* ------------------------------------------------------------- Reconciliation */

describe('reconciliation with no upstream refund amounts', () => {
  it('renders the by-reason refund figures as unavailable', async () => {
    renderSourceAbsent('reconciliation');
    await screen.findByRole('heading', { name: 'Zahlungsabgleich' });

    for (const label of ['Stornierungen', 'Doppelbuchungen']) {
      const text = tile(label).textContent ?? '';
      expect(text, label).toContain('—');
      expect(text, label).not.toMatch(STANDALONE_ZERO_EUROS);
    }
  });

  it('reconciles nothing, and says so, when no payment can be examined', async () => {
    renderSourceAbsent('reconciliation');
    await screen.findByRole('heading', { name: 'Zahlungsabgleich' });

    // Not one row may be reported reconciled: every payment here is missing the refund amount and
    // the classification that a clean verdict rests on. Voucher purchases included — being a voucher
    // is not itself evidence of health.
    expect(tile('Abgeglichen').textContent).toMatch(/(?<!\d)0(?!\d)/);

    const table = await screen.findByRole('table');
    expect(within(table).queryByText('Abgeglichen')).toBeNull();
    expect(within(table).getAllByText('Prüfung erforderlich').length).toBeGreaterThan(0);
  });

  it('keeps the findings that remain decidable without refund data', async () => {
    renderSourceAbsent('reconciliation');
    await screen.findByRole('heading', { name: 'Zahlungsabgleich' });
    const table = await screen.findByRole('table');

    // The guard gates clean verdicts only. An orphaned payment and an amount mismatch are decided
    // from sourced values, and demoting them would discard a critical finding and the recoverable
    // money it identifies — a worse falsehood than the one being fixed.
    expect(within(table).getAllByText('Zahlung ohne Buchung').length).toBeGreaterThan(0);
    expect(within(table).getAllByText('Betragsabweichung').length).toBeGreaterThan(0);
    expect(tile('Potenziell nachzufordern').textContent).not.toMatch(STANDALONE_ZERO_EUROS);
  });

  it('renders an unavailable per-entry refund amount as an em dash', async () => {
    renderSourceAbsent('reconciliation');
    await screen.findByRole('heading', { name: 'Zahlungsabgleich' });
    const panel = await openFirstRow();

    const refunded = within(panel).getByText('Erstattet').parentElement as HTMLElement;
    expect(refunded.textContent).toContain('—');
  });
});

/* ------------------------------------------------------------------- Overview */

describe('the overview with no upstream refund amounts', () => {
  it('renders the refunded total as unavailable rather than zero', async () => {
    renderSourceAbsent('overview');
    await screen.findByRole('heading', { name: 'Übersicht' });

    const text = tile('Erstattet gesamt').textContent ?? '';
    expect(text).toContain('—');
    expect(text).not.toMatch(STANDALONE_ZERO_EUROS);
  });

  it('names the recoverable sum as identified rather than as the whole exposure', async () => {
    renderSourceAbsent('overview');
    await screen.findByRole('heading', { name: 'Übersicht' });

    // The figure is a floor: rows the classifier could not examine contribute nothing to it.
    expect(screen.getByText(/identifizierte Nachforderung/)).toBeInTheDocument();
  });
});

/* ---------------------------------------------------------------------- Smoke */

describe('the complete source-absent dataset renders', () => {
  it.each(clubOperationsNavItems.map((item) => [item.id, item.label] as const))(
    '%s renders its heading and no error state',
    async (id, label) => {
      renderSourceAbsent(id);
      await screen.findByRole('heading', { name: label });

      // An unavailable field is a *successful* response carrying less information, not a failure —
      // so no section may fall back to its error state, and none may throw on the way to the DOM.
      expect(screen.queryByRole('alert')).toBeNull();
    },
  );

  // A blanket "no 0,00 € anywhere" scan was tried and is wrong: a VAT-exempt tennis category and an
  // unresolved-padel category both carry a genuine 0,00 € of tax, and an empty day in the overview's
  // trend genuinely earned nothing. Those are facts, not substitutions. The zero checks therefore sit
  // on the specific tiles whose underlying field is known to be unavailable, above.

  it('keeps the stored monthly refund figures as real numbers', async () => {
    // The contrast that makes the whole contract legible: `admin_monthly_reports.refunded_amount` is
    // granted, so this figure survives where the live per-payment derivation does not.
    renderSourceAbsent('monthly-reports');
    await screen.findByRole('heading', { name: 'Monatsberichte' });

    const refunded = tile('Erstattet');
    expect(refunded.textContent).toMatch(/\d/);
    expect(refunded.textContent).not.toContain('—');
  });
});
