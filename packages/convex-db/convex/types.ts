import { type Infer, v } from "convex/values";
import { autosTable } from "./schema";
import { useQueries } from "convex/react";
import { makeUseQueryWithStatus } from "convex-helpers/react";
import { needsRegitraLookup } from "./autos";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
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

export type FiltersT = {
  priceFrom: number;
  priceTo: number;
  technicalInspection: Array<"valid" | "invalid">;
  technicalInspectionDate: Date | null;
  insurance: boolean;
  gearbox: Array<"automatic" | "mechanical">;
  fuelType: Array<"petrol" | "diesel" | "gas">;
};

export const defaultFilter: FiltersT = {
  priceFrom: 50,
  priceTo: 2000,
  technicalInspection: ["valid", "invalid"],
  technicalInspectionDate: null,
  insurance: false,
  gearbox: ["automatic", "mechanical"],
  fuelType: ["petrol", "diesel", "gas"],
};

export type fuelType = Pick<insertAutoValidator, "fuel_type">;
