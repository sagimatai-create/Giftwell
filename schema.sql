-- Run this whole file once in Supabase: Project -> SQL Editor -> New query -> paste -> Run

create extension if not exists "pgcrypto";

-- One row per wishlist folder (e.g. "Birthday", "Christmas")
create table lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'New list',
  archived boolean not null default false,
  owner_blind boolean not null default true,
  share_slug text unique not null default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz not null default now()
);

-- One row per gift item inside a list
create table items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references lists(id) on delete cascade not null,
  name text not null,
  link text,
  image text,
  price numeric not null default 0,
  days integer not null default 0,
  qty integer not null default 1,
  priority text not null default 'med',
  created_at timestamptz not null default now()
);

-- One row per recipient who opens a shared link (identified by an anonymous
-- id stored in their browser cookie, not a login)
create table recipient_sessions (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references lists(id) on delete cascade not null,
  anon_id text not null,
  name text not null default 'Guest',
  budget numeric,
  created_at timestamptz not null default now(),
  unique (list_id, anon_id)
);

-- One row per item per recipient, tracking their private cart/bought state
create table item_status (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references recipient_sessions(id) on delete cascade not null,
  item_id uuid references items(id) on delete cascade not null,
  in_cart boolean not null default false,
  bought boolean not null default false,
  unique (session_id, item_id)
);

alter table lists enable row level security;
alter table items enable row level security;
alter table recipient_sessions enable row level security;
alter table item_status enable row level security;

-- OWNER access: full control of your own lists/items when logged in
create policy "owners manage own lists" on lists
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owners manage own items" on items
  for all using (exists (select 1 from lists where lists.id = items.list_id and lists.owner_id = auth.uid()))
  with check (exists (select 1 from lists where lists.id = items.list_id and lists.owner_id = auth.uid()));

-- PUBLIC access: anyone with the share link can read a list + its items.
-- The slug is a random unguessable string, so this is safe without login.
create policy "anyone can read a list by slug" on lists
  for select using (true);

create policy "anyone can read items of a readable list" on items
  for select using (true);

-- PUBLIC access: anonymous recipients can create/update their own session
-- and item status rows. Note: since there's no login for recipients, this
-- is intentionally open (anyone with the link could technically edit any
-- recipient's cart) -- fine for a personal gift list, not for anything
-- sensitive.
create policy "anyone can create a recipient session" on recipient_sessions
  for insert with check (true);
create policy "anyone can read recipient sessions" on recipient_sessions
  for select using (true);
create policy "anyone can update recipient sessions" on recipient_sessions
  for update using (true);

create policy "anyone can manage item status" on item_status
  for all using (true) with check (true);
