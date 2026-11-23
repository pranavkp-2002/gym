import { Types } from "mongoose";
import { WorkoutModel } from "../models/Workout.js";

type Set = { reps: number; weight: number };

/**
 * Estimated one-rep max (Epley): weight × (1 + reps / 30).
 * A single rep is the weight itself; weightless or zero-rep sets have none.
 */
export function estimate1RM({ reps, weight }: Set) {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export type Session = {
  workoutId: string;
  workoutName: string;
  date: Date;
  sets: Set[];
  topWeight: number; // heaviest set
  topWeightReps: number; // reps done at that weight (best if repeated)
  best1RM: number;
  volume: number;
  totalReps: number;
};

type Record = { value: number; date: Date; workoutId: string };

/** Every session containing the exercise, oldest first, with per-session metrics. */
export async function exerciseSessions(
  userId: Types.ObjectId,
  exerciseId: string
): Promise<Session[]> {
  const id = new Types.ObjectId(exerciseId);
  const rows = await WorkoutModel.aggregate<{
    _id: Types.ObjectId;
    name: string;
    date: Date;
    sets: Set[];
  }>([
    { $match: { user: userId, "exercises.exercise": id } },
    { $sort: { date: 1, createdAt: 1 } },
    {
      $project: {
        name: 1,
        date: 1,
        // All sets of this exercise in the workout (normally one entry).
        sets: {
          $reduce: {
            input: { $filter: { input: "$exercises", cond: { $eq: ["$$this.exercise", id] } } },
            initialValue: [],
            in: { $concatArrays: ["$$value", "$$this.sets"] },
          },
        },
      },
    },
  ]);

  return rows.map((r) => {
    const top = r.sets.reduce(
      (best, s) =>
        s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best,
      { weight: 0, reps: 0 }
    );
    return {
      workoutId: String(r._id),
      workoutName: r.name,
      date: r.date,
      sets: r.sets,
      topWeight: top.weight,
      topWeightReps: top.reps,
      best1RM: Math.max(0, ...r.sets.map(estimate1RM)),
      volume: r.sets.reduce((v, s) => v + s.reps * s.weight, 0),
      totalReps: r.sets.reduce((n, s) => n + s.reps, 0),
    };
  });
}

/** All-time personal records from a list of sessions (first to reach a value wins). */
export function personalRecords(sessions: Session[]) {
  const best = (pick: (s: Session) => number): Record | null => {
    let rec: Record | null = null;
    for (const s of sessions) {
      const value = pick(s);
      if (value > 0 && (!rec || value > rec.value)) {
        rec = { value, date: s.date, workoutId: s.workoutId };
      }
    }
    return rec;
  };

  const heaviest = best((s) => s.topWeight);
  const heaviestSession = heaviest && sessions.find((s) => s.workoutId === heaviest.workoutId);

  return {
    heaviestWeight: heaviest && { ...heaviest, reps: heaviestSession!.topWeightReps },
    best1RM: best((s) => s.best1RM),
    bestVolume: best((s) => s.volume),
    // Most reps in one set: useful for bodyweight exercises with no weight.
    mostReps: best((s) => Math.max(0, ...s.sets.map((set) => set.reps))),
  };
}
