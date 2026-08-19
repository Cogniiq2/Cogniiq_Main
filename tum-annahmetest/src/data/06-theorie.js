// Crashkurs: kompakte Theorie und Technik je Themenblock
theorie("algebra","Algebra & Gleichungen",[
 ["Binomische Formeln","(a+b)² = a² + 2ab + b² · (a−b)² = a² − 2ab + b² · (a+b)(a−b) = a² − b². Die dritte ist im Test die wertvollste — sie verwandelt jede Differenz von Quadraten in ein Produkt und kürzt Brüche sofort."],
 ["Quadratische Gleichungen","Für x² + px + q = 0: x = −p/2 ± √((p/2)² − q). Schneller ist fast immer Vieta: Summe der Lösungen = −p, Produkt = q. Bei ganzzahligen Aufgaben zwei Zahlen suchen, die passen — das geht in Sekunden statt in einer Minute."],
 ["Diskriminante","D = b² − 4ac. D > 0: zwei Lösungen · D = 0: eine · D < 0: keine reelle. Fragen nach „genau eine Lösung“ sind immer Diskriminanten-Fragen."],
 ["Scheitelpunkt","x_S = −b/(2a), y_S durch Einsetzen. a > 0 → Minimum, a < 0 → Maximum."],
 ["Ungleichungen","Multiplikation oder Division mit einer negativen Zahl dreht das Zeichen um. Bei quadratischen Ungleichungen Nullstellen bestimmen und das Vorzeichen zwischen ihnen prüfen."],
 ["Beträge","|x − a| ≤ r bedeutet a − r ≤ x ≤ a + r: alle Punkte mit Abstand höchstens r von a. So gelesen braucht man keine Fallunterscheidung."],
 ["Wurzelgleichungen","Nach dem Quadrieren zwingend die Probe machen — Quadrieren erzeugt Scheinlösungen."]
]);

theorie("potenz","Potenzen, Wurzeln, Logarithmen",[
 ["Potenzgesetze","aᵐ · aⁿ = aᵐ⁺ⁿ · aᵐ : aⁿ = aᵐ⁻ⁿ · (aᵐ)ⁿ = aᵐⁿ · a⁻ⁿ = 1/aⁿ · a⁰ = 1."],
 ["Wurzeln als Potenzen","ⁿ√(aᵐ) = a^(m/n). Bei Zahlen wie 8^(2/3) immer zuerst die Wurzel ziehen, dann potenzieren — die Zwischenwerte bleiben klein."],
 ["Logarithmusgesetze","log(ab) = log a + log b · log(a/b) = log a − log b · log(aⁿ) = n · log a. log_b(x) beantwortet die Frage „b hoch was ergibt x?“."],
 ["Exponentialgleichungen","Beide Seiten auf dieselbe Basis bringen, dann Exponenten gleichsetzen. Geht das nicht, logarithmieren."],
 ["Einschachteln statt rechnen","Ohne Taschenrechner: log₂ 6 liegt zwischen 2 und 3, weil 4 < 6 < 8. Für Auswahlaufgaben reicht das fast immer."],
 ["Auswendig","2¹ bis 2¹⁰ = 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024. Dazu 3² bis 3⁵ = 9, 27, 81, 243 und die Quadratzahlen bis 20² = 400."]
]);

theorie("prozent","Prozent, Zins & Dreisatz",[
 ["Grundformel","Prozentwert = Grundwert · Prozentsatz. Der Grundwert ist immer der Wert, auf den sich die Angabe bezieht — bei Veränderungen der <em>alte</em> Wert."],
 ["Mit Faktoren rechnen","+25 % ist · 1,25, −20 % ist · 0,8. Mehrere Änderungen werden multipliziert, niemals addiert: −20 % und −10 % ergeben zusammen −28 %."],
 ["Rückwärtsrechnen","Wenn 96 € der Preis nach 20 % Rabatt ist, gilt 96 : 0,8 = 120 €. Der häufigste Fehler ist, stattdessen 20 % auf 96 € aufzuschlagen."],
 ["Zinseszins","K_n = K₀ · (1 + p)ⁿ. 72er-Regel: Verdopplungszeit ≈ 72 : Zinssatz in Prozent."],
 ["Proportional oder umgekehrt","Mehr Arbeiter → weniger Zeit (umgekehrt proportional): Produkt konstant. Mehr Ware → mehr Preis (proportional): Quotient konstant. Vor jedem Dreisatz kurz prüfen, welcher Fall vorliegt."],
 ["Kopfrechen-Bausteine","10 %, 5 % und 1 % bilden und addieren. Brüche kennen: 12,5 % = 1/8 · 16⅔ % = 1/6 · 33⅓ % = 1/3."],
 ["Mischungen und Mittelwerte","Nie Prozentsätze mitteln — immer absolute Mengen addieren und durch die Gesamtmenge teilen. Dasselbe gilt für Geschwindigkeiten."]
]);

theorie("analysis","Analysis",[
 ["Ableitungsregeln","xⁿ → n·xⁿ⁻¹ · eˣ → eˣ · ln x → 1/x · sin x → cos x · cos x → −sin x."],
 ["Produkt- und Kettenregel","(u·v)' = u'v + uv'. Kettenregel: äußere mal innere Ableitung, z. B. e^(2x) → 2e^(2x)."],
 ["Kurvendiskussion","f'(x) = 0 → Kandidat für Extremstelle. f''(x) > 0 → Minimum, f''(x) < 0 → Maximum. f''(x) = 0 mit Vorzeichenwechsel → Wendepunkt."],
 ["Integrale","∫xⁿ dx = xⁿ⁺¹/(n+1) + C, außer n = −1: dort ∫(1/x)dx = ln|x| + C. Bestimmtes Integral: Stammfunktion an der oberen minus an der unteren Grenze."],
 ["Grenzwerte bei Brüchen","Gleicher Grad → Verhältnis der Leitkoeffizienten. Nennergrad größer → 0. Zählergrad größer → ±∞."],
 ["0/0-Situationen","Faktorisieren und kürzen, nicht einsetzen: (x²−4)/(x−2) = x + 2."],
 ["Anschaulich prüfen","Ableitung = Steigung, Integral = Fläche. Bei einfachen Funktionen ist eine Skizze schneller als die Rechnung."]
]);

theorie("geo","Geometrie & Trigonometrie",[
 ["Flächen","Dreieck ½·g·h · Trapez ½·(a+c)·h · Kreis πr² · Parallelogramm g·h."],
 ["Körper","Quader a·b·c · Zylinder πr²h · Kugel (4/3)πr³ · Würfeloberfläche 6a²."],
 ["Pythagoras","a² + b² = c². Tripel auswendig: 3-4-5, 5-12-13, 8-15-17 und alle Vielfachen davon."],
 ["Skalierung","Längen mal k → Flächen mal k², Volumina mal k³. Eine der häufigsten Testfragen überhaupt."],
 ["Trigonometrie","sin = Gegenkathete/Hypotenuse, cos = Ankathete/Hypotenuse, tan = Gegen/Ankathete. Werte: sin 30° = 1/2, sin 45° = √2/2, sin 60° = √3/2, tan 45° = 1."],
 ["Trigonometrischer Pythagoras","sin²α + cos²α = 1 — damit lässt sich aus einem Wert der andere bestimmen."],
 ["Geraden","m = Δy/Δx. Schnitt mit der x-Achse: y = 0 setzen. Winkelsumme im n-Eck: (n−2)·180°."]
]);

theorie("stoch","Stochastik & Kombinatorik",[
 ["Laplace","P = günstige Fälle / mögliche Fälle, wenn alle Ergebnisse gleich wahrscheinlich sind."],
 ["Und / Oder","„Und“ bei Unabhängigkeit → multiplizieren. „Oder“ → addieren, dabei die Schnittmenge einmal abziehen: P(A∪B) = P(A) + P(B) − P(A∩B)."],
 ["Gegenereignis","Bei „mindestens ein …“ immer über 1 − P(keines) rechnen. Beispiel: mindestens eine Sechs bei 3 Würfen = 1 − (5/6)³."],
 ["Ohne Zurücklegen","Im zweiten Zug sinken Zähler und Nenner: 3/8 · 2/7."],
 ["Zählprinzipien","Reihenfolge wichtig, ohne Wiederholung → n·(n−1)·… Reihenfolge egal → Binomialkoeffizient (n über k) = n!/(k!(n−k)!). Mit Wiederholung → nᵏ."],
 ["Binomialkoeffizient im Kopf","(n über 2) = n(n−1)/2, (n über 3) = n(n−1)(n−2)/6. Damit sind Handschlag- und Team-Aufgaben Sekundensache."],
 ["Erwartungswert","E = Σ Wert · Wahrscheinlichkeit. Fairer Würfel: 3,5. Bei Spielen den Einsatz abziehen."],
 ["Totale Wahrscheinlichkeit","Anteile mal Teilwahrscheinlichkeiten addieren: 0,6·0,2 + 0,4·0,5 = 0,32."]
]);

theorie("folgen","Folgen & Reihen",[
 ["Arithmetisch","aₙ = a₁ + (n−1)·d. Achtung: n−1 Schritte, nicht n. Summe = n·(a₁ + aₙ)/2."],
 ["Geometrisch","aₙ = a₁ · qⁿ⁻¹. Summe der ersten n Glieder = a₁·(qⁿ − 1)/(q − 1)."],
 ["Unendliche geometrische Reihe","Nur für |q| < 1: Summe = a₁/(1 − q). Beispiel 1 + ½ + ¼ + … = 2."],
 ["Gauß","1 + 2 + … + n = n(n+1)/2. Damit auch 2 + 4 + … + 2n = n(n+1)."],
 ["Anzahl der Glieder","(letztes − erstes)/Schrittweite + 1. Das vergessene „+1“ ist ein Klassiker."]
]);

theorie("logik","Aussagenlogik & Mengen",[
 ["Implikation","A → B ist nur falsch, wenn A wahr und B falsch ist. Gleichwertig: ¬A ∨ B."],
 ["Kontraposition","A → B ist äquivalent zu ¬B → ¬A. Umkehrung (B → A) und Negation (¬A → ¬B) sind es <em>nicht</em> — hier entstehen die meisten Fehler."],
 ["De Morgan","¬(A ∧ B) = ¬A ∨ ¬B · ¬(A ∨ B) = ¬A ∧ ¬B. Beim Verneinen kippt „und“ zu „oder“."],
 ["Quantoren verneinen","„alle sind“ → „mindestens einer ist nicht“. „einige sind“ → „keiner ist“."],
 ["Notwendig vs. hinreichend","„Nur wenn B, dann A“ heißt A → B (B ist notwendig). „Wenn B, dann A“ heißt B → A (B ist hinreichend). Das Wörtchen „nur“ dreht die Richtung um."],
 ["Mengen","|A ∪ B| = |A| + |B| − |A ∩ B|. Bei drei Mengen ein Venn-Diagramm zeichnen und von innen nach außen füllen."],
 ["Teilmengen zählen","Eine n-elementige Menge hat 2ⁿ Teilmengen, davon (n über k) mit genau k Elementen."]
]);

theorie("schluss","Schlussfolgerndes Denken",[
 ["Gültige Schlüsse","Modus ponens: A → B, A, also B. Modus tollens: A → B, ¬B, also ¬A. Kettenschluss: A → B, B → C, also A → C."],
 ["Ungültige Schlüsse","Aus B folgt nicht A. Aus ¬A folgt nicht ¬B. Diese beiden Fehlschlüsse sind die Standardablenker im Test."],
 ["Syllogismen","Kreise zeichnen. Gültig ist nur, was in <em>jeder</em> möglichen Anordnung stimmt. Aus zwei „einige“-Sätzen folgt nie etwas Sicheres."],
 ["Rangordnungen","Sofort eine Kette bilden (A > B > C) statt jede Aussage einzeln zu prüfen."],
 ["Wahrheit und Lüge","Eine Annahme treffen, konsequent durchziehen, auf Widerspruch prüfen. Selbstbezügliche Aussagen wie „ich lüge“ sind der Schlüssel."],
 ["Modulo-Aufgaben","Wochentage und Zyklen über den Rest der Division durch 7 (bzw. die Zykluslänge)."]
]);

theorie("reihen","Zahlenreihen & Muster",[
 ["Prüfreihenfolge","1. Differenzen bilden. 2. Sind die Differenzen konstant? 3. Sind die Differenzen selbst eine Reihe? 4. Quotienten prüfen. 5. An Zahlenfamilien denken."],
 ["Zahlenfamilien","Quadrate 1, 4, 9, 16, 25 · Kuben 1, 8, 27, 64 · Primzahlen 2, 3, 5, 7, 11 · Fakultäten 1, 2, 6, 24, 120 · Fibonacci 1, 1, 2, 3, 5, 8 · Dreieckszahlen 1, 3, 6, 10, 15."],
 ["Zwei verschränkte Regeln","Steigt und fällt die Reihe abwechselnd, liegen meist zwei Regeln im Wechsel vor (z. B. ×2, dann −1). Dann jedes zweite Glied getrennt betrachten."],
 ["Kombinierte Regeln","Sehr häufig ist ×2 + 1 oder ×3 − 2. Erkennbar daran, dass die Differenzen sich verdoppeln bzw. verdreifachen."],
 ["Buchstabenreihen","Buchstaben in Positionszahlen umschreiben (A = 1 … Z = 26) und wie eine Zahlenreihe behandeln."],
 ["Zeitmanagement","Wenn nach 45 Sekunden kein Muster erkennbar ist: markieren, weitergehen, später zurückkommen."]
]);

theorie("algo","Algorithmisches Denken",[
 ["Binärzahlen","Stellenwerte von rechts: 1, 2, 4, 8, 16, 32, 64, 128. Umrechnen dezimal → binär: immer die größte passende Zweierpotenz abziehen."],
 ["Bits und Werte","n Bit ergeben 2ⁿ verschiedene Werte, größter Wert 2ⁿ − 1. Jedes zusätzliche Bit verdoppelt den Bereich."],
 ["Pseudocode lesen","Eine kleine Wertetabelle anlegen und die ersten zwei bis drei Durchläufe von Hand mitschreiben. Danach ist das Muster fast immer sichtbar."],
 ["Schleifen zählen","Verschachtelte Schleifen multiplizieren ihre Durchläufe. Bei „solange“-Schleifen genau auf die Abbruchbedingung achten — der letzte Durchlauf wird oft übersehen."],
 ["mod und Ganzzahldivision","17 mod 5 = 2 (Rest), 17 : 5 = 3 (abgeschnitten). „mod 2 == 0“ testet auf gerade Zahlen, „mod k == 0“ auf Vielfache."],
 ["Wachstum einschätzen","Halbieren bis 1 → log₂ n Schritte (bei 1000 rund 10). Jeder mit jedem → n²/2 Vergleiche. Alle Anordnungen → n!."],
 ["Rekursion","Von unten aufbauen: f(1), f(2), f(3) … statt von oben einzusetzen."]
]);

theorie("english","English Reading Comprehension",[
 ["Vorgehen","Erst die Fragen überfliegen, dann den Text einmal zügig lesen und pro Absatz drei Wörter als Randnotiz denken. Danach gezielt zurückspringen. Wer den Text zweimal vollständig liest, verliert im 90-Minuten-Takt zu viel Zeit."],
 ["Hauptaussage","Die richtige Antwort deckt den <em>ganzen</em> Text ab. Antworten, die nur einen Absatz oder ein Beispiel beschreiben, sind falsch — auch wenn sie stimmen."],
 ["Detailfragen","Die Antwort steht wörtlich im Text, meist umformuliert. Die Stelle wirklich aufsuchen, statt aus der Erinnerung zu antworten."],
 ["Inferenzfragen","Gesucht ist der kleinste Schritt über den Text hinaus, der zwingend folgt — nicht die interessanteste Interpretation."],
 ["Vokabel im Kontext","Das umgebende Satzgefüge liefert die Bedeutung, besonders Gegensatzwörter wie <em>rather than</em>, <em>whereas</em>, <em>yet</em>."],
 ["Ablenker erkennen","Typisch sind: extreme Wörter (always, never, all, must), inhaltlich richtige Aussagen, die aber nicht im Text stehen, und Antworten, die eine Beispielzahl zur allgemeinen Regel machen."],
 ["Haltung des Autors","Auf wertende Formulierungen achten („has aged best“, „was never the point“). Sie beantworten Tonfall-Fragen fast im Alleingang."]
]);

theorie("wi","Wahlbereich Wirtschaftsinformatik",[
 ["Deckungsbeitrag","DB je Stück = Preis − variable Stückkosten. Gesamt-DB = DB je Stück · Menge. Er deckt zuerst die Fixkosten."],
 ["Break-even","Gewinnschwelle = Fixkosten : Deckungsbeitrag je Stück. Darunter Verlust, darüber Gewinn."],
 ["Kostenarten","Fixkosten sind mengenunabhängig, variable Kosten steigen mit der Menge. Pro Stück sinken Fixkosten mit wachsender Menge (Fixkostendegression)."],
 ["Kennzahlen","Umsatzrendite = Gewinn/Umsatz · Konversionsrate = Abschlüsse/Besucher · Amortisationszeit = Investition/jährlicher Rückfluss."],
 ["Abschreibung","Linear: Anschaffungswert : Nutzungsdauer pro Jahr. Buchwert = Anschaffungswert − bisherige Abschreibungen."],
 ["Gewichtete Veränderungen","Anteile mit ihren Wachstumsfaktoren multiplizieren und addieren: 0,6·1,1 + 0,4·0,9 = 1,02."],
 ["Engpassdenken","In einer Prozesskette bestimmt die langsamste Station den Durchsatz. Mitteln ist hier immer falsch."],
 ["Tabellen lesen","Zuerst die Gesamtsumme bilden, dann Anteile. Auf Einheiten achten (Tsd. €, Mio. €) — Einheitenfehler kosten mehr Punkte als Rechenfehler."]
]);

/* ── Prüfungsrelevante Blöcke (nach der Originalklausur 2022) ────────── */
theorie("ableitung","Ableitungen: Quotienten- & Kettenregel",[
 ["Die drei Regeln","<b>Produktregel:</b> (u·v)′ = u′v + <b>u</b>v′ — hier steht ein Plus.<br><b>Quotientenregel:</b> (u/v)′ = (u′v − uv′) / v² — hier steht ein Minus, und die Reihenfolge ist entscheidend.<br><b>Kettenregel:</b> äußere Ableitung mal innere Ableitung."],
 ["Eselsbrücke Quotientenregel","„NAZ minus ZAN, durch N-Quadrat dann“ — <b>N</b>enner mal <b>A</b>bleitung <b>Z</b>ähler, minus <b>Z</b>ähler mal <b>A</b>bleitung <b>N</b>enner, geteilt durch Nenner zum Quadrat. Wer die Reihenfolge dreht, bekommt exakt das falsche Vorzeichen — und genau diese Variante steht in der Klausur als Antwortoption bereit."],
 ["ln(kx)′ = 1/x","Der wichtigste Einzelbaustein der Originalklausur. Jeder konstante Faktor im Logarithmus verschwindet beim Ableiten: ln(2x)′ = ln(7x)′ = ln(x)′ = 1/x. Grund: ln(kx) = ln k + ln x, und eine Konstante hat die Ableitung null."],
 ["Allgemein ln und e","ln(u)′ = u′/u — Ableitung des Inneren über das Innere. e^u′ = u′·e^u — die e-Funktion bleibt stehen und wird mit der inneren Ableitung multipliziert."],
 ["Wurzeln","√(u)′ = u′/(2√u). Bei u = x² ± c kürzt sich die Zwei immer weg, es bleibt x/√(x² ± c). Steht die Wurzel im Nenner, nie die Quotientenregel benutzen, sondern als negative Potenz schreiben: 1/√u = u^(−½)."],
 ["Trigonometrie","sin′ = cos · cos′ = −sin. Das Minus entsteht nur beim Ableiten des Cosinus. Bei sin(2x) oder cos(x²) die innere Ableitung nicht vergessen."],
 ["Doppelbrüche auflösen","Entsteht im Zähler ein Bruch (typisch bei Wurzeln), erweitere Zähler <em>und</em> Nenner mit dem störenden Term. Genau dieser Schritt führt in der Originalklausur von der rohen Quotientenregel auf die angebotene Antwortform."],
 ["Antwort nicht gefunden?","Deine Lösung sieht anders aus als alle Optionen? Erst ausklammern, kürzen und erweitern, bevor du an einen Rechenfehler glaubst. Die Klausur bietet die Lösung fast nie in der Form an, in der sie beim Ableiten entsteht."],
 ["Kontrolle ohne Taschenrechner","Setze eine Zahl ein, die die Wurzel glatt macht (bei √(x²−5) etwa x = 3, denn √4 = 2). Rechne den Wert mit zwei Kandidaten aus — meist unterscheiden sie sich sofort deutlich."]
]);

theorie("symmetrie","Symmetrie von Funktionen",[
 ["Die zwei Definitionen","<b>gerade</b>: f(−x) = f(x) → achsensymmetrisch zur y-Achse.<br><b>ungerade</b>: f(−x) = −f(x) → punktsymmetrisch zum Ursprung.<br>Merkhilfe: <em>gerade → Gerade (Achse)</em>, <em>ungerade → Punkt</em>."],
 ["Schnellregel für Polynome","Nur gerade Exponenten (x⁰, x², x⁴) → gerade. Nur ungerade Exponenten (x¹, x³, x⁵) → ungerade. Gemischt → keine der beiden Symmetrien. Konstanten zählen als x⁰, sind also gerade."],
 ["Die Standardbausteine","sin, tan und 1/x sind <b>ungerade</b>. cos und alle x-Potenzen mit geradem Exponenten sind <b>gerade</b>. e^x ist weder noch."],
 ["Produkte rechnen wie Vorzeichen","Setze gerade = „+“ und ungerade = „−“ und multipliziere: gerade·gerade = gerade, ungerade·ungerade = gerade, gerade·ungerade = ungerade. Für Quotienten gilt dasselbe. Bei <b>Summen</b> funktioniert das <em>nicht</em>: dort bleibt nur gerade+gerade = gerade und ungerade+ungerade = ungerade, gemischte Summen haben gar keine Symmetrie."],
 ["Verschobene Funktionen — der Klausurtrick","Steht überall derselbe Klammerausdruck, substituiere ihn: bei f(x) = sin(x−1)·(x−1)² setze u = x−1. Bestimme die Symmetrie von g(u), und übersetze am Ende zurück: u = 0 entspricht x = 1, das Zentrum liegt also bei (1, 0)."],
 ["Vorzeichenfalle beim Zurückübersetzen","Setze die Klammer null und löse nach x auf. (x − 2) → Zentrum bei x = 2. (x + 2) → Zentrum bei x = <b>−2</b>. Dieser eine Handgriff verhindert den häufigsten Fehler der Aufgabengattung."],
 ["Achse oder Punkt?","Ist die substituierte Funktion gerade, lautet die Antwort „achsensymmetrisch zur Geraden x = a“. Ist sie ungerade, lautet sie „punktsymmetrisch zu (a, 0)“. Bei Achsensymmetrie ist eine additive Konstante egal, bei Punktsymmetrie gehört sie ins Zentrum."],
 ["Der Freischuss","„Achsensymmetrisch zur x-Achse“ ist bei einer Funktion <b>immer</b> falsch — dann hätte ein x zwei y-Werte. Diese Option kannst du ohne jede Rechnung streichen."],
 ["Ein-Zahl-Probe","Unsicher? Rechne f(1) und f(−1). Bei gerader Funktion müssen beide gleich sein, bei ungerader entgegengesetzt. Stimmt weder das eine noch das andere, liegt keine Symmetrie zum Ursprung vor."]
]);

theorie("raetsel","Ehrliche, Lügner & Normale",[
 ["Die drei Rollen","<b>Ehrlicher:</b> jede Aussage wahr. <b>Lügner:</b> jede Aussage falsch. <b>Normaler:</b> darf beides — aus seinen Aussagen folgt nie ein Widerspruch. Der Normale ist der Joker und deshalb nie der Ansatzpunkt."],
 ["Das Grundverfahren","Nimm eine Person, unterstelle ihr nacheinander jede Rolle und prüfe, ob ein Widerspruch entsteht. Beginne bei der Person, die etwas <em>über sich selbst</em> sagt — solche Aussagen schränken am stärksten ein."],
 ["Zuerst die strengen Rollen prüfen","Widersprüche entstehen fast immer beim Ehrlichen oder beim Lügner, weil nur sie Verbote haben. Prüfe deshalb: Darf ein Lügner diesen Satz sagen (ist er also falsch)? Darf ein Ehrlicher ihn sagen (ist er also wahr)?"],
 ["Zwei Sätze, die alles entscheiden","„<b>Ich bin ein Lügner</b>“ kann weder ein Ehrlicher (wäre falsch) noch ein Lügner (wäre wahr) sagen → die Person ist ein <b>Normaler</b>.<br>„<b>Ich bin ein Ehrlicher</b>“ kann <em>jeder</em> sagen und liefert null Information."],
 ["Aussagen über Aussagen","„Was A gesagt hat, ist wahr“ überträgt den Wahrheitswert: Ist A's Aussage wahr, ist auch B's Aussage wahr — unabhängig davon, wer A und B sind. So verkettest du zwei Personen in einem Schritt."],
 ["Und, oder, mindestens","Die Verneinung von „<em>beide</em> sind Lügner“ ist „<em>mindestens einer</em> ist kein Lügner“ — nicht „keiner ist Lügner“ (De Morgan). Die Verneinung von „mindestens einer“ ist „keiner“. Fast jedes Rätsel dieser Art hängt genau an dieser Umformung."],
 ["Wenn-dann-Aussagen","Eine Wenn-dann-Aussage ist nur falsch, wenn die Bedingung zutrifft und die Folge nicht. Ist die Bedingung falsch, ist die gesamte Aussage <b>wahr</b>. Folge: Ein Lügner kann eine Wenn-dann-Aussage über sich selbst („Wenn ich ehrlich bin, dann …“) niemals aussprechen."],
 ["Alle Fälle prüfen","Höre nicht bei der ersten passenden Lösung auf. Bleiben mehrere widerspruchsfreie Fälle übrig, lautet die Antwort „nicht bestimmbar“ — oder du suchst die Aussage, die in <em>allen</em> offenen Fällen gilt."],
 ["Systematisch bei drei Personen","Bei genau einem Ehrlichen, einem Lügner und einem Normalen gibt es nur 3 · 2 · 1 = 6 Möglichkeiten. Notfalls schreibst du alle sechs untereinander und streichst durch — das dauert keine fünf Minuten und ist bei 8 Punkten die Zeit wert."]
]);

theorie("tv","Technisches Verständnis",[
 ["Die Aufgabenstellung genau lesen","Gefragt ist ausschließlich: Steht das so im Text oder folgt es <em>direkt</em> daraus? Ob die Aussage in der Wirklichkeit zutrifft, ist ausdrücklich <b>irrelevant</b>. Schalte dein Fachwissen bewusst ab — es führt hier systematisch in die Irre."],
 ["Vorgehen","Text einmal in Ruhe lesen und dabei Verneinungen, Vergleiche und Begründungen markieren. Dann Aussage für Aussage die zugehörige Textstelle aufsuchen und wörtlich vergleichen. Nie aus der Erinnerung antworten — bei vier Aussagen zu einem kurzen Text ist dafür genug Zeit."],
 ["Falle 1: Begriffsvertauschung","Ein einziges Substantiv wird ausgetauscht: „Kollaps konventioneller <b>Methoden</b>“ wird zu „Kollaps konventioneller <b>Designs</b>“. Gegenmittel: Unterstreiche das zentrale Substantiv der Aussage und suche genau dieses Wort im Text."],
 ["Falle 2: Bewertung umgedreht","Ein Nachteil wird als Vorteil ausgegeben. Achte auf Signalwörter im Text: <em>although, but, however, a serious problem, drops</em> — sie zeigen, auf welcher Seite der Bilanz etwas steht."],
 ["Falle 3: Übergeneralisierung","Aus „manche“ oder „nicht alle“ wird „alle“. Absolutwörter (<em>alle, immer, nie, jeder</em>) sind fast immer ein Alarmsignal. Suche gezielt nach einer Ausnahme im Text."],
 ["Falle 4: untergeschobene Ursache","Die Wirkung stimmt, die Begründung ist erfunden. Bei jedem <em>weil, deshalb, aufgrund</em> prüfst du zwei Dinge getrennt: Steht die Wirkung im Text? Und steht <b>diese</b> Ursache im Text?"],
 ["Falle 5: Querverbindung","Zwei richtige Aussagen aus verschiedenen Absätzen werden mit einem „weil“ verbunden. Prüfe, ob Ursache und Wirkung im Text im <em>selben</em> Zusammenhang stehen."],
 ["Falle 6: Handlungsempfehlung","Der Text beschreibt, die Aussage fordert („sollte“, „muss“). Fachtexte dieser Art geben selten Ratschläge — eine Aussage im Befehlston ist besonders verdächtig."],
 ["Stärke muss passen","<em>may</em> ↔ <em>kann</em>, <em>often</em> ↔ <em>häufig</em>, <em>must</em> ↔ <em>zwangsläufig</em>. Eine Aussage, die mehr behauptet als der Text hergibt, ist falsch; eine, die <em>weniger</em> behauptet, ist meist gedeckt."],
 ["Sinnprobe","Frage dich: Ergäbe der Text noch Sinn, wenn diese Aussage stimmte? Wird ein ganzer Absatz dadurch überflüssig, ist die Aussage falsch. Das funktioniert auch, wenn du die genaue Stelle nicht wiederfindest."],
 ["Unbekannte Fachwörter","Die Erklärung steht fast immer im ersten Satz, in dem der Begriff auftaucht. Den ersten Absatz langsam lesen, den Rest schneller."]
]);
