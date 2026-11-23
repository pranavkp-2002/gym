// Express API client (server-only). Import everything from "@/lib/api".
export { ApiError, request, SESSION_EXPIRED_PATH } from "./client";
export {
  authApi,
  exercisesApi,
  statsApi,
  workoutsApi,
  type ExerciseInput,
  type User,
} from "./endpoints";
