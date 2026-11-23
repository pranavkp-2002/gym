/**
 * Seeds the predefined exercise library. Safe to run repeatedly:
 * existing predefined exercises are updated, never duplicated.
 *   npm run seed
 */
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import type { Category, Equipment, MuscleGroup } from "../models/constants.js";
import { ExerciseModel } from "../models/Exercise.js";

type Seed = [name: string, muscleGroup: MuscleGroup, equipment: Equipment, category: Category];

const EXERCISES: Seed[] = [
  // Chest
  ["Barbell Bench Press", "chest", "barbell", "compound"],
  ["Incline Barbell Bench Press", "chest", "barbell", "compound"],
  ["Dumbbell Bench Press", "chest", "dumbbell", "compound"],
  ["Incline Dumbbell Press", "chest", "dumbbell", "compound"],
  ["Dumbbell Fly", "chest", "dumbbell", "isolation"],
  ["Cable Crossover", "chest", "cable", "isolation"],
  ["Push-Up", "chest", "bodyweight", "compound"],
  ["Dip", "chest", "bodyweight", "compound"],
  // Back
  ["Deadlift", "back", "barbell", "compound"],
  ["Barbell Row", "back", "barbell", "compound"],
  ["Dumbbell Row", "back", "dumbbell", "compound"],
  ["Pull-Up", "back", "bodyweight", "compound"],
  ["Chin-Up", "back", "bodyweight", "compound"],
  ["Lat Pulldown", "back", "cable", "compound"],
  ["Seated Cable Row", "back", "cable", "compound"],
  // Shoulders
  ["Overhead Press", "shoulders", "barbell", "compound"],
  ["Dumbbell Shoulder Press", "shoulders", "dumbbell", "compound"],
  ["Lateral Raise", "shoulders", "dumbbell", "isolation"],
  ["Face Pull", "shoulders", "cable", "isolation"],
  ["Rear Delt Fly", "shoulders", "dumbbell", "isolation"],
  // Arms
  ["Barbell Curl", "biceps", "barbell", "isolation"],
  ["Dumbbell Curl", "biceps", "dumbbell", "isolation"],
  ["Hammer Curl", "biceps", "dumbbell", "isolation"],
  ["Triceps Pushdown", "triceps", "cable", "isolation"],
  ["Skull Crusher", "triceps", "barbell", "isolation"],
  ["Overhead Triceps Extension", "triceps", "dumbbell", "isolation"],
  // Legs
  ["Back Squat", "quads", "barbell", "compound"],
  ["Front Squat", "quads", "barbell", "compound"],
  ["Leg Press", "quads", "machine", "compound"],
  ["Leg Extension", "quads", "machine", "isolation"],
  ["Bulgarian Split Squat", "quads", "dumbbell", "compound"],
  ["Romanian Deadlift", "hamstrings", "barbell", "compound"],
  ["Lying Leg Curl", "hamstrings", "machine", "isolation"],
  ["Hip Thrust", "glutes", "barbell", "compound"],
  ["Standing Calf Raise", "calves", "machine", "isolation"],
  // Core & full body
  ["Plank", "core", "bodyweight", "isolation"],
  ["Hanging Leg Raise", "core", "bodyweight", "isolation"],
  ["Cable Crunch", "core", "cable", "isolation"],
  ["Kettlebell Swing", "full_body", "kettlebell", "compound"],
  ["Rowing Machine", "full_body", "machine", "cardio"],
];

await connectDB();

const result = await ExerciseModel.bulkWrite(
  EXERCISES.map(([name, muscleGroup, equipment, category]) => ({
    updateOne: {
      filter: { name, createdBy: null, isCustom: false },
      update: { $set: { muscleGroup, equipment, category } },
      upsert: true,
    },
  }))
);

console.log(
  `Seeded ${EXERCISES.length} exercises (${result.upsertedCount} new, ${result.matchedCount} already existed)`
);
await mongoose.disconnect();
