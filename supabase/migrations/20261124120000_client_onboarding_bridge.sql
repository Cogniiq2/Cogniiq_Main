-- =============================================================================
-- Client onboarding bridge — customer intake, owner review, invitations, requests
-- =============================================================================
--
-- WHY
-- ---
-- The owner engagement (owner_service_engagements + its instantiated fields and tasks) is the
-- single source of truth for delivering an AI Receptionist. Until now the customer could not
-- contribute to it: the older portal onboarding (businesses / onboarding_sessions /
-- receptionist_configs / phone_configs) is organization-scoped, written directly by the browser,
-- never reviewed and not connected to any engagement.
--
-- This migration adds a CONTROLLED contribution path and nothing more:
--
--   customer answer (draft) -> submitted -> owner review -> approved
--                                                   |
--                                                   +-> mapped answers are written to the
--                                                       engagement field through the existing
--                                                       owner_set_engagement_field() — same
--                                                       validation, same activity log, same
--                                                       go-live gate. Nothing else is touched.
--
-- Guarantees enforced here, in the database:
--   * A customer can only reach an engagement whose canonical customer is linked to an
--     organization they are an ACTIVE member of (owner/admin/member may write, viewer reads).
--   * A customer never writes an engagement field, task, status or blocker. Only an explicit
--     owner approval does, and only for answers mapped to a field of the right shape.
--   * Customer-visible data is a curated projection: no tasks, notes, costs, credentials,
--     identifiers or internal sections.
--   * Every new table is RPC-only: RLS on, no policies, no browser table privileges.
--   * Every function revokes PUBLIC/anon/authenticated explicitly (Supabase default privileges
--     grant EXECUTE on new functions directly to anon/authenticated — see the P0 hotfix
--     20261123120000) and grants back only what is meant to be called.
--
-- Additive and forward-only: new tables and functions only. Existing tables, functions,
-- grants and the legacy portal tables are not altered. The legacy tables are READ for
-- prefill suggestions; they are never written.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Question catalog (server-side source of truth for validation AND rendering)
-- -----------------------------------------------------------------------------
create table if not exists public.client_onboarding_questions (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{2,63}$'),
  stage text not null check (stage in ('business', 'operations', 'appointments', 'knowledge', 'escalation')),
  sort_order int not null,
  label text not null check (length(label) between 3 and 200),
  help text check (help is null or length(help) <= 600),
  placeholder text check (placeholder is null or length(placeholder) <= 200),
  kind text not null check (kind in ('text', 'textarea', 'email', 'phone', 'url', 'number',
                                      'choice', 'multi_choice', 'hours')),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  max_length int not null default 2000 check (max_length between 1 and 8000),
  is_required boolean not null default false,
  healthcare_only boolean not null default false,
  -- The owner_engagement_fields.code an APPROVED answer may be written to. Null means the
  -- approved answer itself is the record (e.g. opening hours, FAQ, which have no field yet).
  target_field_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. Intake (one per engagement), answers, requests, invitations, messages
-- -----------------------------------------------------------------------------
create table if not exists public.client_onboarding_intakes (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null unique references public.owner_service_engagements(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'submitted', 'changes_requested', 'approved')),
  current_stage text check (current_stage is null or current_stage in
    ('business', 'operations', 'appointments', 'knowledge', 'escalation', 'review')),
  version int not null default 0,
  started_at timestamptz,
  started_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  submitted_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  -- Shown to the customer. Written only by the owner.
  review_note text check (review_note is null or length(review_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.client_onboarding_intakes(id) on delete cascade,
  question_code text not null references public.client_onboarding_questions(code) on delete restrict,
  value jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'changes_requested')),
  owner_comment text check (owner_comment is null or length(owner_comment) <= 1000),
  approved_value jsonb,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  applied_field_code text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint client_onboarding_answers_unique unique (intake_id, question_code)
);

create table if not exists public.client_onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.owner_service_engagements(id) on delete cascade,
  question text not null check (length(btrim(question)) between 5 and 1000),
  question_code text references public.client_onboarding_questions(code) on delete set null,
  task_id uuid references public.owner_engagement_tasks(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'answered', 'accepted', 'cancelled')),
  response text check (response is null or length(response) <= 4000),
  responded_at timestamptz,
  responded_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists client_onboarding_requests_engagement_idx
  on public.client_onboarding_requests (engagement_id, status);

-- Portal ACCESS granted for this engagement. Membership itself still comes exclusively from the
-- existing client_invitations + claim_my_client_invitations() flow; this row remembers which
-- invitation the onboarding created so it can be shown, renewed and revoked truthfully.
create table if not exists public.client_onboarding_invitations (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.owner_service_engagements(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_email text not null check (recipient_email = lower(btrim(recipient_email))
                                       and recipient_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  recipient_name text check (recipient_name is null or length(recipient_name) <= 120),
  client_invitation_id uuid references public.client_invitations(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'revoked', 'superseded')),
  expires_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists client_onboarding_invitations_one_active
  on public.client_onboarding_invitations (engagement_id, recipient_email) where status = 'active';

-- Transport log. 'accepted' means the provider ACCEPTED the message — never "delivered/opened".
create table if not exists public.client_onboarding_messages (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.owner_service_engagements(id) on delete cascade,
  invitation_id uuid references public.client_onboarding_invitations(id) on delete set null,
  request_id uuid references public.client_onboarding_requests(id) on delete set null,
  kind text not null check (kind in ('invitation', 'reminder', 'request')),
  is_test boolean not null default false,
  recipient_email text not null,
  recipient_name text,
  language text not null default 'de' check (language in ('de', 'en')),
  subject text not null check (length(subject) between 3 and 200),
  intro text check (intro is null or length(intro) <= 2000),
  status text not null default 'sending' check (status in ('sending', 'accepted', 'failed')),
  provider_message_id text,
  error_code text check (error_code is null or length(error_code) <= 120),
  idempotency_key uuid not null unique,
  sent_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists client_onboarding_messages_engagement_idx
  on public.client_onboarding_messages (engagement_id, created_at desc);

-- RPC-only tables. RLS on with no policies denies every browser role; table privileges are
-- revoked explicitly because Supabase's default privileges grant them on creation.
do $$
declare t text;
begin
  foreach t in array array['client_onboarding_questions', 'client_onboarding_intakes',
    'client_onboarding_answers', 'client_onboarding_requests', 'client_onboarding_invitations',
    'client_onboarding_messages']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Seed the question catalog (German, business-safe; no patient data is ever requested)
-- -----------------------------------------------------------------------------
insert into public.client_onboarding_questions
  (code, stage, sort_order, label, help, placeholder, kind, options, max_length, is_required, healthcare_only, target_field_code)
values
  -- A. Ihr Unternehmen
  ('company_name', 'business', 10, 'Offizieller Name Ihres Unternehmens', 'So, wie er auf Rechnungen und im Impressum steht.', 'z. B. Zahnarztpraxis Dr. Muster', 'text', '[]', 200, true, false, 'PRO-F001'),
  ('main_contact', 'business', 20, 'Ihre Ansprechperson für die Einrichtung', 'Name und Funktion der Person, mit der wir Rückfragen klären.', 'z. B. Anna Muster, Praxismanagerin', 'text', '[]', 200, true, false, 'PRO-F002'),
  ('industry', 'business', 30, 'Branche', null, null, 'choice',
    '[{"value":"Arztpraxis","label":"Arztpraxis"},{"value":"Zahnarztpraxis","label":"Zahnarztpraxis"},{"value":"Therapiepraxis","label":"Therapie- oder Physiotherapiepraxis"},{"value":"Dienstleistung","label":"Dienstleistungsunternehmen"},{"value":"Andere","label":"Andere Branche"}]',
    100, true, false, 'PRO-F006'),
  ('locations', 'business', 40, 'Standort(e) mit Adresse', 'Ein Standort pro Zeile.', 'Musterstraße 1, 95444 Bayreuth', 'textarea', '[]', 1000, true, false, 'PRO-F007'),
  ('public_phone', 'business', 50, 'Telefonnummer, unter der Sie heute erreichbar sind', null, '+49 921 123456', 'phone', '[]', 40, true, false, 'PRO-F008'),
  ('website', 'business', 60, 'Website', null, 'https://', 'url', '[]', 300, false, false, 'PRO-F009'),
  ('languages', 'business', 70, 'In welchen Sprachen soll der Assistent sprechen?', null, null, 'multi_choice',
    '[{"value":"Deutsch","label":"Deutsch"},{"value":"Englisch","label":"Englisch"},{"value":"Türkisch","label":"Türkisch"},{"value":"Arabisch","label":"Arabisch"},{"value":"Russisch","label":"Russisch"},{"value":"Polnisch","label":"Polnisch"}]',
    300, true, false, 'PRO-F011'),
  -- B. Ihre Abläufe
  ('opening_hours', 'operations', 10, 'Öffnungszeiten', 'Bis zu drei Zeitfenster pro Tag, z. B. mit Mittagspause.', null, 'hours', '[]', 2000, true, false, null),
  ('services_offered', 'operations', 20, 'Ihre wichtigsten Leistungen', 'Was Anrufer bei Ihnen in Anspruch nehmen können — in Ihren eigenen Worten.', null, 'textarea', '[]', 3000, true, false, null),
  ('common_inquiries', 'operations', 30, 'Womit rufen Ihre Kunden oder Patienten am häufigsten an?', null, 'z. B. Terminwunsch, Rezeptanfrage, Frage zu Öffnungszeiten', 'textarea', '[]', 3000, true, false, null),
  ('caller_tone', 'operations', 40, 'Wie soll der Assistent klingen?', null, null, 'choice',
    '[{"value":"professional","label":"Professionell und sachlich"},{"value":"warm","label":"Freundlich und herzlich"},{"value":"concise","label":"Kurz und effizient"},{"value":"formal","label":"Förmlich"}]',
    40, true, false, null),
  ('forbidden_topics', 'operations', 50, 'Worüber soll der Assistent keine Auskunft geben?', 'Zum Beispiel Preise, Befunde oder interne Angelegenheiten.', null, 'textarea', '[]', 2000, false, false, 'WFL-F003'),
  ('medical_info_limits', 'operations', 60, 'Grenzen bei medizinischen Fragen', 'Der Assistent gibt nie medizinischen Rat. Beschreiben Sie, wie er solche Fragen weiterleiten soll.', null, 'textarea', '[]', 2000, true, true, 'WFL-F002'),
  -- C. Termine
  ('scheduling_software', 'appointments', 10, 'Mit welcher Software verwalten Sie Termine?', 'Wir prüfen anschließend, welche Anbindung technisch möglich ist. Bis dahin nimmt der Assistent keine verbindlichen Buchungen vor.', 'z. B. Doctolib, CGM, Google Kalender', 'text', '[]', 200, true, false, 'SFW-F004'),
  ('practice_software', 'appointments', 20, 'Welche Praxissoftware nutzen Sie?', null, 'z. B. CGM MEDISTAR, Dampsoft', 'text', '[]', 200, true, true, 'SFW-F001'),
  ('appointment_types', 'appointments', 30, 'Ihre häufigsten Terminarten', 'Eine Terminart pro Zeile, möglichst mit üblicher Dauer.', 'Kontrolluntersuchung – 20 Minuten', 'textarea', '[]', 3000, true, false, null),
  ('booking_horizon_days', 'appointments', 40, 'Wie viele Tage im Voraus kann gebucht werden?', null, '60', 'number', '[]', 4, false, false, 'WFL-F001'),
  ('new_vs_existing', 'appointments', 50, 'Unterschiede zwischen neuen und bestehenden Kunden bzw. Patienten', null, null, 'textarea', '[]', 2000, false, false, null),
  ('cancellation_rules', 'appointments', 60, 'Regeln für Absagen und Verschiebungen', null, 'z. B. Absage bis 24 Stunden vorher', 'textarea', '[]', 2000, false, false, null),
  ('desired_capabilities', 'appointments', 70, 'Was wünschen Sie sich vom Assistenten?', 'Ihre Wünsche. Was davon technisch umsetzbar ist, klären wir mit Ihnen gemeinsam.', null, 'multi_choice',
    '[{"value":"faq","label":"Häufige Fragen beantworten"},{"value":"hours","label":"Öffnungszeiten nennen"},{"value":"booking_request","label":"Terminwünsche aufnehmen"},{"value":"reschedule","label":"Verschiebungen aufnehmen"},{"value":"cancel","label":"Absagen aufnehmen"},{"value":"callback","label":"Rückrufbitten aufnehmen"},{"value":"transfer","label":"An Ihr Team weiterleiten"}]',
    300, true, false, null),
  -- D. Wissen & Kommunikation
  ('faq', 'knowledge', 10, 'Häufige Fragen und Ihre Antworten', 'Nur öffentliche Informationen, die jeder Anrufer erfahren darf.', 'Gibt es Parkplätze? – Ja, direkt vor dem Haus.', 'textarea', '[]', 6000, true, false, null),
  ('greeting', 'knowledge', 20, 'Wie soll der Assistent Anrufer begrüßen?', null, 'Guten Tag, Sie sind verbunden mit …', 'textarea', '[]', 500, false, false, null),
  ('public_sources', 'knowledge', 30, 'Öffentliche Informationsquellen', 'Zum Beispiel Seiten Ihrer Website, auf die sich der Assistent stützen darf. Eine Quelle pro Zeile.', 'https://', 'textarea', '[]', 2000, false, false, 'KB-F001'),
  ('uncertain_handling', 'knowledge', 40, 'Was soll passieren, wenn der Assistent eine Frage nicht sicher beantworten kann?', null, null, 'choice',
    '[{"value":"callback","label":"Rückrufbitte aufnehmen"},{"value":"transfer","label":"An Ihr Team weiterleiten"},{"value":"message","label":"Nachricht aufnehmen"}]',
    40, true, false, null),
  -- E. Erreichbarkeit & Eskalation
  ('reception_phone', 'escalation', 10, 'Rufnummer für die Weiterleitung an Ihr Team', null, '+49 921 123456', 'phone', '[]', 40, true, false, 'IDN-F006'),
  ('transfer_hours', 'escalation', 20, 'Zu welchen Zeiten darf weitergeleitet werden?', null, 'Mo–Fr 08:00–17:00', 'text', '[]', 200, true, false, 'IDN-F009'),
  ('no_answer_behavior', 'escalation', 30, 'Was soll passieren, wenn bei einer Weiterleitung niemand abnimmt?', null, null, 'textarea', '[]', 1000, true, false, 'IDN-F010'),
  ('after_hours', 'escalation', 40, 'Verhalten außerhalb Ihrer Öffnungszeiten', null, null, 'textarea', '[]', 1000, true, false, 'WFL-F005'),
  ('urgent_handling', 'escalation', 50, 'Wie sollen dringende Anliegen behandelt werden?', 'Beschreiben Sie nur den gewünschten Ablauf — bitte keine Angaben zu einzelnen Personen oder Krankengeschichten.', 'z. B. Hinweis auf den Notruf 112 und Weiterleitung an …', 'textarea', '[]', 1500, true, false, 'WFL-F004'),
  ('urgent_contact', 'escalation', 60, 'Kontakt für dringende Fälle', 'Telefonnummer und Zeiten, zu denen dringende Anliegen weitergegeben werden dürfen.', null, 'textarea', '[]', 500, false, false, 'IDN-F012')
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- 4. Internal helpers (never browser-callable)
-- -----------------------------------------------------------------------------

-- Validates and normalises one answer against its question. Returns the jsonb value to store
-- (null = cleared) or raises a German message the customer can act on.
create or replace function public.client_onboarding_normalize_answer(p_question public.client_onboarding_questions, p_value jsonb)
returns jsonb language plpgsql immutable set search_path = public, pg_temp as $$
declare v_text text; v_item jsonb; v_day text; v_range jsonb; v_count int; v_total int := 0;
begin
  if p_value is null or jsonb_typeof(p_value) = 'null' then return null; end if;

  if p_question.kind in ('text', 'textarea', 'email', 'phone', 'url', 'number', 'choice') then
    if jsonb_typeof(p_value) <> 'string' then
      raise exception 'Ungültige Eingabe für „%".', p_question.label;
    end if;
    v_text := btrim(p_value #>> '{}');
    if v_text = '' then return null; end if;
    if length(v_text) > p_question.max_length then
      raise exception '„%" darf höchstens % Zeichen lang sein.', p_question.label, p_question.max_length;
    end if;
    if p_question.kind = 'email' and v_text !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      raise exception 'Bitte geben Sie bei „%" eine gültige E-Mail-Adresse an.', p_question.label;
    elsif p_question.kind = 'phone' and v_text !~ '^\+?[0-9 ()/.-]{5,40}$' then
      raise exception 'Bitte geben Sie bei „%" eine gültige Telefonnummer an.', p_question.label;
    elsif p_question.kind = 'url' and v_text !~* '^https?://[^\s<>"]+$' then
      raise exception 'Bitte geben Sie bei „%" eine Adresse beginnend mit https:// an.', p_question.label;
    elsif p_question.kind = 'number' and (v_text !~ '^[0-9]{1,4}$') then
      raise exception 'Bitte geben Sie bei „%" eine ganze Zahl an.', p_question.label;
    elsif p_question.kind = 'choice' and not exists (
      select 1 from jsonb_array_elements(p_question.options) o where o->>'value' = v_text) then
      raise exception 'Bitte wählen Sie bei „%" eine der angebotenen Möglichkeiten.', p_question.label;
    end if;
    return to_jsonb(v_text);
  end if;

  if p_question.kind = 'multi_choice' then
    if jsonb_typeof(p_value) <> 'array' then
      raise exception 'Ungültige Auswahl für „%".', p_question.label;
    end if;
    for v_item in select * from jsonb_array_elements(p_value) loop
      if jsonb_typeof(v_item) <> 'string' or not exists (
        select 1 from jsonb_array_elements(p_question.options) o where o->>'value' = v_item #>> '{}') then
        raise exception 'Bitte wählen Sie bei „%" nur angebotene Möglichkeiten.', p_question.label;
      end if;
    end loop;
    if jsonb_array_length(p_value) = 0 then return null; end if;
    return (select jsonb_agg(distinct x) from jsonb_array_elements(p_value) x);
  end if;

  if p_question.kind = 'hours' then
    -- {"mon":{"closed":false,"ranges":[["08:00","12:00"]]}, ... "sun": {...}}
    if jsonb_typeof(p_value) <> 'object' then
      raise exception 'Ungültige Öffnungszeiten.';
    end if;
    for v_day in select jsonb_object_keys(p_value) loop
      if v_day not in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun') then
        raise exception 'Ungültige Öffnungszeiten.';
      end if;
      if jsonb_typeof(p_value->v_day->'closed') <> 'boolean'
         or jsonb_typeof(coalesce(p_value->v_day->'ranges', '[]'::jsonb)) <> 'array' then
        raise exception 'Ungültige Öffnungszeiten.';
      end if;
      v_count := jsonb_array_length(coalesce(p_value->v_day->'ranges', '[]'::jsonb));
      if v_count > 3 then
        raise exception 'Bitte höchstens drei Zeitfenster pro Tag angeben.';
      end if;
      for v_range in select * from jsonb_array_elements(coalesce(p_value->v_day->'ranges', '[]'::jsonb)) loop
        if jsonb_typeof(v_range) <> 'array' or jsonb_array_length(v_range) <> 2
           or (v_range->>0) !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
           or (v_range->>1) !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
           or (v_range->>0) >= (v_range->>1) then
          raise exception 'Bitte prüfen Sie die Öffnungszeiten: Beginn muss vor dem Ende liegen (Format HH:MM).';
        end if;
      end loop;
      if not (p_value->v_day->>'closed')::boolean then v_total := v_total + v_count; end if;
    end loop;
    if v_total = 0 and not exists (select 1 from jsonb_object_keys(p_value)) then return null; end if;
    return p_value;
  end if;

  raise exception 'Unbekannter Fragetyp.';
end;
$$;

-- Plain-text rendering of an answer, used when an approved answer is written to a text field.
create or replace function public.client_onboarding_answer_text(p_question public.client_onboarding_questions, p_value jsonb)
returns text language plpgsql immutable set search_path = public, pg_temp as $$
declare v_out text;
begin
  if p_value is null then return null; end if;
  if p_question.kind = 'multi_choice' then
    select string_agg(coalesce((select o->>'label' from jsonb_array_elements(p_question.options) o where o->>'value' = x #>> '{}'), x #>> '{}'), ', ')
      into v_out from jsonb_array_elements(p_value) x;
    return v_out;
  end if;
  if p_question.kind = 'hours' then return p_value::text; end if;
  return p_value #>> '{}';
end;
$$;

-- Resolves the engagement a customer may act on, or raises. p_write requires a writing role.
create or replace function public.client_onboarding_authorize(p_engagement_id uuid, p_write boolean)
returns table (engagement_id uuid, organization_id uuid, customer_id uuid, healthcare boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare e record;
begin
  if auth.uid() is null then raise exception 'Anmeldung erforderlich.' using errcode = '42501'; end if;
  select se.id, se.customer_id, se.healthcare, c.organization_id
    into e
  from public.owner_service_engagements se
  join public.owner_customers c on c.id = se.customer_id
  join public.owner_customer_services cs on cs.id = se.customer_service_id
  where se.id = p_engagement_id and se.service_key = 'ai_receptionist' and cs.state = 'active';
  -- One answer for "does not exist" and "not yours": no existence oracle across tenants.
  if e.id is null or e.organization_id is null or not exists (
    select 1 from public.organization_members om
    where om.organization_id = e.organization_id and om.user_id = auth.uid() and om.status = 'active'
      and (not p_write or om.role in ('owner', 'admin', 'member'))
  ) then
    raise exception 'Kein Zugriff auf diese Einrichtung.' using errcode = '42501';
  end if;
  return query select e.id, e.organization_id, e.customer_id, e.healthcare;
end;
$$;

create or replace function public.client_onboarding_ensure_intake(p_engagement_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  insert into public.client_onboarding_intakes (engagement_id) values (p_engagement_id)
  on conflict (engagement_id) do nothing;
  select id into v_id from public.client_onboarding_intakes where engagement_id = p_engagement_id;
  return v_id;
end;
$$;

-- Customer-facing milestone projection from REAL engagement state. Never shows a stage as done
-- unless the server state proves it.
create or replace function public.client_onboarding_milestones(p_lifecycle text, p_intake_status text)
returns jsonb language sql immutable set search_path = public, pg_temp as $$
  with stage(idx, key, label) as (values
    (1, 'provide', 'Informationen bereitstellen'),
    (2, 'review', 'Angaben werden geprüft'),
    (3, 'build', 'Ihr Assistent wird eingerichtet'),
    (4, 'testing', 'Testphase'),
    (5, 'approval', 'Ihre Freigabe'),
    (6, 'live', 'Produktivstart')),
  cur as (select case
      when p_lifecycle in ('live', 'monitoring') then 7
      when p_lifecycle in ('client_approval', 'ready_for_go_live') then 5
      when p_lifecycle = 'testing' then 4
      when p_lifecycle in ('building', 'integrating') then 3
      when p_intake_status in ('submitted', 'approved') then 2
      else 1 end as idx)
  select jsonb_agg(jsonb_build_object('key', s.key, 'label', s.label,
      'state', case when s.idx < cur.idx then 'done' when s.idx = cur.idx then 'current' else 'upcoming' end)
    order by s.idx)
  from stage s cross join cur;
$$;

-- -----------------------------------------------------------------------------
-- 5. Customer RPCs (authenticated; authorization inside)
-- -----------------------------------------------------------------------------
create or replace function public.client_onboarding_list()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Anmeldung erforderlich.' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'engagement_id', se.id,
      'organization_name', o.name,
      'company', c.company,
      'intake_status', coalesce(i.status, 'not_started'),
      'open_requests', (select count(*) from public.client_onboarding_requests r
                         where r.engagement_id = se.id and r.status = 'open'),
      'milestones', public.client_onboarding_milestones(se.lifecycle_status, coalesce(i.status, 'not_started')))
      order by se.created_at)
    from public.owner_service_engagements se
    join public.owner_customer_services cs on cs.id = se.customer_service_id and cs.state = 'active'
    join public.owner_customers c on c.id = se.customer_id
    join public.organizations o on o.id = c.organization_id
    join public.organization_members om on om.organization_id = c.organization_id
         and om.user_id = auth.uid() and om.status = 'active'
    left join public.client_onboarding_intakes i on i.engagement_id = se.id
    where se.service_key = 'ai_receptionist'
  ), '[]'::jsonb);
end;
$$;

create or replace function public.client_onboarding_get(p_engagement_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare a record; i record; v_role text; v_prefill jsonb := '{}'::jsonb; c record; b record; rc record; se record;
begin
  select * into a from public.client_onboarding_authorize(p_engagement_id, false);
  select * into i from public.client_onboarding_intakes where engagement_id = p_engagement_id;
  select role::text into v_role from public.organization_members
   where organization_id = a.organization_id and user_id = auth.uid() and status = 'active';
  select * into se from public.owner_service_engagements where id = p_engagement_id;

  -- Prefill suggestions, only from data this organization already gave us. Suggestions are
  -- never stored until the customer saves them.
  select company, contact_name, phone, street, postal_code, city into c
    from public.owner_customers where id = a.customer_id;
  select name, website, industry, address, primary_contact_name, existing_business_phone into b
    from public.businesses where organization_id = a.organization_id order by created_at limit 1;
  select greeting, tone into rc
    from public.receptionist_configs where organization_id = a.organization_id order by created_at limit 1;
  v_prefill := jsonb_strip_nulls(jsonb_build_object(
    'company_name', to_jsonb(coalesce(nullif(btrim(c.company), ''), nullif(btrim(b.name), ''))),
    'main_contact', to_jsonb(coalesce(nullif(btrim(c.contact_name), ''), nullif(btrim(b.primary_contact_name), ''))),
    'public_phone', to_jsonb(coalesce(nullif(btrim(c.phone), ''), nullif(btrim(b.existing_business_phone), ''))),
    'locations', to_jsonb(coalesce(nullif(btrim(concat_ws(', ', nullif(btrim(c.street), ''),
                   nullif(btrim(concat_ws(' ', c.postal_code, c.city)), ''))), ''), nullif(btrim(b.address), ''))),
    'website', to_jsonb(nullif(btrim(b.website), '')),
    'greeting', to_jsonb(nullif(btrim(rc.greeting), '')),
    'caller_tone', to_jsonb(nullif(btrim(rc.tone::text), ''))));

  return jsonb_build_object(
    'engagement_id', p_engagement_id,
    'organization_name', (select name from public.organizations where id = a.organization_id),
    'healthcare', a.healthcare,
    'can_edit', v_role in ('owner', 'admin', 'member'),
    'intake', jsonb_build_object(
      'status', coalesce(i.status, 'not_started'), 'current_stage', i.current_stage,
      'version', coalesce(i.version, 0), 'submitted_at', i.submitted_at, 'reviewed_at', i.reviewed_at,
      'review_note', i.review_note),
    'questions', coalesce((select jsonb_agg(jsonb_build_object(
        'code', q.code, 'stage', q.stage, 'label', q.label, 'help', q.help, 'placeholder', q.placeholder,
        'kind', q.kind, 'options', q.options, 'max_length', q.max_length, 'required', q.is_required)
        order by q.stage, q.sort_order)
      from public.client_onboarding_questions q
      where q.is_active and (a.healthcare or not q.healthcare_only)), '[]'::jsonb),
    'answers', coalesce((select jsonb_object_agg(an.question_code, jsonb_build_object(
        'value', an.value, 'status', an.status, 'owner_comment', an.owner_comment, 'updated_at', an.updated_at))
      from public.client_onboarding_answers an where an.intake_id = i.id), '{}'::jsonb),
    'prefill', v_prefill,
    'requests', coalesce((select jsonb_agg(jsonb_build_object(
        'id', r.id, 'question', r.question, 'status', r.status, 'response', r.response,
        'responded_at', r.responded_at, 'created_at', r.created_at) order by r.created_at)
      from public.client_onboarding_requests r
      where r.engagement_id = p_engagement_id and r.status <> 'cancelled'), '[]'::jsonb),
    'milestones', public.client_onboarding_milestones(se.lifecycle_status, coalesce(i.status, 'not_started')));
end;
$$;

-- Saves a batch of draft answers. Optimistic concurrency on the intake version: a stale tab
-- gets a clear conflict instead of silently overwriting newer answers from another device.
create or replace function public.client_onboarding_save(
  p_engagement_id uuid, p_answers jsonb, p_expected_version int, p_current_stage text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare a record; v_intake uuid; i record; v_code text; v_raw jsonb; q public.client_onboarding_questions;
  v_value jsonb; v_existing record; v_changed int := 0;
begin
  select * into a from public.client_onboarding_authorize(p_engagement_id, true);
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Ungültige Daten.';
  end if;
  if (select count(*) from jsonb_object_keys(p_answers)) > 60 then
    raise exception 'Zu viele Angaben auf einmal.';
  end if;
  v_intake := public.client_onboarding_ensure_intake(p_engagement_id);
  select * into i from public.client_onboarding_intakes where id = v_intake for update;

  if i.status in ('submitted', 'approved') then
    raise exception 'Ihre Angaben wurden bereits übermittelt und werden von uns geprüft.' using errcode = 'P0001';
  end if;
  if p_expected_version is distinct from i.version then
    raise exception 'Ihre Angaben wurden zwischenzeitlich an anderer Stelle geändert. Bitte laden Sie die Seite neu.'
      using errcode = '40001';
  end if;
  if p_current_stage is not null and p_current_stage not in
     ('business', 'operations', 'appointments', 'knowledge', 'escalation', 'review') then
    raise exception 'Ungültiger Schritt.';
  end if;

  for v_code, v_raw in select * from jsonb_each(p_answers) loop
    select * into q from public.client_onboarding_questions
     where code = v_code and is_active and (a.healthcare or not healthcare_only);
    if q.code is null then raise exception 'Unbekannte Frage.'; end if;
    v_value := public.client_onboarding_normalize_answer(q, v_raw);
    select * into v_existing from public.client_onboarding_answers where intake_id = v_intake and question_code = v_code;
    if v_existing.id is null then
      insert into public.client_onboarding_answers (intake_id, question_code, value, status, updated_by)
      values (v_intake, v_code, v_value, 'draft', auth.uid());
      v_changed := v_changed + 1;
    elsif v_existing.status = 'approved' then
      -- Approved facts are owner-verified; the customer cannot silently change them here.
      if v_existing.value is distinct from v_value then
        raise exception '„%" wurde bereits von uns bestätigt. Bitte nutzen Sie für Änderungen eine Nachricht an uns.', q.label;
      end if;
    elsif v_existing.value is distinct from v_value then
      update public.client_onboarding_answers
         set value = v_value, status = 'draft', updated_by = auth.uid(), updated_at = now()
       where id = v_existing.id;
      v_changed := v_changed + 1;
    end if;
  end loop;

  update public.client_onboarding_intakes set
    status = case when status = 'not_started' then 'in_progress' else status end,
    started_at = coalesce(started_at, now()),
    started_by = coalesce(started_by, auth.uid()),
    current_stage = coalesce(p_current_stage, current_stage),
    version = version + 1, updated_at = now()
  where id = v_intake;

  if i.status = 'not_started' then
    perform public.owner_record_engagement_activity(p_engagement_id, 'client_intake_started',
      'Kunde hat die Online-Einrichtung begonnen', null, null);
  end if;

  return jsonb_build_object('version', i.version + 1, 'changed', v_changed);
end;
$$;

create or replace function public.client_onboarding_submit(p_engagement_id uuid, p_expected_version int)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare a record; i record; v_missing jsonb;
begin
  select * into a from public.client_onboarding_authorize(p_engagement_id, true);
  select * into i from public.client_onboarding_intakes where engagement_id = p_engagement_id for update;
  if i.id is null then raise exception 'Bitte füllen Sie zuerst die Einrichtung aus.'; end if;

  -- Idempotent: a double click or a retry after a lost response returns the same outcome.
  if i.status in ('submitted', 'approved') then
    return jsonb_build_object('status', i.status, 'submitted_at', i.submitted_at, 'already', true);
  end if;
  if p_expected_version is distinct from i.version then
    raise exception 'Ihre Angaben wurden zwischenzeitlich geändert. Bitte prüfen Sie die Zusammenfassung erneut.'
      using errcode = '40001';
  end if;

  select jsonb_agg(q.label order by q.stage, q.sort_order) into v_missing
  from public.client_onboarding_questions q
  where q.is_active and q.is_required and (a.healthcare or not q.healthcare_only)
    and not exists (select 1 from public.client_onboarding_answers an
                    where an.intake_id = i.id and an.question_code = q.code and an.value is not null);
  if v_missing is not null then
    raise exception 'Es fehlen noch Pflichtangaben: %', (select string_agg(x, ', ') from jsonb_array_elements_text(v_missing) x);
  end if;

  update public.client_onboarding_answers set status = 'submitted', updated_at = now()
   where intake_id = i.id and status in ('draft', 'changes_requested') and value is not null;
  update public.client_onboarding_intakes set status = 'submitted', submitted_at = now(),
         submitted_by = auth.uid(), current_stage = 'review', version = version + 1, updated_at = now()
   where id = i.id;
  perform public.owner_record_engagement_activity(p_engagement_id, 'client_intake_submitted',
    'Kunde hat die Einrichtungsangaben übermittelt', null, null);
  return jsonb_build_object('status', 'submitted', 'submitted_at', now(), 'already', false);
end;
$$;

create or replace function public.client_onboarding_respond_request(p_request_id uuid, p_response text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_text text;
begin
  select * into r from public.client_onboarding_requests where id = p_request_id for update;
  if r.id is null then raise exception 'Kein Zugriff auf diese Rückfrage.' using errcode = '42501'; end if;
  perform public.client_onboarding_authorize(r.engagement_id, true);
  if r.status not in ('open', 'answered') then
    raise exception 'Diese Rückfrage ist bereits abgeschlossen.';
  end if;
  v_text := btrim(coalesce(p_response, ''));
  if length(v_text) < 1 or length(v_text) > 4000 then
    raise exception 'Bitte geben Sie eine Antwort mit höchstens 4000 Zeichen ein.';
  end if;
  update public.client_onboarding_requests set response = v_text, status = 'answered',
         responded_at = now(), responded_by = auth.uid(), updated_at = now()
   where id = p_request_id;
  perform public.owner_record_engagement_activity(r.engagement_id, 'client_request_answered',
    'Kunde hat eine Rückfrage beantwortet', r.task_id, null);
  return jsonb_build_object('id', p_request_id, 'status', 'answered');
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Owner RPCs
-- -----------------------------------------------------------------------------

-- Links a canonical customer to an EXISTING organization, once. Never creates organizations and
-- never moves an existing link, so it cannot produce duplicates or silently re-home a customer.
create or replace function public.owner_link_customer_organization(p_customer_id uuid, p_organization_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record; o record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into c from public.owner_customers where id = p_customer_id for update;
  if c.id is null then raise exception 'customer not found'; end if;
  select * into o from public.organizations where id = p_organization_id;
  if o.id is null then raise exception 'organization not found'; end if;
  if c.organization_id = p_organization_id then
    return jsonb_build_object('customer_id', c.id, 'organization_id', o.id, 'already', true);
  end if;
  if c.organization_id is not null then
    raise exception 'Dieser Kunde ist bereits mit einer anderen Organisation verknüpft.';
  end if;
  if exists (select 1 from public.owner_customers x
             where x.organization_id = p_organization_id and x.business_entity_id = c.business_entity_id) then
    raise exception 'Diese Organisation ist bereits einem anderen Kunden zugeordnet.';
  end if;
  update public.owner_customers set organization_id = p_organization_id, updated_at = now() where id = c.id;
  perform public.owner_record_customer_activity(c.id, 'portal_linked',
    'Mit Portal-Organisation verknüpft: ' || o.name, null, null);
  return jsonb_build_object('customer_id', c.id, 'organization_id', o.id, 'already', false);
end;
$$;

create or replace function public.owner_onboarding_detail(p_engagement_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare se record; c record; i record; v_org record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into se from public.owner_service_engagements where id = p_engagement_id;
  if se.id is null then raise exception 'engagement not found'; end if;
  select * into c from public.owner_customers where id = se.customer_id;
  select * into i from public.client_onboarding_intakes where engagement_id = p_engagement_id;
  select id, name into v_org from public.organizations where id = c.organization_id;

  return jsonb_build_object(
    'engagement_id', se.id,
    'service_key', se.service_key,
    'healthcare', se.healthcare,
    'customer', jsonb_build_object('id', c.id, 'company', c.company, 'contact_name', c.contact_name,
                                   'email', c.email, 'organization_id', c.organization_id),
    'organization', case when v_org.id is null then null
                         else jsonb_build_object('id', v_org.id, 'name', v_org.name) end,
    -- Organizations that could be linked: only ones no other canonical customer already owns.
    'link_candidates', case when c.organization_id is not null then '[]'::jsonb else coalesce((
        select jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name) order by o.name)
        from public.organizations o
        where not exists (select 1 from public.owner_customers x where x.organization_id = o.id)), '[]'::jsonb) end,
    'contacts', coalesce((
        select jsonb_agg(distinct jsonb_build_object('email', x.email, 'name', x.name, 'source', x.source))
        from (
          select lower(btrim(c.email)) as email, c.contact_name as name, 'customer' as source
            where c.email is not null and btrim(c.email) <> ''
          union all
          select lower(u.email), coalesce(p.full_name, null), 'member'
            from public.organization_members om
            join auth.users u on u.id = om.user_id
            left join public.profiles p on p.id = om.user_id
           where om.organization_id = c.organization_id and om.status = 'active'
          union all
          select ci.email, null, 'portal_invitation'
            from public.client_invitations ci
           where ci.organization_id = c.organization_id and ci.status = 'pending'
        ) x), '[]'::jsonb),
    'members', coalesce((
        select jsonb_agg(jsonb_build_object('email', lower(u.email), 'role', om.role, 'status', om.status,
                                            'last_sign_in_at', u.last_sign_in_at))
        from public.organization_members om join auth.users u on u.id = om.user_id
        where om.organization_id = c.organization_id), '[]'::jsonb),
    'invitations', coalesce((
        select jsonb_agg(jsonb_build_object(
            'id', inv.id, 'recipient_email', inv.recipient_email, 'recipient_name', inv.recipient_name,
            'status', inv.status, 'expires_at', inv.expires_at, 'created_at', inv.created_at,
            'revoked_at', inv.revoked_at,
            'portal_invitation_status', ci.status,
            'access_active', exists (select 1 from public.organization_members om
                join auth.users u on u.id = om.user_id
                where om.organization_id = inv.organization_id and om.status = 'active'
                  and lower(u.email) = inv.recipient_email))
          order by inv.created_at desc)
        from public.client_onboarding_invitations inv
        left join public.client_invitations ci on ci.id = inv.client_invitation_id
        where inv.engagement_id = p_engagement_id), '[]'::jsonb),
    'messages', coalesce((
        select jsonb_agg(jsonb_build_object(
            'id', m.id, 'kind', m.kind, 'is_test', m.is_test, 'recipient_email', m.recipient_email,
            'subject', m.subject, 'status', m.status, 'error_code', m.error_code,
            'provider_message_id', m.provider_message_id, 'created_at', m.created_at,
            'completed_at', m.completed_at) order by m.created_at desc)
        from (select * from public.client_onboarding_messages
              where engagement_id = p_engagement_id order by created_at desc limit 50) m), '[]'::jsonb),
    'intake', case when i.id is null then null else jsonb_build_object(
        'id', i.id, 'status', i.status, 'current_stage', i.current_stage, 'version', i.version,
        'started_at', i.started_at, 'submitted_at', i.submitted_at, 'reviewed_at', i.reviewed_at,
        'review_note', i.review_note) end,
    'questions', coalesce((select jsonb_agg(jsonb_build_object(
        'code', q.code, 'stage', q.stage, 'label', q.label, 'kind', q.kind, 'options', q.options,
        'required', q.is_required, 'target_field_code', q.target_field_code,
        'target_field_label', f.label, 'target_is_blocker', f.is_go_live_blocker,
        'current_field_value', coalesce(f.value_text, f.value_number::text,
                                        f.value_bool::text, f.value_date::text))
        order by q.stage, q.sort_order)
      from public.client_onboarding_questions q
      left join public.owner_engagement_fields f
        on f.engagement_id = p_engagement_id and f.code = q.target_field_code
      where q.is_active and (se.healthcare or not q.healthcare_only)), '[]'::jsonb),
    'answers', coalesce((select jsonb_object_agg(an.question_code, jsonb_build_object(
        'value', an.value, 'status', an.status, 'owner_comment', an.owner_comment,
        'approved_value', an.approved_value, 'approved_at', an.approved_at,
        'applied_field_code', an.applied_field_code, 'updated_at', an.updated_at,
        'updated_by_email', (select lower(u.email) from auth.users u where u.id = an.updated_by)))
      from public.client_onboarding_answers an where an.intake_id = i.id), '{}'::jsonb),
    'requests', coalesce((select jsonb_agg(jsonb_build_object(
        'id', r.id, 'question', r.question, 'question_code', r.question_code, 'task_id', r.task_id,
        'status', r.status, 'response', r.response, 'responded_at', r.responded_at,
        'created_at', r.created_at, 'closed_at', r.closed_at) order by r.created_at desc)
      from public.client_onboarding_requests r where r.engagement_id = p_engagement_id), '[]'::jsonb),
    'sender', (select jsonb_build_object('legal_name', s.legal_name, 'email', s.business_email, 'phone', s.business_phone)
               from public.owner_document_settings s where s.business_entity_id = se.business_entity_id),
    'milestones', public.client_onboarding_milestones(se.lifecycle_status, coalesce(i.status, 'not_started')));
end;
$$;

-- Owner review. p_decisions: [{"code": "...", "action": "approve"|"request_changes", "comment": "..."}]
-- Approving a mapped answer writes the engagement field through owner_set_engagement_field()
-- (same validation, activity and go-live gate as a manual owner edit). Tasks are never touched.
create or replace function public.owner_onboarding_review(p_engagement_id uuid, p_decisions jsonb, p_review_note text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare i record; d jsonb; an record; q public.client_onboarding_questions; f record; v_action text;
  v_comment text; v_applied int := 0; v_changes int := 0; v_approved int := 0; v_text text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_decisions is null or jsonb_typeof(p_decisions) <> 'array' or jsonb_array_length(p_decisions) = 0 then
    raise exception 'Keine Entscheidungen übergeben.';
  end if;
  select * into i from public.client_onboarding_intakes where engagement_id = p_engagement_id for update;
  if i.id is null then raise exception 'Für diese Einrichtung liegen keine Kundenangaben vor.'; end if;

  for d in select * from jsonb_array_elements(p_decisions) loop
    v_action := d->>'action';
    v_comment := nullif(btrim(coalesce(d->>'comment', '')), '');
    if v_action not in ('approve', 'request_changes') then raise exception 'Ungültige Entscheidung.'; end if;
    if v_comment is not null and length(v_comment) > 1000 then raise exception 'Kommentar zu lang.'; end if;
    select * into an from public.client_onboarding_answers
     where intake_id = i.id and question_code = d->>'code' for update;
    if an.id is null then raise exception 'Antwort % nicht gefunden.', d->>'code'; end if;
    select * into q from public.client_onboarding_questions where code = an.question_code;

    if v_action = 'request_changes' then
      if v_comment is null then
        raise exception 'Bitte erklären Sie dem Kunden, was bei „%" fehlt.', q.label;
      end if;
      update public.client_onboarding_answers set status = 'changes_requested', owner_comment = v_comment,
             updated_at = now() where id = an.id;
      v_changes := v_changes + 1;
      continue;
    end if;

    if an.value is null then raise exception '„%" ist leer und kann nicht bestätigt werden.', q.label; end if;
    if an.status = 'approved' and an.approved_value is not distinct from an.value then
      continue; -- idempotent re-approval
    end if;

    update public.client_onboarding_answers set status = 'approved', approved_value = an.value,
           approved_at = now(), approved_by = auth.uid(), owner_comment = v_comment, updated_at = now()
     where id = an.id;
    v_approved := v_approved + 1;

    if q.target_field_code is not null and q.kind <> 'hours' then
      select * into f from public.owner_engagement_fields
       where engagement_id = p_engagement_id and code = q.target_field_code;
      if f.id is not null and f.data_type in ('text', 'textarea', 'url', 'phone', 'number') then
        v_text := public.client_onboarding_answer_text(q, an.value);
        perform public.owner_set_engagement_field(f.id, jsonb_build_object('value', v_text));
        update public.client_onboarding_answers set applied_field_code = f.code where id = an.id;
        v_applied := v_applied + 1;
      end if;
    end if;
  end loop;

  update public.client_onboarding_intakes set
    status = case
      when exists (select 1 from public.client_onboarding_answers x where x.intake_id = i.id and x.status = 'changes_requested')
        then 'changes_requested'
      when not exists (select 1 from public.client_onboarding_answers x where x.intake_id = i.id and x.status <> 'approved')
        then 'approved'
      else status end,
    reviewed_at = now(), reviewed_by = auth.uid(),
    review_note = coalesce(nullif(btrim(coalesce(p_review_note, '')), ''), review_note),
    version = version + 1, updated_at = now()
  where id = i.id;

  perform public.owner_record_engagement_activity(p_engagement_id, 'client_intake_reviewed',
    format('Kundenangaben geprüft: %s bestätigt, %s mit Änderungswunsch, %s in Felder übernommen',
           v_approved, v_changes, v_applied), null, null);

  return jsonb_build_object('approved', v_approved, 'changes_requested', v_changes, 'applied_to_fields', v_applied,
    'intake_status', (select status from public.client_onboarding_intakes where id = i.id),
    'go_live', public.owner_engagement_go_live_blockers(p_engagement_id));
end;
$$;

create or replace function public.owner_onboarding_create_request(
  p_engagement_id uuid, p_question text, p_question_code text default null, p_task_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_q text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if not exists (select 1 from public.owner_service_engagements where id = p_engagement_id) then
    raise exception 'engagement not found';
  end if;
  v_q := btrim(coalesce(p_question, ''));
  if length(v_q) < 5 or length(v_q) > 1000 then
    raise exception 'Die Rückfrage muss zwischen 5 und 1000 Zeichen lang sein.';
  end if;
  if p_task_id is not null and not exists (
    select 1 from public.owner_engagement_tasks where id = p_task_id and engagement_id = p_engagement_id) then
    raise exception 'task not found';
  end if;
  insert into public.client_onboarding_requests (engagement_id, question, question_code, task_id, created_by)
  values (p_engagement_id, v_q, nullif(p_question_code, ''), p_task_id, auth.uid())
  returning id into v_id;
  -- A request tied to a task moves that task to "waiting for client" through the existing RPC.
  if p_task_id is not null then
    perform public.owner_set_engagement_task(p_task_id,
      jsonb_build_object('status', 'waiting_for_client', 'client_request', v_q));
  end if;
  perform public.owner_record_engagement_activity(p_engagement_id, 'client_request_created',
    'Rückfrage an den Kunden gestellt', p_task_id, null);
  return jsonb_build_object('id', v_id);
end;
$$;

create or replace function public.owner_onboarding_close_request(p_request_id uuid, p_outcome text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare r record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_outcome not in ('accepted', 'cancelled', 'reopen') then raise exception 'Ungültige Aktion.'; end if;
  select * into r from public.client_onboarding_requests where id = p_request_id for update;
  if r.id is null then raise exception 'request not found'; end if;
  update public.client_onboarding_requests set
    status = case when p_outcome = 'reopen' then 'open' else p_outcome end,
    closed_at = case when p_outcome = 'reopen' then null else now() end, updated_at = now()
  where id = p_request_id;
  perform public.owner_record_engagement_activity(r.engagement_id, 'client_request_' || p_outcome,
    case p_outcome when 'accepted' then 'Antwort des Kunden übernommen'
                   when 'cancelled' then 'Rückfrage zurückgezogen' else 'Rückfrage erneut geöffnet' end,
    r.task_id, null);
  return jsonb_build_object('id', p_request_id, 'status', case when p_outcome = 'reopen' then 'open' else p_outcome end);
end;
$$;

-- Reopens the intake so the customer can edit again (e.g. after an owner-side correction).
create or replace function public.owner_onboarding_reopen(p_engagement_id uuid, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  update public.client_onboarding_intakes set status = 'changes_requested',
         review_note = coalesce(nullif(btrim(coalesce(p_note, '')), ''), review_note),
         version = version + 1, updated_at = now()
   where engagement_id = p_engagement_id and status in ('submitted', 'approved');
  if not found then raise exception 'Die Kundenangaben sind bereits zur Bearbeitung offen.'; end if;
  perform public.owner_record_engagement_activity(p_engagement_id, 'client_intake_reopened',
    'Kundenangaben zur Bearbeitung wieder geöffnet', null, null);
  return jsonb_build_object('status', 'changes_requested');
end;
$$;

-- Step 1 of every send, called by the Edge Function WITH THE OWNER'S JWT. Validates the
-- recipient server-side, rate-limits, prepares portal access through the existing
-- client_invitations flow and reserves an idempotent message row.
create or replace function public.owner_onboarding_begin_send(
  p_engagement_id uuid, p_kind text, p_recipient_email text, p_recipient_name text,
  p_language text, p_subject text, p_intro text, p_is_test boolean, p_idempotency_key uuid,
  p_request_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare se record; c record; v_email text; v_owner_email text; m record; v_inv uuid; v_ci uuid;
  v_member boolean; v_recent int; v_day int; v_allowed boolean; v_org_name text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_idempotency_key is null then raise exception 'idempotency key required'; end if;

  -- Replay: the same key returns the same reservation, so a double click or a retried
  -- request can never produce a second email.
  select * into m from public.client_onboarding_messages where idempotency_key = p_idempotency_key;
  if m.id is not null then
    -- Only the original sender may replay its own reservation.
    if m.sent_by is distinct from auth.uid() then raise exception 'idempotency key already used'; end if;
    return jsonb_build_object('message_id', m.id, 'replay', true, 'status', m.status);
  end if;

  if p_kind not in ('invitation', 'reminder', 'request') then raise exception 'Ungültige Nachrichtenart.'; end if;
  if p_language not in ('de', 'en') then raise exception 'Ungültige Sprache.'; end if;
  if length(btrim(coalesce(p_subject, ''))) < 3 or length(p_subject) > 200 then
    raise exception 'Bitte geben Sie einen Betreff mit 3 bis 200 Zeichen an.';
  end if;
  if p_intro is not null and length(p_intro) > 2000 then raise exception 'Der Einleitungstext ist zu lang.'; end if;
  if p_recipient_name is not null and length(p_recipient_name) > 120 then raise exception 'Name zu lang.'; end if;

  select * into se from public.owner_service_engagements where id = p_engagement_id;
  if se.id is null or se.service_key <> 'ai_receptionist' then raise exception 'engagement not found'; end if;
  if not exists (select 1 from public.owner_customer_services where id = se.customer_service_id and state = 'active') then
    raise exception 'Die Leistung ist nicht aktiv.';
  end if;
  select * into c from public.owner_customers where id = se.customer_id;
  if p_request_id is not null and not exists (
    select 1 from public.client_onboarding_requests where id = p_request_id and engagement_id = p_engagement_id) then
    raise exception 'request not found';
  end if;

  select lower(u.email) into v_owner_email from auth.users u where u.id = auth.uid();
  if p_is_test then
    -- A test always goes to the signed-in owner, whatever the browser sent.
    v_email := v_owner_email;
  else
    v_email := lower(btrim(coalesce(p_recipient_email, '')));
    if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Ungültige E-Mail-Adresse.'; end if;
    if c.organization_id is null then
      raise exception 'Der Kunde ist noch mit keiner Portal-Organisation verknüpft.';
    end if;
    -- Recipient must belong to THIS customer: its own contact email, an active member, or an
    -- address the owner already invited to this organization. Nothing typed into a browser
    -- can address another tenant's people.
    v_allowed := v_email = lower(btrim(coalesce(c.email, '')))
      or exists (select 1 from public.organization_members om join auth.users u on u.id = om.user_id
                 where om.organization_id = c.organization_id and om.status = 'active' and lower(u.email) = v_email)
      or exists (select 1 from public.client_invitations ci
                 where ci.organization_id = c.organization_id and ci.email = v_email and ci.status = 'pending');
    if not v_allowed then
      raise exception 'Diese E-Mail-Adresse gehört nicht zu den Kontakten dieses Kunden.';
    end if;
  end if;

  select count(*) filter (where created_at > now() - interval '1 hour'),
         count(*) filter (where created_at > now() - interval '24 hours')
    into v_recent, v_day
  from public.client_onboarding_messages where engagement_id = p_engagement_id and not is_test;
  if not p_is_test and (v_recent >= 5 or v_day >= 15) then
    raise exception 'Zu viele Nachrichten an diesen Kunden in kurzer Zeit. Bitte versuchen Sie es später erneut.';
  end if;
  if p_is_test and (select count(*) from public.client_onboarding_messages
                    where sent_by = auth.uid() and is_test and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Zu viele Testnachrichten. Bitte versuchen Sie es später erneut.';
  end if;

  if not p_is_test and p_kind = 'invitation' then
    v_member := exists (select 1 from public.organization_members om join auth.users u on u.id = om.user_id
                        where om.organization_id = c.organization_id and om.status = 'active' and lower(u.email) = v_email);
    if not v_member then
      -- Reuse the existing portal invitation mechanism: one pending invitation per org+email.
      select id into v_ci from public.client_invitations
       where organization_id = c.organization_id and email = v_email and status = 'pending' for update;
      if v_ci is null then
        insert into public.client_invitations (organization_id, email, organization_role, status, invited_by, expires_at)
        values (c.organization_id, v_email, 'member', 'pending', auth.uid(), now() + interval '30 days')
        returning id into v_ci;
      else
        update public.client_invitations set expires_at = greatest(coalesce(expires_at, now()), now() + interval '30 days'),
               updated_at = now() where id = v_ci;
      end if;
    end if;
    update public.client_onboarding_invitations set status = 'superseded'
     where engagement_id = p_engagement_id and recipient_email = v_email and status = 'active';
    insert into public.client_onboarding_invitations
      (engagement_id, organization_id, recipient_email, recipient_name, client_invitation_id, expires_at, created_by)
    values (p_engagement_id, c.organization_id, v_email, nullif(btrim(coalesce(p_recipient_name, '')), ''),
            v_ci, now() + interval '30 days', auth.uid())
    returning id into v_inv;
    perform public.client_onboarding_ensure_intake(p_engagement_id);
  end if;

  insert into public.client_onboarding_messages
    (engagement_id, invitation_id, request_id, kind, is_test, recipient_email, recipient_name, language,
     subject, intro, idempotency_key, sent_by)
  values (p_engagement_id, v_inv, p_request_id, p_kind, p_is_test, v_email,
          nullif(btrim(coalesce(p_recipient_name, '')), ''), p_language, btrim(p_subject),
          nullif(btrim(coalesce(p_intro, '')), ''), p_idempotency_key, auth.uid())
  returning * into m;

  select name into v_org_name from public.organizations where id = c.organization_id;
  return jsonb_build_object('message_id', m.id, 'replay', false, 'status', m.status,
    'sender', (select jsonb_build_object('legal_name', s.legal_name, 'email', s.business_email, 'phone', s.business_phone)
               from public.owner_document_settings s where s.business_entity_id = se.business_entity_id),
    'language', p_language, 'subject', m.subject, 'intro', m.intro, 'recipient_name', m.recipient_name,
    'recipient_email', v_email, 'is_test', p_is_test, 'kind', p_kind,
    'company', coalesce(v_org_name, c.company),
    'is_member', coalesce(v_member, false),
    'request_question', (select question from public.client_onboarding_requests where id = p_request_id));
end;
$$;

-- Step 2, SERVICE ROLE ONLY: the Edge Function records what the provider answered. The
-- browser can never mark a message as sent.
create or replace function public.service_onboarding_complete_send(
  p_message_id uuid, p_accepted boolean, p_provider_message_id text, p_error_code text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare m record;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  select * into m from public.client_onboarding_messages where id = p_message_id for update;
  if m.id is null then raise exception 'message not found'; end if;
  if m.status = 'accepted' then
    return jsonb_build_object('message_id', m.id, 'status', m.status, 'already', true);
  end if;
  update public.client_onboarding_messages set
    status = case when p_accepted then 'accepted' else 'failed' end,
    provider_message_id = case when p_accepted then left(p_provider_message_id, 200) else provider_message_id end,
    error_code = case when p_accepted then null else left(coalesce(p_error_code, 'unknown'), 120) end,
    completed_at = now()
  where id = p_message_id;
  if not m.is_test then
    perform public.owner_record_engagement_activity(m.engagement_id,
      'client_message_' || case when p_accepted then 'accepted' else 'failed' end,
      case m.kind when 'invitation' then 'Onboarding-Einladung' when 'reminder' then 'Erinnerung' else 'Rückfrage' end
        || case when p_accepted then ' an den E-Mail-Anbieter übergeben' else ' konnte nicht versendet werden' end,
      null, null);
  end if;
  return jsonb_build_object('message_id', m.id, 'status', case when p_accepted then 'accepted' else 'failed' end);
end;
$$;

create or replace function public.owner_onboarding_revoke_invitation(p_invitation_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare inv record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into inv from public.client_onboarding_invitations where id = p_invitation_id for update;
  if inv.id is null then raise exception 'invitation not found'; end if;
  if inv.status <> 'active' then
    return jsonb_build_object('id', inv.id, 'status', inv.status, 'already', true);
  end if;
  update public.client_onboarding_invitations set status = 'revoked', revoked_at = now(), revoked_by = auth.uid()
   where id = inv.id;
  -- Revoke the portal invitation only while it is still pending. An already ACTIVE membership
  -- is managed under "Portalzugänge" and is deliberately not removed as a side effect here.
  update public.client_invitations set status = 'revoked', updated_at = now()
   where id = inv.client_invitation_id and status = 'pending';
  perform public.owner_record_engagement_activity(inv.engagement_id, 'client_invitation_revoked',
    'Onboarding-Einladung widerrufen: ' || inv.recipient_email, null, null);
  return jsonb_build_object('id', inv.id, 'status', 'revoked', 'already', false);
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Grants — explicit, fail-closed
-- -----------------------------------------------------------------------------
do $$
declare fn text;
begin
  -- Everything starts closed: Supabase default privileges grant EXECUTE to anon and
  -- authenticated directly, which revoking PUBLIC alone does not remove.
  foreach fn in array array[
    'public.client_onboarding_normalize_answer(public.client_onboarding_questions, jsonb)',
    'public.client_onboarding_answer_text(public.client_onboarding_questions, jsonb)',
    'public.client_onboarding_authorize(uuid, boolean)',
    'public.client_onboarding_ensure_intake(uuid)',
    'public.client_onboarding_milestones(text, text)',
    'public.client_onboarding_list()',
    'public.client_onboarding_get(uuid)',
    'public.client_onboarding_save(uuid, jsonb, integer, text)',
    'public.client_onboarding_submit(uuid, integer)',
    'public.client_onboarding_respond_request(uuid, text)',
    'public.owner_link_customer_organization(uuid, uuid)',
    'public.owner_onboarding_detail(uuid)',
    'public.owner_onboarding_review(uuid, jsonb, text)',
    'public.owner_onboarding_create_request(uuid, text, text, uuid)',
    'public.owner_onboarding_close_request(uuid, text)',
    'public.owner_onboarding_reopen(uuid, text)',
    'public.owner_onboarding_begin_send(uuid, text, text, text, text, text, text, boolean, uuid, uuid)',
    'public.service_onboarding_complete_send(uuid, boolean, text, text)',
    'public.owner_onboarding_revoke_invitation(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;

  -- Browser-callable entry points. Each authorizes internally (membership or is_platform_owner()).
  foreach fn in array array[
    'public.client_onboarding_list()',
    'public.client_onboarding_get(uuid)',
    'public.client_onboarding_save(uuid, jsonb, integer, text)',
    'public.client_onboarding_submit(uuid, integer)',
    'public.client_onboarding_respond_request(uuid, text)',
    'public.owner_link_customer_organization(uuid, uuid)',
    'public.owner_onboarding_detail(uuid)',
    'public.owner_onboarding_review(uuid, jsonb, text)',
    'public.owner_onboarding_create_request(uuid, text, text, uuid)',
    'public.owner_onboarding_close_request(uuid, text)',
    'public.owner_onboarding_reopen(uuid, text)',
    'public.owner_onboarding_begin_send(uuid, text, text, text, text, text, text, boolean, uuid, uuid)',
    'public.owner_onboarding_revoke_invitation(uuid)'
  ] loop
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;

-- Fail-closed verification: internal helpers and the service-only completion are never
-- client-executable; nothing is executable by anon.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname like 'client\_onboarding\_%' or p.proname like 'owner\_onboarding\_%'
           or p.proname in ('service_onboarding_complete_send', 'owner_link_customer_organization'))
  loop
    if has_function_privilege('anon', r.sig, 'execute') then
      raise exception 'client onboarding: % is executable by anon', r.sig;
    end if;
    if r.proname in ('client_onboarding_normalize_answer', 'client_onboarding_answer_text',
                     'client_onboarding_authorize', 'client_onboarding_ensure_intake',
                     'client_onboarding_milestones', 'service_onboarding_complete_send')
       and has_function_privilege('authenticated', r.sig, 'execute') then
      raise exception 'client onboarding: internal % is executable by authenticated', r.sig;
    end if;
  end loop;
end $$;

commit;
