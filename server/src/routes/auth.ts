import { Router } from "express";
import { ExerciseModel } from "../models/Exercise.js";
import { UserModel } from "../models/User.js";
import { WorkoutModel } from "../models/Workout.js";
import { requireAuth, userIdOf } from "../middleware/auth.js";
import { hashPassword, signToken, verifyPassword } from "../services/auth.js";
import { HttpError } from "../utils/http-error.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../validation/auth.js";

export const authRouter = Router();

const isDuplicate = (err: unknown) => (err as { code?: number }).code === 11000;

/**
 * POST /api/auth/register -> { user, token }
 * The first account ever created takes ownership of data saved before
 * accounts existed (workouts and custom exercises with no owner).
 */
authRouter.post("/register", async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);
  const isFirstUser = (await UserModel.estimatedDocumentCount()) === 0;

  let user;
  try {
    user = await UserModel.create({ name, email, passwordHash: await hashPassword(password) });
  } catch (err) {
    if (isDuplicate(err)) throw new HttpError(409, "An account with that email already exists");
    throw err;
  }

  if (isFirstUser) {
    const [workouts, exercises] = await Promise.all([
      WorkoutModel.updateMany({ user: null }, { $set: { user: user._id } }),
      ExerciseModel.updateMany({ isCustom: true, createdBy: null }, { $set: { createdBy: user._id } }),
    ]);
    console.log(
      `First account ${user.email}: claimed ${workouts.modifiedCount} workouts, ${exercises.modifiedCount} custom exercises`
    );
  }

  res.status(201).json({ user, token: signToken(String(user._id)) });
});

/** POST /api/auth/login -> { user, token }. One generic error for any failure. */
authRouter.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await UserModel.findOne({ email }).select("+passwordHash");
  const ok = await verifyPassword(password, user?.passwordHash);
  if (!user || !ok) throw new HttpError(401, "Invalid email or password");
  res.json({ user, token: signToken(String(user._id)) });
});

/** GET /api/auth/me */
authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await UserModel.findById(userIdOf(req));
  if (!user) throw new HttpError(401, "Not signed in");
  res.json(user);
});

/** PATCH /api/auth/me { name?, email? } */
authRouter.patch("/me", requireAuth, async (req, res) => {
  const data = updateProfileSchema.parse(req.body);
  try {
    const user = await UserModel.findByIdAndUpdate(userIdOf(req), data, {
      returnDocument: "after",
      runValidators: true,
    });
    res.json(user);
  } catch (err) {
    if (isDuplicate(err)) throw new HttpError(409, "An account with that email already exists");
    throw err;
  }
});

/** POST /api/auth/password { currentPassword, newPassword } -> 204 */
authRouter.post("/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await UserModel.findById(userIdOf(req)).select("+passwordHash");
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new HttpError(400, "Current password is incorrect");
  }
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  res.status(204).end();
});
