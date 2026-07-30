create table if not exists public.cogniiq_receptionist_leads (
  id bigint generated always as identity primary key,
  practice_name text not null,
  specialty text,
  contact_person text,
  city text,
  street_address text,
  postal_code text,
  country text default 'DE',
  phone text,
  email text,
  website text,
  google_rating numeric,
  review_count integer,
  fit_notes text,
  fit_score integer,
  outreach_channel text check (outreach_channel in ('email','phone')),
  sourced_date date not null default current_date,
  status text not null default 'new',
  unique (website)
);
create index if not exists idx_cogniiq_leads_email on public.cogniiq_receptionist_leads (lower(email));
create index if not exists idx_cogniiq_leads_phone on public.cogniiq_receptionist_leads (phone);
