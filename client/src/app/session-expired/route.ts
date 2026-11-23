import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * The API rejected the session (expired, signed out elsewhere, account gone).
 * Server Components can't change cookies, so they redirect here; this clears
 * the stale cookie (otherwise proxy.ts would bounce /login back to /) and
 * sends the user to sign in.
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?expired=1", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
