import type { Types } from "mongoose";
import { ExerciseModel } from "../models/Exercise.js";
import { HttpError } from "../utils/http-error.js";

/** Exercises a user can see and use: every predefined one plus their own custom ones. */
export const visibleExercisesFilter = (userId: Types.ObjectId) => ({
  $or: [{ isCustom: false }, { createdBy: userId }],
});

/** Reject references to exercises the user can't see (or that don't exist). */
export async function assertExercisesVisible(userId: Types.ObjectId, ids: string[]) {
  const unique = [...new Set(ids)];
  const found = await ExerciseModel.countDocuments({
    _id: { $in: unique },
    ...visibleExercisesFilter(userId),
  });
  if (found !== unique.length) throw new HttpError(400, "One or more exercises don't exist");
}
