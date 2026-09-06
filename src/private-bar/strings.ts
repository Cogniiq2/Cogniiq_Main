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
  catalogue: {
    heading: 'Die Auswahl',
    priceUnconfigured: 'Preis folgt',
    unavailable: 'Zurzeit nicht verfügbar',
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
    unclassified: 'Weitere Auswahl',
  } satisfies Record<ProductCategory, string>,
  bar: {
    items: (count: number) => (count === 1 ? '1 Artikel' : `${count} Artikel`),
    action: 'Auswahl ansehen',
    ariaLabel: 'Auswahl ansehen und bezahlen',
  },
  sheet: {
    title: 'Ihre Auswahl',
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
    paypal: 'Mit PayPal bezahlen',
    paypalNote: (amount: string) =>
      `Der Gesamtbetrag beträgt ${amount}. PayPal öffnet sich in einem eigenen, gesicherten Fenster.`,
    /** Shown when no PayPal link is configured for this apartment. */
    paypalUnavailable: 'Für diese Wohnung ist derzeit kein PayPal-Konto hinterlegt.',
    copyAmount: 'Betrag kopieren',
    copyAmountAria: (amount: string) => `Betrag ${amount} kopieren`,
    copied: 'Kopiert',
    /**
     * Shown after the guest has opened PayPal. Says nothing about whether the
     * payment happened — this site never learns that — only that nothing
     * further is required here.
     */
    handedOff:
      'Vielen Dank. Sobald Sie die Zahlung in PayPal abgeschlossen haben, ist für Sie nichts weiter zu tun.',
    or: 'oder',
    cashHeading: 'Bar bezahlen',
    cashBody: 'Sie können den genauen Betrag auch in bar hinterlegen.',
  },
  guestExperience: {
    eyebrow: 'BoLaGio Guest Experience',
    heading: 'Ihr Aufenthalt. Ein privater digitaler Service.',
    body: 'Die Private Bar ist der erste Teil eines neuen, persönlichen Service für unsere Gäste. Der vollständige Umfang wird gerade vorbereitet und steht Ihnen voraussichtlich in rund einer Woche zur Verfügung — von ausgewählten Speisen bis zur persönlichen Anfrage, direkt aus Ihrer Wohnung.',
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
