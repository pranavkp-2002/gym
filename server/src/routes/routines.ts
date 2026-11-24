import { Router } from "express";
import { Types } from "mongoose";
import { userIdOf } from "../middleware/auth.js";
import { ExerciseModel } from "../models/Exercise.js";
import { RoutineModel } from "../models/Routine.js";
import { WorkoutModel } from "../models/Workout.js";
import { assertExercisesVisible, visibleExercisesFilter } from "../services/visibility.js";
import { volumeOf } from "../services/workout-summary.js";
import { HttpError } from "../utils/http-error.js";
import { routineExercisesSchema, routineInputSchema } from "../validation/routine.js";
import { objectId } from "../validation/workout.js";

// Mounted behind requireAuth. Every query is scoped to the signed-in user;
// another user's routine ids behave like ids that don't exist (404).

export const routinesRouter = Router();

type SetLike = { reps: number; weight: number };

const EXERCISE_FIELDS = "name muscleGroup equipment category";
/** "day 2" sorts before "day 10", and case is ignored. */
const nameOrder = { locale: "en", strength: 2, numericOrdering: true } as const;

/** Mongo duplicate-key error → a readable 409. */
async function uniqueName<T>(name: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if ((err as { code?: number })?.code === 11000)
      throw new HttpError(409, `You already have a routine called "${name}"`);
    throw err;
  }
}

/**
 * For each routine: how many workouts were logged from it, and the latest
 * one (with its sets per exercise, so the card can show "last time").
 */
async function lastWorkouts(userId: Types.ObjectId, routineIds: Types.ObjectId[]) {
  if (routineIds.length === 0) return new Map();
  const rows = await WorkoutModel.aggregate<{
    _id: Types.ObjectId;
    workoutId: Types.ObjectId;
    date: Date;
    sessions: number;
    exercises: { exercise: Types.ObjectId; sets: SetLike[] }[];
  }>([
    { $match: { user: userId, routine: { $in: routineIds } } },
    { $sort: { date: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$routine",
        workoutId: { $first: "$_id" },
        date: { $first: "$date" },
        exercises: { $first: "$exercises" },
        sessions: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    rows.map((r) => [
      String(r._id),
      {
        sessions: r.sessions,
        lastWorkout: {
          id: String(r.workoutId),
          date: r.date,
          volume: volumeOf(r.exercises),
          setCount: r.exercises.reduce((n, e) => n + e.sets.length, 0),
          sets: Object.fromEntries(r.exercises.map((e) => [String(e.exercise), e.sets])),
        },
      },
    ])
  );
}

async function withHistory<T extends { _id: Types.ObjectId; toJSON(): object }>(
  userId: Types.ObjectId,
  routines: T[]
) {
  const history = await lastWorkouts(
    userId,
    routines.map((r) => r._id)
  );
  return routines.map((r) => ({
    ...r.toJSON(),
    sessions: history.get(String(r._id))?.sessions ?? 0,
    lastWorkout: history.get(String(r._id))?.lastWorkout ?? null,
  }));
}

/** GET /api/routines — all routines (by name) with their latest workout. */
routinesRouter.get("/", async (req, res) => {
  const userId = userIdOf(req);
  const routines = await RoutineModel.find({ user: userId })
    .collation(nameOrder)
    .sort({ name: 1 })
    .populate("exercises.exercise", EXERCISE_FIELDS);
  res.json(await withHistory(userId, routines));
});

/** GET /api/routines/:id */
routinesRouter.get("/:id", async (req, res) => {
  const userId = userIdOf(req);
  const routine = await RoutineModel.findOne({ _id: req.params.id, user: userId }).populate(
    "exercises.exercise",
    EXERCISE_FIELDS
  );
  if (!routine) throw new HttpError(404, "Routine not found");
  const [result] = await withHistory(userId, [routine]);
  res.json(result);
});

/** POST /api/routines */
routinesRouter.post("/", async (req, res) => {
  const data = routineInputSchema.parse(req.body);
  const userId = userIdOf(req);
  await assertExercisesVisible(userId, data.exercises.map((e) => e.exercise));
  const routine = await uniqueName(data.name, () => RoutineModel.create({ ...data, user: userId }));
  res.status(201).json(routine);
});

/**
 * POST /api/routines/from-workout/:workoutId — turn a logged workout into a
 * routine (same name and exercises) and link that workout to it.
 */
routinesRouter.post("/from-workout/:workoutId", async (req, res) => {
  const workoutId = objectId.parse(req.params.workoutId);
  const userId = userIdOf(req);
  const workout = await WorkoutModel.findOne({ _id: workoutId, user: userId });
  if (!workout) throw new HttpError(404, "Workout not found");

  // Leave out exercises that were deleted since.
  const ids = workout.exercises.map((e) => e.exercise);
  const visible = await ExerciseModel.find(
    { _id: { $in: ids }, ...visibleExercisesFilter(userId) },
    "_id"
  ).lean();
  const keep = new Set(visible.map((e) => String(e._id)));
  const exercises = ids.filter((id) => keep.has(String(id))).map((exercise) => ({ exercise }));
  if (exercises.length === 0) throw new HttpError(400, "This workout has no exercises left to copy");

  const routine = await uniqueName(workout.name, () =>
    RoutineModel.create({ user: userId, name: workout.name, exercises })
  );
  workout.routine = routine._id;
  await workout.save();
  res.status(201).json(routine);
});

/** PUT /api/routines/:id — replace a routine's contents. */
routinesRouter.put("/:id", async (req, res) => {
  const data = routineInputSchema.parse(req.body);
  const userId = userIdOf(req);
  await assertExercisesVisible(userId, data.exercises.map((e) => e.exercise));
  const routine = await uniqueName(data.name, () =>
    RoutineModel.findOneAndUpdate({ _id: req.params.id, user: userId }, data, {
      returnDocument: "after",
      runValidators: true,
    })
  );
  if (!routine) throw new HttpError(404, "Routine not found");
  res.json(routine);
});

/** PUT /api/routines/:id/exercises — replace just the exercises (name and notes kept). */
routinesRouter.put("/:id/exercises", async (req, res) => {
  const { exercises } = routineExercisesSchema.parse(req.body);
  const userId = userIdOf(req);
  await assertExercisesVisible(userId, exercises.map((e) => e.exercise));
  const routine = await RoutineModel.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    { exercises },
    { returnDocument: "after", runValidators: true }
  );
  if (!routine) throw new HttpError(404, "Routine not found");
  res.json(routine);
});

/** DELETE /api/routines/:id — workouts logged from it are kept, just unlinked. */
routinesRouter.delete("/:id", async (req, res) => {
  const userId = userIdOf(req);
  const routine = await RoutineModel.findOneAndDelete({ _id: req.params.id, user: userId });
  if (!routine) throw new HttpError(404, "Routine not found");
  await WorkoutModel.updateMany({ user: userId, routine: routine._id }, { routine: null });
  res.status(204).end();
});
