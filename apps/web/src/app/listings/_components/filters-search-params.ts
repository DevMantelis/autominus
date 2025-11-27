import {
  createLoader,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsIsoDate,
  parseAsStringLiteral,
} from "nuqs/server";
import { SortOptions } from "./sort";

export const filtersSearchParams = {
  priceFrom: parseAsInteger,
  priceTo: parseAsInteger,
  technicalInspection: parseAsArrayOf(
    parseAsStringLiteral(["valid", "invalid"])
  ),
  technicalInspectionDate: parseAsIsoDate,
  insurance: parseAsBoolean,
  gearbox: parseAsArrayOf(parseAsStringLiteral(["automatic", "mechanical"])),
  fuelType: parseAsArrayOf(parseAsStringLiteral(["petrol", "diesel", "gas"])),
  sort: parseAsStringLiteral(SortOptions.map((option) => option.key)),
};

export const loadFilters = createLoader(filtersSearchParams);
