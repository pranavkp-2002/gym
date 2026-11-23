import { z } from "zod";
import { Types } from "mongoose";

export const objectId = z.string().refine((v) => Types.ObjectId.isValid(v), "Invalid id");

/**
 * Workout dates are calendar days ("2026-11-23"), stored as midnight UTC.
 * That keeps the day stable no matter which timezone renders it.
 */
export const calendarDate = z.iso.date().transform((d) => new Date(`${d}T00:00:00.000Z`));

const setSchema = z.object({
  reps: z.number().int("Reps must be a whole number").min(0).max(1000),
  weight: z.number().min(0, "Weight can't be negative").max(2000),
});

export const workoutInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  date: calendarDate,
  notes: z.string().trim().max(2000).default(""),
  exercises: z
    .array(
      z.object({
        exercise: objectId,
        sets: z.array(setSchema).min(1, "Each exercise needs at least one set").max(50),
      })
    )
    .min(1, "Add at least one exercise")
    .max(30),
});

export const listWorkoutsQuery = z.object({
  from: calendarDate.optional(),
  to: calendarDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const previousQuery = z.object({
  exercises: z
    .string()
    .transform((s) => s.split(",").filter(Boolean))
    .pipe(z.array(objectId).min(1).max(30)),
  excludeWorkout: objectId.optional(),
});
