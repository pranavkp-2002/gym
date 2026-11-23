import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session-cookie";

// The session is the Express-issued JWT in an httpOnly cookie (never readable by browser JS).
const MAX_AGE = 60 * 60 * 24 * 7; // keep in sync with the API's JWT_EXPIRES_IN (7d)

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** Only callable from Server Actions and Route Handlers. */
export async function setSession(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Only callable from Server Actions and Route Handlers. */
export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
