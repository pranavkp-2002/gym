import { Eye } from "lucide-react";
import { humanize } from "@/lib/format";
import type { Exercise } from "@/lib/types";
import { unhideExercise } from "@/lib/actions/exercises";
import { ExerciseActionButton } from "./exercise-action-button";

/**
 * Server Component: exercises the user hid, with a button to show each again.
 * Collapsed with native <details>; renders nothing when nothing is hidden.
 */
export function HiddenExercises({ exercises }: { exercises: Exercise[] }) {
  if (exercises.length === 0) return null;

  return (
    <details className="rounded-lg border border-border">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-muted-foreground">
        Hidden exercises ({exercises.length})
      </summary>
      <ul className="divide-y divide-border border-t border-border">
        {exercises.map((exercise) => (
          <li key={exercise.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-muted-foreground">{exercise.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {humanize(exercise.muscleGroup)} · {humanize(exercise.equipment)} ·{" "}
                {humanize(exercise.category)}
              </p>
            </div>
            <ExerciseActionButton
              action={unhideExercise}
              id={exercise.id}
              label="Show"
              icon={<Eye />}
              showLabel
            />
          </li>
        ))}
      </ul>
    </details>
  );
}
