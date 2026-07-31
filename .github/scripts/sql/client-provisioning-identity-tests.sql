-- =============================================================================
-- Client provisioning identity resolution tests (migration 20260731121000)
-- =============================================================================
-- Runs on the same throwaway database as client-provisioning-baseline-defect.sql,
-- which has already proven the defect real and then removed its own damage. The
-- platform-admin fixture (prov-admin@example.test) comes from that file.
--
-- Each scenario uses a DISTINCT company name so the scenarios cannot influence one
-- another through the candidate lookup — the one exception is the Pankofer sequence,
-- which is deliberately the production sequence and is asserted end to end.
-- =============================================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Helpers: run a provisioning call and capture either the result or the raised
-- code, so a test can assert the exact outcome rather than "it threw".
-- ---------------------------------------------------------------------------
create or replace function public.test_provision(
  p_company text,
  p_invite text,
  p_solution text default 'Standardloesung',
  p_project text default 'Standardprojekt',
  p_decision text default null,
  p_target uuid default null,
  p_primary_email text default null,
  p_website text default null,
  p_legal_name text default null
)
returns jsonb
language plpgsql
as $$
begin
  return public.provision_client_workspace_with_identity(
    gen_random_uuid(), p_company, p_legal_name, 'Kontaktperson', p_primary_email,
    null, p_website, null, null, null, 'lead', null, null, 'EUR', null, null,
    'ai_receptionist', p_project, 'active', null, null, null, null,
    p_solution, p_invite, 'owner', p_decision, p_target);
end;
$$;

create or replace function public.test_provision_error(
  p_company text,
  p_invite text,
  p_solution text default 'Standardloesung',
  p_project text default 'Standardprojekt',
  p_decision text default null,
  p_target uuid default null,
  p_primary_email text default null,
  p_website text default null,
  p_legal_name text default null
)
returns text
language plpgsql
as $$
begin
  perform public.test_provision(p_company, p_invite, p_solution, p_project,
                                p_decision, p_target, p_primary_email, p_website, p_legal_name);
  return null;
exception when others then
  return sqlerrm;
end;
$$;

-- Count of everything a reuse must NOT duplicate, for one organization.
create or replace function public.test_tree_counts(p_org uuid)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'accounts',     (select count(*) from public.client_accounts where organization_id = p_org),
    'contacts',     (select count(*) from public.client_contacts where organization_id = p_org),
    'engagements',  (select count(*) from public.client_engagements where organization_id = p_org),
    'solutions',    (select count(*) from public.organization_solutions where organization_id = p_org),
    'portal',       (select count(*) from public.organization_portal_settings where organization_id = p_org),
    'invitations',  (select count(*) from public.client_invitations where organization_id = p_org),
    'memberships',  (select count(*) from public.organization_members where organization_id = p_org),
    'primary_contacts', (select count(*) from public.client_contacts where organization_id = p_org and is_primary)
  );
$$;

do $$
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));
end;
$$;

-- ---------------------------------------------------------------------------
-- TEST: name normalization. Equality key, not a fuzzy matcher.
-- ---------------------------------------------------------------------------
do $$
declare
  v_pairs text[][] := array[
    array['Pankofer', 'pankofer'],
    array['PANKOFER GmbH', 'pankofer'],
    array['Pankofer GmbH & Co. KG', 'pankofer'],
    array['  pankofer  ', 'pankofer'],
    array['Müller & Söhne AG', 'muellersoehne'],
    array['Weiß Straße UG', 'weissstrasse'],
    array['Mueller & Soehne AG', 'muellersoehne'],
    array['Acme Ltd.', 'acme'],
    array['Nordwerk Technik GmbH', 'nordwerktechnik']
  ];
  v_i int;
  v_got text;
begin
  for v_i in 1 .. array_length(v_pairs, 1) loop
    v_got := public.normalize_client_identity_name(v_pairs[v_i][1]);
    if v_got is distinct from v_pairs[v_i][2] then
      raise exception 'TEST FAILED: normalize(%) = "%", expected "%"',
        v_pairs[v_i][1], v_got, v_pairs[v_i][2];
    end if;
  end loop;

  -- The property that actually matters: the two ways a German name gets typed
  -- must produce the SAME key.
  if public.normalize_client_identity_name('Müller & Söhne AG')
     is distinct from public.normalize_client_identity_name('Mueller und Soehne AG') then
    raise exception 'TEST FAILED: "Müller & Söhne AG" and "Mueller und Soehne AG" do not normalize together';
  end if;

  -- Different companies must NOT collapse together. This is the property that keeps
  -- normalization from becoming a merge machine.
  if public.normalize_client_identity_name('Pankofer')
     = public.normalize_client_identity_name('Pankofer Bau') then
    raise exception 'TEST FAILED: "Pankofer" and "Pankofer Bau" normalize to the same key';
  end if;
  if public.normalize_client_identity_name('Nordwerk Technik')
     = public.normalize_client_identity_name('Nordwerk Logistik') then
    raise exception 'TEST FAILED: two different Nordwerk companies normalize together';
  end if;
end;
$$;
\echo 'ok: company-name normalization folds noise and never collapses distinct companies'

-- ---------------------------------------------------------------------------
-- TEST: free-mail domains carry no identity. This is the single decision that
-- makes the Pankofer sequence stop instead of silently merging.
-- ---------------------------------------------------------------------------
do $$
begin
  if public.client_identity_email_domain('cogniiq4@gmail.com') is not null then
    raise exception 'TEST FAILED: gmail.com was treated as a corporate identity signal';
  end if;
  if public.client_identity_email_domain('a@gmx.de') is not null then
    raise exception 'TEST FAILED: gmx.de was treated as a corporate identity signal';
  end if;
  if public.client_identity_email_domain('v.graus@pankofer.de') is distinct from 'pankofer.de' then
    raise exception 'TEST FAILED: a corporate domain was not extracted';
  end if;
  if public.client_identity_email_domain('not-an-email') is not null then
    raise exception 'TEST FAILED: a malformed address produced a domain';
  end if;

  if public.client_identity_website_host('https://WWW.Pankofer.de/kontakt?x=1')
     is distinct from 'pankofer.de' then
    raise exception 'TEST FAILED: website host normalization is wrong (got %)',
      public.client_identity_website_host('https://WWW.Pankofer.de/kontakt?x=1');
  end if;
end;
$$;
\echo 'ok: free-mail domains corroborate nothing; corporate domains and hosts normalize'

-- ---------------------------------------------------------------------------
-- TEST: a genuinely new customer is provisioned exactly as before.
-- ---------------------------------------------------------------------------
do $$
declare v_res jsonb; v_counts jsonb;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_res := public.test_provision('Erstkunde GmbH', 'kontakt@erstkunde.de', 'Erstloesung', 'Erstprojekt');

  if (v_res->>'organization_id') is null then raise exception 'TEST FAILED: no organization created'; end if;
  if (v_res->>'reused_existing_organization')::boolean then
    raise exception 'TEST FAILED: a brand-new customer was reported as reused';
  end if;
  if (v_res->>'identity_match') <> 'new' then
    raise exception 'TEST FAILED: identity_match = % for a new customer', v_res->>'identity_match';
  end if;

  -- Every key the pre-fix version returned must still be present.
  foreach v_counts in array array[
    '"organization_id"'::jsonb, '"client_account_id"', '"client_contact_id"',
    '"engagement_id"', '"organization_solution_id"', '"instance_key"',
    '"invitation_id"', '"invitation_email"']
  loop
    if not (v_res ? (v_counts #>> '{}')) then
      raise exception 'TEST FAILED: the result no longer contains the key %', v_counts;
    end if;
  end loop;

  v_counts := public.test_tree_counts((v_res->>'organization_id')::uuid);
  if v_counts <> jsonb_build_object('accounts',1,'contacts',1,'engagements',1,'solutions',1,
                                    'portal',1,'invitations',1,'memberships',0,'primary_contacts',1) then
    raise exception 'TEST FAILED: unexpected tree for a new customer: %', v_counts;
  end if;
end;
$$;
\echo 'ok: a new customer is provisioned unchanged, with the same result shape'

-- ---------------------------------------------------------------------------
-- TEST (THE REGRESSION): the exact production Pankofer sequence.
--
-- Provision "Pankofer" with v.graus@pankofer.de, then again with a NEW random
-- idempotency key and cogniiq4@gmail.com. The pre-fix path created a second
-- organization here (proven by the baseline file). It must now STOP.
-- ---------------------------------------------------------------------------
do $$
declare
  v_first jsonb;
  v_msg text;
  v_orgs int;
  v_counts jsonb;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_first := public.test_provision('Pankofer', 'v.graus@pankofer.de', 'Pankofer Zentrale', 'Pankofer Zentrale');

  v_msg := public.test_provision_error('Pankofer', 'cogniiq4@gmail.com', 'Pankofer Zentrale', 'Pankofer Zentrale');
  if v_msg is distinct from 'organization_identity_conflict' then
    raise exception 'TEST FAILED: the second Pankofer request returned "%", expected organization_identity_conflict',
      coalesce(v_msg, '<it succeeded and created a duplicate>');
  end if;

  -- The decisive assertion: still ONE organization.
  select count(*) into v_orgs from public.organizations
  where public.normalize_client_identity_name(name) = public.normalize_client_identity_name('Pankofer');
  if v_orgs <> 1 then
    raise exception 'TEST FAILED: % Pankofer organizations exist, expected 1', v_orgs;
  end if;

  -- ...and the refused request left nothing behind at all.
  v_counts := public.test_tree_counts((v_first->>'organization_id')::uuid);
  if v_counts <> jsonb_build_object('accounts',1,'contacts',1,'engagements',1,'solutions',1,
                                    'portal',1,'invitations',1,'memberships',0,'primary_contacts',1) then
    raise exception 'TEST FAILED: the refused request left partial rows behind: %', v_counts;
  end if;

  -- Name variants reach the same verdict, so a re-typed "Pankofer GmbH" cannot
  -- sneak past the check.
  v_msg := public.test_provision_error('Pankofer GmbH', 'andere@gmail.com', 'Pankofer Zentrale', 'Pankofer Zentrale');
  if v_msg is distinct from 'organization_identity_conflict' then
    raise exception 'TEST FAILED: the legal-form variant returned "%", expected organization_identity_conflict',
      coalesce(v_msg, '<it succeeded>');
  end if;

  select count(*) into v_orgs from public.organizations
  where public.normalize_client_identity_name(name) = public.normalize_client_identity_name('Pankofer');
  if v_orgs <> 1 then
    raise exception 'TEST FAILED: % Pankofer organizations exist after the variant attempt, expected 1', v_orgs;
  end if;

  insert into public.client_provisioning_requests (idempotency_key, organization_id, result)
  values (gen_random_uuid(), (v_first->>'organization_id')::uuid, null)
  on conflict do nothing;
end;
$$;
\echo 'ok: REGRESSION — the production Pankofer sequence with different invitation emails creates ONE organization and demands a decision'

-- ---------------------------------------------------------------------------
-- TEST: a new idempotency key with the SAME invitation email converges silently,
-- and reuse duplicates nothing.
-- ---------------------------------------------------------------------------
do $$
declare
  v_first jsonb;
  v_again jsonb;
  v_counts jsonb;
  v_instance_before text;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_first := public.test_provision('Seewald Metall GmbH', 'buero@seewald-metall.de', 'Seewald Portal', 'Seewald Projekt');
  v_instance_before := v_first->>'instance_key';

  -- Same everything, brand-new idempotency key: a retry after a reload.
  v_again := public.test_provision('Seewald Metall GmbH', 'buero@seewald-metall.de', 'Seewald Portal', 'Seewald Projekt');

  if (v_again->>'organization_id') is distinct from (v_first->>'organization_id') then
    raise exception 'TEST FAILED: a retry with a new idempotency key created a second organization';
  end if;
  if not (v_again->>'reused_existing_organization')::boolean then
    raise exception 'TEST FAILED: convergence was not reported as a reuse';
  end if;
  if (v_again->>'identity_match') <> 'strong' then
    raise exception 'TEST FAILED: identity_match = %, expected strong', v_again->>'identity_match';
  end if;

  -- The portal URL must survive: a new instance_key would break every shared link.
  if (v_again->>'instance_key') is distinct from v_instance_before then
    raise exception 'TEST FAILED: reuse minted a new instance_key (% -> %), breaking existing portal links',
      v_instance_before, v_again->>'instance_key';
  end if;

  -- Nothing duplicated anywhere.
  v_counts := public.test_tree_counts((v_first->>'organization_id')::uuid);
  if v_counts <> jsonb_build_object('accounts',1,'contacts',1,'engagements',1,'solutions',1,
                                    'portal',1,'invitations',1,'memberships',0,'primary_contacts',1) then
    raise exception 'TEST FAILED: reuse duplicated part of the tree: %', v_counts;
  end if;

  -- The same ids, not merely the same counts.
  if (v_again->>'client_account_id') is distinct from (v_first->>'client_account_id')
     or (v_again->>'engagement_id') is distinct from (v_first->>'engagement_id')
     or (v_again->>'organization_solution_id') is distinct from (v_first->>'organization_solution_id')
     or (v_again->>'invitation_id') is distinct from (v_first->>'invitation_id')
     or (v_again->>'client_contact_id') is distinct from (v_first->>'client_contact_id') then
    raise exception 'TEST FAILED: reuse returned different child ids, so it created new rows';
  end if;
  if (v_again->>'invitation_outcome') <> 'existing_invitation_reused' then
    raise exception 'TEST FAILED: invitation_outcome = %, expected existing_invitation_reused',
      v_again->>'invitation_outcome';
  end if;
end;
$$;
\echo 'ok: a retry with a new idempotency key converges and duplicates nothing (account, engagement, solution, portal, invitation, membership)'

-- ---------------------------------------------------------------------------
-- TEST: a different invitation address at the SAME CORPORATE domain is strong
-- enough to converge — a colleague being invited is not a new company.
-- ---------------------------------------------------------------------------
do $$
declare v_first jsonb; v_again jsonb; v_counts jsonb;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_first := public.test_provision('Talhof Logistik GmbH', 'erst@talhof-logistik.de', 'Talhof Portal', 'Talhof Projekt');
  v_again := public.test_provision('Talhof Logistik GmbH', 'zweit@talhof-logistik.de', 'Talhof Portal', 'Talhof Projekt');

  if (v_again->>'organization_id') is distinct from (v_first->>'organization_id') then
    raise exception 'TEST FAILED: a colleague at the same corporate domain created a second organization';
  end if;
  if (v_again->>'identity_match') <> 'strong' then
    raise exception 'TEST FAILED: a corporate-domain match was not strong (got %)', v_again->>'identity_match';
  end if;

  -- A second invitation for a genuinely different address IS correct here — that is
  -- a new person, not a duplicate — but everything else must be reused.
  v_counts := public.test_tree_counts((v_first->>'organization_id')::uuid);
  if v_counts <> jsonb_build_object('accounts',1,'contacts',2,'engagements',1,'solutions',1,
                                    'portal',1,'invitations',2,'memberships',0,'primary_contacts',1) then
    raise exception 'TEST FAILED: unexpected tree after a colleague invitation: %', v_counts;
  end if;
  if (v_again->>'invitation_outcome') <> 'invitation_created' then
    raise exception 'TEST FAILED: invitation_outcome = %, expected invitation_created', v_again->>'invitation_outcome';
  end if;
end;
$$;
\echo 'ok: a colleague at the same corporate domain converges; only the new contact and invitation are added'

-- ---------------------------------------------------------------------------
-- TEST: two DIFFERENT free-mail addresses do NOT converge on domain alone.
-- Without this, every gmail.com customer sharing a company name would merge.
-- ---------------------------------------------------------------------------
do $$
declare v_first jsonb; v_msg text; v_orgs int;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_first := public.test_provision('Brunnbach Studio GmbH', 'eins@gmail.com', 'Brunnbach Portal', 'Brunnbach Projekt');
  v_msg := public.test_provision_error('Brunnbach Studio GmbH', 'zwei@gmail.com', 'Brunnbach Portal', 'Brunnbach Projekt');

  if v_msg is distinct from 'organization_identity_conflict' then
    raise exception 'TEST FAILED: two different gmail addresses returned "%", expected organization_identity_conflict',
      coalesce(v_msg, '<it merged them>');
  end if;

  select count(*) into v_orgs from public.organizations
  where public.normalize_client_identity_name(name) = public.normalize_client_identity_name('Brunnbach Studio GmbH');
  if v_orgs <> 1 then
    raise exception 'TEST FAILED: % Brunnbach organizations exist, expected 1', v_orgs;
  end if;
end;
$$;
\echo 'ok: a shared free-mail domain never converges two requests on its own'

-- ---------------------------------------------------------------------------
-- TEST: the two explicit owner decisions.
-- ---------------------------------------------------------------------------
do $$
declare
  v_first jsonb;
  v_reused jsonb;
  v_separate jsonb;
  v_msg text;
  v_orgs int;
  v_counts jsonb;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_first := public.test_provision('Kirchsteig Bau GmbH', 'eins@gmail.com', 'Kirchsteig Portal', 'Kirchsteig Projekt');

  -- Without a decision: refused.
  v_msg := public.test_provision_error('Kirchsteig Bau GmbH', 'zwei@gmail.com', 'Kirchsteig Portal', 'Kirchsteig Projekt');
  if v_msg is distinct from 'organization_identity_conflict' then
    raise exception 'TEST FAILED: expected a conflict before a decision, got "%"', coalesce(v_msg, '<none>');
  end if;

  -- DECISION 1: reuse. Converges on the named organization and duplicates nothing
  -- except the genuinely new contact + invitation.
  v_reused := public.test_provision('Kirchsteig Bau GmbH', 'zwei@gmail.com', 'Kirchsteig Portal',
                                    'Kirchsteig Projekt', 'reuse', (v_first->>'organization_id')::uuid);
  if (v_reused->>'organization_id') is distinct from (v_first->>'organization_id') then
    raise exception 'TEST FAILED: decision=reuse did not reuse the chosen organization';
  end if;
  if (v_reused->>'identity_match') <> 'explicit_reuse' then
    raise exception 'TEST FAILED: identity_match = %, expected explicit_reuse', v_reused->>'identity_match';
  end if;
  v_counts := public.test_tree_counts((v_first->>'organization_id')::uuid);
  if v_counts <> jsonb_build_object('accounts',1,'contacts',2,'engagements',1,'solutions',1,
                                    'portal',1,'invitations',2,'memberships',0,'primary_contacts',1) then
    raise exception 'TEST FAILED: decision=reuse duplicated part of the tree: %', v_counts;
  end if;

  -- A reuse target that was never a candidate is refused: reuse is a choice between
  -- what the owner was shown, not a free-form attach.
  v_msg := public.test_provision_error('Kirchsteig Bau GmbH', 'drei@gmail.com', 'Kirchsteig Portal',
                                       'Kirchsteig Projekt', 'reuse', gen_random_uuid());
  if v_msg is distinct from 'reuse_target_not_a_candidate' then
    raise exception 'TEST FAILED: an arbitrary reuse target returned "%", expected reuse_target_not_a_candidate',
      coalesce(v_msg, '<it was accepted>');
  end if;

  -- ...and reuse without a target is refused rather than guessing.
  v_msg := public.test_provision_error('Kirchsteig Bau GmbH', 'drei@gmail.com', 'Kirchsteig Portal',
                                       'Kirchsteig Projekt', 'reuse', null);
  if v_msg is distinct from 'reuse_requires_target_organization' then
    raise exception 'TEST FAILED: reuse without a target returned "%", expected reuse_requires_target_organization',
      coalesce(v_msg, '<it was accepted>');
  end if;

  -- DECISION 2: create a separate organization deliberately. Two unrelated companies
  -- may share a name, and the owner is allowed to say so.
  v_separate := public.test_provision('Kirchsteig Bau GmbH', 'vier@gmail.com', 'Kirchsteig Portal',
                                      'Kirchsteig Projekt', 'create_separate');
  if (v_separate->>'organization_id') = (v_first->>'organization_id') then
    raise exception 'TEST FAILED: decision=create_separate reused the existing organization';
  end if;
  if (v_separate->>'identity_match') <> 'explicit_separate' then
    raise exception 'TEST FAILED: identity_match = %, expected explicit_separate', v_separate->>'identity_match';
  end if;

  select count(*) into v_orgs from public.organizations
  where public.normalize_client_identity_name(name) = public.normalize_client_identity_name('Kirchsteig Bau GmbH');
  if v_orgs <> 2 then
    raise exception 'TEST FAILED: % Kirchsteig organizations exist after a deliberate split, expected 2', v_orgs;
  end if;

  -- An invalid decision value is rejected outright rather than silently ignored,
  -- which would fall back to "create" and reintroduce the defect.
  v_msg := public.test_provision_error('Kirchsteig Bau GmbH', 'fuenf@gmail.com', 'Kirchsteig Portal',
                                       'Kirchsteig Projekt', 'merge');
  if v_msg is distinct from 'invalid_identity_decision' then
    raise exception 'TEST FAILED: an unknown decision returned "%", expected invalid_identity_decision',
      coalesce(v_msg, '<it was accepted>');
  end if;
end;
$$;
\echo 'ok: reuse and create_separate both work, and an unrecognised or unsupported decision is refused'

-- ---------------------------------------------------------------------------
-- TEST: an ambiguous strong match (more than one corroborated candidate) also
-- stops rather than picking one.
-- ---------------------------------------------------------------------------
do $$
declare v_a jsonb; v_b jsonb; v_msg text;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_a := public.test_provision('Doppelhof AG', 'eins@doppelhof.de', 'Doppelhof Portal', 'Doppelhof Projekt');
  -- A deliberate split creates a SECOND organization that also carries the corporate
  -- domain, so the next request has two corroborated candidates.
  v_b := public.test_provision('Doppelhof AG', 'zwei@doppelhof.de', 'Doppelhof Portal',
                               'Doppelhof Projekt', 'create_separate');
  if (v_b->>'organization_id') = (v_a->>'organization_id') then
    raise exception 'TEST SETUP FAILED: the deliberate split did not create a second organization';
  end if;

  v_msg := public.test_provision_error('Doppelhof AG', 'drei@doppelhof.de', 'Doppelhof Portal', 'Doppelhof Projekt');
  if v_msg is distinct from 'organization_identity_conflict' then
    raise exception 'TEST FAILED: two corroborated candidates returned "%", expected organization_identity_conflict',
      coalesce(v_msg, '<it picked one arbitrarily>');
  end if;
end;
$$;
\echo 'ok: an ambiguous strong match refuses to pick, instead of merging arbitrarily'

-- ---------------------------------------------------------------------------
-- TEST: reuse never touches memberships, never re-invites an existing member, and
-- never pushes an ACTIVE organization back to pending.
-- ---------------------------------------------------------------------------
do $$
declare
  v_first jsonb;
  v_again jsonb;
  v_org uuid;
  v_member uuid := gen_random_uuid();
  v_status text;
  v_counts jsonb;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_first := public.test_provision('Ammersee Werk GmbH', 'chef@ammersee-werk.de', 'Ammersee Portal', 'Ammersee Projekt');
  v_org := (v_first->>'organization_id')::uuid;

  -- Simulate the invitation having been accepted: the org goes active and the person
  -- becomes a member. This is precisely the state the second Pankofer invitation
  -- was accepted into.
  insert into auth.users (id, email, email_confirmed_at) values (v_member, 'chef@ammersee-werk.de', now());
  insert into public.profiles (id, email, full_name) values (v_member, 'chef@ammersee-werk.de', 'Chef')
  on conflict (id) do update set email = excluded.email;
  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_org, v_member, 'owner', 'active');
  update public.organizations set status = 'active' where id = v_org;
  update public.client_invitations set status = 'accepted', accepted_at = now(), accepted_user_id = v_member
  where organization_id = v_org;

  v_again := public.test_provision('Ammersee Werk GmbH', 'chef@ammersee-werk.de', 'Ammersee Portal', 'Ammersee Projekt');

  if (v_again->>'organization_id')::uuid is distinct from v_org then
    raise exception 'TEST FAILED: re-provisioning an active customer created a second organization';
  end if;

  select status::text into v_status from public.organizations where id = v_org;
  if v_status <> 'active' then
    raise exception 'TEST FAILED: reuse pushed an ACTIVE organization back to %, revoking live portal access', v_status;
  end if;

  v_counts := public.test_tree_counts(v_org);
  if v_counts <> jsonb_build_object('accounts',1,'contacts',1,'engagements',1,'solutions',1,
                                    'portal',1,'invitations',1,'memberships',1,'primary_contacts',1) then
    raise exception 'TEST FAILED: reuse against an active customer changed the tree: %', v_counts;
  end if;
  if (v_again->>'invitation_outcome') <> 'existing_invitation_reused' then
    raise exception 'TEST FAILED: invitation_outcome = %, expected the accepted invitation to be reused',
      v_again->>'invitation_outcome';
  end if;

  -- And with the accepted invitation removed, an existing MEMBER must still not be
  -- handed a fresh live invite link.
  delete from public.client_invitations where organization_id = v_org;
  v_again := public.test_provision('Ammersee Werk GmbH', 'chef@ammersee-werk.de', 'Ammersee Portal', 'Ammersee Projekt');
  if (v_again->>'invitation_outcome') <> 'skipped_existing_member' then
    raise exception 'TEST FAILED: an existing active member was issued a new invitation (outcome %)',
      v_again->>'invitation_outcome';
  end if;
  if (select count(*) from public.client_invitations where organization_id = v_org) <> 0 then
    raise exception 'TEST FAILED: a redundant invitation row was created for an existing member';
  end if;
end;
$$;
\echo 'ok: reuse leaves memberships and organization status alone, and never re-invites an existing member'

-- ---------------------------------------------------------------------------
-- TEST: NULL-only backfill. A later provisioning form may ADD a missing field and
-- may never overwrite a corrected one.
-- ---------------------------------------------------------------------------
do $$
declare v_first jsonb; v_org uuid; v_legal text; v_phone text; v_industry text;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_first := public.test_provision('Rehberg Werk GmbH', 'buero@rehberg-werk.de', 'Rehberg Portal', 'Rehberg Projekt');
  v_org := (v_first->>'organization_id')::uuid;

  -- The owner corrects the CRM afterwards.
  update public.client_accounts
     set legal_name = 'Rehberg Werk GmbH & Co. KG', phone = '+49 89 1234'
   where organization_id = v_org;

  -- A re-provision supplies a DIFFERENT legal name and no phone, plus an industry
  -- that was previously missing.
  perform public.provision_client_workspace_with_identity(
    gen_random_uuid(), 'Rehberg Werk GmbH', 'Falscher Name AG', 'Kontaktperson', null,
    null, null, 'Maschinenbau', null, null, 'lead', null, null, 'EUR', null, null,
    'ai_receptionist', 'Rehberg Projekt', 'active', null, null, null, null,
    'Rehberg Portal', 'buero@rehberg-werk.de', 'owner', null, null);

  select legal_name, phone, industry into v_legal, v_phone, v_industry
  from public.client_accounts where organization_id = v_org;

  if v_legal <> 'Rehberg Werk GmbH & Co. KG' then
    raise exception 'TEST FAILED: a corrected legal_name was overwritten with "%"', v_legal;
  end if;
  if v_phone <> '+49 89 1234' then
    raise exception 'TEST FAILED: a corrected phone number was overwritten with "%"', coalesce(v_phone, '<null>');
  end if;
  if v_industry is distinct from 'Maschinenbau' then
    raise exception 'TEST FAILED: a previously missing industry was not backfilled (got %)', coalesce(v_industry, '<null>');
  end if;
end;
$$;
\echo 'ok: reuse backfills only NULL CRM fields and never overwrites corrected data'

-- ---------------------------------------------------------------------------
-- TEST: a genuinely different company with no shared signal still gets its own
-- organization. The fix must not become a merge machine.
-- ---------------------------------------------------------------------------
do $$
declare v_a jsonb; v_b jsonb;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_a := public.test_provision('Fichtenau Technik GmbH', 'a@fichtenau-technik.de', 'Fichtenau Portal', 'Fichtenau Projekt');
  v_b := public.test_provision('Lindenau Technik GmbH', 'b@lindenau-technik.de', 'Lindenau Portal', 'Lindenau Projekt');

  if (v_a->>'organization_id') = (v_b->>'organization_id') then
    raise exception 'TEST FAILED: two different companies were merged into one organization';
  end if;
  if (v_b->>'identity_match') <> 'new' then
    raise exception 'TEST FAILED: an unrelated company matched an existing one (%)', v_b->>'identity_match';
  end if;
end;
$$;
\echo 'ok: unrelated companies still get their own organizations'

-- ---------------------------------------------------------------------------
-- TEST: the same idempotency key still replays without doing anything twice.
-- ---------------------------------------------------------------------------
do $$
declare v_key uuid := gen_random_uuid(); v_a jsonb; v_b jsonb; v_counts jsonb;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_a := public.provision_client_workspace_with_identity(
    v_key, 'Waldkirch Handel GmbH', null, 'K', null, null, null, null, null, null, 'lead',
    null, null, 'EUR', null, null, 'ai_receptionist', 'Waldkirch Projekt', 'active',
    null, null, null, null, 'Waldkirch Portal', 'a@waldkirch-handel.de', 'owner', null, null);
  v_b := public.provision_client_workspace_with_identity(
    v_key, 'Waldkirch Handel GmbH', null, 'K', null, null, null, null, null, null, 'lead',
    null, null, 'EUR', null, null, 'ai_receptionist', 'Waldkirch Projekt', 'active',
    null, null, null, null, 'Waldkirch Portal', 'a@waldkirch-handel.de', 'owner', null, null);

  if v_a <> v_b then
    raise exception 'TEST FAILED: replaying an idempotency key returned a different result';
  end if;
  v_counts := public.test_tree_counts((v_a->>'organization_id')::uuid);
  if v_counts <> jsonb_build_object('accounts',1,'contacts',1,'engagements',1,'solutions',1,
                                    'portal',1,'invitations',1,'memberships',0,'primary_contacts',1) then
    raise exception 'TEST FAILED: an idempotency-key replay changed the tree: %', v_counts;
  end if;
end;
$$;
\echo 'ok: idempotency-key replay still returns the original result and creates nothing'

-- ---------------------------------------------------------------------------
-- TEST: the ORIGINAL signature is unchanged and can no longer duplicate either.
-- A stale browser tab or a queued retry calls this one.
-- ---------------------------------------------------------------------------
do $$
declare v_first jsonb; v_threw boolean := false; v_orgs int; v_args text;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_first := public.provision_client_workspace(
    gen_random_uuid(), 'Altmuehl Service GmbH', null, 'K', null, null, null, null, null, null,
    'lead', null, null, 'EUR', null, null, 'ai_receptionist', 'Altmuehl Projekt', 'active',
    null, null, null, null, 'Altmuehl Portal', 'a@altmuehl-service.de', 'owner');

  begin
    perform public.provision_client_workspace(
      gen_random_uuid(), 'Altmuehl Service GmbH', null, 'K', null, null, null, null, null, null,
      'lead', null, null, 'EUR', null, null, 'ai_receptionist', 'Altmuehl Projekt', 'active',
      null, null, null, null, 'Altmuehl Portal', 'anders@gmail.com', 'owner');
  exception when others then
    if sqlerrm <> 'organization_identity_conflict' then
      raise exception 'TEST FAILED: the legacy signature raised "%", expected organization_identity_conflict', sqlerrm;
    end if;
    v_threw := true;
  end;

  if not v_threw then
    raise exception 'TEST FAILED: the legacy signature still created a duplicate organization';
  end if;

  select count(*) into v_orgs from public.organizations
  where public.normalize_client_identity_name(name) = public.normalize_client_identity_name('Altmuehl Service GmbH');
  if v_orgs <> 1 then
    raise exception 'TEST FAILED: % Altmuehl organizations exist, expected 1', v_orgs;
  end if;

  -- Exactly one overload, with the exact original argument list INCLUDING parameter
  -- names: PostgREST dispatches on named arguments, so a renamed parameter breaks
  -- every caller just as surely as a changed type would.
  if (select count(*) from pg_proc p
      where p.pronamespace = 'public'::regnamespace
        and p.proname = 'provision_client_workspace') <> 1 then
    raise exception 'TEST FAILED: provision_client_workspace has more than one overload';
  end if;

  select pg_get_function_identity_arguments(p.oid) into v_args
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace and p.proname = 'provision_client_workspace';

  if v_args <> 'p_idempotency_key uuid, p_display_name text, p_legal_name text, '
               || 'p_primary_contact_name text, p_primary_email text, p_phone text, '
               || 'p_website text, p_industry text, p_address text, p_lead_source text, '
               || 'p_lifecycle_status text, p_internal_notes text, p_internal_owner text, '
               || 'p_currency text, p_estimated_total_budget_cents bigint, '
               || 'p_estimated_monthly_value_cents bigint, p_catalog_key text, '
               || 'p_project_name text, p_engagement_status text, p_total_budget_cents bigint, '
               || 'p_setup_fee_cents bigint, p_recurring_fee_cents bigint, '
               || 'p_target_go_live_date date, p_solution_display_name text, '
               || 'p_invitation_email text, p_organization_role organization_role' then
    raise exception 'TEST FAILED: provision_client_workspace identity signature changed to (%)', v_args;
  end if;
end;
$$;
\echo 'ok: the original signature is byte-identical and can no longer create a duplicate'

-- ---------------------------------------------------------------------------
-- TEST: grants. Nothing new is reachable by anon; the admin gate really holds.
-- ---------------------------------------------------------------------------
do $$
declare v_fn text;
begin
  foreach v_fn in array array[
    'provision_client_workspace', 'provision_client_workspace_with_identity',
    'find_client_organization_candidates', 'normalize_client_identity_name',
    'client_identity_email_domain', 'client_identity_website_host']
  loop
    if exists (
      select 1 from pg_proc p
      where p.pronamespace = 'public'::regnamespace and p.proname = v_fn
        and has_function_privilege('anon', p.oid, 'EXECUTE')
    ) then
      raise exception 'TEST FAILED: % is executable by anon', v_fn;
    end if;
    if not exists (
      select 1 from pg_proc p
      where p.pronamespace = 'public'::regnamespace and p.proname = v_fn
        and has_function_privilege('authenticated', p.oid, 'EXECUTE')
    ) then
      raise exception 'TEST FAILED: % is not executable by authenticated', v_fn;
    end if;
  end loop;
end;
$$;
\echo 'ok: identity functions are admin-callable and unreachable by anon'

-- ---------------------------------------------------------------------------
-- TEST: a non-admin cannot provision or enumerate candidates.
-- ---------------------------------------------------------------------------
do $$
declare v_outsider uuid := gen_random_uuid(); v_threw boolean;
begin
  insert into auth.users (id, email, email_confirmed_at) values (v_outsider, 'outsider@example.test', now());
  insert into public.profiles (id, email, full_name) values (v_outsider, 'outsider@example.test', 'Outsider')
  on conflict (id) do nothing;

  perform public.test_become(v_outsider);

  v_threw := false;
  begin
    perform public.test_provision('Heimstetten Werk GmbH', 'a@heimstetten-werk.de');
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: a non-admin provisioned a workspace'; end if;

  v_threw := false;
  begin
    perform * from public.find_client_organization_candidates('Pankofer');
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: a non-admin enumerated organization candidates'; end if;

  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));
end;
$$;
\echo 'ok: provisioning and candidate discovery remain platform-admin only'

-- ---------------------------------------------------------------------------
-- TEST: the conflict carries the candidate list, so the owner UI can present a
-- real choice instead of a dead end.
-- ---------------------------------------------------------------------------
do $$
declare v_first jsonb; v_detail text; v_parsed jsonb;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_first := public.test_provision('Osterberg Bau GmbH', 'eins@gmail.com', 'Osterberg Portal', 'Osterberg Projekt');

  begin
    perform public.test_provision('Osterberg Bau GmbH', 'zwei@gmail.com', 'Osterberg Portal', 'Osterberg Projekt');
    -- No exception: leave v_detail null and let the assertion below report it,
    -- rather than raising inside a block whose own handler would swallow it.
    v_detail := null;
  exception when unique_violation then
    get stacked diagnostics v_detail = pg_exception_detail;
  end;

  if coalesce(v_detail, '') = '' then
    raise exception 'TEST FAILED: the second request either succeeded or carried no candidate list, so the owner cannot choose';
  end if;

  v_parsed := v_detail::jsonb;
  if jsonb_typeof(v_parsed) <> 'array' or jsonb_array_length(v_parsed) < 1 then
    raise exception 'TEST FAILED: the candidate detail is not a non-empty array: %', v_detail;
  end if;
  if (v_parsed->0->>'organization_id') is distinct from (v_first->>'organization_id') then
    raise exception 'TEST FAILED: the candidate list does not name the existing organization: %', v_detail;
  end if;
  if (v_parsed->0->>'match_strength') <> 'name_only' then
    raise exception 'TEST FAILED: the candidate was reported as %, expected name_only', v_parsed->0->>'match_strength';
  end if;
  if not (v_parsed->0->>'organization_name') = 'Osterberg Bau GmbH' then
    raise exception 'TEST FAILED: the candidate list omits the organization name: %', v_detail;
  end if;
end;
$$;
\echo 'ok: the conflict carries the candidate list the owner needs to decide'

drop function public.test_provision_error(text, text, text, text, text, uuid, text, text, text);
drop function public.test_provision(text, text, text, text, text, uuid, text, text, text);
drop function public.test_tree_counts(uuid);

select 'client provisioning identity tests: ALL PASSED' as result;
