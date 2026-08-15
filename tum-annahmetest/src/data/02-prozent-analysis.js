// Prozent, Zins, Dreisatz, Wachstum | Analysis
q("pro-01","prozent",1,"35 % von 240 sind",
 ["84","74","96","68","120"],0,
 "10 % = 24, also 30 % = 72; 5 % = 12. Zusammen 84. Prozente immer über 10 %- und 5 %-Bausteine zerlegen.");

q("pro-02","prozent",1,"Ein Artikel kostet 80 €. Nach einer Erhöhung um 25 % kostet er",
 ["100 €","105 €","96 €","110 €","85 €"],0,
 "25 % von 80 = 20. Neuer Preis 100 €. Faktor: 80 · 1,25.");

q("pro-03","prozent",2,"Ein Preis wird zuerst um 20 %, danach um weitere 10 % gesenkt. Die Gesamtsenkung beträgt",
 ["28 %","30 %","25 %","32 %","18 %"],0,
 "Faktoren multiplizieren: 0,8 · 0,9 = 0,72, also bleiben 72 % übrig. Prozentsätze niemals addieren.");

q("pro-04","prozent",1,"Eine Größe steigt von 250 auf 300. Das ist eine Zunahme um",
 ["20 %","16,7 %","50 %","25 %","30 %"],0,
 "Zunahme 50, bezogen auf den Ausgangswert 250: 50/250 = 1/5 = 20 %. Grundwert ist immer der <em>alte</em> Wert.");

q("pro-05","prozent",2,"Eine Größe sinkt von 300 auf 250. Das ist eine Abnahme um",
 ["16,7 %","20 %","50 %","25 %","83,3 %"],0,
 "50/300 = 1/6 ≈ 16,7 %. Beachte: derselbe absolute Unterschied wie in der Aufgabe davor, aber anderer Grundwert.");

q("pro-06","prozent",2,"Nach 20 % Rabatt kostet ein Artikel 96 €. Der ursprüngliche Preis war",
 ["120 €","116 €","115,20 €","124 €","112 €"],0,
 "96 € entsprechen 80 %. 1 % = 1,20 €, also 100 % = 120 €. Rückwärtsrechnen heißt dividieren (96 : 0,8), nicht 20 % aufschlagen.");

q("pro-07","prozent",2,"Ein Bruttopreis beträgt 119 € bei 19 % Mehrwertsteuer. Der Nettopreis ist",
 ["100,00 €","96,39 €","99,00 €","101,00 €","95,20 €"],0,
 "Brutto = Netto · 1,19 → Netto = 119 : 1,19 = 100 €.");

q("pro-08","prozent",2,"1.000 € werden zwei Jahre lang mit 10 % p. a. verzinst (Zinseszins). Das Endkapital beträgt",
 ["1.210 €","1.200 €","1.100 €","1.221 €","1.230 €"],0,
 "1000 · 1,1² = 1000 · 1,21. Im zweiten Jahr werden auch die Zinsen des ersten Jahres verzinst.");

q("pro-09","prozent",2,"Bei 8 % Verzinsung pro Jahr verdoppelt sich ein Kapital ungefähr nach",
 ["9 Jahren","12,5 Jahren","8 Jahren","16 Jahren","6 Jahren"],0,
 "72er-Regel: Verdopplungszeit ≈ 72 : Zinssatz = 72 : 8 = 9. Ohne Taschenrechner die schnellste Näherung.");

q("pro-10","prozent",2,"6 gleich schnelle Maschinen brauchen für einen Auftrag 12 Tage. Wie lange brauchen 8 Maschinen?",
 ["9 Tage","16 Tage","10 Tage","8 Tage","6 Tage"],0,
 "Umgekehrt proportional: 6 · 12 = 72 Maschinentage. 72 : 8 = 9. Mehr Maschinen → weniger Zeit.");

q("pro-11","prozent",2,"4 Maler streichen eine Halle in 6 Stunden. Wie lange brauchen 3 Maler?",
 ["8 Stunden","4,5 Stunden","7 Stunden","9 Stunden","6 Stunden"],0,
 "4 · 6 = 24 Arbeitsstunden, geteilt durch 3 Maler = 8 Stunden.");

q("pro-12","prozent",3,"200 g einer 10-prozentigen Lösung werden mit 300 g einer 20-prozentigen Lösung gemischt. Die Mischung hat",
 ["16 %","15 %","17,5 %","14 %","30 %"],0,
 "Reine Substanz: 20 g + 60 g = 80 g auf 500 g Gesamtmasse = 16 %. Nie die Prozentsätze mitteln, immer die Mengen addieren.");

q("pro-13","prozent",3,"Ein Auto fährt 60 km mit 60 km/h hin und dieselbe Strecke mit 30 km/h zurück. Die Durchschnittsgeschwindigkeit beträgt",
 ["40 km/h","45 km/h","50 km/h","35 km/h","30 km/h"],0,
 "Gesamtstrecke 120 km, Gesamtzeit 1 h + 2 h = 3 h → 40 km/h. Geschwindigkeiten darf man nicht mitteln.");

q("pro-14","prozent",1,"400 € werden im Verhältnis 3 : 5 aufgeteilt. Der größere Anteil beträgt",
 ["250 €","240 €","260 €","300 €","225 €"],0,
 "8 Teile insgesamt, ein Teil = 50 €. Der größere Anteil hat 5 Teile = 250 €.");

q("pro-15","prozent",2,"Ein Kurs steigt um 10 % und fällt anschließend um 10 %. Gegenüber dem Startwert steht er nun",
 ["1 % tiefer","genau gleich","1 % höher","2 % tiefer","10 % tiefer"],0,
 "1,1 · 0,9 = 0,99. Eine Erhöhung und eine gleich große Senkung heben sich nie exakt auf.");

q("pro-16","prozent",2,"Ein Unternehmen hat 12.000 € Fixkosten und erzielt pro verkauftem Stück 30 € Deckungsbeitrag. Der Break-even liegt bei",
 ["400 Stück","360 Stück","300 Stück","450 Stück","1.200 Stück"],0,
 "Break-even = Fixkosten : Deckungsbeitrag pro Stück = 12.000 : 30 = 400. Ab dem 401. Stück entsteht Gewinn.");

q("pro-17","prozent",3,"Ein Umsatz wächst drei Jahre lang um jeweils 5 %. Insgesamt ist er gewachsen um etwa",
 ["16 %","15 %","5 %","20 %","18 %"],0,
 "1,05³ ≈ 1,158. Faustregel: etwas mehr als 3 · 5 % wegen des Zinseszinseffekts.");

q("pro-18","prozent",2,"Von 800 Bewerbern bestehen 12,5 % den Test. Das sind",
 ["100","125","80","96","64"],0,
 "12,5 % = 1/8. 800 : 8 = 100. Häufige Brüche kennen: 12,5 % = 1/8, 25 % = 1/4, 33⅓ % = 1/3, 6,25 % = 1/16.");

q("ana-01","analysis",1,"Die Ableitung von <code>f(x) = x³</code> ist",
 ["3x²","x²/3","3x","x⁴/4","3x³"],0,
 "Potenzregel: Exponent nach vorn, Exponent um 1 verringern.");

q("ana-02","analysis",1,"Die Ableitung von <code>f(x) = 5x² − 3x + 7</code> ist",
 ["10x − 3","10x − 3 + 7","5x − 3","10x + 7","10x"],0,
 "Summandenweise ableiten; die Konstante 7 fällt weg.");

q("ana-03","analysis",2,"Die Ableitung von <code>f(x) = 1/x</code> ist",
 ["−1/x²","1/x²","ln x","−x²","−1/(2x)"],0,
 "1/x = x⁻¹, Potenzregel: −1 · x⁻² = −1/x².");

q("ana-04","analysis",2,"Die Ableitung von <code>f(x) = √x</code> ist",
 ["1/(2√x)","2√x","√x/2","1/√x","x^(3/2)"],0,
 "√x = x^(1/2), abgeleitet ½ · x^(−1/2) = 1/(2√x).");

q("ana-05","analysis",2,"Die Ableitung von <code>f(x) = (2x + 1)³</code> ist",
 ["6(2x + 1)²","3(2x + 1)²","2(2x + 1)²","6(2x + 1)","(2x + 1)²"],0,
 "Kettenregel: äußere Ableitung 3(2x+1)² mal innere Ableitung 2.");

q("ana-06","analysis",3,"Die Ableitung von <code>f(x) = x · eˣ</code> ist",
 ["eˣ(x + 1)","eˣ","x · eˣ","eˣ(x − 1)","x² · eˣ/2"],0,
 "Produktregel: 1 · eˣ + x · eˣ = eˣ(x + 1).");

q("ana-07","analysis",2,"Die Ableitung von <code>f(x) = e^(2x)</code> ist",
 ["2e^(2x)","e^(2x)","2xe^(2x−1)","e²","2e^x"],0,
 "Kettenregel: e-Funktion bleibt stehen, mal innere Ableitung 2.");

q("ana-08","analysis",3,"Die Ableitung von <code>f(x) = ln(3x)</code> ist",
 ["1/x","3/x","1/(3x)","ln 3","3 ln x"],0,
 "Kettenregel: (1/(3x)) · 3 = 1/x. Der konstante Faktor im Logarithmus verschwindet beim Ableiten.");

q("ana-09","analysis",2,"<code>f(x) = x² − 6x + 1</code> hat ein Minimum bei",
 ["x = 3","x = −3","x = 6","x = 0","x = 1"],0,
 "f'(x) = 2x − 6 = 0 → x = 3. f''(x) = 2 > 0, also Minimum.");

q("ana-10","analysis",3,"<code>f(x) = x³ − 3x</code> hat lokale Extremstellen bei",
 ["x = 1 und x = −1","x = 0 und x = 3","x = 3 und x = −3","nur x = 0","gar keinen"],0,
 "f'(x) = 3x² − 3 = 0 → x² = 1 → x = ±1.");

q("ana-11","analysis",3,"Der Wendepunkt von <code>f(x) = x³ − 3x²</code> liegt bei",
 ["x = 1","x = 0","x = 2","x = 3","x = −1"],0,
 "f''(x) = 6x − 6 = 0 → x = 1. Wendepunkt = Nullstelle der zweiten Ableitung mit Vorzeichenwechsel.");

q("ana-12","analysis",1,"<code>∫ x² dx</code> ist gleich",
 ["x³/3 + C","2x + C","x³ + C","3x³ + C","x²/2 + C"],0,
 "Stammfunktion: Exponent um 1 erhöhen, durch den neuen Exponenten teilen.");

q("ana-13","analysis",2,"<code>∫₀¹ 2x dx</code> ist gleich",
 ["1","2","1/2","0","4"],0,
 "Stammfunktion x², eingesetzt: 1² − 0² = 1. Anschaulich: Dreiecksfläche mit Grundseite 1 und Höhe 2.");

q("ana-14","analysis",2,"<code>∫ (1/x) dx</code> ist gleich",
 ["ln|x| + C","−1/x² + C","x⁰ + C","1/(2x²) + C","x · ln x + C"],0,
 "Die einzige Ausnahme der Potenzregel — Exponent −1 lässt sich nicht um 1 erhöhen.");

q("ana-15","analysis",3,"<code>lim (x→∞) (3x² + 2)/(x² − 5)</code> ist gleich",
 ["3","0","∞","−3","1"],0,
 "Bei gleichem Grad in Zähler und Nenner entscheidet das Verhältnis der Leitkoeffizienten: 3/1.");

q("ana-16","analysis",2,"<code>lim (x→∞) (2x + 1)/x²</code> ist gleich",
 ["0","2","∞","1","1/2"],0,
 "Der Nenner wächst schneller (Grad 2 > Grad 1), der Bruch geht gegen null.");

q("ana-17","analysis",3,"<code>lim (x→2) (x² − 4)/(x − 2)</code> ist gleich",
 ["4","0","2","existiert nicht","∞"],0,
 "Kürzen statt einsetzen: (x−2)(x+2)/(x−2) = x + 2 → 4.");

q("ana-18","analysis",2,"Die Tangente an <code>f(x) = x²</code> an der Stelle x = 3 hat die Steigung",
 ["6","9","3","1/6","12"],0,
 "Steigung = f'(3) = 2 · 3 = 6.");

q("ana-19","analysis",1,"Wenn <code>f'(x) > 0</code> auf einem Intervall gilt, dann ist f dort",
 ["streng monoton steigend","streng monoton fallend","konstant","linksgekrümmt","ohne Extremstelle nicht bestimmbar"],0,
 "Positive Steigung heißt: Die Funktionswerte nehmen zu. Über die Krümmung sagt f' nichts aus.");

q("ana-20","analysis",2,"Die Fläche zwischen <code>f(x) = x</code>, der x-Achse und x = 0 bis x = 4 beträgt",
 ["8","16","4","2","12"],0,
 "Dreieck mit Grundseite 4 und Höhe 4: ½ · 4 · 4 = 8. Deckt sich mit ∫₀⁴ x dx = x²/2.");

q("ana-21","analysis",3,"Wie viele reelle Nullstellen hat <code>f(x) = x⁴ − 2x²</code>?",
 ["3","2","4","1","0"],0,
 "x²(x² − 2) = 0 → x = 0 (doppelt) sowie x = ±√2. Verschiedene Stellen: drei.");

q("ana-22","analysis",1,"Notwendige Bedingung für eine Extremstelle von f ist",
 ["f'(x) = 0","f''(x) = 0","f(x) = 0","f'(x) > 0","f''(x) < 0"],0,
 "f'(x) = 0 ist notwendig, aber nicht hinreichend — siehe x³ an der Stelle 0 (Sattelpunkt).");
