import { Schema, model, type InferSchemaType } from "mongoose";
import { toJSONOptions } from "./json.js";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Populated in the authentication step. Never returned by default.
    passwordHash: { type: String, select: false },
  },
  { timestamps: true, toJSON: toJSONOptions }
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
