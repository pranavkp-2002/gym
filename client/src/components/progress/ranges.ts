// Time ranges for the progress page (?range=3m). Records are always all-time.

export const RANGES = [
  { key: "1m", label: "1M", months: 1 },
  { key: "3m", label: "3M", months: 3 },
  { key: "6m", label: "6M", months: 6 },
  { key: "1y", label: "1Y", months: 12 },
  { key: "all", label: "All", months: null },
] as const;

export type RangeKey = (typeof RANGES)[number]["key"];

export function parseRange(value: unknown): RangeKey {
  return RANGES.some((r) => r.key === value) ? (value as RangeKey) : "all";
}

/** Start date (YYYY-MM-DD) for a range, counted back from the user's today. */
export function rangeStart(range: RangeKey, today: string): string | undefined {
  const months = RANGES.find((r) => r.key === range)?.months;
  if (!months) return undefined;
  const d = new Date(`${today}T00:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

export function progressHref(exercise: string | undefined, range: RangeKey) {
  const qs = new URLSearchParams();
  if (exercise) qs.set("exercise", exercise);
  if (range !== "all") qs.set("range", range);
  const s = qs.toString();
  return s ? `/progress?${s}` : "/progress";
}
