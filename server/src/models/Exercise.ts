import { Schema, model, type InferSchemaType } from "mongoose";
import { CATEGORIES, EQUIPMENT, MUSCLE_GROUPS } from "./constants.js";
import { toJSONOptions } from "./json.js";

const exerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    muscleGroup: { type: String, required: true, enum: MUSCLE_GROUPS },
    equipment: { type: String, required: true, enum: EQUIPMENT },
    category: { type: String, required: true, enum: CATEGORIES },
    // false = predefined (seeded), true = added by a user.
    isCustom: { type: Boolean, default: false },
    // Owner of a custom exercise. null for predefined exercises
    // (and for custom ones until authentication is added).
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, toJSON: toJSONOptions }
);

// Names are unique per owner, case-insensitively ("Bench Press" == "bench press").
exerciseSchema.index(
  { name: 1, createdBy: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);
exerciseSchema.index({ muscleGroup: 1 });

export type Exercise = InferSchemaType<typeof exerciseSchema>;
export const ExerciseModel = model("Exercise", exerciseSchema);
