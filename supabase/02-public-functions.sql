-- ============================================================
-- Ploy Support Desk — Stage 5 public functions
-- ============================================================
-- HOW TO RUN THIS FILE
-- 1. Supabase dashboard -> SQL Editor -> New query
-- 2. Paste this whole file and click "Run"
-- 3. You should see "Success. No rows returned"
--
-- WHY THIS FILE EXISTS
-- Anonymous visitors must be able to submit and track a complaint,
-- but they must NOT be able to read the tickets table. Row Level
-- Security already blocks them (there is no policy for "anon").
--
-- So instead of opening the table, we create two controlled functions:
--   submit_complaint(...)  inserts one complaint and returns its number
--   track_complaint(...)   returns the five public fields, but only when
--                          the ticket number AND email both match
--
-- Both are SECURITY DEFINER: they run with the privileges of the person
-- who created them (the database owner), while the caller only receives
-- what the function returns. They also pin search_path for safety.
--
-- This file is safe to run more than once.
-- ============================================================


-- ------------------------------------------------------------
-- 1. PUBLIC SUBMISSION
-- The API route sends the customer's details here. Everything the
-- customer must not control (status, source, priority, timestamps,
-- ticket number) is set inside this function.
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
begin
  -- The database repeats the same checks as the form and the API route.
  -- Never rely on the browser alone.
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

-- Functions are executable by PUBLIC by default, so remove that first
-- and then allow exactly the roles that need it.
revoke all on function public.submit_complaint(text, text, text, text, text, text) from public;
grant execute on function public.submit_complaint(text, text, text, text, text, text)
  to anon, authenticated;


-- ------------------------------------------------------------
-- 2. PUBLIC TRACKING
-- Returns the five public fields only. If either the ticket number or
-- the email is wrong, zero rows come back — the caller cannot tell
-- which one was wrong, so tickets cannot be discovered by guessing.
-- ------------------------------------------------------------
create or replace function public.track_complaint(
  p_ticket_number text,
  p_email         text
)
returns table (
  ticket_number text,
  subject       text,
  status        text,
  created_at    timestamptz,
  updated_at    timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.ticket_number,
    t.subject,
    t.status,
    t.created_at,
    t.updated_at
  from public.tickets t
  where t.ticket_number = upper(btrim(coalesce(p_ticket_number, '')))
    and lower(t.customer_email) = lower(btrim(coalesce(p_email, '')));
$$;

revoke all on function public.track_complaint(text, text) from public;
grant execute on function public.track_complaint(text, text)
  to anon, authenticated;


-- ------------------------------------------------------------
-- 3. REFRESH THE API CACHE
-- Supabase's API layer keeps its own list of functions. It usually
-- notices new ones automatically, but not always. This line tells it
-- to rebuild that list, so the app can call the functions immediately.
-- ------------------------------------------------------------
notify pgrst, 'reload schema';


-- ------------------------------------------------------------
-- 4. OPTIONAL CHECK
-- After running this file, these two queries should both return rows.
-- ------------------------------------------------------------
-- select proname, prosecdef
-- from pg_proc
-- where proname in ('submit_complaint', 'track_complaint');
