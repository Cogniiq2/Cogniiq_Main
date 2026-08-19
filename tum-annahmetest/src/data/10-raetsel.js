// Ehrliche, Lügner und Normale — der 8-Punkte-Logikblock
q("rae-01","raetsel",1,"Auf der Insel gibt es Ehrliche (sagen immer die Wahrheit), Lügner (lügen immer) und Normale (sagen mal so, mal so). A sagt: <b>„Ich bin ein Lügner.“</b> Was ist A?",
 ["A ist ein Normaler.","A ist ein Lügner.","A ist ein Ehrlicher.","Das lässt sich nicht bestimmen.","Die Situation ist unmöglich."],0,
 "<p><b>Der Grundgriff: jede Rolle einzeln durchspielen und auf Widerspruch prüfen.</b></p>"+
 "<ol><li><b>Wäre A ein Ehrlicher?</b> Dann müsste die Aussage wahr sein, A wäre also ein Lügner. Aber A sollte Ehrlicher sein. Widerspruch.</li>"+
 "<li><b>Wäre A ein Lügner?</b> Dann müsste die Aussage falsch sein. Sie lautet „Ich bin ein Lügner“ — und die wäre ja wahr. Ein Lügner darf nichts Wahres sagen. Widerspruch.</li>"+
 "<li><b>Wäre A ein Normaler?</b> Dann ist die Aussage falsch (A ist kein Lügner), und ein Normaler darf lügen. Kein Widerspruch.</li></ol>"+
 "<p><b>Der Satz, den du in jeder Aufgabe brauchst:</b> Niemand außer einem Normalen kann „Ich bin ein Lügner“ sagen. Ehrliche dürfen nichts Falsches sagen, Lügner nichts Wahres — und diese Aussage ist für sie jeweils das Verbotene. Auf einer Insel <em>ohne</em> Normale wäre die Situation schlicht unmöglich.</p>");

q("rae-02","raetsel",2,"Nur Ehrliche und Lügner. A sagt: <b>„Wir beide sind Lügner“</b> (über sich und B). Was folgt?",
 ["A ist ein Lügner, B ist ein Ehrlicher.","A und B sind beide Lügner.","A ist ein Ehrlicher, B ist ein Lügner.","A und B sind beide Ehrliche.","Nicht bestimmbar."],0,
 "<ol><li><b>Annahme: A ist Ehrlicher.</b> Dann wäre die Aussage wahr, also wäre A ein Lügner. Widerspruch — A ist kein Ehrlicher.</li>"+
 "<li><b>Also ist A ein Lügner.</b> Dann ist seine Aussage falsch.</li>"+
 "<li><b>Was heißt „falsch“ hier genau?</b> Die Aussage „A und B sind Lügner“ ist eine Und-Verknüpfung. Sie ist bereits dann falsch, wenn <em>mindestens einer</em> der beiden kein Lügner ist. A <em>ist</em> Lügner — also muss B der Ehrliche sein.</li></ol>"+
 "<p><b>Das ist der entscheidende Punkt bei „und“-Aussagen:</b> Die Verneinung von „beide sind X“ ist <em>nicht</em> „beide sind nicht X“, sondern „mindestens einer ist nicht X“ (Regel von De Morgan). Wer hier falsch verneint, kommt zwangsläufig auf ein falsches Ergebnis.</p>");

q("rae-03","raetsel",2,"Nur Ehrliche und Lügner. A sagt: <b>„Mindestens einer von uns beiden ist ein Lügner“</b> (über sich und B). Was folgt?",
 ["A ist ein Ehrlicher, B ist ein Lügner.","A ist ein Lügner, B ist ein Ehrlicher.","Beide sind Lügner.","Beide sind Ehrliche.","Nicht bestimmbar."],0,
 "<ol><li><b>Annahme: A ist Lügner.</b> Dann ist seine Aussage falsch. Die Verneinung von „mindestens einer ist Lügner“ lautet „<em>keiner</em> ist Lügner“ — dann wäre aber auch A kein Lügner. Widerspruch.</li>"+
 "<li><b>Also ist A ein Ehrlicher</b>, und seine Aussage ist wahr: Mindestens einer der beiden ist ein Lügner.</li>"+
 "<li>A selbst ist es nicht — also ist B der Lügner.</li></ol>"+
 "<p><b>Vergleiche bewusst mit der vorigen Aufgabe:</b> Fast derselbe Satz („beide“ statt „mindestens einer“) führt zum genau umgekehrten Ergebnis. Deshalb musst du bei diesen Rätseln jedes Quantorenwort — <em>alle, beide, mindestens einer, keiner, genau einer</em> — wörtlich nehmen.</p>");

q("rae-04","raetsel",2,"Nur Ehrliche und Lügner. A sagt: <b>„B ist ein Lügner.“</b> B sagt: <b>„A ist ein Lügner.“</b> Was folgt?",
 ["Genau einer von beiden ist ein Lügner; wer, lässt sich nicht bestimmen.","Beide sind Lügner.","Beide sind Ehrliche.","A ist der Lügner.","B ist der Lügner."],0,
 "<ol><li><b>Annahme: A ist Ehrlicher.</b> Dann stimmt seine Aussage, B ist Lügner. B sagt „A ist ein Lügner“ — das ist falsch, und ein Lügner sagt Falsches. Alles passt.</li>"+
 "<li><b>Annahme: A ist Lügner.</b> Dann ist seine Aussage falsch, B ist also Ehrlicher. B sagt „A ist ein Lügner“ — das ist wahr, und ein Ehrlicher sagt Wahres. Passt ebenfalls.</li></ol>"+
 "<p><b>Beide Fälle sind widerspruchsfrei</b>, also ist die Zuordnung nicht eindeutig. Sicher ist nur: Genau einer der beiden lügt — denn in beiden Szenarien ist es immer einer und nie beide.</p>"+
 "<p><b>Lehre daraus:</b> Wenn nach dem Durchspielen mehr als ein Fall übrig bleibt, ist „nicht bestimmbar“ die richtige Antwort — nicht ein Ratefehler. Prüfe aber vorher, ob es eine <em>gemeinsame</em> Erkenntnis aller offenen Fälle gibt; genau die ist hier gefragt.</p>");

q("rae-05","raetsel",3,"Nur Ehrliche und Lügner. A sagt: <b>„Wenn ich ein Ehrlicher bin, dann ist B ein Lügner.“</b> Was folgt?",
 ["A ist ein Ehrlicher, B ist ein Lügner.","A ist ein Lügner, B ist ein Ehrlicher.","Beide sind Ehrliche.","Beide sind Lügner.","Nicht bestimmbar."],0,
 "<p>Hier musst du wissen, wann eine <b>Wenn-dann-Aussage falsch</b> ist: nur dann, wenn die Bedingung erfüllt ist, die Folge aber nicht. In allen anderen Fällen ist sie wahr — insbesondere ist sie <b>automatisch wahr, wenn die Bedingung falsch ist</b>.</p>"+
 "<ol><li><b>Annahme: A ist Lügner.</b> Dann müsste seine Aussage falsch sein. Falsch wäre sie nur, wenn „Ich bin ein Ehrlicher“ zuträfe — A ist aber Lügner, die Bedingung ist also falsch. Damit ist die gesamte Wenn-dann-Aussage <b>wahr</b>. Ein Lügner kann nichts Wahres sagen. Widerspruch.</li>"+
 "<li><b>Also ist A ein Ehrlicher</b>, und seine Aussage ist wahr.</li>"+
 "<li>Da A tatsächlich Ehrlicher ist, ist die Bedingung erfüllt — also muss auch die Folge gelten: B ist ein Lügner.</li></ol>"+
 "<p><b>Das ist die anspruchsvollste Bauart dieser Rätsel</b> und genau deshalb prüfungsrelevant. Merke: Eine Wenn-dann-Aussage mit falscher Bedingung ist wahr. Ein Lügner kann sie deshalb nie aussprechen.</p>");

q("rae-06","raetsel",3,"Genau einer von A, B, C ist Ehrlicher, einer Lügner, einer Normaler. <b>A: „C ist ein Lügner.“ B: „A ist ein Ehrlicher.“ C: „Ich bin ein Normaler.“</b> Wer ist was?",
 ["A Ehrlicher, B Normaler, C Lügner","A Lügner, B Normaler, C Ehrlicher","A Normaler, B Ehrlicher, C Lügner","A Ehrlicher, B Lügner, C Normaler","A Lügner, B Ehrlicher, C Normaler","A Normaler, B Lügner, C Ehrlicher"],0,
 "<p><b>Beginne immer bei der Aussage über die eigene Person</b> — die schränkt am stärksten ein.</p>"+
 "<ol><li><b>C sagt „Ich bin ein Normaler.“</b> Ein Ehrlicher könnte das nicht sagen (wäre falsch). Ein Normaler könnte es sagen (wäre wahr). Ein Lügner könnte es sagen (wäre falsch — er ist ja kein Normaler). Also ist C <b>Normaler oder Lügner</b>, aber kein Ehrlicher.</li>"+
 "<li><b>Fall C = Normaler.</b> Dann ist A's Aussage („C ist Lügner“) falsch, A ist also nicht Ehrlicher — A muss Lügner sein, B wäre Ehrlicher. Aber B sagt „A ist ein Ehrlicher“, was dann falsch wäre. Ein Ehrlicher darf nichts Falsches sagen. <b>Widerspruch.</b></li>"+
 "<li><b>Fall C = Lügner.</b> Dann ist A's Aussage wahr, A ist also Ehrlicher oder Normaler. B sagt „A ist ein Ehrlicher“.<br>· Wäre A Normaler, wäre B's Aussage falsch, B müsste Lügner sein — die Rolle hat aber schon C. Widerspruch.<br>· Also ist <b>A Ehrlicher</b>, und für B bleibt <b>Normaler</b>. Probe: B sagt etwas Wahres, das darf ein Normaler. Alles passt.</li></ol>"+
 "<p><b>Ergebnis: A Ehrlicher, B Normaler, C Lügner.</b> Beachte das Muster: Der Widerspruch entsteht beide Male beim <em>Ehrlichen</em> oder <em>Lügner</em> — nie beim Normalen, denn der darf alles sagen. Prüfe deshalb die beiden strengen Rollen zuerst.</p>");

q("rae-07","raetsel",3,"Genau einer von A, B, C ist Ehrlicher, einer Lügner, einer Normaler. <b>A: „Ich bin kein Lügner.“ B: „Ich bin kein Ehrlicher.“ C: „Ich bin kein Normaler.“</b> Wer ist was?",
 ["A Lügner, B Normaler, C Ehrlicher","A Ehrlicher, B Normaler, C Lügner","A Normaler, B Lügner, C Ehrlicher","A Ehrlicher, B Lügner, C Normaler","A Lügner, B Ehrlicher, C Normaler","A Normaler, B Ehrlicher, C Lügner"],0,
 "<p>Alle drei reden über sich selbst — arbeite die strengen Rollen der Reihe nach ab.</p>"+
 "<ol><li><b>B sagt „Ich bin kein Ehrlicher.“</b> Wäre B Ehrlicher, wäre die Aussage falsch — verboten. Wäre B Lügner, wäre die Aussage wahr („kein Ehrlicher“ stimmt ja) — für einen Lügner ebenfalls verboten. Also ist <b>B ein Normaler</b>.</li>"+
 "<li><b>C sagt „Ich bin kein Normaler.“</b> B ist bereits der Normale, C also Ehrlicher oder Lügner. Wäre C Lügner, wäre die Aussage wahr — verboten. Also ist <b>C ein Ehrlicher</b>, und die Aussage stimmt.</li>"+
 "<li>Für A bleibt <b>Lügner</b>. Probe: A sagt „Ich bin kein Lügner“ — das ist falsch, und genau das muss ein Lügner tun. Passt.</li></ol>"+
 "<p><b>Dieselbe Lösungsstruktur wie in der Originalklausur.</b> Der Schlüssel ist immer dieselbe Frage: <em>Welche Rollen kann diese Person aufgrund ihrer eigenen Aussage nicht haben?</em> Sobald eine Rolle eindeutig vergeben ist, fällt der Rest wie eine Kette.</p>");

q("rae-08","raetsel",2,"Nur Ehrliche und Lügner. A sagt: <b>„Ich bin ein Ehrlicher.“</b> Was folgt?",
 ["Nichts – jeder von beiden könnte das sagen.","A ist ein Ehrlicher.","A ist ein Lügner.","Die Situation ist unmöglich.","A ist ein Normaler."],0,
 "<ol><li><b>Wäre A Ehrlicher:</b> Die Aussage wäre wahr — genau das, was ein Ehrlicher tun muss. Möglich.</li>"+
 "<li><b>Wäre A Lügner:</b> Die Aussage „Ich bin ein Ehrlicher“ wäre falsch — genau das, was ein Lügner tun muss. Ebenfalls möglich.</li></ol>"+
 "<p><b>Also liefert diese Aussage null Information.</b> Auf der Insel behauptet <em>jeder</em>, ehrlich zu sein.</p>"+
 "<p><b>Das ist das genaue Gegenstück zu „Ich bin ein Lügner“:</b> Diesen Satz kann niemand sagen, jenen kann jeder sagen. Beide Extremfälle solltest du sofort erkennen — sie tauchen als Bausteine in größeren Rätseln auf und sparen dort viel Zeit.</p>");

q("rae-09","raetsel",3,"Nur Ehrliche und Lügner. A sagt: <b>„B und ich gehören zur selben Sorte.“</b> Was folgt sicher?",
 ["B ist ein Ehrlicher.","B ist ein Lügner.","A ist ein Ehrlicher.","A ist ein Lügner.","Nichts folgt."],0,
 "<ol><li><b>Annahme: A ist Ehrlicher.</b> Dann ist die Aussage wahr, also gehört B zur selben Sorte — B ist Ehrlicher.</li>"+
 "<li><b>Annahme: A ist Lügner.</b> Dann ist die Aussage falsch, die beiden gehören also <em>nicht</em> zur selben Sorte — B ist demnach Ehrlicher.</li></ol>"+
 "<p><b>In beiden Fällen ist B ein Ehrlicher</b>, obwohl offen bleibt, was A ist. Genau das ist gefragt: nicht die vollständige Zuordnung, sondern die Aussage, die in <em>jedem</em> möglichen Fall gilt.</p>"+
 "<p><b>Technik zum Mitnehmen:</b> Wenn beide Annahmen widerspruchsfrei sind, schreibe für jeden Fall auf, was folgt, und suche die Schnittmenge. Was in allen Fällen gleich ist, ist gesichert — der Rest bleibt offen.</p>");

q("rae-10","raetsel",3,"Genau einer von A, B, C ist Ehrlicher, einer Lügner, einer Normaler. <b>A: „B ist ein Lügner.“ B: „Ich bin kein Lügner.“</b> C schweigt. Wer ist der Lügner?",
 ["A","B","C","Nicht bestimmbar","Es gibt keinen Lügner."],0,
 "<ol><li><b>B sagt „Ich bin kein Lügner.“</b> Wäre B der Lügner, wäre diese Aussage falsch — das ist für einen Lügner erlaubt. Kein Widerspruch, B <em>könnte</em> der Lügner sein.<br>Wäre B Ehrlicher oder Normaler, wäre die Aussage wahr — ebenfalls erlaubt. Aus B's Aussage folgt also nichts.</li>"+
 "<li><b>Weiter über A.</b> Angenommen, A wäre Ehrlicher. Dann ist B tatsächlich Lügner, und C ist Normaler. Prüfung: B (Lügner) sagt „Ich bin kein Lügner“ — falsch, erlaubt. Alles widerspruchsfrei.</li>"+
 "<li><b>Andere Möglichkeit prüfen.</b> Angenommen, A wäre Lügner. Dann ist seine Aussage falsch, B ist also kein Lügner — passt, denn A ist es ja selbst. B wäre dann Ehrlicher oder Normaler, C das jeweils andere. Auch das ist widerspruchsfrei.</li></ol>"+
 "<p><b>Zwei verschiedene Lösungen bleiben übrig</b> (einmal ist B der Lügner, einmal A). Damit ist die Frage <b>nicht bestimmbar</b>.</p>"+
 "<p><b>Warum diese Aufgabe wichtig ist:</b> Nicht jedes Rätsel hat eine eindeutige Lösung, und im Test steht „nicht bestimmbar“ oft zur Auswahl. Höre erst auf zu suchen, wenn du <em>alle</em> Möglichkeiten geprüft hast — nicht schon bei der ersten, die passt.</p>");

q("rae-11","raetsel",2,"Nur Ehrliche und Lügner. A sagt über B: <b>„Er ist ein Ehrlicher.“</b> B sagt über A: <b>„Er ist ein Lügner.“</b> Was folgt?",
 ["Die Situation ist unmöglich.","A ist Ehrlicher, B ist Lügner.","A ist Lügner, B ist Ehrlicher.","Beide sind Lügner.","Nicht bestimmbar."],0,
 "<ol><li><b>Annahme: A ist Ehrlicher.</b> Dann stimmt seine Aussage, B ist Ehrlicher. Dann müsste auch B's Aussage stimmen: A wäre ein Lügner. Aber wir sind von „A ist Ehrlicher“ ausgegangen. Widerspruch.</li>"+
 "<li><b>Annahme: A ist Lügner.</b> Dann ist seine Aussage falsch, B ist also Lügner. Dann müsste B's Aussage falsch sein, A wäre also <em>kein</em> Lügner. Widerspruch.</li></ol>"+
 "<p><b>Beide Fälle scheitern — auf einer reinen Ehrlichen-Lügner-Insel ist diese Situation unmöglich.</b> Mit einem Normalen unter den beiden wäre sie dagegen sofort auflösbar; genau deshalb führt die Klausuraufgabe die dritte Rolle ein.</p>"+
 "<p><b>Merke:</b> „Unmöglich“ ist ein zulässiges Ergebnis. Wenn <em>jede</em> Annahme in einen Widerspruch läuft, hast du nicht falsch gerechnet — die Angabe ist in sich widersprüchlich.</p>");

q("rae-12","raetsel",3,"Genau einer von A, B, C ist Ehrlicher, einer Lügner, einer Normaler. <b>A: „Ich bin ein Ehrlicher.“ B: „A sagt die Wahrheit.“ C: „Ich bin ein Lügner.“</b> Wer ist was?",
 ["Nicht eindeutig bestimmbar","A Ehrlicher, B Normaler, C Lügner","A Normaler, B Lügner, C Ehrlicher","A Lügner, B Normaler, C Ehrlicher","A Ehrlicher, B Lügner, C Normaler"],0,
 "<ol><li><b>C sagt „Ich bin ein Lügner.“</b> Wie in Aufgabe 1: Weder ein Ehrlicher noch ein Lügner kann das sagen. Also ist <b>C der Normale</b> — das steht sofort fest.</li>"+
 "<li>Damit sind A und B in irgendeiner Reihenfolge Ehrlicher und Lügner.</li>"+
 "<li><b>Fall A = Ehrlicher, B = Lügner.</b> A's Aussage („Ich bin Ehrlicher“) ist wahr ✓. B sagt „A sagt die Wahrheit“ — das wäre wahr, aber B ist Lügner. Widerspruch.</li>"+
 "<li><b>Fall A = Lügner, B = Ehrlicher.</b> A sagt „Ich bin Ehrlicher“ — falsch ✓, genau richtig für einen Lügner. B sagt „A sagt die Wahrheit“ — das wäre falsch, aber B ist Ehrlicher. Widerspruch.</li></ol>"+
 "<p><b>Beide Fälle scheitern, die Angabe ist widersprüchlich</b> — es gibt keine gültige Zuordnung, also ist nichts eindeutig bestimmbar.</p>"+
 "<p><b>Die Technik, die hier alles trägt:</b> Wenn eine Person eine Rolle <em>eindeutig</em> festlegt (hier C durch die Lügner-Selbstaussage), setze sie sofort und arbeite mit dem Rest weiter. Aus drei mal zwei mal eins = sechs Möglichkeiten werden so nur noch zwei.</p>");
