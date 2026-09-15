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
 */
export function ApartmentGate({ onSelect }: { onSelect: (apartment: ApartmentKey) => void }) {
  return (
    <section className="pb-gate pb-enter pb-enter--4" aria-labelledby="pb-gate-heading">
      <h2 id="pb-gate-heading" className="pb-display pb-gate__heading">
        {strings.apartment.heading}
      </h2>
      <p className="pb-body pb-gate__body">{strings.apartment.body}</p>

      <ul className="pb-gate__options">
        {APARTMENT_LIST.map((apartment) => (
          <li key={apartment.key}>
            <button
              type="button"
              className="pb-gate__option"
              onClick={() => onSelect(apartment.key)}
              aria-label={strings.apartment.chooseAria(apartment.label)}
            >
              <span className="pb-gate__option-label">{apartment.label}</span>
              <span className="pb-gate__option-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
