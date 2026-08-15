// Algebra, Gleichungen, Ungleichungen | Potenzen, Wurzeln, Logarithmen
q("alg-01","algebra",1,"Welche Lösungsmenge hat <code>x² − 5x + 6 = 0</code>?",
 ["{2; 3}","{−2; −3}","{1; 6}","{−1; −6}","{2; −3}"],0,
 "Vieta: gesucht sind zwei Zahlen mit Summe 5 und Produkt 6 → 2 und 3. Kein Umweg über die p-q-Formel nötig.");

q("alg-02","algebra",1,"Welche Lösungen hat <code>x² + 4x − 12 = 0</code>?",
 ["x = 2 und x = −6","x = −2 und x = 6","x = 3 und x = −4","x = 4 und x = −3","x = 1 und x = −12"],0,
 "Summe der Lösungen = −4, Produkt = −12 → 2 und −6. Probe: 2 + (−6) = −4 ✓, 2 · (−6) = −12 ✓.");

q("alg-03","algebra",1,"<code>(3a − 2b)²</code> ist gleich",
 ["9a² − 12ab + 4b²","9a² − 6ab + 4b²","9a² − 12ab − 4b²","3a² − 12ab + 2b²","9a² + 4b²"],0,
 "Binomische Formel: (u−v)² = u² − 2uv + v² mit u = 3a, v = 2b. Der Mischterm ist 2 · 3a · 2b = 12ab.");

q("alg-04","algebra",1,"Für <code>x ≠ 3</code> lässt sich <code>(x² − 9)/(x − 3)</code> vereinfachen zu",
 ["x + 3","x − 3","x² + 3","3x","1"],0,
 "Zähler ist die dritte binomische Formel: (x−3)(x+3). Der Faktor (x−3) kürzt sich.");

q("alg-05","algebra",2,"Das Gleichungssystem <code>2x + 3y = 12</code> und <code>x − y = 1</code> hat die Lösung",
 ["x = 3, y = 2","x = 2, y = 3","x = 4, y = 3","x = 5, y = 4","x = 1, y = 0"],0,
 "Aus der zweiten Gleichung x = y + 1, eingesetzt: 2(y+1) + 3y = 12 → 5y = 10 → y = 2, x = 3.");

q("alg-06","algebra",1,"Die Ungleichung <code>3 − 2x > 7</code> ist erfüllt für",
 ["x < −2","x > −2","x < 2","x > 2","x < −5"],0,
 "−2x > 4, dann durch −2 teilen — dabei dreht sich das Ungleichheitszeichen: x < −2.");

q("alg-07","algebra",2,"Wie groß ist die Summe aller Lösungen von <code>|2x − 6| = 4</code>?",
 ["6","4","10","2","0"],0,
 "2x − 6 = 4 → x = 5; 2x − 6 = −4 → x = 1. Summe 6. (Kurz: die Lösungen liegen symmetrisch um x = 3.)");

q("alg-08","algebra",2,"Welchen Wert hat x in <code>1/x + 1/(2x) = 3</code>?",
 ["1/2","1/3","2","3","2/3"],0,
 "Linke Seite zusammenfassen: 2/(2x) + 1/(2x) = 3/(2x). Also 3/(2x) = 3 → 2x = 1 → x = 1/2.");

q("alg-09","algebra",3,"Wie viele reelle Lösungen hat <code>√(x + 7) = x − 5</code>?",
 ["genau eine","genau zwei","keine","unendlich viele","genau drei"],0,
 "Quadrieren: x + 7 = x² − 10x + 25 → x² − 11x + 18 = 0 → x = 9 oder x = 2. Probe: x = 2 liefert √9 = 3 ≠ −3, ist also Scheinlösung. Nur x = 9 bleibt.");

q("alg-10","algebra",2,"<code>x³ − x</code> vollständig faktorisiert ergibt",
 ["x(x − 1)(x + 1)","x(x² + 1)","(x − 1)(x + 1)","x²(x − 1)","x(x − 1)²"],0,
 "Erst x ausklammern: x(x² − 1), dann dritte binomische Formel auf x² − 1 anwenden.");

q("alg-11","algebra",2,"Der Scheitelpunkt der Parabel <code>y = x² − 6x + 5</code> liegt bei",
 ["(3 | −4)","(−3 | −4)","(3 | 4)","(6 | 5)","(−3 | 14)"],0,
 "Quadratische Ergänzung: x² − 6x + 9 − 9 + 5 = (x−3)² − 4. Oder: x_S = −b/(2a) = 6/2 = 3, dann y einsetzen.");

q("alg-12","algebra",2,"Für welche Werte von k hat <code>x² + kx + 9 = 0</code> genau eine reelle Lösung?",
 ["k = 6 oder k = −6","k = 3 oder k = −3","k = 9","k = 0","k = 18"],0,
 "Genau eine Lösung ⇔ Diskriminante null: k² − 4·1·9 = 0 → k² = 36 → k = ±6.");

q("alg-13","algebra",3,"Wenn <code>x + 1/x = 3</code>, welchen Wert hat dann <code>x² + 1/x²</code>?",
 ["7","9","6","11","3"],0,
 "Quadrieren: (x + 1/x)² = x² + 2 + 1/x² = 9. Also x² + 1/x² = 9 − 2 = 7.");

q("alg-14","algebra",1,"Die Summe der Lösungen von <code>2x² − 8x + 6 = 0</code> beträgt",
 ["4","8","3","−4","6"],0,
 "Vieta: Summe = −b/a = 8/2 = 4. (Die Lösungen sind 1 und 3.)");

q("alg-15","algebra",1,"<code>(2/3) : (4/9)</code> ergibt",
 ["3/2","8/27","2/3","4/9","1/6"],0,
 "Division durch einen Bruch = Multiplikation mit dem Kehrwert: (2/3)·(9/4) = 18/12 = 3/2.");

q("alg-16","algebra",2,"Löst man <code>A = P · (1 + r)</code> nach r auf, erhält man",
 ["r = A/P − 1","r = A/P + 1","r = (A − 1)/P","r = P/A − 1","r = A − P"],0,
 "Durch P teilen: A/P = 1 + r, dann 1 subtrahieren.");

q("alg-17","algebra",3,"Löst man <code>1/f = 1/a + 1/b</code> nach b auf, ergibt sich",
 ["b = a·f/(a − f)","b = a·f/(a + f)","b = (a − f)/(a·f)","b = f − a","b = a/f − 1"],0,
 "1/b = 1/f − 1/a = (a − f)/(a·f). Kehrwert bilden: b = a·f/(a − f).");

q("alg-18","algebra",1,"Die Ungleichung <code>x² − 4 < 0</code> gilt genau für",
 ["−2 < x < 2","x < −2 oder x > 2","x < 2","x > −2","x < 4"],0,
 "x² < 4 bedeutet |x| < 2. Zwischen den Nullstellen ist die nach oben geöffnete Parabel negativ.");

q("alg-19","algebra",2,"Zwei Zahlen haben die Summe 30 und die Differenz 6. Ihr Produkt beträgt",
 ["216","180","240","144","196"],0,
 "Die Zahlen sind 18 und 12 (Mittelwert 15, jeweils ±3). Produkt: 18 · 12 = 216. Kurz: 15² − 3² = 225 − 9.");

q("alg-20","algebra",2,"<code>(x + 2)² − (x − 2)²</code> ist gleich",
 ["8x","0","2x²","4x","8"],0,
 "Dritte binomische Formel auf die Differenz zweier Quadrate: [(x+2)+(x−2)]·[(x+2)−(x−2)] = 2x · 4 = 8x.");

q("alg-21","algebra",3,"<code>1/(√5 − 2)</code> lässt sich schreiben als",
 ["√5 + 2","√5 − 2","(√5 + 2)/9","1/9","√5/2"],0,
 "Mit (√5 + 2) erweitern. Nenner: (√5)² − 2² = 5 − 4 = 1. Es bleibt √5 + 2.");

q("alg-22","algebra",3,"<code>(x³ − 8) : (x − 2)</code> ergibt",
 ["x² + 2x + 4","x² − 2x + 4","x² + 4","x² − 4","x² + 2x − 4"],0,
 "Formel a³ − b³ = (a − b)(a² + ab + b²) mit a = x, b = 2. Probe mit x = 0: −8 : −2 = 4 ✓.");

q("alg-23","algebra",2,"Wie lang ist das Lösungsintervall von <code>|x − 3| ≤ 5</code>?",
 ["10","5","8","3","6"],0,
 "−5 ≤ x − 3 ≤ 5 → −2 ≤ x ≤ 8. Die Länge ist 8 − (−2) = 10, also immer das Doppelte der Schranke.");

q("alg-24","algebra",2,"Wie lautet die Lösungsmenge von <code>(x − 1)(x + 4) = 0</code>?",
 ["{1; −4}","{−1; 4}","{1; 4}","{−1; −4}","{0}"],0,
 "Ein Produkt ist null, sobald ein Faktor null ist: x − 1 = 0 oder x + 4 = 0. Vorzeichen umdrehen, nicht abschreiben.");

q("pot-01","potenz",1,"<code>2¹⁰</code> ist gleich",
 ["1024","512","2048","100","256"],0,
 "Zweierpotenzen auswendig: 2⁸ = 256, 2⁹ = 512, 2¹⁰ = 1024. Diese Reihe spart im Test viel Zeit.");

q("pot-02","potenz",1,"<code>(2³)⁴</code> ist gleich",
 ["4096","128","512","2401","64"],0,
 "Potenz einer Potenz: Exponenten multiplizieren → 2¹² = 4096 (= 4 · 1024).");

q("pot-03","potenz",1,"<code>a⁵ · a⁻³</code> ist gleich",
 ["a²","a⁻¹⁵","a⁸","a⁻²","a"],0,
 "Gleiche Basis, Multiplikation: Exponenten addieren → 5 + (−3) = 2.");

q("pot-04","potenz",2,"<code>8^(2/3)</code> ist gleich",
 ["4","16","2","6","64"],0,
 "Erst die dritte Wurzel (∛8 = 2), dann quadrieren: 2² = 4. Immer zuerst wurzeln, dann potenzieren — die Zahlen bleiben klein.");

q("pot-05","potenz",2,"<code>27^(−1/3)</code> ist gleich",
 ["1/3","−3","3","−1/3","1/9"],0,
 "Negativer Exponent = Kehrwert, Nenner 3 = dritte Wurzel: 1/∛27 = 1/3.");

q("pot-06","potenz",1,"<code>log₂(32)</code> ist gleich",
 ["5","6","4","16","2"],0,
 "Frage: 2 hoch was ergibt 32? 2⁵ = 32.");

q("pot-07","potenz",2,"<code>log₃(1/9)</code> ist gleich",
 ["−2","2","−3","1/2","−1/9"],0,
 "1/9 = 3⁻², also ist der Logarithmus −2. Logarithmen von Zahlen unter 1 sind negativ.");

q("pot-08","potenz",1,"<code>log(a) + log(b)</code> ist gleich",
 ["log(a·b)","log(a + b)","log(a/b)","log(a)·log(b)","log(aᵇ)"],0,
 "Erstes Logarithmusgesetz: Aus Produkt wird Summe. Entsprechend log(a) − log(b) = log(a/b).");

q("pot-09","potenz",3,"Welches x löst <code>2ˣ = 8^(x − 2)</code>?",
 ["3","2","6","4","1"],0,
 "Beide Seiten auf Basis 2: 8^(x−2) = 2^(3x−6). Exponenten gleichsetzen: x = 3x − 6 → 2x = 6 → x = 3.");

q("pot-10","potenz",2,"Welches x löst <code>3^(2x) = 81</code>?",
 ["2","4","3","1/2","9"],0,
 "81 = 3⁴, also 2x = 4 → x = 2.");

q("pot-11","potenz",2,"<code>log₅(125) − log₅(5)</code> ist gleich",
 ["2","3","1","25","5"],0,
 "3 − 1 = 2. Alternativ: log₅(125/5) = log₅(25) = 2.");

q("pot-12","potenz",1,"<code>ln(e³)</code> ist gleich",
 ["3","e³","1/3","e","0"],0,
 "ln ist der Logarithmus zur Basis e, also hebt ln(eˣ) = x sich gegenseitig auf.");

q("pot-13","potenz",2,"<code>10^(log₁₀ 7)</code> ist gleich",
 ["7","10","70","log 7","1"],0,
 "Potenz und Logarithmus zur selben Basis sind Umkehrfunktionen und heben sich auf.");

q("pot-14","potenz",1,"<code>√50</code> ist gleich",
 ["5√2","2√5","25√2","10√5","√5 · √20"],0,
 "50 = 25 · 2, und √25 = 5. Quadratzahlen immer aus der Wurzel ziehen.");

q("pot-15","potenz",2,"<code>(√2)⁸</code> ist gleich",
 ["16","8","4","64","2√2"],0,
 "(2^(1/2))⁸ = 2⁴ = 16.");

q("pot-16","potenz",2,"Welches x löst <code>4ˣ = 1/64</code>?",
 ["−3","3","−4","−1/3","−16"],0,
 "64 = 4³, also 1/64 = 4⁻³ → x = −3.");

q("pot-17","potenz",1,"Wenn <code>log₂ x = 5</code>, dann ist x gleich",
 ["32","10","25","64","16"],0,
 "Definition des Logarithmus: x = 2⁵ = 32.");

q("pot-18","potenz",2,"<code>2⁴⁰ : 2³⁷</code> ist gleich",
 ["8","3","2⁷⁷","1,08","16"],0,
 "Division bei gleicher Basis: Exponenten subtrahieren → 2³ = 8. Nicht dividieren, sondern subtrahieren — 2⁷⁷ wäre die Multiplikation.");

q("pot-19","potenz",2,"<code>(0,5)⁻²</code> ist gleich",
 ["4","−0,25","0,25","2","−4"],0,
 "0,5 = 1/2, negativer Exponent kehrt um: (2)² = 4.");

q("pot-20","potenz",3,"Welche Aussage über <code>log₂ 6</code> ist richtig?",
 ["2 < log₂ 6 < 3","1 < log₂ 6 < 2","3 < log₂ 6 < 4","log₂ 6 = 3","log₂ 6 > 4"],0,
 "2² = 4 < 6 < 8 = 2³, also liegt der Logarithmus zwischen 2 und 3. Einschachteln statt rechnen — ohne Taschenrechner der Standardtrick.");

q("pot-21","potenz",2,"<code>x^(1/2) · x^(1/3)</code> ist gleich",
 ["x^(5/6)","x^(1/6)","x^(2/3)","x^(1/5)","x^(3/2)"],0,
 "Exponenten addieren: 1/2 + 1/3 = 3/6 + 2/6 = 5/6.");

q("pot-22","potenz",2,"Wie viele Nullen hat <code>10⁵ · 10³</code> am Ende?",
 ["8","15","5","3","2"],0,
 "10⁵ · 10³ = 10⁸ — der Exponent zählt direkt die Nullen.");
