import { Schema, model, type InferSchemaType } from "mongoose";
import { toJSONOptions } from "./json.js";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // bcrypt hash. Not loaded by queries unless selected with "+passwordHash".
    passwordHash: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      ...toJSONOptions,
      // `select: false` only affects queries, not a document just created or
      // explicitly selected, so also strip the hash from every JSON response.
      transform: (doc: unknown, ret: Record<string, unknown>) => {
        toJSONOptions.transform(doc, ret);
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
