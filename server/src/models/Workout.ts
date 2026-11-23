import { Schema, model, type InferSchemaType } from "mongoose";
import { toJSONOptions } from "./json.js";

/**
 * MongoDB design note:
 * The plan's SQL `workout_sets` table is embedded here instead of being a
 * separate collection. A workout is always read and written as a whole, so
 * embedding gives one-document reads/writes and atomic saves. Set number is
 * the array position, so it can't drift out of sync.
 *
 *   Workout
 *   └── exercises[]          (ordered, references Exercise)
 *       └── sets[]           (ordered: reps + weight)
 */

const setSchema = new Schema(
  {
    reps: { type: Number, required: true, min: 0, max: 1000 },
    weight: { type: Number, required: true, min: 0, max: 2000 }, // kg
  },
  { _id: false }
);

const workoutExerciseSchema = new Schema(
  {
    exercise: { type: Schema.Types.ObjectId, ref: "Exercise", required: true },
    sets: {
      type: [setSchema],
      validate: [(v: unknown[]) => v.length > 0, "An exercise needs at least one set"],
    },
  },
  { _id: false }
);

const workoutSchema = new Schema(
  {
    // Owner. Workouts saved before accounts existed are claimed by the first
    // account on registration (see routes/auth.ts).
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    exercises: {
      type: [workoutExerciseSchema],
      validate: [(v: unknown[]) => v.length > 0, "A workout needs at least one exercise"],
    },
  },
  { timestamps: true, toJSON: toJSONOptions }
);

// History list: a user's workouts, newest first.
workoutSchema.index({ user: 1, date: -1 });
// Progress / "previous performance": all workouts containing an exercise.
workoutSchema.index({ user: 1, "exercises.exercise": 1, date: -1 });

export type Workout = InferSchemaType<typeof workoutSchema>;
export const WorkoutModel = model("Workout", workoutSchema);
