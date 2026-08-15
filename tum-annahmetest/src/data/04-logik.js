// Aussagenlogik & Mengen | Schlussfolgerndes Denken | Zahlenreihen & Muster | Algorithmisches Denken
q("log-01","logik",1,"Wie lautet die Verneinung von „Alle Bewerber bestehen den Test“?",
 ["Mindestens ein Bewerber besteht den Test nicht.","Kein Bewerber besteht den Test.","Alle Bewerber bestehen den Test nicht.","Die meisten Bewerber bestehen den Test nicht.","Genau ein Bewerber besteht den Test nicht."],0,
 "Die Verneinung eines „alle“-Satzes ist ein „mindestens einer nicht“-Satz — nicht „keiner“. Das ist die mit Abstand häufigste Falle im Logikteil.");

q("log-02","logik",2,"Welche Aussage ist gleichbedeutend mit „Wenn es regnet, ist die Straße nass“?",
 ["Wenn die Straße nicht nass ist, regnet es nicht.","Wenn die Straße nass ist, regnet es.","Wenn es nicht regnet, ist die Straße nicht nass.","Es regnet genau dann, wenn die Straße nass ist.","Die Straße ist immer nass."],0,
 "Nur die Kontraposition (¬B → ¬A) ist logisch äquivalent zu A → B. Umkehrung und Negation sind es nicht.");

q("log-03","logik",2,"Die Implikation <code>A → B</code> ist genau dann falsch, wenn",
 ["A wahr und B falsch ist","A falsch und B wahr ist","beide falsch sind","beide wahr sind","A falsch ist"],0,
 "Ein Versprechen wird nur gebrochen, wenn die Bedingung eintritt und die Folge ausbleibt. Bei falscher Prämisse ist die Implikation immer wahr.");

q("log-04","logik",2,"<code>¬(A ∧ B)</code> ist gleichbedeutend mit",
 ["¬A ∨ ¬B","¬A ∧ ¬B","A ∨ B","¬A → B","A ∧ ¬B"],0,
 "De Morgan: Bei der Verneinung wird aus „und“ ein „oder“ und jeder Teil wird negiert.");

q("log-05","logik",2,"<code>¬(A ∨ B)</code> ist gleichbedeutend mit",
 ["¬A ∧ ¬B","¬A ∨ ¬B","A ∧ B","¬A → ¬B","A ∨ ¬B"],0,
 "Zweite De-Morgan-Regel: „weder A noch B“ heißt „nicht A und nicht B“.");

q("log-06","logik",1,"Welcher Ausdruck ist eine Tautologie (immer wahr)?",
 ["A ∨ ¬A","A ∧ ¬A","A → ¬A","A ↔ ¬A","¬A"],0,
 "Satz vom ausgeschlossenen Dritten. Das Gegenstück A ∧ ¬A ist eine Kontradiktion (immer falsch).");

q("log-07","logik",2,"Gegeben: „Wenn es regnet, ist die Straße nass.“ Die Straße ist nicht nass. Was folgt?",
 ["Es regnet nicht.","Es regnet.","Es hat geregnet.","Nichts Sicheres.","Die Straße ist trocken, weil es nie regnet."],0,
 "Modus tollens: ¬B erzwingt ¬A. Das ist der gültige Schluss, den die Kontraposition liefert.");

q("log-08","logik",2,"Gegeben: „Wenn es regnet, ist die Straße nass.“ Die Straße ist nass. Was folgt?",
 ["Nichts Sicheres.","Es regnet.","Es regnet nicht.","Es wird regnen.","Die Straße war vorher trocken."],0,
 "Die Straße kann auch durch einen Wagen der Stadtreinigung nass sein. Aus B folgt nicht A — dieser Fehlschluss heißt Bejahung der Konklusion.");

q("log-09","logik",2,"Wie lautet die Verneinung von „Einige Module sind schwierig“?",
 ["Kein Modul ist schwierig.","Alle Module sind schwierig.","Einige Module sind nicht schwierig.","Die meisten Module sind leicht.","Genau ein Modul ist schwierig."],0,
 "„Es gibt mindestens eines“ wird verneint zu „es gibt keines“. Merkschema: ∀ ↔ ∃¬ und ∃ ↔ ∀¬.");

q("log-10","logik",3,"Von 30 Studierenden belegen 18 Mathematik, 15 Informatik und 8 beides. Wie viele belegen keines der beiden Fächer?",
 ["5","3","7","2","12"],0,
 "|A ∪ B| = 18 + 15 − 8 = 25. Rest: 30 − 25 = 5. Die Schnittmenge wird sonst doppelt gezählt.");

q("log-11","logik",2,"Wie viele Teilmengen hat eine Menge mit 3 Elementen?",
 ["8","6","3","9","7"],0,
 "2³ = 8, inklusive leerer Menge und der Menge selbst. Jedes Element ist drin oder nicht.");

q("log-12","logik",2,"Wie viele zweielementige Teilmengen hat eine Menge mit 4 Elementen?",
 ["6","8","12","4","16"],0,
 "(4 über 2) = 4 · 3/2 = 6.");

q("log-13","logik",1,"Welche Aussage über die leere Menge ist richtig?",
 ["Sie ist Teilmenge jeder Menge.","Sie ist Element jeder Menge.","Sie hat eine Teilmenge weniger als jede andere Menge.","Sie ist mit keiner Menge vergleichbar.","Sie hat keine Teilmengen."],0,
 "Die Bedingung „jedes Element von ∅ liegt auch in M“ ist leer erfüllt. Teilmenge (⊆) und Element (∈) sind verschiedene Beziehungen.");

q("log-14","logik",2,"Für <code>A = {1,2,3,4}</code> und <code>B = {3,4,5}</code> ist <code>A \\ B</code> gleich",
 ["{1, 2}","{3, 4}","{5}","{1, 2, 5}","{1,2,3,4,5}"],0,
 "Differenzmenge: alles aus A, was nicht in B liegt.");

q("log-15","logik",3,"Die Aussage <code>A ↔ B</code> („genau dann, wenn“) ist wahr, wenn",
 ["A und B denselben Wahrheitswert haben","beide wahr sind","mindestens eine wahr ist","genau eine wahr ist","beide falsch sind"],0,
 "Äquivalenz heißt Gleichheit der Wahrheitswerte — beide wahr oder beide falsch. „Genau eine wahr“ wäre das exklusive Oder.");

q("log-16","logik",3,"Wie viele Zeilen hat die Wahrheitstafel einer Formel mit 4 Variablen?",
 ["16","8","4","32","24"],0,
 "2⁴ — pro Variable verdoppelt sich die Zeilenzahl.");

q("log-17","logik",2,"„Nur wer die Klausur besteht, erhält den Schein.“ Was folgt daraus für jemanden mit Schein?",
 ["Er hat die Klausur bestanden.","Er hat die Klausur nicht bestanden.","Nichts Sicheres.","Er hat auch die Übung bestanden.","Er hat mindestens 50 Punkte."],0,
 "„Nur wenn B, dann A“ bedeutet A → B, nicht B → A. Bestehen ist notwendig, aber vielleicht nicht hinreichend.");

q("log-18","logik",3,"<code>A → B</code> ist gleichbedeutend mit",
 ["¬A ∨ B","A ∨ ¬B","¬A ∧ B","A ∧ B","B → A"],0,
 "Entweder die Prämisse trifft nicht zu, oder die Folge tritt ein. Diese Umformung macht Implikationen in Wahrheitstafeln schnell prüfbar.");

q("log-19","logik",2,"Welche Aussage ist mit „Kein Informatiker mag Excel“ gleichbedeutend?",
 ["Alle Informatiker mögen Excel nicht.","Einige Informatiker mögen Excel nicht.","Nicht alle Informatiker mögen Excel.","Alle, die Excel mögen, sind Informatiker.","Manche Excel-Nutzer sind keine Informatiker."],0,
 "„Kein X ist Y“ und „alle X sind nicht-Y“ sind dieselbe Aussage.");

q("log-20","logik",3,"Gegeben sind A → B und B → C. Was folgt sicher?",
 ["A → C","C → A","¬A → ¬C","B → A","A ↔ C"],0,
 "Kettenschluss (Transitivität). Die Umkehrungen folgen nicht.");

q("sch-01","schluss",2,"Alle Rosen sind Blumen. Einige Blumen verwelken schnell. Was folgt zwingend?",
 ["Keine der genannten Aussagen folgt zwingend.","Einige Rosen verwelken schnell.","Alle Rosen verwelken schnell.","Keine Rose verwelkt schnell.","Alle Blumen sind Rosen."],0,
 "Die „einigen“ Blumen müssen nicht die Rosen sein. Bei Syllogismen zählt nur, was in <em>jedem</em> denkbaren Fall gilt.");

q("sch-02","schluss",1,"Alle A sind B. Alle B sind C. Was folgt?",
 ["Alle A sind C.","Alle C sind A.","Einige C sind keine A.","Kein A ist C.","Nichts folgt."],0,
 "Kreise ineinander: A liegt in B, B liegt in C, also liegt A in C.");

q("sch-03","schluss",2,"Kein A ist B. Alle C sind A. Was folgt?",
 ["Kein C ist B.","Alle C sind B.","Einige C sind B.","Alle B sind C.","Nichts folgt."],0,
 "C steckt vollständig in A, und A ist von B getrennt — also ist auch C von B getrennt.");

q("sch-04","schluss",3,"Anna ist älter als Ben. Clara ist jünger als Ben, aber älter als David. Wer ist am jüngsten?",
 ["David","Clara","Ben","Anna","Nicht bestimmbar"],0,
 "Reihenfolge aufschreiben: Anna > Ben > Clara > David. Bei Rangordnungen immer sofort eine Kette bilden.");

q("sch-05","schluss",3,"Drei Kisten sind falsch beschriftet: „Äpfel“, „Birnen“, „Gemischt“. Du darfst aus genau einer Kiste eine Frucht ziehen. Aus welcher ziehst du, um alle Kisten korrekt zuzuordnen?",
 ["Aus der Kiste mit der Aufschrift „Gemischt“","Aus der Kiste mit der Aufschrift „Äpfel“","Aus der Kiste mit der Aufschrift „Birnen“","Aus einer beliebigen Kiste","Das ist mit einem Zug unmöglich"],0,
 "Da alle Etiketten falsch sind, ist die als „Gemischt“ beschriftete Kiste sortenrein — die gezogene Frucht bestimmt sie eindeutig, und der Rest folgt zwingend.");

q("sch-06","schluss",3,"A sagt: „B lügt.“ B sagt: „A und ich lügen beide.“ Wer sagt die Wahrheit?",
 ["Nur A","Nur B","Beide","Keiner","Nicht entscheidbar"],0,
 "Wäre B ehrlich, würde er zugeben zu lügen — Widerspruch. Also lügt B, damit ist As Aussage wahr.");

q("sch-07","schluss",2,"Wenn Tom Zeit hat, geht er schwimmen. Tom geht nicht schwimmen. Was folgt?",
 ["Tom hat keine Zeit.","Tom hat Zeit.","Tom kann nicht schwimmen.","Tom geht stattdessen laufen.","Nichts folgt."],0,
 "Modus tollens auf „Zeit → Schwimmen“.");

q("sch-08","schluss",3,"In einer Reihe sitzen fünf Personen. Eva sitzt genau in der Mitte. Frank sitzt links von Eva, aber nicht am Rand. Wie viele Plätze kommen für Frank in Frage?",
 ["1","2","3","4","0"],0,
 "Von den Plätzen 1–5 ist Eva auf 3. Links davon liegen 1 und 2, Platz 1 ist Rand — bleibt nur Platz 2.");

q("sch-09","schluss",3,"Ein Vater ist heute viermal so alt wie sein Sohn. In 10 Jahren ist er doppelt so alt. Wie alt ist der Sohn heute?",
 ["5","10","8","12","6"],0,
 "4s + 10 = 2(s + 10) → 4s + 10 = 2s + 20 → 2s = 10 → s = 5 (Vater 20).");

q("sch-10","schluss",2,"Heute ist Dienstag. Welcher Wochentag ist in 100 Tagen?",
 ["Donnerstag","Mittwoch","Freitag","Dienstag","Samstag"],0,
 "100 : 7 = 14 Rest 2. Zwei Tage nach Dienstag ist Donnerstag. Bei Wochentagsaufgaben immer den Rest modulo 7 bilden.");

q("sch-11","schluss",3,"Alle Manager sind Angestellte. Einige Angestellte arbeiten in Teilzeit. Welche Aussage ist sicher falsch?",
 ["Kein Angestellter ist Manager.","Einige Manager arbeiten in Teilzeit.","Kein Manager arbeitet in Teilzeit.","Alle Teilzeitkräfte sind Manager.","Einige Angestellte sind keine Manager."],0,
 "Aus „alle Manager sind Angestellte“ folgt, dass es Angestellte gibt, die Manager sind (sofern es Manager gibt). Die übrigen Aussagen sind bloß ungewiss, nicht falsch.");

q("sch-12","schluss",3,"Fünf Läufer: C läuft vor B. A läuft nach B, aber vor D. E läuft zuletzt. Wer gewinnt?",
 ["C","A","B","D","E"],0,
 "Kette: C > B > A > D, und E ist Letzter. C führt.");

q("sch-13","schluss",2,"Ein Wort kostet 3 €, ein Satz 12 €. Ein Kunde zahlt 45 € für 5 Sätze und einige Wörter. Wie viele Wörter?",
 ["Keine – die Angaben widersprechen sich","5","3","2","15"],0,
 "5 Sätze kosten bereits 60 € > 45 €. Erst überschlagen, dann rechnen — Aufgaben mit unmöglichen Angaben kommen vor.");

q("sch-14","schluss",3,"Nur wenn ein Projekt profitabel <em>und</em> strategisch relevant ist, wird es fortgeführt. Projekt X wurde eingestellt. Was folgt?",
 ["Es war nicht profitabel oder nicht strategisch relevant.","Es war nicht profitabel.","Es war nicht strategisch relevant.","Es war weder profitabel noch relevant.","Nichts folgt."],0,
 "Fortführung → (profitabel ∧ relevant). Kontraposition plus De Morgan ergibt die Oder-Verknüpfung der Negationen.");

q("rei-01","reihen",1,"Setze fort: 2, 4, 8, 16, __",
 ["32","24","20","18","64"],0,
 "Verdopplung. Erst multiplikative, dann additive Muster prüfen.");

q("rei-02","reihen",2,"Setze fort: 3, 7, 15, 31, __",
 ["63","47","62","55","64"],0,
 "Regel ×2 + 1. Erkennbar an den Differenzen 4, 8, 16 — sie verdoppeln sich.");

q("rei-03","reihen",1,"Setze fort: 1, 4, 9, 16, __",
 ["25","20","24","32","36"],0,
 "Quadratzahlen. Die Differenzen sind die ungeraden Zahlen 3, 5, 7, 9.");

q("rei-04","reihen",2,"Setze fort: 1, 8, 27, 64, __",
 ["125","100","81","128","216"],0,
 "Kubikzahlen 1³, 2³, 3³, 4³, 5³.");

q("rei-05","reihen",2,"Setze fort: 2, 3, 5, 7, 11, __",
 ["13","12","14","15","17"],0,
 "Primzahlen. Wenn keine Rechenregel greift, an Zahlenfamilien denken.");

q("rei-06","reihen",3,"Setze fort: 1, 2, 6, 24, __",
 ["120","48","72","96","144"],0,
 "Fakultäten: jeweils mal 2, mal 3, mal 4, mal 5.");

q("rei-07","reihen",3,"Setze fort: 5, 10, 9, 18, 17, __",
 ["34","16","33","35","26"],0,
 "Zwei abwechselnde Regeln: ×2, dann −1. Bei „Zickzack“-Reihen immer nach einem Zweierrhythmus suchen.");

q("rei-08","reihen",2,"Setze fort: 100, 50, 25, __",
 ["12,5","20","15","10","5"],0,
 "Halbierung — auch wenn es keine ganze Zahl mehr ergibt.");

q("rei-09","reihen",2,"Setze fort: 4, 9, 19, 39, __",
 ["79","78","59","69","80"],0,
 "Regel ×2 + 1: 4 → 9 → 19 → 39 → 79. Zu erkennen an den Differenzen 5, 10, 20, die sich verdoppeln.");

q("rei-10","reihen",3,"Setze fort: 2, 5, 10, 17, 26, __",
 ["37","35","36","38","40"],0,
 "Differenzen 3, 5, 7, 9, 11. Gleichwertig: n² + 1.");

q("rei-11","reihen",3,"Setze fort: A, C, F, J, __",
 ["O","N","M","P","K"],0,
 "Positionen 1, 3, 6, 10 — Abstände +2, +3, +4, also +5 → Position 15 = O.");

q("rei-12","reihen",2,"Setze fort: 81, 27, 9, 3, __",
 ["1","0","2","1,5","3"],0,
 "Fortlaufende Division durch 3 — die Reihe besteht aus den Dreierpotenzen 3⁴, 3³, 3², 3¹, 3⁰. Bei fallenden Reihen immer zuerst den Quotienten prüfen.");

q("rei-13","reihen",3,"Setze fort: 7, 14, 10, 20, 16, __",
 ["32","22","30","12","24"],0,
 "Abwechselnd ×2 und −4.");

q("rei-14","reihen",3,"Welche Zahl passt nicht in die Reihe: 4, 9, 16, 24, 36",
 ["24","9","16","36","4"],0,
 "Alle anderen sind Quadratzahlen (2², 3², 4², 6²); 24 ist keine.");

q("rei-15","reihen",2,"Setze fort: 1, 3, 6, 10, 15, __",
 ["21","20","18","25","22"],0,
 "Dreieckszahlen: die Differenzen wachsen um jeweils 1. Formel n(n+1)/2.");

q("alg2-01","algo",1,"Die Binärzahl <code>1011</code> entspricht dezimal",
 ["11","13","9","7","15"],0,
 "8 + 0 + 2 + 1. Stellenwerte von rechts: 1, 2, 4, 8, 16, 32 …");

q("alg2-02","algo",2,"Die Dezimalzahl 25 lautet binär",
 ["11001","10101","11011","10011","11101"],0,
 "25 = 16 + 8 + 1. Immer die größte passende Zweierpotenz abziehen.");

q("alg2-03","algo",2,"Wie viele verschiedene Werte lassen sich mit 8 Bit darstellen?",
 ["256","128","64","512","255"],0,
 "2⁸ = 256 Werte (0 bis 255). Anzahl der Werte und größter Wert unterscheiden sich um 1.");

q("alg2-04","algo",2,"Fügt man einer Binärzahl ein Bit hinzu, so verändert sich die Anzahl darstellbarer Werte",
 ["Sie verdoppelt sich.","Sie erhöht sich um 1.","Sie vervierfacht sich.","Sie bleibt gleich.","Sie erhöht sich um 2."],0,
 "Jedes zusätzliche Bit multipliziert die Anzahl mit 2.");

q("alg2-05","algo",2,"Welchen Wert hat <code>s</code> am Ende?<pre class=\"code\">s = 0\nfür i von 1 bis 5:\n    s = s + i</pre>",
 ["15","5","10","14","25"],0,
 "1 + 2 + 3 + 4 + 5 = 15. Bei Schleifen die ersten zwei Durchläufe von Hand mitschreiben, dann das Muster erkennen.");

q("alg2-06","algo",3,"Wie oft wird die innere Zeile ausgeführt?<pre class=\"code\">für i von 1 bis 4:\n    für j von 1 bis 3:\n        drucke i, j</pre>",
 ["12","7","4","3","16"],0,
 "Verschachtelte Schleifen multiplizieren sich: 4 · 3.");

q("alg2-07","algo",3,"Welchen Wert hat <code>a</code> am Ende?<pre class=\"code\">a = 3\nb = 5\na = a + b\nb = a − b\na = a − b</pre>",
 ["5","3","8","0","2"],0,
 "Das ist der Tausch ohne Hilfsvariable: a = 8, b = 3, a = 5. Die Werte werden vertauscht.");

q("alg2-08","algo",3,"<code>f(1) = 1</code> und <code>f(n) = f(n−1) + n</code>. Welchen Wert hat <code>f(5)</code>?",
 ["15","10","20","12","25"],0,
 "1, 3, 6, 10, 15 — die Dreieckszahlen. Rekursionen von unten nach oben ausrechnen.");

q("alg2-09","algo",3,"Wie viele Schritte braucht eine binäre Suche in einer sortierten Liste mit 1.000 Einträgen höchstens?",
 ["10","100","500","20","1.000"],0,
 "Jeder Schritt halbiert: 2¹⁰ = 1024 ≥ 1000. Deshalb ist die binäre Suche der Standardtrick bei „Zahlenraten“-Aufgaben.");

q("alg2-10","algo",2,"<code>17 mod 5</code> ist gleich",
 ["2","3","3,4","12","5"],0,
 "Rest bei ganzzahliger Division: 17 = 3 · 5 + 2.");

q("alg2-11","algo",2,"Bei ganzzahliger Division ergibt <code>17 : 5</code>",
 ["3","3,4","4","2","3,5"],0,
 "Ganzzahldivision schneidet den Rest ab. Zusammen mit mod: 17 = 3 · 5 + 2.");

q("alg2-12","algo",3,"Welchen Wert hat <code>x</code> am Ende?<pre class=\"code\">x = 20\nsolange x > 5:\n    x = x − 4</pre>",
 ["4","5","0","8","1"],0,
 "20 → 16 → 12 → 8 → 4. Bei 4 ist die Bedingung verletzt, die Schleife endet. Auf das letzte Unterschreiten achten.");

q("alg2-13","algo",3,"Ein Algorithmus vergleicht jedes Element einer Liste mit jedem anderen. Bei 100 Elementen sind das etwa",
 ["5.000 Vergleiche","100 Vergleiche","200 Vergleiche","10.000 Vergleiche","1.000 Vergleiche"],0,
 "(100 über 2) = 100 · 99/2 = 4.950 ≈ 5.000. Wächst quadratisch mit der Länge.");

q("alg2-14","algo",2,"Welche Aussage über den Algorithmus stimmt?<pre class=\"code\">solange n > 1:\n    n = n / 2</pre>",
 ["Die Anzahl der Durchläufe wächst logarithmisch mit n.","Die Anzahl der Durchläufe wächst linear mit n.","Die Schleife endet nie.","Die Anzahl der Durchläufe ist konstant.","Die Anzahl der Durchläufe wächst quadratisch."],0,
 "Halbieren bis 1 entspricht log₂ n Schritten — bei n = 1.000.000 nur rund 20.");

q("alg2-15","algo",2,"Ein Passwort besteht aus 3 Zeichen, jedes aus einem Alphabet von 26 Buchstaben. Wie viele Passwörter gibt es?",
 ["26³","3²⁶","26 · 3","26!","3 · 26³"],0,
 "Pro Stelle 26 unabhängige Möglichkeiten. 26³ = 17.576.");

q("alg2-16","algo",3,"Welchen Wert hat <code>z</code> am Ende?<pre class=\"code\">z = 0\nfür i von 1 bis 10:\n    wenn i mod 3 == 0:\n        z = z + 1</pre>",
 ["3","4","10","2","1"],0,
 "Vielfache von 3 bis 10: 3, 6, 9 — also drei Treffer.");
