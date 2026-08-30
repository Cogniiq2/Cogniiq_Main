# BLOCKER: Der primäre CTA der Startseite ist auf dem Handy nicht klickbar

**Schwere: hoch. Direkter Umsatzverlust. Bestand — nicht durch die Arbeit dieser
Session entstanden.**

## Befund

Auf der Startseite liegt das Consent-Banner
(`fixed inset-x-0 bottom-24 z-[60]`) über dem Hero-CTA
„Erstgespräch vereinbaren".

Gemessen im Headless-Chromium gegen das gebaute Artefakt, neun Abtastpunkte
gleichmäßig über die Schaltfläche verteilt, `document.elementFromPoint` an
jedem Punkt:

| Viewport | CTA-Rechteck | verdeckte Abtastpunkte |
|---|---|---|
| 320 × 568 | y 686–740 | — (CTA liegt unterhalb des ersten Viewports) |
| **390 × 844** | y 621–675 | **9 von 9** |
| **430 × 932** | y 605–659 | **9 von 9** |

Das oberste Element an jedem Punkt ist das Consent-Banner
(„Wir verwenden technisch notwendige Speicherung …").

## Warum das teuer ist

Das Banner erscheint, **solange keine Entscheidung getroffen wurde** — also
genau beim Erstbesuch. Das ist exakt die organische Suchbesucherin, für die
die übrige SEO-Arbeit gemacht wird.

Ein Tipp auf die wichtigste Schaltfläche der Website trifft auf zwei der drei
verbreitetsten Handy-Breiten nicht den CTA, sondern das Banner. Kein Fehler,
keine Rückmeldung — es passiert schlicht nichts Erwartetes.

Zwei unabhängige Prüfungen in dieser Session sind darauf gestoßen.

## Warum es hier nicht behoben wurde

Die Consent-Oberfläche und ihre rechtlichen Festlegungen stehen unter Freeze
(`.claude/COPY-BRIEF-2.md`, Vorgabe „Consent"). Die Behebung verlangt eine
Gestaltungsentscheidung:

- Das Banner sitzt auf `bottom-24`, um die schwebende Navigations-Pille auf
  `bottom-6` freizuhalten. Beides nach unten zu schieben, verlagert das Problem
  nur.
- Das Banner niedriger zu machen, hieße die Consent-Texte zu kürzen. **Das ist
  eine rechtliche Entscheidung, keine gestalterische, und wurde deshalb nicht
  angefasst.**

Die Höhe und Prominenz des Banners darf nicht reduziert werden, um den CTA
freizulegen — das wäre eine Schwächung der Einwilligung und ausdrücklich
unzulässig.

## Empfohlene Prüfreihenfolge (Inhaber)

1. Befund auf einem echten Gerät (390 px Breite) im Inkognito-Modus
   nachvollziehen. Es dauert eine Minute.
2. Entscheiden, welcher Weg gilt:
   - **a)** Banner an `bottom-0` verankern und die Navigations-Pille
     ausblenden, solange das Banner sichtbar ist. Kein Textbezug, keine
     Consent-Schwächung. **Empfohlen.**
   - **b)** Hero-Inhalt bei sichtbarem Banner um dessen Höhe anheben
     (Padding statt Overlay). Sauber, aber der Hero ist `100svh` — Layout
     muss dabei geprüft werden.
   - **c)** Consent-Text kürzen. **Nur mit rechtlicher Freigabe.**
3. Nach der Behebung: die Neun-Punkte-Messung als Regressionstest festschreiben,
   damit der CTA nie wieder verdeckt werden kann.
