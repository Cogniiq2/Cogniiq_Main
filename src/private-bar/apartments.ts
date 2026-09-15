// ─────────────────────────────────────────────────────────────────────────────
// The apartments this Private Bar serves — the ONE place an apartment id is
// written, and the ONE place that says which products an apartment may sell.
//
// Framework-free on purpose (see ./catalog.ts): both the React page and the
// Cloudflare Pages Functions import this module, so the browser and the server
// agree on the mapping by construction rather than by convention.
//
// THE RULE THIS MODULE EXISTS TO ENFORCE: the browser names an apartment with a
// PUBLIC KEY from a finite allow-list ('designaparts1'). It never names the
// canonical internal id, and an untrusted string can never become
// p_apartment_id — resolveApartment() is the only door, and it fails closed.
//
// HISTORICAL NOTE, deliberately preserved: designAparts II carries the internal
// id 'bolagio-apartment-1'. That id already keys live inventory rows and real
// order history, so it is NOT renamed for cosmetic consistency. The guest never
// sees it; they see the label.
// ─────────────────────────────────────────────────────────────────────────────

export type ApartmentKey = 'designaparts1' | 'designaparts2';

export interface ApartmentConfig {
  /** The public key. This, and only this, travels over the wire. */
  readonly key: ApartmentKey;
  /** What the guest reads. Never used as a database value. */
  readonly label: string;
  /** The canonical internal id: private_bar_inventory.apartment_id and
   *  private_bar_orders.apartment_id. Never rendered. */
  readonly apartmentId: string;
  /** Exactly which catalogue products this apartment may sell. */
  readonly productIds: readonly string[];
  /** Order of the two cards in the selection gate. */
  readonly sortOrder: number;
}

export const APARTMENTS: Readonly<Record<ApartmentKey, ApartmentConfig>> = {
  designaparts1: {
    key: 'designaparts1',
    label: 'designAparts I',
    apartmentId: 'bolagio-designaparts-1',
    productIds: [
      'planeta-plumbago-nero-davola-2021',
      'ottella-rosesroses',
      'cavalchina-custoza-2025',
      'nunzio-ghiraldi-il-gruccione',
      'manz-grauburgunder-fruchtecke',
    ],
    sortOrder: 10,
  },
  designaparts2: {
    key: 'designaparts2',
    label: 'designAparts II',
    // Legacy id, kept verbatim: live inventory and order history depend on it.
    apartmentId: 'bolagio-apartment-1',
    productIds: [
      'stella-rossa-prosecco-doc-brut',
      'ploner-marell',
      'masseria-borgo-dei-trulli-primitivo',
      'covo-moro',
      'ploner-sauvignon',
      'tiefenbrunner-merus-gewuerztraminer-2022',
      'biancavigna-2022',
      'bayreuther-hell',
      's-pellegrino',
    ],
    sortOrder: 20,
  },
} as const;

/** The two apartments, in the order the selection gate renders them. */
export const APARTMENT_LIST: readonly ApartmentConfig[] = Object.values(APARTMENTS).sort(
  (a, b) => a.sortOrder - b.sortOrder
);

export const APARTMENT_KEYS: readonly ApartmentKey[] = APARTMENT_LIST.map((a) => a.key);

export function isApartmentKey(value: unknown): value is ApartmentKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(APARTMENTS, value);
}

/**
 * The ONLY way an untrusted value becomes an apartment.
 *
 * Returns null for anything that is not one of the two public keys — an unknown
 * key, a canonical internal id, a crafted string, undefined. Callers translate
 * that null into a rejection; nothing downstream ever sees a guessed apartment.
 */
export function resolveApartment(value: unknown): ApartmentConfig | null {
  return isApartmentKey(value) ? APARTMENTS[value] : null;
}

/** The canonical internal id for a known key. */
export function apartmentIdOf(key: ApartmentKey): string {
  return APARTMENTS[key].apartmentId;
}

export function apartmentLabel(key: ApartmentKey): string {
  return APARTMENTS[key].label;
}

/**
 * Whether this apartment may sell this product.
 *
 * Enforced on the SERVER, not only in the interface: selecting designAparts I
 * and posting a designAparts II-only product id has to fail, and it fails here.
 */
export function productBelongsToApartment(productId: string, key: ApartmentKey): boolean {
  return APARTMENTS[key].productIds.includes(productId);
}

/** Product ids assigned to an apartment, for callers that need the list. */
export function productIdsForApartment(key: ApartmentKey): readonly string[] {
  return APARTMENTS[key].productIds;
}
