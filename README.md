# Ploy Support Desk

A simple customer support ticket management system for Ploy. One administrator
can log in, record customer complaints received through WhatsApp, email or
phone, track their progress and mark them as resolved.

Built for a 14-week SIWES project, so the code favours clarity over cleverness.

## Current status

| Stage | Description | Status |
| --- | --- | --- |
| 1 | Project setup (Next.js, JavaScript, Tailwind, Lucide, UI components) | Done |
| 2 | Public customer portal UI (mock data) | Done |
| 3 | Administrator dashboard UI (mock data) | Done |
| 4 | Supabase project, tables, categories, RLS policies | Done |
| 5 | Secure customer complaint submission | Done |
| 6 | Administrator authentication and protected routes | Done |
| 7 | Administrator ticket management with Supabase | Done |
| 8 | Customer complaint tracking | Done (built with Stage 5) |
| 9 | Realtime updates | Done |
| 10 | Security testing and deployment | Code and tests done — deployment pending |

Both interfaces now use the same Supabase database.

- The customer portal saves real complaints through the two functions in
  `supabase/02-public-functions.sql`. Run that file once in the SQL Editor
  when setting up a new Supabase project.
- The administrator dashboard reads the real `tickets`, `ticket_updates` and
  `profiles` tables on the server and writes changes through server actions.
  It also subscribes to Realtime changes, so new complaints appear without a
  refresh. Run `supabase/03-realtime.sql` once to enable that.
- The complaint submission limit is enforced inside the database, so it
  survives restarts and serverless hosts. Run `supabase/04-security.sql` once
  to create it.
  `lib/mock-data.js` is no longer imported anywhere and can be deleted.

## Tech stack

- Next.js 16 (App Router) with plain JavaScript
- Tailwind CSS v4
- shadcn/ui-style components written by hand in `components/ui`
  (Radix Dialog is used for the delete confirmation)
- Lucide React icons
- Supabase (Stage 3 onwards) for PostgreSQL, Auth and Row Level Security

## Running the project

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

The customer portal is public — no account is needed.

Sign in at `/login` with an administrator account created in
**Supabase → Authentication → Users**. The account must be confirmed; use
**Auto Confirm User** when creating it, or confirm it later in the Users list.

Try the portal flow:

1. Open http://localhost:3000 and choose **Submit a Complaint**.
2. Fill in the form; you will receive a ticket number such as `PSD-1001`.
3. Open **Track Complaint**, enter the ticket number and the same email.
4. Check **Table Editor → tickets** in Supabase: the complaint should be there,
   with source `Website` and status `Open`.

Ticket numbers come from a database sequence, so they never repeat even if
two complaints arrive at the same moment.

## Folder structure

```
app/
  layout.js                 Root HTML layout, fonts and global styles
  globals.css               Tailwind import + base colours
  (portal)/                 Public customer portal (no account needed)
    layout.js               Simple public header and footer
    page.js                 Home / support page at "/"
    submit/page.js          Submit a complaint
    submit/complaint-form.js  Client form and validation
    confirmation/page.js    Success page with the ticket number
    track/page.js           Track complaint page
    track/track-form.js     Ticket + email lookup and public status
  api/complaints/route.js   Server-side complaint submission
  api/complaints/track/route.js  Server-side ticket lookup
  login/page.js             Login screen (server-rendered)
  login/login-form.js       Email/password form using useActionState
  login/actions.js          Server action that signs in and redirects
  (app)/                    Route group: every signed-in page
    layout.js               Session gate + server data + provider
    actions.js              Server actions for tickets and profile
    dashboard/page.js       Four statistics + five recent tickets
    tickets/page.js         All tickets, search, filters, delete
    tickets/new/page.js     Create ticket form
    tickets/[id]/page.js    Server page that reads the ticket id
    tickets/[id]/ticket-details-client.js  Details, notes, status, history
    tickets/[id]/edit/page.js              Server page for editing
    tickets/[id]/edit/edit-ticket-client.js  Pre-filled edit form
    reports/page.js         Totals, status chart, category breakdown
    settings/page.js        Administrator profile + logout

components/
  layout/sidebar.js         Navigation links, active state, logout
  layout/header.js          Page title + administrator profile
  layout/app-shell.js       Desktop sidebar / mobile drawer layout
  tickets-provider.js       Server rows in React state, actions, realtime subscription
  tickets/ticket-table.js   Shared table used by dashboard and All Tickets
  tickets/ticket-form.js    Shared form for new and edit pages
  tickets/status-badge.js   Coloured status and priority badges
  tickets/activity-list.js  Activity history list
  stat-card.js              One dashboard statistic card
  ui/                       Small reusable UI pieces (button, card, field, dialog, badge)

lib/
  constants.js              Status, priority, source and category lists
  tickets-data.js           Server-side read of profile, tickets, activity
  complaints.js             Supabase calls + public form validation
  supabase/server.js        Server Supabase clients (public + session)
  supabase/client.js        Browser client (realtime + logout)
  tickets.js                Helpers: stats, search/filter, category lookup
  format.js                 Date and date-time formatting
  utils.js                  `cn()` class-name helper used by UI components

supabase/
  01-schema.sql             Tables, categories, triggers and RLS policies
  02-public-functions.sql   Secure submit and track database functions
  03-realtime.sql           Adds both tables to the Realtime publication
  04-security.sql           Database-backed complaint rate limit

scripts/
  security-check.mjs        Anon-key probe of the policies and public API
```

## Public customer portal (Stage 2)

Customers reach the portal at `/`. They can submit a complaint or look up an
existing one with their ticket number and email address. No account is needed.

**The browser never writes to the database.** The complaint form posts to
`/api/complaints`, and the tracking form posts to `/api/complaints/track`.
Both are Next.js Route Handlers, so validation, ticket-number generation, the
`Open` status, the `Website` source and the timestamps all happen on the
server.

**Tracking is deliberately narrow.** The lookup requires both the ticket
number and the matching email address, and the response contains only the
ticket number, subject, status, date submitted and last updated. Internal
notes and activity history are never included, and an unknown ticket gets the
same message as a wrong email so tickets cannot be discovered.

**Basic spam protection.** The form has a hidden honeypot field, the server
rejects oversized or malformed input, and each address may submit five
complaints every ten minutes. The limit is enforced inside `submit_complaint`
(see `supabase/04-security.sql`), so it survives restarts and also applies if
someone calls the database function directly instead of using the form.

**Database functions, not table access.** The API routes call
`submit_complaint` and `track_complaint`. Anonymous visitors have no policy
allowing them to read or insert into `tickets`, so the tables stay private
even though the public key is used.

## Administrator ticket management (Stage 7)

The signed-in pages are client components, but their data is real and the
browser never writes to the tables directly.

- **Reading:** `app/(app)/layout.js` checks the session, then
  `lib/tickets-data.js` reads the administrator's profile, all tickets and the
  activity history using the session cookies. RLS decides which rows are
  returned; an anonymous visitor gets none.
- **Writing:** `app/(app)/actions.js` contains server actions for create,
  edit, status change, notes, delete and the profile name. Each action
  re-checks the session, writes through Supabase, records the activity row,
  and returns the saved ticket so the browser can update immediately.
- **Refreshing:** after a write, `revalidatePath` marks the affected pages so
  the next server render reads fresh data. Local state gives the instant
  update in the current tab.
- **Profile name:** saved to `profiles.full_name` and to the Auth user
  metadata, so it survives a refresh and matches the sidebar/header.
- **Order of writes:** ticket creation writes the ticket first (the database
  supplies `PSD-####`) and then its first activity entry. A failed activity
  write is reported as an error instead of being hidden.

The old `lib/mock-data.js` file is no longer imported and can be deleted.

## Realtime updates (Stage 9)

The dashboard now updates itself while it is open. If a customer submits a
complaint in another tab or on another device, the new ticket appears in the
list without pressing refresh.

- **Subscription:** `components/tickets-provider.js` opens one Supabase
  Realtime channel when the protected layout mounts. It listens for inserts,
  updates and deletes on `tickets`, and for inserts on `ticket_updates`.
- **Merging:** each event carries the changed row. The provider merges it with
  the existing React state using the row's `id`, so it never duplicates a row
  that the current tab already added through a server action.
- **Cleanup:** when the dashboard closes, the channel is removed so the browser
  does not keep an unused connection open.
- **Security:** Realtime obeys the same RLS policies as normal reads. Only a
  signed-in administrator's subscription receives rows; the public anon key
  alone receives nothing.
- **Database setup:** `supabase/03-realtime.sql` adds both tables to the
  `supabase_realtime` publication and sets `replica identity full` so update
  and delete events include the whole row.

The first page load is still a normal server read. Realtime only reports what
changed after that, so a refresh is never required but always safe.

## How the app is put together

**One data provider.** `app/(app)/layout.js` reads the administrator profile,
tickets and activity from Supabase on the server (through
`lib/tickets-data.js`) and passes them to `components/tickets-provider.js`.
Pages read them with `useTickets()` and call actions such as `createTicket`,
`changeStatus` or `addNote`. Those functions call the server actions in
`app/(app)/actions.js`, then merge the returned rows into local state.

**Two shared components.** `ticket-table.js` is used by both the dashboard
(without the category column) and All Tickets (with delete). `ticket-form.js`
powers both New Ticket and Edit Ticket, so validation and layout stay the same.

**Route group.** Pages live in `app/(app)/` so they get the sidebar and header
without adding `(app)` to the URL.

**Small helper functions.** Statistics, searching, filtering and category
counting live in `lib/tickets.js` as plain functions. They are easy to test and
easy to explain.

**Server pages for dynamic routes.** `app/(app)/tickets/[id]/page.js` reads the
`id` from the URL on the server and passes it to a client component.
`export const instant = false` in `app/(app)/layout.js` tells Next.js that the
shell may render per request, because it needs the current URL to highlight the
active menu item.

## Database design

Four tables, exactly as described in the project requirements:

- `profiles` — id (references `auth.users`), full_name, email, created_at
- `categories` — id, name, description, created_at (six seeded categories)
- `tickets` — ticket_number, customer details, subject, description,
  category_id, priority, status, source, created_by, created_at, updated_at
- `ticket_updates` — ticket_id, message, old_status, new_status, created_by,
  created_at

**Ticket numbers** are generated in the database with the
`ticket_number_seq` sequence, which produces `PSD-1001`, `PSD-1002` and so on.
Never by counting rows: deleting a ticket or two simultaneous inserts would
create duplicates.

**Security:** Row Level Security is enabled on all four tables. Only the public
anon key is used, and the service-role key is not used anywhere in this
project. Anonymous visitors cannot read or insert into `tickets`; the portal
reaches the data only through the two `SECURITY DEFINER` functions in
`supabase/02-public-functions.sql`, which set the status, source, priority and
ticket number themselves and return only what the customer is allowed to see.

## Security testing and deployment (Stage 10)

### Run the policy checks

```bash
node --env-file=.env scripts/security-check.mjs
```

The script uses only the public anon key, exactly like someone inspecting the
site would. It checks that a signed-out visitor cannot read or write tickets,
activity, profiles or the rate-limit table; that the public functions reject
invalid input; and that the API routes validate, hide unknown tickets, set
security headers and redirect signed-out dashboard visits. It never submits a
valid complaint, so it does not add rows.

It must be run after `supabase/04-security.sql`, which creates the rate-limit
table and the administrator allowlist it checks for.

### Fixes made in this stage

- **The complaint limit moved into the database.** `submit_complaint` now
  records hashed IP addresses in `complaint_rate_limits` and refuses the sixth
  complaint in ten minutes. This survives restarts and serverless instances,
  and also applies when someone calls the function directly with the public
  key. The API route turns that refusal into a friendly `429`.
- **Administrators are now an explicit allowlist.** Supabase allows public
  sign-ups by default, so "signed in" did not previously mean "the
  administrator". `public.admin_users` lists the allowed user ids, and every
  ticket, activity and profile policy calls `public.is_admin()`. A stranger
  who signs up and confirms their email now sees no data at all.
- **Security headers** are set in `next.config.mjs` (`nosniff`, frame denial,
  referrer policy, permissions policy), and `X-Powered-By` is hidden.

### Before deploying

1. **Create the production Supabase project** (or reuse this one) and run, in
   order: `01-schema.sql`, `02-public-functions.sql`, `03-realtime.sql`,
   `04-security.sql`.
2. **Check the allowlist.** Table Editor → `admin_users` should contain exactly
   the administrator's user id. Remove any other row. To add another admin,
   create the user and insert their id as shown at the bottom of
   `04-security.sql`.
3. **Turn off public sign-ups.** Authentication → Sign In / Providers →
   disable **Allow new users to sign up**. The allowlist already protects the
   data; this keeps the user list clean as well.
4. **Set the Auth URLs.** Authentication → URL Configuration → Site URL should
   be the production address, for example `https://support.example.com`. Add
   that address to the redirect URLs too.
5. **Set two environment variables on the host** (and in `.env.local` for local
   production builds):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Never add the service-role key: it bypasses RLS and this project does not
   use it.
6. **Build and start.** On any host that runs a Next.js 16 Node build:

   ```bash
   npm ci
   npm run build
   npm start
   ```

   Node 20 or newer is required (the checks were run on Node 22). No database
   migration runs at startup, so the four SQL files must be applied first.

### Smoke-test checklist

Run this on the deployed URL, signed out first, then signed in.

**Customer portal**

- [ ] `/`, `/submit` and `/track` open without an account.
- [ ] Submitting an empty form shows field errors, not a crash.
- [ ] A real complaint returns a `PSD-####` number and appears in Supabase
      with source `Website` and status `Open`.
- [ ] Tracking with the wrong email says the same thing as an unknown ticket.
- [ ] Tracking with the correct number and email shows only the five public
      fields — no notes or internal activity.
- [ ] `node --env-file=.env scripts/security-check.mjs` reports every check
      passing.

**Administrator**

- [ ] `/dashboard` redirects to `/login` when signed out.
- [ ] The administrator can sign in, and sign out returns to `/login`.
- [ ] Dashboard statistics and Recent Tickets match the database.
- [ ] Create, edit, change status, add a note and delete all work.
- [ ] Settings → save a new display name; it survives a refresh.
- [ ] A second dashboard tab updates after a complaint or status change
      (Realtime).
- [ ] `admin_users` contains only the intended administrator.

**Housekeeping**

- [ ] Delete the smoke-test tickets so the live totals are clean.
- [ ] Confirm the host shows no build or runtime errors in its logs.

## What is intentionally missing

No customer accounts, no staff accounts, no multiple roles, no WhatsApp API, no
email or SMS automation, no payments, no advanced analytics. This is a
standalone ticket manager.
