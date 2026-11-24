import { z } from "zod";
import { objectId } from "./workout.js";

const exerciseList = z
    .array(z.object({ exercise: objectId }))
    .min(1, "Add at least one exercise")
    .max(30)
    .refine(
      (list) => new Set(list.map((e) => e.exercise)).size === list.length,
      "Each exercise can only be in a routine once"
    );

export const routineInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  notes: z.string().trim().max(2000).default(""),
  exercises: exerciseList,
});

/** PUT /api/routines/:id/exercises: replace only the exercise list. */
export const routineExercisesSchema = z.object({ exercises: exerciseList });
