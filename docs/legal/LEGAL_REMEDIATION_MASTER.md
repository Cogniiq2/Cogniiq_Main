# LEGAL REMEDIATION MASTER

**Erstellt:** 2026-09-22
**Zweck:** Validierung sämtlicher Findings aus `LEGAL_COMPLIANCE_AUDIT_2026.md` gegen die tatsächliche Implementierung, plus verbindliche Remediation-Roadmap.
**Grundsatz:** Keine Vermutung wird als Tatsache dargestellt. Jeder Status ist belegt oder als unbelegt gekennzeichnet.

**Status-Legende**
| Status | Bedeutung |
|---|---|
| `PROVEN` | Durch Code, Migration, Git-Historie oder dokumentierte Produktionsprüfung belegt |
| `PARTIALLY PROVEN` | Kern belegt, Umfang oder Wirkung teilweise offen — oder das Erstaudit war zu weit gefasst |
| `UNKNOWN` | Weder belegbar noch widerlegbar aus dem Repository |
| `FALSE POSITIVE` | Nachweislich unzutreffend — Finding wird zurückgezogen |
| `BEST PRACTICE ONLY` | Kein Rechtsverstoß, Empfehlung |

**Prioritäten:** `P0` sofort · `P1` vor nächstem Kunden · `P2` vor Skalierung · `P3` Best Practice

---

# ⚠️ CRITICAL LIVE RISKS

Zwei Befunde betreffen den **laufenden** Betrieb und waren im Erstaudit nicht enthalten. Beide wurden nur gemeldet, **nichts wurde verändert.**

## CLR-1 — `sync-oura` ist eine unauthentifizierte Service-Role-Edge-Function

**Status: PROVEN**

`supabase/config.toml` enthält:
```toml
[functions.sync-oura]
verify_jwt = false
```

Die Funktion führt **keine eigene Authentifizierung** durch — vollständige Durchsicht von `supabase/functions/sync-oura/index.ts`: kein `Authorization`-Header wird gelesen, kein `auth.getUser()`, kein Shared Secret, kein Origin-Check. Sie nutzt `SUPABASE_SERVICE_ROLE_KEY` (`:453`), der RLS umgeht, und akzeptiert `connection_id` frei aus dem Body (`:470`). CORS steht auf `*` (`:9`).

**Gegenbeweis, dass das produktiv wirkt:** Das Frontend sendet **keinen** `Authorization`-Header (`OuraAnalyticsPage.tsx:1157-1161`). Der Aufruf kann nur funktionieren, wenn `verify_jwt = false` aktiv ist.

**Was möglich ist — und was nicht:**

| Möglich | Nicht möglich |
|---|---|
| Unauthentifizierter Aufruf durch jeden, der die URL kennt (steht im öffentlichen JS-Chunk) | **Kein Auslesen von Gesundheitsdaten** — die Antwort enthält nur Zähler (`:509-521`) |
| Orakel: 404 vs. 200 bestätigt eine geratene `connection_id` | Enumeration praktisch ausgeschlossen (UUIDv4, ~122 Bit) |
| Mit bekannter `connection_id`: Erzwingen beliebig vieler Syncs — Oura-Quota, Schreiblast, Kosten. Kein Rate-Limiting | Kein Einschleusen beliebiger Werte — Daten kommen nur von `api.ouraring.com` |

**Einstufung:** Fehlkonfiguration mit realem Missbrauchspotenzial, **ohne nachgewiesenen Pfad zur Offenlegung von Gesundheitsdaten.**

**Empfohlene Sofortmaßnahme (beweisneutral, vernichtet keine Evidenz):** Widerruf der Oura-OAuth-Autorisierung im Oura-Konto. Macht die gespeicherten Tokens wertlos und entwertet CLR-1 praktisch vollständig. Alternativ `supabase functions delete sync-oura`. **Nicht ohne Ihre Freigabe ausgeführt.**

## CLR-2 — Kein Nachweis, dass die Oura-Behebung jemals auf Produktion lief

**Status: UNKNOWN — und das ist der Punkt**

`20260731122000_case_d_legacy_convergence.sql` schließt die Exposition im Code. Sie steht **nicht** in der Produktions-Allowlist (`.github/scripts/lib/supabase-migration-allowlist.mjs` — 13 Einträge: `20260711120000`, dann `20260826120000` bis `20260904120000`).

**Wichtige Einschränkung, damit hieraus nichts Falsches gefolgert wird:** Die Allowlist steuert nur den GitHub-Actions-Workflow. Ihr Kopfkommentar stellt fest: *„A prerequisite does NOT have to be allowlisted itself — it only has to be applied."* Die gesamte Owner-Finance-Kette fehlt ebenfalls und ist nachweislich angewendet. **Das Fehlen beweist nichts.**

**Konsequenz:** Es ist **nicht auszuschließen**, dass die drei Policies `Allow frontend read oura activity/readiness/sleep` mit `roles={public}, qual=true` heute noch aktiv sind — und Gesundheitsdaten weiterhin mit dem öffentlichen anon-Key lesbar wären.

**Eine einzige SQL-Abfrage klärt das:**
```sql
select tablename, policyname, roles, qual from pg_policies
where schemaname='public' and tablename like 'oura%';
```
**Das ist die dringendste Einzelmaßnahme dieses gesamten Dokuments** — und muss vor jeder Löschung erfolgen.

---

# TEIL A — VALIDIERUNG DER FINDINGS

## A.1 Zusammenfassung

| Status | Anzahl |
|---|---|
| `PROVEN` | 24 |
| `PARTIALLY PROVEN` | 8 |
| `UNKNOWN` | 6 |
| `FALSE POSITIVE` | 2 |
| `BEST PRACTICE ONLY` | 2 |
| **Neu hinzugekommen** | 4 (CLR-1, CLR-2, R-41, R-42) |

**Zwei Findings des Erstaudits werden zurückgezogen, sechs werden in Umfang oder Einstufung korrigiert.**

## A.2 Validierungstabelle

| ID | Finding | Status | Evidence | Affected Files | Legal Basis | Actual Risk | Technical Fix | Document Fix | Owner Input | Lawyer | Prio |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **CLR-1** | `sync-oura` unauthentifiziert erreichbar (`verify_jwt=false`, keine eigene Authz, CORS `*`, service_role) | **PROVEN** | `supabase/config.toml:1-2`; `sync-oura/index.ts` ohne jede Authz; Frontend sendet keinen Auth-Header (`OuraAnalyticsPage.tsx:1157-1161`) | `supabase/config.toml`, `supabase/functions/sync-oura/index.ts` | Art. 32 Abs. 1 DSGVO | **Mittel** — Missbrauch/Kosten möglich, **keine** Datenoffenlegung | Function löschen (R-2) oder Secret-Check | Vorfallsakte | ✅ Freigabe | ⚠️ | **P0** |
| **CLR-2** | Anwendung der Oura-Behebung auf Produktion nicht belegt | **UNKNOWN** | Nicht in `supabase-migration-allowlist.mjs`; kein Anwendungsnachweis im Repo | `20260731122000_case_d_legacy_convergence.sql` | Art. 32, 33 DSGVO | **Potenziell hoch** — Exposition ggf. fortdauernd | Verifikationsabfrage V1 | Vorfallsakte | ✅ | ✅ | **P0** |
| **R-01** | Lead-PII 34 Tage anon les-/schreibbar, keine Art.-33-Doku | **PROVEN** | `20260902120000_receptionist_leads_pii_rls.sql:18-36`, read-only gegen Hosted verifiziert | `20260730031350`, `20260902120000` | Art. 32, 33 Abs. 1+5, 34 DSGVO | **Hoch** | behoben ✅ | Vorfallsdoku D-27 | ✅ | ✅ | **P0** |
| **R-02** | Oura-Gesundheitsdaten anon lesbar (3 Tabellen, `qual=true`) | **PROVEN** | `20260731122000:41-44` | 12 `oura_*`-Tabellen | Art. 9, 32, 33 DSGVO | **Hoch** | behoben im Code; **Anwendung offen (CLR-2)** | Vorfallsdoku D-26 | ✅ | ✅ | **P0** |
| **R-03** | Gesundheitsdaten ohne Art.-9-Rechtsgrundlage | **PROVEN** (Verarbeitung), **UNKNOWN** (Anwendbarkeit DSGVO) | `20260709120000`; `sync-oura/index.ts`; Scope `email personal daily heartrate…` (`OuraAnalyticsPage.tsx:43`) | Oura-Gesamtbestand | Art. 9, 5, 35 DSGVO; Art. 2 Abs. 2 lit. c | **Hoch**, abhängig von Betroffenenzahl | **Entfernung beschlossen** → `OURA_REMOVAL_PLAN.md` | Löschkonzept, VVT | ✅ Wessen Daten? | ✅ | **P0** |
| **R-04** | Kein AVV-Muster, obwohl 7 Seiten AVV zusagen | **PROVEN** | Kein Dokument; Zusagen: `LeistungenPage.tsx:204`, `DeutschlandPage.tsx:200`, `WebdesignArzt.tsx:52`, `WebdesignGastronomie.tsx:111`, `WebdesignSport.tsx:56`, `WebdesignHotel.tsx:60`, `AutomatisierungSport.tsx:56,113` | 7 Seiten | Art. 28 Abs. 3 DSGVO; § 5 UWG | **Hoch** — dreifach (DSGVO + UWG + Vertrag) | — | **D-09 + D-10 + D-11** | ✅ | ✅ | **P0** |
| **R-05** | Kein Verarbeitungsverzeichnis | **PROVEN** | kein Dokument | — | Art. 30 Abs. 1+2; Ausnahme Abs. 5 greift nicht | Hoch | — | **D-12** | ✅ | ⚠️ | **P0** |
| **R-06** | Keine AGB | **PROVEN** | keine Route, kein Dokument | — | §§ 280, 631, 640 BGB; § 31 Abs. 5 UrhG | **Hoch** | — | **D-04, D-05, D-17, D-19** | ✅ | ✅ | **P0** |
| **R-07** | Art.-14-Frist für 50 Leads abgelaufen | **PROVEN** | `sourced_date = 2026-07-30` einheitlich; Frist endete 2026-08-30 | `cogniiq_receptionist_leads` | Art. 14 Abs. 3 lit. a | Hoch | — | **D-22 + D-25** | ✅ Herkunft? | ✅ | **P0** |
| **R-08** | `outreach_channel='email'` — Cold Mail ohne Einwilligung | **PARTIALLY PROVEN** — *korrigiert* | Spalte existiert (`:17`). **Aber: kein Versandmechanismus im Repository** — keine Queue, kein Cron, keine Sendefunktion, kein Codepfad liest die Tabelle | `20260730031350:17` | § 7 Abs. 2 Nr. 2 UWG | **Latent, nicht akut** | — | **D-23** Suppression-List | ✅ n8n-Workflow? | ✅ | **P0** (Freigabe), **P1** (technisch) |
| **R-09** | Keine Sicherheits-Header | **PROVEN** | `public/_headers` (99 Z.) nur `X-Robots-Tag` + `Cache-Control`; repo-weit 0 Treffer für CSP/HSTS/XCTO/Referrer/Permissions | `public/_headers`, `functions/_middleware.ts` | Art. 32; BSI TR-03108 | Hoch | **T-01** → `SECURITY_HEADERS_PLAN.md` | TOM | ❌ | ❌ | **P1** |
| **R-10** | `/d/<token>` framebar → Clickjacking | **PROVEN** | kein `frame-ancestors`; `/d` wird über `_redirects` bedient, Middleware läuft dort nicht | `public/_headers`, `PublicDocumentPortal.tsx` | Art. 32 DSGVO | **Hoch** — betrifft eine rechtsverbindliche Signaturstrecke | **T-02** — sofort und risikofrei | — | ❌ | ❌ | **P1** |
| **R-11** | Kontaktformular ohne Art.-13-Hinweis | **PROVEN** | `ContactSection.tsx` kein Datenschutz-Link; `FAQQuestionModal.tsx` ebenso. Demo-Seite **hat** einen (`:428`) | 2 Komponenten | Art. 12 Abs. 1, 13 DSGVO | Mittel | **T-03** | — | ❌ | ❌ | **P1** |
| **R-12** | Spline lädt ohne Einwilligung | **PARTIALLY PROVEN** — *Umfang korrigiert* | Lädt **nur** Desktop + WebGL + kein reduced-motion + kein save-data, verzögert bis idle (`DesktopHero.tsx:38-129`). Erstaudit war zu weit gefasst. **Tragende Norm ist Art. 6 DSGVO, nicht § 25 TDDDG** | `DesktopHero.tsx:78-96, 206` | Art. 6 Abs. 1 DSGVO | Mittel | **Option B (Self-Host)** → `SPLINE_ASSESSMENT.md` | DS-Erklärung | ✅ Lizenz? | ⚠️ | **P1** |
| **R-13** | Spline nicht in DS-Erklärung | **PROVEN** | kein Treffer in `legal-content.tsx` | `src/lib/legal-content.tsx` | Art. 13 Abs. 1 lit. e | Mittel | entfällt bei Option B | **D-02** | ❌ | ❌ | **P1** |
| **R-14** | Google Maps nicht in DS-Erklärung | **PROVEN** | `ConsentMapEmbed.tsx` vs. `legal-content.tsx` | `src/lib/legal-content.tsx` | Art. 13 DSGVO | Mittel | — | **D-02** | ❌ | ❌ | **P1** |
| **R-15** | Demo-Leads an `/webhook/google-ads` | **UNKNOWN** — *herabgestuft* | **Browserseitig PROVEN sauber:** kein `user_data`, kein `send_to`, kein PII-Hashing, `trackEvent()` strukturell PII-frei (`consent.ts:339-379`). **Serverseitig UNKNOWN** — n8n nicht einsehbar | `externalEndpoints.ts:4` | Art. 6, 13, 44 DSGVO | **UNKNOWN** | abhängig vom Ergebnis | ggf. **D-02** | ✅ **Vorrang** | ⚠️ | **P1** |
| **R-16** | n8n: Hoster, Standort, Retention unbekannt | **UNKNOWN** | `externalEndpoints.ts:1-5`; DS-Erklärung sagt „selbst betrieben" — nicht verifizierbar | `src/config/externalEndpoints.ts` | Art. 28, 30, 32, 44 | **Hoch** — jede Lead-Anfrage fließt hier durch | — | **D-09, D-11, D-12** | ✅ **Vorrang** | ⚠️ | **P1** |
| **R-17** | Keine Löschfristen in DS-Erklärung | **PROVEN** | kein Abschnitt zur Speicherdauer; Purge-Policy existiert technisch | `legal-content.tsx` | Art. 5 Abs. 1 lit. e, 13 Abs. 2 lit. a | Mittel | **T-18** | **D-13** | ✅ | ⚠️ | **P1** |
| **R-18** | Keine Subprozessorenliste | **PROVEN** | kein Dokument | — | Art. 28 Abs. 2+4 | Mittel | — | **D-11** → `PROCESSOR_INVENTORY.md` | ✅ | ❌ | **P1** |
| **R-19** | Keine TOM als Dokument | **PARTIALLY PROVEN** — *korrigiert* | Materiell zu **~85 % vorhanden** und überdurchschnittlich (`PROCESSOR_INVENTORY.md` §5). Es fehlen nur die Header und das Dokument | `docs/security-and-tenancy.md` u. a. | Art. 32, 28 Abs. 3 lit. c | Mittel | **T-01** | **D-10** | ❌ | ⚠️ | **P0** |
| **R-20** | Kein Incident-Response-Prozess | **PROVEN** | kein Dokument; zwei Vorfälle bereits eingetreten | — | Art. 33, 34 | Mittel | — | **D-14** | ✅ | ⚠️ | **P1** |
| **R-21** | CORS `*` auf 5 Edge Functions | **PROVEN** | `admin-provision-client:18`, `customer-document-download:37`, `public-document-portal:30`, `process-accepted-offer:34`, `sync-oura:9` | 5 Funktionen | Art. 32 | **Gering** — alle außer `sync-oura` prüfen JWT bzw. Token; kein Cookie-Auth, daher kein CSRF-Hebel | **T-07**; Vorbild: `clubGatewayShell.allowedOrigins` | — | ❌ | ❌ | **P2** |
| **R-22** | Kein Rate-Limiting | **PROVEN** | `unconfiguredRateLimiter` (`club-operations-read:121`); sonst keins | Edge Functions, Formulare | Art. 32 | Mittel | **T-08** | — | ❌ | ❌ | **P2** |
| **R-23** | Audit-Log zu schmal, keine Manipulationssicherung | **PARTIALLY PROVEN** — *deutlich korrigiert* | **Erstaudit war zu negativ.** Trigger-basiert (nicht umgehbar), Vorher/Nachher vollständig, `strip`-Array zur Datenminimierung, append-only auf Grant-Ebene, **19 Tabellen** abgedeckt. **Echte Lücke:** Client-Platform (Provisionierung, Entitlements, Einladungen, Rollen) hat **0 Audit-Treffer** | `20260722120000:1048-1082`; `20260721120000`, `20260731121000`, `20260818120000` je 0 Treffer | Art. 5 Abs. 2, 32 Abs. 1 lit. b | Mittel | **T-09** → `ADMIN_ACCOUNTABILITY_AUDIT.md` | — | ❌ | ❌ | **P2** |
| **R-24** | Kundendatenzugriffe nicht protokolliert | **PROVEN** | kein Lese-Log; auch keine abgewiesenen Autorisierungsversuche | — | Art. 5 Abs. 2, 32 | Mittel | **T-09** Stufe 5 | VVT | ❌ | ❌ | **P2** |
| **R-25** | OAuth-Tokens im Klartext | **PROVEN** | `20260709120000:3-10` — `pgcrypto` wird aktiviert, aber nicht genutzt | `oura_connections` | Art. 32 Abs. 1 lit. a | Mittel | **entfällt mit R-03** | — | ❌ | ❌ | **P2** |
| **R-26** | Supabase in DS-Erklärung zu knapp | **PROVEN** | Abschnitt 8 einzeilig, keine Region, kein Drittlandbezug | `legal-content.tsx` | Art. 13 DSGVO | Gering | — | **D-02** | ❌ | ❌ | **P2** |
| **R-27** | Club-Operations ohne AVV | **PROVEN** | `club-operations-read/index.ts`; `src/solutions/club-operations/**` | Gateway + Modul | Art. 28 DSGVO | **Hoch** — klarste AV-Konstellation im System | ✅ technisch vorbildlich abgesichert | **D-09** mit dem Verein | ✅ Welcher Verein? | ✅ | **P1** |
| **R-28** | Google-Site-Verification vor Consent | **FALSE POSITIVE** | `index.html:23` ist ein **statisches `<meta>`-Tag**. Es erzeugt keinen Request, setzt kein Cookie, liest nichts aus | `index.html:23` | — | **keines** | **keiner** | — | ❌ | ❌ | **zurückgezogen** |
| **R-29** | „Ablehnen" optisch schwächer | **PARTIALLY PROVEN** | Beide auf erster Ebene, **gleiche Größe** (`h-11 px-5`), gleiche Position. Unterschied nur Outline vs. gefüllt | `ConsentBanner.tsx:151-160` | § 25 Abs. 1 TDDDG; Art. 4 Nr. 11 | **Gering** | **T-12** | — | ❌ | ⚠️ | **P3** |
| **R-30** | Kein Consent-Logging | **PROVEN** | `consent.ts:104-112` — nur `localStorage`, kein serverseitiger Nachweis | `src/lib/consent.ts` | Art. 7 Abs. 1 | Mittel | **T-10** | — | ❌ | ⚠️ | **P2** |
| **R-31** | `package.json` ohne Namen/Lizenz | **PROVEN** | `package.json:2` = `vite-react-typescript-starter`, kein `license` | `package.json` | — | **Gering** | **T-15** | — | ❌ | ❌ | **P3** |
| **R-32** | Keine OSS-Lizenzinventur | **PROVEN** | 60+ Runtime-Deps, kein `THIRD-PARTY-NOTICES`. **Kein AGPL/GPL/SSPL in den direkten Deps** — transitives Closure ungeprüft | `package.json`, `package-lock.json` | MIT/BSD/Apache-Attribution | Mittel — **Kundenauslieferung ist das Geschäftsmodell** | **T-14** | **D-30** | ❌ | ⚠️ | **P2** |
| **R-33** | Assets ohne Rechteherkunft | **PARTIALLY PROVEN** | `og-image.png` **UNKNOWN**; Spline-Szene **UNKNOWN**; DejaVu-Fonts frei, aber Lizenztext-Weitergabe erforderlich; Logos generiert (`scripts/generate-brand-assets.mjs`); `Lazar_Popovic.png` eigene Person | `public/*`, `src/assets/fonts/*` | §§ 2, 31 UrhG | Mittel | — | **D-31** | ✅ | ⚠️ | **P2** |
| **R-34** | Keine Accessibility-Erklärung, kein Skip-Link | **BEST PRACTICE ONLY** — *herabgestuft* | **BFSG mit hoher Wahrscheinlichkeit nicht anwendbar** (kein Verbrauchervertragsschluss über die Website + Kleinstunternehmer-Ausnahme § 3 Abs. 3). Skip-Link fehlt (0 Treffer), sonst solide: `lang="de"`, alle `<img>` mit `alt`, `focus-visible` durchgängig | — | BFSG (derzeit nicht anwendbar) | Gering | **T-13** | **D-32** bedingt | ✅ Mitarbeiterzahl? | ⚠️ | **P3** |
| **R-35** | Preise ohne USt; B2B nicht erklärt | **PROVEN** | `WebdesignKostenMuenchen.tsx:130`, `WebdesignSport.tsx:95`; keine B2B-Klausel | Preisseiten | § 1 PAngV; §§ 312 ff. BGB | Mittel | **T-17** | **D-28** | ✅ | ✅ | **P1** |
| **R-36** | „Website Marktführer" | **PARTIALLY PROVEN** | **Paketname**, keine Selbstberühmung. Risiko nur in der Lesart als Ergebniszusage | 2 Cluster-Seiten | § 5 Abs. 1 UWG | **Gering** | — | — | ❌ | ⚠️ | **P3** |
| **R-37** | Art.-50-Ansage behauptet, nicht verifizierbar | **PROVEN** (als unbelegt) | `KiTelefonassistentPage.tsx:218`; `telefonassistent-copy.ts:200-201`. **`COPY-GAPS.md` §0 führt ihn selbst als offene Inhaberentscheidung „C1"** | 2 Dateien + abgeleitete Seiten | Art. 50 Abs. 1 VO 2024/1689; § 5 UWG | **Hoch** | — | Bestätigung + `COPY-GAPS.md` schließen | ✅ **Vorrang** | ⚠️ | **P1** |
| **R-38** | Keine AI-Literacy-Dokumentation | **PROVEN** | kein Dokument | — | Art. 4 VO 2024/1689 (seit 02.02.2025) | Mittel | — | **D-24** | ✅ | ⚠️ | **P2** |
| **R-39** | Data-Act-Anwendbarkeit ungeprüft | **UNKNOWN** | Kundenportal + Club-Operations könnten „Datenverarbeitungsdienste" sein; Ausnahme Art. 31 (maßgeschneidert) ernsthaft prüfenswert | `src/components/app/**`, `src/solutions/club-operations/**` | Art. 23-31 VO 2023/2854 | Mittel | — | **D-20** | ✅ Vertriebsmodell? | ✅ | **P2** |
| **R-40** | Dev-Logging gibt Supabase-URL aus | **FALSE POSITIVE** | `src/lib/supabase.ts:19-23` läuft **nur** unter `import.meta.env.DEV` und wird aus dem Produktionsbundle entfernt. Die URL ist ohnehin öffentlich | `src/lib/supabase.ts` | — | **keines** | **keiner** | — | ❌ | ❌ | **zurückgezogen** |
| **R-41** *(neu)* | **`oura-callback` existiert in keinem Commit** — eine out-of-repo Edge Function verwaltet den OAuth-Flow und schreibt Tokens | **PROVEN** | `OuraAnalyticsPage.tsx:40` referenziert sie; vollständige Historiensuche: nie im Repository | — | Art. 5 Abs. 2, 32 | Mittel | **R-3 im Removal Plan** — wird durch keine Repo-Änderung erfasst | Vorfallsakte | ✅ | ⚠️ | **P0** |
| **R-42** *(neu)* | **Integrations-Claim widerspricht bindender Inhaber-Vorgabe** | **PROVEN** | `LeistungenPage.tsx:207` nennt Tomedo, CGM, OnOffice, HubSpot, Lightspeed, Magicline. `IntegrationenPage.tsx:13-14`: *„Keine Produktnamen von Praxisverwaltungssystemen, solange keine Anbindung existiert (Inhaber-Antwort B)"* — und diese Seite ist `noindex`, die andere nicht | `LeistungenPage.tsx:207` | § 5 UWG; § 14 MarkenG; § 6 UWG | **Hoch** | — | Formulierung nach Muster `WebdesignHotel.tsx:73` | ✅ | ⚠️ | **P0** |

## A.3 Systematische Beobachtung

Drei der schwersten Befunde (R-04, R-37, R-42) haben **dieselbe Ursache**: Von 93 öffentlichen Routen sind nur 3 auf `noindex` — und genau die beiden sorgfältigsten Seiten (`/integrationen`, `/datenschutz-sicherheit`) gehören dazu.

**Die Seiten, die sich an die bindenden Inhaber-Vorgaben halten, sind unsichtbar. Die Seiten, die sie verletzen, sind indexiert.**

Das ist kein Einzelfehler, sondern ein Prozessdefekt: Die Copy-Disziplin wurde auf neuen Seiten durchgesetzt, die bestehenden Branchen- und Stadtseiten wurden nicht nachgezogen. **Empfehlung: `.claude/COPY-BRIEF.md` um einen CI-Gate ergänzen, der die verbotenen Aussagen repo-weit prüft** — analog zu `.github/scripts/test-seo-consistency.mjs`, das bereits Claim-Invarianten durchsetzt.

---

# TEIL N — REMEDIATION ROADMAP

## P0 — JETZT

| # | Aktion | Dateien | Technisch | Dokument | Deploy? | Migration? | Risiko | Owner | Lawyer |
|---|---|---|---|---|---|---|---|---|---|
| **P0-1** | **Verifikationsabfragen V1-V9 ausführen** — klärt CLR-2, Schreibrechte, Betroffenenzahl. **Vor jeder Löschung** | — | read-only SQL | Ergebnisse in die Vorfallsakte | nein | nein | **keines** | ✅ ausführen | — |
| **P0-2** | **Oura-OAuth-Autorisierung widerrufen** — entwertet CLR-1, stoppt Datenzufluss, **vernichtet keine Beweismittel** | — | Oura-Konto | Vermerk | nein | nein | **keines** | ✅ ausführen | — |
| **P0-3** | **`sync-oura` löschen** (`supabase functions delete sync-oura`) — beendet CLR-1 | Supabase | CLI | Vermerk | nein | nein | gering | ✅ Freigabe | — |
| **P0-4** | **`oura-callback` löschen** (R-41) — out-of-repo, wird sonst nie erfasst | Supabase | CLI | Vermerk | nein | nein | gering | ✅ Freigabe | — |
| **P0-5** | **Zwei Vorfallsdokumentationen + Meldeentscheidung** (R-01, R-02) | `docs/legal/incidents/` | — | **D-26, D-27, D-15** | nein | nein | keines | ✅ | ✅ **zwingend** |
| **P0-6** | **AVV-Muster + TOM + Subprozessorenliste** (R-04, R-19, R-18) — **löst zugleich 7 UWG-Findings** | — | — | **D-09, D-10, D-11** | nein | nein | keines | ✅ | ✅ |
| **P0-7** | **Verarbeitungsverzeichnis** Art. 30 Abs. 1+2 (R-05) | — | — | **D-12** | nein | nein | keines | ✅ | ⚠️ |
| **P0-8** | **Cold-E-Mail bleibt BLOCKED** (R-08) — bis D-22, D-25 und D-23 vorliegen | — | — | organisatorisch | nein | nein | keines | ✅ | ✅ |
| **P0-9** | **n8n-Workflow `/webhook/google-ads` öffnen und dokumentieren** (R-15, R-16) — klärt, ob die DS-Erklärung zutrifft | — | — | Befund | nein | nein | keines | ✅ **Vorrang** | ⚠️ |
| **P0-10** | **R-42 korrigieren** — Integrations-Claim nach Muster `WebdesignHotel.tsx:73` | `LeistungenPage.tsx:207` | Copy | — | **ja** | nein | gering | ✅ | ⚠️ |
| **P0-11** | **Art.-50-Ansage bestätigen oder Aussage entfernen** (R-37) | `KiTelefonassistentPage.tsx:218`, `telefonassistent-copy.ts:200` | ggf. Copy | `COPY-GAPS.md` C1 schließen | ggf. ja | nein | gering | ✅ **Vorrang** | ⚠️ |
| **P0-12** | **B2B-AGB + Werkvertrag + Nutzungsrechte + Abnahme** (R-06) | — | — | **D-04, D-05, D-17, D-19** | nein | nein | keines | ✅ | ✅ **zwingend** |
| **P0-13** | **Art.-14-Informationsblatt + Interessenabwägung** (R-07) | — | — | **D-22, D-25** | nein | nein | keines | ✅ Herkunft | ✅ |

> **P0-1 und P0-2 sind ohne jedes Risiko und ohne Freigabebedarf ausführbar.** Beide sind read-only bzw. beweisneutral.

## P1 — VOR DEM NÄCHSTEN KUNDEN

| # | Aktion | Dateien | Technisch | Dokument | Deploy? | Migration? | Risiko | Owner | Lawyer |
|---|---|---|---|---|---|---|---|---|---|
| **P1-1** | **Sicherheits-Header Stufe 1** (R-09) — `nosniff`, `Referrer-Policy`, `Permissions-Policy` | `public/_headers` | T-01 | TOM | **ja** | nein | **gering** | ❌ | ❌ |
| **P1-2** | **`frame-ancestors 'none'` + `no-referrer` für `/d`, `/admin`, `/owner`, `/app`** (R-10) | `public/_headers` | T-02 | — | **ja** | nein | **gering** — kollidiert mit keinem Nutzungsfall | ❌ | ❌ |
| **P1-3** | **Art.-13-Hinweis an alle Formulare** (R-11) | `ContactSection.tsx`, `FAQQuestionModal.tsx` | T-03 | — | **ja** | nein | gering | ❌ | ❌ |
| **P1-4** | **Oura-Removal ausführen** (R-03, R-25) — **erst nach P0-1** | `OURA_REMOVAL_PLAN.md` R-5 bis R-8 | T-06 | Löschkonzept | **ja** | **ja — destruktiv** | **hoch, irreversibel** | ✅ Freigabe | — |
| **P1-5** | **Spline Option B (Self-Hosting)** (R-12, R-13) | `DesktopHero.tsx` | T-04 | D-02 | **ja** | nein | gering | ✅ Lizenz? | ⚠️ |
| **P1-6** | **AVV mit dem Club-Operations-Kunden** (R-27) | — | — | D-09 | nein | nein | keines | ✅ Welcher Verein? | ✅ |
| **P1-7** | **Löschkonzept + technische Durchsetzung** (R-17) — **inkl. Backup-Retention** | Purge-Policy | T-18 | D-13 | nein | **ja** | mittel | ✅ Fristen | ⚠️ |
| **P1-8** | **Incident-Response-Plan** (R-20) | — | — | D-14 | nein | nein | keines | ✅ | ⚠️ |
| **P1-9** | **B2B-Klarstellung + „zzgl. USt."** (R-35) | Preisseiten, AGB § 1 | T-17 | D-28 | **ja** | nein | gering | ✅ | ✅ |
| **P1-10** | **SLA + Exit-Regelung + Change-Request** | — | — | D-08, D-20, D-18 | nein | nein | keines | ✅ | ✅ |
| **P1-11** | **Suppression-List** (R-08) | neue Tabelle | — | D-23 | nein | **ja** | gering | ✅ | ⚠️ |
| **P1-12** | **DS-Erklärung überarbeiten** (R-13, R-14, R-17, R-26) — **zuletzt**, nach P1-4/P1-5/P0-9 | `legal-content.tsx` | — | D-02 | **ja** | nein | gering | ✅ | ✅ |

## P2 — VOR GRÖSSEREM SCALE

| # | Aktion | Technisch | Deploy? | Migration? | Risiko |
|---|---|---|---|---|---|
| **P2-1** | `platform_audit_log` + Trigger auf Client-Platform (R-23) | T-09 Stufe 1 | nein | **ja** | mittel |
| **P2-2** | Append-only-Trigger auf beide Audit-Logs | T-09 Stufe 2 | nein | **ja** | gering |
| **P2-3** | Lese- und Denial-Protokollierung (R-24) | T-09 Stufe 5 | **ja** | **ja** | mittel |
| **P2-4** | Serverseitiges Consent-Log (R-30) | T-10 | **ja** | **ja** | gering |
| **P2-5** | Rate-Limiting + Turnstile (R-22) | T-08 | **ja** | nein | mittel |
| **P2-6** | CORS-Allowlist (R-21) | T-07 | nein | nein | **mittel** — Origin-Liste muss vollständig sein |
| **P2-7** | CSP `Report-Only`, 14 Tage (R-09 Stufe 3) | T-01 | **ja** | nein | **keines** — Report-Only blockiert nichts |
| **P2-8** | OSS-Lizenzprüfung in CI + Notices (R-32) | T-14 | nein | nein | gering |
| **P2-9** | Betroffenenrechte-Werkzeug (D-29) | T-19 | **ja** | **ja** | mittel |
| **P2-10** | Asset-Register (R-33) | — | nein | nein | keines |
| **P2-11** | AI-Literacy-Konzept (R-38) | — | nein | nein | keines |
| **P2-12** | Data-Act-Analyse + Exit-Klausel (R-39) | — | nein | nein | keines |
| **P2-13** | CI-Gate für Copy-Invarianten (A.3) | `test-seo-consistency.mjs` erweitern | nein | nein | gering |

## P3 — BEST PRACTICE

| # | Aktion | Technisch |
|---|---|---|
| P3-1 | CSP durchsetzen, später Nonce-basiert | T-01 Stufe 4 / Phase D |
| P3-2 | HSTS mit `preload` (nach Subdomain-Prüfung) | — |
| P3-3 | Hash-Kette + externe Verankerung | T-09 Stufen 3-4 |
| P3-4 | Consent-Ablauf (Re-Consent nach 12 Monaten) | T-11 |
| P3-5 | Banner-Parität (R-29) | T-12 |
| P3-6 | Skip-Link, `prefers-reduced-motion`, Kontraste (R-34) | T-13 |
| P3-7 | `package.json` bereinigen (R-31) | T-15 |
| P3-8 | `generate_daily_execution_plan`: `search_path` pinnen | T-16 |
| P3-9 | `correlation_id` tatsächlich befüllen | — |
| P3-10 | MFA-Pflicht für Admin-/Owner-Konten | — |
| P3-11 | Marke „Cogniiq" prüfen/anmelden | — |
| P3-12 | Execution-Tabellen: separater Vorfallsentscheid | — |

---

## Querverweise

| Dokument | Inhalt |
|---|---|
| `docs/legal/incidents/OURA_INCIDENT_EVIDENCE.md` | Teil B — forensische Beweissicherung Oura, 18 Punkte, Abfragen V1-V9 |
| `docs/legal/incidents/LEADS_INCIDENT_EVIDENCE.md` | Teil D — forensische Beweissicherung Leads |
| `docs/legal/OURA_REMOVAL_PLAN.md` | Teil C — Dependency Graph, Reihenfolge, Migration, Rollback, Residual-Checks |
| `docs/legal/OUTREACH_AND_GOOGLE_DATA_FLOW.md` | Teile E + F |
| `docs/legal/CLAIM_AUDIT.md` | Teil G — 51 Claims mit Status |
| `docs/legal/SECURITY_HEADERS_PLAN.md` | Teil H — Origin-Inventur, CSP, Rollout |
| `docs/legal/SPLINE_ASSESSMENT.md` | Teil I — drei Optionen mit Empfehlung |
| `docs/legal/REQUIRED_DOCUMENT_STACK.md` | Teil J — 34 Dokumente klassifiziert |
| `docs/legal/PRIVACY_POLICY_GAP_ANALYSIS.md` | Teil K — Tabellen A und B |
| `docs/legal/PROCESSOR_INVENTORY.md` | Teil L — 11 Anbieter + Negativliste + TOM-Bestand |
| `docs/legal/ADMIN_ACCOUNTABILITY_AUDIT.md` | Teil M — Aktionsmatrix + Hardening-Plan |
| `LEGAL_COMPLIANCE_AUDIT_2026.md` | Erstaudit (Discovery) |

## Stop Condition

**Diese Analyse ist vollständig. Es wurden keine Codeänderungen vorgenommen, keine Produktionsdaten verändert und nichts deployt.**

Zwei Live-Risiken (CLR-1, CLR-2) wurden gemeldet, nicht behoben. Die Remediation beginnt erst nach Ihrer Freigabe.
