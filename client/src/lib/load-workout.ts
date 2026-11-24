import "server-only";
import { notFound } from "next/navigation";
import { ApiError, routinesApi, workoutsApi } from "./api";

/** Run a fetch, rendering the 404 page for unknown or malformed ids. */
async function or404<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
}

/** Fetch a workout or render the 404 page (unknown or malformed id). */
export const loadWorkoutOr404 = (id: string) => or404(() => workoutsApi.get(id));

/** Fetch a routine or render the 404 page (unknown or malformed id). */
export const loadRoutineOr404 = (id: string) => or404(() => routinesApi.get(id));
