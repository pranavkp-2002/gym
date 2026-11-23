import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { exercisesRouter } from "./routes/exercises.js";
import { workoutsRouter } from "./routes/workouts.js";
import { statsRouter } from "./routes/stats.js";
import { errorHandler, notFound } from "./middleware/error.js";

export const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/workouts", workoutsRouter);
app.use("/api/stats", statsRouter);

app.use(notFound);
app.use(errorHandler);
