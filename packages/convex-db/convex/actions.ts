"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { insertAutoValidator, updateArrayOfAutosValidator } from "./types";
import { env } from "../env";
import { api } from "./_generated/api";
export const sendErrorToDiscord = internalAction({
  args: v.object({
    auto: v.string(),
    error: v.string(),
    type: v.string(),
  }),
  handler: async (ctx, { auto, error, type }) => {
    await fetch(env.DISCORD_WEBHOOK_ERRORS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Failed to ${type}: ${auto}.\n ${error}`,
      }),
    });
  },
});

export const getPlates = internalAction({
  args: v.object({ id: v.id("autos"), images: v.array(v.string()) }),
  handler: async (ctx, { id, images }) => {
    try {
      const queryString = `/recognize_plate?image_path=${images.join("&image_path=")}`;
      if (images.length === 0) return [];

      const response = await fetch(`${env.PLATES_API_URL}${queryString}`);
      if (!response.ok) {
        return [];
      }
      const data = (await response.json()) as { plates: string[] };
      await ctx.runMutation(api.autos.updatePlates, {
        id,
        plates: data.plates,
      });
    } catch (error) {
      return [];
    }
  },
});
