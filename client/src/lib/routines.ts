// Pure helpers for routines, shared by the Dashboard and Routines pages.

import type { Routine } from "./types";

/** A routine can be started if at least one of its exercises still exists. */
export const isStartable = (r: Routine) => r.exercises.some((e) => e.exercise);

/**
 * "Up next" order: routines never done first, then the one done longest ago.
 * In a split done in rotation (day 1 → 2 → 3 → 4) that's the next day.
 * Ties keep the API's name order (the sort is stable).
 */
export function inUpNextOrder(routines: Routine[]) {
  return [...routines].sort((a, b) => {
    const da = a.lastWorkout?.date ?? "";
    const db = b.lastWorkout?.date ?? "";
    return da < db ? -1 : da > db ? 1 : 0;
  });
}

export const upNext = (routines: Routine[]) => inUpNextOrder(routines).find(isStartable) ?? null;

/** Same exercises, ignoring order. */
export function sameExercises(a: string[], b: string[]) {
  const set = new Set(a);
  return a.length === b.length && set.size === new Set(b).size && b.every((id) => set.has(id));
}
