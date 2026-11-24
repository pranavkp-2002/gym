import { Router } from "express";
import { Types } from "mongoose";
import { userIdOf } from "../middleware/auth.js";
import { RoutineModel } from "../models/Routine.js";
import { WorkoutModel } from "../models/Workout.js";
import { findWorkoutSummaries, volumeOf } from "../services/workout-summary.js";
import { assertExercisesVisible } from "../services/visibility.js";
import { HttpError } from "../utils/http-error.js";
import { listWorkoutsQuery, previousQuery, workoutInputSchema } from "../validation/workout.js";

// Mounted behind requireAuth. Every query is scoped to the signed-in user;
// another user's workout ids behave exactly like ids that don't exist (404).

export const workoutsRouter = Router();

type SetLike = { reps: number; weight: number };

/** Reject workouts that reference exercises or a routine the user can't see. */
async function assertReferencesExist(
  userId: Types.ObjectId,
  data: { exercises: { exercise: string }[]; routine: string | null }
) {
  await assertExercisesVisible(userId, data.exercises.map((e) => e.exercise));
  if (data.routine && !(await RoutineModel.exists({ _id: data.routine, user: userId })))
    throw new HttpError(400, "That routine doesn't exist");
}

/** GET /api/workouts?from=YYYY-MM-DD&to=YYYY-MM-DD&routine=id&page=1&limit=20 — newest first. */
workoutsRouter.get("/", async (req, res) => {
  const { from, to, routine, page, limit } = listWorkoutsQuery.parse(req.query);

  const filter: Record<string, unknown> = { user: userIdOf(req) };
  if (routine) filter.routine = new Types.ObjectId(routine);
  if (from || to) {
    filter.date = {
      ...(from && { $gte: from }),
      ...(to && { $lte: to }), // dates are midnight UTC, so $lte includes that day
    };
  }

  const [items, total] = await Promise.all([
    findWorkoutSummaries(filter, { skip: (page - 1) * limit, limit }),
    WorkoutModel.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

/**
 * GET /api/workouts/previous?exercises=id1,id2&excludeWorkout=id
 * For each exercise, the sets from the most recent workout that contained it.
 * Powers "last time" hints and pre-filling weights in the logger.
 */
workoutsRouter.get("/previous", async (req, res) => {
  const { exercises, excludeWorkout } = previousQuery.parse(req.query);
  const ids = exercises.map((id) => new Types.ObjectId(id));

  const rows = await WorkoutModel.aggregate<{
    _id: Types.ObjectId;
    workoutId: Types.ObjectId;
    date: Date;
    sets: SetLike[];
  }>([
    {
      $match: {
        user: userIdOf(req),
        "exercises.exercise": { $in: ids },
        ...(excludeWorkout && { _id: { $ne: new Types.ObjectId(excludeWorkout) } }),
      },
    },
    { $sort: { date: -1, createdAt: -1 } },
    { $unwind: "$exercises" },
    { $match: { "exercises.exercise": { $in: ids } } },
    {
      $group: {
        _id: "$exercises.exercise",
        workoutId: { $first: "$_id" },
        date: { $first: "$date" },
        sets: { $first: "$exercises.sets" },
      },
    },
  ]);

  const result = Object.fromEntries(
    rows.map((r) => [
      String(r._id),
      { workoutId: String(r.workoutId), date: r.date, sets: r.sets },
    ])
  );
  res.json(result);
});

/**
 * GET /api/workouts/:id — full workout with exercise details. For a workout
 * logged from a routine, `previousInRoutine` is the session of that routine
 * just before it (for "vs last time" comparisons), or null.
 */
workoutsRouter.get("/:id", async (req, res) => {
  const userId = userIdOf(req);
  const workout = await WorkoutModel.findOne({ _id: req.params.id, user: userId })
    .populate("exercises.exercise", "name muscleGroup equipment category")
    .populate("routine", "name");
  if (!workout) throw new HttpError(404, "Workout not found");

  let previousInRoutine = null;
  if (workout.routine) {
    const prev = await WorkoutModel.findOne({
      user: userId,
      routine: workout.routine._id,
      _id: { $ne: workout._id },
      $or: [
        { date: { $lt: workout.date } },
        { date: workout.date, createdAt: { $lt: workout.createdAt } },
      ],
    })
      .sort({ date: -1, createdAt: -1 })
      .lean();
    if (prev) {
      previousInRoutine = {
        id: String(prev._id),
        date: prev.date,
        volume: volumeOf(prev.exercises),
        sets: Object.fromEntries(prev.exercises.map((e) => [String(e.exercise), e.sets])),
      };
    }
  }

  res.json({ ...workout.toJSON(), volume: volumeOf(workout.exercises), previousInRoutine });
});

/** POST /api/workouts */
workoutsRouter.post("/", async (req, res) => {
  const data = workoutInputSchema.parse(req.body);
  const userId = userIdOf(req);
  await assertReferencesExist(userId, data);
  const workout = await WorkoutModel.create({ ...data, user: userId });
  res.status(201).json(workout);
});

/** PUT /api/workouts/:id — replace a workout's contents. */
workoutsRouter.put("/:id", async (req, res) => {
  const data = workoutInputSchema.parse(req.body);
  const userId = userIdOf(req);
  await assertReferencesExist(userId, data);
  const workout = await WorkoutModel.findOneAndUpdate({ _id: req.params.id, user: userId }, data, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!workout) throw new HttpError(404, "Workout not found");
  res.json(workout);
});

/** DELETE /api/workouts/:id */
workoutsRouter.delete("/:id", async (req, res) => {
  const workout = await WorkoutModel.findOneAndDelete({ _id: req.params.id, user: userIdOf(req) });
  if (!workout) throw new HttpError(404, "Workout not found");
  res.status(204).end();
});
