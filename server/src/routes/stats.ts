import { Router } from "express";
import { WorkoutModel } from "../models/Workout.js";
import { findWorkoutSummaries, volumeExpr } from "../services/workout-summary.js";
import { dashboardQuery } from "../validation/stats.js";

// TODO(Step 6 – auth): scope to req.user.

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

  const recent = await findWorkoutSummaries({}, { limit: 5 });

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
