# PROCESSOR INVENTORY — AVV / TOM / SUBPROCESSORS

**Erstellt:** 2026-09-22
**Methode:** Ausschließlich aus dem realen System rekonstruiert. **Nur tatsächlich im Code nachgewiesene Anbieter sind aufgeführt.**
**Grundregel:** Was nicht belegbar ist, steht als `UNKNOWN`. Nichts wird aus Plausibilität ergänzt.

## 1. Negativliste — geprüft und NICHT gefunden

Diese Anbieter wurden ausdrücklich gesucht und sind **in keinem Commit** nachweisbar. Sie gehören damit **nicht** in eine Subprozessorenliste:

**Netlify** *(nur als Build-Kompatibilitätspfad in `public/_redirects` und `scripts/prerender.mjs`, kein Produktivhost)* · **Hetzner** · **AWS** · **Stripe** · **PayPal** · **OpenAI** · **Anthropic** · **Vapi** · **ElevenLabs** *(im Repository der Golden-Agent-Arbeit erwähnt, aber nicht auf diesem Branch)* · **Twilio** · **Ably** · **Mailchimp** · **Brevo** · **SendGrid** · **Sentry** · **PostHog** · **Hotjar** · **Microsoft Clarity** · **Meta** · **LinkedIn** · **TikTok** · **Calendly** · **Make** · **reCAPTCHA / hCaptcha / Turnstile** · **Google Tag Manager** · **Google Fonts** · **YouTube** · **Vimeo**

> `docs/PHASE0_LEGAL_OPEN_ITEMS.md` hält bereits fest, dass Stripe und PayPal vom Inhaber ausdrücklich als nicht genutzt bestätigt wurden. Dieser Audit bestätigt das codeseitig.

## 2. Anbieterinventar

### P-01 · Cloudflare

| Feld | Wert |
|---|---|
| **Zweck** | Hosting, CDN, Pages Functions, DNS/TLS für `cogniiq.de` |
| **Datenkategorien** | IP-Adresse, User-Agent, angeforderte URL, Zeitstempel, TLS-Merkmale |
| **Rolle** | **Auftragsverarbeiter** (Art. 28) — Cogniiq bestimmt Zweck und Mittel |
| **Hosting-Region** | Anycast; konkrete PoPs **UNKNOWN** |
| **Drittland** | **Ja** — Cloudflare, Inc., USA |
| **AVV erforderlich** | **JA — zwingend.** Cloudflare stellt ein Standard-DPA bereit (im Dashboard zu akzeptieren) |
| **SCC relevant** | **Ja** — Cloudflare nutzt SCC; zusätzlich EU-US DPF-zertifiziert. **TIA erforderlich** |
| **In DS-Erklärung** | ✅ Abschnitt 3 — aber **ohne Drittland- und Garantieangabe** |
| **Subprozessorenliste** | **JA** |
| **Beleg** | `wrangler.jsonc`, `functions/_middleware.ts`, `public/_headers`, `public/_redirects` |
| **Offen** | Ist das Cloudflare-DPA aktiv akzeptiert? `NEEDS BUSINESS CONFIRMATION` |

### P-02 · Supabase

| Feld | Wert |
|---|---|
| **Zweck** | Authentifizierung, PostgreSQL, Object Storage, Edge Functions |
| **Datenkategorien** | Konto- und Profildaten, Organisationszugehörigkeit, Projekte, Aufgaben, Dokumente, Rechnungen, Ausgaben, Zahlungen, Steuerdaten, Angebote, **Signaturen**, Zugriffsereignisse, Lead-PII Dritter, **bis zur Entfernung: Gesundheitsdaten (Art. 9)** |
| **Rolle** | **Auftragsverarbeiter** |
| **Hosting-Region** | **`eu-central-1`** — belegt in `supabase/migrations/ROLLBACK_20260824171403.md:54` |
| **Drittland** | Daten in der EU; **Supabase Inc. hat Sitz in den USA** → Zugriffsmöglichkeit durch den Anbieter ist eine Übermittlung |
| **AVV erforderlich** | **JA — zwingend.** Supabase stellt ein DPA bereit |
| **SCC relevant** | **Ja**, wegen des US-Sitzes. **TIA erforderlich** |
| **In DS-Erklärung** | ⚠️ Abschnitt 8, **nur einzeilig und ohne Regionsangabe** |
| **Subprozessorenliste** | **JA — inklusive der Unterauftragsverarbeiter von Supabase** (Supabase läuft selbst auf AWS; das ist eine Unterauftragsverarbeitung, die Cogniiq weiterreichen muss) |
| **Beleg** | `src/lib/supabase.ts`, `supabase/**`, 45 Migrationen, 8 Edge Functions |
| **Anmerkung** | Der wichtigste Auftragsverarbeiter des gesamten Systems. Hier liegen sämtliche Kundendaten |

### P-03 · n8n (`n8n.cogniiq.co`)

| Feld | Wert |
|---|---|
| **Zweck** | Verarbeitung und Weiterleitung aller öffentlichen Formularanfragen |
| **Datenkategorien** | Name, E-Mail, **Telefon**, Firma, Branche, Unternehmensgröße, Freitext, `page_url`, `referrer`, Zeitstempel |
| **Rolle** | **UNKNOWN.** Läuft die Software auf eigener Infrastruktur, ist n8n kein Anbieter — dann ist der **Hoster** der Auftragsverarbeiter. Läuft sie auf n8n Cloud, ist n8n selbst Auftragsverarbeiter |
| **Hosting-Region** | **UNKNOWN** |
| **Drittland** | **UNKNOWN** |
| **AVV erforderlich** | **JA** — mit demjenigen, der die Infrastruktur stellt |
| **SCC relevant** | **UNKNOWN** |
| **In DS-Erklärung** | ✅ Abschnitt 4 als „selbst betriebene Automatisierungsumgebung" — **diese Formulierung ist nicht verifizierbar** |
| **Subprozessorenliste** | **JA** |
| **Beleg** | `src/config/externalEndpoints.ts:1-5` |
| **Offen — mit Vorrang** | Hoster? Land? Verschlüsselung at rest? Aufbewahrungsdauer? Zugriffsberechtigte? Wohin gehen die Daten weiter? **Und: was tut der Workflow hinter `/webhook/google-ads`?** `NEEDS BUSINESS CONFIRMATION` |
| **Anmerkung** | **Die größte blinde Stelle des gesamten Systems.** Durch n8n fließt jede einzelne Lead-Anfrage der Website. Die Datenschutzerklärung nennt es, aber niemand außerhalb des Inhabers kann sagen, was dort geschieht |

### P-04 · Google Ireland Limited — Google Ads

| Feld | Wert |
|---|---|
| **Zweck** | Conversion-Messung, Remarketing (`AW-17946397271`) |
| **Datenkategorien** | Cookie-Identifikatoren, IP, Seitenaufrufe, Conversion-Ereignisse |
| **Rolle** | **Umstritten.** Für die Erhebung und Übermittlung wird überwiegend **gemeinsame Verantwortlichkeit (Art. 26)** angenommen; Google stellt Controller-Controller-Terms bereit |
| **Hosting-Region** | Google Ireland; Verarbeitung auch durch Google LLC (USA) |
| **Drittland** | **Ja** |
| **AVV erforderlich** | Google Ads Data Processing Terms bzw. Controller-Terms |
| **SCC relevant** | **Ja** — Google stützt sich auf EU-US DPF und SCC |
| **In DS-Erklärung** | ✅ Abschnitt 6 — **vollständig und korrekt**, inkl. Consent-Mode und Widerrufshinweis |
| **Subprozessorenliste** | **JA** |
| **Beleg** | `src/lib/consent.ts:30` |
| **Anmerkung** | ✅ Wird **ausschließlich nach Einwilligung** geladen — codeseitig belegt |

### P-05 · Google Ireland Limited — Google Analytics 4

| Feld | Wert |
|---|---|
| **Zweck** | Reichweitenmessung (`G-NDN9J2G5LM`) |
| **Datenkategorien** | Pseudonyme Kennung (`_ga`, `_ga_NDN9J2G5LM`), IP-abgeleiteter Standort, Gerät, Betriebssystem, Browser, Sprache, Seitenpfade, `cta_label` |
| **Rolle** | **Auftragsverarbeiter** nach den Google Analytics Data Processing Terms; für die Erhebung ggf. gemeinsame Verantwortlichkeit |
| **Hosting-Region** | Google Ireland; auch Google LLC (USA) |
| **Drittland** | **Ja** |
| **AVV erforderlich** | **JA** — Google Analytics DPT |
| **SCC relevant** | **Ja** |
| **In DS-Erklärung** | ✅ Abschnitt 7 — **der am sorgfältigsten formulierte Abschnitt der gesamten Erklärung** |
| **Subprozessorenliste** | **JA** |
| **Beleg** | `src/lib/consent.ts:32` |
| **Offen** | Eingestellte Aufbewahrungsdauer der Property? Ist „Google-Signale" aktiv? `NEEDS BUSINESS CONFIRMATION` |

### P-06 · Google Ireland Limited — Google Maps

| Feld | Wert |
|---|---|
| **Zweck** | Standortkarte im Kontaktbereich |
| **Datenkategorien** | IP, User-Agent, Referrer — **erst nach Klick** |
| **Rolle** | Google agiert hier weitgehend als eigener Verantwortlicher |
| **Drittland** | **Ja** |
| **AVV erforderlich** | Google Maps Platform Terms |
| **In DS-Erklärung** | ❌ **NICHT GENANNT** → `PRIVACY_POLICY_GAP_ANALYSIS.md` A-02 |
| **Subprozessorenliste** | **JA** |
| **Beleg** | `src/components/ConsentMapEmbed.tsx`, `src/lib/seo-data.ts:240-243` |
| **Anmerkung** | ✅ Technisch vorbildlich als Zwei-Klick-Lösung umgesetzt — nur die Offenlegung fehlt |

### P-07 · Resend

| Feld | Wert |
|---|---|
| **Zweck** | Versand transaktionaler E-Mails (Angebote, Rechnungen, Dokumente) |
| **Datenkategorien** | Empfängername und -adresse, Betreff, **vollständiger E-Mail-Inhalt inkl. Beträgen und Dokumentlinks**, Anhänge |
| **Rolle** | **Auftragsverarbeiter** |
| **Hosting-Region** | **UNKNOWN** — Resend hat Sitz in den USA; eine EU-Region existiert, ob genutzt ist **UNKNOWN** |
| **Drittland** | **Wahrscheinlich ja** |
| **AVV erforderlich** | **JA — zwingend.** Resend stellt ein DPA bereit |
| **SCC relevant** | **Wahrscheinlich ja.** TIA erforderlich |
| **In DS-Erklärung** | ⚠️ Abschnitt 8 genannt, **ohne Sitz-, Regions- oder Garantieangabe** |
| **Subprozessorenliste** | **JA** |
| **Beleg** | `supabase/functions/send-offer-document-email/email.ts`, `RESEND_API_KEY` |
| **Anmerkung** | Verarbeitet **Vertragsinhalte** — inhaltlich sensibler als reine Zustelldaten |

### P-08 · Spline (`prod.spline.design`)

| Feld | Wert |
|---|---|
| **Zweck** | 3D-Szene im Desktop-Hero (**dekorativ**, `aria-hidden`) |
| **Datenkategorien** | IP, User-Agent, Referrer, TLS-Merkmale |
| **Rolle** | **UNKNOWN** — mangels Vertrag eher eigener Verantwortlicher für die Auslieferungsdaten |
| **Hosting-Region** | **UNKNOWN**, vermutlich US-CDN |
| **Drittland** | **Wahrscheinlich ja** |
| **AVV erforderlich** | **UNKNOWN** — entfällt vollständig bei Self-Hosting |
| **SCC relevant** | **UNKNOWN** |
| **In DS-Erklärung** | ❌ **NICHT GENANNT** → A-01 |
| **Subprozessorenliste** | **JA**, solange extern geladen |
| **Beleg** | `src/components/hero/DesktopHero.tsx:78-79` |
| **Anmerkung** | → `SPLINE_ASSESSMENT.md`. **Bei Option B (Self-Hosting) entfällt dieser Eintrag ersatzlos** |

### P-09 · Oura Health Oy

| Feld | Wert |
|---|---|
| **Zweck** | Abruf von Gesundheitsdaten eines Wearables |
| **Datenkategorien** | **Art.-9-Gesundheitsdaten** (s. `incidents/OURA_INCIDENT_EVIDENCE.md` §1) |
| **Rolle** | Oura ist eigener Verantwortlicher gegenüber seinem Nutzer; Cogniiq wird durch den Abruf eigener Verantwortlicher |
| **Hosting-Region** | Oura Health Oy, Finnland; Infrastruktur **UNKNOWN** |
| **Drittland** | **UNKNOWN** |
| **AVV erforderlich** | **Entfällt mit der Entfernung** |
| **In DS-Erklärung** | ❌ **NICHT GENANNT** → A-07 |
| **Subprozessorenliste** | **Entfällt mit der Entfernung** |
| **Beleg** | `supabase/functions/sync-oura/index.ts:4`, `src/pages/OuraAnalyticsPage.tsx:1139` |
| **Status** | ⏳ **Zur Entfernung beschlossen** → `OURA_REMOVAL_PLAN.md` |

### P-10 · Club-Operations-Gegenstelle (Kundensystem)

| Feld | Wert |
|---|---|
| **Zweck** | Lesender Zugriff auf das Vereinsverwaltungssystem eines Kunden |
| **Datenkategorien** | Mitglieder, Buchungen, Zahlungen, Rechnungen, Gutscheine, Aktivitäten — **personenbezogene Daten der Vereinsmitglieder** |
| **Rolle** | **Der Verein ist Verantwortlicher. Cogniiq ist Auftragsverarbeiter.** Das ist die klarste Auftragsverarbeitungskonstellation im gesamten System |
| **Hosting-Region** | **UNKNOWN** (`CLUB_OPS_GATEWAY_URL`) |
| **Drittland** | **UNKNOWN** |
| **AVV erforderlich** | **JA — zwingend, mit dem Verein als Auftraggeber.** Cogniiq muss zugleich Supabase und Cloudflare als **Unterauftragsverarbeiter** offenlegen |
| **In DS-Erklärung** | ❌ nicht genannt — **gehört auch primär in den AVV**, nicht in die eigene Erklärung |
| **Subprozessorenliste** | **JA** — aber in der Liste, die Cogniiq **dem Verein** vorlegt |
| **Beleg** | `supabase/functions/club-operations-read/index.ts`, `src/solutions/club-operations/**`, `src/lib/gateway/**` |
| **Anmerkung** | ✅ Technisch der am besten abgesicherte Datenfluss des Systems: Ed25519-Signatur, Zeitfenster, Replay-Schutz, Body-Limit, geschlossene Operationsliste, Logging ausschließlich mit Reason-Codes (`club-operations-read/index.ts:124`). **Was fehlt, ist ausschließlich das Papier** |

### P-11 · esm.sh / deno.land

| Feld | Wert |
|---|---|
| **Zweck** | Modulimporte zur Bundle-Zeit der Edge Functions |
| **Datenkategorien** | **Keine Nutzerdaten** |
| **Rolle** | Keine Auftragsverarbeitung |
| **AVV erforderlich** | **Nein** |
| **In DS-Erklärung** | **Nein** |
| **Beleg** | `supabase/functions/sync-oura/index.ts:1-2` |
| **Anmerkung** | Kein Datenschutz-, aber ein **Lieferketten**-Thema: Ein CDN-Import zur Build-Zeit ist ein Vertrauensanker. Empfehlung, unabhängig davon: Versionen pinnen (geschieht bereits: `@2.58.0`, `std@0.224.0`) und mittelfristig auf `npm:`-Spezifier oder einen Import-Map-Lockfile umstellen |

## 3. Übersicht

| # | Anbieter | Rolle | EU/EWR | Drittland | AVV nötig | In DS-Erkl. | Subproc.-Liste |
|---|---|---|---|---|---|---|---|
| P-01 | Cloudflare | Auftragsverarbeiter | teilweise | **ja** | **JA** | ✅ unvollständig | ja |
| P-02 | Supabase | Auftragsverarbeiter | `eu-central-1` | **ja** (US-Sitz) | **JA** | ⚠️ knapp | ja |
| P-03 | n8n-Hoster | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **JA** | ⚠️ ungenau | ja |
| P-04 | Google Ads | gemeinsam/Controller | IE + US | **ja** | ja | ✅ vollständig | ja |
| P-05 | Google Analytics | Auftragsverarbeiter | IE + US | **ja** | **JA** | ✅ vollständig | ja |
| P-06 | Google Maps | Controller | IE + US | **ja** | ja | ❌ **fehlt** | ja |
| P-07 | Resend | Auftragsverarbeiter | **UNKNOWN** | wahrscheinlich | **JA** | ⚠️ knapp | ja |
| P-08 | Spline | **UNKNOWN** | **UNKNOWN** | wahrscheinlich | **UNKNOWN** | ❌ **fehlt** | ja* |
| P-09 | Oura | Controller | FI | **UNKNOWN** | entfällt | ❌ fehlt | entfällt |
| P-10 | Club-Ops-Kunde | **Cogniiq = AV** | **UNKNOWN** | **UNKNOWN** | **JA** | n/a | ja** |
| P-11 | esm.sh/deno.land | keine | US | n/a | nein | nein | nein |

\* entfällt bei Self-Hosting · \*\* in der Liste **an** den Vereinskunden

## 4. Erforderliche AVVs — priorisiert

| Prio | AVV mit | Begründung |
|---|---|---|
| **P0** | **Supabase** | Sämtliche Kundendaten. Ohne AVV keine rechtmäßige Auftragsverarbeitung |
| **P0** | **Cloudflare** | Jeder Seitenaufruf |
| **P0** | **n8n-Hoster** | Jede Lead-Anfrage — sobald der Hoster bekannt ist |
| **P0** | **Resend** | Vertragsinhalte |
| **P0** | **Cogniiq → Vereinskunde (Club-Operations)** | Cogniiq ist hier **Auftragnehmer**. Der AVV ist vom Kunden zu fordern oder von Cogniiq anzubieten |
| **P1** | **Google (Ads + Analytics)** | Terms akzeptieren, Nachweis dokumentieren |
| **P1** | **Cogniiq → alle Kundenprojekte** | Das **AVV-Muster**, das sieben Website-Seiten bereits zusagen (→ `CLAIM_AUDIT.md` G-01 ff.) |

## 5. TOM — was bereits existiert

Cogniiq muss die TOM **nicht von null schreiben.** Der Code belegt sie bereits; sie müssen nur in ein vorlagefähiges Dokument überführt werden.

| TOM-Kategorie (Art. 32 Abs. 1) | Bereits umgesetzt | Beleg |
|---|---|---|
| **Zutrittskontrolle** | Cloud-only, keine eigene Hardware | Architektur |
| **Zugangskontrolle** | Supabase Auth, JWT, `autoRefreshToken` | `src/lib/supabase.ts` |
| **Zugriffskontrolle** | RLS auf allen Tabellen, `is_platform_admin()` / `is_platform_owner()` als `security definer` mit gepinntem `search_path`, spaltenweise Grant-Reduktion | `20260710120000`, `20260722120000:781-785` |
| **Mandantentrennung** | `is_organization_member(organization_id)` | `20260710120000:162` |
| **Weitergabekontrolle** | TLS durchgehend; Club-Gateway mit Ed25519, Zeitfenster und Replay-Schutz | `src/lib/gateway/cqgw1.ts` |
| **Eingabekontrolle** | Trigger-basiertes Audit-Log mit Vorher-/Nachher-Zustand auf 15 Tabellen | `20260722120000:1048-1082` |
| **Auftragskontrolle** | ❌ **fehlt** — genau die AVVs aus Abschnitt 4 |
| **Verfügbarkeitskontrolle** | Automatisierte Backup-Verifikation inkl. Verschlüsselungs- und Restore-Point-Prüfung | `.github/scripts/verify-supabase-backups.mjs` u. a. |
| **Trennbarkeit** | Private Storage-Buckets, MIME-Allowlist, 25-MB-Limit | `20260728121000:320-332` |
| **Belastbarkeit** | Migrations-Allowlist, Dependency-Gate, Backup-Zwang vor Produktionsmigration | `.github/workflows/supabase-production-migration.yml` |
| **Pseudonymisierung** | Analytics ohne PII; Audit-Log entfernt Freitextfelder (`strip`-Array); `user_agent_summary` auf 200 Zeichen begrenzt | `consent.ts:339-379`, `20260722120000:1051-1053` |
| **Verschlüsselung** | TLS in Transit; at rest durch Supabase. ⚠️ **OAuth-Tokens im Klartext** (entfällt mit Oura) | — |
| **Sicherheits-Header** | ❌ **fehlen vollständig** | `SECURITY_HEADERS_PLAN.md` |

> **Kernaussage:** Die materiellen TOM sind zu etwa 85 % vorhanden und überdurchschnittlich gut. Es fehlen zwei Dinge — **die Sicherheits-Header** und **das Dokument selbst**. Beides ist in Tagen, nicht Monaten, zu schließen.
