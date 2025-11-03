import { env } from "@repo/convex-db/env";
import { logger } from "./helpers";

export const logError = async (
  message: string,
  error: any,
  options: {
    sendToDiscord?: boolean;
  } = {
    sendToDiscord: false,
  }
) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(
    {
      error: errorMessage,
    },
    message
  );
  if (options.sendToDiscord)
    await fetch(env.DISCORD_WEBHOOK_ERRORS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `${message}:\n ${errorMessage}`,
      }),
    });
};
