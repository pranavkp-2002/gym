import { Router } from "express";
import { Types } from "mongoose";
import { userIdOf } from "../middleware/auth.js";
import { CATEGORIES, EQUIPMENT, MUSCLE_GROUPS } from "../models/constants.js";
import { ExerciseModel } from "../models/Exercise.js";
import { UserModel } from "../models/User.js";
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

/** The ids of exercises the user has hidden. */
async function hiddenIdsOf(userId: Types.ObjectId): Promise<Types.ObjectId[]> {
  const user = await UserModel.findById(userId).select("hiddenExercises").lean();
  return user?.hiddenExercises ?? [];
}

/** GET /api/exercises?q=&muscleGroup=&equipment=&category=&hidden=exclude|include|only */
exercisesRouter.get("/", async (req, res) => {
  const { q, hidden, ...filters } = listExercisesQuery.parse(req.query);
  const userId = userIdOf(req);
  const hiddenIds = await hiddenIdsOf(userId);

  const query: Record<string, unknown> = { ...filters, ...visibleExercisesFilter(userId) };
  if (q) query.name = { $regex: escapeRegex(q), $options: "i" };
  if (hidden === "exclude") query._id = { $nin: hiddenIds };
  if (hidden === "only") query._id = { $in: hiddenIds };

  const exercises = await ExerciseModel.find(query).collation(caseInsensitive).sort({ name: 1 });
  const hiddenSet = new Set(hiddenIds.map(String));
  res.json(exercises.map((e) => ({ ...e.toJSON(), hidden: hiddenSet.has(String(e._id)) })));
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

/** PUT /api/exercises/:id/hidden — hide an exercise from the user's library and pickers. */
exercisesRouter.put("/:id/hidden", async (req, res) => {
  const userId = userIdOf(req);
  const exercise = await ExerciseModel.exists({
    _id: req.params.id,
    ...visibleExercisesFilter(userId),
  });
  if (!exercise) throw new HttpError(404, "Exercise not found");

  await UserModel.updateOne({ _id: userId }, { $addToSet: { hiddenExercises: exercise._id } });
  res.status(204).end();
});

/** DELETE /api/exercises/:id/hidden — show a hidden exercise again. */
exercisesRouter.delete("/:id/hidden", async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) throw new HttpError(404, "Exercise not found");
  await UserModel.updateOne(
    { _id: userIdOf(req) },
    { $pull: { hiddenExercises: new Types.ObjectId(req.params.id) } }
  );
  res.status(204).end();
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
