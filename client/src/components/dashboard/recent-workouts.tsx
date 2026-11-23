import Link from "next/link";
import { formatKg, formatWorkoutDate } from "@/lib/format";
import type { WorkoutSummary } from "@/lib/types";

export function RecentWorkouts({ workouts }: { workouts: WorkoutSummary[] }) {
  return (
    <ul className="divide-y divide-border">
      {workouts.map((w) => (
        <li key={w.id}>
          <Link
            href={`/workouts/${w.id}`}
            className="flex items-baseline justify-between gap-3 py-2.5 text-sm hover:text-foreground"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{w.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatWorkoutDate(w.date, "short")}
              </span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {formatKg(w.volume)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
