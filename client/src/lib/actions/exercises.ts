"use server";

import { refresh } from "next/cache";
import { ApiError, exercisesApi } from "@/lib/api";

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

export type ExerciseActionState = { error?: string };

/** Run an API call on the exercise whose id is in the form, then refresh the page. */
async function runOnExercise(formData: FormData, call: (id: string) => Promise<unknown>) {
  const id = String(formData.get("id") ?? "");
  try {
    await call(id);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }
  refresh();
  return {};
}

export async function deleteExercise(_prev: ExerciseActionState, formData: FormData) {
  return runOnExercise(formData, exercisesApi.remove);
}

export async function hideExercise(_prev: ExerciseActionState, formData: FormData) {
  return runOnExercise(formData, exercisesApi.hide);
}

export async function unhideExercise(_prev: ExerciseActionState, formData: FormData) {
  return runOnExercise(formData, exercisesApi.unhide);
}
