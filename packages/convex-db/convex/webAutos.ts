import { paginationOptsValidator } from "convex/server";
import { query } from "./_generated/server";
import { v } from "convex/values";
import moment from "moment";
import { filter } from "convex-helpers/server/filter";

export const listings = query({
  args: {
    priceFrom: v.nullable(v.number()),
    priceTo: v.nullable(v.number()),
    technicalInspection: v.nullable(
      v.array(v.union(v.literal("valid"), v.literal("invalid")))
    ),
    technicalInspectionDate: v.nullable(v.string()),
    insurance: v.nullable(v.boolean()),
    gearbox: v.nullable(
      v.array(v.union(v.literal("mechanical"), v.literal("automatic")))
    ),
    fuelType: v.nullable(
      v.array(
        v.union(
          v.literal("petrol"),
          v.literal("diesel"),
          v.literal("gas"),
          v.literal("electric")
        )
      )
    ),
    sort: v.nullable(
      v.union(
        v.literal("new_to_old"),
        v.literal("price_high_to_low"),
        v.literal("price_low_to_high"),
        v.literal("tech_long_to_short"),
        v.literal("tech_short_to_long")
      )
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (
    ctx,
    {
      fuelType,
      gearbox,
      insurance,
      paginationOpts,
      priceFrom,
      priceTo,
      sort,
      technicalInspection,
      technicalInspectionDate,
    }
  ) => {
    const hasPriceFrom = priceFrom !== null && priceFrom !== undefined;
    const hasPriceTo = priceTo !== null && priceTo !== undefined;
    const wantsValidInspection = technicalInspection?.includes("valid");
    const wantsInvalidInspection = technicalInspection?.includes("invalid");
    const technicalInspectionDateMs = technicalInspectionDate
      ? moment(technicalInspectionDate).valueOf()
      : undefined;

    if (
      hasPriceFrom &&
      hasPriceTo &&
      (priceFrom! > priceTo! || priceFrom! < 50 || priceTo! < 50)
    ) {
      throw new Error("Wrong query");
    }

    const priceSorted =
      sort === "price_high_to_low" || sort === "price_low_to_high";
    const technicalInspectionSorted =
      sort === "tech_long_to_short" || sort === "tech_short_to_long";

    let q = (() => {
      if (priceSorted) {
        return ctx.db
          .query("autos")
          .withIndex("by_price", (idx) => {
            if (hasPriceFrom && hasPriceTo)
              return idx.gte("price", priceFrom!).lte("price", priceTo!);
            if (hasPriceFrom) return idx.gte("price", priceFrom!);
            if (hasPriceTo) return idx.lte("price", priceTo!);
            return idx;
          })
          .order(sort === "price_high_to_low" ? "desc" : "asc");
      }

      if (technicalInspectionSorted) {
        return ctx.db
          .query("autos")
          .withIndex("by_technical_inspection_date", (idx) => {
            if (technicalInspectionDateMs !== undefined)
              return idx.gte(
                "technical_inspection_date",
                technicalInspectionDateMs
              );
            return idx;
          })
          .order(sort === "tech_long_to_short" ? "desc" : "asc");
      }

      return ctx.db.query("autos").order("desc");
    })();

    if (!priceSorted) {
      if (hasPriceFrom)
        q = q.filter((q) => q.gte(q.field("price"), priceFrom!));
      if (hasPriceTo) q = q.filter((q) => q.lte(q.field("price"), priceTo!));
    }

    if (wantsValidInspection && wantsInvalidInspection) {
      // no-op: both selected, keep all
    } else if (wantsValidInspection) {
      q = q.filter((q) =>
        q.neq(q.field("technical_inspection_date"), undefined)
      );
      if (technicalInspectionDateMs !== undefined)
        q = q.filter((q) =>
          q.gte(q.field("technical_inspection_date"), technicalInspectionDateMs)
        );
    } else if (wantsInvalidInspection) {
      q = q.filter((q) =>
        q.eq(q.field("technical_inspection_date"), undefined)
      );
    } else if (technicalInspectionDateMs !== undefined) {
      q = q.filter((q) =>
        q.gte(q.field("technical_inspection_date"), technicalInspectionDateMs)
      );
    }

    if (typeof insurance === "boolean")
      q = q.filter((q) => q.eq(q.field("insurance"), insurance));

    if (gearbox) {
      const wantsAutomatic = gearbox.includes("automatic");
      const wantsMechanical = gearbox.includes("mechanical");

      if (wantsAutomatic && !wantsMechanical)
        q = q.filter((q) => q.eq(q.field("gearbox"), "Automatinė"));
      else if (wantsMechanical && !wantsAutomatic)
        q = q.filter((q) => q.neq(q.field("gearbox"), "Automatinė"));
    }

    if (fuelType) {
      const types = fuelType.map(
        (type) => type.charAt(0).toUpperCase() + type.slice(1)
      ) as ["Petrol", "Diesel", "Electric", "Gas"];
      q = filter(q, (autos) =>
        types.every((type) => autos.fuel_type?.includes(type))
      );
    }

    return await q.paginate(paginationOpts);
  },
});
