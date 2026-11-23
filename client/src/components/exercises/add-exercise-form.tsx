"use client";

// Client Component only for useActionState: showing validation errors and
// keeping the typed values. The data itself is still saved by a Server Action.

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/form/native-select";
import { createExercise, type CreateExerciseState } from "@/app/exercises/actions";
import { humanize } from "@/lib/format";
import type { ExerciseOptions } from "@/lib/types";

const initialState: CreateExerciseState = {};

export function AddExerciseForm({ options }: { options: ExerciseOptions }) {
  const [state, action, pending] = useActionState(createExercise, initialState);
  const v = state.values ?? {};

  const selects = [
    { name: "muscleGroup", label: "Muscle group", items: options.muscleGroups },
    { name: "equipment", label: "Equipment", items: options.equipment },
    { name: "category", label: "Category", items: options.categories },
  ];

  return (
    // Native <details> collapses the form without any JS state.
    <details className="group rounded-lg border border-border">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium">
        <Plus className="size-4 transition-transform group-open:rotate-45" />
        Add custom exercise
      </summary>

      <form action={action} className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="exercise-name">Name</Label>
          <Input
            id="exercise-name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="e.g. Cable Lateral Raise"
            defaultValue={v.name}
          />
        </div>

        {selects.map((s) => (
          <div key={s.name} className="space-y-1.5">
            <Label htmlFor={`exercise-${s.name}`}>{s.label}</Label>
            <NativeSelect
              // React's form reset ignores an updated defaultValue on <select>,
              // so remount it after a failed submit to restore the user's choice.
              key={state.attempt ?? 0}
              id={`exercise-${s.name}`}
              name={s.name}
              required
              defaultValue={v[s.name] ?? ""}
            >
              <option value="" disabled>
                Select…
              </option>
              {s.items.map((item) => (
                <option key={item} value={item}>
                  {humanize(item)}
                </option>
              ))}
            </NativeSelect>
          </div>
        ))}

        <div className="flex items-end gap-3 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add exercise"}
          </Button>
          <p aria-live="polite" className="text-sm">
            {state.error && <span className="text-destructive">{state.error}</span>}
            {state.success && <span className="text-muted-foreground">{state.success}</span>}
          </p>
        </div>
      </form>
    </details>
  );
}
