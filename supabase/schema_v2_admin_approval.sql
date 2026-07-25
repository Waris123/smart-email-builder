-- Run this in Supabase SQL Editor AFTER schema.sql (this is additive, safe to
-- run on your existing project — it does not touch email_templates).

-- 1. Profiles table — one row per signed-up user, auto-created on signup.
--    is_approved starts false; only an admin can flip it to true.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text,
  is_admin boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- 2. Prompt logs — every generate-email request gets one row here.
create table if not exists prompt_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  username text,
  input_prompt text not null,
  output_email text,
  matched_scenario text,
  out_of_context boolean default false,
  created_at timestamptz default now()
);

alter table prompt_logs enable row level security;

-- 3. is_admin() helper — SECURITY DEFINER so it can read profiles.is_admin
--    without triggering RLS recursion in the policies below.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- 4. Policies

-- profiles: a user can see their own row; admins can see + update everyone's
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (is_admin());

create policy "Admins can update profiles"
  on profiles for update
  using (is_admin());

-- prompt_logs: users can insert their own log row; only admins can read logs
create policy "Users can insert own logs"
  on prompt_logs for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all logs"
  on prompt_logs for select
  using (is_admin());

-- 5. Auto-create a profile row whenever someone signs up.
--    SECURITY DEFINER lets this bypass RLS (standard Supabase pattern).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, is_admin, is_approved)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    false,
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. IMPORTANT (manual step): make yourself the first admin.
--    Sign up in the app first with your own email, THEN run this:
--
--    update profiles set is_admin = true, is_approved = true
--    where email = 'your-email@example.com';
