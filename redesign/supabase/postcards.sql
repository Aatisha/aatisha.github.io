-- Postcard (postcard.html, postcard.js): the table visitors' postcards are posted to.
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
--
-- It's a letterbox: anyone visiting the site can post a postcard, but nobody can read them back
-- through the site. Only you can, in the dashboard: Table Editor → postcards.

create table if not exists public.postcards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  message text not null check (char_length(message) between 2 and 500),
  name text check (name is null or char_length(name) <= 40),
  place text check (place is null or char_length(place) <= 40),
  email text check (email is null or (char_length(email) <= 80 and email like '%_@_%')),
  stamp text check (stamp is null or stamp in ('palm', 'turtle', 'hibiscus', 'shell', 'sail', 'clownfish'))
);

alter table public.postcards enable row level security;

-- Visitors (the public "anon" key the site uses) may only post: no reading, changing or deleting.
revoke all on public.postcards from anon, authenticated;
grant insert (message, name, place, email, stamp) on public.postcards to anon;

drop policy if exists "Anyone can post a postcard" on public.postcards;
create policy "Anyone can post a postcard"
  on public.postcards for insert to anon
  with check (true);
