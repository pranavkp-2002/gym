"use server";

import { refresh } from "next/cache";
import { ApiError, exercisesApi } from "@/lib/api";

// TODO(Step 6 – auth): verify the session in every action. Server Actions are
// reachable by direct POST, not just through the UI.

export type CreateExerciseState = {
  error?: string;
  success?: string;
  /** Echoed back on error so the form keeps what the user typed. */
  values?: Record<string, string>;
  /** Changes on every failed submit; used as a React key to re-apply `values`. */
  attempt?: number;
};

export async function createExercise(
  _prev: CreateExerciseState,
  formData: FormData
): Promise<CreateExerciseState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    muscleGroup: String(formData.get("muscleGroup") ?? ""),
    equipment: String(formData.get("equipment") ?? ""),
    category: String(formData.get("category") ?? ""),
  };

  try {
    // The API is the single place that validates input.
    await exercisesApi.create(values);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message, values, attempt: Date.now() };
    throw err;
  }

  refresh();
  return { success: `Added "${values.name.trim()}"` };
}

export type DeleteExerciseState = { error?: string };

export async function deleteExercise(
  _prev: DeleteExerciseState,
  formData: FormData
): Promise<DeleteExerciseState> {
  const id = String(formData.get("id") ?? "");

  try {
    await exercisesApi.remove(id);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }

  refresh();
  return {};
}
