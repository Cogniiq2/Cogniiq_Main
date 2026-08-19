// Technisches Verständnis: Steht die Aussage im Text oder folgt sie direkt daraus?
var JA = ["Ja – das steht so im Text oder folgt direkt daraus","Nein – das steht so nicht im Text"];
var NEIN = ["Nein – das steht so nicht im Text","Ja – das steht so im Text oder folgt direkt daraus"];

passage("tv-cache","Caches and Locality",
`Modern processors execute instructions far faster than main memory can supply data, and the gap between the two has widened steadily for decades. Caches exist to hide it. They work because real programs exhibit locality: data used recently is likely to be used again soon, and data stored near a recently accessed address is likely to be accessed next.

A cache hit costs a handful of cycles; a miss that reaches main memory costs hundreds. One might conclude that caches should simply be made as large as possible, but designers rarely do this. A larger cache takes longer to search and occupies chip area that could serve other purposes, so the additional capacity is paid for with additional latency. The usual compromise is a hierarchy of several levels, each larger and slower than the one above it.

Not every workload benefits. Streaming computations that touch each item exactly once gain nothing from a cache, since nothing is ever reused, and they may actively harm overall performance by displacing data that other parts of the program still need.`);

q("tv-c1","tv",2,"Steht das im Text?<br><br><b>„Ein Cache-Treffer ist deutlich günstiger als ein Zugriff auf den Hauptspeicher.“</b>",
 JA,0,
 "<p><b>Ja.</b> Wörtlich im Text: „A cache hit costs a handful of cycles; a miss that reaches main memory costs <b>hundreds</b>.“ Eine Handvoll gegen mehrere Hundert Takte — das ist genau die Aussage.</p>"+
 "<p><b>Vorgehen bei solchen Aussagen:</b> Suche die Zahl oder den Vergleich im Text und lege beide nebeneinander. Wenn Größenordnung <em>und</em> Richtung des Vergleichs übereinstimmen, ist die Aussage gedeckt. Hier stimmt beides.</p>",
 "tv-cache");

q("tv-c2","tv",2,"Steht das im Text?<br><br><b>„Caches sollten grundsätzlich so groß wie möglich gebaut werden, weil mehr Kapazität immer mehr Leistung bedeutet.“</b>",
 NEIN,0,
 "<p><b>Nein — der Text sagt sogar ausdrücklich das Gegenteil.</b> „One might conclude that caches should simply be made as large as possible, <b>but designers rarely do this</b>.“ Begründung im Text: Ein größerer Cache braucht länger zum Durchsuchen und kostet Chipfläche.</p>"+
 "<p><b>Die Falle heißt Scheinschlussfolgerung.</b> Der Text formuliert einen naheliegenden Gedanken (<em>one might conclude</em>) ausdrücklich nur, um ihn anschließend zu widerlegen. Wer beim Überfliegen nur den ersten Halbsatz erwischt, kreuzt „Ja“ an.</p>"+
 "<p><b>Signalwörter, die dich warnen müssen:</b> <em>but, however, although, one might think, in fact</em>. Was hinter ihnen steht, kippt in der Regel die Aussage davor. Lies bei jeder Aussage den Satz zu Ende, bevor du entscheidest.</p>",
 "tv-cache");

q("tv-c3","tv",2,"Steht das im Text?<br><br><b>„Alle Programme profitieren von einem Cache.“</b>",
 NEIN,0,
 "<p><b>Nein.</b> Der letzte Absatz sagt genau das Gegenteil: „<b>Not every workload benefits.</b> Streaming computations that touch each item exactly once gain nothing from a cache.“</p>"+
 "<p><b>Die Falle heißt Übergeneralisierung</b> — sie ist der zweithäufigste Trick in diesem Aufgabentyp. Der Text sagt „manche“ oder „nicht alle“, die Aussage macht daraus „alle“.</p>"+
 "<p><b>Praktische Regel:</b> Absolutwörter wie <em>alle, immer, nie, jeder, ausschließlich</em> sind ein Alarmsignal. Sie sind selten gedeckt, weil Fachtexte fast immer einschränkend formulieren. Suche gezielt nach einer Ausnahme im Text — findest du eine, ist die Aussage falsch.</p>",
 "tv-cache");

q("tv-c4","tv",2,"Steht das im Text?<br><br><b>„Der Geschwindigkeitsunterschied zwischen Prozessor und Hauptspeicher ist über Jahrzehnte hinweg gewachsen.“</b>",
 JA,0,
 "<p><b>Ja.</b> Erster Satz: „the gap between the two has <b>widened steadily for decades</b>“ — der Abstand hat über Jahrzehnte stetig zugenommen.</p>"+
 "<p><b>Warum diese Aussage leicht ist:</b> Sie ist eine reine Übersetzung, ohne Bewertung und ohne Verallgemeinerung. Solche Aussagen sind in der Klausur die geschenkten Punkte — sie zuerst abhaken und die Zeit für die kniffligen aufsparen.</p>",
 "tv-cache");

passage("tv-debt","Technical Debt",
`The metaphor of technical debt was introduced by Ward Cunningham to explain to non-programmers why development slows down over time. Shipping quickly with a design one knows to be imperfect resembles borrowing money: it buys speed today and charges interest later, paid in the form of every future change taking longer than it should.

Cunningham was insistent on a restriction that is now widely ignored. The metaphor applies only when the team understands the domain well enough to know that it is taking a deliberate shortcut. Code written out of ignorance of the problem is not debt; it is simply bad code, and calling it debt suggests a considered decision that was never made.

Repayment means refactoring, and refactoring competes with new features for the same scarce engineering hours. That competition, rather than any technical difficulty, is why repayment is so often postponed. It is also worth noting that not all debt deserves repayment: a module scheduled for deletion next quarter can be left exactly as it is.`);

q("tv-d1","tv",2,"Steht das im Text?<br><br><b>„Laut Cunningham liegt technische Schuld nur dann vor, wenn die Abkürzung bewusst gewählt wurde.“</b>",
 JA,0,
 "<p><b>Ja.</b> „The metaphor applies <b>only</b> when the team understands the domain well enough to know that it is taking a <b>deliberate shortcut</b>.“ Das Wort <em>only</em> macht daraus genau die Einschränkung, die die Aussage behauptet.</p>"+
 "<p><b>Auf Einschränkungswörter achten:</b> <em>only, unless, provided that, except</em> tragen im Fachtext oft die eigentliche Aussage. Wenn eine Prüfungsaussage genau diese Einschränkung wiedergibt, ist sie in aller Regel gedeckt.</p>",
 "tv-debt");

q("tv-d2","tv",2,"Steht das im Text?<br><br><b>„Auch schlecht geschriebener Code aus Unwissenheit zählt laut Text als technische Schuld.“</b>",
 NEIN,0,
 "<p><b>Nein — der Text widerspricht ausdrücklich:</b> „Code written out of ignorance of the problem <b>is not debt</b>; it is simply bad code.“</p>"+
 "<p><b>Die Falle ist eine Umkehrung der Einschränkung.</b> Der Text zieht eine Grenze (bewusst = Schuld, unwissend = nicht Schuld), die Aussage hebt diese Grenze auf. Solche Aussagen prüfst du am schnellsten, indem du im Text nach dem verneinenden Satz suchst — er steht fast immer direkt neben der Definition.</p>"+
 "<p><b>Achtung, Weltwissen ausblenden:</b> Im echten Berufsleben nennen viele Teams jeden Murks „technische Schuld“. Genau davor warnt der Text sogar. Gefragt ist aber ausschließlich, was <em>im Text</em> steht — nicht, was üblich ist.</p>",
 "tv-debt");

q("tv-d3","tv",2,"Steht das im Text?<br><br><b>„Das Abtragen technischer Schuld konkurriert mit neuen Funktionen um dieselbe knappe Entwicklungszeit.“</b>",
 JA,0,
 "<p><b>Ja.</b> „refactoring <b>competes with new features for the same scarce engineering hours</b>“ — wörtlich dieselbe Aussage.</p>"+
 "<p>Der Text geht sogar noch einen Schritt weiter und nennt genau diese Konkurrenz als Grund für das ständige Aufschieben („That competition, <b>rather than any technical difficulty</b>“). Auch das wäre als Aussage gedeckt — der Text benennt die Ursache ausdrücklich.</p>",
 "tv-debt");

q("tv-d4","tv",2,"Steht das im Text?<br><br><b>„Technische Schuld sollte immer so früh wie möglich abgetragen werden.“</b>",
 NEIN,0,
 "<p><b>Nein.</b> Der letzte Satz sagt das Gegenteil: „<b>not all debt deserves repayment</b>: a module scheduled for deletion next quarter can be left exactly as it is.“</p>"+
 "<p><b>Zwei Fallen auf einmal:</b> erstens das Absolutwort <em>immer</em>, zweitens eine Handlungsempfehlung, die der Text nirgends ausspricht. Fachtexte dieser Art beschreiben meist Zusammenhänge und geben selten Ratschläge — eine Aussage im Befehlston („sollte“, „muss“) ist deshalb besonders verdächtig.</p>"+
 "<p><b>Prüfmuster:</b> Wenn eine Aussage ein <em>Sollen</em> enthält, suche im Text nach einer Stelle, die tatsächlich eine Empfehlung ausspricht. Findest du nur Beschreibungen, lautet die Antwort Nein.</p>",
 "tv-debt");

passage("tv-drift","Model Drift",
`A machine learning model deployed in production carries an assumption that is rarely stated: that the future will resemble the data it was trained on. When that assumption fails — customers change their habits, a sensor is recalibrated, a competitor adjusts its prices — the model's accuracy decays, sometimes within weeks.

Practitioners distinguish two cases. In data drift the distribution of the inputs changes. In concept drift the relationship between inputs and the target changes, while the inputs themselves may look entirely ordinary. The second case is considerably harder to detect for exactly that reason: nothing about the incoming data appears unusual.

Measuring accuracy directly would settle the question, but doing so requires labels, and labels frequently arrive weeks after the prediction or never arrive at all. Teams therefore fall back on proxy signals such as shifts in the distribution of the model's outputs. The standard remedy is retraining on recent data. This is not free: recent data may no longer contain the rare events that the older training set captured, and a retrained model can lose the ability to handle them.`);

q("tv-m1","tv",2,"Steht das im Text?<br><br><b>„Konzeptdrift ist schwerer zu erkennen als Datendrift, weil die Eingabedaten unauffällig bleiben können.“</b>",
 JA,0,
 "<p><b>Ja.</b> „The second case is considerably <b>harder to detect</b> for exactly that reason: nothing about the incoming data appears unusual.“ Sowohl der Vergleich (schwerer) als auch die Begründung (unauffällige Eingaben) stehen wörtlich da.</p>"+
 "<p><b>Wichtig:</b> Die Aussage enthält ein <em>weil</em>, behauptet also eine Ursache. Bei Kausalaussagen musst du beides prüfen — die Behauptung <em>und</em> die Begründung. Hier trägt der Text beides, deshalb Ja.</p>",
 "tv-drift");

q("tv-m2","tv",2,"Steht das im Text?<br><br><b>„Die Genauigkeit eines Modells lässt sich im laufenden Betrieb jederzeit direkt messen.“</b>",
 NEIN,0,
 "<p><b>Nein.</b> Der Text: „Measuring accuracy directly would settle the question, <b>but</b> doing so requires labels, and labels frequently arrive weeks after the prediction <b>or never arrive at all</b>.“</p>"+
 "<p>Genau deshalb weichen Teams laut Text auf Ersatzsignale aus. Wäre direkte Messung jederzeit möglich, wäre dieser ganze Absatz überflüssig.</p>"+
 "<p><b>Nützliche Gegenprobe:</b> Frage dich, ob der Text noch Sinn ergäbe, wenn die Aussage stimmte. Ergibt er dann keinen Sinn mehr, ist die Aussage falsch. Dieser Test funktioniert auch dann, wenn du die entscheidende Stelle nicht sofort wiederfindest.</p>",
 "tv-drift");

q("tv-m3","tv",2,"Steht das im Text?<br><br><b>„Ein auf neuen Daten neu trainiertes Modell kann die Fähigkeit verlieren, seltene Ereignisse zu behandeln.“</b>",
 JA,0,
 "<p><b>Ja.</b> „recent data may no longer contain the rare events that the older training set captured, and a retrained model <b>can lose the ability to handle them</b>.“</p>"+
 "<p><b>Beachte das vorsichtige „kann“</b> in Aussage und Text. Stünde in der Aussage „verliert immer“, wäre sie falsch — der Text sagt nur, dass es passieren kann. Die Stärke der Behauptung muss zur Stärke der Textstelle passen: <em>may</em> ↔ <em>kann</em>, <em>always</em> ↔ <em>immer</em>.</p>",
 "tv-drift");

q("tv-m4","tv",2,"Steht das im Text?<br><br><b>„Modelle verlieren an Genauigkeit, weil ihre Algorithmen mit der Zeit veralten.“</b>",
 NEIN,0,
 "<p><b>Nein.</b> Der Text nennt eine völlig andere Ursache: Nicht das Modell altert, sondern die <em>Welt verändert sich</em> — „customers change their habits, a sensor is recalibrated, a competitor adjusts its prices“. Der Algorithmus bleibt derselbe; er passt nur nicht mehr zur Realität.</p>"+
 "<p><b>Die Falle heißt untergeschobene Ursache</b> und ist besonders tückisch, weil das <em>Ergebnis</em> stimmt: Die Genauigkeit sinkt tatsächlich, das steht im Text. Falsch ist allein die Begründung.</p>"+
 "<p><b>Merke:</b> Bei jeder Aussage mit <em>weil, deshalb, aufgrund</em> prüfst du zwei Dinge getrennt — steht die Wirkung im Text, und steht <em>diese</em> Ursache im Text? Nur wenn beides zutrifft, lautet die Antwort Ja.</p>",
 "tv-drift");

passage("tv-consensus","Consensus Protocols",
`Distributed systems must agree on shared state even when some of their machines fail. Protocols such as Paxos and Raft achieve this by requiring a majority: as long as more than half the nodes can communicate, the system continues to make progress, and the remaining minority can be safely ignored. Without a majority, no progress is possible at all. This is why clusters are almost always sized with an odd number of nodes — an odd cluster tolerates the same number of failures as the next larger even one, at lower cost.

A theoretical result known as FLP shows that in a fully asynchronous network, no deterministic protocol can guarantee both correctness and termination if even a single process may fail. Practical systems sidestep the result rather than solve it, using timeouts to decide when a node should be presumed dead. This trades a theoretical guarantee for behaviour that is adequate in practice.

Raft was published well after Paxos, and its stated design goal was understandability. Its authors argued that Paxos was so difficult to reason about that implementations frequently diverged from the specification.`);

q("tv-k1","tv",2,"Steht das im Text?<br><br><b>„Raft wurde in erster Linie mit dem Ziel entwickelt, verständlicher zu sein.“</b>",
 JA,0,
 "<p><b>Ja.</b> „its <b>stated design goal was understandability</b>“ — das erklärte Entwurfsziel war Verständlichkeit. Die Begründung liefert der Text gleich mit: Paxos sei so schwer zu durchdringen, dass Implementierungen von der Spezifikation abwichen.</p>"+
 "<p>Achte darauf, dass der Text über das <em>Ziel</em> spricht, nicht über das Ergebnis. Die Aussage tut dasselbe („mit dem Ziel“) und ist damit exakt gedeckt.</p>",
 "tv-consensus");

q("tv-k2","tv",2,"Steht das im Text?<br><br><b>„Konsensprotokolle können auch dann Fortschritt erzielen, wenn keine Mehrheit erreichbar ist.“</b>",
 NEIN,0,
 "<p><b>Nein.</b> Der Text sagt unmissverständlich das Gegenteil: „<b>Without a majority, no progress is possible at all.</b>“</p>"+
 "<p><b>Diese Fallenart ist die einfachste:</b> die direkte Umkehrung eines Satzes aus dem Text. Sie ist trotzdem gefährlich, wenn man den Text nur überflogen hat, denn die Begriffe (Mehrheit, Fortschritt) stimmen ja alle — nur die Verneinung fehlt.</p>"+
 "<p><b>Gegenmittel:</b> Achte beim Lesen besonders auf Verneinungen (<em>no, not, without, never, unable</em>) und markiere sie. Genau an diesen Stellen entstehen die Umkehrfallen.</p>",
 "tv-consensus");

q("tv-k3","tv",2,"Steht das im Text?<br><br><b>„Praktische Systeme umgehen das FLP-Resultat mithilfe von Zeitschranken.“</b>",
 JA,0,
 "<p><b>Ja.</b> „Practical systems <b>sidestep</b> the result rather than solve it, <b>using timeouts</b> to decide when a node should be presumed dead.“</p>"+
 "<p><b>Beachte die feine Wortwahl:</b> Der Text sagt „umgehen“ (<em>sidestep</em>), ausdrücklich nicht „lösen“ (<em>rather than solve it</em>). Die Aussage benutzt ebenfalls „umgehen“ und ist damit korrekt. Stünde dort „lösen das FLP-Problem“, wäre sie falsch — ein einziges Verb entscheidet.</p>",
 "tv-consensus");

q("tv-k4","tv",2,"Steht das im Text?<br><br><b>„Cluster werden mit einer ungeraden Anzahl von Knoten ausgelegt, weil das FLP-Resultat es verlangt.“</b>",
 NEIN,0,
 "<p><b>Nein.</b> Beide Tatsachen stehen im Text, aber sie gehören nicht zusammen. Die ungerade Knotenzahl begründet der Text mit der <b>Mehrheitsregel</b>: „an odd cluster tolerates the same number of failures as the next larger even one, at lower cost“. Das FLP-Resultat steht in einem völlig anderen Absatz und handelt von asynchronen Netzen.</p>"+
 "<p><b>Die Falle heißt Querverbindung:</b> Zwei korrekte Aussagen aus verschiedenen Absätzen werden mit einem <em>weil</em> zusammengeklebt. Weil beide Teile für sich richtig sind, wirkt der Satz beim Überfliegen vertraut.</p>"+
 "<p><b>Gegenmittel:</b> Bei jedem <em>weil</em> prüfst du, ob Ursache und Wirkung im Text <em>im selben Zusammenhang</em> stehen. Stammen sie aus verschiedenen Absätzen, ist der Zusammenhang meist hinzugedichtet.</p>",
 "tv-consensus");

passage("tv-static","Static Analysis",
`A static analyser examines source code without executing it. Because it reasons about all possible runs of a program rather than the particular runs a test happens to exercise, it can expose defects that testing would never reach — a race condition that occurs once in a million executions is invisible to a test suite but plainly visible to an analyser that considers every interleaving.

That same generality forces an uncomfortable trade-off. An analyser that never misses a genuine defect must, as a matter of logic, also produce warnings about code that is in fact correct. These false positives are not a sign of a badly built tool; they are the price of the guarantee. In practice teams abandon analysers whose false-positive rate is high, not because the warnings are wrong in principle but because the effort of examining each one exceeds what the tool returns.

Type systems are a deliberately restricted form of static analysis. They have achieved far wider adoption than general analysers, largely because their rules are simple enough that a programmer can predict what the checker will say before running it.`);

q("tv-s1","tv",2,"Steht das im Text?<br><br><b>„Statische Analyse führt das Programm aus, um Fehler zu finden.“</b>",
 NEIN,0,
 "<p><b>Nein.</b> Gleich der erste Satz: „A static analyser examines source code <b>without executing it</b>.“ Genau das ist die Definition von <em>statisch</em> — im Gegensatz zu <em>dynamisch</em>, wo man das Programm laufen lässt.</p>"+
 "<p><b>Wenn dir ein Fachbegriff unbekannt ist,</b> steht seine Erklärung fast immer im ersten Satz, in dem er auftaucht. Genau deshalb lohnt es sich, den ersten Absatz einmal <em>langsam</em> zu lesen und den Rest schneller.</p>",
 "tv-static");

q("tv-s2","tv",2,"Steht das im Text?<br><br><b>„Ein Werkzeug, das nie einen echten Fehler übersieht, meldet zwangsläufig auch korrekten Code.“</b>",
 JA,0,
 "<p><b>Ja.</b> „An analyser that <b>never misses a genuine defect must, as a matter of logic, also produce warnings about code that is in fact correct</b>.“ Das <em>zwangsläufig</em> der Aussage entspricht dem <em>must, as a matter of logic</em> des Textes.</p>"+
 "<p><b>Das ist der Kern des Absatzes:</b> Es handelt sich nicht um eine Schwäche schlechter Werkzeuge, sondern um einen logisch unvermeidlichen Preis („they are the price of the guarantee“). Wer diesen Zusammenhang erfasst hat, beantwortet auch die nächste Aussage sicher.</p>",
 "tv-static");

q("tv-s3","tv",2,"Steht das im Text?<br><br><b>„Teams geben Analysewerkzeuge mit vielen Fehlalarmen auf, weil der Aufwand für die Prüfung den Nutzen übersteigt.“</b>",
 JA,0,
 "<p><b>Ja.</b> „teams abandon analysers whose false-positive rate is high, <b>not because the warnings are wrong in principle but because the effort of examining each one exceeds what the tool returns</b>.“</p>"+
 "<p><b>Der Text nennt die Ursache ausdrücklich</b> — und grenzt sie sogar gegen eine falsche Ursache ab. Bei Aussagen mit <em>weil</em> ist das der Idealfall: Wenn der Text selbst eine Begründung liefert und sie mit der Aussage übereinstimmt, lautet die Antwort Ja.</p>",
 "tv-static");

q("tv-s4","tv",2,"Steht das im Text?<br><br><b>„Typsysteme sind weiter verbreitet als allgemeine Analysewerkzeuge, weil sie mehr Fehler finden.“</b>",
 NEIN,0,
 "<p><b>Nein.</b> Die Verbreitung stimmt („far wider adoption“), die Begründung nicht. Laut Text liegt sie daran, dass „their rules are <b>simple enough that a programmer can predict</b> what the checker will say“ — an der Vorhersagbarkeit, nicht an der Fehlerausbeute.</p>"+
 "<p>Der Text sagt sogar, Typsysteme seien eine <em>bewusst eingeschränkte</em> Form („deliberately restricted“) — sie finden also eher <em>weniger</em>, nicht mehr.</p>"+
 "<p><b>Wieder das Muster untergeschobene Ursache</b> — inzwischen zum dritten Mal. Genau darauf laufen diese Aufgaben immer wieder hinaus: Die Hälfte des Satzes stimmt, die andere Hälfte ist erfunden. Zerlege deshalb jede Aussage in Behauptung und Begründung und prüfe beide einzeln.</p>",
 "tv-static");
