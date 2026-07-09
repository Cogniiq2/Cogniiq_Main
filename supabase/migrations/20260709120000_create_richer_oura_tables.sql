create extension if not exists pgcrypto;

create table if not exists public.oura_connections (
  id uuid primary key default gen_random_uuid(),
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.oura_daily_sleep (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  score numeric,
  raw jsonb,
  synced_at timestamptz default now()
);

alter table public.oura_daily_sleep add column if not exists connection_id uuid references public.oura_connections(id) on delete cascade;
alter table public.oura_daily_sleep add column if not exists day date;
alter table public.oura_daily_sleep add column if not exists score numeric;
alter table public.oura_daily_sleep add column if not exists raw jsonb;
alter table public.oura_daily_sleep add column if not exists synced_at timestamptz default now();
alter table public.oura_daily_sleep add column if not exists contributors jsonb;
alter table public.oura_daily_sleep add column if not exists total_sleep_duration integer;
alter table public.oura_daily_sleep add column if not exists time_in_bed integer;
alter table public.oura_daily_sleep add column if not exists efficiency numeric;
alter table public.oura_daily_sleep add column if not exists latency integer;
alter table public.oura_daily_sleep add column if not exists rem_sleep_duration integer;
alter table public.oura_daily_sleep add column if not exists deep_sleep_duration integer;
alter table public.oura_daily_sleep add column if not exists light_sleep_duration integer;
alter table public.oura_daily_sleep add column if not exists awake_time integer;
alter table public.oura_daily_sleep add column if not exists restfulness numeric;
alter table public.oura_daily_sleep add column if not exists average_hrv numeric;
alter table public.oura_daily_sleep add column if not exists average_heart_rate numeric;
alter table public.oura_daily_sleep add column if not exists lowest_heart_rate numeric;
alter table public.oura_daily_sleep add column if not exists respiratory_rate numeric;
alter table public.oura_daily_sleep add column if not exists temperature_deviation numeric;
create unique index if not exists oura_daily_sleep_connection_day_idx on public.oura_daily_sleep(connection_id, day);

create table if not exists public.oura_daily_readiness (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  score numeric,
  raw jsonb,
  synced_at timestamptz default now()
);

alter table public.oura_daily_readiness add column if not exists connection_id uuid references public.oura_connections(id) on delete cascade;
alter table public.oura_daily_readiness add column if not exists day date;
alter table public.oura_daily_readiness add column if not exists score numeric;
alter table public.oura_daily_readiness add column if not exists raw jsonb;
alter table public.oura_daily_readiness add column if not exists synced_at timestamptz default now();
alter table public.oura_daily_readiness add column if not exists contributors jsonb;
alter table public.oura_daily_readiness add column if not exists temperature_deviation numeric;
alter table public.oura_daily_readiness add column if not exists hrv_balance numeric;
alter table public.oura_daily_readiness add column if not exists recovery_index numeric;
alter table public.oura_daily_readiness add column if not exists resting_heart_rate_score numeric;
alter table public.oura_daily_readiness add column if not exists body_temperature numeric;
alter table public.oura_daily_readiness add column if not exists previous_day_activity numeric;
alter table public.oura_daily_readiness add column if not exists sleep_balance numeric;
alter table public.oura_daily_readiness add column if not exists activity_balance numeric;
create unique index if not exists oura_daily_readiness_connection_day_idx on public.oura_daily_readiness(connection_id, day);

create table if not exists public.oura_daily_activity (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  score numeric,
  steps integer,
  raw jsonb,
  synced_at timestamptz default now()
);

alter table public.oura_daily_activity add column if not exists connection_id uuid references public.oura_connections(id) on delete cascade;
alter table public.oura_daily_activity add column if not exists day date;
alter table public.oura_daily_activity add column if not exists score numeric;
alter table public.oura_daily_activity add column if not exists steps integer;
alter table public.oura_daily_activity add column if not exists raw jsonb;
alter table public.oura_daily_activity add column if not exists synced_at timestamptz default now();
alter table public.oura_daily_activity add column if not exists active_calories numeric;
alter table public.oura_daily_activity add column if not exists equivalent_walking_distance numeric;
alter table public.oura_daily_activity add column if not exists high_activity_time integer;
alter table public.oura_daily_activity add column if not exists medium_activity_time integer;
alter table public.oura_daily_activity add column if not exists low_activity_time integer;
create unique index if not exists oura_daily_activity_connection_day_idx on public.oura_daily_activity(connection_id, day);

create table if not exists public.oura_heart_rate (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  timestamp timestamptz,
  bpm numeric,
  source text,
  raw jsonb,
  synced_at timestamptz default now()
);

alter table public.oura_heart_rate add column if not exists connection_id uuid references public.oura_connections(id) on delete cascade;
alter table public.oura_heart_rate add column if not exists timestamp timestamptz;
alter table public.oura_heart_rate add column if not exists bpm numeric;
alter table public.oura_heart_rate add column if not exists source text;
alter table public.oura_heart_rate add column if not exists raw jsonb;
alter table public.oura_heart_rate add column if not exists synced_at timestamptz default now();
create unique index if not exists oura_heart_rate_connection_timestamp_idx on public.oura_heart_rate(connection_id, timestamp);

create table if not exists public.oura_sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  oura_id text,
  day date,
  type text,
  bedtime_start timestamptz,
  bedtime_end timestamptz,
  score numeric,
  raw jsonb,
  synced_at timestamptz default now()
);
create unique index if not exists oura_sleep_sessions_connection_oura_id_idx on public.oura_sleep_sessions(connection_id, oura_id);

create table if not exists public.oura_workouts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  oura_id text,
  day date,
  activity text,
  start_datetime timestamptz,
  end_datetime timestamptz,
  calories numeric,
  distance numeric,
  raw jsonb,
  synced_at timestamptz default now()
);
create unique index if not exists oura_workouts_connection_oura_id_idx on public.oura_workouts(connection_id, oura_id);

create table if not exists public.oura_sessions (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  oura_id text,
  day date,
  type text,
  start_datetime timestamptz,
  end_datetime timestamptz,
  raw jsonb,
  synced_at timestamptz default now()
);
create unique index if not exists oura_sessions_connection_oura_id_idx on public.oura_sessions(connection_id, oura_id);

create table if not exists public.oura_tags (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  oura_id text,
  day date,
  tag text,
  start_datetime timestamptz,
  end_datetime timestamptz,
  raw jsonb,
  synced_at timestamptz default now()
);
create unique index if not exists oura_tags_connection_oura_id_idx on public.oura_tags(connection_id, oura_id);

create table if not exists public.oura_spo2 (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  spo2_percentage numeric,
  raw jsonb,
  synced_at timestamptz default now()
);
create unique index if not exists oura_spo2_connection_day_idx on public.oura_spo2(connection_id, day);

create table if not exists public.oura_daily_stress (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  stress_high integer,
  recovery_high integer,
  day_summary text,
  raw jsonb,
  synced_at timestamptz default now()
);
create unique index if not exists oura_daily_stress_connection_day_idx on public.oura_daily_stress(connection_id, day);

create table if not exists public.oura_daily_resilience (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  level text,
  score numeric,
  raw jsonb,
  synced_at timestamptz default now()
);
create unique index if not exists oura_daily_resilience_connection_day_idx on public.oura_daily_resilience(connection_id, day);
