// Express API client (server-only). Import everything from "@/lib/api".
export { ApiError, request } from "./client";
export { exercisesApi, statsApi, workoutsApi, type ExerciseInput } from "./endpoints";
