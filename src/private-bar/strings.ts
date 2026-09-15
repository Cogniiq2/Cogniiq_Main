// ─────────────────────────────────────────────────────────────────────────────
// Private Bar copy — German, Sie-Form.
//
// Every user-visible string lives here, so the voice can be reviewed in one
// place and an English sibling added later without touching a component.
//
// Two rules govern this file:
//   1. Nothing claims a payment. This version hands the guest to PayPal and
//      never learns the outcome, so no wording may suggest it did.
//   2. Nothing claims a service, a place or a property that has not been
//      confirmed. Where a detail is missing (the cash location, for one) the
//      sentence is written so it reads correctly without it.
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductCategory } from './catalog';

export const strings = {
  brand: {
    wordmark: 'BoLaGio',
    product: 'Private Bar',
  },
  documentTitle: 'BoLaGio · Private Bar',
  intro: {
    heading: 'Willkommen',
    body: 'In Ihrer Wohnung steht eine kleine, sorgfältig zusammengestellte Auswahl für Sie bereit. Bedienen Sie sich, wann immer Ihnen danach ist — und halten Sie hier in Ruhe fest, was Sie genossen haben.',
  },
  apartment: {
    /** The selection gate. Shown before any product, on every fresh session. */
    heading: 'Welches Apartment haben Sie gebucht?',
    body: 'Damit wir Ihnen die richtige Auswahl anzeigen.',
    chooseAria: (label: string) => `${label} auswählen`,
    /** The quiet context line inside the catalogue. */
    change: 'Apartment ändern',
    changeAria: (label: string) => `Gewähltes Apartment: ${label}. Apartment ändern`,
    /** Switching with something already selected. */
    switchTitle: 'Apartment wechseln?',
    switchBody: (label: string) =>
      `Ihre aktuelle Auswahl gilt für ${label} und wird beim Wechsel zurückgesetzt.`,
    switchConfirm: 'Wechseln und Auswahl zurücksetzen',
    switchCancel: 'Abbrechen',
  },
  catalogue: {
    heading: 'Die Auswahl',
    priceUnconfigured: 'Preis folgt',
    unavailable: 'Nicht verfügbar',
    lastOne: 'Letzte Flasche',
    remaining: (count: number) => (count === 1 ? 'Noch 1 verfügbar' : `Noch ${count} verfügbar`),
    imagePending: 'Foto folgt',
    imagePendingAlt: 'Produktfoto folgt',
    add: 'Hinzufügen',
    addAria: (name: string) => `${name} hinzufügen`,
    increaseAria: (name: string) => `${name}: eine Einheit mehr`,
    decreaseAria: (name: string) => `${name}: eine Einheit weniger`,
    quantityAria: (name: string, quantity: number) =>
      `${name}: ${quantity === 1 ? '1 Einheit' : `${quantity} Einheiten`} ausgewählt`,
  },
  categories: {
    sparkling: 'Schaumwein',
    wine: 'Wein',
    beer: 'Bier',
    water: 'Wasser & Refreshments',
  } satisfies Record<ProductCategory, string>,
  bar: {
    items: (count: number) => (count === 1 ? '1 Artikel' : `${count} Artikel`),
    action: 'Auswahl ansehen',
    ariaLabel: 'Auswahl ansehen und bestätigen',
    /** After confirmation only the payment is outstanding. */
    openAmount: 'Offener Betrag',
    actionConfirmed: 'Zur Zahlung',
    ariaLabelConfirmed: 'Offenen Betrag ansehen und bezahlen',
  },
  sheet: {
    title: 'Ihre Auswahl',
    confirmedTitle: 'Ihre Entnahme',
    close: 'Schließen',
    remove: 'Entfernen',
    removeAria: (name: string) => `${name} aus der Auswahl entfernen`,
    totalLabel: 'Gesamtbetrag',
    clear: 'Auswahl zurücksetzen',
    emptyHeading: 'Noch nichts ausgewählt',
    emptyBody: 'Sobald Sie etwas aus der Bar nehmen, erscheint es hier.',
  },
  payment: {
    heading: 'Bezahlung',
    /** The step that actually marks the drinks as taken. */
    confirmHeading: 'Auswahl bestätigen',
    confirmBody:
      'Mit der Bestätigung markieren Sie die ausgewählten Getränke als entnommen. Anschließend begleichen Sie den Gesamtbetrag bequem über PayPal.',
    confirmCta: 'Auswahl bestätigen',
    confirmPending: 'Einen Moment …',
    confirmedNote: 'Ihre Auswahl ist vermerkt.',
    paypal: 'Mit PayPal bezahlen',
    paypalNote: (amount: string) =>
      `Der Gesamtbetrag beträgt ${amount}. PayPal öffnet sich in einem eigenen, gesicherten Fenster — bitte geben Sie den Betrag dort ein.`,
    /** Shown when no PayPal link is configured for this apartment. */
    paypalUnavailable: 'Für diese Wohnung ist derzeit kein PayPal-Konto hinterlegt.',
    copyAmount: 'Betrag kopieren',
    copyAmountAria: (amount: string) => `Betrag ${amount} kopieren`,
    copied: 'Kopiert',
    copyFailed: 'Bitte notieren Sie den Betrag kurz von Hand.',
    /**
     * Shown after the guest has opened PayPal. Says only that the payment is
     * completed in PayPal — this site never learns whether it was, and no
     * wording here may suggest otherwise.
     */
    handedOff:
      'Fast geschafft. Schließen Sie die Zahlung einfach in PayPal ab. Ihre Auswahl bleibt hier gespeichert.',
    newSelection: 'Weitere Auswahl starten',
    or: 'oder',
    cashHeading: 'Bar bezahlen',
    cashBody: 'Sie können den genauen Betrag auch in bar hinterlegen.',
  },
  errors: {
    /** The selection could not be confirmed because stock moved underneath it. */
    stockChanged:
      'Ein Artikel Ihrer Auswahl ist inzwischen nicht mehr verfügbar. Ihre Auswahl wurde aktualisiert.',
    /** The confirmation could not be completed — network, timeout, anything. */
    confirmFailed:
      'Das hat gerade nicht geklappt. Bitte versuchen Sie es in einem Moment noch einmal.',
    /** Inventory could not be loaded at all. */
    inventoryUnavailable:
      'Die Verfügbarkeit lässt sich gerade nicht abrufen. Bitte laden Sie die Seite in einem Moment neu.',
    retry: 'Erneut versuchen',
  },
  guestExperience: {
    eyebrow: 'BoLaGio Guest Experience',
    heading: 'Ihr Aufenthalt. Ein privater digitaler Service.',
    body: 'Die Private Bar ist der erste Teil eines neuen, persönlichen Service für unsere Gäste. Weitere Bereiche stehen in Kürze bereit — von ausgewählten Speisen bis zur persönlichen Anfrage, direkt aus Ihrer Wohnung.',
    items: [
      {
        title: 'Private Bar',
        description: 'Getränke auswählen und bequem digital begleichen.',
        status: 'Jetzt verfügbar',
        available: true,
      },
      {
        title: 'Dining',
        description: 'Ausgewählte Speisen direkt für Ihren Aufenthalt bestellen.',
        status: 'In Kürze',
        available: false,
      },
      {
        title: 'Priority Service',
        description: 'Anfragen von Gästen im Haus werden bevorzugt beantwortet.',
        status: 'In Kürze',
        available: false,
      },
      {
        title: 'Stay Services',
        description: 'Weitere Wünsche rund um Ihren Aufenthalt an einer Stelle.',
        status: 'In Kürze',
        available: false,
      },
    ],
    footnote: 'Sie sehen diesen Bereich als eine der ersten Gästinnen und Gäste.',
  },
} as const;

export function categoryLabel(category: ProductCategory): string {
  return strings.categories[category];
}
