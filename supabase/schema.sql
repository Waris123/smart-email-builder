-- Run this whole file in Supabase SQL Editor (Project > SQL Editor > New query)

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Table that stores your company's email dataset + embeddings
create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  scenario text not null,
  client_type text not null,
  tone text not null,
  context text not null,
  sample_email text not null,
  embedding vector(768),  -- Gemini text-embedding-004 outputs 768 dims
  created_at timestamptz default now()
);

-- 3. Similarity search function (cosine distance) used by the API route
create or replace function match_email_templates (
  query_embedding vector(768),
  match_count int default 3
)
returns table (
  id uuid,
  scenario text,
  client_type text,
  tone text,
  context text,
  sample_email text,
  similarity float
)
language sql stable
as $$
  select
    id,
    scenario,
    client_type,
    tone,
    context,
    sample_email,
    1 - (embedding <=> query_embedding) as similarity
  from email_templates
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- 4. Row Level Security — templates are readable by any logged-in user,
--    writable only via the service role key (used by the seed script).
alter table email_templates enable row level security;

create policy "Authenticated users can read templates"
  on email_templates for select
  to authenticated
  using (true);

-- 5. IMPORTANT (manual step, not SQL):
--    Go to Authentication > Providers > Email in Supabase dashboard and make
--    sure "Email" provider is enabled. That's all you need for signup/login.
