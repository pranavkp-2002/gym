/** "full_body" -> "Full body" */
export function humanize(value: string) {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Workout dates are calendar days stored as midnight UTC, so always format
 * them in UTC. Otherwise a server or browser west of UTC shows the day before.
 */
export function formatWorkoutDate(iso: string, style: "long" | "short" = "long") {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(style === "long" && { year: "numeric" }),
  });
}

/** "2026-11-23T00:00:00.000Z" -> "2026-11-23" (for <input type="date">). */
export function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export function formatKg(value: number) {
  return `${Math.round(value).toLocaleString("en-US")} kg`;
}

/** [{reps: 8, weight: 60}, ...] -> "60×8, 60×8" */
export function formatSets(sets: { reps: number; weight: number }[]) {
  return sets.map((s) => `${s.weight}×${s.reps}`).join(", ");
}

/** "2026-11-16" -> "16 Nov" (calendar day, UTC). */
export function formatDayMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  });
}
