// Shapes returned by the Express API.

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  category: string;
  isCustom: boolean;
  createdAt: string;
};

export type ExerciseOptions = {
  muscleGroups: string[];
  equipment: string[];
  categories: string[];
};

export type ExerciseFilters = {
  q?: string;
  muscleGroup?: string;
  equipment?: string;
  category?: string;
};

export type WorkoutSet = { reps: number; weight: number };

export type WorkoutSummary = {
  id: string;
  name: string;
  date: string; // ISO, midnight UTC of the workout's calendar day
  exerciseCount: number;
  setCount: number;
  volume: number;
  exerciseNames: string[];
};

export type WorkoutList = {
  items: WorkoutSummary[];
  total: number;
  page: number;
  pages: number;
};

export type WorkoutDetail = {
  id: string;
  name: string;
  date: string;
  notes: string;
  volume: number;
  exercises: {
    exercise: Pick<Exercise, "id" | "name" | "muscleGroup" | "equipment" | "category"> | null;
    sets: WorkoutSet[];
  }[];
};

/** Body for POST/PUT /api/workouts. */
export type WorkoutPayload = {
  name: string;
  date: string; // YYYY-MM-DD
  notes: string;
  exercises: { exercise: string; sets: WorkoutSet[] }[];
};

/** Sets from the most recent workout containing an exercise, keyed by exercise id. */
export type PreviousPerformance = Record<
  string,
  { workoutId: string; date: string; sets: WorkoutSet[] }
>;

export type WeekStat = { weekStart: string; workouts: number; volume: number };

export type DashboardStats = {
  today: string; // YYYY-MM-DD in the user's timezone
  totals: { workouts: number; volume: number };
  thisWeek: WeekStat & { trainedDays: string[] };
  lastWeek: WeekStat | null;
  weekly: WeekStat[]; // oldest -> newest, current week last
  recent: WorkoutSummary[];
};
