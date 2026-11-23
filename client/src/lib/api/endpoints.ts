import "server-only";
import { request, seg } from "./client";
import type {
  DashboardStats,
  Exercise,
  ExerciseFilters,
  ExerciseOptions,
  PreviousPerformance,
  WorkoutDetail,
  WorkoutList,
  WorkoutPayload,
} from "../types";

// Every Express endpoint the app uses, defined once. Pages and Server Actions
// call these instead of building URLs themselves.

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
};
