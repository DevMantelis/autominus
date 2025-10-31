import {
  mutation as rawMutation,
  internalMutation as rawInternalMutation,
} from "./_generated/server";
import { DataModel } from "./_generated/dataModel";
import { Triggers } from "convex-helpers/server/triggers";
import { internal } from "./_generated/api";
import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions";

const triggers = new Triggers<DataModel>();

triggers.register("autos", async (ctx, change) => {
  if (change.operation === "insert") {
    await ctx.scheduler.runAfter(0, internal.actions.getPlates, {
      id: change.newDoc._id,
      images: change.newDoc.images,
    });
  }
  if (
    change.operation === "update" &&
    change.oldDoc.plates.length === 0 &&
    change.newDoc.plates.length > 0 &&
    change.newDoc.vin
  ) {
    await ctx.db.patch(change.newDoc._id, { needs_regitra_lookup: true });
  }
});

export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutation = customMutation(
  rawInternalMutation,
  customCtx(triggers.wrapDB)
);
