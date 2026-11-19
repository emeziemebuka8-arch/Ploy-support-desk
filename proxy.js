import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Next.js 16 Proxy (formerly called Middleware).
 * ---------------------------------------------------------------
 * This runs before a page is rendered. It does two jobs:
 *
 * 1. Refreshes the Supabase session cookies when they are close to
 *    expiring, so an administrator does not get signed out mid-use.
 * 2. Sends signed-out visitors to /login when they open a protected
 *    page, and signed-in administrators away from /login.
 *
 * The layout in app/(app)/layout.js checks the user again before it
 * renders. Proxy is the friendly redirect; the layout is the real gate.
 */

const PROTECTED_PREFIXES = ["/dashboard", "/tickets", "/reports", "/settings"];

function isProtected(pathname) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function redirectTo(pathname, request, response) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirect = NextResponse.redirect(url);

  // Keep any refreshed session cookies on the redirect response.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));

  return redirect;
}

export async function proxy(request) {
  const { url, anonKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser() verifies the token with Supabase. Do not rely on
  // getSession() here: it only reads the cookie without checking it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    return redirectTo("/login", request, response);
  }

  if (user && pathname === "/login") {
    return redirectTo("/dashboard", request, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tickets/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
  ],
};
