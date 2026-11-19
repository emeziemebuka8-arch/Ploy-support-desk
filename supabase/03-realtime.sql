-- ============================================================
-- Ploy Support Desk — Stage 9 realtime setup
-- ============================================================
-- HOW TO RUN THIS FILE
-- 1. Supabase dashboard -> SQL Editor -> New query
-- 2. Paste this whole file and click "Run"
-- 3. You should see "Success. No rows returned"
--
-- WHY THIS FILE EXISTS
-- Supabase Realtime sends a small message to every subscribed browser
-- whenever a table row is inserted, updated or deleted. It only does
-- that for tables that are part of the "supabase_realtime"
-- publication, so this file adds our two tables to it.
--
-- RLS still applies. Realtime checks the same policies the app uses,
-- so an anonymous visitor receives nothing, even if they subscribe
-- with the public key. Only the signed-in administrator gets rows.
--
-- This file is safe to run more than once.
-- ============================================================


-- ------------------------------------------------------------
-- 1. ADD THE TABLES TO THE PUBLICATION
-- "duplicate_object" means the table is already published, which is
-- fine — we ignore it so the file can be re-run.
-- ------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.tickets;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.ticket_updates;
exception
  when duplicate_object then null;
end $$;


-- ------------------------------------------------------------
-- 2. KEEP THE FULL OLD ROW IN THE EVENT
-- By default Realtime only sends the primary key for updates and
-- deletes. The dashboard needs the other columns too (for example to
-- know which ticket a delete refers to, and to check RLS against the
-- old row), so we ask PostgreSQL for the complete row.
-- ------------------------------------------------------------
alter table public.tickets replica identity full;
alter table public.ticket_updates replica identity full;


-- ------------------------------------------------------------
-- 3. OPTIONAL CHECK
-- Both tables should appear in this list.
-- ------------------------------------------------------------
-- select schemaname, tablename
-- from pg_publication_tables
-- where pubname = 'supabase_realtime';
