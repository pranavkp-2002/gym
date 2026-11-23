import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";

/**
 * The user's local calendar date (YYYY-MM-DD). The browser stores its
 * timezone in a `tz` cookie (see TimezoneSync); without it we fall back to UTC.
 * Reads cookies, so callers must render inside <Suspense>.
 */
export async function getUserToday() {
  // Reading the clock must happen at request time, never in a prerender.
  await connection();
  const tz = (await cookies()).get("tz")?.value;
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10); // invalid tz cookie
  }
}
