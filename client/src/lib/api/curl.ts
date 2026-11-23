// Turns an API request into a copy-pasteable curl command for debugging.
// Secrets never appear in the output:
//  - the session token becomes "$GYM_TOKEN" (set it once in your shell),
//    unless showToken is set (API_LOG_CURL_TOKEN=1, never in production)
//  - Cookie / X-Api-Key values become ***
//  - any JSON body field whose name contains "password" becomes ***

const SECRET_HEADERS = new Set(["cookie", "x-api-key"]);
const TOKEN_VAR = "$GYM_TOKEN";

/** Quote for POSIX shells: wrap in '...' and escape embedded single quotes. */
function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function maskBody(body: string) {
  try {
    return JSON.stringify(JSON.parse(body), (key, value) =>
      /password/i.test(key) && typeof value === "string" ? "***" : value
    );
  } catch {
    return body; // not JSON
  }
}

export function toCurl({
  method,
  url,
  headers,
  body,
  showToken = false,
}: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  showToken?: boolean;
}) {
  const parts = ["curl"];
  if (method !== "GET") parts.push("-X", method);
  parts.push(shellQuote(url));
  for (const [name, value] of Object.entries(headers)) {
    const lower = name.toLowerCase();
    if (lower === "authorization" && showToken) {
      parts.push("-H", shellQuote(`${name}: ${value}`));
    } else if (lower === "authorization") {
      // Double quotes so the shell expands $GYM_TOKEN.
      parts.push("-H", `"Authorization: Bearer ${TOKEN_VAR}"`);
    } else {
      parts.push("-H", shellQuote(`${name}: ${SECRET_HEADERS.has(lower) ? "***" : value}`));
    }
  }
  if (body !== undefined) parts.push("--data-raw", shellQuote(maskBody(body)));
  return parts.join(" ");
}
