import { formatKg } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</dd>
      {note && <dd className="mt-0.5 text-xs text-muted-foreground">{note}</dd>}
    </div>
  );
}

/** Headline numbers. Plain text, no chart: a single value reads best as a number. */
export function StatTiles({ stats }: { stats: DashboardStats }) {
  const { totals, thisWeek, lastWeek } = stats;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        label="This week"
        value={plural(thisWeek.workouts, "workout")}
        note={lastWeek ? `${plural(lastWeek.workouts, "workout")} last week` : undefined}
      />
      <Tile
        label="Volume this week"
        value={formatKg(thisWeek.volume)}
        note={lastWeek ? `${formatKg(lastWeek.volume)} last week` : undefined}
      />
      <Tile label="Total workouts" value={String(totals.workouts)} />
      <Tile label="Total volume" value={formatKg(totals.volume)} />
    </dl>
  );
}
