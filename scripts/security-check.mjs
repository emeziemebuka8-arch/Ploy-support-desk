#!/usr/bin/env node

/**
 * Stage 10 security checks
 * ---------------------------------------------------------------
 * Verifies the public Supabase policies and the public API routes.
 * It uses ONLY the anon (publishable) key, exactly like an attacker
 * who inspects the website would.
 *
 * Run it with:
 *   node --env-file=.env scripts/security-check.mjs
 *
 * Optional: SITE_URL=http://localhost:54937 (the dev server).
 *
 * The script never submits a valid complaint, so it does not add
 * rows to the tickets table.
 */

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const site = (process.env.SITE_URL || "http://localhost:54937").replace(/\/+$/, "");

if (!url || !anonKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "Run with: node --env-file=.env scripts/security-check.mjs"
  );
  process.exit(2);
}

const results = [];

function check(name, passed, detail = "") {
  results.push({ name, passed });
  const label = passed ? "PASS" : "FAIL";
  console.log(`${label}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function rest(path, options = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      ...(options.method && options.method !== "GET"
        ? { Prefer: "return=representation" }
        : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { status: response.status, body };
}

async function siteJson(path, options = {}) {
  const response = await fetch(`${site}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    redirect: "manual",
  });

  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { status: response.status, body, headers: response.headers };
}

/** An anonymous read should return no rows, never data. */
async function expectEmptyRead(label, path) {
  try {
    const { status, body } = await rest(path);
    const empty = Array.isArray(body) && body.length === 0;
    check(label, status === 200 && empty, `HTTP ${status}, ${Array.isArray(body) ? body.length : "?"} rows`);
  } catch (error) {
    check(label, false, error.message);
  }
}

/** A write without a policy must not succeed. */
async function expectBlockedWrite(label, path, options) {
  try {
    const { status, body } = await rest(path, options);
    const rows = Array.isArray(body) ? body.length : 0;
    const blocked = status >= 400 || rows === 0;
    check(label, blocked, `HTTP ${status}, ${rows} rows changed`);
  } catch (error) {
    check(label, false, error.message);
  }
}

const fakeId = "00000000-0000-4000-8000-000000000000";

async function runSupabaseChecks() {
  console.log("\nSupabase policies (anon key, signed out)\n");

  await expectEmptyRead("tickets cannot be read by a visitor", "tickets?select=id");
  await expectEmptyRead(
    "ticket_updates cannot be read by a visitor",
    "ticket_updates?select=id"
  );
  await expectEmptyRead(
    "profiles cannot be read by a visitor",
    "profiles?select=id"
  );
  await expectEmptyRead(
    "complaint_rate_limits cannot be read by a visitor (run 04-security.sql)",
    "complaint_rate_limits?select=id"
  );

  const adminUsers = await rest("admin_users?select=user_id");
  check(
    "administrator allowlist exists and is private (run 04-security.sql)",
    adminUsers.status === 200 &&
      Array.isArray(adminUsers.body) &&
      adminUsers.body.length === 0,
    `HTTP ${adminUsers.status}`
  );

  // With public sign-ups enabled and no allowlist, anybody who confirms
  // an email becomes an "authenticated" user. Either setting is safe once
  // the policies require public.is_admin().
  const settingsResponse = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: anonKey },
  });
  const settings = await settingsResponse.json().catch(() => ({}));
  check(
    "new sign-ups are disabled or gated by the administrator allowlist",
    settings.disable_signup === true || adminUsers.status === 200,
    `disable_signup=${settings.disable_signup}, allowlist ${
      adminUsers.status === 200 ? "present" : "missing"
    }`
  );

  const categories = await rest("categories?select=id");
  check(
    "categories stay readable for the public form",
    categories.status === 200 && Array.isArray(categories.body) && categories.body.length > 0,
    `HTTP ${categories.status}, ${categories.body?.length ?? 0} rows`
  );

  await expectBlockedWrite("a visitor cannot insert a ticket", "tickets", {
    method: "POST",
    body: JSON.stringify({
      customer_name: "Security Check",
      customer_email: "security-check@example.com",
      subject: "Should not be saved",
      description: "This row must never be created.",
      category_id: "cat-general",
    }),
  });

  await expectBlockedWrite(
    "a visitor cannot update a ticket",
    `tickets?id=eq.${fakeId}`,
    { method: "PATCH", body: JSON.stringify({ status: "Resolved" }) }
  );

  await expectBlockedWrite(
    "a visitor cannot delete a ticket",
    `tickets?id=eq.${fakeId}`,
    { method: "DELETE" }
  );

  await expectBlockedWrite("a visitor cannot insert activity", "ticket_updates", {
    method: "POST",
    body: JSON.stringify({
      ticket_id: fakeId,
      message: "Should not be saved",
    }),
  });

  await expectBlockedWrite(
    "a visitor cannot change a profile",
    `profiles?id=eq.${fakeId}`,
    { method: "PATCH", body: JSON.stringify({ full_name: "Intruder" }) }
  );

  const invalidName = await rest("rpc/submit_complaint", {
    method: "POST",
    body: JSON.stringify({
      p_customer_name: "",
      p_customer_email: "security-check@example.com",
      p_customer_phone: "",
      p_subject: "Invalid name",
      p_description: "The function must reject this.",
      p_category_id: "cat-general",
    }),
  });
  check(
    "submit_complaint rejects an empty name",
    invalidName.status >= 400,
    `HTTP ${invalidName.status}`
  );

  const injected = await rest("rpc/submit_complaint", {
    method: "POST",
    body: JSON.stringify({
      p_customer_name: "Security Check",
      p_customer_email: "security-check@example.com",
      p_customer_phone: "",
      p_subject: "Invalid category",
      p_description: "The function must reject this.",
      p_category_id: "not-a-real-category",
    }),
  });
  check(
    "submit_complaint rejects an unknown category",
    injected.status >= 400,
    `HTTP ${injected.status}`
  );

  const hiddenField = await rest("rpc/submit_complaint", {
    method: "POST",
    body: JSON.stringify({
      p_customer_name: "Security Check",
      p_customer_email: "security-check@example.com",
      p_customer_phone: "",
      p_subject: "Extra fields",
      p_description: "The function must not accept extra fields.",
      p_category_id: "cat-general",
      p_status: "Resolved",
    }),
  });
  check(
    "submit_complaint cannot be given a status or source",
    hiddenField.status >= 400,
    `HTTP ${hiddenField.status}`
  );

  const trackWrong = await rest("rpc/track_complaint", {
    method: "POST",
    body: JSON.stringify({
      p_ticket_number: "PSD-9999",
      p_email: "nobody@example.com",
    }),
  });
  check(
    "track_complaint returns nothing for wrong details",
    trackWrong.status === 200 && Array.isArray(trackWrong.body) && trackWrong.body.length === 0,
    `HTTP ${trackWrong.status}`
  );

  const trackInjection = await rest("rpc/track_complaint", {
    method: "POST",
    body: JSON.stringify({
      p_ticket_number: "PSD-1001' OR '1'='1",
      p_email: "' OR '1'='1",
    }),
  });
  check(
    "track_complaint resists SQL-injection text",
    trackInjection.status === 200 &&
      Array.isArray(trackInjection.body) &&
      trackInjection.body.length === 0,
    `HTTP ${trackInjection.status}`
  );
}

async function runSiteChecks() {
  console.log("\nPublic API and headers\n");

  const headers = await siteJson("/");
  check(
    "security headers are present",
    headers.headers.get("x-content-type-options") === "nosniff" &&
      headers.headers.get("x-frame-options") === "DENY",
    `x-frame-options=${headers.headers.get("x-frame-options")}`
  );
  check(
    "framework header is hidden",
    !headers.headers.get("x-powered-by"),
    `x-powered-by=${headers.headers.get("x-powered-by")}`
  );

  const badJson = await siteJson("/api/complaints", {
    method: "POST",
    body: "this is not json",
  });
  check("complaint API rejects malformed JSON", badJson.status === 400, `HTTP ${badJson.status}`);

  const honeypot = await siteJson("/api/complaints", {
    method: "POST",
    body: JSON.stringify({
      website: "http://spam.example",
      customer_name: "Bot",
      customer_email: "bot@example.com",
      subject: "Spam",
      description: "Spam",
      category_id: "cat-general",
    }),
  });
  check("complaint API rejects the honeypot", honeypot.status === 400, `HTTP ${honeypot.status}`);

  const empty = await siteJson("/api/complaints", {
    method: "POST",
    body: JSON.stringify({}),
  });
  check(
    "complaint API requires every field",
    empty.status === 400 && Boolean(empty.body?.errors),
    `HTTP ${empty.status}`
  );

  const tooLong = await siteJson("/api/complaints", {
    method: "POST",
    body: JSON.stringify({
      customer_name: "Security Check",
      customer_email: "security-check@example.com",
      customer_phone: "",
      subject: "Too long",
      description: "x".repeat(5001),
      category_id: "cat-general",
    }),
  });
  check(
    "complaint API enforces the description limit",
    tooLong.status === 400,
    `HTTP ${tooLong.status}`
  );

  const trackEmpty = await siteJson("/api/complaints/track", {
    method: "POST",
    body: JSON.stringify({}),
  });
  check("tracking API requires both values", trackEmpty.status === 400, `HTTP ${trackEmpty.status}`);

  const trackMissing = await siteJson("/api/complaints/track", {
    method: "POST",
    body: JSON.stringify({ ticketNumber: "PSD-9999", email: "nobody@example.com" }),
  });
  check(
    "tracking API gives the same answer for unknown details",
    trackMissing.status === 404,
    `HTTP ${trackMissing.status}`
  );

  const getComplaint = await siteJson("/api/complaints");
  check(
    "complaint endpoint does not accept GET",
    getComplaint.status === 405 || getComplaint.status === 404,
    `HTTP ${getComplaint.status}`
  );

  const protectedPage = await siteJson("/dashboard");
  check(
    "signed-out visitors are redirected away from the dashboard",
    protectedPage.status === 307 || protectedPage.status === 308 || protectedPage.status === 302,
    `HTTP ${protectedPage.status}`
  );
}

try {
  await runSupabaseChecks();
  await runSiteChecks();
} catch (error) {
  console.error("\nThe checks could not finish:", error.message);
  process.exit(1);
}

const failed = results.filter((result) => !result.passed);

console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

if (failed.length > 0) {
  console.log("\nFailed checks:");
  for (const failure of failed) console.log(`- ${failure.name}`);
  process.exit(1);
}
