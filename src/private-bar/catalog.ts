// ─────────────────────────────────────────────────────────────────────────────
// BoLaGio Private Bar — the ONE authoritative product catalogue.
//
// This module is deliberately framework-free: no React, no DOM, no
// `import.meta.env`. It is imported by the React page AND, from Phase C
// onwards, by the Cloudflare Pages Function that creates checkout sessions, so
// prices exist in exactly one place and the browser is never trusted for them.
// (Verified: `wrangler pages functions build` bundles this cross-directory
// TypeScript import and inlines the catalogue into the Worker.)
//
// HONESTY RULES — these are product requirements, not style preferences:
//   • `priceCents: null` means "no price configured". It is NEVER a placeholder
//     for a real price, is never rendered as an amount, and makes the product
//     unpurchasable (see ./pricing.ts). Fake prices are forbidden.
//   • Metadata that is not established from the supplied source material stays
//     `null`. Origin, volume, vintage, classification and tasting notes are not
//     inferred, guessed or generated.
//   • Categories are the owner's own classification. Nothing here is inferred
//     from a product name.
// ─────────────────────────────────────────────────────────────────────────────

export type ProductCategory = 'sparkling' | 'wine' | 'beer' | 'water';

export interface ProductImage {
  /** Base path without extension or width suffix, e.g. "/private-bar/products/ploner-marell". */
  readonly basePath: string;
  /** Intrinsic pixel size of the prepared asset. Rendered as width/height so the
   *  layout is reserved before the image loads — the page must never shift. */
  readonly width: number;
  readonly height: number;
  /** Widths emitted by the asset pipeline, used to build `srcset`. */
  readonly widths: readonly number[];
}

export interface PrivateBarProduct {
  readonly id: string;
  /** Full product name exactly as supplied. Never edited for marketing effect. */
  readonly name: string;
  /** Short form for tight surfaces (cart lines, sheet rows). */
  readonly shortLabel: string;
  readonly category: ProductCategory;
  /** null until established from the supplied source material. */
  readonly origin: string | null;
  /** e.g. "0,75 l". null until established. */
  readonly volume: string | null;
  /** Gross price in euro cents, or null when no price is configured yet. */
  readonly priceCents: number | null;
  /** Prepared photography, or null while the real asset is unavailable. */
  readonly image: ProductImage | null;
  /** Physically available in the apartment right now. */
  readonly available: boolean;
  readonly sortOrder: number;
}

export const PRIVATE_BAR_CATALOG: readonly PrivateBarProduct[] = [
  {
    id: 'stella-rossa-prosecco-doc-brut',
    name: 'Stella Rossa Prosecco DOC Brut',
    shortLabel: 'Stella Rossa Prosecco',
    category: 'sparkling',
    origin: null,
    volume: null,
    priceCents: 2200,
    image: {
      basePath: '/private-bar/products/stella-rossa-prosecco-doc-brut',
      width: 240,
      height: 751,
      widths: [240, 480],
    },
    available: true,
    sortOrder: 10,
  },
  {
    id: 'ploner-marell',
    name: 'Ploner Marell Brut',
    shortLabel: 'Ploner Marell Brut',
    category: 'sparkling',
    origin: null,
    volume: null,
    priceCents: 3900,
    image: {
      basePath: '/private-bar/products/ploner-marell',
      width: 240,
      height: 816,
      widths: [240, 480],
    },
    available: true,
    sortOrder: 20,
  },
  {
    id: 'masseria-borgo-dei-trulli-primitivo',
    name: 'Masseria Borgo dei Trulli Primitivo',
    shortLabel: 'Borgo dei Trulli Primitivo',
    category: 'wine',
    origin: null,
    volume: null,
    priceCents: 1600,
    image: {
      basePath: '/private-bar/products/masseria-borgo-dei-trulli-primitivo',
      width: 240,
      height: 888,
      widths: [240, 480],
    },
    available: true,
    sortOrder: 30,
  },
  {
    // Guest-facing name corrected: the photographed bottle is actually
    // "Vescovo Moro Rosso I.G.P.", not "Covo Moro". The technical id stays
    // "covo-moro" deliberately — Supabase inventory rows and existing orders
    // already key on it, and renaming it would need a data migration for a
    // display-only correction.
    id: 'covo-moro',
    name: 'Vescovo Moro Rosso I.G.P.',
    shortLabel: 'Vescovo Moro Rosso',
    category: 'wine',
    origin: null,
    volume: null,
    priceCents: 1900,
    image: {
      basePath: '/private-bar/products/covo-moro',
      width: 240,
      height: 848,
      widths: [240, 480],
    },
    available: true,
    sortOrder: 40,
  },
  {
    id: 'ploner-sauvignon',
    name: 'Ploner Sauvignon',
    shortLabel: 'Ploner Sauvignon',
    category: 'wine',
    origin: null,
    volume: null,
    priceCents: 2900,
    image: {
      basePath: '/private-bar/products/ploner-sauvignon',
      width: 240,
      height: 810,
      widths: [240, 480],
    },
    available: true,
    sortOrder: 50,
  },
  {
    id: 'tiefenbrunner-merus-gewuerztraminer-2022',
    name: 'Tiefenbrunner Merus Gewürztraminer 2022',
    shortLabel: 'Merus Gewürztraminer 2022',
    category: 'wine',
    origin: null,
    volume: null,
    priceCents: 2400,
    image: {
      basePath: '/private-bar/products/tiefenbrunner-merus-gewuerztraminer-2022',
      width: 240,
      height: 826,
      widths: [240, 480],
    },
    available: true,
    sortOrder: 60,
  },
  {
    id: 'biancavigna-2022',
    name: 'BiancaVigna 2022',
    shortLabel: 'BiancaVigna 2022',
    category: 'wine',
    origin: null,
    volume: null,
    priceCents: 2400,
    image: {
      basePath: '/private-bar/products/biancavigna-2022',
      width: 240,
      height: 780,
      widths: [240, 480],
    },
    available: true,
    sortOrder: 70,
  },
  {
    id: 'bayreuther-hell',
    name: 'Bayreuther Hell',
    shortLabel: 'Bayreuther Hell',
    category: 'beer',
    origin: null,
    volume: '0,5 l',
    priceCents: 450,
    image: {
      basePath: '/private-bar/products/bayreuther-hell',
      width: 240,
      height: 724,
      widths: [240, 480],
    },
    available: true,
    sortOrder: 80,
  },
  {
    id: 's-pellegrino',
    name: 'S.Pellegrino',
    shortLabel: 'S.Pellegrino',
    category: 'water',
    origin: null,
    volume: '0,75 l',
    priceCents: 450,
    image: {
      basePath: '/private-bar/products/s-pellegrino',
      width: 240,
      height: 839,
      widths: [240, 480],
    },
    available: true,
    sortOrder: 90,
  },
];

/** Display order for the catalogue sections. */
export const CATEGORY_ORDER: readonly ProductCategory[] = ['sparkling', 'wine', 'beer', 'water'];

export function productById(id: string): PrivateBarProduct | undefined {
  return PRIVATE_BAR_CATALOG.find((product) => product.id === id);
}

/** Catalogue in display order, physically available products only. */
export function availableProducts(): readonly PrivateBarProduct[] {
  return PRIVATE_BAR_CATALOG.filter((product) => product.available).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

/** Available products grouped into the sections the catalogue renders. */
export function productsByCategory(): readonly {
  readonly category: ProductCategory;
  readonly products: readonly PrivateBarProduct[];
}[] {
  const products = availableProducts();
  return CATEGORY_ORDER.map((category) => ({
    category,
    products: products.filter((product) => product.category === category),
  })).filter((group) => group.products.length > 0);
}
