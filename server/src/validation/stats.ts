import { z } from "zod";
import { calendarDate } from "./workout.js";

export const dashboardQuery = z.object({
  /** The user's local "today" (YYYY-MM-DD). Defaults to today in UTC. */
  today: calendarDate.optional(),
  weeks: z.coerce.number().int().min(1).max(26).default(8),
});
