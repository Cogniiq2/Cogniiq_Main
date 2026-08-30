# PVS-Integration bei KI-Telefonassistenten — Recherchestand

⚠️ **Alle Herstellerangaben unten sind UNGEPRÜFT.** Sie stammen aus Suchsnippets,
nicht aus gelesenen Dokumenten. Siehe `VERIFIKATION.md`. Dieses Dokument ist die
Grundlage für eine spätere Verifikation, **nicht** die Grundlage für eine
Veröffentlichung.

## Warum das die stärkste inhaltliche Chance ist

Im Cluster „PVS-Integration" ist das Unterscheidungsmerkmal, das offenbar rankt,
eine **konkrete Zahl angebundener Systeme**: „27+ PVS", „50+
Patientenverwaltungssysteme", teils mit namentlicher Nennung (tomedo, T2Med,
medatixx, Duria, Medistar).

Mehrere dieser Seiten formulieren sinngemäß, die gängigen PVS ließen sich
„nahtlos über HL7/FHIR" anbinden.

**Nach dem Recherchestand ist das mindestens eine starke Vereinfachung.** Es gibt
offenbar keine allgemeine, öffentlich dokumentierte, schreibfähige Termin-API über
die deutsche PVS-Landschaft hinweg. Die Zugangswege sind einzeln, gestaffelt und
überwiegend gated.

Genau hier liegt die Chance: **die einzige sachlich korrekte Seite im Cluster zu
sein.** Das ist nicht durch Umschreiben fremder Texte reproduzierbar — ein
Wettbewerber müsste dieselbe Arbeit leisten. Und es entspricht exakt dem, was
Google unter „original information, reporting or analysis" versteht.

## Die Unterscheidung, die keine gefundene Seite trifft

Drei Dinge werden im Wettbewerbsumfeld vermengt, die nichts miteinander zu tun haben:

| Mechanismus | Was es ist | Für Terminbuchung geeignet? |
|---|---|---|
| **GDT / LDT / BDT** | dateibasierte, lokale Geräte- und Laborschnittstellen | nein — kein Terminmodell |
| **FHIR über Hersteller-Hub** | moderne API, aber akkreditierungspflichtig | ggf. ja, pro Hersteller zu klären |
| **KBV §371 SGB V (AWS/VOS)** | gesetzliche Archiv-, Wechsel- und Verordnungsschnittstellen | **nein** — Archivierung/Systemwechsel/Verordnungsdaten, ausdrücklich keine Echtzeit-Terminintegration |

> Wer §371 als Beleg für Terminbuchungs-Integration anführt, liegt falsch.
> Diese Klarstellung allein trägt eine Seite.

## Rechercheergebnis pro System — ALLES ZU PRÜFEN

| System | Zugangsweg (unbestätigt) | Zu prüfen |
|---|---|---|
| RED Medical | scheinbar einziger mit **öffentlicher** API-Doku (Interchange API, FHIR-basiert); nennt externe Terminbuchung als Anwendungsfall | Existiert ein schreibfähiger Termin-Endpunkt? |
| medatixx (x.concept, easymed) | HealthHub, FHIR, **akkreditierte Partner**, Spezifikation nicht offen publiziert | Akkreditierungsprozess, Aufwand, Kosten, Terminumfang |
| tomedo / zollsoft | `tomedo.API` existiert, Zugang über Antrag, offenbar Warteliste | Termin-Schreibrechte? Wartezeit? |
| CGM (TURBOMED, ALBIS, M1, MEDISTAR) | kein öffentlicher deutscher Entwickler-Zugang gefunden; Weg ist GDT — passwortgeschützt über Partner | Gibt es einen nicht-öffentlichen Partner-Weg? |
| Doctolib | kein offizieller öffentlicher Partner-Zugang gefunden; betreibt **eigenen** KI-Telefonassistenten | **Wettbewerber, nicht Integrationsziel** |
| samedi | API laut Snippet vorhanden, kein öffentliches Entwicklerportal gefunden | Doku beschaffen |
| Duria | GDT/LDT bestätigt; Web-Anbindung offenbar über proprietäre Partnerlösung | Ist das ein offener Weg? |

⚠️ **Nicht verwechseln:** CGM betreibt in den USA eine öffentliche FHIR-API
(ONC-Vorgabe, andere Produktlinie). Sie sagt **nichts** über TurboMed/Albis/M1/
Medistar in Deutschland aus.

## Empfohlenes Vorgehen (braucht Netzzugang oder Herstellerkontakt)

1. Für jedes System: offizielle Doku öffnen, Abrufdatum notieren, Screenshot/PDF ablegen.
2. Genau eine Frage beantworten: **Kann ein externes System einen Termin anlegen,
   verschieben und stornieren — und unter welcher Bedingung?**
3. Ergebnis in vier ehrliche Kategorien:
   Vollautomatisierung möglich · Teilautomatisierung · strukturierte Übergabe ·
   Herstellerklärung nötig.
4. Jede Zeile mit „geprüft am" versehen. Ungeprüfte Zeilen bleiben ungeprüft
   ausgewiesen — das ist der Vertrauensvorteil, nicht der Makel.

**Niemals** darstellen, Cogniiq unterstütze ein bestimmtes PVS, solange das nicht
in einer realen Installation belegt ist.
