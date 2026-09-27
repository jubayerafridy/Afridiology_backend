import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.log(`Afridiology backend running on port ${env.PORT}`);

  console.log(`Environment: ${env.NODE_ENV}`);
});

server.on("error", (error) => {
  console.error("Server error:", error);
});
