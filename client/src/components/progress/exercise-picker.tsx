import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/form/native-select";
import { humanize } from "@/lib/format";
import type { Exercise } from "@/lib/types";
import type { RangeKey } from "./ranges";

/**
 * Server Component: a plain GET form, so picking an exercise is a normal
 * navigation to /progress?exercise=<id> and works without JavaScript.
 * Exercises you've logged are listed first.
 */
export function ExercisePicker({
  exercises,
  loggedIds,
  selected,
  range,
}: {
  exercises: Exercise[];
  loggedIds: Set<string>;
  selected?: string;
  range: RangeKey;
}) {
  const logged = exercises.filter((e) => loggedIds.has(e.id));
  const groups = new Map<string, Exercise[]>();
  for (const e of exercises.filter((e) => !loggedIds.has(e.id))) {
    groups.set(e.muscleGroup, [...(groups.get(e.muscleGroup) ?? []), e]);
  }

  return (
    <form action="/progress" className="flex gap-2">
      {range !== "all" && <input type="hidden" name="range" value={range} />}
      <NativeSelect
        // Remount when the selection changes: an uncontrolled <select> keeps
        // its old value across client navigations otherwise.
        key={selected ?? "none"}
        name="exercise"
        defaultValue={selected ?? ""}
        aria-label="Exercise"
        className="h-9 flex-1"
        required
      >
        <option value="" disabled>
          Choose an exercise…
        </option>
        {logged.length > 0 && (
          <optgroup label="Logged">
            {logged.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </optgroup>
        )}
        {[...groups.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([group, items]) => (
            <optgroup key={group} label={humanize(group)}>
              {items.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </optgroup>
          ))}
      </NativeSelect>
      <Button type="submit" variant="secondary" className="h-9">
        View
      </Button>
    </form>
  );
}
