# Annahmetest Garching

Lern- und Prüfungstrainer für den Eignungsfeststellungstest zum B.Sc. Wirtschaftsinformatik
an der TUM (Forschungscampus Garching).

Der Test dauert **90 Minuten**, bringt maximal **100 Punkte** und besteht ausschließlich aus
**Single-Choice-Aufgaben**. Geprüft werden Schulmathematik, logisches Denken und englisches
Textverständnis; dazu kommt ein Wahlbereich, in dem man zwischen einem Informatik- und einem
Wirtschaftsinformatik-Block wählen kann. **Hilfsmittel sind nicht zugelassen** — kein
Taschenrechner, keine Formelsammlung.

## Inhalt

- **233 Aufgaben** in 13 Themenblöcken, jede mit Lösungsweg und der typischen Falle
- **5 englische Lesetexte** mit je 4 Fragen (Hauptaussage, Detail, Inferenz, Vokabel im Kontext)
- **Crashkurs** — kompakte Formeln und Rechentechniken für den Kopf, ohne Taschenrechner
- **Prüfungssimulation** — 40 Aufgaben, 90 Minuten, Rückmeldung erst am Ende
- **Fehlerarchiv** — falsch beantwortete Aufgaben kommen automatisch wieder und verschwinden
  erst nach zwei richtigen Antworten in Folge
- **Lernplan** bis zum Testtag mit Countdown

Der Fortschritt liegt in `localStorage` — kein Server, kein Konto, keine Netzwerkanfragen.

## Aufbau

```
src/app.html        Gerüst, Design-Tokens, CSS
src/app.js          Zustand, Auswahllogik, Prüfungsmodus, Ansichten
src/data/*.js       Aufgabenbestand und Crashkurs-Inhalte
build.js            baut die eigenständige Einzeldatei dist/index.html
check.js            prüft den Bestand (IDs, Optionen, Erklärungen, Abdeckung)
```

## Bauen und selbst hosten

```bash
node check.js      # Bestand prüfen
node build.js      # dist/index.html erzeugen
```

`dist/index.html` ist vollständig eigenständig: eine Datei, keine externen Abhängigkeiten.
Sie lässt sich direkt im Browser öffnen oder auf beliebigem Static Hosting ablegen.

## Aufgaben ergänzen

In einer Datei unter `src/data/` anhängen — **die richtige Antwort steht immer an Index 0**,
die Reihenfolge wird zur Laufzeit pro Aufgabe stabil gemischt:

```js
q("alg-25","algebra",2,"Frage …",["richtig","falsch","falsch","falsch"],0,"Lösungsweg …");
```

Antwortoptionen wie „Keine der genannten“ bleiben beim Mischen automatisch an letzter Stelle.
Danach `node check.js && node build.js`.
