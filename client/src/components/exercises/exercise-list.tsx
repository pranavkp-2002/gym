import { Badge } from "@/components/ui/badge";
import { humanize } from "@/lib/format";
import type { Exercise } from "@/lib/types";
import { EyeOff } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/form/confirm-delete-button";
import { deleteExercise, hideExercise } from "@/lib/actions/exercises";
import { ExerciseActionButton } from "./exercise-action-button";

/** Server Component: pure rendering, no client JS except the delete/hide/inactive buttons. */
export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  if (exercises.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No exercises match these filters.
      </p>
    );
  }

  return (
    <section aria-label="Exercises">
      <p className="mb-2 text-xs text-muted-foreground">
        {exercises.length} exercise{exercises.length === 1 ? "" : "s"}
      </p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {exercises.map((exercise) => (
          <li key={exercise.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {exercise.name}
                {exercise.isCustom && (
                  <Badge variant="outline" className="ml-2 align-middle">
                    Custom
                  </Badge>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {humanize(exercise.muscleGroup)} · {humanize(exercise.equipment)} ·{" "}
                {humanize(exercise.category)}
              </p>
            </div>
            {exercise.isCustom ? (
              <div className="flex items-center gap-1">
                <ExerciseActionButton
                  action={hideExercise}
                  id={exercise.id}
                  label={`Mark ${exercise.name} inactive`}
                  icon={<EyeOff />}
                />
                <ConfirmDeleteButton
                  action={deleteExercise}
                  id={exercise.id}
                  title="Delete exercise?"
                  confirmMessage={`"${exercise.name}" will be permanently removed from your library.`}
                  label={`Delete ${exercise.name}`}
                />
              </div>
            ) : (
              <ExerciseActionButton
                action={hideExercise}
                id={exercise.id}
                label={`Hide ${exercise.name}`}
                icon={<EyeOff />}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
