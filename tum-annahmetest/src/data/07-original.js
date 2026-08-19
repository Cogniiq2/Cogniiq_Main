// Originalklausur TUM Eignungsfeststellungsverfahren, IN0000 Endterm, 30.08.2022
// Alle drei Aufgaben im Wortlaut, mit vollständigem Lösungsweg.

q("org-1a","symmetrie",3,
 "<span class=\"orig\">Originalklausur 2022 · Aufgabe 1a · 4 Punkte</span>Bestimmen Sie das Symmetrieverhalten der folgenden Funktion:<pre class=\"code\">f(x) = sin(x − 1) · (x − 1)²</pre>",
 ["Die Funktion ist punktsymmetrisch zu (1, 0).",
  "Die Funktion ist achsensymmetrisch zur y-Achse.",
  "Die Funktion ist punktsymmetrisch zum Ursprung.",
  "Die Funktion ist achsensymmetrisch zur x-Achse."],0,
 "<p><b>Der Trick: substituieren.</b> Überall steht <code>x − 1</code>. Setze <code>u = x − 1</code>, dann wird die Funktion zu <code>g(u) = sin(u) · u²</code>. Damit ist die Verschiebung erst einmal weg und du hast eine ganz normale Symmetriefrage.</p>"+
 "<ol>"+
 "<li><b>Bausteine einordnen.</b> <code>sin(u)</code> ist ungerade (punktsymmetrisch zum Ursprung), <code>u²</code> ist gerade (achsensymmetrisch zur y-Achse).</li>"+
 "<li><b>Produktregel für Symmetrie.</b> ungerade · gerade = <b>ungerade</b>. Also ist <code>g(u)</code> ungerade, d. h. <code>g(−u) = −g(u)</code>.</li>"+
 "<li><b>Zurückübersetzen.</b> <code>u = 0</code> entspricht <code>x = 1</code>. Der Ursprung der u-Welt liegt in der x-Welt bei <code>(1, 0)</code>. Aus „punktsymmetrisch zum Ursprung“ wird also <b>punktsymmetrisch zu (1, 0)</b>.</li>"+
 "</ol>"+
 "<p><b>Gegenprobe in Zahlen</b> (immer machen, kostet 20 Sekunden): <code>f(1 + t) = sin(t) · t²</code> und <code>f(1 − t) = sin(−t) · (−t)² = −sin(t) · t²</code>. Die beiden sind genau entgegengesetzt — das ist die Definition von Punktsymmetrie zu (1, 0).</p>"+
 "<p><b>Warum die anderen falsch sind:</b> Achsensymmetrie zur y-Achse hieße <code>f(−x) = f(x)</code> — probiere <code>x = 1</code>: <code>f(1) = 0</code>, aber <code>f(−1) = sin(−2)·4 ≈ −3,64</code>. Punktsymmetrie zum <em>Ursprung</em> wäre nur richtig, wenn nirgends die Verschiebung um 1 stünde. Und „achsensymmetrisch zur x-Achse“ ist bei einer Funktion <b>nie</b> möglich — dann hätte sie zu einem x zwei y-Werte.</p>");

q("org-1b","ableitung",3,
 "<span class=\"orig\">Originalklausur 2022 · Aufgabe 1b · 8 Punkte</span>Bestimmen Sie die Ableitung f′(x):<pre class=\"code\">        √(x² − 5)\nf(x) = ───────────\n         ln(2x)</pre>",
 ["f′(x) = (x²·ln(2x) − x² + 5) / (x · ln(2x)² · √(x² − 5))",
  "f′(x) = ( (x/√(x²−5))·ln(2x) − √(x²−5) ) / ln(2x)²",
  "f′(x) = ( ln(2x)·2x − √(x²−5) ) / ( ln(2x)² · x · √(x²−5) )",
  "f′(x) = x² / √(x² − 5)"],0,
 "<p>Das ist die teuerste Aufgabe der Klausur — 8 von 24 Punkten. Sie ist reine Handwerksarbeit: Quotientenregel, und in beiden Bausteinen steckt eine Kettenregel.</p>"+
 "<ol>"+
 "<li><b>Zerlegen.</b> Zähler <code>u = √(x² − 5)</code>, Nenner <code>v = ln(2x)</code>. Quotientenregel: <code>f′ = (u′·v − u·v′) / v²</code>.</li>"+
 "<li><b>u′ (Kettenregel).</b> <code>u = (x² − 5)^½</code>, also <code>u′ = ½·(x² − 5)^(−½) · 2x = x / √(x² − 5)</code>. Die innere Ableitung von <code>x² − 5</code> ist <code>2x</code>, und die 2 kürzt sich gegen das ½.</li>"+
 "<li><b>v′ — hier fällt die halbe Kohorte rein.</b> <code>v = ln(2x)</code>, also <code>v′ = (1/(2x)) · 2 = <b>1/x</b></code>. Der Faktor 2 im Logarithmus verschwindet vollständig. Merke: <code>ln(kx)′ = 1/x</code> für jede Konstante k.</li>"+
 "<li><b>Einsetzen.</b> <code>f′ = [ (x/√(x²−5))·ln(2x) − √(x²−5)·(1/x) ] / ln(2x)²</code>. Das ist bereits richtig — steht aber so nicht zur Auswahl.</li>"+
 "<li><b>Auf die Form der Antworten bringen.</b> Erweitere Zähler und Nenner mit <code>x · √(x² − 5)</code>:<br>Zähler: <code>x²·ln(2x) − (x² − 5) = x²·ln(2x) − x² + 5</code><br>Nenner: <code>x · ln(2x)² · √(x² − 5)</code></li>"+
 "</ol>"+
 "<p><b>Der schnelle Weg im Test:</b> Rechne <code>v′</code> aus und schau, welche Option <code>1/x</code> überhaupt enthält. Die Variante ohne <code>1/x</code> stammt von jemandem, der <code>v′ = 1</code> gesetzt hat. Die Variante mit <code>2x</code> im Zähler hat die Wurzelableitung vergessen. Und <code>x²/√(x²−5)</code> ist überhaupt keine Quotientenregel — dort fehlt der Nenner komplett.</p>"+
 "<p><b>Kontrolle ohne Taschenrechner:</b> Wenn du unsicher bist, setze eine leichte Zahl ein, z. B. <code>x = 3</code>. Dann ist <code>√(9−5) = 2</code> — die Wurzel wird glatt. So lassen sich zwei Kandidaten oft in einer Minute unterscheiden.</p>");

q("org-2","raetsel",3,
 "<span class=\"orig\">Originalklausur 2022 · Aufgabe 2 · 8 Punkte</span>Auf der Insel der Ehrlichen und Lügner gibt es <b>Ehrliche</b>, die immer die Wahrheit sagen, <b>Lügner</b>, die immer lügen, und <b>normale Menschen</b>, die manchmal lügen. Von den drei Personen A, B, C ist genau einer ein Ehrlicher, genau einer ein Lügner und genau einer ein normaler Mensch. Sie sagen nacheinander:<pre class=\"code\">A: Ich bin ein normaler Mensch.\nB: Diese Aussage von A ist wahr.\nC: Ich bin kein normaler Mensch.</pre>Wer ist was?",
 ["A ist ein Lügner, B ist ein Normaler, C ist ein Ehrlicher",
  "A ist ein Normaler, B ist ein Ehrlicher, C ist ein Lügner",
  "A ist ein Normaler, B ist ein Lügner, C ist ein Ehrlicher",
  "A ist ein Ehrlicher, B ist ein Normaler, C ist ein Lügner",
  "A ist ein Ehrlicher, B ist ein Lügner, C ist ein Normaler",
  "A ist ein Lügner, B ist ein Ehrlicher, C ist ein Normaler"],0,
 "<p><b>Die drei Regeln, aus denen alles folgt:</b> Ein Ehrlicher sagt <em>nur</em> Wahres. Ein Lügner sagt <em>nur</em> Falsches. Ein Normaler darf beides — aus seinen Aussagen folgt daher nie ein Widerspruch, er ist der „Joker“.</p>"+
 "<p><b>Schritt 1 — A einschränken.</b> A sagt „Ich bin ein normaler Mensch.“<br>"+
 "· Wäre A <b>Ehrlicher</b>, wäre die Aussage wahr, also wäre A normal. Aber A ist Ehrlicher. Widerspruch — A ist kein Ehrlicher.<br>"+
 "· Wäre A <b>Lügner</b>, wäre die Aussage falsch, also wäre A nicht normal. Stimmt, A ist ja Lügner. Kein Widerspruch — möglich.<br>"+
 "· Wäre A <b>Normaler</b>, wäre die Aussage wahr, und ein Normaler darf Wahres sagen. Auch möglich.<br>"+
 "Es bleiben zwei Fälle.</p>"+
 "<p><b>Schritt 2 — Fall „A ist Normaler“ durchspielen.</b> Dann ist A's Aussage wahr, also ist auch B's Aussage („A's Aussage ist wahr“) wahr. Ein Lügner kann nichts Wahres sagen, also ist B <b>Ehrlicher</b>. Für C bleibt <b>Lügner</b>. Aber C sagt „Ich bin kein normaler Mensch“ — und ein Lügner ist tatsächlich kein Normaler, die Aussage wäre also <b>wahr</b>. Ein Lügner darf nichts Wahres sagen. <b>Widerspruch — dieser Fall fällt weg.</b></p>"+
 "<p><b>Schritt 3 — Fall „A ist Lügner“ durchspielen.</b> Dann ist A's Aussage falsch, also ist B's Aussage („A's Aussage ist wahr“) ebenfalls <b>falsch</b>. Ein Ehrlicher kann nichts Falsches sagen, also ist B <b>Normaler</b> (der darf lügen). Für C bleibt <b>Ehrlicher</b>. Probe: C sagt „Ich bin kein normaler Mensch“ — als Ehrlicher ist C tatsächlich kein Normaler, die Aussage ist wahr. <b>Alles passt.</b></p>"+
 "<p><b>Ergebnis: A = Lügner, B = Normaler, C = Ehrlicher.</b></p>"+
 "<p><b>Die Standardtechnik für jedes solche Rätsel:</b> Nimm die Person, über deren Rolle die Aussage am meisten verrät (meist die mit einer Aussage über sich selbst), schließe daraus Rollen aus, und spiele die verbleibenden Fälle bis zum Widerspruch durch. Wichtig: Der Widerspruch entsteht fast immer beim <em>Lügner</em>, weil er als Einziger nichts Wahres sagen darf — prüfe ihn zuerst.</p>");

passage("orig-text","Design Validation (Originalklausur 2022, Aufgabe 3)",
`The currently practiced methods for design validation in most sites are still the Veteran techniques of simulation and testing. Although provably effective in the very early stages of debugging, when the design is still infested with multiple bugs, their effectiveness drops quickly as the design becomes clearer, and they require an alarmingly increasing amount of time to uncover the more subtle bugs. A serious problem with these techniques is that one is never sure when they have reached their limits or even an estimate of how many bugs may still lurk in the design. As the complexity of designs drastically increases, say from having .5 million gates per chip to advanced designs with 5 million gates per chip, some far-seeing managers foresee the complete collapse of these conventional methods and their total inability to scale up.`);

q("org-3a","tv",3,
 "<span class=\"orig\">Originalklausur 2022 · Aufgabe 3 · je 1 Punkt</span>Steht die folgende Aussage so im Text oder ist sie eine direkte Folgerung daraus?<br><br><b>„Ein Vorteil von Tests ist, dass sie subtile Designfehler (‚bugs‘) aufspüren.“</b>",
 ["Nein","Ja"],0,
 "<p><b>Nein.</b> Der Text sagt zwar, dass die Methoden subtile Fehler aufspüren — aber er stellt das ausdrücklich als <em>Nachteil</em> dar, nicht als Vorteil: „they require an <b>alarmingly increasing amount of time</b> to uncover the more subtle bugs“. Sie brauchen dafür also erschreckend viel Zeit.</p>"+
 "<p>Der Vorteil, den der Text nennt, ist ein ganz anderer: „provably effective in the <b>very early stages</b> of debugging, when the design is still infested with multiple bugs“ — stark bei <em>vielen groben</em> Fehlern am Anfang.</p>"+
 "<p><b>Die Fallenart, die du hier erkennen musst:</b> Vorzeichenwechsel. Eine Information aus dem Text wird korrekt wiedergegeben, aber ihre Bewertung wird umgedreht (Nachteil → Vorteil). Achte im Text immer auf Signalwörter wie <em>although</em>, <em>drops</em>, <em>a serious problem</em> — sie markieren, auf welcher Seite der Bilanz etwas steht.</p>");

q("org-3b","tv",3,
 "<span class=\"orig\">Originalklausur 2022 · Aufgabe 3 · je 1 Punkt</span>Steht die folgende Aussage so im Text oder ist sie eine direkte Folgerung daraus?<br><br><b>„Manche Manager sagen vorher, dass gängige Methoden sich nicht auf Designs mit mehr als 5 Millionen Gattern pro Chip anwenden lassen.“</b>",
 ["Ja","Nein"],0,
 "<p><b>Ja.</b> Der Text: „some far-seeing <b>managers foresee</b> the complete collapse of these conventional methods and their total inability to scale up“ — und zwar im Zusammenhang mit dem Sprung auf „advanced designs with 5 million gates per chip“.</p>"+
 "<p>Prüfe die Aussage Stück für Stück gegen den Text:<br>"+
 "· „Manche Manager“ ↔ „some … managers“ ✓<br>"+
 "· „sagen vorher“ ↔ „foresee“ ✓<br>"+
 "· „gängige Methoden“ ↔ „conventional methods“ ✓<br>"+
 "· „lassen sich nicht anwenden“ ↔ „complete collapse … total inability to scale up“ ✓</p>"+
 "<p><b>Zum kritischen Punkt „mehr als 5 Millionen“:</b> Der Text nennt 5 Millionen als das Niveau, bei dem der Zusammenbruch erwartet wird. Wenn die Methoden schon bei 5 Millionen versagen und generell nicht mehr mitskalieren, dann erst recht darüber — das ist eine direkte Folgerung. Achtung: Das ist die schwierigste der vier Aussagen; wenn du hier zwischen zwei Lesarten schwankst, entscheide danach, ob die Aussage <em>mehr</em> behauptet als der Text hergibt (dann Nein) oder <em>weniger</em> (dann Ja). Hier behauptet sie weniger.</p>");

q("org-3c","tv",3,
 "<span class=\"orig\">Originalklausur 2022 · Aufgabe 3 · je 1 Punkt</span>Steht die folgende Aussage so im Text oder ist sie eine direkte Folgerung daraus?<br><br><b>„Manche Manager sagen den Kollaps konventioneller Designs vorher.“</b>",
 ["Nein","Ja"],0,
 "<p><b>Nein — und diese Aussage ist die wichtigste Lektion der ganzen Aufgabe.</b> Der Text sagt: „the complete collapse of these conventional <b>methods</b>“ — der Zusammenbruch der konventionellen <em>Methoden</em> (also von Simulation und Testing). Die Aussage behauptet dagegen den Kollaps konventioneller <b>Designs</b> (also der Chips selbst). Ein einziges ausgetauschtes Substantiv, und die Aussage ist falsch.</p>"+
 "<p><b>Diese Falle heißt Begriffsvertauschung</b> und ist der mit Abstand häufigste Trick in diesem Aufgabentyp. Der Satz klingt beim Überfliegen fast identisch mit dem Original, weil alle anderen Wörter stimmen. Gegenmittel: Unterstreiche in jeder Aussage das <b>Substantiv</b>, um das es geht, und suche genau dieses Wort im Text. Hier: „Designs“ — im Text steht an dieser Stelle „methods“.</p>"+
 "<p>Im Text kommen beide Wörter mehrfach vor („design validation“, „the design is still infested“, „conventional methods“). Genau das macht die Verwechslung so leicht.</p>");

q("org-3d","tv",3,
 "<span class=\"orig\">Originalklausur 2022 · Aufgabe 3 · je 1 Punkt</span>Steht die folgende Aussage so im Text oder ist sie eine direkte Folgerung daraus?<br><br><b>„Bei subtileren Designfehlern (‚bugs‘) kommen Simulationen zum Einsatz.“</b>",
 ["Ja","Nein"],0,
 "<p><b>Ja.</b> Der Text beschreibt Simulation und Testing als „the currently practiced methods“ — sie sind also das, was tatsächlich eingesetzt wird. Und er sagt weiter, dass sie „an alarmingly increasing amount of time <b>to uncover the more subtle bugs</b>“ brauchen. Damit werden sie bei subtilen Fehlern eingesetzt — sie sind dabei nur langsam.</p>"+
 "<p><b>Wichtig für den Aufgabentyp:</b> Gefragt ist nur, ob die Aussage im Text steht oder direkt daraus folgt — <em>nicht</em>, ob sie eine gute Idee beschreibt. Dass der Text den Einsatz bei subtilen Fehlern <em>kritisiert</em>, ändert nichts daran, dass er ihn beschreibt.</p>"+
 "<p><b>Vergleiche bewusst mit Aussage 1</b> („Ein Vorteil von Tests ist …“). Beide handeln von subtilen Fehlern, aber nur eine bewertet. Die bewertende ist falsch, die rein beschreibende ist richtig. Genau an dieser Grenze entscheidet sich dieser Aufgabentyp.</p>");
