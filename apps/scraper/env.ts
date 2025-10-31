import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

export const env = createEnv({
  server: {
    HEADLESS: z.string().transform((val) => val.toLowerCase() === "true"),
    CONCURRENCY: z.string().transform((val) => parseInt(val)),
    CONVEX_URL: z.url(),
    DISCORD_WEBHOOK_PLATES: z.url(),
    DISCORD_WEBHOOK_ERRORS: z.url(),
    PLATES_API_URL: z.url(),
    REGITRA_FIND_VIN: z.url(),
    REGITRA_LOOKUP: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
