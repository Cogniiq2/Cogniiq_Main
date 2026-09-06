import { useRef, useState } from 'react';

import { productsByCategory } from '../../private-bar/catalog';
import { categoryLabel, strings } from '../../private-bar/strings';
import { useCart } from '../../private-bar/useCart';

import { PrivateBarShell } from './PrivateBarShell';
import { CheckoutBar } from './components/CheckoutBar';
import { GuestExperience } from './components/GuestExperience';
import { Overture } from './components/Overture';
import { ProductCard } from './components/ProductCard';
import { ReviewSheet } from './components/ReviewSheet';

/**
 * BoLaGio · Private Bar.
 *
 * The whole experience is one prerendered document: identity, catalogue,
 * selection, review, payment handoff and the Guest Experience preview. There is
 * no second route and no server round trip — the guest is handed to PayPal by a
 * link, and nothing here ever claims to know the outcome.
 *
 * SSR-safe: no component reads window, storage or matchMedia during render.
 */
export function PrivateBarPage() {
  const cart = useCart();
  const [sheetOpen, setSheetOpen] = useState(false);
  const barButtonRef = useRef<HTMLButtonElement>(null);
  const groups = productsByCategory();
  let rendered = 0;

  // The action surface exists only once something is selected, and only after
  // the persisted selection has loaded — so it slides in once, deliberately,
  // rather than flickering during hydration.
  const barVisible = cart.ready && cart.itemCount > 0;

  return (
    <PrivateBarShell title={strings.documentTitle} barVisible={barVisible}>
      <Overture />

      <header className="pb-page pb-header">
        <h1 className="pb-wordmark pb-enter pb-enter--1">{strings.brand.wordmark}</h1>
        <p className="pb-header__product pb-enter pb-enter--2">{strings.brand.product}</p>
        <div className="pb-header__rule pb-enter pb-enter--3" aria-hidden="true" />
      </header>

      <main id="pb-main" className="pb-page">
        <section className="pb-section pb-enter pb-enter--4" aria-labelledby="pb-intro-heading">
          <h2 id="pb-intro-heading" className="pb-display">
            {strings.intro.heading}
          </h2>
          <p className="pb-body pb-intro__body">{strings.intro.body}</p>
        </section>

        <section className="pb-section" aria-labelledby="pb-catalogue-heading">
          <div className="pb-section__head">
            <h2 id="pb-catalogue-heading" className="pb-eyebrow">
              {strings.catalogue.heading}
            </h2>
          </div>

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
                      quantity={cart.quantityOf(product.id)}
                      eager={eager}
                      onAdd={() => cart.add(product.id)}
                      onIncrease={() => cart.add(product.id)}
                      onDecrease={() => cart.subtract(product.id)}
                    />
                  );
                })}
              </ul>
            </div>
          ))}
        </section>

        <GuestExperience />

        <div className="pb-close">
          <div className="pb-close__rule" aria-hidden="true" />
          <p className="pb-close__mark">{strings.brand.wordmark}</p>
        </div>
      </main>

      {barVisible ? (
        <CheckoutBar
          itemCount={cart.itemCount}
          totalCents={cart.totalCents}
          onOpen={() => setSheetOpen(true)}
          buttonRef={barButtonRef}
        />
      ) : null}

      <ReviewSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        cart={cart}
        returnFocusRef={barButtonRef}
      />
    </PrivateBarShell>
  );
}
