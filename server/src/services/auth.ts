import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

const BCRYPT_ROUNDS = 12;

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

// Compared against when the email doesn't exist, so a login for an unknown
// email takes as long as a wrong password (no account enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

export const verifyPassword = (password: string, hash: string | null | undefined) =>
  bcrypt.compare(password, hash ?? DUMMY_HASH).then((ok) => ok && Boolean(hash));

export function signToken(userId: string) {
  return jwt.sign({}, env.jwtSecret, {
    subject: userId,
    algorithm: "HS256",
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

/** Returns the user id, or null for a missing/invalid/expired token. */
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    return typeof payload === "object" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
