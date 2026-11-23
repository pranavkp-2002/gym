import { Router } from "express";
import { Types } from "mongoose";
import { ExerciseModel } from "../models/Exercise.js";
import { WorkoutModel } from "../models/Workout.js";
import { findWorkoutSummaries, volumeOf } from "../services/workout-summary.js";
import { HttpError } from "../utils/http-error.js";
import { listWorkoutsQuery, previousQuery, workoutInputSchema } from "../validation/workout.js";

// TODO(Step 6 – auth): scope every query to req.user and set `user` on create.

export const workoutsRouter = Router();

type SetLike = { reps: number; weight: number };

/** Reject workouts that reference exercises that don't exist. */
async function assertExercisesExist(ids: string[]) {
  const unique = [...new Set(ids)];
  const found = await ExerciseModel.countDocuments({ _id: { $in: unique } });
  if (found !== unique.length) throw new HttpError(400, "One or more exercises don't exist");
}

/** GET /api/workouts?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20 — newest first. */
workoutsRouter.get("/", async (req, res) => {
  const { from, to, page, limit } = listWorkoutsQuery.parse(req.query);

  const filter: Record<string, unknown> = {};
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

/** GET /api/workouts/:id — full workout with exercise details. */
workoutsRouter.get("/:id", async (req, res) => {
  const workout = await WorkoutModel.findById(req.params.id).populate(
    "exercises.exercise",
    "name muscleGroup equipment category"
  );
  if (!workout) throw new HttpError(404, "Workout not found");
  res.json({ ...workout.toJSON(), volume: volumeOf(workout.exercises) });
});

/** POST /api/workouts */
workoutsRouter.post("/", async (req, res) => {
  const data = workoutInputSchema.parse(req.body);
  await assertExercisesExist(data.exercises.map((e) => e.exercise));
  const workout = await WorkoutModel.create(data);
  res.status(201).json(workout);
});

/** PUT /api/workouts/:id — replace a workout's contents. */
workoutsRouter.put("/:id", async (req, res) => {
  const data = workoutInputSchema.parse(req.body);
  await assertExercisesExist(data.exercises.map((e) => e.exercise));
  const workout = await WorkoutModel.findByIdAndUpdate(req.params.id, data, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!workout) throw new HttpError(404, "Workout not found");
  res.json(workout);
});

/** DELETE /api/workouts/:id */
workoutsRouter.delete("/:id", async (req, res) => {
  const workout = await WorkoutModel.findByIdAndDelete(req.params.id);
  if (!workout) throw new HttpError(404, "Workout not found");
  res.status(204).end();
});
