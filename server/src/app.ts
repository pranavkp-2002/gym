import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { authRouter } from "./routes/auth.js";
import { exercisesRouter } from "./routes/exercises.js";
import { healthRouter } from "./routes/health.js";
import { routinesRouter } from "./routes/routines.js";
import { statsRouter } from "./routes/stats.js";
import { workoutsRouter } from "./routes/workouts.js";

export const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "100kb" }));

// Public
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);

// Everything below requires a signed-in user, and every query is scoped to them.
app.use("/api/exercises", requireAuth, exercisesRouter);
app.use("/api/workouts", requireAuth, workoutsRouter);
app.use("/api/routines", requireAuth, routinesRouter);
app.use("/api/stats", requireAuth, statsRouter);

app.use(notFound);
app.use(errorHandler);
