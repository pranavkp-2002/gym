import { Router } from "express";
import { userIdOf } from "../middleware/auth.js";
import { ExerciseModel } from "../models/Exercise.js";
import { WorkoutModel } from "../models/Workout.js";
import { exerciseSessions, personalRecords } from "../services/progress.js";
import { HttpError } from "../utils/http-error.js";
import { visibleExercisesFilter } from "../services/visibility.js";
import { findWorkoutSummaries, volumeExpr } from "../services/workout-summary.js";
import { dashboardQuery, exerciseProgressQuery } from "../validation/stats.js";
import { objectId } from "../validation/workout.js";

// Mounted behind requireAuth. Every aggregation starts by matching the user.

export const statsRouter = Router();

const DAY = 24 * 60 * 60 * 1000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Midnight UTC of the Monday on or before `d` (weeks start on Monday). */
function mondayOf(d: Date) {
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - daysSinceMonday * DAY);
}

/**
 * GET /api/stats/dashboard?today=YYYY-MM-DD&weeks=8
 *
 * `today` comes from the client because "this week" depends on the user's
 * timezone; workout dates are calendar days, so all math here is in UTC days.
 */
statsRouter.get("/dashboard", async (req, res) => {
  const parsed = dashboardQuery.parse(req.query);
  const userId = userIdOf(req);
  const today = parsed.today ?? new Date(`${isoDay(new Date())}T00:00:00.000Z`);
  const { weeks } = parsed;

  const thisMonday = mondayOf(today);
  const firstMonday = new Date(thisMonday.getTime() - (weeks - 1) * 7 * DAY);
  const nextMonday = new Date(thisMonday.getTime() + 7 * DAY);

  const [facets] = await WorkoutModel.aggregate<{
    totals: { workouts: number; volume: number }[];
    weekly: { _id: number; workouts: number; volume: number }[];
    thisWeekDays: { _id: Date }[];
  }>([
    { $match: { user: userId } },
    { $project: { date: 1, volume: volumeExpr } },
    {
      $facet: {
        totals: [
          { $group: { _id: null, workouts: { $sum: 1 }, volume: { $sum: "$volume" } } },
          { $project: { _id: 0 } },
        ],
        weekly: [
          { $match: { date: { $gte: firstMonday, $lt: nextMonday } } },
          {
            $group: {
              // week index 0..weeks-1, counted from firstMonday
              _id: { $floor: { $divide: [{ $subtract: ["$date", firstMonday] }, 7 * DAY] } },
              workouts: { $sum: 1 },
              volume: { $sum: "$volume" },
            },
          },
        ],
        thisWeekDays: [
          { $match: { date: { $gte: thisMonday, $lt: nextMonday } } },
          { $group: { _id: "$date" } },
        ],
      },
    },
  ]);

  // Fill empty weeks with zeros so the chart has a continuous axis.
  const byWeek = new Map(facets.weekly.map((w) => [w._id, w]));
  const weekly = Array.from({ length: weeks }, (_, i) => ({
    weekStart: isoDay(new Date(firstMonday.getTime() + i * 7 * DAY)),
    workouts: byWeek.get(i)?.workouts ?? 0,
    volume: byWeek.get(i)?.volume ?? 0,
  }));
  const thisWeek = weekly[weekly.length - 1];

  const recent = await findWorkoutSummaries({ user: userId }, { limit: 5 });

  res.json({
    today: isoDay(today),
    totals: facets.totals[0] ?? { workouts: 0, volume: 0 },
    thisWeek: {
      weekStart: thisWeek.weekStart,
      workouts: thisWeek.workouts,
      volume: thisWeek.volume,
      // Calendar days (YYYY-MM-DD) this week with at least one workout.
      trainedDays: facets.thisWeekDays.map((d) => isoDay(d._id)).sort(),
    },
    lastWeek: weekly.length > 1 ? weekly[weekly.length - 2] : null,
    weekly,
    recent,
  });
});

/**
 * GET /api/stats/exercises/:id?from=YYYY-MM-DD
 * One exercise's progress: per-session metrics (oldest first, optionally from a
 * date), all-time personal records, and which sessions set a new heaviest weight.
 * `before` is the session just before the range, so the first one shown can
 * still be compared with its predecessor.
 */
statsRouter.get("/exercises/:id", async (req, res) => {
  const id = objectId.parse(req.params.id);
  const { from } = exerciseProgressQuery.parse(req.query);

  const userId = userIdOf(req);
  const exercise = await ExerciseModel.findOne({ _id: id, ...visibleExercisesFilter(userId) });
  if (!exercise) throw new HttpError(404, "Exercise not found");

  const all = await exerciseSessions(userId, id);

  // Mark sessions that beat every earlier session's top weight.
  let running = 0;
  const marked = all.map((s) => {
    const isWeightPR = s.topWeight > running;
    running = Math.max(running, s.topWeight);
    return { ...s, isWeightPR };
  });

  const firstInRange = from ? marked.findIndex((s) => s.date >= from) : 0;
  const inRange = firstInRange === -1 ? [] : marked.slice(firstInRange);

  res.json({
    exercise,
    records: personalRecords(all),
    totalSessions: all.length,
    sessions: inRange,
    before: firstInRange > 0 ? marked[firstInRange - 1] : null,
  });
});

/**
 * GET /api/stats/records
 * Personal records for every exercise that has been logged, most recent first.
 */
statsRouter.get("/records", async (req, res) => {
  const rows = await WorkoutModel.aggregate<{
    _id: unknown;
    name: string;
    muscleGroup: string;
    heaviest: { weight: number; reps: number; date: Date };
    best1RM: number;
    sessions: number;
    lastDate: Date;
  }>([
    { $match: { user: userIdOf(req) } },
    { $unwind: "$exercises" },
    { $unwind: "$exercises.sets" },
    {
      $project: {
        workout: "$_id",
        date: 1,
        exercise: "$exercises.exercise",
        reps: "$exercises.sets.reps",
        weight: "$exercises.sets.weight",
        // Same Epley formula as services/progress.ts estimate1RM().
        e1rm: {
          $switch: {
            branches: [
              { case: { $or: [{ $lte: ["$exercises.sets.reps", 0] }, { $lte: ["$exercises.sets.weight", 0] }] }, then: 0 },
              { case: { $eq: ["$exercises.sets.reps", 1] }, then: "$exercises.sets.weight" },
            ],
            default: {
              $round: [
                { $multiply: ["$exercises.sets.weight", { $add: [1, { $divide: ["$exercises.sets.reps", 30] }] }] },
                1,
              ],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$exercise",
        heaviest: {
          $top: {
            sortBy: { weight: -1, reps: -1, date: 1 },
            output: { weight: "$weight", reps: "$reps", date: "$date" },
          },
        },
        best1RM: { $max: "$e1rm" },
        workouts: { $addToSet: "$workout" },
        lastDate: { $max: "$date" },
      },
    },
    { $lookup: { from: "exercises", localField: "_id", foreignField: "_id", as: "ex" } },
    { $unwind: "$ex" }, // drops records for exercises that were deleted
    {
      $project: {
        name: "$ex.name",
        muscleGroup: "$ex.muscleGroup",
        heaviest: 1,
        best1RM: 1,
        sessions: { $size: "$workouts" },
        lastDate: 1,
      },
    },
    { $sort: { lastDate: -1, name: 1 } },
  ]);

  res.json(rows.map(({ _id, ...r }) => ({ exerciseId: String(_id), ...r })));
});
