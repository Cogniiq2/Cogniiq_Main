// English Reading Comprehension — Texte im Stil des Testteils "Textverständnis"
passage("p1","Platform Economics",
`Two decades ago, the most valuable companies in the world owned factories, pipelines and fleets. Today many of them own almost nothing physical at all. What they own is a platform: a piece of infrastructure that lets other people transact with each other, and a set of rules governing how those transactions happen.

The economics of platforms are unusual because of network effects. A telephone is useless if nobody else has one, mildly useful if a hundred people do, and indispensable once everybody does. Value grows with the number of participants rather than with the number of units produced. This creates a striking asymmetry: the first years of a platform are brutally difficult, because there is nothing to attract users except the promise of users who have not yet arrived. Economists call this the cold-start problem, and most platforms die of it.

Those that survive tend to enjoy a period of extraordinary returns, since each additional user makes the service more attractive to the next one. But the same dynamic that builds a platform can trap it. Because users cluster where other users already are, markets tip toward a single dominant provider, and dominance invites regulatory attention. The very network effects that once looked like a defensible advantage become, in the language of competition authorities, a barrier to entry.

A further complication is that platform operators are not neutral. They set fees, rank results and decide which sellers are visible. Increasingly they also compete with the very sellers who depend on them — a conflict that regulators in Brussels and Washington have begun to treat as structural rather than incidental.`);

q("eng-01","english",2,"What is the main idea of the passage?",
 ["Platforms follow an economic logic in which network effects drive both their success and their regulatory problems.","Physical assets have become worthless in the modern economy.","Most start-ups fail because they lack sufficient funding.","Regulators in Brussels and Washington disagree about competition policy.","Telephones are the earliest example of a successful platform."],0,
 "Hauptgedanken erkennt man daran, dass sie den <em>gesamten</em> Text abdecken. Netzwerkeffekte tauchen in jedem Absatz auf — Aufstieg wie Regulierung. Die anderen Optionen greifen jeweils nur ein Detail heraus.",
 "p1");

q("eng-02","english",2,"According to the passage, the \"cold-start problem\" refers to the difficulty of",
 ["attracting the first users when the platform's value still depends on users who are not there yet","raising capital during an economic downturn","building physical infrastructure before demand exists","complying with regulation in several countries at once","persuading sellers to lower their prices"],0,
 "Der Text definiert den Begriff direkt im Satz davor. Bei Vokabelfragen im Kontext immer den unmittelbar umgebenden Satz lesen, nicht raten.",
 "p1");

q("eng-03","english",3,"The author implies that dominance in platform markets is",
 ["a natural outcome of network effects rather than necessarily a result of misconduct","always the result of illegal behaviour by the operator","impossible to achieve without owning physical assets","temporary and self-correcting without intervention","less common than in traditional industries"],0,
 "„Markets tip toward a single dominant provider“ beschreibt einen Mechanismus, kein Fehlverhalten. Achte auf Wörter wie <em>implies</em> — gesucht ist der begründbare Schluss, nicht das wörtliche Zitat.",
 "p1");

q("eng-04","english",3,"In the final paragraph, the word \"structural\" is closest in meaning to",
 ["built into the way the system works","related to the construction industry","temporary and easily corrected","legally ambiguous","financially significant"],0,
 "Der Gegensatz im selben Satz („rather than incidental“ — zufällig) liefert die Bedeutung. Gegensatzwörter sind der schnellste Weg zu Kontextvokabeln.",
 "p1");

passage("p2","The Limits of Measurement",
`In 1975 the British economist Charles Goodhart made an observation about monetary policy that has since escaped its original field entirely. When a measure becomes a target, he noted, it ceases to be a good measure. The principle now bears his name, and examples of it are easy to find wherever institutions try to manage what they cannot directly observe.

Consider a hospital judged by the length of time patients wait in the emergency department. The metric is a reasonable proxy for quality of care: shorter waits generally mean better staffing and smoother processes. But once funding depends on it, administrators acquire an interest in the number itself rather than in what the number was meant to represent. Patients may be admitted to a ward prematurely to stop the clock, or triaged in ways that improve the average while leaving the sickest no better off.

None of this requires dishonesty. Goodhart's law operates through ordinary, rational responses to incentives, which is precisely what makes it so difficult to design around. Adding more metrics rarely helps, since each new target invites its own distortions, and a dashboard of twenty numbers is no more faithful than a dashboard of one.

The uncomfortable conclusion is that measurement and management stand in unavoidable tension. Numbers are indispensable for running large organisations, yet the act of relying on them changes the behaviour they were meant to describe. The practical response is not to abandon measurement but to hold it loosely: to treat metrics as evidence requiring interpretation rather than as verdicts requiring compliance.`);

q("eng-05","english",2,"The main purpose of the passage is to",
 ["explain a principle about metrics and describe why it is hard to avoid","criticise the British health service for falsifying its statistics","argue that organisations should stop measuring performance","summarise Goodhart's contribution to monetary policy","compare hospitals in different countries"],0,
 "Der Text erklärt Goodharts Gesetz, illustriert es und diskutiert Gegenmaßnahmen. Extreme Formulierungen wie „stop measuring“ widersprechen dem letzten Absatz.",
 "p2");

q("eng-06","english",2,"The hospital example is used primarily to",
 ["illustrate how a useful measure degrades once it becomes a target","prove that emergency departments are underfunded","show that doctors frequently act dishonestly","suggest that waiting times should never be recorded","compare private and public health care"],0,
 "Beispiele im Textverständnis dienen fast immer der Illustration einer These. Frage dich: Welchen Satz davor stützt das Beispiel?",
 "p2");

q("eng-07","english",3,"According to the passage, adding more metrics is ineffective because",
 ["each additional target creates distortions of its own","most organisations lack the data to compute them","managers find large dashboards difficult to read","regulators forbid the use of multiple indicators","the metrics tend to contradict one another"],0,
 "Direkt im dritten Absatz genannt. Optionen, die plausibel klingen, aber nicht im Text stehen, sind die typischen Ablenker.",
 "p2");

q("eng-08","english",3,"The phrase \"to hold it loosely\" suggests that metrics should be",
 ["used as evidence that still requires judgement","collected less frequently than at present","kept confidential within the organisation","replaced by qualitative descriptions","reported only to external regulators"],0,
 "Der Doppelpunkt im selben Satz erklärt die Metapher: „evidence requiring interpretation rather than verdicts requiring compliance“.",
 "p2");

passage("p3","Why Software Projects Run Late",
`Frederick Brooks, who managed the development of IBM's OS/360 operating system, drew a conclusion from that troubled project which has proved remarkably durable: adding manpower to a late software project makes it later. The reasoning is straightforward. New members must be trained, which consumes the time of the people who are already productive, and the number of communication channels within a team grows faster than the team itself. A group of three people has three pairs to coordinate; a group of twelve has sixty-six.

Brooks was careful about the scope of his claim. Work that can be cleanly partitioned — harvesting a field, say — does scale with the number of workers. Software rarely partitions cleanly, because the components interact and the interactions must be negotiated between the people who own them. Where coordination dominates, extra hands add more cost than capacity.

Later research complicated the picture without overturning it. Studies of open-source projects found that some very large teams remain productive, but they tend to be organised into small, loosely coupled units with stable interfaces between them, so that most work requires no negotiation at all. In other words, the projects that scale are those that have engineered their communication requirements downward rather than simply accepting them.

That reframing matters. Brooks's law is often quoted as an argument against hiring, which was never the point. It is an argument about architecture: the structure of a system and the structure of the organisation that builds it are two descriptions of the same thing.`);

q("eng-09","english",2,"Brooks's law states that adding people to a late software project",
 ["delays it further","has no measurable effect","helps only if the new members are experienced","reduces overall cost","improves quality but not speed"],0,
 "Steht wörtlich im ersten Satz. Solche Detailfragen zuerst beantworten — sie kosten am wenigsten Zeit.",
 "p3");

q("eng-10","english",3,"The comparison between three people and twelve people is intended to show that",
 ["coordination effort grows faster than team size","larger teams produce more code","training takes longer in big organisations","small teams are always more skilled","communication is unnecessary in small teams"],0,
 "Von 3 auf 12 Personen vervierfacht sich das Team, die Paare steigen aber von 3 auf 66 — überproportional. Zahlenbeispiele im Text belegen fast immer eine Wachstumsaussage.",
 "p3");

q("eng-11","english",3,"The passage suggests that large open-source teams stay productive mainly because they",
 ["reduce the amount of coordination their work requires","hire only highly experienced developers","work without deadlines","use a single shared codebase without interfaces","avoid dividing work into components"],0,
 "„Engineered their communication requirements downward“ ist der Kern. Der Text nennt kleine, lose gekoppelte Einheiten als Mittel dazu.",
 "p3");

q("eng-12","english",3,"The author's attitude toward the common use of Brooks's law is best described as",
 ["corrective — the law is real but often cited for the wrong conclusion","dismissive — the law has been disproved by later research","enthusiastic — the law justifies smaller teams in all cases","neutral — the author reports without evaluating","hostile — the law reflects outdated management thinking"],0,
 "Der letzte Absatz sagt ausdrücklich, das Gesetz werde häufig falsch zitiert („which was never the point“), bestreitet es aber nicht. Bei Haltungsfragen auf wertende Wörter achten.",
 "p3");

passage("p4","Data and Consent",
`The standard mechanism for protecting personal data online is notice and consent: a service explains what it collects, and the user agrees. The arrangement has an appealing logic. It respects autonomy, it is cheap to implement, and it places the decision with the person whose data is at stake.

It also fails in practice, for reasons that are now well documented. One study estimated that reading the privacy policies encountered by an average user in a single year would take roughly 200 hours. Consent obtained under those conditions is formally valid and substantively empty. Worse, the disclosures that matter least — the boilerplate about cookies — are the ones users see most often, while genuinely consequential transfers happen further down a supply chain the user never encounters.

There is also a structural problem that no amount of clearer wording can solve. Data about one person is frequently informative about others. A user who discloses their own genome discloses a great deal about their siblings, who were never asked. Consent is individual; the consequences are collective.

Some regulators have accordingly shifted emphasis from consent to obligation: rules about what organisations may do with data regardless of what users have agreed to, including purpose limitation and data minimisation. The change is subtle but important. It moves the burden from the person least able to evaluate the risk to the party best positioned to manage it.`);

q("eng-13","english",2,"According to the passage, the main weakness of notice and consent is that",
 ["consent is technically valid but not meaningfully informed","users are legally prohibited from refusing","it is expensive for companies to implement","it applies only to genetic data","regulators have never endorsed it"],0,
 "Der zweite Absatz formuliert es direkt: „formally valid and substantively empty“.",
 "p4");

q("eng-14","english",2,"The figure of 200 hours is cited in order to",
 ["show that reading privacy policies is impractical for ordinary users","estimate the cost of regulatory compliance","demonstrate that policies have grown longer over time","compare different legal systems","criticise the length of genetic testing forms"],0,
 "Statistiken im Text stützen die unmittelbar vorangehende Behauptung — hier das Scheitern in der Praxis.",
 "p4");

q("eng-15","english",3,"The example of the genome is used to illustrate that",
 ["one person's disclosure can affect people who never consented","genetic data is more valuable than other data","medical records are poorly protected","families rarely discuss privacy","consent forms should be longer"],0,
 "Der Absatz endet mit „Consent is individual; the consequences are collective“ — genau die Pointe des Beispiels.",
 "p4");

q("eng-16","english",3,"The shift described in the final paragraph moves responsibility toward",
 ["the organisations that process the data","individual users","national parliaments","the courts","data subjects' families"],0,
 "„The party best positioned to manage it“ meint die datenverarbeitenden Organisationen — im Gegensatz zur Person, die das Risiko am schlechtesten einschätzen kann.",
 "p4");

passage("p5","The Productivity Paradox",
`In 1987 Robert Solow remarked that the computer age could be seen everywhere except in the productivity statistics. At the time, American firms had been investing heavily in information technology for more than a decade, yet measured productivity growth had slowed rather than accelerated. The observation became known as the productivity paradox, and it has resurfaced with every subsequent wave of technology.

Three explanations compete. The first is mismeasurement: national accounts were designed for an economy of physical goods and capture improvements in quality, variety and convenience poorly. If a service becomes free but better, statistics may record a decline. The second is redistribution: some investment buys competitive position rather than output, as when two firms spend heavily to take customers from each other and the sector as a whole gains nothing.

The third, and the one that has aged best, is lag. General-purpose technologies deliver their gains only after complementary investments have been made — in skills, in processes, and above all in reorganisation. Electricity illustrates the pattern. Factories initially installed electric motors in buildings designed around a central steam engine, and saw modest returns. Only when plants were redesigned around distributed power, roughly forty years later, did productivity jump.

The lesson is not that technology fails to deliver, but that the delivery depends on organisational change that is slow, costly and easy to postpone. The bottleneck is rarely the machine.`);

q("eng-17","english",2,"The productivity paradox refers to the observation that",
 ["heavy investment in technology was not reflected in measured productivity growth","computers became cheaper faster than expected","productivity statistics were never collected before 1987","American firms invested less in IT than European firms","technology reduced employment in manufacturing"],0,
 "Solows Bemerkung wird im ersten Absatz erklärt. Titelbegriffe werden fast immer im ersten Absatz definiert.",
 "p5");

q("eng-18","english",3,"Which explanation does the author regard as most persuasive?",
 ["Lag: gains arrive only after complementary organisational change","Mismeasurement of quality and variety","Redistribution of customers between competing firms","A combination of all three in equal measure","None — the author rejects all three"],0,
 "„The one that has aged best“ signalisiert die Präferenz des Autors. Solche Wertungen sind der Schlüssel zu „which does the author regard“-Fragen.",
 "p5");

q("eng-19","english",3,"The example of electricity is included to show that",
 ["the benefits of a general-purpose technology require redesigning how work is organised","electric motors were less efficient than steam engines","forty years is the standard delay for any new technology","factories resisted electrification for political reasons","energy costs determine productivity growth"],0,
 "Nicht die Zahl 40 ist der Punkt, sondern die Neugestaltung der Fabriken. Vorsicht bei Antworten, die eine Beispielzahl zu einer allgemeinen Regel erheben.",
 "p5");

q("eng-20","english",2,"The phrase \"The bottleneck is rarely the machine\" means that",
 ["the limiting factor is organisational rather than technical","machines are usually broken","hardware costs are negligible","technology should be purchased in larger quantities","factories should employ fewer workers"],0,
 "Der Satz fasst den Absatz zusammen: langsame, teure organisatorische Veränderung ist der begrenzende Faktor.",
 "p5");

// Wahlbereich Wirtschaftsinformatik — Wirtschaft, Kennzahlen, Datenverständnis
q("wi-01","wi",2,"Ein Unternehmen verkauft ein Produkt für 50 € bei variablen Kosten von 30 € pro Stück. Der Deckungsbeitrag je Stück beträgt",
 ["20 €","50 €","30 €","80 €","1.500 €"],0,
 "Deckungsbeitrag = Preis − variable Kosten. Er dient dazu, die Fixkosten zu decken; erst darüber entsteht Gewinn.");

q("wi-02","wi",2,"Fixkosten 40.000 €, Preis 50 €, variable Kosten 30 €. Die Gewinnschwelle liegt bei",
 ["2.000 Stück","800 Stück","1.333 Stück","4.000 Stück","1.000 Stück"],0,
 "40.000 : 20 € Deckungsbeitrag = 2.000 Stück.");

q("wi-03","wi",2,"Ein Unternehmen erzielt 500.000 € Umsatz und 40.000 € Gewinn. Die Umsatzrendite beträgt",
 ["8 %","12,5 %","4 %","40 %","0,8 %"],0,
 "Gewinn : Umsatz = 40.000/500.000 = 0,08.");

q("wi-04","wi",3,"Ein Betrieb senkt seine variablen Stückkosten von 30 € auf 24 €, Preis und Fixkosten bleiben gleich. Der Deckungsbeitrag je Stück steigt damit um",
 ["30 %","6 %","20 %","24 %","25 %"],0,
 "Von 20 € auf 26 €, also +6 € auf 20 € Basis = 30 %. Der Grundwert ist der alte Deckungsbeitrag, nicht der Preis.");

q("wi-05","wi",2,"Welche Aussage über Fixkosten trifft zu?",
 ["Sie fallen unabhängig von der Produktionsmenge an.","Sie steigen proportional zur Produktionsmenge.","Sie sind pro Stück immer konstant.","Sie entfallen bei Produktionsmenge null.","Sie entsprechen den Materialkosten."],0,
 "Fixkosten sind mengenunabhängig — je Stück sinken sie deshalb mit steigender Menge (Fixkostendegression).");

q("wi-06","wi",3,"Umsatz 2023: 800.000 €. Umsatz 2024: 920.000 €. Das Wachstum beträgt",
 ["15 %","12 %","13 %","20 %","8,7 %"],0,
 "120.000/800.000 = 0,15. Zunahme immer durch den Ausgangswert teilen.");

q("wi-07","wi",2,"Ein IT-Projekt kostet 240.000 € und spart jährlich 60.000 €. Die statische Amortisationszeit beträgt",
 ["4 Jahre","3 Jahre","5 Jahre","2 Jahre","6 Jahre"],0,
 "Investition : jährlicher Rückfluss = 240.000 : 60.000.");

q("wi-08","wi",3,"Vier Abteilungen melden Kosten von 120, 180, 60 und 240 Tsd. €. Wie hoch ist der Anteil der größten Abteilung?",
 ["40 %","24 %","30 %","25 %","60 %"],0,
 "Summe 600, davon 240 → 240/600 = 0,4. Bei Tabellenaufgaben zuerst die Gesamtsumme bilden.");

q("wi-09","wi",2,"Ein Onlineshop hat 20.000 Besucher und 600 Bestellungen. Die Konversionsrate beträgt",
 ["3 %","0,3 %","30 %","6 %","33 %"],0,
 "600/20.000 = 0,03. Die Kommastelle ist hier die eigentliche Falle: 600/20.000 = 3/100.");

q("wi-10","wi",3,"Ein Server kostet 6.000 € und wird linear über 5 Jahre abgeschrieben. Der Buchwert nach 2 Jahren beträgt",
 ["3.600 €","2.400 €","4.800 €","1.200 €","3.000 €"],0,
 "Lineare Abschreibung: 1.200 € pro Jahr, nach 2 Jahren 6.000 − 2.400 = 3.600 €.");

q("wi-11","wi",2,"Zwei Produkte tragen 60 % bzw. 40 % zum Umsatz bei. Produkt A wächst um 10 %, Produkt B schrumpft um 10 %. Der Gesamtumsatz",
 ["steigt um 2 %","bleibt gleich","sinkt um 2 %","steigt um 10 %","sinkt um 5 %"],0,
 "0,6 · 1,1 + 0,4 · 0,9 = 0,66 + 0,36 = 1,02. Gewichtete Veränderungen immer mit den Anteilen multiplizieren.");

q("wi-12","wi",3,"Ein Prozess besteht aus vier hintereinander geschalteten Stationen mit Kapazitäten von 100, 80, 120 und 90 Stück pro Stunde. Der Gesamtdurchsatz beträgt",
 ["80 Stück/h","90 Stück/h","97,5 Stück/h","120 Stück/h","390 Stück/h"],0,
 "Bei einer Kette bestimmt der Engpass den Durchsatz — die langsamste Station. Mitteln wäre hier falsch.");
