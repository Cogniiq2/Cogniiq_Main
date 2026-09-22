# OUTREACH-AUDIT & GOOGLE-DATENFLUSS

**Erstellt:** 2026-09-22
**Teil E:** Outreach / Cold Email / Cold Calling
**Teil F:** Vollständige Rekonstruktion des Pfads `FORM → ENDPOINT → PROCESSING → GOOGLE?`

---

# TEIL E — OUTREACH

## E.0 Kernergebnis

> **Im Repository existiert kein Versandmechanismus für Cold E-Mail. Keine Warteschlange, kein Cron-Job, keine Sendefunktion, kein Template, kein Scheduler — und kein einziger Codepfad, der die Lead-Tabelle überhaupt liest.**
>
> Vorhanden sind ausschließlich **die Daten** und **eine Kanal-Absichtsspalte**.
>
> Damit ist die Sorge „ein automatisierter Cold-Mail-Versand könnte versehentlich aktiv sein" **für dieses Repository ausgeräumt**. Sie ist für die **n8n-Umgebung nicht ausgeräumt**, weil deren Workflows nicht einsehbar sind.

## E.1 Outreach-Tabellen

| Tabelle | Zweck | Status |
|---|---|---|
| `public.cogniiq_receptionist_leads` | 50 gesourcte Praxis-Leads inkl. `outreach_channel ∈ {email, phone}` und `status` (default `'new'`) | **Einzige Outreach-Tabelle** |
| *(keine weitere)* | keine `email_queue`, `outreach_log`, `campaigns`, `suppression_list`, `unsubscribes` | verifiziert |

`status` hat **keinen** CHECK-Constraint — der Wertebereich ist nicht definiert. Aus der Datenbank allein ist nicht ableitbar, welche Zustände ein Lead durchlaufen soll. Alle 50 Zeilen stehen auf `'new'`.

## E.2 E-Mail-Warteschlangen

**Keine gefunden.** Repository-weiter Scan nach `queue`, `outbox`, `pending_emails`, `scheduled_send`, `campaign`: keine Tabelle, kein Modul.

Die einzige asynchrone Job-Infrastruktur ist `owner_automation_jobs` aus `20260723126000_owner_automation_worker.sql`. Ihre Jobtypen betreffen ausschließlich den Angebots-/Rechnungs-Workflow gegenüber **Bestandskunden**. **Keine Verbindung zur Lead-Tabelle.**

## E.3 Cron-Jobs

Genau zwei `pg_cron`-Definitionen im gesamten Repository:

| Job | Quelle | Zweck | Lead-Bezug |
|---|---|---|---|
| `cogniiq-automation-worker` | `20260723127000_owner_signed_certificate_workflow.sql:575` | Angebots-/Zertifikats-Pipeline für Bestandskunden | **nein** |
| `cogniiq-storage-purge-worker` | `20260910140000_owner_storage_purge_worker.sql:769` | Löschung abgelaufener Storage-Objekte | **nein** |

Beide sind **auskommentierte Vorlagen** in einem `do $$`-Block, der ausdrücklich **no-op** bleibt, solange `pg_cron`, `pg_net` und Vault nicht vorhanden sind *und* beide Secrets im Vault liegen (`…127000.sql:593-600`). Die Aktivierung ist ein bewusster, manueller Schritt am Hosted-Projekt.

> **Es existiert kein Zeitplan, der Cold Mails auslösen könnte.**

## E.4 n8n-Hooks

Drei Endpunkte, alle **eingehend** (Website → n8n):

| Konstante | URL | Auslöser |
|---|---|---|
| `contact` | `https://n8n.cogniiq.co/webhook/contacts` | `ContactSection.tsx:394` |
| `faqQuestion` | `https://n8n.cogniiq.co/webhook/faq` | `FAQQuestionModal.tsx:98` |
| `receptionistDemo` | `https://n8n.cogniiq.co/webhook/google-ads` | `KiTelefonassistentDemoPage.tsx:102` |

**Es gibt keinen ausgehenden Aufruf von Cogniiq-Code in Richtung n8n zum Zweck des Versands** und keinen Endpunkt, der Leads an n8n übergäbe.

> ⚠️ **Offene Flanke — ausdrücklich benannt:** Die n8n-Workflows sind nicht im Repository. Ob dort ein Workflow existiert, der die Supabase-Lead-Tabelle liest (mit dem Service-Role-Key möglich) und Mails versendet, ist aus dem Repository **nicht feststellbar**. Das Repository selbst hält dieses Risiko bereits fest (`20260902120000_receptionist_leads_pii_rls.sql:69-80`).
> **NEEDS BUSINESS CONFIRMATION — mit Vorrang.**

## E.5 Sendefunktionen

| Mechanismus | Zweck | Empfängerkreis | Cold-Mail-tauglich? |
|---|---|---|---|
| `supabase/functions/send-offer-document-email/` (Resend) | Angebots- und Rechnungsdokumente | **Bestandskunden** aus `owner_customers` / `owner_offers` | **Nein** — Empfänger stammen aus dem Angebotsdatensatz, nicht aus Leads |
| `supabase/functions/admin-provision-client/` | Portal-Einladung nach Provisionierung | Neu angelegter Kunde | **Nein** |
| Supabase Auth (Signup, Reset, Confirm) | Transaktional | Registrierte Nutzer | **Nein** |

Repository-weit gibt es **keinen** SMTP-Client, kein `nodemailer`, keinen Bulk-Mail-Provider (kein Mailchimp, Brevo, SendGrid, ActiveCampaign, Lemlist, Instantly).

## E.6 Templates

`supabase/functions/send-offer-document-email/email.ts` enthält den einzigen Template-Renderer. Er ist auf den Angebots-/Rechnungskontext zugeschnitten: `renderTemplate()` ersetzt `{{platzhalter}}` und **escaped jeden Wert vor dem Einfügen in HTML** (`email.ts:44-46`) — sauber gegen HTML-Injection.

Nebenbefund, positiv: `recipientName()` leitet eine Anrede **niemals aus dem Namen ab** („Herr"/„Frau" nur bei ausdrücklicher Auswahl, `email.ts:12-28`). Gut gemacht.

**Kein Akquise-Template vorhanden.**

## E.7 Lead-Status

`status text not null default 'new'` — ohne CHECK-Constraint, ohne Zustandsautomat, ohne Historie. Alle 50 Zeilen `'new'`, `n_tup_upd = 0` über die gesamte Lebensdauer.

> **Kein Lead wurde jemals über die Datenbank in einen anderen Zustand überführt.** Ob außerhalb der Datenbank Kontakt aufgenommen wurde, ist damit nicht ausgeschlossen. `NEEDS BUSINESS CONFIRMATION`

## E.8 Suppression / Unsubscribe

**Nicht vorhanden. In keiner Form.**

| Erforderlich | Vorhanden |
|---|---|
| Abmeldelink in jeder Werbe-E-Mail (§ 7 Abs. 3 Nr. 4 UWG) | ❌ |
| Suppression-/Sperrliste | ❌ |
| Verarbeitung von Widersprüchen (Art. 21 Abs. 2-3 DSGVO) | ❌ |
| Einwilligungsspeicherung mit Nachweis (Art. 7 Abs. 1) | ❌ |
| Double-Opt-in-Protokoll | ❌ |

**Das ist ein blockierender Befund für jede Form von E-Mail-Werbung**, unabhängig von der Rechtsgrundlage. Ein Werbeversand ohne Sperrlistenmechanik ist nicht rechtskonform durchführbar, selbst mit Einwilligung.

## E.9 Wo ein Versand ausgelöst werden könnte — abschließende Aufzählung

Präzise Antwort auf die Frage, wo ein Versand technisch angestoßen werden könnte:

| # | Möglicher Auslösepunkt | Bewertung |
|---|---|---|
| 1 | **Ein n8n-Workflow mit Service-Role-Key** liest `cogniiq_receptionist_leads` und versendet | **Der einzige realistische Pfad.** Der Service-Role-Key umgeht RLS; die neue RLS-Grenze hindert ihn **nicht**. Aus dem Repository nicht prüfbar → **NEEDS BUSINESS CONFIRMATION** |
| 2 | Manueller Export durch den Owner (Copy-Paste, CSV) und Versand über ein externes Tool | Kein technischer Mechanismus, aber der praktisch naheliegendste Weg. Organisatorisch zu regeln |
| 3 | Eine künftige Edge Function mit Service-Role-Key | Existiert nicht. Die Migration hält ausdrücklich fest, dass dieser Weg „fully open for any future ingestion" bleibt |
| 4 | `pg_cron` + `pg_net` direkt aus der Datenbank | Technisch möglich, **kein solcher Job definiert** |
| 5 | Resend-API-Key direkt genutzt | Der Key liegt als Function Secret; jede Nutzung erforderte neuen Code |

> ### ✅ Feststellung zu Teil E
> **Es ist im Repository kein automatischer Cold-E-Mail-Versand aktiv, und es existiert keiner, der versehentlich aktiviert werden könnte.** Es gibt keine Warteschlange, keinen Zeitplan und keinen Codepfad, der die Lead-Tabelle liest.
> Der einzige nicht ausschließbare Pfad liegt **außerhalb dieses Repositories** (n8n) und ist durch Inhaberauskunft zu klären.
>
> **Status BLOCKED bleibt bestehen** — nicht wegen eines aktiven Mechanismus, sondern weil die rechtlichen Voraussetzungen (Art. 14, Interessenabwägung, Sperrliste) fehlen.

## E.10 B2B Cold Calling — getrennte Analyse

Rechtlich ein **anderer Sachverhalt** als Cold E-Mail und nicht mit ihm zu vermengen.

| | **Cold E-Mail B2B** | **Cold Call B2B** |
|---|---|---|
| Norm | § 7 Abs. 2 Nr. 2 UWG | § 7 Abs. 2 Nr. 1 UWG |
| Voraussetzung | **vorherige ausdrückliche Einwilligung** | **mutmaßliche Einwilligung** |
| Auslegung | Eng. Keine Ausnahme für „passende" Angebote. § 7 Abs. 3 UWG greift nur bei bestehender Kundenbeziehung | Vom BGH eng ausgelegt: erforderlich ist ein **konkreter, aus den Umständen ableitbarer sachlicher Bezug** des Angebots zur Geschäftstätigkeit des Angerufenen |
| Nachweis | Double-Opt-in mit Protokoll | Dokumentierte Vorabrecherche **je Adressat** |
| Im Repository vorbereitet | `outreach_channel='email'` | `outreach_channel='phone'` |
| Bewertung | ❌ **Ohne Einwilligung nicht durchführbar** | ⚠️ **Gangbar mit Dokumentationsdisziplin** |

**Warum der telefonische Weg hier der belastbare ist:**

Das Feld **`fit_notes`** ist genau der Ort, an dem die mutmaßliche Einwilligung begründet wird. Es gehört die **praxisbezogene, nachprüfbare Feststellung** hinein, warum dieser konkrete Adressat ein sachliches Interesse an einem KI-Telefonassistenten hat — etwa: telefonische Nichterreichbarkeit bei Testanrufen, in Google-Bewertungen dokumentierte Erreichbarkeitsbeschwerden, Praxisgröße ohne eigene Rezeption.

Die Felder `google_rating` und `review_count` sind dafür verwertbare Indizien. Ein `fit_score` ohne nachvollziehbare Begründung ist es **nicht**.

**Weiterhin erforderlich, auch beim Telefonweg:**
1. Art.-14-Information **beim Erstkontakt**, spätestens am Ende des Gesprächs (Art. 14 Abs. 3 lit. b).
2. Dokumentierte Interessenabwägung nach Art. 6 Abs. 1 lit. f.
3. Sperrliste, die Widersprüche dauerhaft festhält.
4. Keine Anrufe außerhalb üblicher Geschäftszeiten.
5. Klare Identifikation zu Gesprächsbeginn (§ 7 Abs. 2 Nr. 4 UWG — Rufnummernunterdrückung ist unzulässig).

`NEEDS LAWYER REVIEW` — insbesondere zur Frage, welcher Dokumentationsstandard für die mutmaßliche Einwilligung bei Heilberufen genügt.

---

# TEIL F — GOOGLE-DATENFLUSS

## F.0 Prüfauftrag

Das Finding aus dem Erstaudit („`/webhook/google-ads` spielt möglicherweise Klardaten an Google Ads zurück") sollte bewiesen oder verworfen werden.

> ## Ergebnis
> **Browserseitig vollständig WIDERLEGT.** Kein Cogniiq-Frontend-Code überträgt Name, E-Mail oder Telefonnummer an Google — weder im Klartext noch gehasht. Das ist mit Codebeleg nachweisbar.
>
> **Serverseitig UNKNOWN.** Was der n8n-Workflow hinter dem Endpunkt tut, ist aus dem Repository nicht feststellbar. Der Name des Endpunkts ist das **einzige** Indiz und beweist nichts.
>
> **Das ursprüngliche Finding wird hiermit von „wahrscheinlich" auf „ungeklärt, browserseitig ausgeschlossen" herabgestuft.**

## F.1 FORM — welche Felder erhoben werden

### F.1.1 Demoformular (der Endpunkt mit dem Namen `google-ads`)

`src/pages/KiTelefonassistentDemoPage.tsx:82-93`:

| Feld | Personenbezug |
|---|---|
| `name` | **ja, direkt** |
| `email` | **ja, direkt** |
| `phone` | **ja, direkt** |
| `company` | ja, im Kontext |
| `industry` | nein |
| `company_size` | nein |
| `message` | ja, potenziell |
| `primary_interest` | konstant `"KI Telefonassistent Demo"` |
| `source` | konstant `"ki-telefonassistent-demo"` |
| `submitted_at` | ISO-Zeitstempel |
| `page_url` | `window.location.href` |

### F.1.2 Kontaktformular → `/webhook/contacts`

`src/components/ContactSection.tsx:393-400`: gesamtes `data`-Objekt (`name`, `email`, `company`, `industry`, `timeline`, `goal`) plus `source: 'kontakt-page'`, `page_url`, **`referrer`** (`document.referrer`).

### F.1.3 FAQ-Rückfrage → `/webhook/faq`

`src/components/FAQQuestionModal.tsx:85-90`: `name`, `email`, `phone` (nullable), `question`.

## F.2 ENDPOINT

`src/config/externalEndpoints.ts` — die vollständige Datei:

```ts
export const N8N_ENDPOINTS = {
  contact: 'https://n8n.cogniiq.co/webhook/contacts',
  faqQuestion: 'https://n8n.cogniiq.co/webhook/faq',
  receptionistDemo: 'https://n8n.cogniiq.co/webhook/google-ads',
} as const;
```

Alle drei zeigen auf **`n8n.cogniiq.co`**, die selbst betriebene Automationsumgebung. **Kein Formular spricht direkt mit einer Google-Domain.** Der Transport erfolgt per `fetch` mit `Content-Type: application/json`, ohne Credentials, ohne Cookies.

> **`/webhook/google-ads` ist ein n8n-Webhook-Pfadname, kein Google-Endpunkt.** Der Name beschreibt mutmaßlich die *Kampagnenherkunft* der Leads (Demo-Seite als Ziel von Google-Ads-Anzeigen), nicht ein Übertragungsziel. Das ist eine Hypothese, keine Feststellung.

## F.3 PROCESSING

**Nicht rekonstruierbar.** Die n8n-Workflow-Definitionen sind nicht im Repository und zu keinem Commit gewesen.

Was feststeht: Die Antwort wird auf `res.ok` geprüft (`KiTelefonassistentDemoPage.tsx:106`) — das Frontend erfährt lediglich, ob n8n den Eingang bestätigt hat, sonst nichts.

## F.4 GOOGLE? — die entscheidende Prüfung

### F.4.1 Was das Frontend nach Google sendet

Vollständige Rekonstruktion von `src/lib/consent.ts`:

| Aufruf | Nutzlast | Fundstelle |
|---|---|---|
| `gtag('consent','default',{...})` | Vier Consent-Signale, alle `denied`, plus `wait_for_update: 500` | `:229-235` |
| `gtag('consent','update',{...})` | Dieselben vier Signale mit dem gewählten Zustand | `:248-253` |
| `gtag('js', new Date())` | Zeitstempel | `:167` |
| `gtag('config', id)` | **Nur die Produkt-ID.** Kein zweites Argument, kein Objekt | `:175` |
| `gtag('event', name, {...})` | `page_path` + optional `cta_label` | `:373-379` |

### F.4.2 Negativbefunde — jeweils repository-weit verifiziert

| Geprüft | Treffer | Bedeutung |
|---|---|---|
| `user_data` als gtag-Parameter | **0** | Enhanced Conversions sind der einzige gtag-Weg, PII zu übergeben, und laufen zwingend über `user_data`. **Nicht vorhanden** |
| `send_to` | **0** | Keine explizite Conversion-Label-Zuordnung |
| SHA-256-Hashing von PII im Frontend | **0** | Die einzigen `crypto.subtle`-Nutzungen liegen in `src/lib/gateway/cqgw1.ts` (Ed25519-Signatur des Club-Gateways) — vollständig unbeteiligt |
| `gtag('set', 'user_data', …)` | **0** | — |
| Google-Ads-Conversion-API / Offline-Conversion-Upload | **0** | Kein Code, keine Bibliothek, kein Endpunkt |
| Direkter `fetch` an eine Google-Domain | **0** | Die einzigen Google-Kontakte sind `googletagmanager.com` (Tag-Bibliothek) und `google.com/maps` (Karte nach Klick) |

### F.4.3 Der Beweis, dass keine PII durchrutschen kann

`trackEvent()` ist die **einzige** Funktion, die ein Event an Google sendet. Ihre Signatur:

```ts
export function trackEvent(event: ConversionEvent, label?: string)
```

- `event` ist ein **geschlossener Union-Typ** aus 13 handgeschriebenen Konstanten (`:339-372`). Ein Freitext ist typseitig ausgeschlossen.
- `label` wird **ausschließlich** von Aufrufstellen mit Literalen versorgt.
- `page_path` ist `window.location.pathname` — **ohne Query-String**, ausdrücklich kommentiert: *„carries no query string for exactly that reason — a stray `?email=…` must not reach GA4."*
- Es existiert **kein Parameter**, durch den ein Formularwert übergeben werden könnte.

Der Aufruf im Demoformular lautet `trackEvent("lead_submitted", "demo")` (`KiTelefonassistentDemoPage.tsx:110`) — zwei Literale, keine Daten aus `payload`.

### F.4.4 Zusätzliche Absicherung

Vor einer Analytics-Einwilligung wird das Event **verworfen**:
```ts
if (getStoredConsent()?.analytics !== 'granted') return;   // :370
```
Ohne Einwilligung erreicht Google gar nichts — der `dataLayer` bleibt unberührt.

## F.5 Abgleich mit der Datenschutzerklärung

`src/lib/legal-content.tsx`, Abschnitt 7, sichert zu:

> „Wir übermitteln keine Klardaten wie Namen, E-Mail-Adressen oder Inhalte von Kontaktformularen an Google."

| Ebene | Bewertung |
|---|---|
| **Browser / Frontend** | ✅ **Die Aussage ist zutreffend und durch Code belegbar.** Es existiert kein Mechanismus, der sie verletzen könnte |
| **Serverseitig (n8n)** | ⚠️ **Nicht verifizierbar.** Führt der n8n-Workflow einen Offline-Conversion-Upload oder Enhanced Conversions for Leads durch, wäre die Aussage **objektiv falsch** — und zwar auch dann, wenn die Daten gehasht übertragen werden, denn gehashte E-Mail-Adressen bleiben personenbezogene Identifikatoren |

**Kritisch ist die Formulierung „Wir übermitteln":** Sie unterscheidet nicht zwischen Browser und Server. Ein Leser versteht sie als Aussage über die gesamte Verarbeitung. Sie deckt damit auch den n8n-Pfad ab — und ist nur dann haltbar, wenn dieser Pfad ebenfalls sauber ist.

## F.6 Erforderliche Klärung

**NEEDS BUSINESS CONFIRMATION — höchste Priorität unter allen offenen Inhaberfragen.**

Zu beantworten durch Öffnen des n8n-Workflows hinter `/webhook/google-ads`:

1. Welche Knoten enthält er?
2. Gibt es einen HTTP-Request-Knoten mit Ziel `googleads.googleapis.com` oder `google.com`?
3. Wird ein **Offline Conversion Import** oder **Enhanced Conversions for Leads** ausgeführt?
4. Werden E-Mail-Adresse oder Telefonnummer **gehasht** (SHA-256) und übertragen? *(Gehashte Identifikatoren bleiben personenbezogen — die Hashfunktion ändert daran nichts.)*
5. Wohin gehen die Daten sonst — Google Sheets, CRM, Mailbox?
6. Wie lange werden die Daten in n8n vorgehalten?
7. Bei welchem Hoster und in welchem Land läuft die Instanz?

### Handlungsoptionen je Ergebnis

| Ergebnis | Maßnahme |
|---|---|
| **Kein Google-Kontakt** | Finding schließen. Empfehlung: Webhook-Pfad zu `/webhook/demo-lead` umbenennen — der Name hat diese gesamte Prüfung ausgelöst und wird es bei jedem künftigen Audit wieder tun |
| **Klartext-PII an Google** | **P0.** Sofort abschalten. Datenschutzerklärung war unzutreffend. Rechtsgrundlage fehlt (die Einwilligung des Besuchers deckt eine Übermittlung seiner Kontaktdaten an Google nicht). Vorfallsbewertung nach Art. 33 erforderlich |
| **Gehashte PII an Google** | **P0.** Rechtlich im Ergebnis gleich zu behandeln: pseudonymisiert ist nicht anonym. Datenschutzerklärung ist zu korrigieren, Rechtsgrundlage und Drittlandtransfer sind zu dokumentieren |
| **Nur aggregierte Conversion-Zählung ohne Identifikatoren** | Zulässig bei erteilter Marketing-Einwilligung; in der Datenschutzerklärung zu ergänzen |

## F.7 Zusammenfassung Teil F

| Feststellung | Status |
|---|---|
| Formulare senden an n8n, nicht an Google | **PROVEN** |
| Frontend überträgt keine PII an Google — weder Klartext noch gehasht | **PROVEN** |
| `trackEvent()` kann PII strukturell nicht übertragen | **PROVEN** |
| Kein Enhanced-Conversions-Code vorhanden | **PROVEN** |
| Ohne Analytics-Einwilligung erreicht Google nichts | **PROVEN** |
| Der n8n-Workflow überträgt PII an Google | **UNKNOWN** |
| Der Endpunktname belegt eine Google-Übermittlung | **FALSE** — er ist ein Indiz, kein Beweis |
| Die Zusage der Datenschutzerklärung ist browserseitig zutreffend | **PROVEN** |
| Die Zusage ist insgesamt zutreffend | **UNKNOWN** |
