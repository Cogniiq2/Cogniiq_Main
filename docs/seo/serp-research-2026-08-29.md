# SERP-Recherche und Entscheidungsprotokoll — 2026-08-29

Basis-Commit `0652c2e` · Recherche über Websuche, **ohne Seitenabruf** (siehe
Einschränkung unten). Dieses Dokument hält fest, was recherchiert wurde, was
daraus gebaut wurde und — wichtiger — **was bewusst nicht gebaut wurde und
woran es hängt**.

## Einschränkung dieser Recherche

Der Netzwerk-Egress dieser Arbeitsumgebung ließ **keinen einzigen Seitenabruf**
zu. Suchergebnisse (Titel, URL, Snippet) waren verfügbar, das Öffnen einer Seite
nicht — geprüft an EUR-Lex, gesetze-im-internet.de und der EU-Kommission.

Konsequenz, und sie ist der Grund für die wichtigste Entscheidung weiter unten:
**keine Primärquelle konnte gelesen und damit keine belastbar zitiert werden.**
Alle unten genannten Fundstellen sind aus Suchergebnissen aufgetaucht und sind
**ungeprüft**. Sie sind Rechercheansätze, keine Belege.

## Wettbewerbsbild (Suchergebnisse, nicht abgerufen)

Deutschsprachige Anbieter, die im Cluster „KI Telefonassistent (Arzt-)Praxis"
sichtbar sind: Doctolib/aaron.ai, CGM, Dr. Flex, fonio.ai, PraxisConcierge,
DocMedico, 321 MED, medizinio, drwait, ordicall, VITAS, Parloa, telli, smao,
voiceOne, RufLab, safina, hey-listen, one100. Dazu ein Vergleichsportal auf
einer Exact-Match-Domain.

Beobachtungen mit Folgen für die Strategie:

- **Der Kopfbegriff ist vergeben.** IONOS, Telekom/Placetel, TENIOS und Doctolib
  besetzen „KI Telefonassistent". Für eine Domain ohne Autorität ist das in
  90 Tagen nicht erreichbar. Nicht verfolgt.
- **Jeder „Vergleich" ist von einem Anbieter geschrieben**, der sich selbst
  listet. Ein ehrlicher Vergleich wäre inhaltlich das stärkste Asset des
  Clusters und ranking-seitig trotzdem chancenlos gegen jährlich aktualisierte,
  budgetgestützte Konkurrenzseiten. Nicht verfolgt.
- **Bei „PVS-Schnittstelle" rankt ein Nutzerforum.** Das ist ein deutliches
  Schwächesignal des SERP — dort ist die ehrlichste Antwort bereits von
  Anwendern geschrieben, nicht von Anbietern.
- **Bei „DSGVO" rankt keine Kanzlei, keine Aufsichtsbehörde, kein Fachverlag** —
  ausschließlich dünne Anbieter-Blogs, keiner davon mit Primärquellen.
- **Bei „einführen" rankt ein generischer Pillar-Beitrag eines Großanbieters
  mit**, der die Intention gar nicht bedient. Das ist die klassische Signatur
  einer Inhaltslücke.

## Bewertung der Intentionen

| Cluster | Wettbewerb | Chance 30–90 Tage | Entscheidung |
|---|---|---|---|
| KI Telefonassistent einführen | niedrig | hoch | **gebaut** |
| KI Telefonassistent DSGVO / § 203 StGB | niedrig–mittel | hoch | **zurückgestellt** — Quellen |
| KI Telefonassistent PVS / Schnittstelle | niedrig–mittel | mittel–hoch | **zurückgestellt** — OWNER-INPUT B |
| Terminbuchung (mit Praxis-Qualifier) | niedrig–mittel | mittel | zurückgestellt |
| Zahnarztpraxis | mittel | mittel | zurückgestellt |
| Kosten (qualifiziert) | mittel | mittel | eingefrorenes Experiment |
| KI Telefonassistent (Kopf) | hoch | keine | nicht verfolgt |
| Vergleich | hoch | keine | nicht verfolgt |
| Kosten (unqualifiziert) | hoch | keine | nicht verfolgt |
| Website Relaunch (national) | hoch | keine | nicht verfolgt |

## Was gebaut wurde

**`/ki-telefonassistent-einfuehren`** — der Einführungsleitfaden.

Er beantwortet als einzige Seite der Website die Frage, was die **Praxis** zu
entscheiden und zu prüfen hat: die Trennlinie zwischen übernehmbaren und
menschenpflichtigen Anliegen, die Klärung der Übergabe vor der Unterschrift, die
vier Prüfkategorien vor dem Go-live, die einzeln erteilte Freigabe und die erste
Betriebswoche.

Die inhaltliche Grundlage ist der tatsächlich betriebene Einführungsprozess.
Veröffentlicht sind **Vorgehen und Prüfkategorien**, nicht die interne
Aufgabenliste — eine Checklistenzeile als Websatz wäre eine Zusage, die so
nicht vereinbart ist.

Warum jemand darauf verlinken würde: Es ist ein herstellerunabhängiger Maßstab,
mit dem eine Praxis **jedes** Angebot prüfen kann, einschließlich unseres. Die
vier Prüfkategorien — insbesondere Verwechslung/Zugriff und das Verhalten im
Ernstfall — kommen auf keiner der gesichteten Wettbewerbsseiten vor.

## Was bewusst nicht gebaut wurde

### Rechtsrahmen-Seite (§ 203 StGB, Art. 9/28/32 DSGVO, Art. 50 KI-VO)

Nach Nachfrage und Wettbewerbslage die **stärkste** Einzelchance des Clusters:
hohe Nachfrage, kaufentscheidende Frage, und kein Wettbewerber arbeitet mit
Primärquellen.

**Blockiert, weil keine Primärquelle gelesen werden konnte.** Eine Seite, deren
Autorität gerade darauf beruht, dass sie richtig zitiert, darf nicht auf
ungeprüften Fundstellen stehen. Ein falscher Absatzverweis auf einer Seite über
ärztliche Schweigepflicht kostet mehr Glaubwürdigkeit, als die Seite an
Sichtbarkeit bringt.

Rechercheansätze, **alle ungeprüft**, vor Verwendung zu öffnen und zu belegen:

- Verordnung (EU) 2024/1689 (KI-Verordnung), Art. 50 — Transparenzpflicht bei
  Systemen, die mit Menschen interagieren; über EUR-Lex im Volltext zu prüfen.
  Sekundär gestützt, aber ebenfalls ungeprüft: eine FAQ der EU-Kommission zu
  Art. 50. **Der Geltungsbeginn ist zu verifizieren, nicht aus dem Gedächtnis
  zu übernehmen.**
- § 203 StGB, insbesondere Abs. 3 („sonstige mitwirkende Personen") und Abs. 4 —
  amtlicher Text über gesetze-im-internet.de. Fachlich der entscheidende
  deutsche Punkt: Ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO allein
  deckt die Schweigepflicht nicht ab.
- Art. 9, 28 und 32 DSGVO — für Zitate die Verordnung (EU) 2016/679 auf
  EUR-Lex verwenden, nicht einen privaten Wiedergabedienst.
- Ein Positionspapier der Datenschutzkonferenz zu Terminverwaltungsunternehmen
  wurde in Suchergebnissen sichtbar und wäre unmittelbar einschlägig.
- Zur Zuständigkeit: Für eine Privatpraxis in Bayern ist die
  Landesdatenschutzaufsicht zuständig, nicht die BfDI. Eine Aufsichtsleitlinie
  speziell zu KI-Sprachassistenten in Praxen wurde **nicht** gefunden — diese
  Lücke ist selbst ein Rechercheergebnis.

Zusätzliche Hürde unabhängig von den Quellen: Aussagen zu Verarbeitungsort und
Konformität sind projektweit gesperrt (`HONESTY-AUDIT.md` §7.7). Eine
Rechtsseite müsste diese Sperre respektieren und dürfte über die eigene
Verarbeitung nichts behaupten.

### PVS-Integrations-Entscheidungsbaum

Inhaltlich das beste Linkziel des Clusters — ein Forumsbeitrag rankt dort, was
selten ist.

**Blockiert durch OWNER-INPUT B1–B3:** Es darf kein
Praxisverwaltungssystem namentlich genannt und keine Anbindung zugesagt werden,
und eine fertige Standardanbindung existiert nicht. Ein Entscheidungsbaum ohne
System­namen verliert genau den Nutzen, der ihn zitierfähig machen würde; einer
mit Namen wäre eine Zusage, die nicht gedeckt ist. Die ehrliche Fassung des
Themas steht bereits als `FAKTEN.keineAnbindung` im Cluster und ist im
Leitfaden übernommen.

**Freigabebedingung:** Antworten auf OWNER-INPUT B1–B3 sowie eine
veröffentlichungsfähige Unterauftragnehmerliste
(`ASSETS-REQUIRED.md` §B2.3).

### Weitere nicht gebaute Seiten

- **Terminbuchung (Praxis):** inhaltlich attraktiv, aber nahe an einer
  Buchungszusage, für die die Anbindungsfrage geklärt sein müsste. Nach B1–B4
  erneut prüfen.
- **Zahnarztpraxis:** offener Wettbewerb, aber ohne dentalspezifische
  Erfahrungsbasis wäre es eine Wortvariante der bestehenden Seiten — genau die
  Massenware, die hier nicht entstehen soll.

## Warum nur eine neue Seite

Erlaubt waren bis zu drei. Zwei der drei aussichtsreichsten Themen hängen an
Freigaben, die niemand in dieser Sitzung erteilen kann, und die dritte Seite
wäre ohne eigene Erfahrungsgrundlage austauschbar gewesen. Eine Seite, die
trägt, ist mehr wert als drei, von denen zwei zurückgenommen werden müssen.

## Anmerkung zur Linkstruktur der Experimente

Die neue Seite setzt **keinen** Verweis auf eine der sechs eingefrorenen
Routen — auch nicht beim Thema Kosten, wo er inhaltlich naheliegend wäre.

Ehrlichkeitshalber festgehalten: Die neue Seite rendert den globalen Footer,
und der verlinkt jede der sechs Routen einmal. Das gilt für jede Seite der
Website; den Footer auf einer einzelnen Seite zu unterdrücken wäre der größere
Eingriff. Die im Test überwachte Kennzahl — wie oft im Quelltext auf eine
geschützte Route verwiesen wird — bleibt unverändert.

## Zahlen, die von Wettbewerbern kursieren und hier nicht verwendet werden

Bei der Recherche wiederholt aufgetaucht, jeweils ohne auffindbaren Beleg:
„über 120.000 deutsche Unternehmen nutzen KI-Telefonassistenten", „bis zu 30 %
der Terminanfragen gehen verloren", „entlastet die Anmeldung um bis zu 90 %",
„über 70 % der Patienten suchen online nach einem Arzt". Dazu widersprüchliche
Nutzerzahlen eines Anbieters in verschiedenen Quellen.

Keine dieser Zahlen steht auf einer Cogniiq-Seite und keine gehört dorthin. Sie
sind hier notiert, damit sie bei einer späteren Runde nicht versehentlich aus
einer Wettbewerbsseite übernommen werden.
