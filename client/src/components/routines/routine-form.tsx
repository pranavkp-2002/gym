"use client";

// Client Component: building the exercise list needs instant add / reorder /
// remove. Saves through a Server Action.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/form/native-select";
import { saveRoutine } from "@/lib/actions/routines";
import { humanize } from "@/lib/format";
import type { Exercise } from "@/lib/types";

export type RoutineFormValues = { name: string; notes: string; exerciseIds: string[] };

export function RoutineForm({
  exercises,
  routineId,
  initial = { name: "", notes: "", exerciseIds: [] },
}: {
  /** May include hidden exercises: they resolve names but aren't offered in the picker. */
  exercises: Exercise[];
  /** Set when editing. */
  routineId?: string;
  initial?: RoutineFormValues;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [notes, setNotes] = useState(initial.notes);
  const [ids, setIds] = useState(initial.exerciseIds);
  const [muscleFilter, setMuscleFilter] = useState("");
  const [error, setError] = useState<string>();
  const [saving, startSaving] = useTransition();

  const byId = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const grouped = useMemo(() => {
    const groups = new Map<string, Exercise[]>();
    for (const e of exercises.filter((e) => !e.hidden))
      groups.set(e.muscleGroup, [...(groups.get(e.muscleGroup) ?? []), e]);
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [exercises]);
  const shownGroups = muscleFilter ? grouped.filter(([group]) => group === muscleFilter) : grouped;
  const inRoutine = new Set(ids);

  const move = (i: number, by: -1 | 1) =>
    setIds((list) => {
      const next = [...list];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Give the routine a name");
    if (ids.length === 0) return setError("Add at least one exercise");
    setError(undefined);
    startSaving(async () => {
      const res = await saveRoutine(
        { name: name.trim(), notes: notes.trim(), exercises: ids.map((exercise) => ({ exercise })) },
        routineId
      );
      if (res.error) return setError(res.error);
      router.push("/routines");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="routine-name">Routine name</Label>
        <Input
          id="routine-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Day 1 – Back & Biceps"
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Exercises</p>
        {ids.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No exercises yet. Add them below, in the order you do them.
          </p>
        ) : (
          <ol className="divide-y divide-border rounded-lg border border-border">
            {ids.map((id, i) => {
              const ex = byId.get(id);
              return (
                <li key={id} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-5 text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ex?.name ?? "Exercise"}</p>
                    {ex && (
                      <p className="text-xs text-muted-foreground">
                        {humanize(ex.muscleGroup)} · {humanize(ex.equipment)}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label={`Move ${ex?.name ?? "exercise"} up`}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={i === ids.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label={`Move ${ex?.name ?? "exercise"} down`}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIds((list) => list.filter((x) => x !== id))}
                    aria-label={`Remove ${ex?.name ?? "exercise"}`}
                  >
                    <X />
                  </Button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="muscle-filter">Muscle group</Label>
          <NativeSelect
            id="muscle-filter"
            value={muscleFilter}
            onChange={(e) => setMuscleFilter(e.target.value)}
            className="h-10"
          >
            <option value="">All muscle groups</option>
            {grouped.map(([group]) => (
              <option key={group} value={group}>
                {humanize(group)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-exercise">Add exercise</Label>
          <NativeSelect
            id="add-exercise"
            value=""
            onChange={(e) => e.target.value && setIds((list) => [...list, e.target.value])}
            className="h-10"
          >
            <option value="">{ids.length ? "Add another exercise…" : "Choose an exercise…"}</option>
            {shownGroups.map(([group, items]) => (
              <optgroup key={group} label={humanize(group)}>
                {items.map((ex) => (
                  <option key={ex.id} value={ex.id} disabled={inRoutine.has(ex.id)}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="routine-notes">Notes</Label>
        <Textarea
          id="routine-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything to remember for this day"
          maxLength={2000}
          rows={2}
        />
      </div>

      <div className="sticky bottom-16 z-10 -mx-4 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:px-0">
        <div className="min-w-0 flex-1 text-sm">
          {error ? (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          ) : (
            <p className="text-muted-foreground">
              {ids.length} exercise{ids.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : routineId ? "Save changes" : "Create routine"}
        </Button>
      </div>
    </form>
  );
}
