"use client";

// The one place in the logging flow that needs client state: adding exercises
// and sets with instant feedback. Data still loads and saves on the server
// (initial props + Server Actions).

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, History, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/form/native-select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { setRoutineExercises } from "@/lib/actions/routines";
import { getPreviousPerformance, saveWorkout } from "@/lib/actions/workouts";
import { sameExercises } from "@/lib/routines";
import { formatKg, formatSets, formatWorkoutDate, humanize } from "@/lib/format";
import type { Exercise, PreviousPerformance, WorkoutPayload } from "@/lib/types";
import {
  buildPayload,
  DRAFT_STORAGE_KEY as DRAFT_KEY,
  draftVolume,
  emptyDraft,
  emptySet,
  isDraftEmpty,
  localToday,
  newKey,
  parseStoredDraft,
  type Entry,
  type SetRow,
  type WorkoutDraft,
} from "@/lib/workout-draft";

export function WorkoutForm({
  exercises,
  workoutId,
  initial,
}: {
  /** May include hidden exercises: they resolve names but aren't offered in the picker. */
  exercises: Exercise[];
  /** Set when editing an existing workout. */
  workoutId?: string;
  initial?: WorkoutDraft;
}) {
  const isEdit = Boolean(workoutId);
  const router = useRouter();
  const [draft, setDraft] = useState<WorkoutDraft>(() => initial ?? emptyDraft(""));
  const [previous, setPrevious] = useState<PreviousPerformance>({});
  const [error, setError] = useState<string>();
  const [restored, setRestored] = useState(false);
  const [loaded, setLoaded] = useState(isEdit);
  const [saving, startSaving] = useTransition();
  /** Show the name/date inputs for a routine workout (collapsed into one line by default). */
  const [editDetails, setEditDetails] = useState(false);
  /** Set while asking "Also update the routine?" before saving. */
  const [pendingSave, setPendingSave] = useState<WorkoutPayload | null>(null);
  /** Muscle group the "Add exercise" picker is narrowed to; "" = all. */
  const [muscleFilter, setMuscleFilter] = useState("");
  const requested = useRef(new Set<string>());
  const initialized = useRef(false);
  /** What this form last wrote to localStorage, to spot changes made elsewhere. */
  const lastStored = useRef<string | null>(null);

  const byId = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const grouped = useMemo(() => {
    const groups = new Map<string, Exercise[]>();
    for (const e of exercises.filter((e) => !e.hidden)) groups.set(e.muscleGroup, [...(groups.get(e.muscleGroup) ?? []), e]);
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [exercises]);
  const shownGroups = muscleFilter ? grouped.filter(([group]) => group === muscleFilter) : grouped;
  const nameOf = (id: string) => byId.get(id)?.name ?? "Exercise";

  // New workouts: restore an unsaved draft (localStorage) and default the date
  // to the user's local today. Both are browser-only, so this runs after mount.
  // Once only: Next keeps visited pages mounted (hidden via <Activity>) and
  // re-runs effects when they're shown again, and state is already current.
  useEffect(() => {
    if (isEdit || initialized.current) return;
    initialized.current = true;
    let saved: WorkoutDraft | null = null;
    try {
      lastStored.current = localStorage.getItem(DRAFT_KEY);
      saved = parseStoredDraft(lastStored.current);
    } catch {}
    if (saved && !isDraftEmpty(saved)) {
      setDraft(saved);
      // A routine just started from the Routines page isn't "restored" work.
      setRestored(!saved.entries.every((e) => e.autofill));
    } else {
      setDraft((d) => ({ ...d, date: d.date || localToday() }));
    }
    setLoaded(true);
  }, [isEdit]);

  // Keep the draft in localStorage so a refresh or closed tab loses nothing.
  // This also re-runs when the page is shown again; if the draft was saved or
  // deleted from the Workouts list meanwhile, adopt that instead of overwriting it.
  useEffect(() => {
    if (isEdit || !loaded) return;
    try {
      const current = localStorage.getItem(DRAFT_KEY);
      if (current !== lastStored.current) {
        lastStored.current = current;
        // Syncing from an external system (localStorage) on re-show; there is
        // no event to subscribe to while this page was hidden.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft(parseStoredDraft(current) ?? emptyDraft(localToday()));
        setRestored(false);
        // A different draft: "last time" sets cached for the old one may be stale.
        requested.current.clear();
        setPrevious({});
        return;
      }
      const next = isDraftEmpty(draft) ? null : JSON.stringify(draft);
      if (next === null) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, next);
      lastStored.current = next;
    } catch {}
  }, [draft, isEdit, loaded]);

  // Fetch "last time" sets for exercises we haven't asked about yet, then
  // pre-fill sets the user hasn't touched (remembers previous weights).
  const exerciseIds = draft.entries.map((e) => e.exerciseId).join(",");
  useEffect(() => {
    const missing = exerciseIds
      .split(",")
      .filter((id) => id && !requested.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => requested.current.add(id));

    getPreviousPerformance(missing, workoutId)
      .then((result) => {
        setPrevious((p) => ({ ...p, ...result }));
        setDraft((d) => ({
          ...d,
          entries: d.entries.map((e) => {
            const prev = result[e.exerciseId];
            if (!e.autofill || !prev) return e;
            return {
              ...e,
              autofill: false,
              sets: prev.sets.map((s) => ({
                key: newKey(),
                reps: String(s.reps),
                weight: String(s.weight),
              })),
            };
          }),
        }));
      })
      .catch(() => {
        // Hints are optional; allow a retry next time the list changes.
        missing.forEach((id) => requested.current.delete(id));
      });
  }, [exerciseIds, workoutId]);

  // ---- updates ----
  const update = (patch: Partial<WorkoutDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const updateEntry = (key: string, fn: (e: Entry) => Entry) =>
    setDraft((d) => ({ ...d, entries: d.entries.map((e) => (e.key === key ? fn(e) : e)) }));

  const addExercise = (exerciseId: string) => {
    if (!exerciseId) return;
    setDraft((d) => ({
      ...d,
      entries: [...d.entries, { key: newKey(), exerciseId, sets: [emptySet()], autofill: true }],
    }));
  };

  const setField = (entryKey: string, setKey: string, field: "reps" | "weight", value: string) =>
    updateEntry(entryKey, (e) => ({
      ...e,
      autofill: false,
      sets: e.sets.map((s) => (s.key === setKey ? { ...s, [field]: value } : s)),
    }));

  // A new set copies the previous one: most sets repeat the same weight/reps.
  const addSet = (entryKey: string) =>
    updateEntry(entryKey, (e) => {
      const last = e.sets.at(-1);
      const next: SetRow = last ? { ...last, key: newKey() } : emptySet();
      return { ...e, autofill: false, sets: [...e.sets, next] };
    });

  const removeSet = (entryKey: string, setKey: string) =>
    updateEntry(entryKey, (e) => ({
      ...e,
      autofill: false,
      sets: e.sets.filter((s) => s.key !== setKey),
    }));

  const removeEntry = (key: string) =>
    setDraft((d) => ({ ...d, entries: d.entries.filter((e) => e.key !== key) }));

  const discardDraft = () => {
    setDraft(emptyDraft(localToday()));
    setRestored(false);
    setError(undefined);
  };

  // ---- save ----
  /** The routine's exercises differ from this workout's (added or removed, not just reordered). */
  const routineChanged = (payload: WorkoutPayload) =>
    !isEdit &&
    payload.routine !== null &&
    draft.routine?.exerciseIds !== undefined &&
    !sameExercises(draft.routine.exerciseIds, payload.exercises.map((e) => e.exercise));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = buildPayload(draft, nameOf);
    if ("error" in result) return setError(result.error);
    setError(undefined);
    if (routineChanged(result.payload)) return setPendingSave(result.payload);
    save(result.payload, false);
  };

  const save = (payload: WorkoutPayload, updateRoutine: boolean) => {
    setPendingSave(null);
    startSaving(async () => {
      const res = await saveWorkout(payload, workoutId);
      if (res.error || !res.id) return setError(res.error ?? "Couldn't save the workout");
      if (updateRoutine && payload.routine) {
        // The workout is saved either way; a failed routine update isn't worth blocking on.
        await setRoutineExercises(payload.routine, payload.exercises.map((e) => e.exercise));
      }
      if (!isEdit) {
        // Start fresh next time: Next keeps this page mounted after navigating
        // away, so without this the saved workout would still be in the form.
        setDraft(emptyDraft(localToday()));
        setRestored(false);
        setEditDetails(false);
        // This save changes "last time" for its exercises.
        requested.current.clear();
        setPrevious({});
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
      }
      router.push(`/workouts/${res.id}`);
    });
  };

  const inWorkout = new Set(draft.entries.map((e) => e.exerciseId));
  const volume = draftVolume(draft);
  const doneCount = draft.entries.filter((e) => e.done).length;
  const trackDone = !isEdit && draft.entries.length > 0;
  // A routine workout already has its name: show name + date as one line until "Edit".
  const compactDetails = Boolean(draft.routine && draft.name.trim() && draft.date && !editDetails);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {restored && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm">
          <span>Restored your unsaved workout.</span>
          <Button type="button" variant="ghost" size="sm" onClick={discardDraft}>
            Discard
          </Button>
        </div>
      )}

      {draft.routine && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListChecks className="size-4 shrink-0" />
          <span className="min-w-0 truncate">
            {compactDetails ? (
              <>
                <span className="font-medium text-foreground">{draft.name}</span> ·{" "}
                {formatWorkoutDate(`${draft.date}T00:00:00Z`, "short")}
              </>
            ) : (
              <>
                From routine <span className="font-medium text-foreground">{draft.routine.name}</span>
              </>
            )}
          </span>
          {compactDetails && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditDetails(true)}
              aria-label="Edit name and date"
              title="Edit name and date"
            >
              <Pencil />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              update({ routine: null });
              setEditDetails(true);
            }}
            aria-label="Don't link this workout to the routine"
            title="Unlink from routine"
          >
            <X />
          </Button>
        </div>
      )}

      <div className={cn("grid gap-4 sm:grid-cols-[1fr_12rem]", compactDetails && "hidden")}>
        <div className="space-y-1.5">
          <Label htmlFor="workout-name">Workout name</Label>
          <Input
            id="workout-name"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Push Day"
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="workout-date">Date</Label>
          <Input
            id="workout-date"
            type="date"
            value={draft.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </div>
      </div>

      {draft.entries.map((entry) => {
        const exercise = byId.get(entry.exerciseId);
        const prev = previous[entry.exerciseId];
        return (
          <section
            key={entry.key}
            aria-label={exercise?.name}
            className={cn("rounded-lg border border-border", entry.done && "bg-muted/30")}
          >
            <header
              className={cn("flex items-start gap-3 px-4 py-3", !entry.done && "border-b border-border")}
            >
              {trackDone && (
                <Button
                  type="button"
                  variant={entry.done ? "default" : "outline"}
                  size="icon-sm"
                  className="mt-0.5 rounded-full"
                  onClick={() => updateEntry(entry.key, (e) => ({ ...e, done: !e.done }))}
                  aria-pressed={Boolean(entry.done)}
                  aria-label={`${exercise?.name ?? "Exercise"} done`}
                  title={entry.done ? "Mark as not done" : "Mark as done"}
                >
                  <Check />
                </Button>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium">{exercise?.name ?? "Exercise"}</h3>
                {entry.done ? (
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    {entry.sets.map((r) => `${r.weight || 0}×${r.reps || 0}`).join(", ")}
                  </p>
                ) : prev ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <History className="size-3" />
                    Last time ({formatWorkoutDate(prev.date, "short")}): {formatSets(prev.sets)}
                  </p>
                ) : (
                  exercise && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {humanize(exercise.muscleGroup)} · {humanize(exercise.equipment)}
                    </p>
                  )
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeEntry(entry.key)}
                aria-label={`Remove ${exercise?.name ?? "exercise"}`}
              >
                <X />
              </Button>
            </header>

            <div className={cn("space-y-2 p-4", entry.done && "hidden")}>
              <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 text-xs text-muted-foreground">
                <span>Set</span>
                <span>kg</span>
                <span>Reps</span>
              </div>
              {entry.sets.map((set, i) => (
                <div key={set.key} className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2">
                  <span className="text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={set.weight}
                    placeholder={prev?.sets[i] ? String(prev.sets[i].weight) : "0"}
                    onChange={(e) => setField(entry.key, set.key, "weight", e.target.value)}
                    aria-label={`${exercise?.name} set ${i + 1} weight (kg)`}
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={set.reps}
                    placeholder={prev?.sets[i] ? String(prev.sets[i].reps) : "0"}
                    onChange={(e) => setField(entry.key, set.key, "reps", e.target.value)}
                    aria-label={`${exercise?.name} set ${i + 1} reps`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={entry.sets.length === 1}
                    onClick={() => removeSet(entry.key, set.key)}
                    aria-label={`Remove set ${i + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => addSet(entry.key)}>
                <Plus /> Add set
              </Button>
            </div>
          </section>
        );
      })}

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
            onChange={(e) => addExercise(e.target.value)}
            className="h-10"
          >
            <option value="">
              {draft.entries.length ? "Add another exercise…" : "Choose an exercise…"}
            </option>
            {shownGroups.map(([group, items]) => (
              <optgroup key={group} label={humanize(group)}>
                {items.map((ex) => (
                  <option key={ex.id} value={ex.id} disabled={inWorkout.has(ex.id)}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="workout-notes">Notes</Label>
        <Textarea
          id="workout-notes"
          value={draft.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="How did it feel?"
          maxLength={2000}
          rows={3}
        />
      </div>

      {/* Sticky save bar; sits above the mobile bottom nav. */}
      <div className="sticky bottom-16 z-10 -mx-4 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:px-0">
        <div className="min-w-0 flex-1 text-sm">
          {error ? (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          ) : (
            <p className="text-muted-foreground tabular-nums">
              {trackDone
                ? `${doneCount}/${draft.entries.length} done`
                : `${draft.entries.length} exercise${draft.entries.length === 1 ? "" : "s"}`}{" "}
              · {formatKg(volume)}
            </p>
          )}
        </div>
        <Button type="submit" disabled={saving || !loaded}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save workout"}
        </Button>
      </div>

      <AlertDialog open={pendingSave !== null} onOpenChange={(open) => !open && setPendingSave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Also update &ldquo;{draft.routine?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              You added or removed exercises. Update the routine so next time starts with this
              workout&apos;s exercises?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => pendingSave && save(pendingSave, false)}>
              Just save workout
            </Button>
            <Button onClick={() => pendingSave && save(pendingSave, true)}>Update routine</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
