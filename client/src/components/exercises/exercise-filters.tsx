import Link from "next/link";
import { Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/form/native-select";
import { MuscleGroupChips } from "./muscle-group-chips";
import { humanize } from "@/lib/format";
import type { ExerciseFilters, ExerciseOptions } from "@/lib/types";

/** Build an /exercises URL from the current filters plus a change. */
function filterHref(current: ExerciseFilters, patch: ExerciseFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/exercises?${qs}` : "/exercises";
}

/**
 * Server Component. Filters live in the URL, so they're shareable, survive
 * refresh, and need no client state: chips are links, search is a GET form.
 */
export function ExerciseFiltersBar({
  filters,
  options,
}: {
  filters: ExerciseFilters;
  options: ExerciseOptions;
}) {
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-3">
      <form action="/exercises" className="flex flex-wrap gap-2">
        {filters.muscleGroup && (
          <input type="hidden" name="muscleGroup" value={filters.muscleGroup} />
        )}
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder="Search exercises"
            defaultValue={filters.q}
            className="pl-8"
            aria-label="Search exercises"
          />
        </div>
        <NativeSelect
          name="equipment"
          defaultValue={filters.equipment ?? ""}
          className="w-auto"
          aria-label="Filter by equipment"
        >
          <option value="">All equipment</option>
          {options.equipment.map((e) => (
            <option key={e} value={e}>
              {humanize(e)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          name="category"
          defaultValue={filters.category ?? ""}
          className="w-auto"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {options.categories.map((c) => (
            <option key={c} value={c}>
              {humanize(c)}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {hasFilters && (
          <Link href="/exercises" className={buttonVariants({ variant: "ghost" })}>
            Clear
          </Link>
        )}
      </form>

      <MuscleGroupChips
        groups={options.muscleGroups}
        active={filters.muscleGroup}
        hrefFor={(group) => filterHref(filters, { muscleGroup: group })}
      />
    </div>
  );
}
