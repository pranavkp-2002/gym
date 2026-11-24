import { Suspense } from "react";
import Link from "next/link";
import { ChevronDown, History, ListChecks, Pencil, Plus } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ListSkeleton } from "@/components/workouts/skeletons";
import { StartRoutineButton } from "@/components/routines/start-routine-button";
import { routinesApi } from "@/lib/api";
import { formatKg, formatSets, formatWorkoutDate, humanize } from "@/lib/format";
import { inUpNextOrder, upNext } from "@/lib/routines";
import type { Routine } from "@/lib/types";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "Deadlift, Lat Pulldown, Barbell Row +4 more" */
function exerciseSummary(r: Routine, shown = 3) {
  const names = r.exercises.map((e) => e.exercise?.name ?? "Deleted exercise");
  const rest = names.length - shown;
  return names.slice(0, shown).join(", ") + (rest > 0 ? ` +${rest} more` : "");
}

function RoutineCard({ routine, next }: { routine: Routine; next: boolean }) {
  const last = routine.lastWorkout;
  return (
    <section
      aria-label={routine.name}
      className={cn("rounded-lg border", next ? "border-primary/60 bg-primary/5" : "border-border")}
    >
      <header className="flex items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2">
            <span className="truncate font-medium">{routine.name}</span>
            {next && <Badge className="shrink-0">Up next</Badge>}
          </h2>
          {last ? (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground tabular-nums">
              <History className="size-3" />
              <Link href={`/workouts/${last.id}`} className="underline-offset-2 hover:text-foreground hover:underline">
                {formatWorkoutDate(last.date, "short")}
              </Link>
              · {formatKg(last.volume)} · done {plural(routine.sessions, "time")}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">Not done yet</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <StartRoutineButton routine={routine} />
          <Link
            href={`/routines/${routine.id}/edit`}
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            aria-label={`Edit ${routine.name}`}
            title="Edit"
          >
            <Pencil />
          </Link>
        </div>
      </header>

      {/* Collapsed: one line of exercise names. Open: each exercise with last time's sets. */}
      <details className="group border-t border-border/60">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1 truncate">
            <span className="tabular-nums">{plural(routine.exercises.length, "exercise")}</span> ·{" "}
            {exerciseSummary(routine)}
          </span>
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        {routine.notes && (
          <p className="px-4 pb-2 text-xs whitespace-pre-line text-muted-foreground">{routine.notes}</p>
        )}
        <ol className="divide-y divide-border/60 border-t border-border/60 text-sm">
          {routine.exercises.map(({ exercise }, i) => {
            const sets = exercise && last?.sets[exercise.id];
            return (
              <li key={exercise?.id ?? `deleted-${i}`} className="flex items-baseline gap-3 px-4 py-2">
                <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate", !exercise && "text-muted-foreground italic")}>
                    {exercise?.name ?? "Deleted exercise"}
                  </p>
                  {exercise && <p className="text-xs text-muted-foreground">{humanize(exercise.muscleGroup)}</p>}
                </div>
                {sets && (
                  <span className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {formatSets(sets)}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </details>
    </section>
  );
}

async function RoutineList() {
  const routines = await routinesApi.list();
  if (routines.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <ListChecks className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No routines yet. Create one, or open a past workout and choose{" "}
          <span className="font-medium text-foreground">Save as routine</span>.
        </p>
        <Link href="/routines/new" className={cn(buttonVariants(), "mt-4")}>
          <Plus /> New routine
        </Link>
      </div>
    );
  }
  const next = upNext(routines);
  return (
    <div className="space-y-3">
      {inUpNextOrder(routines).map((r) => (
        <RoutineCard key={r.id} routine={r} next={r.id === next?.id} />
      ))}
    </div>
  );
}

export default function RoutinesPage() {
  return (
    <>
      {/* Two buttons don't fit beside the title on a phone: they wrap below it there. */}
      <div className="flex flex-wrap items-start justify-between gap-x-4">
        <PageHeader title="Routines" description="Start one to log it with last time's sets filled in." />
        <div className="mb-6 flex gap-2">
          <Link href="/log" className={buttonVariants({ variant: "secondary" })}>
            <Plus /> Empty workout
          </Link>
          <Link href="/routines/new" className={buttonVariants()}>
            <Plus /> New routine
          </Link>
        </div>
      </div>
      <Suspense fallback={<ListSkeleton rows={3} label="Loading routines" />}>
        <RoutineList />
      </Suspense>
    </>
  );
}
