import Link from "next/link";
import { formatWorkoutDate, humanize } from "@/lib/format";
import type { RecordRow } from "@/lib/types";
import { progressHref } from "./ranges";

/** Personal records across every logged exercise; each row opens its progress. */
export function RecordsTable({
  records,
  muscleGroup,
}: {
  records: RecordRow[];
  /** Active muscle-group filter, kept when opening a row. */
  muscleGroup?: string;
}) {
  return (
    <section aria-label="Personal records" className="rounded-lg border border-border">
      <h2 className="border-b border-border px-4 py-3 text-sm font-medium">Personal records</h2>
      <ul className="divide-y divide-border">
        {records.map((r) => {
          const weighted = r.heaviest.weight > 0;
          return (
            <li key={r.exerciseId}>
              <Link
                href={progressHref({ exercise: r.exerciseId, muscleGroup })}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {humanize(r.muscleGroup)} · {r.sessions} session{r.sessions === 1 ? "" : "s"} · last{" "}
                    {formatWorkoutDate(r.lastDate, "short")}
                  </span>
                </span>
                <span className="text-right tabular-nums">
                  <span className="block text-sm font-medium">
                    {weighted ? `${r.heaviest.weight} kg × ${r.heaviest.reps}` : `${r.heaviest.reps} reps`}
                  </span>
                  {weighted && (
                    <span className="text-xs text-muted-foreground">est. 1RM {r.best1RM} kg</span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
