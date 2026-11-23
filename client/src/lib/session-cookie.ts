// Cookie name shared by proxy.ts (no server-only imports allowed there) and lib/session.ts.
export const SESSION_COOKIE = "session";

/** Only allow same-site relative paths after login (prevents open redirects). */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
}
