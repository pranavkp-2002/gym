import Link from "next/link";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { ApiError, exercisesApi, statsApi } from "@/lib/api";
import { humanize } from "@/lib/format";
import { getUserToday } from "@/lib/today";
import { MuscleGroupChips } from "@/components/exercises/muscle-group-chips";
import { ExercisePicker } from "./exercise-picker";
import { RangeTabs } from "./range-tabs";
import { RecordTiles } from "./record-tiles";
import { RecordsTable } from "./records-table";
import { SessionHistory } from "./session-history";
import { SessionMetricChart, StrengthChart } from "./progress-charts";
import { parseRange, progressHref, rangeStart } from "./ranges";

type SearchParams = Record<string, string | string[] | undefined>;

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/** Server Component: everything is driven by ?muscleGroup=<group>&exercise=<id>&range=<key>. */
export async function ProgressView({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const exerciseId = typeof params.exercise === "string" ? params.exercise : undefined;

  const [allExercises, allRecords, options] = await Promise.all([
    exercisesApi.list({}, "include"),
    statsApi.records(),
    exercisesApi.options(),
  ]);
  const muscleGroup =
    typeof params.muscleGroup === "string" && options.muscleGroups.includes(params.muscleGroup)
      ? params.muscleGroup
      : undefined;
  const inGroup = (e: { muscleGroup: string }) => !muscleGroup || e.muscleGroup === muscleGroup;

  const loggedIds = new Set(allRecords.map((r) => r.exerciseId));
  // Hidden exercises stay pickable only if they have history to show.
  const usable = allExercises.filter((e) => !e.hidden || loggedIds.has(e.id));
  const known = exerciseId && usable.some((e) => e.id === exerciseId) ? exerciseId : undefined;
  const selectedGroup = usable.find((e) => e.id === known)?.muscleGroup;
  // The selected exercise stays in the picker even if the filter excludes it.
  const exercises = usable.filter((e) => inGroup(e) || e.id === known);
  const records = allRecords.filter(inGroup);

  const picker = (
    <div className="space-y-3">
      <MuscleGroupChips
        groups={options.muscleGroups}
        active={muscleGroup}
        // Keep the open exercise only if it belongs to the chosen group.
        hrefFor={(group) =>
          progressHref({
            muscleGroup: group,
            exercise: !group || group === selectedGroup ? known : undefined,
            range,
          })
        }
      />
      <ExercisePicker
        exercises={exercises}
        loggedIds={loggedIds}
        selected={known}
        range={range}
        muscleGroup={muscleGroup}
      />
    </div>
  );

  // No (valid) exercise chosen: personal records overview.
  if (!known) {
    return (
      <div className="space-y-4">
        {picker}
        {allRecords.length === 0 ? (
          <Empty>
            No workouts logged yet. Your personal records will show up here.
            <div>
              <Link href="/log" className={cn(buttonVariants(), "mt-4")}>Log a workout</Link>
            </div>
          </Empty>
        ) : records.length === 0 ? (
          <Empty>No {humanize(muscleGroup!)} exercises logged yet.</Empty>
        ) : (
          <RecordsTable records={records} muscleGroup={muscleGroup} />
        )}
      </div>
    );
  }

  const today = await getUserToday();
  const from = rangeStart(range, today);
  let progress;
  try {
    progress = await statsApi.exercise(known, from);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return <>{picker}<Empty>Exercise not found.</Empty></>;
    throw err;
  }

  const { exercise, records: prs, sessions, totalSessions, before } = progress;
  const weighted = prs.heaviestWeight !== null;

  return (
    <div className="space-y-4">
      {picker}

      <header className="flex flex-wrap items-end justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{exercise.name}</h2>
          <p className="text-sm text-muted-foreground">
            {humanize(exercise.muscleGroup)} · {humanize(exercise.equipment)} · {totalSessions} session
            {totalSessions === 1 ? "" : "s"} logged
          </p>
        </div>
        {totalSessions > 0 && <RangeTabs exercise={known} range={range} muscleGroup={muscleGroup} />}
      </header>

      {totalSessions === 0 ? (
        <Empty>
          You haven&apos;t logged {exercise.name} yet.
          <div>
            <Link href="/log" className={cn(buttonVariants(), "mt-4")}>Log a workout</Link>
          </div>
        </Empty>
      ) : (
        <>
          <RecordTiles records={prs} />
          {sessions.length === 0 ? (
            <Empty>No sessions in this time range.</Empty>
          ) : (
            <>
              {weighted ? (
                <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                  <StrengthChart sessions={sessions} />
                  <SessionMetricChart sessions={sessions} metric="volume" title="Volume per session" />
                </div>
              ) : (
                <SessionMetricChart sessions={sessions} metric="totalReps" title="Reps per session" />
              )}
              <SessionHistory sessions={sessions} before={before} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading progress">
      <div className="h-9 animate-pulse rounded-lg bg-muted/60" />
      <div className="h-64 animate-pulse rounded-lg bg-muted/60" />
      <div className="h-48 animate-pulse rounded-lg bg-muted/60" />
    </div>
  );
}
