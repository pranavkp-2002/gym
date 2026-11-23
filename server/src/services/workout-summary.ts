import { WorkoutModel } from "../models/Workout.js";

type SetLike = { reps: number; weight: number };
type ExerciseEntryLike = { sets: SetLike[] };

/** Total volume = Σ reps × weight across every set. */
export function volumeOf(exercises: ExerciseEntryLike[]) {
  return exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + set.reps * set.weight, 0),
    0
  );
}

/** Same volume, as a MongoDB aggregation expression over a workout document. */
export const volumeExpr = {
  $sum: {
    $map: {
      input: "$exercises",
      as: "e",
      in: {
        $sum: {
          $map: {
            input: "$$e.sets",
            as: "s",
            in: { $multiply: ["$$s.reps", "$$s.weight"] },
          },
        },
      },
    },
  },
};

/**
 * Workouts as list rows (history page, dashboard "recent"), newest first.
 * The caller supplies filter + paging.
 */
export async function findWorkoutSummaries(
  filter: Record<string, unknown>,
  { skip = 0, limit }: { skip?: number; limit: number }
) {
  const docs = await WorkoutModel.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate<{ exercises: { exercise: { name: string } | null; sets: SetLike[] }[] }>(
      "exercises.exercise",
      "name"
    )
    .lean();

  return docs.map((w) => ({
    id: String(w._id),
    name: w.name,
    date: w.date,
    exerciseCount: w.exercises.length,
    setCount: w.exercises.reduce((n, e) => n + e.sets.length, 0),
    volume: volumeOf(w.exercises),
    exerciseNames: w.exercises.map((e) => e.exercise?.name ?? "Deleted exercise"),
  }));
}
