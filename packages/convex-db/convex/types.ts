import { Infer, v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { autosTable } from "./schema";
import { useQueries } from "convex/react";
import { makeUseQueryWithStatus } from "convex-helpers/react";
import { needsRegitraLookup } from "./autos";
import { FunctionArgs, FunctionReturnType } from "convex/server";
import { api } from "./_generated/api";

export const insertAutoValidator = v.object(autosTable);
export type insertAutoValidator = Infer<typeof insertAutoValidator>;

export const insertArrayOfAutosValidator = v.object({
  autos: v.array(insertAutoValidator),
});
export type insertArrayOfAutosValidator = Infer<
  typeof insertArrayOfAutosValidator
>;

export const updateArrayOfAutosValidator = v.object({
  autos: v.array(
    v.object({
      id: v.id("autos"),
      price: insertAutoValidator.fields.price,
      price_old: insertAutoValidator.fields.price_old,
      status: insertAutoValidator.fields.status,
    })
  ),
});
export type updateArrayOfAutosValidator = Infer<
  typeof updateArrayOfAutosValidator
>;

export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);

export type needsRegitraLookup = FunctionReturnType<
  typeof api.autos.needsRegitraLookup
>;

export type updateFromRegitra = FunctionArgs<
  typeof api.autos.updateFromRegitra
>;
