// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the public Impressum and Datenschutz content.
// Rendered by the crawlable routes /impressum and /datenschutz.
//
// Legal accuracy rules applied here (see docs/PHASE0_LEGAL_OPEN_ITEMS.md):
//   • Verified operator record: sole proprietorship "Cogniiq, Inhaber Lazar
//     Popovic", Am Main 3, 95444 Bayreuth, USt-IdNr. gemäß § 27a UStG
//     DE460292419. VAT-liable; the reduced-VAT small-business scheme (§ 19 UStG)
//     is not used. The personal Steuer-ID is confidential and is NEVER shown.
//     No legal detail is invented.
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

export const LEGAL_LAST_UPDATED = '2026-08-28';

const A = BUSINESS_INFO.address;
const C = BUSINESS_INFO.contact;

export function ImpressumContent() {
  return (
    <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        Cogniiq
        <br />
        Inhaber: Lazar Popovic
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

      <h2>Umsatzsteuer-Identifikationsnummer</h2>
      <p>USt-IdNr. gemäß § 27a UStG: DE460292419</p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        Lazar Popovic
        <br />
        {A.streetAddress}
        <br />
        {A.postalCode} {A.addressLocality}
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
        Cogniiq
        <br />
        Inhaber: Lazar Popovic
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
        Cookie-/Einwilligungsauswahl (Schlüssel <code>cogniiq_consent_v2</code>) sowie Anzeige- und
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

      <h2>7. Google Analytics (nur mit Einwilligung)</h2>
      <p>
        Wir nutzen Google Analytics 4 (Anbieter: Google Ireland Limited, Gordon House, Barrow
        Street, Dublin 4, Irland). Zweck ist die Statistik und Nutzungsanalyse: Wir möchten
        verstehen, wie unsere Website genutzt wird – etwa welche Seiten aufgerufen werden – um sie
        laufend zu verbessern.
      </p>
      <p>
        Google Analytics wird{' '}
        <strong>ausschließlich nach Ihrer ausdrücklichen Einwilligung in die Statistik</strong>{' '}
        geladen. Vor dieser Einwilligung wird kein Google-Analytics-Skript geladen, es werden keine
        Analyse-Cookies gesetzt und es werden keine Daten an Google übermittelt. Wir setzen den
        Google Consent Mode v2 in der Basis-Variante ein: <code>analytics_storage</code> steht
        standardmäßig auf „denied“ und wird erst nach Ihrer Einwilligung auf „granted“ gesetzt.
      </p>
      <p>
        Die Einwilligung in die Statistik ist von der Einwilligung in Marketing (Google Ads,
        Abschnitt 6) unabhängig: Sie können der Statistik zustimmen, ohne Marketing zu erlauben, und
        umgekehrt. Sie können beides ablehnen; die Website ist ohne diese Einwilligungen
        uneingeschränkt nutzbar.
      </p>
      <p>
        Auf Basis unserer Einbindung werden insbesondere folgende Kategorien von Nutzungsdaten
        verarbeitet: aufgerufene Seiten (URL und Seitentitel), die verweisende Seite (Referrer),
        Zeitpunkt und Dauer des Aufrufs, ungefährer Standort (in der Regel auf Basis der IP-Adresse
        abgeleitet), technische Angaben zu Gerät, Betriebssystem, Browser und Spracheinstellung
        sowie eine pseudonyme Kennung, die in den Cookies <code>_ga</code> und{' '}
        <code>_ga_K7BS3LKT6H</code> gespeichert wird. Diese Daten sind{' '}
        <strong>pseudonym, aber nicht anonym</strong>: Über die Kennung können wiederkehrende
        Aufrufe desselben Browsers zusammengeführt werden. Wir übermitteln keine Klardaten wie Namen,
        E-Mail-Adressen oder Inhalte von Kontaktformularen an Google. Welche weiteren automatischen
        Messungen aktiv sind, hängt zusätzlich von den Einstellungen der Google-Analytics-Property
        ab.
      </p>
      <p>
        Eine Übermittlung von Daten in Drittländer, insbesondere in die USA (Google LLC), kann nicht
        ausgeschlossen werden. Google gibt an, sich hierfür auf das EU-US Data Privacy Framework
        sowie auf Standardvertragsklauseln zu stützen. Ein den EU-Standards vollständig
        entsprechendes Datenschutzniveau kann in Drittländern nicht in jedem Fall garantiert werden.
        Informationen von Google zur Datenverarbeitung finden Sie unter{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          policies.google.com/privacy
        </a>{' '}
        sowie{' '}
        <a
          href="https://business.safety.google/privacy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          business.safety.google/privacy
        </a>
        .
      </p>
      <p>
        Rechtsgrundlage für das Speichern und Auslesen von Informationen auf Ihrem Endgerät ist § 25
        Abs. 1 TDDDG, für die anschließende Verarbeitung der Nutzungsdaten Ihre Einwilligung nach
        Art. 6 Abs. 1 lit. a DSGVO. Sie können Ihre Einwilligung jederzeit mit Wirkung für die
        Zukunft über „Cookie-Einstellungen“ im Footer ändern oder widerrufen (Art. 7 Abs. 3 DSGVO).
        Beim Widerruf entfernen wir die über die Website erreichbaren First-Party-Cookies. Bereits
        übermittelte Daten können über die Website nicht nachträglich zurückgezogen werden.
      </p>

      <h2>8. Kundenbereich und Kundenprozesse</h2>
      <p>
        Für registrierte Kundinnen und Kunden betreiben wir einen passwortgeschützten Kundenbereich.
        Für Authentifizierung und die Speicherung der zugehörigen Kundendaten nutzen wir Supabase.
        Für den Versand transaktionaler E-Mails (z. B. im Angebots- und Signaturprozess) setzen wir
        Resend ein. Angebote werden über einen zugriffsgeschützten, nicht indexierbaren Dokument-Link
        bereitgestellt und dort rechtsgültig signiert. Diese Verarbeitungen betreffen bestehende
        Geschäfts- und Vertragsbeziehungen; Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
      </p>

      <h2>9. Ihre Rechte</h2>
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

      <h2>10. Kontakt zum Datenschutz</h2>
      <p>
        Bei Fragen zum Datenschutz erreichen Sie uns unter {C.email}.
      </p>

      <p className="text-xs text-gray-400 dark:text-gray-500">Stand: {LEGAL_LAST_UPDATED}</p>
    </div>
  );
}
