// Symmetrieverhalten von Funktionen — der 4-Punkte-Block der Klausur
q("sym-01","symmetrie",1,"Welches Symmetrieverhalten hat <code>f(x) = x³ − x</code>?",
 ["punktsymmetrisch zum Ursprung","achsensymmetrisch zur y-Achse","punktsymmetrisch zu (1, 0)","achsensymmetrisch zur x-Achse","keine Symmetrie"],0,
 "<p><b>Der Test, der immer funktioniert:</b> Setze <code>−x</code> ein und vergleiche mit <code>f(x)</code>.</p>"+
 "<ol><li><code>f(−x) = (−x)³ − (−x) = −x³ + x</code>.</li>"+
 "<li>Das ist genau <code>−(x³ − x) = −f(x)</code>.</li>"+
 "<li><code>f(−x) = −f(x)</code> heißt <b>ungerade</b> = punktsymmetrisch zum Ursprung.</li></ol>"+
 "<p><b>Schnellregel für Polynome:</b> Kommen <em>nur</em> ungerade Exponenten vor (x¹, x³, x⁵ …), ist die Funktion ungerade. Kommen <em>nur</em> gerade vor (x⁰, x², x⁴ …), ist sie gerade. Gemischt heißt: keine der beiden Symmetrien. Daher der Name.</p>");

q("sym-02","symmetrie",1,"Welches Symmetrieverhalten hat <code>f(x) = x⁴ − 3x² + 1</code>?",
 ["achsensymmetrisch zur y-Achse","punktsymmetrisch zum Ursprung","punktsymmetrisch zu (0, 1)","achsensymmetrisch zur x-Achse","keine Symmetrie"],0,
 "<ol><li><code>f(−x) = (−x)⁴ − 3(−x)² + 1 = x⁴ − 3x² + 1 = f(x)</code>. Gerade Exponenten schlucken das Minuszeichen.</li>"+
 "<li><code>f(−x) = f(x)</code> heißt <b>gerade</b> = achsensymmetrisch zur y-Achse.</li></ol>"+
 "<p>Die konstante 1 zählt als <code>1·x⁰</code>, also ebenfalls gerader Exponent — sie stört die Symmetrie nicht. Eine Konstante verschiebt den Graphen nur nach oben, und die y-Achse bleibt Spiegelachse.</p>");

q("sym-03","symmetrie",2,"Welches Symmetrieverhalten hat <code>f(x) = x² · sin(x)</code>?",
 ["punktsymmetrisch zum Ursprung","achsensymmetrisch zur y-Achse","keine Symmetrie","punktsymmetrisch zu (π, 0)","achsensymmetrisch zur Geraden x = π"],0,
 "<p><b>Statt einzusetzen: die Bausteine einordnen.</b> Das ist im Test deutlich schneller.</p>"+
 "<ol><li><code>x²</code> ist <b>gerade</b> (nur gerader Exponent).</li>"+
 "<li><code>sin(x)</code> ist <b>ungerade</b>: <code>sin(−x) = −sin(x)</code>.</li>"+
 "<li>Produktregel für Symmetrie: gerade · ungerade = <b>ungerade</b> → punktsymmetrisch zum Ursprung.</li></ol>"+
 "<p><b>Die drei Produktregeln, die du auswendig brauchst</b> — sie funktionieren wie Vorzeichen beim Multiplizieren (gerade = „+“, ungerade = „−“):<br>gerade · gerade = gerade · ungerade · ungerade = gerade · gerade · ungerade = ungerade.<br>Dasselbe gilt für Quotienten. Genau darauf beruht die Originalklausur-Aufgabe.</p>");

q("sym-04","symmetrie",2,"Welches Symmetrieverhalten hat <code>f(x) = sin(x) · cos(x)</code>?",
 ["punktsymmetrisch zum Ursprung","achsensymmetrisch zur y-Achse","keine Symmetrie","achsensymmetrisch zur x-Achse","punktsymmetrisch zu (1, 0)"],0,
 "<ol><li><code>sin(x)</code> ist ungerade, <code>cos(x)</code> ist gerade (<code>cos(−x) = cos(x)</code>).</li>"+
 "<li>ungerade · gerade = ungerade → punktsymmetrisch zum Ursprung.</li></ol>"+
 "<p><b>Gegenprobe:</b> <code>sin(x)·cos(x) = ½·sin(2x)</code>, und der Sinus ist ungerade — passt.</p>"+
 "<p><b>Unbedingt merken:</b> <code>sin</code> ist ungerade, <code>cos</code> ist gerade. Anschaulich: Der Cosinus hat bei <code>x = 0</code> seinen Hochpunkt und liegt spiegelbildlich zur y-Achse; der Sinus geht bei 0 durch den Ursprung und steigt auf beiden Seiten entgegengesetzt.</p>");

q("sym-05","symmetrie",2,"Welches Symmetrieverhalten hat <code>f(x) = (x − 2)³</code>?",
 ["punktsymmetrisch zu (2, 0)","punktsymmetrisch zum Ursprung","achsensymmetrisch zur Geraden x = 2","achsensymmetrisch zur y-Achse","keine Symmetrie"],0,
 "<p><b>Immer wenn überall derselbe Klammerausdruck steht, wird substituiert.</b></p>"+
 "<ol><li>Setze <code>u = x − 2</code>. Dann ist <code>g(u) = u³</code>.</li>"+
 "<li><code>u³</code> ist ungerade, also punktsymmetrisch zum Ursprung der u-Welt.</li>"+
 "<li>Der Ursprung <code>u = 0</code> liegt bei <code>x = 2</code>. Also: punktsymmetrisch zu <code>(2, 0)</code>.</li></ol>"+
 "<p><b>Die Merkregel für das Zurückübersetzen:</b> <code>x − a</code> in der Klammer bedeutet Verschiebung um <code>+a</code> nach rechts. Das Symmetriezentrum wandert genau mit. Vorsicht beim Vorzeichen: bei <code>(x + 2)³</code> läge das Zentrum bei <code>(−2, 0)</code>.</p>");

q("sym-06","symmetrie",2,"Welches Symmetrieverhalten hat <code>f(x) = (x − 3)² + 4</code>?",
 ["achsensymmetrisch zur Geraden x = 3","achsensymmetrisch zur y-Achse","punktsymmetrisch zu (3, 4)","punktsymmetrisch zum Ursprung","keine Symmetrie"],0,
 "<ol><li>Substituiere <code>u = x − 3</code>: <code>g(u) = u² + 4</code>.</li>"+
 "<li><code>u² + 4</code> ist gerade (nur gerade Exponenten), also achsensymmetrisch zur u-Achse durch <code>u = 0</code>.</li>"+
 "<li><code>u = 0</code> entspricht <code>x = 3</code> → Spiegelachse ist die <b>senkrechte Gerade x = 3</b>.</li></ol>"+
 "<p><b>Wichtiger Unterschied zur Punktsymmetrie:</b> Bei Achsensymmetrie ist das Ergebnis eine <em>Gerade</em> (<code>x = 3</code>), bei Punktsymmetrie ein <em>Punkt</em> (<code>(3, 0)</code>). Das <code>+4</code> verschiebt hier nur nach oben und ist für die Achse völlig egal — bei Punktsymmetrie wäre es dagegen Teil des Zentrums.</p>");

q("sym-07","symmetrie",3,"Welches Symmetrieverhalten hat <code>f(x) = sin(x + 2) · (x + 2)⁴</code>?",
 ["punktsymmetrisch zu (−2, 0)","punktsymmetrisch zu (2, 0)","achsensymmetrisch zur Geraden x = −2","punktsymmetrisch zum Ursprung","keine Symmetrie"],0,
 "<p>Baugleich mit der Originalklausur, nur mit anderen Zahlen und einer vierten Potenz.</p>"+
 "<ol><li>Substituiere <code>u = x + 2</code>: <code>g(u) = sin(u) · u⁴</code>.</li>"+
 "<li><code>sin(u)</code> ungerade, <code>u⁴</code> gerade → Produkt ungerade → punktsymmetrisch zum Ursprung der u-Welt.</li>"+
 "<li><code>u = 0</code> bedeutet <code>x + 2 = 0</code>, also <code>x = −2</code>. Zentrum: <code>(−2, 0)</code>.</li></ol>"+
 "<p><b>Vorzeichenfalle:</b> <code>(x + 2)</code> verschiebt nach <em>links</em>, das Zentrum liegt bei <code>−2</code>, nicht bei <code>+2</code>. Setze im Zweifel die Klammer null: <code>x + 2 = 0 → x = −2</code>. Dieser eine Handgriff verhindert den häufigsten Fehler der ganzen Aufgabengattung.</p>");

q("sym-08","symmetrie",2,"Welches Symmetrieverhalten hat <code>f(x) = x³ + x²</code>?",
 ["keine der beiden Symmetrien","punktsymmetrisch zum Ursprung","achsensymmetrisch zur y-Achse","achsensymmetrisch zur x-Achse","punktsymmetrisch zu (1, 0)"],0,
 "<ol><li><code>f(−x) = −x³ + x²</code>.</li>"+
 "<li>Das ist weder <code>f(x) = x³ + x²</code> noch <code>−f(x) = −x³ − x²</code>.</li>"+
 "<li>Also weder gerade noch ungerade.</li></ol>"+
 "<p><b>Warum:</b> gerade und ungerade Exponenten sind gemischt. Sobald in einem Polynom beide Sorten vorkommen, entfällt jede Achsen- oder Punktsymmetrie zum Ursprung. Prüfe das immer zuerst — es kostet drei Sekunden und erledigt viele Aufgaben sofort.</p>"+
 "<p><b>Schnelle Gegenprobe mit einer Zahl:</b> <code>f(1) = 2</code>, <code>f(−1) = −1 + 1 = 0</code>. Bei gerader Funktion müsste <code>f(−1) = 2</code> sein, bei ungerader <code>−2</code>. Beides trifft nicht zu. Diese Ein-Zahl-Probe schließt im Test blitzschnell falsche Optionen aus.</p>");

q("sym-09","symmetrie",2,"Welches Symmetrieverhalten hat <code>f(x) = 1/x</code>?",
 ["punktsymmetrisch zum Ursprung","achsensymmetrisch zur y-Achse","keine Symmetrie","achsensymmetrisch zur x-Achse","punktsymmetrisch zu (1, 1)"],0,
 "<ol><li><code>f(−x) = 1/(−x) = −1/x = −f(x)</code>.</li>"+
 "<li>Also ungerade → punktsymmetrisch zum Ursprung.</li></ol>"+
 "<p>Passt zur Schnellregel: <code>1/x = x^(−1)</code>, und <code>−1</code> ist ein ungerader Exponent. Die Regel für gerade und ungerade Exponenten gilt auch für negative Exponenten. Dass die Funktion bei <code>x = 0</code> gar nicht definiert ist, stört die Symmetrie nicht — der Definitionsbereich liegt selbst symmetrisch um null.</p>");

q("sym-10","symmetrie",2,"Welches Symmetrieverhalten hat <code>f(x) = x² + cos(x)</code>?",
 ["achsensymmetrisch zur y-Achse","punktsymmetrisch zum Ursprung","keine Symmetrie","achsensymmetrisch zur Geraden x = 1","punktsymmetrisch zu (0, 1)"],0,
 "<ol><li><code>x²</code> ist gerade, <code>cos(x)</code> ist gerade.</li>"+
 "<li><b>Summenregel:</b> gerade + gerade = gerade. Also achsensymmetrisch zur y-Achse.</li></ol>"+
 "<p><b>Aufgepasst — Summen verhalten sich anders als Produkte:</b> Bei Summen gilt nur gerade + gerade = gerade und ungerade + ungerade = ungerade. <em>Gemischte</em> Summen (z. B. <code>x² + sin(x)</code>) haben gar keine Symmetrie. Bei Produkten dagegen liefert jede Kombination ein Ergebnis. Diese Unterscheidung wird oft verwechselt.</p>");

q("sym-11","symmetrie",3,"Welches Symmetrieverhalten hat <code>f(x) = sin(x)/x</code>?",
 ["achsensymmetrisch zur y-Achse","punktsymmetrisch zum Ursprung","keine Symmetrie","achsensymmetrisch zur x-Achse","punktsymmetrisch zu (1, 0)"],0,
 "<ol><li>Zähler <code>sin(x)</code> ungerade, Nenner <code>x</code> ungerade.</li>"+
 "<li>ungerade / ungerade = <b>gerade</b> — die beiden Minuszeichen kürzen sich weg.</li>"+
 "<li>Also achsensymmetrisch zur y-Achse.</li></ol>"+
 "<p><b>Rechnerisch nachvollzogen:</b> <code>f(−x) = sin(−x)/(−x) = (−sin x)/(−x) = sin(x)/x = f(x)</code>.</p>"+
 "<p>Das ist die Aufgabe, bei der die meisten reflexhaft „ungerade“ ankreuzen, weil überall Ungerades steht. Rechne die Vorzeichen wie beim Multiplizieren: minus geteilt durch minus ergibt plus.</p>");

q("sym-12","symmetrie",1,"Warum kann der Graph einer Funktion nie achsensymmetrisch zur x-Achse sein?",
 ["Weil dann einem x-Wert zwei y-Werte zugeordnet wären.","Weil Funktionen immer durch den Ursprung gehen.","Weil die x-Achse keine Symmetrieachse sein darf.","Weil dann die Ableitung nicht existieren würde.","Das kann sehr wohl vorkommen, etwa bei f(x) = x²."],0,
 "<p>Achsensymmetrie zur x-Achse würde bedeuten: Zu jedem Punkt <code>(x, y)</code> gehört auch <code>(x, −y)</code> zum Graphen. Dann hätte dasselbe <code>x</code> zwei verschiedene Funktionswerte — und genau das ist bei einer Funktion per Definition verboten (jedem x <em>genau ein</em> y).</p>"+
 "<p><b>Warum das für die Klausur zählt:</b> „achsensymmetrisch zur x-Achse“ stand in der Originalklausur als Antwortoption. Es ist ein <b>Freischuss</b>: Diese Option kannst du bei jeder Symmetrieaufgabe sofort streichen, ohne zu rechnen. Damit sind von vier Optionen nur noch drei übrig.</p>");

q("sym-13","symmetrie",2,"Welches Symmetrieverhalten hat <code>f(x) = cos(x − π)</code>?",
 ["achsensymmetrisch zur Geraden x = π","punktsymmetrisch zu (π, 0)","achsensymmetrisch zur y-Achse","punktsymmetrisch zum Ursprung","keine Symmetrie"],0,
 "<ol><li>Substituiere <code>u = x − π</code>: <code>g(u) = cos(u)</code>.</li>"+
 "<li><code>cos</code> ist gerade → achsensymmetrisch zur senkrechten Achse durch <code>u = 0</code>.</li>"+
 "<li><code>u = 0</code> heißt <code>x = π</code>. Also Spiegelachse <code>x = π</code>.</li></ol>"+
 "<p><b>Gerade → Achse, ungerade → Punkt.</b> Diese Zuordnung ist der Kern der ganzen Aufgabengattung: Erst bestimmst du mit den Bausteinregeln, ob die substituierte Funktion gerade oder ungerade ist; erst danach übersetzt du die Verschiebung zurück.</p>");

q("sym-14","symmetrie",3,"Eine Funktion g ist ungerade, eine Funktion h ist gerade. Was gilt für <code>f(x) = g(x) · h(x)</code>?",
 ["f ist ungerade.","f ist gerade.","f hat keine Symmetrie.","f ist gerade, falls g(0) = 0.","Das lässt sich allgemein nicht sagen."],0,
 "<p><b>Der Beweis in einer Zeile</b> — genau die Rechnung, die hinter der Originalklausur steckt:</p>"+
 "<p><code>f(−x) = g(−x) · h(−x) = (−g(x)) · h(x) = −(g(x)·h(x)) = −f(x)</code></p>"+
 "<p>Das eine Minuszeichen aus dem ungeraden Faktor überlebt und steht am Ende vor dem gesamten Produkt. Also ist f ungerade — punktsymmetrisch zum Ursprung.</p>"+
 "<p><b>Vollständige Tabelle für Produkte und Quotienten:</b><br>"+
 "gerade · gerade = gerade<br>ungerade · ungerade = gerade<br>gerade · ungerade = ungerade<br>"+
 "Rechne einfach mit Vorzeichen: gerade = „+“, ungerade = „−“. Das Ergebnis stimmt immer.</p>");
