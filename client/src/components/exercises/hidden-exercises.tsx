import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { humanize } from "@/lib/format";
import type { Exercise } from "@/lib/types";
import { unhideExercise } from "@/lib/actions/exercises";
import { ExerciseActionButton } from "./exercise-action-button";

/**
 * Server Component: exercises the user hid (predefined) or marked inactive (custom),
 * with a button to make each available again.
 * Collapsed with native <details>; renders nothing when nothing is hidden.
 */
export function HiddenExercises({ exercises }: { exercises: Exercise[] }) {
  if (exercises.length === 0) return null;

  return (
    <details className="rounded-lg border border-border">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-muted-foreground">
        Hidden &amp; inactive exercises ({exercises.length})
      </summary>
      <ul className="divide-y divide-border border-t border-border">
        {exercises.map((exercise) => (
          <li key={exercise.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-muted-foreground">
                {exercise.name}
                {exercise.isCustom && (
                  <Badge variant="outline" className="ml-2 align-middle">
                    Inactive
                  </Badge>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {humanize(exercise.muscleGroup)} · {humanize(exercise.equipment)} ·{" "}
                {humanize(exercise.category)}
              </p>
            </div>
            {exercise.isCustom ? (
              <ExerciseActionButton
                action={unhideExercise}
                id={exercise.id}
                label={`Mark ${exercise.name} active`}
                icon={<Eye />}
              />
            ) : (
              <ExerciseActionButton
                action={unhideExercise}
                id={exercise.id}
                label="Show"
                icon={<Eye />}
                showLabel
              />
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
