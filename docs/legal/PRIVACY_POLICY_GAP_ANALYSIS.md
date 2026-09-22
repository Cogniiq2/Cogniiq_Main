# DATENSCHUTZERKLÄRUNG vs. TATSÄCHLICHE VERARBEITUNG

**Erstellt:** 2026-09-22
**Geprüftes Dokument:** `src/lib/legal-content.tsx` → `DatenschutzContent()`, Route `/datenschutz`, Stand `LEGAL_LAST_UPDATED = '2026-08-28'`
**Methode:** Abschnittsweiser Abgleich gegen den rekonstruierten Code.

> **Diese Analyse formuliert bewusst keine neue Datenschutzerklärung.** Mehrere Lücken hängen an technischen Entscheidungen, die noch offen sind (Oura-Entfernung, Spline-Option, n8n-Klärung, Google-Webhook). Eine Neufassung vor diesen Entscheidungen müsste zweimal geschrieben werden — und die zweite Fassung wäre die, die zählt.

## Vorbemerkung zur Qualität des Bestands

Die vorhandene Erklärung ist **kein Textbaustein-Generator-Produkt**. Sie ist erkennbar gegen den realen Code geschrieben: Sie benennt den konkreten `localStorage`-Schlüssel, den konkreten GA4-Cookie-Namen, den Consent-Mode in der **Basis**-Variante, die Unabhängigkeit der beiden Zwecke, und sie sagt ausdrücklich, dass Daten pseudonym und **nicht anonym** sind. Solche Sätze schreibt kein Generator.

Die folgenden Lücken sind vor diesem Hintergrund zu lesen: Es geht um **Vollständigkeit**, nicht um Qualität.

---

## TABELLE A — MISSING DISCLOSURE
*Verarbeitung findet statt, wird aber nicht offengelegt.*

| # | Fehlende Offenlegung | Tatsächliche Verarbeitung (Beleg) | Rechtsgrundlage der Pflicht | Prio |
|---|---|---|---|---|
| **A-01** | **Spline (`prod.spline.design`)** | IP, User-Agent und Referrer gehen an einen Drittanbieter, sobald der Desktop-Hero rendert (WebGL, kein reduced-motion/save-data). `DesktopHero.tsx:78-96, 206` | Art. 13 Abs. 1 lit. e, Abs. 1 lit. f DSGVO | **P1** |
| **A-02** | **Google Maps** | Zwei-Klick-Embed, beim Klick gehen IP und User-Agent an Google. Technisch vorbildlich umgesetzt, aber **in keinem Abschnitt genannt**. `ConsentMapEmbed.tsx:23-33` | Art. 13 Abs. 1 lit. e DSGVO | **P1** |
| **A-03** | **`referrer` und `page_url` bei jeder Formularübermittlung** | `ContactSection.tsx:397-398` sendet `document.referrer` und `window.location.href` mit; die Demo-Seite sendet `page_url` und `submitted_at`. Abschnitt 4 nennt nur „Name, E-Mail-Adresse, Telefonnummer, Nachricht" | Art. 13 Abs. 1 lit. c DSGVO | **P1** |
| **A-04** | **Speicherdauer / Löschfristen — durchgängig** | Kein einziger Abschnitt nennt eine Frist. Technisch existiert eine Purge-Policy (`20260910130000_owner_purge_policy.sql`, `storage-purge-worker`), deren Fristen aber nirgends dokumentiert sind | **Art. 13 Abs. 2 lit. a DSGVO** — ausdrückliche Pflichtangabe | **P1** |
| **A-05** | **Empfängerkategorien unvollständig** | Genannt: Cloudflare, n8n, Google, Supabase, Resend. Nicht genannt: Spline, Google Maps, der Club-Operations-Gegenstelle, der n8n-Hoster als Unterauftragsverarbeiter | Art. 13 Abs. 1 lit. e DSGVO | **P1** |
| **A-06** | **Drittlandgarantien nur für Google** | Für Google sind DPF und SCC sauber benannt. Für **Cloudflare, Resend, Spline** fehlt jede Angabe zu Übermittlung und Garantien | Art. 13 Abs. 1 lit. f DSGVO | **P1** |
| **A-07** | **Oura — Gesundheitsdaten** | 12 Tabellen, Edge Function, Admin-Route. **In keinem Abschnitt erwähnt.** *(Entfällt mit der beschlossenen Entfernung — bis dahin eine Lücke)* | Art. 13, Art. 9 DSGVO | **P0** bis zur Entfernung |
| **A-08** | **Club-Operations-Gateway** | Cogniiq verarbeitet Mitgliederdaten eines Kunden (`club-operations-read`, `src/solutions/club-operations/**`). Betrifft die Auftragsverarbeiter-Rolle; gehört in den AVV, ein Hinweis auf die Rollentrennung gehört aber auch in die Erklärung | Art. 13 DSGVO / Transparenz | **P2** |
| **A-09** | **Lead-Datenbank (`cogniiq_receptionist_leads`)** | 50 Datensätze Dritter. **Nicht in der Datenschutzerklärung — und das ist auch nicht der richtige Ort.** Hierfür ist ein eigenes **Art.-14-Informationsblatt** erforderlich | Art. 14 DSGVO | **P0** |
| **A-10** | **Protokollierung in der Signaturstrecke** | `public_offer_by_token()` schreibt `event_type` und `user_agent_summary` (max. 200 Zeichen) in `owner_document_access_events`; die Annahme schreibt Signaturname, -firma, -e-mail und Betrag fort. Abschnitt 8 beschreibt den Prozess, **nicht die Protokollierung** | Art. 13 Abs. 1 lit. c DSGVO | **P2** |
| **A-11** | **Legacy-Speicherschlüssel `cogniiq_consent_v1`** | Wird weiterhin gelesen und migriert (`consent.ts:39, 98-108`). Abschnitt 5 nennt nur `cogniiq_consent_v2` | Art. 13 DSGVO / § 25 TDDDG | **P3** |
| **A-12** | **Legacy-Analytics-Cookie `_ga_K7BS3LKT6H`** | Wird beim Widerruf aktiv gelöscht (`consent.ts:196`), also adressiert das System es. Abschnitt 7 nennt nur `_ga_NDN9J2G5LM` | Art. 13 DSGVO | **P3** |
| **A-13** | **Kein Hinweis zur Nichtbenennung eines DSB** | Üblich und erwartbar. Ob ein DSB zu benennen ist, ist wegen der Lead-Datenbank und (bis zur Entfernung) der Art.-9-Daten nach § 38 Abs. 1 S. 2 BDSG i. V. m. Art. 37 Abs. 1 lit. b/c DSGVO **ohnehin zu prüfen** | § 13 Abs. 1 lit. b DSGVO | **P2** `NEEDS LAWYER REVIEW` |
| **A-14** | **Keine Angabe zu automatisierten Entscheidungen / Profiling** | Nach eigener Prüfung findet **keine** Art.-22-Entscheidung statt — eine negative Feststellung („Eine automatisierte Entscheidungsfindung findet nicht statt") ist gleichwohl üblich und schafft Klarheit. **Ausnahme: `fit_score` in der Lead-Datenbank** gehört in das Art.-14-Blatt | Art. 13 Abs. 2 lit. f DSGVO | **P3** |

---

## TABELLE B — STALE / INCORRECT DISCLOSURE
*In der Datenschutzerklärung genannt, findet so aber nicht oder nicht nachweisbar statt.*

| # | Aussage | Befund | Bewertung | Prio |
|---|---|---|---|---|
| **B-01** | *„Wir übermitteln keine Klardaten wie Namen, E-Mail-Adressen oder Inhalte von Kontaktformularen an Google."* (Abschn. 7) | **Browserseitig PROVEN zutreffend** — kein `user_data`, kein `send_to`, kein PII-Hashing, `trackEvent()` kann strukturell keine PII übertragen. **Serverseitig UNKNOWN** — der n8n-Workflow hinter `/webhook/google-ads` ist nicht einsehbar. Die Formulierung „Wir übermitteln" umfasst beide Ebenen | **UNKNOWN**, nicht falsch. Klärung erforderlich, danach entweder bestätigen oder korrigieren | **P1** |
| **B-02** | *„Diese Website wird über Cloudflare (Cloudflare, Inc.) gehostet"* (Abschn. 3) | Zutreffend (`wrangler.jsonc`, Pages Functions). **Unvollständig:** keine Angabe zu Drittlandübermittlung und Garantien | **CONDITIONALLY TRUE** | **P1** |
| **B-03** | *„eine selbst betriebene Automatisierungsumgebung (n8n, gehostet unter n8n.cogniiq.co)"* (Abschn. 4) | „Selbst betrieben" ist **aus dem Repository nicht verifizierbar.** Läuft die Instanz bei einem Hoster (Hetzner, DigitalOcean, n8n Cloud), ist dieser **Unterauftragsverarbeiter** und zu nennen. Die Formulierung suggeriert, es gebe keinen weiteren Beteiligten | **UNKNOWN** → `NEEDS BUSINESS CONFIRMATION` | **P1** |
| **B-04** | *„Für Authentifizierung und die Speicherung der zugehörigen Kundendaten nutzen wir Supabase."* (Abschn. 8) | Zutreffend, aber **deutlich zu knapp** für das, was tatsächlich verarbeitet wird: Projekte, Aufgaben, Dokumente, Rechnungen, Zahlungen, Signaturen, Organisationszugehörigkeit, Storage. Keine Angabe zu Region (`eu-central-1`) oder Drittlandbezug | **CONDITIONALLY TRUE**, unvollständig | **P2** |
| **B-05** | *„Für den Versand transaktionaler E-Mails … setzen wir Resend ein."* (Abschn. 8) | Zutreffend (`send-offer-document-email`). Keine Angabe zu Sitz, Verarbeitungsort oder Drittlandgarantien | **CONDITIONALLY TRUE**, unvollständig | **P2** |
| **B-06** | *„Angebote werden über einen zugriffsgeschützten, nicht indexierbaren Dokument-Link bereitgestellt und dort **rechtsgültig signiert**."* (Abschn. 8) | Der Zugriffsschutz (Token-RPC) und `noindex` (`public/_headers`) sind **korrekt**. „Rechtsgültig signiert" ist eine Vereinfachung: Es handelt sich um eine **einfache elektronische Signatur** (im Code so benannt: `'simple_electronic_signature'`, `20260723125000_...sql:688`). Für formfreie B2B-Verträge genügt das; wo § 126 BGB Schriftform verlangt, nicht | **CONDITIONALLY TRUE** — Präzisierung empfohlen | **P3** |
| **B-07** | *„Diese Speicherung ist für den Betrieb der Website erforderlich, dient nicht der Analyse und findet ohne gesonderte Einwilligung statt (§ 25 Abs. 2 TDDDG)."* (Abschn. 5) | Für Consent- und Theme-Speicherung **zutreffend und gut begründet**. Die Aufzählung ist jedoch nicht abschließend: `oura_connection_id` (bis zur Entfernung) und ggf. von Spline gesetzte Einträge sind nicht erfasst | **CONDITIONALLY TRUE** | **P2** |
| **B-08** | *„Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. Art. 6 Abs. 1 lit. f DSGVO"* (Abschn. 4) | Sachlich vertretbar. Das „bzw." lässt aber offen, welche Grundlage **wann** gilt — Art. 13 Abs. 1 lit. c verlangt eine eindeutige Zuordnung je Verarbeitung | **CONDITIONALLY TRUE** | **P3** |
| **B-09** | *„Wir setzen angemessene technische und organisatorische Maßnahmen ein"* (Abschn. 1) | **Materiell zutreffend** (RLS, private Buckets, JWT-Verifikation, signiertes Gateway). **Aber:** Es existiert **kein TOM-Dokument**, und die Sicherheits-Header fehlen vollständig. Die Aussage ist damit belegbar, aber nicht belegt | **CONDITIONALLY TRUE** | **P1** |
| **B-10** | Aufzählung der Betroffenenrechte (Abschn. 9) | Inhaltlich **vollständig und korrekt** (Art. 15-21, Art. 7 Abs. 3, Beschwerderecht mit BayLDA als zuständiger Behörde). **Aber:** Es existiert **kein technischer Prozess**, um sie zu erfüllen — kein Datenexport, keine Löschstrecke, keine Auskunftsvorlage | Aussage **VERIFIED**, Umsetzung fehlt | **P2** |
| **B-11** | *„Bei Fragen zum Datenschutz erreichen Sie uns unter {C.email}"* (Abschn. 10) | Zutreffend, dieselbe Adresse wie im Impressum | **VERIFIED** | — |

---

## Was ausdrücklich korrekt ist

Diese Punkte sind geprüft und sollen bei einer Überarbeitung **unverändert erhalten bleiben**:

| Aussage | Warum sie gut ist |
|---|---|
| Google Ads und GA4 werden **ausschließlich nach ausdrücklicher Einwilligung** geladen; vorher kein Skript, kein Cookie, keine Übermittlung | Durch `consent.ts` vollständig belegt — und strenger als bei den meisten deutschen Websites |
| **Consent Mode v2 in der Basis-Variante**, ausdrücklich nicht Advanced | Präzise und technisch korrekt (`consent.ts:13-16`) |
| Unabhängigkeit von Marketing- und Statistik-Einwilligung, beliebige Reihenfolge | Entspricht der Implementierung (`consent.ts:270-290`) |
| *„Diese Daten sind **pseudonym, aber nicht anonym**"* | Ehrlicher als die branchenübliche Formulierung und rechtlich korrekt |
| Konkrete Nennung von `cogniiq_consent_v2`, `_ga`, `_ga_NDN9J2G5LM` | Nachprüfbar statt generisch |
| *„eine hundertprozentige Sicherheit … kann jedoch nicht garantiert werden"* | Kein Absolutversprechen |
| Bayerisches Landesamt für Datenschutzaufsicht als Beschwerdestelle | Zuständigkeit korrekt |
| *„die Website ist ohne diese Einwilligungen uneingeschränkt nutzbar"* | Zutreffend — keine Cookie-Wall |
| Hinweis, dass bereits übermittelte Daten nicht nachträglich zurückgezogen werden können | Ehrlich; viele Erklärungen verschweigen das |

---

## Reihenfolge der Überarbeitung

Die Datenschutzerklärung ist **zuletzt** zu überarbeiten, nachdem diese Entscheidungen gefallen sind:

| # | Vorgelagerte Entscheidung | Betrifft |
|---|---|---|
| 1 | **Oura entfernt?** | A-07 entfällt oder muss ergänzt werden |
| 2 | **Spline: A, B oder C?** | A-01 entfällt bei Self-Hosting (Option B) vollständig |
| 3 | **n8n: Hoster, Land, Löschfrist?** | B-03, A-04, A-05, A-06 |
| 4 | **Google-Webhook: was passiert dort?** | B-01 — entweder bestätigen oder korrigieren |
| 5 | **Löschkonzept beschlossen?** | A-04 |
| 6 | **AVV und TOM erstellt?** | B-09 wird belegbar |
| 7 | **B2B-Klarstellung beschlossen?** | Adressatenkreis der gesamten Erklärung |

**Erst danach eine Fassung schreiben — eine, nicht zwei.**

## Sofort möglich, unabhängig von allen Entscheidungen

Drei Ergänzungen hängen an keiner offenen Frage und können vorgezogen werden:

1. **A-02 (Google Maps)** — die Verarbeitung ist stabil, technisch sauber gelöst und beschreibbar.
2. **A-03 (`referrer`, `page_url`)** — ein Satz in Abschnitt 4.
3. **A-11/A-12 (Legacy-Schlüssel und -Cookie)** — je ein Halbsatz in den Abschnitten 5 und 7.
