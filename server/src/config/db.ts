import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}
