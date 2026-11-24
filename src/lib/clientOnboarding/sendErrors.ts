// Maps a database error from the onboarding send reservation to a fixed owner-facing message.
// Shared by the Edge Function and its unit tests. Raw database text never reaches the browser:
// only messages on this allowlist pass through (they are the German validation messages the
// migration raises on purpose); everything else becomes a generic message.

const PASS_THROUGH: RegExp[] = [
  /^Ungültige (Nachrichtenart|Sprache|E-Mail-Adresse)\.$/,
  /^Bitte geben Sie einen Betreff mit 3 bis 200 Zeichen an\.$/,
  /^Der Einleitungstext ist zu lang\.$/,
  /^Name zu lang\.$/,
  /^Die Leistung ist nicht aktiv\.$/,
  /^Der Kunde ist noch mit keiner Portal-Organisation verknüpft\.$/,
  /^Diese E-Mail-Adresse gehört nicht zu den Kontakten dieses Kunden\.$/,
  /^Zu viele (Nachrichten an diesen Kunden in kurzer Zeit|Testnachrichten)\. Bitte versuchen Sie es später erneut\.$/,
];

export function ownerFacingError(raw: string): { message: string; status: number } {
  const msg = (raw ?? '').trim();
  if (PASS_THROUGH.some((re) => re.test(msg))) {
    return { message: msg, status: msg.startsWith('Zu viele') ? 429 : 400 };
  }
  if (msg === 'Owner access required') return { message: 'Nur der Inhaber kann Onboarding-Nachrichten senden.', status: 403 };
  if (msg === 'engagement not found') return { message: 'Die Einrichtung wurde nicht gefunden.', status: 404 };
  if (msg === 'request not found') return { message: 'Die Rückfrage wurde nicht gefunden.', status: 404 };
  if (msg === 'idempotency key already used') return { message: 'Diese Anfrage wurde bereits verarbeitet.', status: 409 };
  return { message: 'Die Nachricht konnte nicht vorbereitet werden. Es wurde keine E-Mail versendet.', status: 400 };
}
