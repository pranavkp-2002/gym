import type { Types } from "mongoose";

/** Exercises a user can see and use: every predefined one plus their own custom ones. */
export const visibleExercisesFilter = (userId: Types.ObjectId) => ({
  $or: [{ isCustom: false }, { createdBy: userId }],
});
