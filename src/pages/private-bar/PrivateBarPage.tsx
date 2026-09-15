import { useCallback, useEffect, useRef, useState } from 'react';

import type { ApartmentKey } from '../../private-bar/apartments';
import { productsByCategory } from '../../private-bar/catalog';
import { categoryLabel, strings } from '../../private-bar/strings';
import { useApartmentSelection } from '../../private-bar/useApartment';
import { usePrivateBar } from '../../private-bar/usePrivateBar';

import { PrivateBarShell } from './PrivateBarShell';
import { ApartmentContext } from './components/ApartmentContext';
import { ApartmentGate } from './components/ApartmentGate';
import { ApartmentSwitchDialog } from './components/ApartmentSwitchDialog';
import { CheckoutBar } from './components/CheckoutBar';
import { GuestExperience } from './components/GuestExperience';
import { Overture } from './components/Overture';
import { ProductCard } from './components/ProductCard';
import { ReviewSheet } from './components/ReviewSheet';

/**
 * How long the gate is given to hand over to the catalogue.
 *
 * The chosen card commits, the gate lifts away, and only then does the
 * apartment actually change — so the guest sees one continuous movement into
 * their bar rather than a cut. It is kept in step with the .pb-gate.is-leaving
 * animation in private-bar.css; changing one means changing the other.
 */
const GATE_HANDOFF_MS = 360;

/** The mirror of that, on the way back to the gate. */
const CATALOGUE_LEAVE_MS = 220;

/** Motion is a courtesy, never a gate. A guest who asked for less gets the
 *  same destination immediately, with no timer in between. */
function prefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

/**
 * BoLaGio · Private Bar.
 *
 * One prerendered document serving BOTH apartments: identity, apartment
 * selection, the selected apartment's catalogue, selection, confirmation,
 * PayPal handoff and the Guest Experience preview. Stock is live, shared and
 * per-apartment (Supabase, behind a Cloudflare Function); payment happens
 * entirely in PayPal, so nothing here ever claims to know whether it succeeded.
 *
 * The apartment is the FIRST thing established. Until it is, no product is
 * rendered — showing one apartment's bottles to a guest in the other would be
 * wrong before it was ever confirmed.
 *
 * SSR-safe: no component reads window, storage or the network during render.
 */
export function PrivateBarPage() {
  const selection = useApartmentSelection();
  const bar = usePrivateBar(selection.apartment);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const barButtonRef = useRef<HTMLButtonElement>(null);

  // Purely presentational: which card the guest committed to while the gate is
  // still on screen, and whether the catalogue is on its way out. Neither is
  // read by the cart, the pricing or the order — they only drive the handoff.
  const [committing, setCommitting] = useState<ApartmentKey | null>(null);
  const [leavingCatalogue, setLeavingCatalogue] = useState(false);
  const handoff = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** True when this catalogue was reached through the gate just now, which is
   *  what earns it the quick entrance rather than the overture-paced one. */
  const fromGate = useRef(false);
  /** The mirror: the gate is being returned to, so it must not wait for an
   *  overture that finished long ago. */
  const backToGate = useRef(false);

  useEffect(
    () => () => {
      if (handoff.current) clearTimeout(handoff.current);
    },
    []
  );

  const apartment = selection.apartment;
  const groups = apartment ? productsByCategory(apartment) : [];
  let rendered = 0;

  // The action surface exists once something is selected — or once an order is
  // confirmed and only the payment is outstanding. It waits for the persisted
  // state to load so it slides in once, deliberately, rather than flickering.
  const confirmed = bar.confirmedOrder;
  const barVisible = apartment !== null && bar.ready && (confirmed !== null || bar.itemCount > 0);

  // A cart belongs to one apartment. With something selected the guest is asked
  // first; with an empty selection there is nothing to lose, so the switch is
  // immediate. Either way the cart is never carried across.
  const requestApartmentChange = () => {
    if (bar.itemCount > 0) {
      setSwitchOpen(true);
      return;
    }
    leaveApartment();
  };

  const leaveApartment = useCallback(() => {
    setSwitchOpen(false);
    setSheetOpen(false);
    fromGate.current = false;
    backToGate.current = true;
    // The selection is dropped IMMEDIATELY. Only the picture waits: a cart must
    // never outlive the decision to leave, however long the animation runs.
    bar.clear();

    if (prefersReducedMotion()) {
      selection.clear();
      return;
    }
    setLeavingCatalogue(true);
    if (handoff.current) clearTimeout(handoff.current);
    handoff.current = setTimeout(() => {
      setLeavingCatalogue(false);
      selection.clear();
    }, CATALOGUE_LEAVE_MS);
  }, [bar, selection]);

  const chooseApartment = useCallback(
    (next: ApartmentKey) => {
      if (committing) return; // one commit at a time: a second tap changes nothing
      setSheetOpen(false);
      fromGate.current = true;

      if (prefersReducedMotion()) {
        selection.select(next);
        return;
      }
      setCommitting(next);
      if (handoff.current) clearTimeout(handoff.current);
      handoff.current = setTimeout(() => {
        selection.select(next);
        setCommitting(null);
      }, GATE_HANDOFF_MS);
    },
    [committing, selection]
  );

  return (
    <PrivateBarShell title={strings.documentTitle} barVisible={barVisible}>
      <Overture />

      <header className="pb-page pb-header">
        <h1 className="pb-wordmark pb-enter pb-enter--1">{strings.brand.wordmark}</h1>
        <p className="pb-header__product pb-enter pb-enter--2">{strings.brand.product}</p>
        <div className="pb-header__rule pb-enter pb-enter--3" aria-hidden="true" />
      </header>

      <main id="pb-main" className="pb-page">
        {/* No product exists until the apartment is known — and an unanswered
            gate is the correct default, so it is what the prerendered document
            carries. A remembered apartment replaces it before paint (see
            useApartmentSelection), not after. */}
        {apartment === null ? (
          <ApartmentGate
            onSelect={chooseApartment}
            committing={committing}
            quick={backToGate.current}
          />
        ) : (
          <div
            className={[
              'pb-catalogue',
              // The quick entrance is earned by having just come through the
              // gate. A remembered apartment keeps the overture-paced one, so
              // a reload still feels like the page opening rather than a jump.
              fromGate.current ? 'pb-catalogue--handoff' : '',
              leavingCatalogue ? 'is-leaving' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <section className="pb-section pb-enter pb-enter--4" aria-labelledby="pb-intro-heading">
              <h2 id="pb-intro-heading" className="pb-display">
                {strings.intro.heading}
              </h2>
              <p className="pb-body pb-intro__body">{strings.intro.body}</p>
              <ApartmentContext apartment={apartment} onChange={requestApartmentChange} />
            </section>

            <section className="pb-section pb-enter pb-enter--5" aria-labelledby="pb-catalogue-heading">
              <div className="pb-section__head">
                <h2 id="pb-catalogue-heading" className="pb-eyebrow">
                  {strings.catalogue.heading}
                </h2>
              </div>

              {/* Inventory is what decides whether anything can be taken, so its
                  absence is stated once, calmly, instead of leaving every product
                  silently unavailable. */}
              {bar.inventoryStatus === 'error' ? (
                <div className="pb-notice pb-notice--block" role="status">
                  <span>{strings.errors.inventoryUnavailable}</span>
                  <button type="button" className="pb-notice__action" onClick={bar.reloadInventory}>
                    {strings.errors.retry}
                  </button>
                </div>
              ) : null}

              {groups.map((group) => (
                <div key={group.category} className="pb-group">
                  <div className="pb-section__head pb-group__head">
                    <h3 className="pb-meta">{categoryLabel(group.category)}</h3>
                  </div>
                  <ul className="pb-grid">
                    {group.products.map((product) => {
                      // The first four frames are above the fold on a phone and are
                      // fetched eagerly; everything below waits for the scroll.
                      const eager = rendered < 4;
                      rendered += 1;
                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          quantity={bar.quantityOf(product.id)}
                          available={bar.availableFor(product.id)}
                          eager={eager}
                          onAdd={() => bar.add(product.id)}
                          onIncrease={() => bar.add(product.id)}
                          onDecrease={() => bar.subtract(product.id)}
                        />
                      );
                    })}
                  </ul>
                </div>
              ))}
            </section>

            <GuestExperience />
          </div>
        )}

        <div className="pb-close">
          <div className="pb-close__rule" aria-hidden="true" />
          <p className="pb-close__mark">{strings.brand.wordmark}</p>
        </div>
      </main>

      {barVisible ? (
        <CheckoutBar
          itemCount={bar.itemCount}
          totalCents={confirmed ? confirmed.totalCents : bar.totalCents}
          confirmed={confirmed !== null}
          onOpen={() => setSheetOpen(true)}
          buttonRef={barButtonRef}
        />
      ) : null}

      <ReviewSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        bar={bar}
        returnFocusRef={barButtonRef}
      />

      {apartment !== null ? (
        <ApartmentSwitchDialog
          open={switchOpen}
          onOpenChange={setSwitchOpen}
          apartment={apartment}
          onConfirm={leaveApartment}
        />
      ) : null}
    </PrivateBarShell>
  );
}
