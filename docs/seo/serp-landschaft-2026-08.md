# SERP-Landschaft: KI-Telefonassistent (Recherchestand 2026-08-30)

⚠️ Verifikationsstatus: siehe `VERIFIKATION.md`. Domains und Seitentypen sind
belastbar, **Positionen nicht**. Keine der genannten Wettbewerberzahlen ist geprüft.

## Ausgangslage Cogniiq

Zwei URLs tauchten in der Recherche auf, beide nur bei markennaher Suche:
`/bayreuth/ki-telefonassistent` und `/verpasste-anrufe-verlust`.

**Damit ist die wichtigste Diagnose bereits gestellt: Indexierung ist nicht das
Problem.** Die Seiten sind erfasst. Sie haben nur keine Wettbewerbsposition bei
nicht-markenbezogenen Suchanfragen. Weitere technische Crawlbarkeits-Arbeit
adressiert einen Engpass, der nicht besteht.

## Wer das Feld besetzt

| Cluster | Wer dort auftaucht | Seitentyp |
|---|---|---|
| KI Telefonassistent (Head) | Placetel (Telekom), IONOS, Doctolib, tenios, cituro, emvion, digital-affin | ~50/50 Hersteller-LP und redaktionelle „TOP-N Anbieter 2026" |
| … Arztpraxis | fonio.ai, Doctolib, docmedico, 321med, medizinio, praxisconcierge, abrechnungsstelle (Verzeichnis) | Hersteller-LP + zwei vertikale Vergleichsportale + ein Verzeichnis |
| … Zahnarzt | fonio, dr-flex, safina, ordicall, helmke-digital, `zahnarzt-telefonbot.de` (EMD), Spitta Dentalwelt | dünn und fragmentiert |
| … PVS-Integration | dr-flex (drei URLs = echtes Silo), praxisconcierge, doctago, praxisvoice | technisch-evaluative Herstellerseiten |
| … Kosten/Preise | chatarmin, fonio, zeeg, lexdial, speakki, vokaro, Placetel | fast ausschließlich Hersteller-Blogs |
| … DSGVO | sinalis, one100, hey-listen, praxisansatz, adfera, 321med | Checklisten-Prosa |
| … Vergleich/Anbieter | Placetel, superchat, smao, buzzard-ai, voice-one, ruflab | Hersteller, die sich selbst zum Sieger küren |
| … Terminbuchung | meetergo, smao, telfo, ruflab — **plus zwei Doctolib-Zendesk-Hilfeartikel** | gemischt |

## Fünf Gründe, warum Cogniiq nicht rankt

1. **Domain- und Entitätsautorität.** Beim Head-Term konkurriert man gegen
   Telekom-Tochter, IONOS und Doctolib. Das ist mit On-Page-Arbeit nicht
   aufzuholen. **Der Head-Term ist kein realistisches Ziel und sollte als solches
   aufgegeben werden.**

2. **Falscher Seitentyp.** Google liefert bei kommerziellen Anfragen *Vergleiche
   und Verzeichnisse*, bei Funktionsanfragen *operative Dokumentation* — die
   Doctolib-**Hilfeartikel** ranken bei „Terminbuchung". Cogniiq bringt
   Hersteller-Landingpages. Das ist die falsche Form für die Anfrage.

3. **Keine Bestätigung durch Dritte.** Wettbewerber haben Verzeichniseinträge,
   Fachpresse-Erwähnungen, Auszeichnungen. Cogniiq hat davon nichts. In einem
   medizinnahen Umfeld ist das die Obergrenze — Googles eigene Leitlinien fragen
   ausdrücklich, *wer* einen Inhalt verantwortet.

4. **Positionierungsverdünnung.** „AI-Agentur + Webdesign + KI-Automatisierung +
   Bayreuth" in einem Markensignal heißt: kein Cluster ist stark. Die
   Wettbewerber, die im medizinischen Segment ranken, machen *eine* Sache.
   Der Homepage-Title trägt drei Positionierungsansprüche gleichzeitig.

5. **Pflegefrequenz.** Jede rankende kommerzielle Seite trägt „2026" im Titel und
   wird sichtbar nachdatiert. Dieses Umfeld belohnt gepflegte Seiten. Eine
   einmal veröffentlichte Seite fällt binnen Monaten heraus.

## Konsequenz

Der größte verbleibende Engpass ist **externe Autorität und Positionierung**,
nicht Technik und nicht Textmenge. Siehe `authority-acquisition-plan.md`.


---

## Nachtrag 2026-09-05 — zweite Recherche, gleiche Einschränkung

Recherche am 2026-09-05 über eine Websuche mit US-Lokalisierung. **Keine
Seite konnte geöffnet werden** (Egress-Policy blockierte jede getestete
Domain, darunter kbv.de, gesetze-im-internet.de, eur-lex.europa.eu,
developers.google.com, redmedical.de, medatixx.de, fonio.ai). Es gilt
`VERIFIKATION.md` unverändert: Domains und Seitentypen belastbar, Positionen
nicht, Inhalte fremder Seiten nicht.

Zwölf Anfragen wurden geprüft; cogniiq.de erschien in keinem der 18
Ergebnissätze.

| Anfrage | Seitentypen | Einschätzung |
|---|---|---|
| KI Telefonassistent Zahnarztpraxis | 5 Hersteller-LP (fonio, Doctolib, Dr. Flex, Ordicall, Safina), 2 Vergleich (medizinio, abrechnungsstelle), 1 Fachpresse (Spitta Dentalwelt) | keine operative Seite; **gewählt** |
| Telefonassistent Zahnarztpraxis Erfahrungen | Hersteller-Vergleiche und -Blogs | leer, aber ohne Kundenfreigabe **blockiert** |
| Zahnarztpraxis Telefon entlasten | Hersteller-LP, generische Praxis-Tipps (med2day) | operative Lücke; über A3 mit abgedeckt |
| Recall Zahnarztpraxis Telefon | ZWP (Recht), Recall-Anbieter, Callcenter | Outbound-Recall wird nicht angeboten; nur Inbound-Aspekt in A3 |
| KI Telefonassistent Arztpraxis einführen Checkliste | Hersteller-Blogs, u. a. one100 „erste 7 Tage" | vom bestehenden Leitfaden A1 abgedeckt |
| KI Telefonassistent testen vor Go-live | generische Vergleichsseiten | vom Leitfaden A1 (Prüfgruppen) abgedeckt; keine eigene Seite |
| … Datenschutz § 203 StGB | 8 von 9 Hersteller-Rechtsratgeber | gesättigt, Primärquellen nicht öffenbar → **blockiert** |
| … PVS Anbindung Schnittstelle | Dr. Flex (drei URLs), Vergleiche, tomedo-Forum | **blockiert** (Belege, OWNER-INPUT B) |
| … Terminabsage Arztpraxis | viele kleine Hersteller-Blogs, ein Doctolib-Hilfeartikel | als Abschnitt in A3 aufgenommen |
| Montagmorgen Anmeldung überlastet | Agentur- und Herstellerblogs | Problemseite `/verpasste-anrufe-verlust` besteht; nicht verfolgt |
| … Grenzen / was kann er nicht | Hersteller-Blogs, Ärzteblatt-Meldung | kein Hersteller listet konkret; in A3 und auf Produktseite abgedeckt |
| Telefonassistent Physiotherapie | physiospezialisierte Anbieter, zwei Vergleichsportale | außerhalb der Positionierung |

Wettbewerberzahlen aus Snippets („74 % vollautomatisiert", „12 % → unter 3 %
No-Shows", „80–120 Anrufe/Tag") sind **nicht** verwendbar.

Quellen-Ledger (nur Snippet, Seite nicht geöffnet, 2026-09-05): fonio.ai,
info.doctolib.de, dr-flex.de, safina.ai, ordicall.ai, praxisping.de,
helmke-digital.com, foxifai.com, vokaro.net, telfo.ai, voice-one.ai,
medizinio.de, abrechnungsstelle.com, praxisconcierge.de, drwait.de,
med2day.com, dentalwelt.spitta.de, zwp-online.info, one100.ai,
aerzteblatt.de, doctolib.zendesk.com, forum.tomedo.de.
