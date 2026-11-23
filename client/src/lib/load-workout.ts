import "server-only";
import { notFound } from "next/navigation";
import { ApiError, workoutsApi } from "./api";

/** Fetch a workout or render the 404 page (unknown or malformed id). */
export async function loadWorkoutOr404(id: string) {
  try {
    return await workoutsApi.get(id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
}
