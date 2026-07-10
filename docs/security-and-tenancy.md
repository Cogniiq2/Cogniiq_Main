# Security and Tenancy Foundation

Supabase Auth is the identity source. Supabase RLS, table grants, column grants, and guard triggers are the authorization boundary. Frontend route guards are only UX.

## Core Tables

- `profiles`: one row per `auth.users` user. `platform_role` is database-owned.
- `organizations`: tenant root for customer-owned product data. `slug` is display/routing metadata, not a security boundary.
- `organization_members`: tenant role membership.

New Auth users are provisioned as `customer` by the auth trigger. Existing Auth users are backfilled by the Phase 0.1 hardening migration. Signup metadata is never allowed to set `platform_role`.

## Role Boundaries

Platform roles:

- `customer`
- `cogniiq_admin`
- `cogniiq_owner`

Organization roles:

- `owner`
- `admin`
- `member`
- `viewer`

Organization roles never grant Cogniiq platform access. Platform role changes must happen only through manual database maintenance or a trusted backend using the service role key server-side.

## Protected Fields

These fields are not browser-writable:

- `profiles.id`, `profiles.email`, `profiles.platform_role`, profile audit timestamps
- `organizations.id`, `organizations.status`, `organizations.created_by`, organization audit timestamps
- membership identity fields: `id`, `organization_id`, `user_id`, `created_at`
- future billing, Stripe, Vapi, n8n, usage, lifecycle, and consent fields

Customers may update only personal profile fields: `full_name`, `avatar_url`, `phone`.

Organization owners/admins may update only basic organization display metadata currently granted by column privileges: `name`, `slug`.

Deleting a profile is also guarded: the database blocks deletion of the final `cogniiq_owner` and the final active owner of any organization. Transfer ownership before deleting Auth users with owner responsibilities.

## UUID-Based Platform Role Procedures

Run these only in the Supabase SQL editor or another trusted database maintenance session. Do not place personal emails or platform roles in migrations.

### Resolve The Intended User

First inspect the Auth user by email and copy the exact UUID:

```sql
select id, email, created_at, last_sign_in_at
from auth.users
where lower(email) = lower('PERSON_EMAIL_HERE');
```

Proceed only when this returns exactly one intended row.

### Assign First `cogniiq_owner`

```sql
begin;

update public.profiles
set platform_role = 'cogniiq_owner'
where id = 'AUTH_USER_UUID_HERE'::uuid;

select id, email, platform_role
from public.profiles
where id = 'AUTH_USER_UUID_HERE'::uuid;

commit;
```

### Assign `cogniiq_admin`

```sql
begin;

update public.profiles
set platform_role = 'cogniiq_admin'
where id = 'AUTH_USER_UUID_HERE'::uuid
  and exists (
    select 1
    from public.profiles
    where platform_role = 'cogniiq_owner'
  );

select id, email, platform_role
from public.profiles
where id = 'AUTH_USER_UUID_HERE'::uuid;

commit;
```

### Revoke Admin Access

```sql
begin;

update public.profiles
set platform_role = 'customer'
where id = 'AUTH_USER_UUID_HERE'::uuid
  and platform_role = 'cogniiq_admin';

commit;
```

### Transfer Owner Access

```sql
begin;

update public.profiles
set platform_role = 'cogniiq_owner'
where id = 'NEW_OWNER_AUTH_USER_UUID'::uuid;

select count(*) as owner_count
from public.profiles
where platform_role = 'cogniiq_owner';

-- Run only after verifying owner_count is at least 2.
update public.profiles
set platform_role = 'customer'
where id = 'OLD_OWNER_AUTH_USER_UUID'::uuid
  and platform_role = 'cogniiq_owner'
  and (
    select count(*)
    from public.profiles
    where platform_role = 'cogniiq_owner'
  ) > 1;

commit;
```

## Future Tenant Table Pattern

Every customer-owned product table should include:

```sql
organization_id uuid not null references public.organizations(id) on delete cascade,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Policies should generally follow:

```sql
create policy "example_select_org_members"
  on public.example_table for select to authenticated
  using (
    public.is_platform_admin()
    or public.is_organization_member(organization_id)
  );
```

## Backend Automation

Stripe, Vapi, n8n, Oura, and research workflows must write protected tenant data through one of:

- verified Supabase Edge Function using the service role key server-side only
- fixed-destination workflow webhook called by backend code, not the browser
- narrowly scoped security-definer database function with explicit authorization checks

Do not create generic proxy functions that accept arbitrary destination URLs.

## Existing Direct n8n Exposure

Current browser-to-n8n calls are centralized in `src/config/externalEndpoints.ts`, but the webhook URLs remain public browser destinations:

- `submit-contact` should replace contact form submissions.
- `submit-faq-question` should replace FAQ modal submissions.
- `submit-receptionist-demo` should replace receptionist demo submissions.

Each future Edge Function needs fixed destination, schema validation, method restrictions, request-size limits, normalized errors, safe logging, bot/spam protection, and rate limiting.

## Deployment Order

1. Take a Supabase backup or snapshot of Auth users plus affected public tables.
2. Inspect existing `auth.users` rows and confirm expected owner/admin accounts exist.
3. Apply migrations in local or staging first, including the Phase 0.1 hardening migration.
4. Verify `public.profiles` has exactly one row for each intended Auth user.
5. Assign the first `cogniiq_owner` using the UUID procedure above.
6. Run `supabase/tests/phase0_rls_verification.sql` with real staging Auth user UUIDs.
7. Confirm `/admin`, `/admin/execution`, and `/admin/#/oura-analytics` work for the owner.
8. Deploy frontend authentication/admin changes.
9. Test public pages, `/app`, `/app/login`, `/app/reset-password`, and `/admin` direct navigation.
10. Monitor Supabase database, Auth, and Edge Function logs.
11. Roll back frontend first if owner access fails; restore database snapshot only if the migration caused confirmed data or access corruption.

Do not remove the old admin access path in production before a valid platform owner is provisioned and tested.

## Required Supabase Auth URL Settings

Use the actual production and local domains configured in the Supabase dashboard:

- Site URL: production Cogniiq site origin.
- Allowed redirect URL: `https://cogniiq.de/app`
- Allowed redirect URL: `https://cogniiq.de/app/reset-password`
- Allowed redirect URL: `http://localhost:5173/app`
- Allowed redirect URL: `http://localhost:5173/app/reset-password`

If production uses another canonical host, add that host explicitly instead of relying on wildcards.
