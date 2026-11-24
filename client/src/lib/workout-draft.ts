// Pure helpers for the workout logger's in-progress state. No React here, so
// Server Components (edit page) and the Client Component can both use them.

import { toDateInput } from "./format";
import type { Routine, RoutineRef, WorkoutDetail, WorkoutPayload } from "./types";

/** localStorage key for the unsaved workout. Cleared on logout. */
export const DRAFT_STORAGE_KEY = "gym:workout-draft";

/** Inputs are strings while typing; they're parsed only on save. */
export type SetRow = { key: string; reps: string; weight: string };
export type Entry = {
  key: string;
  exerciseId: string;
  sets: SetRow[];
  /** True until the user edits the sets: allows pre-filling from last time. */
  autofill?: boolean;
  /** Ticked off in the logger. Progress only; not saved with the workout. */
  done?: boolean;
};
export type WorkoutDraft = {
  name: string;
  date: string;
  notes: string;
  entries: Entry[];
  /** Set when the workout was started from a routine. */
  routine?: RoutineRef | null;
};

/** Today in the browser's timezone, as YYYY-MM-DD. Client-only. */
export function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// React keys only; never rendered, so server/client differences don't matter.
let counter = 0;
export const newKey = () => `k${++counter}`;

export const emptySet = (): SetRow => ({ key: newKey(), reps: "", weight: "" });

export const emptyDraft = (date: string): WorkoutDraft => ({
  name: "",
  date,
  notes: "",
  entries: [],
});

export function draftFromWorkout(w: WorkoutDetail): WorkoutDraft {
  return {
    name: w.name,
    date: toDateInput(w.date),
    notes: w.notes,
    routine: w.routine,
    entries: w.exercises
      .filter((e) => e.exercise) // skip exercises that were deleted
      .map((e) => ({
        key: newKey(),
        exerciseId: e.exercise!.id,
        sets: e.sets.map((s) => ({ key: newKey(), reps: String(s.reps), weight: String(s.weight) })),
      })),
  };
}

/**
 * A fresh workout from a routine: its name and exercises, each with one empty
 * set marked `autofill`, so the logger fills in that exercise's last sets.
 */
export function draftFromRoutine(r: Routine, date: string): WorkoutDraft {
  return {
    name: r.name,
    date,
    notes: "",
    routine: {
      id: r.id,
      name: r.name,
      exerciseIds: r.exercises.flatMap((e) => (e.exercise ? [e.exercise.id] : [])),
    },
    entries: r.exercises
      .filter((e) => e.exercise) // skip exercises that were deleted
      .map((e) => ({ key: newKey(), exerciseId: e.exercise!.id, sets: [emptySet()], autofill: true })),
  };
}

export function isDraftEmpty(d: WorkoutDraft) {
  return !d.name.trim() && !d.notes.trim() && d.entries.length === 0;
}

/** Validate a draft and convert it to the API payload. */
export function buildPayload(
  draft: WorkoutDraft,
  exerciseName: (id: string) => string
): { payload: WorkoutPayload } | { error: string } {
  if (!draft.name.trim()) return { error: "Give the workout a name" };
  if (!draft.date) return { error: "Pick a date" };
  if (draft.entries.length === 0) return { error: "Add at least one exercise" };

  const exercises: WorkoutPayload["exercises"] = [];
  for (const entry of draft.entries) {
    const name = exerciseName(entry.exerciseId);
    const sets = [];
    for (const [i, row] of entry.sets.entries()) {
      const reps = Number(row.reps);
      const weight = Number(row.weight);
      if (row.reps === "" || !Number.isInteger(reps) || reps < 0)
        return { error: `${name}, set ${i + 1}: enter whole-number reps` };
      if (row.weight === "" || !Number.isFinite(weight) || weight < 0)
        return { error: `${name}, set ${i + 1}: enter a weight (0 for bodyweight)` };
      sets.push({ reps, weight });
    }
    if (sets.length === 0) return { error: `${name}: add at least one set` };
    exercises.push({ exercise: entry.exerciseId, sets });
  }

  return {
    payload: {
      name: draft.name.trim(),
      date: draft.date,
      notes: draft.notes.trim(),
      routine: draft.routine?.id ?? null,
      exercises,
    },
  };
}

/** Live volume while logging; ignores incomplete rows. */
export function draftVolume(draft: WorkoutDraft) {
  return draft.entries.reduce(
    (sum, e) =>
      sum + e.sets.reduce((s, r) => s + (Number(r.reps) || 0) * (Number(r.weight) || 0), 0),
    0
  );
}

/** Parse a draft saved in localStorage; null if missing or malformed. */
export function parseStoredDraft(raw: string | null): WorkoutDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (typeof d?.name !== "string" || !Array.isArray(d?.entries)) return null;
    const draft = d as WorkoutDraft;
    // Re-key: the key counter restarts on reload, so stored keys could collide.
    return {
      ...draft,
      entries: draft.entries.map((e) => ({
        ...e,
        key: newKey(),
        sets: e.sets.map((s) => ({ ...s, key: newKey() })),
      })),
    };
  } catch {
    return null;
  }
}
