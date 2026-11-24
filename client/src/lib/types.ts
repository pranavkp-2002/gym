// Shapes returned by the Express API.

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  category: string;
  isCustom: boolean;
  /** The signed-in user has hidden this exercise (or, if custom, marked it inactive): left out of the library and pickers. */
  hidden: boolean;
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
  routine: RoutineRef | null;
};

/** The routine a workout was started from. */
export type RoutineRef = {
  id: string;
  name: string;
  /** The routine's exercises when the workout was started (only in a fresh draft). */
  exerciseIds?: string[];
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
  routine: RoutineRef | null;
  /** The previous workout from the same routine, for comparison. */
  previousInRoutine: {
    id: string;
    date: string;
    volume: number;
    /** Keyed by exercise id. */
    sets: Record<string, WorkoutSet[]>;
  } | null;
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
  routine: string | null;
  exercises: { exercise: string; sets: WorkoutSet[] }[];
};

export type Routine = {
  id: string;
  name: string;
  notes: string;
  /** In order. `exercise` is null if it was deleted. */
  exercises: {
    exercise: Pick<Exercise, "id" | "name" | "muscleGroup" | "equipment" | "category"> | null;
  }[];
  /** Workouts logged from this routine. */
  sessions: number;
  lastWorkout: {
    id: string;
    date: string;
    volume: number;
    setCount: number;
    /** That workout's sets, keyed by exercise id. */
    sets: Record<string, WorkoutSet[]>;
  } | null;
};

/** Body for POST/PUT /api/routines. */
export type RoutinePayload = {
  name: string;
  notes: string;
  exercises: { exercise: string }[];
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

export type ProgressSession = {
  workoutId: string;
  workoutName: string;
  date: string;
  sets: WorkoutSet[];
  topWeight: number;
  topWeightReps: number;
  best1RM: number;
  volume: number;
  totalReps: number;
  isWeightPR: boolean;
};

export type PersonalRecord = { value: number; date: string; workoutId: string };

export type ExerciseProgress = {
  exercise: Exercise;
  records: {
    heaviestWeight: (PersonalRecord & { reps: number }) | null;
    best1RM: PersonalRecord | null;
    bestVolume: PersonalRecord | null;
    mostReps: PersonalRecord | null;
  };
  totalSessions: number;
  sessions: ProgressSession[]; // oldest first
  /** The session just before `sessions` (outside the range), if any. */
  before: ProgressSession | null;
};

export type RecordRow = {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  heaviest: { weight: number; reps: number; date: string };
  best1RM: number;
  sessions: number;
  lastDate: string;
};
