// Turns an API request into a copy-pasteable curl command for debugging.

/** Headers whose values are replaced with *** in printed commands. */
const SECRET_HEADERS = new Set(["authorization", "cookie", "x-api-key"]);

/** Quote for POSIX shells: wrap in '...' and escape embedded single quotes. */
function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function toCurl({
  method,
  url,
  headers,
  body,
}: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}) {
  const parts = ["curl"];
  if (method !== "GET") parts.push("-X", method);
  parts.push(shellQuote(url));
  for (const [name, value] of Object.entries(headers)) {
    const shown = SECRET_HEADERS.has(name.toLowerCase()) ? "***" : value;
    parts.push("-H", shellQuote(`${name}: ${shown}`));
  }
  if (body !== undefined) parts.push("--data-raw", shellQuote(body));
  return parts.join(" ");
}
