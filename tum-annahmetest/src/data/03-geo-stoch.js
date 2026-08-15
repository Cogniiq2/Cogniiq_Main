// Geometrie & Trigonometrie | Stochastik & Kombinatorik | Folgen & Reihen
q("geo-01","geo",1,"Ein Kreis hat den Radius 5. Sein Flächeninhalt beträgt",
 ["25π","10π","5π","100π","25"],0,
 "A = πr² = π · 25. Nicht mit dem Umfang U = 2πr = 10π verwechseln.");

q("geo-02","geo",1,"Ein Kreis hat den Durchmesser 10. Sein Umfang beträgt",
 ["10π","20π","5π","25π","100π"],0,
 "U = π · d. Wer mit dem Radius rechnet: U = 2π · 5 = 10π.");

q("geo-03","geo",1,"Ein rechtwinkliges Dreieck hat die Katheten 6 und 8. Die Hypotenuse ist",
 ["10","14","12","√14","48"],0,
 "6-8-10 ist das klassische pythagoreische Tripel (Vielfaches von 3-4-5). Solche Tripel auswendig kennen: 3-4-5, 5-12-13, 8-15-17.");

q("geo-04","geo",1,"Ein Würfel hat die Kantenlänge 3. Seine Oberfläche beträgt",
 ["54","27","36","18","9"],0,
 "6 Quadrate à 3² = 9, also 6 · 9 = 54. Das Volumen wäre 27.");

q("geo-05","geo",2,"Verdoppelt man die Kantenlänge eines Würfels, so wird sein Volumen",
 ["8-mal so groß","doppelt so groß","4-mal so groß","6-mal so groß","3-mal so groß"],0,
 "Volumen skaliert mit der dritten Potenz: 2³ = 8. Flächen skalieren mit 2² = 4.");

q("geo-06","geo",2,"Verdoppelt man den Radius eines Kreises, so wird sein Flächeninhalt",
 ["4-mal so groß","doppelt so groß","8-mal so groß","gleich groß","π-mal so groß"],0,
 "A = πr², also geht ein Faktor 2 beim Radius quadratisch ein.");

q("geo-07","geo",1,"Ein Dreieck mit Grundseite 12 und zugehöriger Höhe 5 hat den Flächeninhalt",
 ["30","60","17","24","120"],0,
 "A = ½ · g · h = ½ · 12 · 5.");

q("geo-08","geo",2,"Die Summe der Innenwinkel eines Fünfecks beträgt",
 ["540°","360°","720°","450°","900°"],0,
 "Formel (n − 2) · 180° = 3 · 180°. Ein n-Eck zerfällt in n − 2 Dreiecke.");

q("geo-09","geo",1,"<code>sin(30°)</code> ist gleich",
 ["1/2","√3/2","√2/2","1","√3/3"],0,
 "Die drei Standardwerte merken: sin 30° = 1/2, sin 45° = √2/2, sin 60° = √3/2.");

q("geo-10","geo",2,"<code>cos(60°)</code> ist gleich",
 ["1/2","√3/2","√2/2","0","1"],0,
 "cos 60° = sin 30° = 1/2. Cosinus ist der gespiegelte Sinus: cos α = sin(90° − α).");

q("geo-11","geo",1,"<code>tan(45°)</code> ist gleich",
 ["1","0","√2","1/2","∞"],0,
 "tan = sin/cos, und bei 45° sind beide gleich groß.");

q("geo-12","geo",3,"Wenn für einen spitzen Winkel <code>sin α = 3/5</code> gilt, dann ist <code>cos α</code>",
 ["4/5","5/3","3/4","2/5","−4/5"],0,
 "Trigonometrischer Pythagoras sin²α + cos²α = 1: cos²α = 1 − 9/25 = 16/25. Bei einem spitzen Winkel ist der Cosinus positiv.");

q("geo-13","geo",2,"Ein Zylinder hat den Radius 2 und die Höhe 5. Sein Volumen beträgt",
 ["20π","10π","40π","25π","20"],0,
 "V = Grundfläche · Höhe = πr² · h = π · 4 · 5.");

q("geo-14","geo",2,"Die Diagonale eines Quadrats mit der Seitenlänge 4 ist",
 ["4√2","8","4√3","2√2","16"],0,
 "Diagonale = Seite · √2 (Pythagoras im halben Quadrat).");

q("geo-15","geo",2,"Eine Kugel mit Radius 3 hat das Volumen",
 ["36π","27π","12π","108π","9π"],0,
 "V = (4/3)πr³ = (4/3) · π · 27 = 36π.");

q("geo-16","geo",2,"Die Gerade durch die Punkte (1 | 2) und (4 | 11) hat die Steigung",
 ["3","9","1/3","13/5","2"],0,
 "m = Δy/Δx = (11 − 2)/(4 − 1) = 9/3.");

q("geo-17","geo",2,"Die Gerade <code>y = 2x + 3</code> schneidet die x-Achse bei",
 ["x = −1,5","x = 3","x = 1,5","x = −3","x = 0"],0,
 "x-Achse heißt y = 0: 0 = 2x + 3 → x = −1,5.");

q("geo-18","geo",1,"Der Abstand der Punkte (0 | 0) und (3 | 4) beträgt",
 ["5","7","√7","12","25"],0,
 "Pythagoras: √(3² + 4²) = √25.");

q("geo-19","geo",3,"Ein Trapez hat die parallelen Seiten 6 und 10 und die Höhe 4. Sein Flächeninhalt ist",
 ["32","40","60","24","16"],0,
 "A = ½ · (a + c) · h = ½ · 16 · 4. Anschaulich: mittlere Breite 8 mal Höhe 4.");

q("geo-20","geo",3,"Zwei ähnliche Dreiecke verhalten sich in ihren Seitenlängen wie 2 : 3. Ihre Flächen verhalten sich wie",
 ["4 : 9","2 : 3","8 : 27","3 : 2","16 : 81"],0,
 "Längenverhältnis k → Flächenverhältnis k², Volumenverhältnis k³.");

q("sto-01","stoch",1,"Mit welcher Wahrscheinlichkeit zeigt ein fairer Würfel eine gerade Zahl?",
 ["1/2","1/3","1/6","2/3","5/6"],0,
 "Drei günstige (2, 4, 6) von sechs möglichen Ergebnissen.");

q("sto-02","stoch",2,"Zwei faire Würfel werden geworfen. Wie wahrscheinlich ist die Augensumme 7?",
 ["1/6","1/12","7/36","1/36","5/36"],0,
 "6 der 36 Kombinationen ergeben 7 (1+6, 2+5, 3+4 und jeweils vertauscht). 7 ist die häufigste Augensumme.");

q("sto-03","stoch",1,"Wie wahrscheinlich ist es, mit zwei Würfeln zweimal eine Sechs zu werfen?",
 ["1/36","1/12","1/6","2/6","1/18"],0,
 "Unabhängige Ereignisse: Wahrscheinlichkeiten multiplizieren, 1/6 · 1/6.");

q("sto-04","stoch",2,"Eine faire Münze wird dreimal geworfen. Wie wahrscheinlich ist genau zweimal Kopf?",
 ["3/8","1/2","1/4","1/8","2/3"],0,
 "8 gleich wahrscheinliche Verläufe, davon 3 mit genau zweimal Kopf (KKZ, KZK, ZKK).");

q("sto-05","stoch",2,"Eine faire Münze wird dreimal geworfen. Wie wahrscheinlich ist mindestens einmal Kopf?",
 ["7/8","1/2","3/8","1/8","5/8"],0,
 "Gegenereignis „nie Kopf“ hat die Wahrscheinlichkeit (1/2)³ = 1/8. Bei „mindestens“ immer über das Gegenereignis rechnen.");

q("sto-06","stoch",1,"In einer Urne liegen 3 rote und 5 blaue Kugeln. Wie wahrscheinlich ist eine rote Kugel bei einem Zug?",
 ["3/8","3/5","5/8","1/3","1/8"],0,
 "3 günstige von 8 Kugeln insgesamt.");

q("sto-07","stoch",3,"Aus einer Urne mit 3 roten und 5 blauen Kugeln werden zwei Kugeln ohne Zurücklegen gezogen. Wie wahrscheinlich sind beide rot?",
 ["3/28","9/64","1/8","3/64","6/8"],0,
 "3/8 · 2/7 = 6/56 = 3/28. Ohne Zurücklegen sinken Zähler und Nenner im zweiten Zug.");

q("sto-08","stoch",1,"Auf wie viele verschiedene Arten können sich 5 Personen in eine Reihe stellen?",
 ["120","25","60","20","3125"],0,
 "5! = 5 · 4 · 3 · 2 · 1. Fakultäten bis 6! kennen: 1, 2, 6, 24, 120, 720.");

q("sto-09","stoch",2,"Wie viele verschiedene 3-elementige Teams lassen sich aus 10 Personen bilden?",
 ["120","720","1000","30","210"],0,
 "Binomialkoeffizient (10 über 3) = (10·9·8)/(3·2·1) = 720/6 = 120. Reihenfolge spielt keine Rolle.");

q("sto-10","stoch",2,"Wie viele Möglichkeiten gibt es, aus 10 Personen einen Vorsitzenden und einen Stellvertreter zu wählen?",
 ["90","45","100","20","120"],0,
 "Hier zählt die Reihenfolge: 10 · 9 = 90.");

q("sto-11","stoch",1,"Wie viele vierstellige PINs gibt es, wenn jede Stelle eine Ziffer von 0 bis 9 sein darf?",
 ["10.000","5.040","4.000","40","9.000"],0,
 "10 Möglichkeiten pro Stelle, viermal unabhängig: 10⁴.");

q("sto-12","stoch",3,"Wie viele verschiedene Buchstabenfolgen lassen sich aus den Buchstaben von OTTO bilden?",
 ["6","24","12","4","16"],0,
 "4! = 24, geteilt durch die Wiederholungen 2! (zwei O) und 2! (zwei T) → 24/4 = 6.");

q("sto-13","stoch",2,"Der Erwartungswert der Augenzahl eines fairen Würfels beträgt",
 ["3,5","3","4","3,0","6"],0,
 "(1+2+3+4+5+6)/6 = 21/6. Bei symmetrischer Verteilung liegt der Erwartungswert in der Mitte.");

q("sto-14","stoch",3,"Ein Spiel kostet 2 € Einsatz. Mit Wahrscheinlichkeit 1/4 gewinnt man 6 €, sonst nichts. Der erwartete Gewinn pro Spiel beträgt",
 ["−0,50 €","+1,50 €","+0,50 €","−1,00 €","0 €"],0,
 "Erwarteter Auszahlungsbetrag 1/4 · 6 = 1,50 €, abzüglich 2 € Einsatz → −0,50 €. Das Spiel ist unfair.");

q("sto-15","stoch",3,"Wie wahrscheinlich ist mindestens eine Sechs bei drei Würfen?",
 ["91/216","1/2","3/6","125/216","1/216"],0,
 "1 − (5/6)³ = 1 − 125/216 = 91/216, also knapp 42 %.");

q("sto-16","stoch",2,"Für zwei beliebige Ereignisse A und B gilt",
 ["P(A∪B) = P(A) + P(B) − P(A∩B)","P(A∪B) = P(A) + P(B)","P(A∩B) = P(A) + P(B)","P(A∪B) = P(A) · P(B)","P(A∪B) = 1 − P(A∩B)"],0,
 "Additionssatz: Der Überschneidungsbereich würde sonst doppelt gezählt. Nur bei unvereinbaren Ereignissen entfällt er.");

q("sto-17","stoch",2,"Zwei Ereignisse A und B heißen (stochastisch) unabhängig, wenn gilt",
 ["P(A∩B) = P(A) · P(B)","P(A∩B) = 0","P(A∪B) = 1","P(A) = P(B)","P(A|B) = 0"],0,
 "Unabhängig heißt: Das Eintreten von B ändert die Wahrscheinlichkeit von A nicht. Nicht mit „unvereinbar“ (P(A∩B) = 0) verwechseln.");

q("sto-18","stoch",2,"Auf einer Feier begrüßt jede der 8 Personen jede andere mit Handschlag. Wie viele Handschläge gibt es?",
 ["28","64","56","16","36"],0,
 "(8 über 2) = 8 · 7 / 2 = 28. Durch 2, weil ein Handschlag zwei Personen zugleich betrifft.");

q("sto-19","stoch",3,"In einer Gruppe sind 60 % Frauen. 20 % der Frauen und 50 % der Männer tragen eine Brille. Wie hoch ist der Brillenanteil insgesamt?",
 ["32 %","35 %","28 %","40 %","30 %"],0,
 "0,6 · 0,2 + 0,4 · 0,5 = 0,12 + 0,20 = 0,32. Satz von der totalen Wahrscheinlichkeit.");

q("sto-20","stoch",3,"Ein Test erkennt eine Krankheit mit 90 % Sicherheit. Er wird zweimal unabhängig durchgeführt. Wie wahrscheinlich schlägt er mindestens einmal an?",
 ["99 %","81 %","90 %","95 %","100 %"],0,
 "Gegenereignis: zweimal versagen = 0,1 · 0,1 = 1 %. Also 99 %.");

q("fol-01","folgen",1,"Eine arithmetische Folge beginnt mit 3 und hat die Differenz 4. Das 10. Glied ist",
 ["39","43","40","37","30"],0,
 "aₙ = a₁ + (n − 1)·d = 3 + 9 · 4. Häufiger Fehler: 10 statt 9 Schritte rechnen.");

q("fol-02","folgen",1,"Die Summe <code>1 + 2 + 3 + … + 100</code> beträgt",
 ["5.050","5.000","10.100","4.950","5.500"],0,
 "Gauß: n(n+1)/2 = 100 · 101/2.");

q("fol-03","folgen",2,"Die Summe der ersten 20 geraden Zahlen (2 + 4 + … + 40) beträgt",
 ["420","400","380","800","210"],0,
 "2 · (1 + 2 + … + 20) = 2 · 210 = 420. Oder: 20 Paare-Mittelwert 21 mal 20.");

q("fol-04","folgen",2,"Eine geometrische Folge beginnt mit 2 und hat den Quotienten 3. Das 5. Glied ist",
 ["162","486","96","54","243"],0,
 "aₙ = a₁ · qⁿ⁻¹ = 2 · 3⁴ = 2 · 81.");

q("fol-05","folgen",2,"Welche Zahl setzt die Folge 2, 6, 18, 54, … fort?",
 ["162","108","216","72","144"],0,
 "Jedes Glied ist das Dreifache des vorherigen.");

q("fol-06","folgen",3,"Die unendliche Reihe <code>1 + 1/2 + 1/4 + 1/8 + …</code> hat den Wert",
 ["2","1","∞","1,5","e"],0,
 "Geometrische Reihe mit q = 1/2: Summe = a₁/(1 − q) = 1/(1/2) = 2. Konvergiert nur für |q| < 1.");

q("fol-07","folgen",3,"Die unendliche Reihe <code>1/3 + 1/9 + 1/27 + …</code> hat den Wert",
 ["1/2","1/3","2/3","1","3"],0,
 "a₁ = 1/3, q = 1/3: (1/3)/(1 − 1/3) = (1/3)/(2/3) = 1/2.");

q("fol-08","folgen",3,"Die Summe <code>5 + 8 + 11 + … + 50</code> beträgt",
 ["440","445","430","495","400"],0,
 "Anzahl der Glieder: (50 − 5)/3 + 1 = 16. Summe = 16 · (5 + 50)/2 = 16 · 27,5.");

q("fol-09","folgen",1,"Für <code>aₙ = 3n − 1</code> ist das 7. Glied",
 ["20","21","17","22","19"],0,
 "n = 7 einsetzen: 3 · 7 − 1 = 20. Bei einer expliziten Formel wird direkt eingesetzt — im Gegensatz zur rekursiven Darstellung muss man sich nicht hocharbeiten.");

q("fol-10","folgen",2,"Welche Zahl fehlt: 1, 1, 2, 3, 5, 8, __, 21",
 ["13","11","12","16","14"],0,
 "Fibonacci: Jedes Glied ist die Summe der beiden vorherigen (5 + 8 = 13).");
