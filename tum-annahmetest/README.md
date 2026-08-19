# Annahmetest Garching

Lern- und Prüfungstrainer für den Eignungsfeststellungstest zum B.Sc. Wirtschaftsinformatik
an der TUM (Forschungscampus Garching).

## Format der Klausur

Grundlage ist die Originalklausur **IN0000 Endterm vom 30.08.2022**, 90 Minuten,
**24 Punkte**, ausschließlich Multiple Choice, **keine Hilfsmittel**:

| Aufgabe | Inhalt | Punkte |
|---|---|---|
| 1a | Symmetrieverhalten einer Funktion | 4 |
| 1b | Ableitung (Quotienten- und Kettenregel) | 8 |
| 2 | Logikrätsel: Ehrliche, Lügner und Normale | 8 |
| 3 | Englischer Fachtext, vier Aussagen einzeln beurteilen | 4 |

Entscheidend ist der Zuschnitt: **nur drei Aufgaben in 90 Minuten**. Pro Aufgabe bleibt
also sehr viel Zeit, aber ein einzelner Fehler kostet bis zu einem Drittel der Punkte.
20 der 24 Punkte hängen an drei erlernbaren Fertigkeiten (Ableiten, Logikrätsel, Symmetrie).

## Inhalt

- **304 Aufgaben**, davon 71 in den vier prüfungsrelevanten Blöcken
- **Originalklausur 2022** mit vollständig durchgerechnetem Lösungsweg zu allen drei Aufgaben
- **11 englische Fachtexte**, davon 6 im Klausurformat „Steht das so im Text?“
- **17 Crashkurs-Kapitel** mit Formeln, Rechenwegen und den typischen Fallen
- **Prüfungssimulation** im Originalformat: 24 Punkte, 90 Minuten, Rückmeldung erst am Ende
- **Fehlerarchiv** — falsche Aufgaben kommen automatisch wieder und verschwinden erst
  nach zwei richtigen Antworten in Folge
- **Zwei-Tage-Plan** mit Zeitangaben und direktem Einstieg in jede Übung

Der Fortschritt liegt in `localStorage` — kein Server, kein Konto, keine Netzwerkanfragen.

## Aufbau

```
src/app.html        Gerüst, Design-Tokens, CSS
src/app.js          Zustand, Auswahllogik, Prüfungsmodus, Ansichten
src/data/*.js       Aufgabenbestand und Crashkurs-Inhalte
build.js            baut die eigenständige Einzeldatei annahmetest.html
check.js            prüft den Bestand (IDs, Optionen, Erklärungen, Abdeckung)
```

## Bauen und selbst hosten

```bash
node check.js      # Bestand prüfen
node build.js      # annahmetest.html erzeugen
```

`annahmetest.html` ist vollständig eigenständig: eine Datei, keine externen Abhängigkeiten.
Sie lässt sich direkt im Browser öffnen oder auf beliebigem Static Hosting ablegen.

## Aufgaben ergänzen

In einer Datei unter `src/data/` anhängen — **die richtige Antwort steht immer an Index 0**,
die Reihenfolge wird zur Laufzeit pro Aufgabe stabil gemischt:

```js
q("abl-19","ableitung",2,"Frage …",["richtig","falsch","falsch","falsch"],0,"Lösungsweg …");
```

Erklärungen dürfen HTML enthalten (`<p>`, `<ol>`, `<code>`, `<b>`). **Verweise auf
Optionsnummern sind nicht zulässig**, da die Reihenfolge gemischt wird — falsche Antworten
immer inhaltlich benennen. Antwortoptionen wie „Keine der genannten“ bleiben beim Mischen
automatisch an letzter Stelle. Aussagen zum Textverständnis (`tv`) haben zwei Optionen.

Danach `node check.js && node build.js`.
