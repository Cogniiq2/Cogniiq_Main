# Bewusst nicht umgesetzt

Jeder Punkt ist gemessen und verstanden. Keiner wurde aus Zeitmangel
liegengelassen — jeder hat einen Grund und einen Plan.

---

## 1. Consent-Banner verdeckt den Hero-CTA

**Höchste Priorität.** Siehe `BLOCKER-cta-verdeckt.md`.

---

## 2. Consent-Banner als LCP-Element (−2,0 s mobil möglich)

**Gemessen:** mobil `/` LCP 2924 ms → ca. 932 ms; `/kontakt` 2520 ms → ca. 1000 ms.
Der größte einzelne Performance-Hebel der Website.

**Warum nicht umgesetzt:** `showBanner` startet bewusst auf `false`, um einen
Hydration-Mismatch zu vermeiden. Das Banner vorzurendern hieße, es allen
auszuliefern — auch denen, die längst zugestimmt haben — und es per JavaScript
wieder auszublenden. Das erzeugt ein sichtbares Aufblitzen des Consent-Banners
bei jedem Wiederbesuch. Das ist schlechter als das aktuelle Verhalten.

**Plan:**
1. Serverseitig lässt sich der Consent-Status nicht kennen — er steht in
   `localStorage`. Also **nicht** vorrendern.
2. Stattdessen: die *bemalte Fläche* verkleinern, damit das Banner kein
   LCP-Kandidat mehr ist. Der Textabsatz mit 54 604 px² ist der Auslöser. Eine
   kompaktere Darstellung mit ausklappbaren Details senkt die Fläche unter die
   des Hero-Textes, **ohne den Consent-Text zu entfernen**.
3. Rechtliche Freigabe für die Darstellung einholen, bevor gebaut wird.
4. Vorher/Nachher mit derselben Methodik messen.

**Vorsicht:** Nicht in Richtung „Banner erst nach LCP einblenden" optimieren.
Das verbessert die Kennzahl und verschlechtert die Einwilligung.

---

## 3. Supabase aus dem öffentlichen Bundle lösen (−50 kB brotli auf 91 Routen)

**Gemessen:** 207 152 B roh / 50 190 B brotli, rund 28 % des Entry-Chunks, auf
jeder öffentlichen Seite. Öffentlich wird kein Supabase-Request abgesetzt.

**Warum nicht umgesetzt:** `AuthProvider` umschließt in `src/App.tsx` den
gesamten Baum. Die Auftrennung ist ein Eingriff in die geteilte
Authentifizierungs-Architektur — genau die Fläche, an der parallel die Owner-OS-
und CRM-Arbeit läuft. Ein Konflikt dort wäre teurer als der Gewinn.

**Plan (nach dem Zusammenführen der Owner-OS-Arbeit):**
1. `isPrivateSurface()` existiert bereits und markiert die Grenze.
2. `AuthProvider` nur unterhalb dieser Grenze montieren, statt um den ganzen
   Baum. Öffentliche Routen brauchen ihn nicht — sie stellen keine Anfrage.
3. `src/lib/supabase.ts` von einem Modul-Singleton auf eine faule Fabrik
   umstellen, damit `createClient` nicht beim Import läuft.
4. Absichern: ein Test, der fehlschlägt, sobald ein öffentlicher Chunk
   `@supabase/supabase-js` enthält. Ohne diesen Test kriecht es zurück.
5. Vorher/Nachher-Transferbytes messen.

**Nicht anfassen**, solange Owner-OS-Branches offen sind.

---

## 4. Desktop-Hero: LCP 3176 ms und ein CLS-Ausreißer von 0,7065

**Gemessen:** Desktop `/` LCP 3176 ms gegenüber 900–1084 ms auf jeder anderen
Desktop-Route. CLS in vier von fünf Läufen 0,0087 — **im fünften 0,7065**.

**Ursache:** `HeroSection` rendert bewusst immer `MobileHero` vor und wechselt
erst nach Hydration und `matchMedia` auf den faul geladenen `DesktopHero`.

**Warum nicht umgesetzt:** Die aktuelle Konstruktion ist eine *absichtliche*
Vermeidung eines Hydration-Mismatches und im Code dokumentiert. Eine echte
Behebung braucht viewport-abhängiges Vorrendern oder eine reine
CSS-Art-Direction — kein Verschieben des Imports. Das ist ein Umbau, kein Fix,
und die Startseite ist die falsche Seite für ein unabgesichertes Experiment.

**Zusätzlicher Befund:** Mobil und Desktop tragen **unterschiedliche H1-Texte**.
Da Google mobil-first indexiert, ist die indexierte H1 die mobile
(„Digitale Systeme, die Unternehmen führen."). Die Desktop-Variante
(„Erreichbar, wenn niemand frei ist.") sieht die Suchmaschine nicht.
Das ist eher eine Positionierungs- als eine Technikfrage — und sie gehört
beantwortet, bevor jemand den Hero umbaut.

---

## 5. Restlicher horizontaler Überlauf (61 Kombinationen)

Nach der Behebung der zwei Hauptursachen (siehe PR „remove the horizontal
scrollbar") bleiben 61 Route/Viewport-Kombinationen. Ursachen einzeln
identifiziert:

| Betroffen | Ursache |
|---|---|
| `/bayreuth\|muenchen\|regensburg/*` (+35 px) | nicht umbrechende Flex-Zeile mit zwei `nowrap`-CTAs |
| `/kosten-ki-telefonassistent` (+59 px) | `min-width: auto` auf Grid-Kindern des ROI-Rechners |
| `/praxen`, `/automatisierung-*` | überbreite `inline-flex`-Badges, Kartengitter |

**Warum nicht umgesetzt:** Mehrere dieser Seiten stehen unter dem
SEO-Experiment-Freeze. Jede Ursache braucht ihre eigene Behebung und ihre
eigene Vorher/Nachher-Messung; sie in eine Sammeländerung zu werfen, hieße auf
eingefrorenen Seiten ungemessen zu arbeiten.

**Weiterhin gilt: kein `overflow-x: hidden`.** Es versteckt das Symptom, lässt
den Text abgeschnitten und bricht `position: sticky` im selben Teilbaum.

---

## 6. Anfragefragmentierung — ausdrücklich nicht empfohlen

Die Startseite stellt 46 JS-Anfragen, 31 davon unter 1,2 kB (einzelne
`lucide-react`-Icons). Das klingt schlimm und ist es nicht: zusammen **16,4 kB
= 6,4 %** der JS-Bytes. Über HTTP/2 ist der Gewinn vermutlich klein, und
`vite.config.ts` hat heute kein `manualChunks` — eines einzuführen ist ein
echter Eingriff mit Regressionsfläche.

**Der Overhead wurde nicht gemessen. Deshalb wird hier keine Zahl behauptet und
nichts empfohlen.**
