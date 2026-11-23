import type { Request, RequestHandler } from "express";
import { Types } from "mongoose";
import { UserModel } from "../models/User.js";
import { verifyToken } from "../services/auth.js";
import { HttpError } from "../utils/http-error.js";

declare module "express-serve-static-core" {
  interface Request {
    /** Set by requireAuth. */
    userId?: Types.ObjectId;
  }
}

/**
 * Requires `Authorization: Bearer <jwt>`. Rejects deleted users too, so a
 * token stops working as soon as its account is gone.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const userId = token ? verifyToken(token) : null;
  if (!userId || !Types.ObjectId.isValid(userId)) throw new HttpError(401, "Not signed in");

  const exists = await UserModel.exists({ _id: userId });
  if (!exists) throw new HttpError(401, "Not signed in");

  req.userId = new Types.ObjectId(userId);
  next();
};

/** The signed-in user's id. Only valid behind requireAuth. */
export function userIdOf(req: Request): Types.ObjectId {
  if (!req.userId) throw new HttpError(401, "Not signed in");
  return req.userId;
}
