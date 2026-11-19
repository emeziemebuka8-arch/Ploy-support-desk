-- ============================================================
-- Ploy Support Desk — Stage 10 security hardening
-- ============================================================
-- HOW TO RUN THIS FILE
-- 1. Supabase dashboard -> SQL Editor -> New query
-- 2. Paste this whole file and click "Run"
-- 3. You should see "Success. No rows returned"
--
-- Run this AFTER 02-public-functions.sql.
--
-- WHY THIS FILE EXISTS
-- The complaint form used to count submissions in the Next.js server's
-- memory. That works on a laptop, but on a hosted server the memory is
-- reset on every restart, and each server instance has its own count.
-- A determined visitor could therefore send more than five complaints.
--
-- This file moves the limit into the database, inside the same
-- submit_complaint function that saves the ticket. Because the check
-- happens on the database side, it also applies when someone calls the
-- function directly with the public key instead of using the form.
--
-- The key is the visitor's IP address, hashed with md5 so the raw
-- address is not stored. Five complaints are allowed per address in
-- any ten-minute window.
--
-- It also adds an administrator allowlist. Supabase allows public
-- sign-ups by default, and the authenticated role is not the same as
-- "the administrator". Without this list, anybody who signed up and
-- confirmed their email could read every ticket. The policies below
-- now require membership in public.admin_users.
--
-- This file is safe to run more than once.
-- ============================================================


-- ------------------------------------------------------------
-- 1. RATE LIMIT TABLE
-- One row per accepted complaint attempt. RLS is enabled with no
-- policies, so the browser cannot read or write this table; only the
-- SECURITY DEFINER function below can.
-- ------------------------------------------------------------
create table if not exists public.complaint_rate_limits (
  id         bigserial primary key,
  client_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists complaint_rate_limits_lookup_idx
  on public.complaint_rate_limits (client_key, created_at desc);

alter table public.complaint_rate_limits enable row level security;


-- ------------------------------------------------------------
-- 2. SUBMIT COMPLAINT, WITH A DATABASE-SIDE LIMIT
-- Same signature and behaviour as Stage 5, plus the limit check.
-- The form fields are validated first, so an invalid attempt does not
-- use up the visitor's allowance.
-- ------------------------------------------------------------
create or replace function public.submit_complaint(
  p_customer_name  text,
  p_customer_email text,
  p_customer_phone text,
  p_subject        text,
  p_description    text,
  p_category_id    text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name        text := btrim(coalesce(p_customer_name, ''));
  v_email       text := lower(btrim(coalesce(p_customer_email, '')));
  v_phone       text := btrim(coalesce(p_customer_phone, ''));
  v_subject     text := btrim(coalesce(p_subject, ''));
  v_description text := btrim(coalesce(p_description, ''));
  v_ticket_id   uuid;
  v_ticket_no   text;

  v_headers   jsonb;
  v_ip        text;
  v_client    text;
  v_recent    integer;
begin
  -- The database repeats the same checks as the form and the API route.
  if char_length(v_name) not between 1 and 120 then
    raise exception 'Please enter your name.' using errcode = '22023';
  end if;

  if char_length(v_email) not between 3 and 200
     or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;

  if char_length(v_phone) > 40 then
    raise exception 'Phone number must be 40 characters or fewer.' using errcode = '22023';
  end if;

  if char_length(v_subject) not between 1 and 200 then
    raise exception 'Please enter a short subject.' using errcode = '22023';
  end if;

  if char_length(v_description) not between 1 and 5000 then
    raise exception 'Please describe the problem (5000 characters maximum).' using errcode = '22023';
  end if;

  if not exists (select 1 from public.categories where id = p_category_id) then
    raise exception 'Please choose a category.' using errcode = '22023';
  end if;

  -- Realtime uses PostgREST, which exposes request headers through a
  -- setting. If the function is called from the SQL editor there are no
  -- headers, so fall back to a single shared key.
  begin
    v_headers := coalesce(current_setting('request.headers', true), '{}')::jsonb;
  exception
    when others then
      v_headers := '{}'::jsonb;
  end;

  v_ip := btrim(split_part(coalesce(v_headers ->> 'x-forwarded-for', ''), ',', 1));

  if v_ip = '' then
    v_ip := btrim(coalesce(v_headers ->> 'cf-connecting-ip', ''));
  end if;

  v_client := md5(case when v_ip = '' then 'unknown' else v_ip end);

  -- Remove old rows so the table stays small.
  delete from public.complaint_rate_limits
  where created_at < now() - interval '1 day';

  -- One lock per visitor stops two simultaneous requests from both
  -- seeing "four attempts" and both being accepted.
  perform pg_advisory_xact_lock(hashtext(v_client)::bigint);

  select count(*) into v_recent
  from public.complaint_rate_limits
  where client_key = v_client
    and created_at > now() - interval '10 minutes';

  if v_recent >= 5 then
    raise exception
      'Too many complaints have been submitted from this connection. Please wait a few minutes and try again.'
      using errcode = 'P0001';
  end if;

  insert into public.complaint_rate_limits (client_key)
  values (v_client);

  insert into public.tickets (
    customer_name,
    customer_email,
    customer_phone,
    subject,
    description,
    category_id,
    priority,
    status,
    source,
    created_by
  )
  values (
    v_name,
    v_email,
    v_phone,
    v_subject,
    v_description,
    p_category_id,
    'Medium',
    'Open',
    'Website',
    null
  )
  returning id, ticket_number into v_ticket_id, v_ticket_no;

  insert into public.ticket_updates (ticket_id, message, new_status, created_by)
  values (
    v_ticket_id,
    'Complaint submitted through the website.',
    'Open',
    null
  );

  return v_ticket_no;
end;
$$;

revoke all on function public.submit_complaint(text, text, text, text, text, text) from public;
grant execute on function public.submit_complaint(text, text, text, text, text, text)
  to anon, authenticated;


-- ------------------------------------------------------------
-- 3. ADMINISTRATOR ALLOWLIST
-- Only user ids in this table are treated as administrators.
-- RLS is on with no policies, so the browser cannot read the list.
-- ------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Seed with every profile that exists right now. There should only be
-- the one administrator. Check the Table Editor afterwards and delete
-- any row that should not have access.
--
-- The NOT EXISTS guard matters: this file is safe to re-run, and without
-- the guard a second run would promote every account that signed up in
-- the meantime. Seeding only happens while the allowlist is still empty.
insert into public.admin_users (user_id)
select id from public.profiles
where not exists (select 1 from public.admin_users)
on conflict (user_id) do nothing;

-- One small function so every policy asks the same question.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;


-- ------------------------------------------------------------
-- 4. POLICIES THAT REQUIRE AN ADMINISTRATOR
-- These replace the Stage 4 policies. "authenticated" alone is no
-- longer enough; the signed-in user must be on the allowlist.
-- ------------------------------------------------------------
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() and public.is_admin());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() and public.is_admin())
  with check (id = auth.uid() and public.is_admin());

drop policy if exists "tickets: admin read" on public.tickets;
create policy "tickets: admin read"
  on public.tickets for select
  to authenticated
  using (public.is_admin());

drop policy if exists "tickets: admin insert" on public.tickets;
create policy "tickets: admin insert"
  on public.tickets for insert
  to authenticated
  with check (public.is_admin() and created_by = auth.uid());

drop policy if exists "tickets: admin update" on public.tickets;
create policy "tickets: admin update"
  on public.tickets for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "tickets: admin delete" on public.tickets;
create policy "tickets: admin delete"
  on public.tickets for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "ticket_updates: admin read" on public.ticket_updates;
create policy "ticket_updates: admin read"
  on public.ticket_updates for select
  to authenticated
  using (public.is_admin());

drop policy if exists "ticket_updates: admin insert" on public.ticket_updates;
create policy "ticket_updates: admin insert"
  on public.ticket_updates for insert
  to authenticated
  with check (public.is_admin() and created_by = auth.uid());

drop policy if exists "ticket_updates: admin update" on public.ticket_updates;
create policy "ticket_updates: admin update"
  on public.ticket_updates for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "ticket_updates: admin delete" on public.ticket_updates;
create policy "ticket_updates: admin delete"
  on public.ticket_updates for delete
  to authenticated
  using (public.is_admin());

-- TO ADD ANOTHER ADMINISTRATOR LATER
-- 1. Create the user in Supabase -> Authentication -> Users.
-- 2. Run:
--    insert into public.admin_users (user_id)
--    select id from public.profiles where email = 'new-admin@example.com'
--    on conflict (user_id) do nothing;

notify pgrst, 'reload schema';
