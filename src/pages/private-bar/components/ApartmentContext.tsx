import { apartmentLabel, type ApartmentKey } from '../../../private-bar/apartments';
import { strings } from '../../../private-bar/strings';

/**
 * The quiet reminder of which apartment this catalogue belongs to.
 *
 * Subordinate by design: the guest needs to be able to correct a wrong tap, not
 * to be reminded of a setting. One line, one hairline separator, the change
 * action as a text button rather than a second call to action.
 */
export function ApartmentContext({
  apartment,
  onChange,
}: {
  apartment: ApartmentKey;
  onChange: () => void;
}) {
  const label = apartmentLabel(apartment);

  return (
    <p className="pb-apartment">
      <span className="pb-apartment__label">{label}</span>
      <span className="pb-apartment__separator" aria-hidden="true">
        ·
      </span>
      <button
        type="button"
        className="pb-apartment__change"
        onClick={onChange}
        aria-label={strings.apartment.changeAria(label)}
      >
        {strings.apartment.change}
      </button>
    </p>
  );
}
