# SECURITY HEADER HARDENING PLAN

**Erstellt:** 2026-09-22
**Status:** PLAN — nicht implementiert, nicht deployt.
**Grundsatz:** Keine CSP blind aktivieren. Zuerst vollständige Origin-Inventur, dann `Report-Only`, dann Durchsetzung.

## 1. Ausgangslage

`public/_headers` (99 Zeilen) setzt ausschließlich `X-Robots-Tag` und `Cache-Control`.
`functions/_middleware.ts:196-247` setzt zusätzlich nur `Content-Type`, `Cache-Control`, `X-Robots-Tag`.

Repository-weit **null Treffer** für: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, `frame-ancestors`, `Cross-Origin-Opener-Policy`.

**Rechtsgrundlage:** Art. 32 Abs. 1 DSGVO (Stand der Technik). Sicherheits-Header gehören seit Jahren dazu (BSI TR-03108, OWASP Secure Headers Project) und sind hier ohne Funktionsrisiko und ohne Kosten nachrüstbar.

## 2. Zwei Auslieferungspfade — beide müssen bedient werden

Das ist der wichtigste Implementierungshinweis, und `public/_headers` dokumentiert ihn bereits selbst:

> *„Cloudflare Pages evaluates `_redirects` BEFORE Pages Functions, so a private deep link is answered by the `/app-shell` rewrite and the middleware never runs for it — `_headers` is what carries the policy there."*

| Pfad | Wer antwortet | Header aus |
|---|---|---|
| Prerenderte öffentliche Route (`/`, `/leistungen`, …) | statische Datei | `public/_headers` |
| Private Deep Links (`/app/**`, `/admin/**`, `/owner/**`, `/auth/**`, `/d/**`) | `_redirects` → `/app-shell` | **`public/_headers`** — die Middleware läuft nicht |
| Unbekannte URL | `functions/_middleware.ts` → `/404` | Middleware |
| Assets unter `/assets/**` | statisch, Middleware reicht durch (`_middleware.ts:57-60`) | `public/_headers` |

> **Konsequenz: Die Header gehören primär in `public/_headers`.** Werden sie nur in der Middleware gesetzt, sind genau die sensibelsten Routen (`/admin`, `/d`) **ungeschützt**. Die Middleware ergänzt sie für die Pfade, die sie tatsächlich beantwortet.

## 3. Origin-Inventur

Erhoben durch vollständigen Scan aller Laufzeit-Origins.

### 3.1 `script-src`

| Origin | Wann | Bedingung |
|---|---|---|
| `'self'` | immer | gehashte Chunks unter `/assets/` |
| `'unsafe-inline'` | immer | **erforderlich**: Theme-Inline-Skript `index.html:14` (läuft vor dem ersten Paint, kann nicht extern sein) und die JSON-LD-Blöcke |
| `https://www.googletagmanager.com` | **nur nach Einwilligung** | `consent.ts:34` injiziert `gtag/js?id=…` |
| `https://prod.spline.design` | Desktop + WebGL, kein reduced-motion/save-data | Szenendatei; der Runtime-Chunk selbst kommt aus dem eigenen Bundle |

### 3.2 `style-src`

| Origin | Anmerkung |
|---|---|
| `'self'` | Tailwind-Build |
| `'unsafe-inline'` | **erforderlich**: über 115 `style={{…}}`-Props in Komponenten, plus `framer-motion`, das Transformationen als Inline-Styles schreibt. Ohne `'unsafe-inline'` bricht die Animationsschicht |

**Keine externen Stylesheets.** Google Fonts wird nicht geladen (`index.html:83`).

### 3.3 `img-src`

| Origin | Wann |
|---|---|
| `'self'` | eigene Assets |
| `data:` | Inline-SVG-Rauschmuster (`MobilePremiumHero.tsx:688`) |
| `blob:` | PDF- und Export-Vorschauen (`URL.createObjectURL`, 4 Fundstellen) |
| `https://www.googletagmanager.com`, `https://*.google-analytics.com` | Tracking-Pixel nach Einwilligung |
| `https://maps.gstatic.com`, `https://*.googleapis.com` | Kartenkacheln nach Klick |

### 3.4 `font-src`

| Origin | Anmerkung |
|---|---|
| `'self'` | DejaVu-TTF, über Vite als `?url` gebündelt (`premiumFonts.browser.ts:5-6`) |
| `data:` | Fallback von `@react-pdf/renderer` |

**Keine externe Font-Quelle.**

### 3.5 `connect-src`

| Origin | Zweck |
|---|---|
| `'self'` | Chunks, Prerender-Daten |
| `https://*.supabase.co` | PostgREST, Auth, Storage, Edge Functions |
| `https://n8n.cogniiq.co` | Formularübermittlung |
| `https://www.google-analytics.com`, `https://*.analytics.google.com` | GA4 nach Einwilligung |
| `https://www.googletagmanager.com` | Consent-Mode-Signale |
| `https://prod.spline.design` | Szenendatei |

### 3.6 `frame-src`

| Origin | Zweck |
|---|---|
| `https://www.google.com` | Maps-Embed (`getGoogleMapsEmbedUrl()` → `google.com/maps?…&output=embed`) |

**Nur diese eine.** Es gibt keine weiteren Iframes.

### 3.7 `worker-src`

**Kein `new Worker(…)` im Repository** (verifiziert). Der Spline-Runtime kann jedoch intern Worker oder WASM nutzen — deshalb `worker-src 'self' blob:` als Vorsichtsmaßnahme. Bei WASM wäre zusätzlich `'wasm-unsafe-eval'` in `script-src` nötig; **das zeigt erst der Report-Only-Lauf.** Nicht vorab raten.

## 4. CSP-Entwurf

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://prod.spline.design;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com https://maps.gstatic.com https://*.googleapis.com;
font-src 'self' data:;
connect-src 'self' https://*.supabase.co https://n8n.cogniiq.co https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://prod.spline.design;
frame-src https://www.google.com;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

**Anmerkungen zur Ehrlichkeit dieses Entwurfs:**
- `'unsafe-inline'` in `script-src` **entwertet den XSS-Schutz der CSP erheblich.** Das muss man aussprechen, statt es zu verschweigen. Die CSP bleibt dennoch wertvoll: `object-src 'none'`, `base-uri`, `form-action`, `frame-ancestors` und die Origin-Beschränkung für `connect-src` wirken unabhängig davon.
- Der saubere Weg wäre eine **Nonce-basierte CSP**. Sie setzt voraus, dass jede Auslieferung durch `functions/_middleware.ts` läuft und dort pro Request eine Nonce in die Inline-Skripte geschrieben wird. Bei prerenderten statischen Dateien und beim `/app-shell`-Rewrite ist das **derzeit nicht gegeben** (Abschnitt 2). → **Phase D**, nicht jetzt.
- Wird Spline entfernt (siehe `SPLINE_ASSESSMENT.md`, Option A), entfallen zwei Einträge.

## 5. Übrige Header

| Header | Wert | Geltungsbereich | Anmerkung |
|---|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | alle | ⚠️ `includeSubDomains` erfasst **alle** Subdomains von `cogniiq.de`. Vor der Aktivierung prüfen, ob jede Subdomain HTTPS spricht. `n8n.cogniiq.co` liegt auf einer **anderen** Domain und ist nicht betroffen |
| `X-Content-Type-Options` | `nosniff` | alle | risikolos |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | alle | **Zusätzlicher Datenschutznutzen:** verhindert, dass vollständige Pfade — insbesondere `/d/<token>` — als Referrer an Dritte gelangen |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` | alle | Keine dieser Funktionen wird genutzt |
| `Cross-Origin-Opener-Policy` | `same-origin` | private Routen | Erst nach Report-Only-Lauf; kann Maps-Popups beeinflussen |
| `X-Frame-Options` | `DENY` | private Routen | Redundant zu `frame-ancestors`, aber für Altbrowser sinnvoll |

## 6. `/d/**` — Clickjacking, separat betrachtet

**Das ist das konkreteste Sicherheitsproblem dieses Abschnitts.**

`/d/<token>` ist die Strecke, auf der ein Kunde ein Angebot **rechtsverbindlich annimmt und zeichnet** — mit einer Unterschrift auf `SignaturePad.tsx` und einem RPC, der eine `simple_electronic_signature` samt `accepted_gross_cents` und `accepted_terms_version` festschreibt (`20260723125000_...sql:685-690`).

Ohne `frame-ancestors` ist diese Seite **in einem fremden Iframe einbettbar**. Ein Angreifer mit einem gültigen Token könnte:
1. `/d/<token>` unsichtbar über einer eigenen Seite platzieren,
2. den Nutzer dazu bringen, an der Stelle zu zeichnen, an der das Signature-Pad liegt,
3. eine Annahmeerklärung auslösen, ohne dass der Nutzer weiß, was er unterschreibt.

**Der Token ist die einzige Hürde** — und er wird per E-Mail versendet, steht also im Postfach des Empfängers und potenziell in Weiterleitungen.

**Erforderlich, und zwar unabhängig vom restlichen CSP-Rollout:**

```
/d
  Content-Security-Policy: frame-ancestors 'none'
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
/d/*
  Content-Security-Policy: frame-ancestors 'none'
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
```

`frame-ancestors` ist die **einzige** CSP-Direktive, die in `Report-Only` **nicht** wirkt. Sie muss durchgesetzt ausgeliefert werden. Da sie mit keinem legitimen Nutzungsfall dieser Route kollidiert — die Seite wird nie eingebettet —, ist sie **risikofrei sofort aktivierbar** und muss nicht auf den Report-Only-Zyklus warten.

`Referrer-Policy: no-referrer` ergänzt das: Ohne sie kann der vollständige Pfad **inklusive Token** beim Klick auf einen externen Link als Referrer abfließen.

## 7. Rollout in vier Schritten

### Schritt 1 — risikofrei, sofort
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` global; `frame-ancestors`/`X-Frame-Options`/`no-referrer` für `/d`, `/admin`, `/owner`, `/app`, `/auth`.
**Keine CSP.** Kein Funktionsrisiko.

### Schritt 2 — HSTS
Zuerst `max-age=300` ohne `preload`, Subdomains prüfen, dann auf zwei Jahre hochziehen.
⚠️ HSTS ist für die Dauer von `max-age` **nicht zurücknehmbar**. Deshalb die kurze Vorstufe.

### Schritt 3 — CSP in `Report-Only`
```
Content-Security-Policy-Report-Only: <Policy aus Abschnitt 4>
```
Mindestens **14 Tage**, und in dieser Zeit bewusst durchlaufen:
- öffentliche Seite **ohne** Einwilligung,
- Seite **mit** Marketing-Einwilligung,
- Seite **mit** Analytics-Einwilligung,
- Maps-Embed nach Klick,
- Desktop-Hero **mit** Spline (WebGL, kein reduced-motion) — deckt `worker-src`/WASM auf,
- Login, `/admin`-Finanzmodul, PDF-Vorschau, Export-Download (`blob:`),
- `/d/<token>`-Strecke inklusive Signatur.

Verstöße sammeln. **Erst die Policy an die Realität anpassen, nicht die Realität an die Policy.**

### Schritt 4 — Durchsetzung
Header von `-Report-Only` auf `Content-Security-Policy` umstellen. Danach `Cross-Origin-Opener-Policy` erwägen.

## 8. Verifikation

```bash
curl -sI https://cogniiq.de/                | grep -iE 'content-security|strict-transport|x-content-type|referrer-policy|permissions-policy'
curl -sI https://cogniiq.de/d/testtoken     | grep -iE 'frame-ancestors|x-frame-options|referrer-policy'
curl -sI https://cogniiq.de/admin           | grep -iE 'frame-ancestors|x-robots-tag'
curl -sI https://cogniiq.de/assets/index.js | grep -i 'cache-control'   # muss immutable bleiben
```

Regressionstest: Erweiterung von `.github/scripts/test-deploy-cache-headers.mjs` um Header-Assertions — das Skript prüft bereits Cache-Header und ist die natürliche Stelle dafür.

## 9. Was dieser Plan nicht leistet

- **Keine Nonce-CSP** — erfordert eine Umstellung des Auslieferungspfads (Phase D).
- **Kein Schutz vor XSS durch `'unsafe-inline'`** — ehrlich benannt statt beschönigt.
- **Keine Wirkung auf die Supabase-API** — PostgREST wird direkt kontaktiert, ohne die Website. Dort wirken ausschließlich RLS und Grants.
- **Kein Ersatz für Rate-Limiting** — ein separates Thema.
