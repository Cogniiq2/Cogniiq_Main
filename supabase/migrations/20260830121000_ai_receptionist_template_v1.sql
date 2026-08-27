-- =============================================================================
-- Seed: "AI Receptionist — Healthcare", template version 1.
--
-- Pure template CONTENT. It creates no customer, references no customer id, and
-- touches no engagement: running it can never mutate a client's running
-- onboarding, because engagements snapshot their tasks and fields at
-- instantiation time (see owner_instantiate_service_engagement).
--
-- Deterministic and re-runnable: the template is keyed on (code, version) and
-- every section/task/field is keyed on (template_id, code), so a second run
-- updates the definition in place instead of duplicating it. sort_order is
-- derived from the trailing number of each code, so the ordering is a property
-- of the data rather than of the insert order.
--
-- Healthcare-specific rows are marked healthcare_only and simply do not apply to
-- a non-healthcare engagement — nothing here asserts that every project needs a
-- DSFA, an Art. 9 basis or a § 203 assessment. The assessment RESULT is a field
-- the owner fills in.
-- =============================================================================

begin;

do $seed$
declare v_template uuid;
begin

insert into public.owner_service_templates (service_key, code, version, title, description, is_active)
values ('ai_receptionist', 'ai_receptionist_healthcare', 1,
        'AI Receptionist — Healthcare',
        'Vollständiges internes Onboarding für einen KI-Telefonassistenten, inklusive Datenschutz-, Integrations-, Test- und Go-Live-Gates. Gesundheitsspezifische Schritte greifen nur, wenn das Projekt als Healthcare markiert ist.',
        true)
on conflict (code, version) do update
  set title = excluded.title, description = excluded.description, updated_at = now()
returning id into v_template;

-- ---------------------------------------------------------------------------
-- Sections. 20 operational phases folded into 9 navigation areas so the
-- workspace never becomes 20 tiny tabs.
-- ---------------------------------------------------------------------------
insert into public.owner_service_template_sections
  (template_id, code, title, description, nav_group, readiness_category, healthcare_only, sort_order)
select v_template, s.code, s.title, nullif(s.description, ''), s.nav_group, s.readiness_category, s.healthcare_only, s.sort_order
from (values
  ('commercial',    'Vertrag & Kommerzielles',      'Vertragliche Grundlage und freigegebener Leistungsumfang.',                 'overview',    'commercial',      false,  10),
  ('profile',       'Kundenprofil & Kontakte',      'Wer der Kunde ist und wer wofür zuständig ist.',                             'discovery',   'discovery',       false,  20),
  ('scope',         'Funktionsumfang des Agenten',  'Welche Fähigkeiten der Assistent übernehmen darf.',                          'discovery',   'discovery',       false,  30),
  ('workflow',      'Terminarten & Buchungslogik',  'Terminarten, Regeln, Notfall- und Randzeitenverhalten.',                     'discovery',   'discovery',       false,  40),
  ('identity',      'Identifikation & Eskalation',  'Wie Anrufer identifiziert werden und wann an Menschen übergeben wird.',      'discovery',   'discovery',       false,  50),
  ('legal',         'Recht & Datenschutz',          'Interne Compliance-Checkliste. Ersetzt keine Rechtsberatung.',               'compliance',  'legal',           false,  60),
  ('privacy_infra', 'Datenschutz-Infrastruktur',    'Verarbeitungsorte, Aufbewahrung und Verschlüsselung der Produktivumgebung.', 'compliance',  'legal',           false,  70),
  ('software',      'Bestandssysteme',              'Welche Software der Kunde heute einsetzt.',                                  'integration', 'integration',     false,  80),
  ('integration',   'Integrationsfähigkeit',        'Schnittstelle, Freigaben und die ehrliche Einordnung Voll/Teil.',            'integration', 'integration',     false,  90),
  ('knowledge',     'Wissensdatenbank',             'Freigegebene Wissensquellen und deren Prüfung.',                             'agent',       'knowledge',       false, 100),
  ('agent',         'Golden Agent & ElevenLabs',    'Klon des Golden Agents, Overlay und Sprachkonfiguration.',                   'agent',       'agent',           false, 110),
  ('backend',       'Backend & n8n',                'Mandant, Adapter, Werkzeuge und Validierung der Schreiboperationen.',        'integration', 'backend',         false, 120),
  ('telephony',     'Telefonie & Failover',         'Rufnummern, Routing und die Ausfallwege.',                                   'telephony',   'telephony',       false, 130),
  ('testing',       'Testsuite',                    'Fachliche, sicherheitsbezogene, sprachliche und sicherheitskritische Fälle.','testing',     'testing',         false, 140),
  ('performance',   'Performance-Messwerte',        'Optional, bis echte Messungen vorliegen. Keine Schätzwerte eintragen.',      'testing',     'testing',         false, 150),
  ('uat',           'Kundenabnahme (UAT)',          'Tests durch den Kunden und die dokumentierten Freigaben.',                   'testing',     'client_approval', false, 160),
  ('golive',        'Go-Live-Freigabe',             'Das Freigabe-Gate. Produktivsetzung bleibt gesperrt, solange Blocker offen sind.', 'golive', 'commercial',      false, 170),
  ('deployment',    'Produktivsetzung',             'Der eigentliche Produktivgang und die Bestätigung des Kunden.',              'golive',      'commercial',      false, 180),
  ('monitoring',    'Monitoring erste Woche',       'Engmaschige Beobachtung nach dem Start.',                                    'monitoring',  'testing',         false, 190),
  ('maintenance',   'Laufende Wartung',             'Wiederkehrende monatliche und quartalsweise Reviews.',                       'monitoring',  'testing',         false, 200)
) as s(code, title, description, nav_group, readiness_category, healthcare_only, sort_order)
on conflict (template_id, code) do update set
  title = excluded.title, description = excluded.description, nav_group = excluded.nav_group,
  readiness_category = excluded.readiness_category, healthcare_only = excluded.healthcare_only,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Structured fields (DATA, not tasks). sort_order comes from the code suffix.
-- ---------------------------------------------------------------------------
insert into public.owner_service_template_fields
  (template_id, section_id, code, label, description, data_type, options, unit, placeholder,
   is_required, is_go_live_blocker, healthcare_only, sort_order)
select v_template, (select sec.id from public.owner_service_template_sections sec
        where sec.template_id = v_template and sec.code = f.section_code), f.code, f.label, nullif(f.description, ''), f.data_type,
       f.options::jsonb, nullif(f.unit, ''), nullif(f.placeholder, ''),
       f.is_required, f.is_blocker, f.healthcare_only,
       (substring(f.code from '[0-9]+$'))::int
from (values
  -- Commercial ------------------------------------------------------------
  ('commercial','COM-F001','Vertrag unterzeichnet am','','date','[]','','',false,false,false),
  ('commercial','COM-F002','Kommerzielle Notiz','Konditionen, Laufzeit, Besonderheiten.','textarea','[]','','',false,false,false),
  -- Profile ---------------------------------------------------------------
  ('profile','PRO-F001','Rechtliche Firmierung','','text','[]','','z. B. Beispielpraxis GmbH',true,false,false),
  ('profile','PRO-F002','Hauptansprechpartner','','text','[]','','',true,false,false),
  ('profile','PRO-F003','Technischer Ansprechpartner','','text','[]','','',true,false,false),
  ('profile','PRO-F004','Ansprechpartner Rechnung','','text','[]','','',false,false,false),
  ('profile','PRO-F005','Datenschutzbeauftragte/r','','text','[]','','',false,false,false),
  ('profile','PRO-F006','Branche','','text','[]','','',true,false,false),
  ('profile','PRO-F007','Standorte','Ein Standort pro Zeile, mit Adresse.','textarea','[]','','',true,false,false),
  ('profile','PRO-F008','Aktuelle Rufnummern','','textarea','[]','','',true,false,false),
  ('profile','PRO-F009','Website','','url','[]','','https://',false,false,false),
  ('profile','PRO-F010','Zeitzone','','select','[{"value":"Europe/Berlin","label":"Europe/Berlin"},{"value":"Europe/Vienna","label":"Europe/Vienna"},{"value":"Europe/Zurich","label":"Europe/Zurich"}]','','',true,false,false),
  ('profile','PRO-F011','Benötigte Sprachen','','text','[]','','z. B. Deutsch, Englisch',true,false,false),
  -- Scope: the capability catalogue -----------------------------------------
  ('scope','SCO-F001','FAQ beantworten','','boolean','[]','','',false,false,false),
  ('scope','SCO-F002','Öffnungszeiten nennen','','boolean','[]','','',false,false,false),
  ('scope','SCO-F003','Anfahrt & Parken erklären','','boolean','[]','','',false,false,false),
  ('scope','SCO-F004','Terminverfügbarkeit nennen','','boolean','[]','','',false,false,false),
  ('scope','SCO-F005','Termin anlegen','','boolean','[]','','',false,false,false),
  ('scope','SCO-F006','Termin finden','','boolean','[]','','',false,false,false),
  ('scope','SCO-F007','Termin verschieben','','boolean','[]','','',false,false,false),
  ('scope','SCO-F008','Termin stornieren','','boolean','[]','','',false,false,false),
  ('scope','SCO-F009','Patienten-/Kundensuche','','boolean','[]','','',false,false,false),
  ('scope','SCO-F010','Rückruf anlegen','','boolean','[]','','',false,false,false),
  ('scope','SCO-F011','SMS-Bestätigung','','boolean','[]','','',false,false,false),
  ('scope','SCO-F012','E-Mail-Bestätigung','','boolean','[]','','',false,false,false),
  ('scope','SCO-F013','Weiterleitung an Menschen','','boolean','[]','','',false,false,false),
  ('scope','SCO-F014','Ausgehende Anrufe','','boolean','[]','','',false,false,false),
  ('scope','SCO-F015','Erinnerungen / Recall','','boolean','[]','','',false,false,false),
  ('scope','SCO-F016','Weitere Abläufe','','textarea','[]','','',false,false,false),
  -- Workflow ---------------------------------------------------------------
  ('workflow','WFL-F001','Standard-Buchungshorizont','Wie weit im Voraus gebucht werden darf.','number','[]','Tage','',false,false,false),
  ('workflow','WFL-F002','Grenze medizinischer Auskunft','Was der Assistent ausdrücklich NICHT beantworten darf.','textarea','[]','','',true,false,true),
  ('workflow','WFL-F003','Verbotene Themen','','textarea','[]','','',true,false,false),
  ('workflow','WFL-F004','Notfallprozedur','Wortlaut und Ablauf im Notfall.','textarea','[]','','',true,true,false),
  ('workflow','WFL-F005','Ablauf außerhalb der Öffnungszeiten','','textarea','[]','','',true,false,false),
  -- Identity ---------------------------------------------------------------
  ('identity','IDN-F001','Identifikation: Buchung','','textarea','[]','','',true,false,false),
  ('identity','IDN-F002','Identifikation: Termin finden','','textarea','[]','','',true,false,false),
  ('identity','IDN-F003','Identifikation: Umbuchung','','textarea','[]','','',true,false,false),
  ('identity','IDN-F004','Identifikation: Stornierung','','textarea','[]','','',true,false,false),
  ('identity','IDN-F005','Identifikation: Zugriff auf Kundendaten','Rufnummernanzeige allein gilt nie als Identitätsnachweis.','textarea','[]','','',true,true,false),
  ('identity','IDN-F006','Rufnummer Empfang','','phone','[]','','',true,false,false),
  ('identity','IDN-F007','Rufnummer medizinische Weiterleitung','','phone','[]','','',false,false,true),
  ('identity','IDN-F008','Rufnummer Abrechnung / Verwaltung','','phone','[]','','',false,false,false),
  ('identity','IDN-F009','Weiterleitungszeiten','','text','[]','','z. B. Mo–Fr 08:00–17:00',true,false,false),
  ('identity','IDN-F010','Verhalten bei Nichtannahme','','textarea','[]','','',true,false,false),
  ('identity','IDN-F011','Rückruf-Fallback','','textarea','[]','','',true,false,false),
  ('identity','IDN-F012','Sondereskalation','','textarea','[]','','',false,false,false),
  -- Legal ------------------------------------------------------------------
  ('legal','LEG-F001','Rollen: Verantwortlicher / Auftragsverarbeiter','','textarea','[]','','',true,false,false),
  ('legal','LEG-F002','Rechtsgrundlage','','text','[]','','',true,false,false),
  ('legal','LEG-F003','DSFA-Schwellwertanalyse: Ergebnis','Das Ergebnis der Bewertung — nicht die Annahme, dass immer eine DSFA nötig ist.','select','[{"value":"required","label":"DSFA erforderlich"},{"value":"not_required","label":"DSFA nicht erforderlich"},{"value":"pending","label":"Bewertung offen"}]','','',true,true,false),
  ('legal','LEG-F004','DSFA: Begründung','','textarea','[]','','',false,false,false),
  ('legal','LEG-F005','Gesprächsaufzeichnung aktiv','Für Healthcare-Onboardings ist die bewusste Voreinstellung AUS. Eine Abweichung muss unten begründet werden.','boolean','[]','','',true,false,false),
  ('legal','LEG-F006','Aufzeichnung: dokumentierte Entscheidung','','textarea','[]','','',true,false,false),
  ('legal','LEG-F007','KI-Hinweis: freigegebener Wortlaut','','textarea','[]','','',true,true,false),
  ('legal','LEG-F008','Aufbewahrung & Löschung','','textarea','[]','','',true,false,false),
  ('legal','LEG-F009','§ 203 StGB: Bewertung','','textarea','[]','','',true,false,true),
  ('legal','LEG-F010','Art. 9 DSGVO: Grundlage','','textarea','[]','','',true,true,true),
  -- Privacy infrastructure ---------------------------------------------------
  ('privacy_infra','PRV-F001','ElevenLabs-Umgebung','','select','[{"value":"eu","label":"EU"},{"value":"us","label":"US"},{"value":"other","label":"Andere"}]','','',true,false,false),
  ('privacy_infra','PRV-F002','Zero Retention Mode','','select','[{"value":"enabled","label":"Aktiv"},{"value":"disabled","label":"Inaktiv"},{"value":"not_available","label":"Nicht verfügbar"}]','','',true,false,true),
  ('privacy_infra','PRV-F003','AVV mit ElevenLabs','','select','[{"value":"signed","label":"Unterzeichnet"},{"value":"pending","label":"Offen"},{"value":"not_required","label":"Nicht erforderlich"}]','','',true,true,false),
  ('privacy_infra','PRV-F004','Aufbewahrung PII-Transkripte','','text','[]','','',true,false,false),
  ('privacy_infra','PRV-F005','n8n-Hosting-Standort','','text','[]','','',true,false,false),
  ('privacy_infra','PRV-F006','Datenbank-Standort','','text','[]','','',true,false,false),
  ('privacy_infra','PRV-F007','Cogniiq-API-Standort','','text','[]','','',true,false,false),
  ('privacy_infra','PRV-F008','Telefonie-Route','','text','[]','','',true,false,false),
  ('privacy_infra','PRV-F009','Backup-Standort','','text','[]','','',true,false,false),
  -- Existing software ---------------------------------------------------------
  ('software','SFW-F001','Praxissoftware (PVS)','','text','[]','','',true,false,true),
  ('software','SFW-F002','PVS: exaktes Produkt','','text','[]','','',true,false,true),
  ('software','SFW-F003','PVS: Version','','text','[]','','',true,false,true),
  ('software','SFW-F004','Termin-/Kalendersystem','','text','[]','','',true,false,false),
  ('software','SFW-F005','CRM','','text','[]','','',false,false,false),
  ('software','SFW-F006','Telefonanlage / PBX','','text','[]','','',true,false,false),
  ('software','SFW-F007','SMS-Anbieter','','text','[]','','',false,false,false),
  ('software','SFW-F008','E-Mail-Anbieter','','text','[]','','',false,false,false),
  ('software','SFW-F009','Weitere Systeme','','textarea','[]','','',false,false,false),
  -- Integration ----------------------------------------------------------------
  ('integration','INT-F001','Schnittstellenart','','select','[{"value":"official_api","label":"Offizielle API"},{"value":"fhir","label":"FHIR"},{"value":"hl7","label":"HL7"},{"value":"gdt","label":"GDT"},{"value":"rest_api","label":"REST-API"},{"value":"partner_interface","label":"Offizielle Partnerschnittstelle"},{"value":"middleware","label":"Middleware"},{"value":"none","label":"Keine Schnittstelle verfügbar"}]','','',true,true,false),
  ('integration','INT-F002','Herstellerfreigabe','','select','[{"value":"granted","label":"Erteilt"},{"value":"pending","label":"Offen"},{"value":"refused","label":"Abgelehnt"},{"value":"not_required","label":"Nicht erforderlich"}]','','',true,false,false),
  ('integration','INT-F003','API-Lizenzkosten','','text','[]','','',false,false,false),
  ('integration','INT-F004','Rate Limits','','text','[]','','',false,false,false),
  ('integration','INT-F005','Sandbox verfügbar','','boolean','[]','','',false,false,false),
  ('integration','INT-F006','Notiz zum Integrationsumfang','','textarea','[]','','',false,false,false),
  -- Knowledge base ---------------------------------------------------------------
  ('knowledge','KB-F001','Freigegebene Wissensquellen','Eine Quelle pro Zeile.','textarea','[]','','',true,false,false),
  ('knowledge','KB-F002','Knowledge-Base-ID','','text','[]','','',true,true,false),
  ('knowledge','KB-F003','Zuletzt verifiziert','','date','[]','','',false,false,false),
  ('knowledge','KB-F004','Kundenfreigabe Wissensdatenbank','','select','[{"value":"approved","label":"Freigegeben"},{"value":"pending","label":"Offen"},{"value":"rejected","label":"Abgelehnt"}]','','',true,true,false),
  -- Agent ---------------------------------------------------------------------
  ('agent','AGT-F001','Golden Template','','text','[]','','z. B. COGNIIQ — GOLDEN HEALTHCARE — MASTER',true,false,false),
  ('agent','AGT-F002','Golden Template Version','','text','[]','','',true,false,false),
  ('agent','AGT-F003','Agentenname des Kunden','','text','[]','','z. B. COGNIIQ — BEISPIELPRAXIS — PROD',true,false,false),
  ('agent','AGT-F004','ElevenLabs Agent-ID','','text','[]','','',true,true,false),
  ('agent','AGT-F005','Umgebung','','select','[{"value":"production","label":"Produktion"},{"value":"staging","label":"Staging"}]','','',true,false,false),
  ('agent','AGT-F006','Stimme','','text','[]','','',true,false,false),
  ('agent','AGT-F007','Sprache','','text','[]','','',true,false,false),
  ('agent','AGT-F008','Telefon-/SIP-Zuordnung','','text','[]','','',true,false,false),
  ('agent','AGT-F009','Agentenzustand','','select','[{"value":"draft","label":"Entwurf"},{"value":"configured","label":"Konfiguriert"},{"value":"verified","label":"Verifiziert"}]','','',true,false,false),
  ('agent','AGT-F010','Zuletzt verifiziert','','date','[]','','',false,false,false),
  ('agent','AGT-F011','Overlay: Geschäftsname','','text','[]','','',true,false,false),
  ('agent','AGT-F012','Overlay: Begrüßungssatz','','textarea','[]','','',true,false,false),
  ('agent','AGT-F013','Overlay: Aussprache & ASR-Stichwörter','Namen, Straßen und Fachbegriffe, die der Erkennung Probleme bereiten.','textarea','[]','','',false,false,false),
  -- Backend -------------------------------------------------------------------
  ('backend','BCK-F001','Mandanten-ID','','text','[]','','',true,false,false),
  ('backend','BCK-F002','Agent-ID → Mandanten-Zuordnung','','text','[]','','',true,false,false),
  ('backend','BCK-F003','Adaptertyp','','text','[]','','',true,false,false),
  ('backend','BCK-F004','Hersteller / API','','text','[]','','',false,false,false),
  ('backend','BCK-F005','Workflow-IDs','','textarea','[]','','',true,false,false),
  ('backend','BCK-F006','Umgebung','','select','[{"value":"production","label":"Produktion"},{"value":"staging","label":"Staging"}]','','',true,false,false),
  ('backend','BCK-F007','Status der Zugangsdaten','Nur der STATUS wird gespeichert. Zugangsdaten selbst gehören niemals in dieses Feld.','select','[{"value":"not_configured","label":"Nicht hinterlegt"},{"value":"configured","label":"Hinterlegt"},{"value":"verified","label":"Verifiziert"},{"value":"rotation_due","label":"Rotation fällig"}]','','',true,true,false),
  ('backend','BCK-F008','Verfügbare Werkzeuge','','textarea','[]','','',true,false,false),
  ('backend','BCK-F009','Letzte Validierung','','date','[]','','',false,false,false),
  -- Telephony -----------------------------------------------------------------
  ('telephony','TEL-F001','Bestehende Rufnummer','','phone','[]','','',true,false,false),
  ('telephony','TEL-F002','Telefonieanbieter','','text','[]','','',true,false,false),
  ('telephony','TEL-F003','PBX-System','','text','[]','','',false,false,false),
  ('telephony','TEL-F004','SIP-Konfiguration','','select','[{"value":"not_started","label":"Nicht begonnen"},{"value":"configured","label":"Konfiguriert"},{"value":"verified","label":"Verifiziert"}]','','',true,false,false),
  ('telephony','TEL-F005','Eingehende Route','','text','[]','','',true,false,false),
  ('telephony','TEL-F006','Ausgehende Route','','text','[]','','',false,false,false),
  ('telephony','TEL-F007','Caller ID','','text','[]','','',false,false,false),
  ('telephony','TEL-F008','Weiterleitungsnummern','','textarea','[]','','',true,false,false),
  ('telephony','TEL-F009','Failover-Ziel','Wohin Anrufe laufen, wenn der Assistent nicht erreichbar ist.','text','[]','','',true,true,false),
  -- Performance (optional until measured; never pre-filled) ---------------------
  ('performance','PRF-F001','Antwortzeit P50','','number','[]','ms','',false,false,false),
  ('performance','PRF-F002','Antwortzeit P95','','number','[]','ms','',false,false,false),
  ('performance','PRF-F003','Tool-Zeit P50','','number','[]','ms','',false,false,false),
  ('performance','PRF-F004','Tool-Zeit P95','','number','[]','ms','',false,false,false),
  ('performance','PRF-F005','Dauer bis abgeschlossene Buchung','','number','[]','s','',false,false,false),
  ('performance','PRF-F006','Tool-Erfolgsquote','','number','[]','%','',false,false,false),
  ('performance','PRF-F007','Quote falscher Erfolgsmeldungen','','number','[]','%','',false,false,false),
  ('performance','PRF-F008','Doppelbuchungsquote','','number','[]','%','',false,false,false),
  ('performance','PRF-F009','Mandantenübergreifende Vorfälle','','number','[]','','',false,false,false),
  ('performance','PRF-F010','Erwartete Parallelität','','number','[]','Anrufe','',false,false,false),
  ('performance','PRF-F011','Getestete Parallelität','','number','[]','Anrufe','',false,false,false),
  -- Go-Live gate ----------------------------------------------------------------
  ('golive','GOL-F001','Backup- und Rollback-Plan','Wie innerhalb von Minuten auf den bisherigen Ablauf zurückgeschaltet wird.','textarea','[]','','',true,true,false),
  ('golive','GOL-F002','Produktive Zugangsdaten','Nur der Status. Keine Zugangsdaten in dieses Feld.','select','[{"value":"ready","label":"Bereit"},{"value":"not_ready","label":"Nicht bereit"}]','','',true,true,false),
  -- Deployment -------------------------------------------------------------------
  ('deployment','DEP-F001','Produktive Agent-Version','','text','[]','','',false,false,false),
  ('deployment','DEP-F002','Produktive Wissensdatenbank','','text','[]','','',false,false,false),
  -- Monitoring --------------------------------------------------------------------
  ('monitoring','MON-F001','Kosten pro Minute','','number','[]','EUR','',false,false,false),
  ('monitoring','MON-F002','Monitoring-Notizen','','textarea','[]','','',false,false,false)
) as f(section_code, code, label, description, data_type, options, unit, placeholder, is_required, is_blocker, healthcare_only)
on conflict (template_id, code) do update set
  section_id = excluded.section_id, label = excluded.label, description = excluded.description,
  data_type = excluded.data_type, options = excluded.options, unit = excluded.unit,
  placeholder = excluded.placeholder, is_required = excluded.is_required,
  is_go_live_blocker = excluded.is_go_live_blocker, healthcare_only = excluded.healthcare_only,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Tasks (ACTIONS, not data).
-- ---------------------------------------------------------------------------
insert into public.owner_service_template_tasks
  (template_id, section_id, code, title, description, is_required, is_go_live_blocker, healthcare_only, sort_order)
select v_template, (select sec.id from public.owner_service_template_sections sec
        where sec.template_id = v_template and sec.code = t.section_code), t.code, t.title, nullif(t.description, ''),
       t.is_required, t.is_blocker, t.healthcare_only,
       (substring(t.code from '[0-9]+$'))::int
from (values
  -- Commercial -----------------------------------------------------------------
  ('commercial','COM-001','Kommerziellen Vertrag unterzeichnet','',true,true,false),
  ('commercial','COM-002','Leistungsumfang vom Kunden freigegeben','Schriftliche Freigabe des vereinbarten Funktionsumfangs.',true,true,false),
  -- Profile --------------------------------------------------------------------
  ('profile','PRO-001','Kundenprofil vollständig erfasst','',true,false,false),
  ('profile','PRO-002','Technischen Ansprechpartner bestätigt','',true,false,false),
  -- Scope ----------------------------------------------------------------------
  ('scope','SCO-001','Funktionsumfang mit Kunde abgestimmt','',true,false,false),
  ('scope','SCO-002','Funktionsumfang schriftlich bestätigt','',true,true,false),
  -- Workflow -------------------------------------------------------------------
  ('workflow','WFL-001','Terminarten vollständig erfasst','Jede buchbare Terminart mit Dauer, Ort und Voraussetzungen.',true,true,false),
  ('workflow','WFL-002','Buchungs-, Umbuchungs- und Stornoregeln definiert','',true,true,false),
  ('workflow','WFL-003','Notfallprozedur definiert und freigegeben','',true,true,false),
  ('workflow','WFL-004','Ablauf außerhalb der Öffnungszeiten definiert','',true,false,false),
  -- Identity -------------------------------------------------------------------
  ('identity','IDN-001','Identifikationsregeln je Vorgang definiert','',true,true,false),
  ('identity','IDN-002','Bestätigt: Rufnummernanzeige gilt nicht als Identitätsnachweis','',true,true,false),
  ('identity','IDN-003','Eskalationsziele und -zeiten festgelegt','',true,true,false),
  -- Legal ----------------------------------------------------------------------
  ('legal','LEG-001','Rollen geklärt (Verantwortlicher / Auftragsverarbeiter)','',true,true,false),
  ('legal','LEG-002','AVV zwischen Kunde und Cogniiq unterzeichnet','',true,true,false),
  ('legal','LEG-003','Unterauftragsverarbeiter geprüft und dokumentiert','',true,true,false),
  ('legal','LEG-004','Rechtsgrundlage bestätigt','',true,true,false),
  ('legal','LEG-005','Art. 9 DSGVO bestätigt (Gesundheitsdaten)','',true,true,true),
  ('legal','LEG-006','§ 203 StGB bewertet','',true,true,true),
  ('legal','LEG-007','Entscheidung zur Gesprächsaufzeichnung dokumentiert','Voreinstellung für Healthcare ist AUS; jede Abweichung braucht eine dokumentierte Begründung.',true,true,false),
  ('legal','LEG-008','KI-Hinweis inhaltlich freigegeben','',true,true,false),
  ('legal','LEG-009','KI-Hinweis im Agenten implementiert','',true,true,false),
  ('legal','LEG-010','DSFA-Schwellwertanalyse durchgeführt und dokumentiert','',true,true,false),
  ('legal','LEG-011','Aufbewahrungs- und Löschkonzept festgelegt','',true,false,false),
  ('legal','LEG-012','Prozess für Betroffenenrechte definiert','',true,false,false),
  ('legal','LEG-013','Incident-Response-Prozess abgestimmt','',true,false,false),
  -- Privacy infrastructure -------------------------------------------------------
  ('privacy_infra','PRV-001','EU-Verarbeitung konfiguriert','',true,true,true),
  ('privacy_infra','PRV-002','Zero Retention Mode geprüft','',true,true,true),
  ('privacy_infra','PRV-003','AVV mit ElevenLabs vorhanden','',true,true,false),
  ('privacy_infra','PRV-004','Webhook-Datenminimierung umgesetzt','',true,false,false),
  ('privacy_infra','PRV-005','Transportverschlüsselung geprüft','',true,false,false),
  ('privacy_infra','PRV-006','Backup-Standort dokumentiert','',true,false,false),
  -- Software ---------------------------------------------------------------------
  ('software','SFW-001','Bestandssysteme vollständig erfasst','',true,false,false),
  ('software','SFW-002','Zugang zur Terminverwaltung geklärt','',true,false,false),
  -- Integration -------------------------------------------------------------------
  ('integration','INT-001','Integrationsart klassifiziert (Voll- oder Teilautomatisierung)','Eine Teilautomatisierung muss ihre exakte Einschränkung benennen. Ein Rückruf-Workaround ist keine Automatisierung.',true,true,false),
  ('integration','INT-002','Herstellerfreigabe eingeholt','',true,false,false),
  ('integration','INT-003','API-Zugang getestet','',true,true,false),
  ('integration','INT-004','Sandbox-/Testumgebung geprüft','',false,false,false),
  ('integration','INT-005','Einschränkungen schriftlich dokumentiert','',true,true,false),
  -- Knowledge base -----------------------------------------------------------------
  ('knowledge','KB-001','Freigegebene Wissensquellen gesammelt','',true,false,false),
  ('knowledge','KB-002','Kunde hat Wissensdatenbank geprüft','',true,true,false),
  ('knowledge','KB-003','Falsche Informationen entfernt','',true,false,false),
  ('knowledge','KB-004','Widersprüche aufgelöst','',true,false,false),
  ('knowledge','KB-005','Dynamische Informationen nicht als statische Fakten hinterlegt','Terminverfügbarkeiten und Patientendaten gehören niemals in die statische Wissensdatenbank.',true,true,false),
  ('knowledge','KB-006','Wissensdatenbank korrekt mit dem Kundenagenten verknüpft','',true,true,false),
  ('knowledge','KB-007','Retrieval getestet','',true,true,false),
  -- Agent -----------------------------------------------------------------------
  ('agent','AGT-001','Golden Agent geklont','',true,false,false),
  ('agent','AGT-002','Agent korrekt umbenannt','',true,false,false),
  ('agent','AGT-003','Agent-ID erfasst','',true,true,false),
  ('agent','AGT-004','Kunden-Overlay konfiguriert','',true,true,false),
  ('agent','AGT-005','Wissensdatenbank angebunden','',true,true,false),
  ('agent','AGT-006','Werkzeuge konfiguriert','',true,true,false),
  ('agent','AGT-007','Umgebung konfiguriert','',true,false,false),
  ('agent','AGT-008','Stimme vom Kunden freigegeben','',true,true,false),
  ('agent','AGT-009','Aussprache und ASR-Stichwörter getestet','',true,false,false),
  -- Backend ----------------------------------------------------------------------
  ('backend','BCK-001','Mandant angelegt und isoliert','',true,true,false),
  ('backend','BCK-002','Adapter ausgewählt und implementiert','',true,true,false),
  ('backend','BCK-003','Zugangsdaten hinterlegt (Status geprüft)','',true,true,false),
  ('backend','BCK-004','Least-Privilege-Rechte geprüft','',true,true,false),
  ('backend','BCK-005','Buchung validiert','',true,true,false),
  ('backend','BCK-006','Umbuchung validiert','',true,false,false),
  ('backend','BCK-007','Stornierung validiert','',true,false,false),
  ('backend','BCK-008','Idempotenz sichergestellt','',true,true,false),
  ('backend','BCK-009','Doppelbuchungsschutz geprüft','',true,true,false),
  ('backend','BCK-010','Fehlernormalisierung implementiert','',true,false,false),
  ('backend','BCK-011','Logging auf personenbezogene Daten geprüft','',true,false,false),
  -- Telephony ----------------------------------------------------------------------
  ('telephony','TEL-001','Rufnummer konfiguriert','',true,true,false),
  ('telephony','TEL-002','Routing konfiguriert','',true,true,false),
  ('telephony','TEL-003','TLS verifiziert','',true,false,false),
  ('telephony','TEL-004','Medienverschlüsselung verifiziert','',true,false,false),
  ('telephony','TEL-005','Authentifizierung konfiguriert','',true,false,false),
  ('telephony','TEL-006','Ausfallroute bei ElevenLabs-Störung','',true,true,false),
  ('telephony','TEL-007','Ausfallroute bei Cogniiq-Backend-Störung','',true,true,false),
  ('telephony','TEL-008','Ausfallroute bei Internet-/SIP-Störung','',true,true,false),
  ('telephony','TEL-009','Menschlicher Fallback','',true,true,false),
  ('telephony','TEL-010','Fallback außerhalb der Öffnungszeiten','',true,false,false),
  ('telephony','TEL-011','Failover getestet','',true,true,false),
  -- Testing: core call flows ---------------------------------------------------------
  ('testing','TST-001','FAQ beantwortet','',true,false,false),
  ('testing','TST-002','Termin gebucht','',true,true,false),
  ('testing','TST-003','Keine freien Termine','',true,false,false),
  ('testing','TST-004','Neuer Patient','',true,false,false),
  ('testing','TST-005','Bestandspatient','',true,false,false),
  ('testing','TST-006','Termin gefunden','',true,false,false),
  ('testing','TST-007','Termin verschoben','',true,true,false),
  ('testing','TST-008','Termin storniert','',true,true,false),
  ('testing','TST-009','Doppelbuchung abgewiesen','',true,true,false),
  ('testing','TST-010','Slot verschwindet während des Gesprächs','',true,true,false),
  ('testing','TST-011','Backend-Timeout','',true,true,false),
  ('testing','TST-012','Backend-Fehler','',true,true,false),
  ('testing','TST-013','n8n nicht erreichbar','',true,true,false),
  ('testing','TST-014','Weiterleitung an Menschen','',true,true,false),
  ('testing','TST-015','Weiterleitung nicht verfügbar','',true,true,false),
  -- Testing: identity & security -------------------------------------------------------
  ('testing','TST-016','Korrekter Patient erkannt','',true,true,false),
  ('testing','TST-017','Falsches Geburtsdatum abgewiesen','',true,true,false),
  ('testing','TST-018','Namensgleichheit korrekt behandelt','',true,true,false),
  ('testing','TST-019','Abweichende / gefälschte Rufnummernanzeige','',true,true,false),
  ('testing','TST-020','Zugriffsversuch auf fremde Patientendaten abgewehrt','',true,true,false),
  ('testing','TST-021','Auskunft ohne Berechtigung verweigert','',true,true,false),
  ('testing','TST-022','Mandantenübergreifender Zugriff ausgeschlossen','',true,true,false),
  ('testing','TST-023','Keine Preisgabe interner IDs oder Secrets','',true,true,false),
  ('testing','TST-024','Prompt Injection abgewehrt','',true,true,false),
  -- Testing: German voice quality --------------------------------------------------------
  ('testing','TST-025','Namen korrekt verstanden','',true,false,false),
  ('testing','TST-026','Schwierige Nachnamen','',true,false,false),
  ('testing','TST-027','Arztnamen','',true,false,false),
  ('testing','TST-028','Straßennamen','',true,false,false),
  ('testing','TST-029','Telefonnummern','',true,false,false),
  ('testing','TST-030','Geburtsdaten','',true,false,false),
  ('testing','TST-031','Datumsangaben','',true,false,false),
  ('testing','TST-032','Uhrzeiten','',true,false,false),
  ('testing','TST-033','Langsamer Sprecher','',true,false,false),
  ('testing','TST-034','Älterer Anrufer','',true,false,false),
  ('testing','TST-035','Anrufer mit Akzent','',true,false,false),
  ('testing','TST-036','Hintergrundgeräusche','',true,false,false),
  ('testing','TST-037','Unterbrechungen','',true,false,false),
  ('testing','TST-038','Stille im Gespräch','',true,false,false),
  ('testing','TST-039','Anrufer ändert seine Meinung','',true,false,false),
  -- Testing: safety -----------------------------------------------------------------------
  ('testing','TST-040','Medizinische Frage korrekt abgelehnt','',true,true,false),
  ('testing','TST-041','Individuelle medizinische Beurteilung verweigert','',true,true,false),
  ('testing','TST-042','Notfall korrekt behandelt','',true,true,false),
  ('testing','TST-043','Verärgerter Anrufer','',true,false,false),
  ('testing','TST-044','Verwirrter oder vulnerabler Anrufer','',true,true,false),
  ('testing','TST-045','Ausdrücklicher Wunsch nach einem Menschen','',true,true,false),
  ('testing','TST-046','Korrektes Eskalationsverhalten insgesamt','',true,true,false),
  -- Performance (optional until measured) ------------------------------------------------
  ('performance','PRF-001','Latenzmessung durchgeführt','Erst ausfüllen, wenn echte Messwerte vorliegen.',false,false,false),
  ('performance','PRF-002','Lasttest durchgeführt','',false,false,false),
  -- UAT ------------------------------------------------------------------------------------
  ('uat','UAT-001','Testnummer an den Kunden übergeben','',true,false,false),
  ('uat','UAT-002','Kunde hat Testanrufe durchgeführt','',true,false,false),
  ('uat','UAT-003','Empfangsteam hat getestet','',true,false,false),
  ('uat','UAT-004','Inhaber oder Leitung hat getestet','',true,false,false),
  ('uat','UAT-005','Feedback erhalten','',true,false,false),
  ('uat','UAT-006','Korrekturen umgesetzt','',true,false,false),
  ('uat','UAT-007','Nachtest durchgeführt','',true,true,false),
  ('uat','UAT-008','Freigabe: Wissensdatenbank','',true,true,false),
  ('uat','UAT-009','Freigabe: Terminlogik','',true,true,false),
  ('uat','UAT-010','Freigabe: Identitätsprüfung','',true,true,false),
  ('uat','UAT-011','Freigabe: Weiterleitungsregeln','',true,true,false),
  ('uat','UAT-012','Freigabe: Notfallregeln','',true,true,false),
  ('uat','UAT-013','Freigabe: Stimme und Tonalität','',true,true,false),
  ('uat','UAT-014','Freigabe: KI-Hinweis','',true,true,false),
  ('uat','UAT-015','Freigabe: Produktivverhalten','',true,true,false),
  -- Go-Live gate -------------------------------------------------------------------------------
  ('golive','GOL-001','Backup- und Rollback-Bereitschaft bestätigt','',true,true,false),
  ('golive','GOL-002','Produktive Zugangsdaten bereit','',true,true,false),
  -- Deployment ----------------------------------------------------------------------------------
  ('deployment','DEP-001','Produktive Agent-Version dokumentiert','',true,false,false),
  ('deployment','DEP-002','Produktive Wissensdatenbank aktiv','',true,false,false),
  ('deployment','DEP-003','SIP-Routing produktiv geschaltet','',true,false,false),
  ('deployment','DEP-004','Menschliche Weiterleitungen produktiv geprüft','',true,false,false),
  ('deployment','DEP-005','Monitoring aktiv','',true,false,false),
  ('deployment','DEP-006','Finaler synthetischer Testanruf','',true,false,false),
  ('deployment','DEP-007','Kontrollierter Erstanruf','',true,false,false),
  ('deployment','DEP-008','Go-Live vom Kunden bestätigt','',true,false,false),
  -- Monitoring (post-launch; optional so they never depress pre-launch readiness) -----------------
  ('monitoring','MON-001','Tool-Fehler geprüft','',false,false,false),
  ('monitoring','MON-002','Buchungsfehler geprüft','',false,false,false),
  ('monitoring','MON-003','Weiterleitungsquote geprüft','',false,false,false),
  ('monitoring','MON-004','Latenz geprüft','',false,false,false),
  ('monitoring','MON-005','Fehlgeschlagene Intents geprüft','',false,false,false),
  ('monitoring','MON-006','Unerwartetes Anruferverhalten geprüft','',false,false,false),
  ('monitoring','MON-007','Feedback des Praxisteams eingeholt','',false,false,false),
  ('monitoring','MON-008','Korrekturen an der Wissensdatenbank','',false,false,false),
  ('monitoring','MON-009','Korrekturen am Prompt','',false,false,false),
  ('monitoring','MON-010','Datenschutz- und Sicherheitsauffälligkeiten geprüft','',false,false,false),
  ('monitoring','MON-011','Kosten pro Minute geprüft','',false,false,false),
  -- Maintenance -----------------------------------------------------------------------------------
  ('maintenance','MNT-001','Monatlich: Nutzung und Kosten','',false,false,false),
  ('maintenance','MNT-002','Monatlich: Automatisierungserfolg und Tool-Fehler','',false,false,false),
  ('maintenance','MNT-003','Monatlich: Kundenänderungen und Aktualität der Wissensdatenbank','',false,false,false),
  ('maintenance','MNT-004','Quartal: Regressionssuite ausgeführt','',false,false,false),
  ('maintenance','MNT-005','Quartal: PVS-/API-Änderungen geprüft','',false,false,false),
  ('maintenance','MNT-006','Quartal: Agent- und Modelleinstellungen geprüft','',false,false,false),
  ('maintenance','MNT-007','Quartal: Zugangsdaten- und Sicherheitsreview','',false,false,false),
  ('maintenance','MNT-008','Quartal: Unterauftragsverarbeiter und Aufbewahrung geprüft','',false,false,false),
  ('maintenance','MNT-009','Quartal: Failover erneut getestet','',false,false,false),
  ('maintenance','MNT-010','Architekturänderung: Risikobewertung, TOM, Kundeninformation','',false,false,false)
) as t(section_code, code, title, description, is_required, is_blocker, healthcare_only)
on conflict (template_id, code) do update set
  section_id = excluded.section_id, title = excluded.title, description = excluded.description,
  is_required = excluded.is_required, is_go_live_blocker = excluded.is_go_live_blocker,
  healthcare_only = excluded.healthcare_only, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Structural self-check.
--
-- The section id above is resolved by a scalar subquery rather than a join. That
-- is deliberate: a join would SILENTLY DROP a row whose section_code was mistyped,
-- and a template quietly missing a compliance task is exactly the failure this
-- system exists to prevent. A subquery yields NULL instead, which the NOT NULL
-- column rejects, so the migration fails loudly on the bad row.
--
-- This block closes the other half: a section that exists but ended up with
-- nothing in it. Neither check needs updating when the template grows.
-- ---------------------------------------------------------------------------
declare
  v_empty text;
begin
  select string_agg(sec.code, ', ' order by sec.sort_order) into v_empty
  from public.owner_service_template_sections sec
  where sec.template_id = v_template
    and not exists (select 1 from public.owner_service_template_tasks t where t.section_id = sec.id)
    and not exists (select 1 from public.owner_service_template_fields f where f.section_id = sec.id);
  if v_empty is not null then
    raise exception 'Template % has sections with neither tasks nor fields: %', v_template, v_empty;
  end if;
end;

end;
$seed$;

commit;
