import { Schema, model, type InferSchemaType } from "mongoose";
import { toJSONOptions } from "./json.js";

/**
 * A routine is a reusable workout template: a name and an ordered list of
 * exercises. Starting one pre-fills the logger; sets come from each
 * exercise's most recent session, so the routine itself stores no sets.
 * Workouts logged from a routine point back to it (Workout.routine).
 */
const routineSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    exercises: {
      type: [
        new Schema(
          { exercise: { type: Schema.Types.ObjectId, ref: "Exercise", required: true } },
          { _id: false }
        ),
      ],
      validate: [(v: unknown[]) => v.length > 0, "A routine needs at least one exercise"],
    },
  },
  { timestamps: true, toJSON: toJSONOptions }
);

// One name per user, ignoring case ("Day 1" and "day 1" clash).
routineSchema.index(
  { user: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export type Routine = InferSchemaType<typeof routineSchema>;
export const RoutineModel = model("Routine", routineSchema);
