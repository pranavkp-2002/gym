import Link from "next/link";
import { Trophy } from "lucide-react";
import { formatKg, formatWorkoutDate } from "@/lib/format";
import type { ExerciseProgress, PersonalRecord } from "@/lib/types";

function Tile({ label, value, record }: { label: string; value: string; record: PersonalRecord }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Trophy className="size-3" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{value}</dd>
      <dd className="mt-0.5 text-xs text-muted-foreground">
        <Link href={`/workouts/${record.workoutId}`} className="hover:text-foreground hover:underline">
          {formatWorkoutDate(record.date)}
        </Link>
      </dd>
    </div>
  );
}

/** All-time personal records. Tiles with no value (e.g. weight for bodyweight moves) are hidden. */
export function RecordTiles({ records }: { records: ExerciseProgress["records"] }) {
  const { heaviestWeight, best1RM, bestVolume, mostReps } = records;
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {heaviestWeight && (
        <Tile
          label="Heaviest set"
          value={`${heaviestWeight.value} kg × ${heaviestWeight.reps}`}
          record={heaviestWeight}
        />
      )}
      {best1RM && <Tile label="Best est. 1RM" value={`${best1RM.value} kg`} record={best1RM} />}
      {bestVolume && <Tile label="Best session volume" value={formatKg(bestVolume.value)} record={bestVolume} />}
      {mostReps && <Tile label="Most reps in a set" value={String(mostReps.value)} record={mostReps} />}
    </dl>
  );
}
