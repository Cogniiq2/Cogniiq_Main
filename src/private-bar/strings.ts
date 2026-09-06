// ─────────────────────────────────────────────────────────────────────────────
// Private Bar copy — German (Sie-Form), V1.
//
// Every user-visible string lives here so an English sibling can be added later
// without touching a component. No language switcher is implemented in V1.
//
// Copy discipline: nothing here claims a service, a price, a delivery time or a
// product property that has not been confirmed by the owner.
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductCategory } from './catalog';

export const strings = {
  brand: {
    wordmark: 'BoLaGio',
    product: 'Private Bar',
  },
  /**
   * Document titles, one per surface.
   *
   * These must stay identical to the titles in src/lib/routing/publicRoutes.ts:
   * that manifest writes the <title> of the prerendered document, and this is
   * what the surface restores after a client-side navigation. Two sources for
   * one string is exactly the drift the route manifest exists to prevent, so
   * privateBar.routing.test.tsx asserts they agree.
   */
  documentTitles: {
    bar: 'BoLaGio · Private Bar',
    success: 'Zahlung · BoLaGio Private Bar',
    cancel: 'Zahlung abgebrochen · BoLaGio Private Bar',
  },
  intro: {
    heading: 'Willkommen',
    body: 'In Ihrer Wohnung steht eine kleine, sorgfältig ausgewählte Auswahl bereit. Bedienen Sie sich jederzeit — und halten Sie hier einfach fest, was Sie genossen haben.',
  },
  catalogue: {
    heading: 'Die Auswahl',
    /** Shown in place of an amount while no price is configured. Never a number. */
    priceUnconfigured: 'Preis folgt',
    /** Shown inside a product frame while the prepared photograph is unavailable. */
    imagePending: 'Foto folgt',
    /** Accessible label for the neutral image frame. */
    imagePendingAlt: 'Produktfoto folgt',
  },
  categories: {
    sparkling: 'Schaumwein',
    wine: 'Wein',
    beer: 'Bier',
    water: 'Wasser',
    unclassified: 'Weiteres',
  } satisfies Record<ProductCategory, string>,
  success: {
    confirming: 'Zahlung wird bestätigt …',
    confirmingBody: 'Einen Moment bitte — wir gleichen Ihre Zahlung mit unserem Zahlungsdienst ab.',
    paidHeading: 'Vielen Dank.',
    paidBody: 'Ihre Zahlung ist eingegangen. Genießen Sie den Rest Ihres Aufenthalts.',
    failedHeading: 'Die Zahlung wurde nicht abgeschlossen.',
    failedBody: 'Es wurde nichts abgebucht. Sie können den Vorgang jederzeit erneut starten.',
    unknownHeading: 'Wir konnten die Bestätigung noch nicht abrufen.',
    unknownBody:
      'Das heißt nicht, dass etwas schiefgegangen ist. Prüfen Sie es in einem Moment erneut oder sprechen Sie uns kurz an.',
    retry: 'Erneut prüfen',
    /** Phase A: the status service is not connected yet. Never claims a payment. */
    unavailableHeading: 'Bestätigung noch nicht verfügbar',
    unavailableBody:
      'Die Zahlungsbestätigung ist derzeit nicht abrufbar. Diese Seite bestätigt keine Zahlung.',
  },
  cancel: {
    heading: 'Die Zahlung wurde nicht abgeschlossen.',
    body: 'Es wurde nichts abgebucht.',
    back: 'Zurück zur Auswahl',
  },
} as const;

export function categoryLabel(category: ProductCategory): string {
  return strings.categories[category];
}
