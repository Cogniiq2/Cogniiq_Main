# SPLINE — TECHNISCHE UND RECHTLICHE BEWERTUNG

**Erstellt:** 2026-09-22
**Gegenstand:** `@splinetool/react-spline` + `@splinetool/runtime`, Szene `prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode`
**Status:** BEWERTUNG — keine Änderung vorgenommen.

## 1. Wann Spline geladen wird — präzise

Das Erstaudit hat diesen Punkt **zu pauschal** dargestellt. Die tatsächliche Ladelogik ist deutlich zurückhaltender als dort beschrieben. Korrigierte Darstellung nach vollständiger Durchsicht von `src/components/hero/DesktopHero.tsx`:

| Bedingung | Verhalten | Fundstelle |
|---|---|---|
| Mobil | **Nie geladen** — nur `DesktopHero` bindet es ein | Komponentenstruktur |
| `prefers-reduced-motion: reduce` | **Nicht geladen**, statischer Fallback | `:53-56`, `:129` |
| `navigator.connection.saveData` oder `effectiveType ∈ {slow-2g, 2g}` | **Nicht geladen** | `:63-76`, `:129` |
| Kein WebGL-Kontext erzeugbar | **Nicht geladen** — mit Wegwerf-Canvas geprüft, bevor ~2 MB geladen werden | `:38-51`, `:129` |
| Sonst | Geladen, **verzögert bis `requestIdleCallback`** (Timeout 2000 ms) bzw. 200 ms | `:100-118` |
| Unmittelbar vor dem Laden | `<link rel="preconnect" href="https://prod.spline.design" crossorigin>` wird dynamisch eingefügt | `:88-97` |

**Bewusst kein `preconnect` in `index.html`** — die Begründung im Code ist technisch korrekt: ein globaler Preconnect würde auf jeder Seite eine Verbindung öffnen, auch mobil, wo die Szene nie rendert. Derselbe Fehler war zuvor bei den Google-Fonts-Preconnects aufgetreten und wurde behoben.

> **Korrektur gegenüber dem Erstaudit:** Die Aussage „lädt automatisch auf jeder Seite" war **zu weit gefasst**. Die Ladung ist auf Desktop mit WebGL beschränkt, respektiert `prefers-reduced-motion` und `Save-Data` und erfolgt erst im Leerlauf. Das ist sorgfältige Performance-Arbeit. **Das rechtliche Problem bleibt davon unberührt** — es geht um Einwilligung, nicht um Häufigkeit.

## 2. Kontaktierte Domains

| Domain | Wann | Übertragen |
|---|---|---|
| `https://prod.spline.design` | Szenendatei `/kZDDjO5HuC9GJUM2/scene.splinecode` | **IP-Adresse**, User-Agent, `Referer`, TLS-Merkmale, Zeitpunkt |
| *(keine weitere)* | Der Runtime (`@splinetool/runtime`) kommt aus dem **eigenen** Bundle, nicht von extern | — |

**Positiv:** Es wird nur **eine** Datei von **einer** Drittdomain geladen. Kein Tracking-Skript, kein Pixel, kein Cookie. Der `preconnect` trägt `crossOrigin=''`, sendet also keine Credentials.

**Nicht feststellbar:** ob Spline serverseitig protokolliert und wie lange. Die Anbieterseite ist nicht auditierbar. → **UNKNOWN**

## 3. Rechtliche Bewertung

### 3.1 § 25 TDDDG

§ 25 Abs. 1 TDDDG erfasst das **Speichern von Informationen auf dem Endgerät** und den **Zugriff auf bereits gespeicherte Informationen**.

Der Abruf einer Datei von einem Drittserver ist für sich genommen **kein** Speicher- oder Auslesevorgang auf dem Endgerät. **§ 25 TDDDG ist daher nach hier vertretener Auffassung nicht unmittelbar einschlägig**, solange der Spline-Runtime keine Cookies, keinen `localStorage` und keinen Cache-Eintrag zu Wiedererkennungszwecken setzt.

> **Korrektur gegenüber dem Erstaudit:** Dort war Spline unter „§ 25 Abs. 1 TDDDG" eingeordnet. Das war **zu grob**. Die tragende Norm ist Art. 6 DSGVO, nicht § 25 TDDDG.
> Ob der Runtime clientseitig etwas ablegt, wurde **nicht** verifiziert (fremder Code). → **UNKNOWN**, mit einer Netzwerk-/Storage-Inspektion in fünf Minuten klärbar.

### 3.2 Art. 6 DSGVO — die tatsächlich tragende Norm

Die IP-Adresse wird zwingend an Spline übermittelt und ist ein personenbezogenes Datum. Es braucht eine Rechtsgrundlage.

| Grundlage | Bewertung |
|---|---|
| **Art. 6 Abs. 1 lit. f** (berechtigtes Interesse) | Denkbar, aber schwach: Die Szene ist **rein dekorativ** — das Panel ist im Code ausdrücklich `aria-hidden` (`:63-66`: *„The scene is decorative (the whole panel is aria-hidden)"*). Ein dekoratives Element trägt eine Drittlandübermittlung nur schwer |
| **Art. 6 Abs. 1 lit. a** (Einwilligung) | Sauber — erfordert aber eine dritte Consent-Kategorie („Externe Medien"), da weder „Marketing" noch „Statistik" passt |
| **Art. 6 Abs. 1 lit. b** (Vertragserfüllung) | Nicht einschlägig |

### 3.3 Art. 13 und Art. 44 ff.

- **Art. 13 Abs. 1 lit. e:** Spline ist ein Empfänger und wird in der Datenschutzerklärung **nicht genannt**. → **eigenständiger Verstoß, unabhängig von der Rechtsgrundlagenfrage.**
- **Art. 44 ff.:** Sitz und Verarbeitungsort von Spline sind aus dem Repository nicht bestimmbar (`prod.spline.design` liegt vermutlich auf einem US-CDN). Kein TIA, keine SCC dokumentiert. → **UNKNOWN**

### 3.4 Konsistenz mit dem eigenen Anspruch

Das wiegt praktisch am schwersten: `ConsentMapEmbed.tsx:6-14` hält als Grundsatz fest:

> *„Die Consent-Banner verspricht, dass externe Dienste erst nach einer Wahl laden, und seine zwei Zwecke (Analytics, Marketing) decken eine Karte nicht ab, also ist die Karte an keinen von beiden gebunden: sie wartet auf ihren eigenen Klick."*

**Google Maps hält sich daran. Spline nicht.** Es ist derselbe Sachverhalt — ein externer Dienst, der beim Rendern kontaktiert wird —, unterschiedlich behandelt. Das ist der überzeugendste Grund für eine Korrektur: nicht die Bußgeldgefahr, sondern die **Inkonsistenz zum eigenen, schriftlich fixierten Maßstab**.

## 4. Urheberrecht

| Frage | Status |
|---|---|
| Wurde die Szene selbst erstellt oder aus der Spline-Community übernommen? | **UNKNOWN** → `NEEDS BUSINESS CONFIRMATION` |
| Bei Community-Szene: Lizenz, Attributionspflicht? | **UNKNOWN** |
| Lizenz von `@splinetool/runtime` / `@splinetool/react-spline` | **Zu prüfen.** Anders als die übrigen Abhängigkeiten (MIT/ISC) sind dies Pakete eines kommerziellen Anbieters |
| Was passiert, wenn der Spline-Account gekündigt oder das kostenlose Kontingent überschritten wird? | Die Szene wird nicht mehr ausgeliefert. **Abgefedert:** `ErrorBoundary` + `SplineFallback` (`:204-207`) — die Seite bleibt funktionsfähig. Gut gelöst |

## 5. Drei Optionen

### Option A — vollständig entfernen

| | |
|---|---|
| Aufwand | Gering: `DesktopHero.tsx` auf `SplineFallback` reduzieren, `src/components/ui/splite.tsx` löschen, zwei npm-Pakete entfernen |
| Rechtlich | ✅ Art. 6, Art. 13, Art. 44, Urheberrecht und Lizenzfrage **auf einen Schlag erledigt** |
| Performance | ✅ ~560 KiB komprimiertes JS plus Szenendatei gespart; zwei CSP-Einträge entfallen |
| Nachteil | ❌ Verlust eines visuell starken Elements auf der wichtigsten Seite |
| Risiko | Sehr gering — der Fallback existiert bereits und ist getestet |

### Option B — Self-Hosting

| | |
|---|---|
| Vorgehen | `scene.splinecode` einmalig herunterladen, unter `public/` ablegen, `SPLINE_SCENE` auf einen relativen Pfad umstellen, `preconnectToSceneHost()` entfernen |
| Rechtlich | ✅ **Kein Drittlandtransfer, keine Einwilligung nötig, keine Nennung in der Datenschutzerklärung erforderlich** — die Datei kommt von `cogniiq.de` |
| Performance | ✅ Besser: keine Fremd-DNS, kein Fremd-TLS, kein `preconnect` |
| Voraussetzung | ⚠️ **Die Lizenz muss das erlauben.** Das ist die einzige offene Frage dieser Option |
| Aufwand | Gering — etwa eine Stunde |
| Nachteil | Szenenänderungen erfordern ein Redeploy statt eines Spline-Editor-Speicherns |

### Option C — Consent-Gating

| | |
|---|---|
| Vorgehen | Dritte Kategorie „Externe Medien" im Consent-Banner; Spline nur bei erteilter Einwilligung; bis dahin `SplineFallback`. Alternativ Zwei-Klick wie bei Maps |
| Rechtlich | ✅ Sauber über Art. 6 Abs. 1 lit. a |
| Aufwand | **Am höchsten:** Banner, Einstellungsdialog, `consent.ts`, Datenschutzerklärung, Tests (`consent.test.ts` prüft den bestehenden Vertrag) |
| Nachteil | ❌ Die große Mehrheit sieht die Szene nie — der Aufwand erkauft ein Element, das kaum jemand zu Gesicht bekommt. Zudem verkompliziert eine dritte Kategorie das Banner für ein **dekoratives** Element |

## 6. Empfehlung

> ### **Option B (Self-Hosting), sofern die Spline-Lizenz es zulässt. Andernfalls Option A (Entfernen).**

**Begründung:**

1. **Option B löst alle vier Rechtsfragen gleichzeitig** — Rechtsgrundlage, Empfängernennung, Drittlandtransfer und die Konsistenz zum Maps-Grundsatz — **ohne** ein visuelles Element zu opfern und **ohne** das Consent-Banner zu verkomplizieren.
2. **Sie ist zugleich die technisch beste Lösung.** Eine Fremddomain weniger im kritischen Ladepfad, kein `preconnect`, zwei CSP-Einträge weniger. Rechtliche Korrektheit und Performance zeigen hier in dieselbe Richtung — das ist selten und sollte genutzt werden.
3. **Option C ist unverhältnismäßig.** Eine dritte Consent-Kategorie ist eine dauerhafte Last auf jedem Seitenaufruf für ein `aria-hidden`-Dekorationselement. Das ist ein schlechtes Verhältnis von Aufwand zu Nutzen.
4. **Option A ist der richtige Rückfallplan**, nicht die erste Wahl: Der Hero ist das erste, was ein Besucher auf der wichtigsten Seite sieht. Ein funktionierendes visuelles Element ohne Not aufzugeben, ist ein unnötiger Verlust — solange es eine Variante gibt, die dasselbe Ergebnis rechtlich sauber liefert.

**Erforderliche Vorabklärung für Option B:** Erlaubt die Spline-Lizenz das Self-Hosting der exportierten `.splinecode`-Datei? → `NEEDS BUSINESS CONFIRMATION`

**Unabhängig von der gewählten Option sofort erledigen:** Prüfen, ob der Spline-Runtime clientseitig etwas speichert (DevTools → Application → Storage, nach dem Laden der Szene). Das beantwortet die offene § 25-TDDDG-Frage aus Abschnitt 3.1 in wenigen Minuten und entscheidet, ob überhaupt Eile besteht.
