import { z } from "zod";
import { CATEGORIES, EQUIPMENT, MUSCLE_GROUPS } from "../models/constants.js";

export const createExerciseSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  muscleGroup: z.enum(MUSCLE_GROUPS),
  equipment: z.enum(EQUIPMENT),
  category: z.enum(CATEGORIES),
});

export const listExercisesQuery = z.object({
  q: z.string().trim().max(80).optional(),
  muscleGroup: z.enum(MUSCLE_GROUPS).optional(),
  equipment: z.enum(EQUIPMENT).optional(),
  category: z.enum(CATEGORIES).optional(),
});
