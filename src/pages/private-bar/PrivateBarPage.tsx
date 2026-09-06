import { PrivateBarShell } from './PrivateBarShell';
import { Overture } from './components/Overture';
import { ProductCard } from './components/ProductCard';
import { productsByCategory } from '../../private-bar/catalog';
import { categoryLabel, strings } from '../../private-bar/strings';

/**
 * BoLaGio · Private Bar — the catalogue.
 *
 * Phase A: identity, hospitality note and the curated catalogue. Selection,
 * cart and payment are Phase B/C and are deliberately absent rather than
 * mocked — there is no inert "pay" control anywhere on this surface.
 *
 * SSR-safe: nothing here reads window, localStorage or matchMedia during
 * render, because every one of these routes is prerendered at build time.
 */
export function PrivateBarPage() {
  const groups = productsByCategory();
  let rendered = 0;

  return (
    <PrivateBarShell title={strings.documentTitles.bar}>
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
                  // fetched eagerly; everything below waits.
                  const eager = rendered < 4;
                  rendered += 1;
                  return <ProductCard key={product.id} product={product} eager={eager} />;
                })}
              </ul>
            </div>
          ))}
        </section>

        <div className="pb-close">
          <div className="pb-close__rule" aria-hidden="true" />
          <p className="pb-close__mark">{strings.brand.wordmark}</p>
        </div>
      </main>
    </PrivateBarShell>
  );
}
