"use server";

import { redirect } from "next/navigation";
import { ApiError, workoutsApi } from "@/lib/api";
import type { PreviousPerformance, WorkoutPayload } from "@/lib/types";

/**
 * Create (no id) or update (id) a workout. Returns the saved id instead of
 * redirecting, so the client can clear its local draft before navigating.
 * The Express API validates the payload.
 */
export async function saveWorkout(
  payload: WorkoutPayload,
  id?: string
): Promise<{ id?: string; error?: string }> {
  try {
    const saved = id ? await workoutsApi.update(id, payload) : await workoutsApi.create(payload);
    return { id: saved.id };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }
}

export async function deleteWorkout(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const id = String(formData.get("id") ?? "");
  try {
    await workoutsApi.remove(id);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }
  redirect("/workouts"); // must be outside try/catch: redirect() works by throwing
}

/** Last sets for each exercise, used for "last time" hints and pre-filling. */
export async function getPreviousPerformance(
  exerciseIds: string[],
  excludeWorkout?: string
): Promise<PreviousPerformance> {
  if (exerciseIds.length === 0) return {};
  return workoutsApi.previous(exerciseIds, excludeWorkout);
}
