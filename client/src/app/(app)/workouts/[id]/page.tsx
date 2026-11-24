import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, ListChecks, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/form/confirm-delete-button";
import { ExerciseActionButton as ActionButton } from "@/components/exercises/exercise-action-button";
import { ListSkeleton } from "@/components/workouts/skeletons";
import { routineFromWorkout } from "@/lib/actions/routines";
import { deleteWorkout } from "@/lib/actions/workouts";
import { formatKg, formatSets, formatWorkoutDate, humanize } from "@/lib/format";
import { routinesApi } from "@/lib/api";
import { loadWorkoutOr404 } from "@/lib/load-workout";
import { sameExercises } from "@/lib/routines";
import type { WorkoutSet } from "@/lib/types";

const topWeight = (sets: WorkoutSet[]) => Math.max(0, ...sets.map((s) => s.weight));

/** "+2.5 kg" / "−120 kg" / null when unchanged. */
function delta(now: number, before: number) {
  const d = Math.round((now - before) * 10) / 10;
  if (d === 0) return null;
  return { text: `${d > 0 ? "+" : "−"}${Math.abs(d).toLocaleString("en-US")} kg`, up: d > 0 };
}

function Delta({ value }: { value: ReturnType<typeof delta> }) {
  if (!value) return null;
  return (
    <span className={value.up ? "font-medium text-foreground" : "text-muted-foreground"}>{value.text}</span>
  );
}

async function WorkoutDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [workout, routines] = await Promise.all([loadWorkoutOr404(id), routinesApi.list()]);
  const setCount = workout.exercises.reduce((n, e) => n + e.sets.length, 0);
  const prev = workout.previousInRoutine;
  const volumeChange = prev ? delta(workout.volume, prev.volume) : null;
  // Offer "Save as routine" only if no routine already has these exercises.
  const exerciseIds = workout.exercises.flatMap((e) => (e.exercise ? [e.exercise.id] : []));
  const canSaveAsRoutine =
    !workout.routine &&
    !routines.some((r) =>
      sameExercises(r.exercises.flatMap((e) => (e.exercise ? [e.exercise.id] : [])), exerciseIds)
    );

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{workout.name}</h1>
          <time dateTime={workout.date.slice(0, 10)} className="text-sm text-muted-foreground">
            {formatWorkoutDate(workout.date)}
          </time>
          {workout.routine && (
            <Link
              href="/routines"
              className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ListChecks className="size-3" /> From routine {workout.routine.name}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canSaveAsRoutine && (
            <ActionButton
              action={routineFromWorkout}
              id={workout.id}
              label="Save as routine"
              icon={<ListChecks />}
              showLabel
            />
          )}
          <Link href={`/workouts/${workout.id}/edit`} className={buttonVariants({ variant: "secondary" })}>
            <Pencil /> Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteWorkout}
            id={workout.id}
            title="Delete workout?"
            confirmMessage={`"${workout.name}" and all its sets will be deleted. This can't be undone.`}
            label="Delete"
            showLabel
          />
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-3">
        {[
          ["Exercises", workout.exercises.length],
          ["Sets", setCount],
          ["Volume", formatKg(workout.volume)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border px-4 py-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
            {label === "Volume" && prev && (
              <dd className="text-xs text-muted-foreground tabular-nums">
                {volumeChange ? (
                  <>
                    <Delta value={volumeChange} /> vs{" "}
                  </>
                ) : (
                  "Same as "
                )}
                <Link href={`/workouts/${prev.id}`} className="hover:text-foreground hover:underline">
                  {formatWorkoutDate(prev.date, "short")}
                </Link>
              </dd>
            )}
          </div>
        ))}
      </dl>

      {workout.notes && (
        <p className="rounded-lg bg-muted/40 px-4 py-3 text-sm whitespace-pre-line">{workout.notes}</p>
      )}

      <div className="space-y-3">
        {workout.exercises.map((entry, i) => {
          const before = entry.exercise && prev?.sets[entry.exercise.id];
          const change = before ? delta(topWeight(entry.sets), topWeight(before)) : null;
          return (
            <section key={i} className="rounded-lg border border-border">
              <header className="border-b border-border px-4 py-3">
                <h2 className="flex items-baseline justify-between gap-3 text-sm font-medium">
                  <span>{entry.exercise?.name ?? "Deleted exercise"}</span>
                  {change && (
                    <span className="shrink-0 text-xs font-normal tabular-nums" title="Top weight vs last time">
                      <Delta value={change} /> top set
                    </span>
                  )}
                </h2>
                {entry.exercise && (
                  <p className="text-xs text-muted-foreground">
                    {humanize(entry.exercise.muscleGroup)} · {humanize(entry.exercise.equipment)}
                    {before && <> · last time {formatSets(before)}</>}
                  </p>
                )}
              </header>
              <table className="w-full text-sm tabular-nums">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-normal">Set</th>
                    <th className="px-4 py-2 text-right font-normal">kg</th>
                    <th className="px-4 py-2 text-right font-normal">Reps</th>
                    <th className="px-4 py-2 text-right font-normal">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.sets.map((set, j) => (
                    <tr key={j} className="border-t border-border/60">
                      <td className="px-4 py-2 text-muted-foreground">{j + 1}</td>
                      <td className="px-4 py-2 text-right">{set.weight}</td>
                      <td className="px-4 py-2 text-right">{set.reps}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{formatKg(set.weight * set.reps)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </article>
  );
}

export default function WorkoutPage({ params }: PageProps<"/workouts/[id]">) {
  return (
    <>
      <Link href="/workouts" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-2" })}>
        <ChevronLeft /> Workouts
      </Link>
      <Suspense fallback={<ListSkeleton rows={3} label="Loading workout" />}>
        <WorkoutDetail params={params} />
      </Suspense>
    </>
  );
}
