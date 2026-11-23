import "server-only";
import { redirect } from "next/navigation";
import { getSessionToken } from "../session";
import { toCurl } from "./curl";

// Server-side only: pages and Server Actions call the Express API directly,
// so the browser never talks to it and the URL stays out of the client bundle.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

/**
 * Print every API call as a curl command in the Next.js server terminal.
 * On in development, off in production; override with API_LOG_CURL=1 or 0.
 */
const LOG_CURL =
  process.env.API_LOG_CURL !== undefined
    ? process.env.API_LOG_CURL === "1"
    : process.env.NODE_ENV === "development";

/**
 * Print the real session token in logged curl commands instead of $GYM_TOKEN.
 * Opt-in with API_LOG_CURL_TOKEN=1; ignored in production.
 */
const LOG_CURL_TOKEN =
  process.env.API_LOG_CURL_TOKEN === "1" && process.env.NODE_ENV !== "production";

/** An error response from the API, with a message safe to show the user. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type QueryValue = string | number | undefined | null;

export type RequestOptions = {
  /** Appended as ?key=value; undefined, null and "" are skipped. */
  query?: Record<string, QueryValue>;
  /** Serialized as JSON. */
  body?: unknown;
  headers?: Record<string, string>;
  /**
   * Send the signed-in user's token (default). On 401 the user is sent to
   * sign in again. Set false for login/register, where 401 means bad input.
   */
  auth?: boolean;
};

/** Route Handler that clears an invalid session cookie, then goes to /login. */
export const SESSION_EXPIRED_PATH = "/session-expired";

/** Encode one path segment, e.g. an id from the URL. */
export const seg = (value: string) => encodeURIComponent(value);

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path, API_URL);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function logCall(curl: string, summary: string) {
  if (!LOG_CURL) return;
  console.log(`\x1b[36m[api]\x1b[0m ${summary}${curl ? `\n${curl}` : ""}`);
}

/**
 * Next.js (Cache Components / Partial Prefetching) prerenders pages
 * speculatively and cancels unfinished fetches when that prerender ends.
 * That's expected, not an API failure.
 */
function isPrerenderCancel(err: unknown) {
  const e = err as Error | undefined;
  return e?.name === "AbortError" || /During prerendering, fetch\(\) rejects/.test(e?.message ?? "");
}

/**
 * The single fetch used for every Express API call.
 * Returns parsed JSON (undefined for 204) or throws ApiError on non-2xx.
 */
export async function request<T = void>(
  method: Method,
  path: string,
  { query, body, headers: extra, auth = true }: RequestOptions = {}
): Promise<T> {
  const url = buildUrl(path, query);
  const headers: Record<string, string> = { Accept: "application/json", ...extra };
  if (auth) {
    const token = await getSessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const payload = body === undefined ? undefined : JSON.stringify(body);
  if (payload !== undefined) headers["Content-Type"] = "application/json";

  const curl = LOG_CURL ? toCurl({ method, url, headers, body: payload, showToken: LOG_CURL_TOKEN }) : "";
  const started = performance.now();
  const { pathname, search } = new URL(url);
  const label = `${method} ${pathname}${search}`;

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: payload });
  } catch (err) {
    if (isPrerenderCancel(err)) {
      logCall("", `\x1b[2m${label} → cancelled (Next.js prerender finished)\x1b[0m`);
    } else {
      logCall(curl, `${label} → network error: ${(err as Error).message}`);
    }
    throw err;
  }
  logCall(curl, `${label} → ${res.status} (${Math.round(performance.now() - started)}ms)`);

  // Missing, expired or revoked session. redirect() works in Server Components
  // and Server Actions; the route clears the cookie so /login doesn't bounce back.
  if (res.status === 401 && auth) redirect(SESSION_EXPIRED_PATH);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
