"use client";

// The only parts of the login page that depend on the URL. They stream in on
// their own, so the form itself is rendered once and never replaced (typing
// into a fallback form that later gets swapped out would lose the input).

import { useSearchParams } from "next/navigation";

/** Hidden `next` field; the Server Action validates it (relative paths only). */
export function NextField() {
  const next = useSearchParams().get("next");
  return next ? <input type="hidden" name="next" value={next} /> : null;
}

export function ExpiredNotice() {
  if (!useSearchParams().has("expired")) return null;
  return (
    <p className="mb-4 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
      Your session ended. Please sign in again.
    </p>
  );
}
