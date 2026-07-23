// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the public Impressum and Datenschutz content.
// Rendered by the crawlable routes /impressum and /datenschutz.
//
// Legal accuracy rules applied here (see docs/PHASE0_LEGAL_OPEN_ITEMS.md):
//   • Only verified company data from src/lib/seo-data.ts is used. No legal
//     form, representative title, tax id or register entry is invented.
//   • § 5 DDG is cited (not the obsolete § 5 TMG).
//   • The discontinued EU Online-Dispute-Resolution link is intentionally absent.
//   • The privacy text describes only services that actually process personal
//     data through the public website / related customer workflows, and never
//     claims that no tracking takes place.
//   • No absolute legal-compliance guarantee is made.
//
// This module contains NO "[zu ergänzen]" / TODO placeholders — unresolved
// legal items are tracked internally, not shown to visitors.
// ─────────────────────────────────────────────────────────────────────────────

import { BUSINESS_INFO } from '@/lib/seo-data';

export const LEGAL_LAST_UPDATED = '2026-07-23';

const A = BUSINESS_INFO.address;
const C = BUSINESS_INFO.contact;

export function ImpressumContent() {
  return (
    <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {BUSINESS_INFO.legalName}
        <br />
        {A.streetAddress}
        <br />
        {A.postalCode} {A.addressLocality}
        <br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        Telefon: {C.phoneDisplay}
        <br />
        E-Mail: {C.email}
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        Lazar Popovic, Djordje Popovic
        <br />
        Anschrift wie oben.
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach
        den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter
        jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen
        oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
      </p>

      <h2>Haftung für Links</h2>
      <p>
        Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
        Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
        Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
        Seiten verantwortlich.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch uns erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
        Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung
        außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen
        Autors bzw. Erstellers.
      </p>
    </div>
  );
}

export function DatenschutzContent() {
  return (
    <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
      <h2>1. Datenschutz auf einen Blick</h2>
      <p>
        Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Wir verarbeiten personenbezogene
        Daten auf Grundlage der Datenschutz-Grundverordnung (DSGVO), des Bundesdatenschutzgesetzes
        (BDSG) und des Telekommunikation-Digitale-Dienste-Datenschutz-Gesetzes (TDDDG). Wir setzen
        angemessene technische und organisatorische Maßnahmen ein; eine hundertprozentige Sicherheit
        bei der Datenübertragung im Internet kann jedoch nicht garantiert werden.
      </p>

      <h2>2. Verantwortliche Stelle</h2>
      <p>
        {BUSINESS_INFO.legalName}
        <br />
        {A.streetAddress}, {A.postalCode} {A.addressLocality}
        <br />
        E-Mail: {C.email}
      </p>

      <h2>3. Hosting und Auslieferung der Website</h2>
      <p>
        Diese Website wird über Cloudflare (Cloudflare, Inc.) gehostet und ausgeliefert. Beim Aufruf
        der Seiten verarbeitet Cloudflare technisch erforderliche Verbindungsdaten (z. B. IP-Adresse,
        Zeitpunkt des Zugriffs, angeforderte Ressource), um die Website sicher und zuverlässig
        bereitzustellen. Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren,
        performanten Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
      </p>

      <h2>4. Kontakt- und Buchungsanfragen</h2>
      <p>
        Wenn Sie unser Kontaktformular, das Formular für Rückfragen oder eine Terminanfrage nutzen,
        verarbeiten wir die von Ihnen angegebenen Daten (z. B. Name, E-Mail-Adresse, Telefonnummer,
        Nachricht), um Ihre Anfrage zu bearbeiten. Zur Verarbeitung und internen Weiterleitung dieser
        Anfragen setzen wir eine selbst betriebene Automatisierungsumgebung (n8n, gehostet unter
        n8n.cogniiq.co) ein. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche
        Maßnahmen) bzw. Art. 6 Abs. 1 lit. f DSGVO (Bearbeitung Ihrer Anfrage).
      </p>

      <h2>5. Speicherung im Browser (localStorage / sessionStorage)</h2>
      <p>
        Wir speichern technisch notwendige Informationen lokal in Ihrem Browser, insbesondere Ihre
        Cookie-/Einwilligungsauswahl (Schlüssel <code>cogniiq_consent_v1</code>) sowie Anzeige- und
        Oberflächeneinstellungen (z. B. Hell-/Dunkeldarstellung). Diese Speicherung ist für den
        Betrieb der Website erforderlich, dient nicht der Analyse und findet ohne gesonderte
        Einwilligung statt (§ 25 Abs. 2 TDDDG).
      </p>

      <h2>6. Google Ads (nur mit Einwilligung)</h2>
      <p>
        Wir nutzen Google Ads (Google Ireland Limited) zur Messung der Wirksamkeit unserer
        Werbeanzeigen (Conversion-Tracking/Remarketing). Der Google-Tag wird{' '}
        <strong>ausschließlich nach Ihrer ausdrücklichen Einwilligung</strong> geladen. Vor einer
        Einwilligung werden kein Google-Skript geladen, keine Werbe-Cookies gesetzt und keine Daten
        an Google übermittelt. Wir setzen den Google Consent Mode v2 ein; erst nach Ihrer Zustimmung
        werden <code>ad_storage</code>, <code>ad_user_data</code> und <code>ad_personalization</code>{' '}
        auf „granted" gesetzt. Dabei können Cookies gesetzt und Daten – auch in die USA – übertragen
        werden. Rechtsgrundlage sind Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1
        TDDDG. Sie können Ihre Einwilligung jederzeit über „Cookie-Einstellungen" im Footer widerrufen;
        wir entfernen dann die über die Website erreichbaren First-Party-Cookies. Bereits übermittelte
        Daten können über die Website nicht nachträglich zurückgezogen werden.
      </p>

      <h2>7. Kundenbereich und Kundenprozesse</h2>
      <p>
        Für registrierte Kundinnen und Kunden betreiben wir einen passwortgeschützten Kundenbereich.
        Für Authentifizierung und die Speicherung der zugehörigen Kundendaten nutzen wir Supabase.
        Für den Versand transaktionaler E-Mails (z. B. im Angebots- und Signaturprozess) setzen wir
        Resend ein. Angebote werden über einen zugriffsgeschützten, nicht indexierbaren Dokument-Link
        bereitgestellt und dort rechtsgültig signiert. Diese Verarbeitungen betreffen bestehende
        Geschäfts- und Vertragsbeziehungen; Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
      </p>

      <h2>8. Ihre Rechte</h2>
      <ul>
        <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
        <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
        <li>Recht auf Löschung (Art. 17 DSGVO)</li>
        <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
        <li>Recht auf Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
      </ul>
      <p>
        Zudem haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren,
        beispielsweise beim Bayerischen Landesamt für Datenschutzaufsicht (BayLDA).
      </p>

      <h2>9. Kontakt zum Datenschutz</h2>
      <p>
        Bei Fragen zum Datenschutz erreichen Sie uns unter {C.email}.
      </p>

      <p className="text-xs text-gray-400 dark:text-gray-500">Stand: {LEGAL_LAST_UPDATED}</p>
    </div>
  );
}
