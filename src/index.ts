import { serve } from "@hono/node-server";

import app from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();

serve(
  {
    fetch: app.fetch,
    port: config.port
  },
  (info) => {
    console.log(`ClawBadge listening on http://localhost:${info.port}`);
  }
);
