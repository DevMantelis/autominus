import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

export const env = createEnv({
  server: {
    PLATES_API_URL: z.url(),
    DISCORD_WEBHOOK_ERRORS: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
