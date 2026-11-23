import "server-only";
import { request, seg } from "./client";
import type {
  DashboardStats,
  Exercise,
  ExerciseFilters,
  ExerciseOptions,
  ExerciseProgress,
  PreviousPerformance,
  RecordRow,
  WorkoutDetail,
  WorkoutList,
  WorkoutPayload,
} from "../types";

// Every Express endpoint the app uses, defined once. Pages and Server Actions
// call these instead of building URLs themselves.

export type User = { id: string; name: string; email: string; createdAt: string };
type AuthResult = { user: User; token: string };

export const authApi = {
  // auth: false: no token sent, and a 401 here means "wrong password", not "session expired".
  register: (input: { name: string; email: string; password: string }) =>
    request<AuthResult>("POST", "/api/auth/register", { body: input, auth: false }),

  login: (input: { email: string; password: string }) =>
    request<AuthResult>("POST", "/api/auth/login", { body: input, auth: false }),

  me: () => request<User>("GET", "/api/auth/me"),

  updateMe: (input: { name?: string; email?: string }) =>
    request<User>("PATCH", "/api/auth/me", { body: input }),

  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    request("POST", "/api/auth/password", { body: input }),
};

export type ExerciseInput = {
  name: string;
  muscleGroup: string;
  equipment: string;
  category: string;
};

export const exercisesApi = {
  list: (filters: ExerciseFilters = {}) =>
    request<Exercise[]>("GET", "/api/exercises", { query: filters }),

  options: () => request<ExerciseOptions>("GET", "/api/exercises/options"),

  get: (id: string) => request<Exercise>("GET", `/api/exercises/${seg(id)}`),

  create: (input: ExerciseInput) => request<Exercise>("POST", "/api/exercises", { body: input }),

  remove: (id: string) => request("DELETE", `/api/exercises/${seg(id)}`),
};

export const workoutsApi = {
  list: (params: { from?: string; to?: string; page?: number; limit?: number } = {}) =>
    request<WorkoutList>("GET", "/api/workouts", { query: params }),

  get: (id: string) => request<WorkoutDetail>("GET", `/api/workouts/${seg(id)}`),

  create: (payload: WorkoutPayload) =>
    request<WorkoutDetail>("POST", "/api/workouts", { body: payload }),

  update: (id: string, payload: WorkoutPayload) =>
    request<WorkoutDetail>("PUT", `/api/workouts/${seg(id)}`, { body: payload }),

  remove: (id: string) => request("DELETE", `/api/workouts/${seg(id)}`),

  /** Last sets per exercise, optionally ignoring the workout being edited. */
  previous: (exerciseIds: string[], excludeWorkout?: string) =>
    request<PreviousPerformance>("GET", "/api/workouts/previous", {
      query: { exercises: exerciseIds.join(","), excludeWorkout },
    }),
};

export const statsApi = {
  dashboard: (today: string, weeks = 8) =>
    request<DashboardStats>("GET", "/api/stats/dashboard", { query: { today, weeks } }),

  /** One exercise's sessions (optionally from a date) + all-time records. */
  exercise: (id: string, from?: string) =>
    request<ExerciseProgress>("GET", `/api/stats/exercises/${seg(id)}`, { query: { from } }),

  /** Personal records for every logged exercise. */
  records: () => request<RecordRow[]>("GET", "/api/stats/records"),
};
