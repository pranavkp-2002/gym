import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatKg, formatSets, formatWorkoutDate } from "@/lib/format";
import type { ProgressSession } from "@/lib/types";

/** "+5", "−2.5", "±0" with an accessible sign (not color alone). */
function Delta({ value, unit = "" }: { value: number | null; unit?: string }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "±";
  return (
    <span className="text-muted-foreground tabular-nums">
      {sign}
      {Math.abs(rounded).toLocaleString("en-US")}
      {unit}
    </span>
  );
}

/**
 * Newest first. Each row compares with the previous session of this exercise
 * (which may be outside the selected range, so `before` is passed in).
 */
export function SessionHistory({
  sessions,
  before,
}: {
  sessions: ProgressSession[]; // oldest first
  /** The session just before the first one shown, for the first row's comparison. */
  before: ProgressSession | null;
}) {
  const rows = sessions.map((s, i) => {
    const prev = i > 0 ? sessions[i - 1] : before;
    return {
      s,
      dTop: prev ? s.topWeight - prev.topWeight : null,
      dVolume: prev ? s.volume - prev.volume : null,
    };
  });

  return (
    <section aria-label="Session history" className="rounded-lg border border-border">
      <h2 className="border-b border-border px-4 py-3 text-sm font-medium">Session history</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2 text-left font-normal">Date</th>
              <th scope="col" className="px-4 py-2 text-left font-normal">Sets (kg × reps)</th>
              <th scope="col" className="px-4 py-2 text-right font-normal">Top set</th>
              <th scope="col" className="px-4 py-2 text-right font-normal">vs prev</th>
              <th scope="col" className="px-4 py-2 text-right font-normal">Volume</th>
              <th scope="col" className="px-4 py-2 text-right font-normal">vs prev</th>
            </tr>
          </thead>
          <tbody>
            {rows.reverse().map(({ s, dTop, dVolume }) => (
              <tr key={s.workoutId} className="border-t border-border/60 align-top">
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <Link href={`/workouts/${s.workoutId}`} className="hover:underline">
                    {formatWorkoutDate(s.date, "short")}
                  </Link>
                  {s.isWeightPR && (
                    <Badge variant="secondary" className="ml-2 align-middle">PR</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{formatSets(s.sets)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                  {s.topWeight} × {s.topWeightReps}
                </td>
                <td className="px-4 py-2.5 text-right"><Delta value={dTop} unit=" kg" /></td>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{formatKg(s.volume)}</td>
                <td className="px-4 py-2.5 text-right"><Delta value={dVolume} unit=" kg" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
