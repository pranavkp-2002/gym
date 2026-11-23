"use client";

// Stores the browser's timezone in a cookie so Server Components can work out
// the user's local "today" (for "this week" stats). Renders nothing.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const current = document.cookie.match(/(?:^|;\s*)tz=([^;]*)/)?.[1];
    if (current && decodeURIComponent(current) === tz) return;
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;

    // Without the cookie the server assumed UTC. Re-render only if that gave
    // a different calendar day than the user's local one.
    const now = new Date();
    const local = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const utc = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
    if (local !== utc) router.refresh();
  }, [router]);

  return null;
}
