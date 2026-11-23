import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

try {
  // await connectDB();
} catch (err) {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
}

app.listen(env.port, () => {
  console.log(`API listening onnn http://localhost:${env.port}`);
});
