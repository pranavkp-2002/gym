import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/form/confirm-delete-button";
import { ListSkeleton } from "@/components/workouts/skeletons";
import { deleteWorkout } from "@/lib/actions/workouts";
import { formatKg, formatWorkoutDate, humanize } from "@/lib/format";
import { loadWorkoutOr404 } from "@/lib/load-workout";

async function WorkoutDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workout = await loadWorkoutOr404(id);
  const setCount = workout.exercises.reduce((n, e) => n + e.sets.length, 0);

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{workout.name}</h1>
          <time dateTime={workout.date.slice(0, 10)} className="text-sm text-muted-foreground">
            {formatWorkoutDate(workout.date)}
          </time>
        </div>
        <div className="flex items-center gap-2">
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
          </div>
        ))}
      </dl>

      {workout.notes && (
        <p className="rounded-lg bg-muted/40 px-4 py-3 text-sm whitespace-pre-line">{workout.notes}</p>
      )}

      <div className="space-y-3">
        {workout.exercises.map((entry, i) => (
          <section key={i} className="rounded-lg border border-border">
            <header className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium">{entry.exercise?.name ?? "Deleted exercise"}</h2>
              {entry.exercise && (
                <p className="text-xs text-muted-foreground">
                  {humanize(entry.exercise.muscleGroup)} · {humanize(entry.exercise.equipment)}
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
        ))}
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
