"use server";

import { redirect } from "next/navigation";
import { ApiError, routinesApi } from "@/lib/api";
import type { RoutinePayload } from "@/lib/types";

/** Create (no id) or update (id) a routine. The Express API validates the payload. */
export async function saveRoutine(
  payload: RoutinePayload,
  id?: string
): Promise<{ id?: string; error?: string }> {
  try {
    const saved = id ? await routinesApi.update(id, payload) : await routinesApi.create(payload);
    return { id: saved.id };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }
}

export async function deleteRoutine(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const id = String(formData.get("id") ?? "");
  try {
    await routinesApi.remove(id);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }
  redirect("/routines"); // outside try/catch: redirect() works by throwing
}

/** "Save as routine" on a workout's page. Reads the workout `id` from the form. */
export async function routineFromWorkout(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const id = String(formData.get("id") ?? "");
  try {
    await routinesApi.fromWorkout(id);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }
  redirect("/routines");
}

/** Make a routine's exercises match a workout's (the "Update routine?" prompt). */
export async function setRoutineExercises(
  id: string,
  exerciseIds: string[]
): Promise<{ error?: string }> {
  try {
    await routinesApi.setExercises(id, exerciseIds);
    return {};
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }
}
