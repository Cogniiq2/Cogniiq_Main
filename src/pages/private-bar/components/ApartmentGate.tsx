import { APARTMENT_LIST, type ApartmentKey } from '../../../private-bar/apartments';
import { strings } from '../../../private-bar/strings';

/**
 * The first step: which apartment is the guest in.
 *
 * Most guests arrive through a QR code on a phone, so this is one question,
 * two large targets, and nothing else. It is rendered INSTEAD of the catalogue,
 * never above it — showing products before the apartment is known would mean
 * showing the wrong ones, which is exactly what this gate exists to prevent.
 *
 * Deliberately free of technical language: no inventory, no property id, no
 * configuration. The guest reads the two names printed on their booking.
 *
 * `committing` is the card the guest has just chosen, while the gate is still
 * on screen. It drives the handoff only: the chosen card steps forward, the
 * other recedes, and the gate lifts away as the catalogue takes its place. The
 * apartment itself changes when that movement ends, in PrivateBarPage.
 */
export function ApartmentGate({
  onSelect,
  onIntent,
  committing = null,
  quick = false,
}: {
  onSelect: (apartment: ApartmentKey) => void;
  /** Called the moment a finger lands, before the tap completes: the guest has
   *  shown which apartment they mean, which is the earliest honest signal to
   *  start preparing it. Presentation only — it changes nothing. */
  onIntent?: (apartment: ApartmentKey) => void;
  committing?: ApartmentKey | null;
  /** Returning to the gate rather than opening the page: there is no overture
   *  left to wait for, so the entrance plays at once. */
  quick?: boolean;
}) {
  const className = ['pb-gate', 'pb-enter', 'pb-enter--4', quick ? 'pb-gate--quick' : '', committing ? 'is-leaving' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <section className={className} aria-labelledby="pb-gate-heading">
      <h2 id="pb-gate-heading" className="pb-display pb-gate__heading">
        {strings.apartment.heading}
      </h2>
      <p className="pb-body pb-gate__body">{strings.apartment.body}</p>

      <ul className="pb-gate__options">
        {APARTMENT_LIST.map((apartment) => {
          const chosen = committing === apartment.key;
          return (
            <li key={apartment.key}>
              <button
                type="button"
                className={
                  committing
                    ? `pb-gate__option ${chosen ? 'is-chosen' : 'is-dismissed'}`
                    : 'pb-gate__option'
                }
                onClick={() => onSelect(apartment.key)}
                onPointerDown={() => onIntent?.(apartment.key)}
                // The decision is already made; a second tap must not read as a
                // new one, and assistive tech should hear that it is settled.
                aria-disabled={committing !== null || undefined}
                aria-label={strings.apartment.chooseAria(apartment.label)}
              >
                <span className="pb-gate__option-label">{apartment.label}</span>
                <span className="pb-gate__option-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
