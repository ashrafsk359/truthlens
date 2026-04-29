-- TruthLens v2 Schema
-- Run in Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- ── Profiles (extends auth.users) ──────────────────────────────────
create table if not exists public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  email        text,
  full_name    text,
  avatar_url   text,
  plan         text default 'free' check (plan in ('free','pro','team')),
  created_at   timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_own" on public.profiles for all using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Checks (user fact-check history) ───────────────────────────────
create table if not exists public.checks (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references auth.users on delete cascade,
  claim_text       text not null,
  input_type       text default 'claim',
  verdict          text,
  credibility_score integer,
  confidence       text,
  summary          text,
  tags             text[] default '{}',
  created_at       timestamptz default now()
);
alter table public.checks enable row level security;
create policy "checks_own" on public.checks for all using (auth.uid() = user_id);
create index if not exists idx_checks_user on public.checks (user_id, created_at desc);

-- ── Saved claims ────────────────────────────────────────────────────
create table if not exists public.saved_claims (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references auth.users on delete cascade,
  claim      text not null,
  result     jsonb,
  created_at timestamptz default now()
);
alter table public.saved_claims enable row level security;
create policy "saved_own" on public.saved_claims for all using (auth.uid() = user_id);
create index if not exists idx_saved_user on public.saved_claims (user_id, created_at desc);

-- ── News cache ──────────────────────────────────────────────────────
create table if not exists public.news_cache (
  id          uuid default uuid_generate_v4() primary key,
  query       text unique not null,
  articles    jsonb,
  created_at  timestamptz default now()
);
-- Auto-expire after 30 minutes via app logic (or use pg_cron)
