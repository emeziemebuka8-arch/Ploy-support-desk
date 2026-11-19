-- ============================================================
-- Ploy Support Desk — Stage 4 database setup
-- ============================================================
-- HOW TO RUN THIS FILE
-- 1. Open your project at https://supabase.com
-- 2. Go to "SQL Editor" in the left sidebar.
-- 3. Click "New query", paste this whole file, then click "Run".
-- 4. You should see "Success. No rows returned".
--
-- This file is safe to run more than once. It creates the four tables,
-- the ticket-number counter, the triggers and the Row Level Security
-- (RLS) rules. RLS is the database's own security guard: even if the
-- browser had the public key, it could not read the tickets.
-- ============================================================


-- ------------------------------------------------------------
-- 1. PROFILES
-- One row per administrator. It is linked to Supabase's built-in
-- auth.users table, which stores the email and password.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default 'Administrator',
  email      text not null,
  created_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 2. CATEGORIES
-- The six complaint categories used by both interfaces.
-- The ids match the ones already used in lib/constants.js.
-- ------------------------------------------------------------
create table if not exists public.categories (
  id          text primary key,
  name        text not null unique,
  description text not null default '',
  created_at  timestamptz not null default now()
);

insert into public.categories (id, name, description) values
  ('cat-technical', 'Technical Issues',
   'Bugs, errors and features that are not working.'),
  ('cat-account', 'Account Access',
   'Login, password and account access problems.'),
  ('cat-whatsapp', 'WhatsApp Connection',
   'WhatsApp disconnections and connection issues.'),
  ('cat-billing', 'Billing and Payments',
   'Payment failures, refunds and subscription questions.'),
  ('cat-invoicing', 'Invoicing',
   'Invoice requests, corrections and receipts.'),
  ('cat-general', 'General Enquiries',
   'Questions that do not belong to another category.')
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description;


-- ------------------------------------------------------------
-- 3. TICKETS
-- ------------------------------------------------------------
-- A sequence is a database counter. It guarantees that two
-- complaints submitted at the same time can never receive the same
-- ticket number, and deleting a ticket never causes a number to be
-- reused. The trigger/default below turns the number into PSD-1001.
create sequence if not exists public.ticket_number_seq start with 1001;

create table if not exists public.tickets (
  id             uuid primary key default gen_random_uuid(),
  ticket_number  text not null unique
                   default ('PSD-' || lpad(nextval('public.ticket_number_seq')::text, 4, '0')),

  customer_name  text not null
                   check (char_length(btrim(customer_name)) between 1 and 120),
  customer_email text not null
                   check (char_length(customer_email) between 3 and 200
                          and customer_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  customer_phone text not null default ''
                   check (char_length(customer_phone) <= 40),

  subject        text not null
                   check (char_length(btrim(subject)) between 1 and 200),
  description    text not null
                   check (char_length(btrim(description)) between 1 and 5000),

  category_id    text not null references public.categories (id),
  priority       text not null default 'Medium'
                   check (priority in ('Low', 'Medium', 'High')),
  status         text not null default 'Open'
                   check (status in ('Open', 'In Progress', 'Resolved')),
  source         text not null default 'Other'
                   check (source in ('Website', 'WhatsApp', 'Email', 'Phone Call', 'Other')),

  -- NULL for complaints submitted by customers through the website.
  created_by     uuid references public.profiles (id) on delete set null,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists tickets_created_at_idx
  on public.tickets (created_at desc);
create index if not exists tickets_status_idx
  on public.tickets (status);
create index if not exists tickets_customer_email_idx
  on public.tickets (lower(customer_email));


-- ------------------------------------------------------------
-- 4. TICKET UPDATES (activity history)
-- Every status change and every internal note becomes one row here.
-- ------------------------------------------------------------
create table if not exists public.ticket_updates (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets (id) on delete cascade,
  message    text not null check (char_length(btrim(message)) between 1 and 2000),
  old_status text check (old_status is null or old_status in ('Open', 'In Progress', 'Resolved')),
  new_status text check (new_status is null or new_status in ('Open', 'In Progress', 'Resolved')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ticket_updates_ticket_idx
  on public.ticket_updates (ticket_id, created_at desc);


-- ------------------------------------------------------------
-- 5. TRIGGERS
-- ------------------------------------------------------------

-- Keep tickets.updated_at accurate without the app having to remember.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- When the administrator is created in Supabase Auth, automatically
-- create the matching profile row. The full name is taken from the
-- user's metadata, or from the part of the email before the "@".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''),
             split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------
-- With RLS enabled, nobody can read or change a table unless a policy
-- explicitly allows it. "anon" means a visitor who is not signed in;
-- "authenticated" means a signed-in administrator.
--
-- The public complaint form will NOT write to these tables directly.
-- In Stage 5 it calls a controlled server-side function instead, so
-- there is deliberately no insert policy for "anon" on tickets.
-- ------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.tickets        enable row level security;
alter table public.ticket_updates enable row level security;

-- Profiles: an administrator can read and update only their own row.
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Categories: readable by everyone (the complaint form needs the names),
-- writable only through the Supabase dashboard or a service-role key.
drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read"
  on public.categories for select
  to anon, authenticated
  using (true);

-- Tickets: only signed-in administrators.
drop policy if exists "tickets: admin read" on public.tickets;
create policy "tickets: admin read"
  on public.tickets for select
  to authenticated
  using (true);

drop policy if exists "tickets: admin insert" on public.tickets;
create policy "tickets: admin insert"
  on public.tickets for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "tickets: admin update" on public.tickets;
create policy "tickets: admin update"
  on public.tickets for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "tickets: admin delete" on public.tickets;
create policy "tickets: admin delete"
  on public.tickets for delete
  to authenticated
  using (true);

-- Ticket updates: only signed-in administrators.
drop policy if exists "ticket_updates: admin read" on public.ticket_updates;
create policy "ticket_updates: admin read"
  on public.ticket_updates for select
  to authenticated
  using (true);

drop policy if exists "ticket_updates: admin insert" on public.ticket_updates;
create policy "ticket_updates: admin insert"
  on public.ticket_updates for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "ticket_updates: admin update" on public.ticket_updates;
create policy "ticket_updates: admin update"
  on public.ticket_updates for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "ticket_updates: admin delete" on public.ticket_updates;
create policy "ticket_updates: admin delete"
  on public.ticket_updates for delete
  to authenticated
  using (true);
