// Ableitungen im Klausurformat: gegeben f, gesucht f' — Quotienten- und Kettenregel
q("abl-01","ableitung",1,"Wie lautet die Ableitung von <code>f(x) = ln(2x)</code>?",
 ["f′(x) = 1/x","f′(x) = 2/x","f′(x) = 1/(2x)","f′(x) = 2·ln(x)","f′(x) = ln(2)/x"],0,
 "<p><b>Die wichtigste Einzelheit der ganzen Originalklausur.</b> Kettenregel: äußere Ableitung mal innere Ableitung.</p>"+
 "<ol><li>Äußere Funktion <code>ln(…)</code>, abgeleitet <code>1/(…)</code> — hier also <code>1/(2x)</code>.</li>"+
 "<li>Innere Funktion <code>2x</code>, abgeleitet <code>2</code>.</li>"+
 "<li>Multiplizieren: <code>(1/(2x)) · 2 = 1/x</code>.</li></ol>"+
 "<p><b>Merke ein für alle Mal:</b> Ein konstanter Faktor im Logarithmus verschwindet beim Ableiten. <code>ln(2x)′ = ln(5x)′ = ln(x)′ = 1/x</code>. Grund: <code>ln(kx) = ln k + ln x</code>, und die Konstante <code>ln k</code> fällt weg.</p>");

q("abl-02","ableitung",2,"Wie lautet die Ableitung von <code>f(x) = √(x² + 1)</code>?",
 ["f′(x) = x / √(x² + 1)","f′(x) = 2x / √(x² + 1)","f′(x) = 1 / (2√(x² + 1))","f′(x) = √(2x)","f′(x) = x² / √(x² + 1)"],0,
 "<ol><li>Als Potenz schreiben: <code>f = (x² + 1)^½</code>.</li>"+
 "<li>Äußere Ableitung: <code>½ · (x² + 1)^(−½) = 1/(2√(x² + 1))</code>.</li>"+
 "<li>Innere Ableitung von <code>x² + 1</code>: <code>2x</code>.</li>"+
 "<li>Multiplizieren: <code>2x / (2√(x² + 1)) = x / √(x² + 1)</code> — die 2 kürzt sich.</li></ol>"+
 "<p><b>Faustformel zum Auswendiglernen:</b> <code>√(u)′ = u′ / (2√u)</code>. Bei <code>u = x² ± c</code> kürzt sich die 2 immer weg, es bleibt schlicht <code>x/√(x² ± c)</code>. Genau dieser Baustein kam in der Originalklausur vor.</p>");

q("abl-03","ableitung",2,"Wie lautet die Ableitung von <code>f(x) = ln(3x) / x</code>?",
 ["f′(x) = (1 − ln(3x)) / x²","f′(x) = (ln(3x) − 1) / x²","f′(x) = 3/x²","f′(x) = 1/x²","f′(x) = (1 − 3·ln(3x)) / x²"],0,
 "<p>Quotientenregel <code>f′ = (u′v − uv′)/v²</code> mit <code>u = ln(3x)</code>, <code>v = x</code>.</p>"+
 "<ol><li><code>u′ = 1/x</code> (die 3 verschwindet, siehe Regel zu ln).</li>"+
 "<li><code>v′ = 1</code>.</li>"+
 "<li>Zähler: <code>(1/x)·x − ln(3x)·1 = 1 − ln(3x)</code>.</li>"+
 "<li>Nenner: <code>x²</code>.</li></ol>"+
 "<p><b>Die klassische Verwechslung</b> ist die Reihenfolge im Zähler: erst <code>u′v</code>, dann <b>minus</b> <code>uv′</code>. Wer das dreht, landet bei <code>(ln(3x) − 1)/x²</code> — derselbe Bruch mit umgekehrtem Vorzeichen. Eselsbrücke: „<b>N</b>enner mal Ableitung <b>Z</b>ähler minus <b>Z</b>ähler mal Ableitung <b>N</b>enner“ — also NAZ minus ZAN.</p>");

q("abl-04","ableitung",2,"Wie lautet die Ableitung von <code>f(x) = x / ln(x)</code>?",
 ["f′(x) = (ln(x) − 1) / ln(x)²","f′(x) = (1 − ln(x)) / ln(x)²","f′(x) = 1 / ln(x)²","f′(x) = ln(x)/x","f′(x) = (ln(x) − x) / ln(x)²"],0,
 "<p>Quotientenregel mit <code>u = x</code> (also <code>u′ = 1</code>) und <code>v = ln(x)</code> (also <code>v′ = 1/x</code>).</p>"+
 "<ol><li>Zähler: <code>1 · ln(x) − x · (1/x) = ln(x) − 1</code>. Beachte, wie sich das <code>x</code> gegen <code>1/x</code> wegkürzt — dieser Effekt tritt fast immer auf, wenn ein <code>x</code> auf ein <code>ln</code> trifft.</li>"+
 "<li>Nenner: <code>ln(x)²</code>.</li></ol>"+
 "<p>Vergleiche mit der vorigen Aufgabe: Dort stand ln oben, hier unten — und prompt dreht sich das Vorzeichen im Zähler um. Wenn du beide sicher kannst, sitzt die Quotientenregel.</p>");

q("abl-05","ableitung",3,"Wie lautet die Ableitung von <code>f(x) = √(x² − 5) · ln(2x)</code>?",
 ["f′(x) = (x·ln(2x)) / √(x² − 5) + √(x² − 5)/x",
  "f′(x) = (x·ln(2x)) / √(x² − 5) − √(x² − 5)/x",
  "f′(x) = 2x · ln(2x) + √(x² − 5)/(2x)",
  "f′(x) = x / (√(x² − 5) · x)",
  "f′(x) = (x + ln(2x)) / √(x² − 5)"],0,
 "<p>Dieselben zwei Bausteine wie in der Originalklausur, aber als <b>Produkt</b> statt als Quotient. Produktregel: <code>(u·v)′ = u′v + uv′</code> — hier steht ein <b>Plus</b>.</p>"+
 "<ol><li><code>u = √(x² − 5)</code>, also <code>u′ = x/√(x² − 5)</code>.</li>"+
 "<li><code>v = ln(2x)</code>, also <code>v′ = 1/x</code>.</li>"+
 "<li><code>f′ = (x/√(x² − 5))·ln(2x) + √(x² − 5)·(1/x)</code>.</li></ol>"+
 "<p><b>Warum diese Aufgabe wichtig ist:</b> In der Klausur entscheidet sich alles daran, ob du die beiden Bausteine <code>u′</code> und <code>v′</code> sicher hast. Ob sie dann durch Produkt- oder Quotientenregel verbunden werden, ist nur noch Buchhaltung. Übe die Bausteine, nicht die Gesamtformel.</p>");

q("abl-06","ableitung",2,"Wie lautet die Ableitung von <code>f(x) = x² · ln(x)</code>?",
 ["f′(x) = x · (2·ln(x) + 1)","f′(x) = 2x / x","f′(x) = 2x · ln(x)","f′(x) = 2x + 1/x","f′(x) = x²/x + 2x"],0,
 "<p>Produktregel mit <code>u = x²</code> (<code>u′ = 2x</code>) und <code>v = ln(x)</code> (<code>v′ = 1/x</code>).</p>"+
 "<ol><li><code>f′ = 2x·ln(x) + x²·(1/x)</code>.</li>"+
 "<li>Der zweite Term vereinfacht sich: <code>x²/x = x</code>.</li>"+
 "<li>Also <code>f′ = 2x·ln(x) + x</code>, ausgeklammert <code>x·(2·ln(x) + 1)</code>.</li></ol>"+
 "<p><b>Zum Antwortenvergleich im Test:</b> <code>2x·ln(x) + x</code> und <code>x·(2·ln(x) + 1)</code> sind dasselbe. Wenn deine Rechnung nicht wörtlich unter den Optionen steht, klammere aus oder multipliziere aus, bevor du an einen Fehler glaubst.</p>");

q("abl-07","ableitung",2,"Wie lautet die Ableitung von <code>f(x) = e^(x²)</code>?",
 ["f′(x) = 2x · e^(x²)","f′(x) = e^(x²)","f′(x) = x² · e^(x²−1)","f′(x) = 2x · e^(2x)","f′(x) = e^(2x)"],0,
 "<ol><li>Die e-Funktion bleibt beim Ableiten unverändert stehen: <code>e^(x²)</code>.</li>"+
 "<li>Kettenregel: mal innere Ableitung, und die innere Funktion ist <code>x²</code> mit Ableitung <code>2x</code>.</li></ol>"+
 "<p><b>Typischer Fehler:</b> die Potenzregel auf den Exponenten anwenden und <code>x²·e^(x²−1)</code> hinschreiben. Die Potenzregel gilt, wenn <code>x</code> in der <em>Basis</em> steht (<code>x²</code>), nicht wenn es im <em>Exponenten</em> steht (<code>e^(x²)</code>). Faustformel: <code>e^u′ = u′ · e^u</code>.</p>");

q("abl-08","ableitung",2,"Wie lautet die Ableitung von <code>f(x) = ln(x² + 1)</code>?",
 ["f′(x) = 2x / (x² + 1)","f′(x) = 1 / (x² + 1)","f′(x) = 2x","f′(x) = 1/(2x)","f′(x) = (x² + 1)/(2x)"],0,
 "<ol><li>Äußere Ableitung von <code>ln(u)</code> ist <code>1/u</code>, also <code>1/(x² + 1)</code>.</li>"+
 "<li>Innere Ableitung von <code>x² + 1</code> ist <code>2x</code>.</li>"+
 "<li>Multiplizieren: <code>2x/(x² + 1)</code>.</li></ol>"+
 "<p><b>Allgemeine Form, die du im Kopf haben solltest:</b> <code>ln(u)′ = u′/u</code>. Damit sind alle Logarithmus-Ableitungen ein Einzeiler: die Ableitung des Inneren über das Innere. Anders als bei <code>ln(2x)</code> bleibt hier etwas stehen, weil <code>x² + 1</code> kein konstantes Vielfaches von x ist.</p>");

q("abl-09","ableitung",2,"Wie lautet die Ableitung von <code>f(x) = e^x / x</code>?",
 ["f′(x) = e^x · (x − 1) / x²","f′(x) = e^x / 1","f′(x) = e^x · (1 − x) / x²","f′(x) = e^x/x²","f′(x) = e^x · x²"],0,
 "<p>Quotientenregel mit <code>u = e^x</code> (<code>u′ = e^x</code>) und <code>v = x</code> (<code>v′ = 1</code>).</p>"+
 "<ol><li>Zähler: <code>e^x · x − e^x · 1 = e^x(x − 1)</code>.</li>"+
 "<li>Nenner: <code>x²</code>.</li></ol>"+
 "<p>Ausklammern von <code>e^x</code> ist hier fast Pflicht — die Antwortoptionen stehen in der Klausur praktisch immer in der ausgeklammerten Form. Die Variante <code>e^x·(1 − x)/x²</code> hat das Vorzeichen im Zähler gedreht (ZAN minus NAZ statt NAZ minus ZAN).</p>");

q("abl-10","ableitung",3,"Wie lautet die Ableitung von <code>f(x) = √x · ln(x)</code>?",
 ["f′(x) = (ln(x) + 2) / (2√x)","f′(x) = ln(x) / (2√x)","f′(x) = (ln(x) − 2) / (2√x)","f′(x) = 1/(2√x) · 1/x","f′(x) = √x / x"],0,
 "<p>Produktregel mit <code>u = √x</code> (<code>u′ = 1/(2√x)</code>) und <code>v = ln(x)</code> (<code>v′ = 1/x</code>).</p>"+
 "<ol><li><code>f′ = ln(x)/(2√x) + √x/x</code>.</li>"+
 "<li>Zweiten Term vereinfachen: <code>√x/x = 1/√x</code>, denn <code>x = √x·√x</code>.</li>"+
 "<li>Auf gemeinsamen Nenner <code>2√x</code> bringen: <code>1/√x = 2/(2√x)</code>.</li>"+
 "<li>Zusammen: <code>(ln(x) + 2)/(2√x)</code>.</li></ol>"+
 "<p><b>Die Rechentechnik, die hier zählt:</b> <code>√x/x = 1/√x</code>. Wurzelterme lassen sich fast immer vereinfachen, indem man alles als Potenz schreibt: <code>x^½ / x¹ = x^(−½)</code>. In der Klausur brauchst du diesen Schritt, um deine Lösung überhaupt in einer der Antwortoptionen wiederzufinden.</p>");

q("abl-11","ableitung",2,"Wie lautet die Ableitung von <code>f(x) = (x² + 1)³</code>?",
 ["f′(x) = 6x · (x² + 1)²","f′(x) = 3 · (x² + 1)²","f′(x) = 3 · (2x)²","f′(x) = 6x · (x² + 1)³","f′(x) = (2x)³"],0,
 "<ol><li>Äußere Ableitung: <code>3 · (x² + 1)²</code> — der Klammerinhalt bleibt unangetastet stehen.</li>"+
 "<li>Innere Ableitung: <code>2x</code>.</li>"+
 "<li>Multiplizieren: <code>3 · 2x · (x² + 1)² = 6x(x² + 1)²</code>.</li></ol>"+
 "<p><b>Der häufigste Fehler bei der Kettenregel</b> ist, die innere Ableitung schlicht zu vergessen und bei <code>3·(x² + 1)²</code> stehen zu bleiben. Gewöhne dir an, nach jedem Ableiten einer Klammer laut „mal innere Ableitung“ mitzudenken.</p>");

q("abl-12","ableitung",3,"Wie lautet die Ableitung von <code>f(x) = 1 / √(x² − 5)</code>?",
 ["f′(x) = −x / √(x² − 5)³","f′(x) = x / √(x² − 5)³","f′(x) = −1 / (2√(x² − 5))","f′(x) = 1/(2x)","f′(x) = −2x / √(x² − 5)"],0,
 "<ol><li>Als Potenz schreiben: <code>f = (x² − 5)^(−½)</code>. Das erspart die Quotientenregel vollständig.</li>"+
 "<li>Potenzregel: <code>−½ · (x² − 5)^(−³⁄₂)</code>.</li>"+
 "<li>Kettenregel: mal <code>2x</code>. Die 2 kürzt sich gegen das ½.</li>"+
 "<li>Ergebnis: <code>−x · (x² − 5)^(−³⁄₂) = −x/√(x² − 5)³</code>.</li></ol>"+
 "<p><b>Strategie:</b> Wenn im Zähler nur eine 1 steht, nie die Quotientenregel benutzen — als negative Potenz schreiben und ableiten. Das ist kürzer und deutlich weniger fehleranfällig. Das Minuszeichen kommt vom negativen Exponenten und wird gern vergessen.</p>");

q("abl-13","ableitung",3,"Wie lautet die Ableitung von <code>f(x) = ln(x) / x²</code>?",
 ["f′(x) = (1 − 2·ln(x)) / x³","f′(x) = (1 − ln(x)) / x³","f′(x) = (2·ln(x) − 1) / x³","f′(x) = 1 / (2x³)","f′(x) = (1 − 2·ln(x)) / x⁴"],0,
 "<p>Quotientenregel mit <code>u = ln(x)</code> (<code>u′ = 1/x</code>) und <code>v = x²</code> (<code>v′ = 2x</code>).</p>"+
 "<ol><li>Zähler: <code>(1/x)·x² − ln(x)·2x = x − 2x·ln(x)</code>.</li>"+
 "<li>Nenner: <code>(x²)² = x⁴</code>.</li>"+
 "<li>Kürzen: Zähler <code>x(1 − 2·ln(x))</code>, also <code>x(1 − 2·ln(x))/x⁴ = (1 − 2·ln(x))/x³</code>.</li></ol>"+
 "<p><b>Der Schritt, der Punkte kostet:</b> das Kürzen am Ende. Die Variante mit <code>x⁴</code> im Nenner und bereits gekürztem Zähler ist deshalb falsch. Nach der Quotientenregel immer prüfen, ob sich ein <code>x</code> ausklammern lässt.</p>");

q("abl-14","ableitung",2,"Wie lautet die Ableitung von <code>f(x) = x · e^(2x)</code>?",
 ["f′(x) = e^(2x) · (1 + 2x)","f′(x) = e^(2x)","f′(x) = 2x · e^(2x)","f′(x) = e^(2x) · (1 + x)","f′(x) = 2 · e^(2x)"],0,
 "<p>Produktregel mit <code>u = x</code> (<code>u′ = 1</code>) und <code>v = e^(2x)</code> (<code>v′ = 2e^(2x)</code>, Kettenregel).</p>"+
 "<ol><li><code>f′ = 1 · e^(2x) + x · 2e^(2x)</code>.</li>"+
 "<li><code>e^(2x)</code> ausklammern: <code>e^(2x)(1 + 2x)</code>.</li></ol>"+
 "<p>Die Variante <code>e^(2x)·(1 + x)</code> vergisst die innere Ableitung 2 bei <code>e^(2x)</code> — die häufigste Fehlerquelle, sobald die Exponentialfunktion einen Faktor im Exponenten trägt.</p>");

q("abl-15","ableitung",3,"Wie lautet die Ableitung von <code>f(x) = sin(2x) / x</code>?",
 ["f′(x) = (2x·cos(2x) − sin(2x)) / x²","f′(x) = (cos(2x) − sin(2x)) / x²","f′(x) = 2·cos(2x)/x","f′(x) = (x·cos(2x) − sin(2x)) / x²","f′(x) = −2·cos(2x)/x²"],0,
 "<p>Quotientenregel mit <code>u = sin(2x)</code> und <code>v = x</code>.</p>"+
 "<ol><li><code>u′ = cos(2x) · 2 = 2·cos(2x)</code> — Kettenregel, die innere Ableitung von <code>2x</code> ist 2.</li>"+
 "<li><code>v′ = 1</code>.</li>"+
 "<li>Zähler: <code>2·cos(2x)·x − sin(2x)·1</code>.</li>"+
 "<li>Nenner: <code>x²</code>.</li></ol>"+
 "<p>Die Variante mit <code>x·cos(2x)</code> im Zähler hat die innere Ableitung bei <code>sin(2x)</code> unterschlagen. Prüfe bei jeder trigonometrischen Funktion, ob im Argument mehr als ein nacktes <code>x</code> steht.</p>");

q("abl-16","ableitung",3,"Wie lautet die Ableitung von <code>f(x) = √(ln(x))</code>?",
 ["f′(x) = 1 / (2x·√(ln(x)))","f′(x) = 1 / (2√(ln(x)))","f′(x) = 1/(2x)","f′(x) = √(1/x)","f′(x) = ln(x) / (2√x)"],0,
 "<p>Zweifache Verschachtelung — genau die Bauart, die in der Klausur 8 Punkte wert ist.</p>"+
 "<ol><li>Äußere Funktion ist die Wurzel: <code>√(u)′ = 1/(2√u)</code>, also <code>1/(2√(ln(x)))</code>.</li>"+
 "<li>Innere Funktion ist <code>ln(x)</code> mit Ableitung <code>1/x</code>.</li>"+
 "<li>Multiplizieren: <code>1/(2√(ln(x))) · 1/x = 1/(2x·√(ln(x)))</code>.</li></ol>"+
 "<p><b>Vorgehen bei Verschachtelungen:</b> Von außen nach innen abarbeiten und die Faktoren einfach aneinanderhängen. Frage dich: „Was würde ich zuerst tun, wenn ich für ein konkretes x einen Wert ausrechnen wollte?“ Die <em>letzte</em> Rechenoperation ist die <em>äußere</em> Funktion — hier ziehst du zuletzt die Wurzel.</p>");

q("abl-17","ableitung",2,"Wie lautet die Ableitung von <code>f(x) = cos(x²)</code>?",
 ["f′(x) = −2x · sin(x²)","f′(x) = −sin(x²)","f′(x) = 2x · sin(x²)","f′(x) = −sin(2x)","f′(x) = −2x · cos(x²)"],0,
 "<ol><li>Äußere Ableitung: <code>cos(u)′ = −sin(u)</code>, also <code>−sin(x²)</code>. Das Minus gehört zum Cosinus.</li>"+
 "<li>Innere Ableitung von <code>x²</code>: <code>2x</code>.</li>"+
 "<li>Zusammen: <code>−2x·sin(x²)</code>.</li></ol>"+
 "<p><b>Die vier Werte, die sitzen müssen:</b> <code>sin′ = cos</code>, <code>cos′ = −sin</code>, <code>(−sin)′ = −cos</code>, <code>(−cos)′ = sin</code>. Das Minus taucht nur beim Ableiten des Cosinus auf — wer das verwechselt, verliert die ganze Aufgabe.</p>");

q("abl-18","ableitung",3,"Wie lautet die Ableitung von <code>f(x) = x² / √(x + 1)</code>?",
 ["f′(x) = x·(3x + 4) / (2·√(x + 1)³)","f′(x) = 2x / √(x + 1)","f′(x) = (2x·√(x+1) − x²) / (x + 1)","f′(x) = x² / (2√(x + 1))","f′(x) = (3x + 4) / (2√(x + 1))"],0,
 "<p>Quotientenregel mit <code>u = x²</code> (<code>u′ = 2x</code>) und <code>v = √(x + 1)</code> (<code>v′ = 1/(2√(x+1))</code>).</p>"+
 "<ol><li>Zähler: <code>2x·√(x+1) − x²/(2√(x+1))</code>.</li>"+
 "<li>Nenner: <code>(√(x+1))² = x + 1</code>.</li>"+
 "<li>Doppelbruch auflösen: Zähler und Nenner mit <code>2√(x+1)</code> erweitern. Zähler wird <code>4x(x+1) − x² = 4x² + 4x − x² = 3x² + 4x</code>, Nenner wird <code>2(x+1)·√(x+1) = 2√(x+1)³</code>.</li>"+
 "<li><code>x</code> ausklammern: <code>x(3x + 4) / (2√(x+1)³)</code>.</li></ol>"+
 "<p><b>Das ist die härteste Bauart überhaupt:</b> eine Wurzel im Nenner erzeugt einen Doppelbruch. Standardgriff: mit dem Wurzelterm erweitern, damit die Wurzel aus dem Zwischen-Nenner verschwindet. Genau dieser Schritt war auch in der Originalklausur nötig, um von der rohen Quotientenregel auf die angebotene Antwortform zu kommen.</p>");
