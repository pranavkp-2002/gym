import { Router } from "express";
import { CATEGORIES, EQUIPMENT, MUSCLE_GROUPS } from "../models/constants.js";
import { ExerciseModel } from "../models/Exercise.js";
import { WorkoutModel } from "../models/Workout.js";
import { HttpError } from "../utils/http-error.js";
import { createExerciseSchema, listExercisesQuery } from "../validation/exercise.js";

export const exercisesRouter = Router();

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** GET /api/exercises/options — allowed values for the classification fields. */
exercisesRouter.get("/options", (_req, res) => {
  res.json({ muscleGroups: MUSCLE_GROUPS, equipment: EQUIPMENT, categories: CATEGORIES });
});

/** GET /api/exercises?q=&muscleGroup=&equipment=&category= */
exercisesRouter.get("/", async (req, res) => {
  const { q, ...filters } = listExercisesQuery.parse(req.query);

  const query: Record<string, unknown> = { ...filters };
  if (q) query.name = { $regex: escapeRegex(q), $options: "i" };

  const exercises = await ExerciseModel.find(query)
    .collation({ locale: "en", strength: 2 })
    .sort({ name: 1 });
  res.json(exercises);
});

/** GET /api/exercises/:id */
exercisesRouter.get("/:id", async (req, res) => {
  const exercise = await ExerciseModel.findById(req.params.id);
  if (!exercise) throw new HttpError(404, "Exercise not found");
  res.json(exercise);
});

/** POST /api/exercises — add a custom exercise. */
exercisesRouter.post("/", async (req, res) => {
  const data = createExerciseSchema.parse(req.body);
  try {
    const exercise = await ExerciseModel.create({ ...data, isCustom: true });
    res.status(201).json(exercise);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new HttpError(409, `An exercise named "${data.name}" already exists`);
    }
    throw err;
  }
});

/** DELETE /api/exercises/:id — custom exercises only, and only if unused. */
exercisesRouter.delete("/:id", async (req, res) => {
  const exercise = await ExerciseModel.findById(req.params.id);
  if (!exercise) throw new HttpError(404, "Exercise not found");
  if (!exercise.isCustom) throw new HttpError(403, "Predefined exercises can't be deleted");

  const inUse = await WorkoutModel.exists({ "exercises.exercise": exercise._id });
  if (inUse) throw new HttpError(409, "This exercise is used in a workout and can't be deleted");

  await exercise.deleteOne();
  res.status(204).end();
});
