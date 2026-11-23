import { Router } from "express";
import { userIdOf } from "../middleware/auth.js";
import { CATEGORIES, EQUIPMENT, MUSCLE_GROUPS } from "../models/constants.js";
import { ExerciseModel } from "../models/Exercise.js";
import { WorkoutModel } from "../models/Workout.js";
import { visibleExercisesFilter } from "../services/visibility.js";
import { HttpError } from "../utils/http-error.js";
import { createExerciseSchema, listExercisesQuery } from "../validation/exercise.js";

// Mounted behind requireAuth. Users see predefined exercises + their own custom ones.

export const exercisesRouter = Router();

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const caseInsensitive = { locale: "en", strength: 2 } as const;

/** GET /api/exercises/options — allowed values for the classification fields. */
exercisesRouter.get("/options", (_req, res) => {
  res.json({ muscleGroups: MUSCLE_GROUPS, equipment: EQUIPMENT, categories: CATEGORIES });
});

/** GET /api/exercises?q=&muscleGroup=&equipment=&category= */
exercisesRouter.get("/", async (req, res) => {
  const { q, ...filters } = listExercisesQuery.parse(req.query);

  const query: Record<string, unknown> = { ...filters, ...visibleExercisesFilter(userIdOf(req)) };
  if (q) query.name = { $regex: escapeRegex(q), $options: "i" };

  const exercises = await ExerciseModel.find(query).collation(caseInsensitive).sort({ name: 1 });
  res.json(exercises);
});

/** GET /api/exercises/:id */
exercisesRouter.get("/:id", async (req, res) => {
  const exercise = await ExerciseModel.findOne({
    _id: req.params.id,
    ...visibleExercisesFilter(userIdOf(req)),
  });
  if (!exercise) throw new HttpError(404, "Exercise not found");
  res.json(exercise);
});

/** POST /api/exercises — add a custom exercise owned by the user. */
exercisesRouter.post("/", async (req, res) => {
  const data = createExerciseSchema.parse(req.body);
  const userId = userIdOf(req);
  const taken = () => new HttpError(409, `An exercise named "${data.name}" already exists`);

  // The unique index only covers one owner, so check predefined names explicitly.
  const predefined = await ExerciseModel.exists({ name: data.name, isCustom: false }).collation(
    caseInsensitive
  );
  if (predefined) throw taken();

  try {
    const exercise = await ExerciseModel.create({ ...data, isCustom: true, createdBy: userId });
    res.status(201).json(exercise);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) throw taken();
    throw err;
  }
});

/** DELETE /api/exercises/:id — the user's own custom exercises, and only if unused. */
exercisesRouter.delete("/:id", async (req, res) => {
  const userId = userIdOf(req);
  const exercise = await ExerciseModel.findOne({
    _id: req.params.id,
    ...visibleExercisesFilter(userId),
  });
  if (!exercise) throw new HttpError(404, "Exercise not found");
  if (!exercise.isCustom) throw new HttpError(403, "Predefined exercises can't be deleted");

  const inUse = await WorkoutModel.exists({ user: userId, "exercises.exercise": exercise._id });
  if (inUse) throw new HttpError(409, "This exercise is used in a workout and can't be deleted");

  await exercise.deleteOne();
  res.status(204).end();
});
