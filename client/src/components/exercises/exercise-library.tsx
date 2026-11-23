import { exercisesApi } from "@/lib/api";
import type { ExerciseFilters, ExerciseOptions } from "@/lib/types";
import { ExerciseFiltersBar } from "./exercise-filters";
import { ExerciseList } from "./exercise-list";
import { AddExerciseForm } from "./add-exercise-form";

type SearchParams = Record<string, string | string[] | undefined>;

/** Keep only filter values the API accepts, so a bad URL can't cause an error. */
function parseFilters(params: SearchParams, options: ExerciseOptions): ExerciseFilters {
  const one = (key: string) => {
    const v = params[key];
    return typeof v === "string" && v ? v : undefined;
  };
  const allowed = (value: string | undefined, list: string[]) =>
    value && list.includes(value) ? value : undefined;

  return {
    q: one("q")?.slice(0, 80),
    muscleGroup: allowed(one("muscleGroup"), options.muscleGroups),
    equipment: allowed(one("equipment"), options.equipment),
    category: allowed(one("category"), options.categories),
  };
}

/** Server Component: reads the URL filters and fetches on the server. */
export async function ExerciseLibrary({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [params, options] = await Promise.all([searchParams, exercisesApi.options()]);
  const filters = parseFilters(params, options);
  const exercises = await exercisesApi.list(filters);

  return (
    <div className="space-y-6">
      <AddExerciseForm options={options} />
      <ExerciseFiltersBar filters={filters} options={options} />
      <ExerciseList exercises={exercises} />
    </div>
  );
}

export function ExerciseLibrarySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading exercises">
      <div className="h-10 animate-pulse rounded-lg bg-muted" />
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />
      ))}
    </div>
  );
}
