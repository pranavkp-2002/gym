import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

try {
  await connectDB();
} catch (err) {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
}

// Express 5 passes listen errors (e.g. EADDRINUSE) to this callback.
app.listen(env.port, (err) => {
  if (err) {
    console.error(`Failed to start on port ${env.port}:`, err.message);
    process.exit(1);
  }
  console.log(`API listening onnn http://localhost:${env.port}`);
});
