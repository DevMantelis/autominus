//insert autos into convex
import { v } from "convex/values";
import { query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import {
  insertArrayOfAutosValidator,
  updateArrayOfAutosValidator,
} from "./types";
import { mutation } from "./triggers";

export const getExistingIds = query({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, { ids }) => {
    if (ids.length === 0) return [];

    const uniqueIds = Array.from(new Set(ids));
    const autos: Array<{
      id: string;
      external_id: string;
      price: number;
      price_old?: number;
      status: string | undefined;
    }> = [];

    for (const id of uniqueIds) {
      const existing = await ctx.db
        .query("autos")
        .withIndex("by_external_id", (q) => q.eq("id", id))
        .first();

      if (!existing) continue;

      autos.push({
        id: existing.id,
        external_id: id,
        price: existing.price,
        price_old: existing.price_old,
        status: existing.status,
      });
    }

    return autos;
  },
});

export const insertAutos = mutation({
  args: insertArrayOfAutosValidator,
  handler: async (ctx, { autos }) => {
    for (const auto of autos) {
      try {
        await ctx.db.insert("autos", auto);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(errorMessage);
        await ctx.scheduler.runAfter(0, internal.actions.sendErrorToDiscord, {
          error: errorMessage,
          auto: auto.url,
          type: "insert",
        });
      }
    }
  },
});

export const updateAutos = mutation({
  args: updateArrayOfAutosValidator,
  handler: async (ctx, { autos }) => {
    for (const auto of autos) {
      try {
        const { id, ...autoWithoutId } = auto;
        await ctx.db.patch(auto.id, autoWithoutId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(errorMessage);
        await ctx.scheduler.runAfter(0, internal.actions.sendErrorToDiscord, {
          error: errorMessage,
          auto: auto.id,
          type: "update",
        });
      }
    }
  },
});

export const updatePlates = mutation({
  args: v.object({
    id: v.id("autos"),
    plates: v.array(v.string()),
  }),
  handler: async (ctx, { id, plates }) => {
    await ctx.db.patch(id, { plates });
  },
});

export const needsRegitraLookup = query({
  handler: async (ctx) => {
    const autos = await ctx.db
      .query("autos")
      .withIndex("by_regitra_lookup", (q) => q.eq("needs_regitra_lookup", true))
      .collect();
    return autos.map((auto) => {
      {
        return { id: auto._id, vin: auto.vin, plates: auto.plates };
      }
    });
  },
});

export const updateFromRegitra = mutation({
  args: v.object({
    autos: v.array(
      v.object({
        id: v.id("autos"),
        allowed_to_drive: v.optional(v.boolean()),
        insurance: v.optional(v.boolean()),
        wanted_by_police: v.optional(v.boolean()),
        needs_regitra_lookup: v.boolean(),
        plates: v.optional(v.array(v.string())),
        technical_inspection_year: v.optional(v.number()),
        technical_inspection_month: v.optional(v.number()),
        technical_inspection_day: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, { autos }) => {
    for (const auto of autos) {
      const patchData = Object.fromEntries(
        Object.entries({
          allowed_to_drive: auto.allowed_to_drive,
          insurance: auto.insurance,
          wanted_by_police: auto.wanted_by_police,
          needs_regitra_lookup: auto.needs_regitra_lookup,
          plates: auto.plates,
          technical_inspection_year: auto.technical_inspection_year,
          technical_inspection_month: auto.technical_inspection_month,
          technical_inspection_day: auto.technical_inspection_day,
        }).filter(([_, v]) => v !== undefined)
      );
      if (Object.keys(patchData).length === 0) {
        throw new Error("No fields provided to update");
      }
      await ctx.db.patch(auto.id, patchData);
    }
  },
});

// export const insertAutoArgs = v.array(
//   v.object({
//     auto: v.object({
//       id: v.string(),
//       url: v.string(),
//       source: v.string(),
//       price: v.number(),
//       price_old: v.optional(v.number()),
//       description: v.optional(v.string()),
//       title: v.optional(v.string()),

//       mileage: v.optional(v.string()),
//       first_registration_year: v.optional(v.string()),
//       body_type: v.optional(v.string()),
//       technical_inspection: v.optional(v.string()),
//       engine: v.optional(v.string()),
//       doors: v.optional(v.string()),
//       drive_wheels: v.optional(v.string()),
//       gearbox: v.optional(v.string()),
//       color: v.optional(v.string()),
//       defects: v.optional(v.string()),
//       mass: v.optional(v.string()),
//       seats: v.optional(v.string()),
//       fuel_type: v.optional(v.string()),
//       location: v.optional(v.string()),
//       vin: v.optional(v.string()),
//       sdk: v.optional(v.string()),
//       co2_emission: v.optional(v.string()),
//       emission_tax: v.optional(v.number()),
//       euro_standard: v.optional(v.string()),
//       first_registration_year_country: v.optional(v.string()),
//       wheel_diameter: v.optional(v.string()),
//       climate_control: v.optional(v.string()),
//       status: v.optional(
//         v.union(v.literal("active"), v.literal("reserved"), v.literal("sold"))
//       ),
//       number: v.optional(v.string()),
//       initial: v.boolean(),
//       plates: v.optional(v.array(v.string())),
//     }),
//     images: v.array(v.string()),
//   })
// );

// export const updateAutoArgs = v.array(
//   v.object({
//     id: v.string(),
//     status: v.union(
//       v.literal("active"),
//       v.literal("reserved"),
//       v.literal("sold")
//     ),
//     price: v.optional(v.number()),
//     price_old: v.optional(v.number()),
//   })
// );

// export const insertAutos = mutation({
//   args: {
//     autos: insertAutoArgs,
//   },
//   handler: async (ctx, args) => {
//     for (const auto of args.autos) {
//       //   console.log("auto", auto.auto.id);
//       const now = Date.now();

//       const existing = await ctx.db
//         .query("autos")
//         .withIndex("by_external_id", (q) => q.eq("id", auto.auto.id))
//         .first();

//       if (existing) {
//         const current = await ctx.db
//           .query("auto_images")
//           .withIndex("by_auto", (q) => q.eq("autoId", existing._id))
//           .collect();
//         for (const img of current) {
//           await ctx.db.delete(img._id);
//         }
//         for (const url of auto.images)
//           await ctx.db.insert("auto_images", { autoId: existing._id, url });

//         // console.log("patching", auto.auto.id);
//         // Clear optional fields that are omitted in the incoming payload
//         // Comment from this if want undefined values to not change the field
//         const optionalKeys = [
//           "price_old",
//           "description",
//           "title",
//           "mileage",
//           "first_registration_year",
//           "body_type",
//           "technical_inspection",
//           "engine",
//           "doors",
//           "drive_wheels",
//           "gearbox",
//           "color",
//           "defects",
//           "mass",
//           "seats",
//           "fuel_type",
//           "location",
//           "vin",
//           "sdk",
//           "co2_emission",
//           "emission_tax",
//           "euro_standard",
//           "first_registration_year_country",
//           "wheel_diameter",
//           "climate_control",
//           "status",
//           "number",
//         ] as const;
//         const unset: Record<string, undefined> = {};
//         for (const k of optionalKeys) {
//           const incomingVal = auto.auto[k];
//           const existingVal = existing[k];
//           if (incomingVal === undefined && existingVal !== undefined) {
//             unset[k] = undefined;
//           }
//         }
//         // Comment to this if want undefined values to not change the field
//         console.log("patching", auto.auto);
//         await ctx.db.patch(existing._id, {
//           ...unset, // Comment this if want undefined values to not change the field
//           ...auto.auto,
//           updated_at: now,
//         });
//         continue;
//       }

//       //   console.log("inserting", auto.auto.id);
//       const _id = await ctx.db.insert("autos", {
//         ...auto.auto,
//         updated_at: now,
//       });
//       if (auto.images.length !== 0) {
//         for (const url of auto.images) {
//           await ctx.db.insert("auto_images", { autoId: _id, url });
//         }
//       }
//     }
//     return;
//   },
// });

// export const updateAutos = mutation({
//   args: {
//     listings: updateAutoArgs,
//   },
//   handler: async (ctx, args) => {
//     for (const listing of args.listings) {
//       const existing = await ctx.db
//         .query("autos")
//         .withIndex("by_string_id", (q) => q.eq("id", listing.id))
//         .first();
//       if (!existing) {
//         throw new Error("Auto not found");
//       }
//       await ctx.db.patch(existing._id, {
//         status: listing.status,
//         price: listing.price ?? existing.price,
//         price_old: listing.price_old ?? existing.price_old,
//         updated_at: Date.now(),
//       });
//     }
//     return;
//   },
// });

// export const getAllAutos = query({
//   args: { paginationOpts: paginationOptsValidator },
//   handler: async (ctx, args) => {
//     const result = await ctx.db
//       .query("autos")
//       .withIndex("by_creation_time")
//       .order("desc")
//       .paginate(args.paginationOpts);

//     const pageWithImages = await Promise.all(
//       result.page.map(async (auto) => {
//         const images = await ctx.db
//           .query("auto_images")
//           .withIndex("by_auto", (q) => q.eq("autoId", auto._id))
//           .collect();

//         return {
//           ...auto,
//           images: images.map((image) => image.url),
//         };
//       })
//     );

//     return {
//       ...result,
//       page: pageWithImages,
//     };
//   },
// });

// export const updateVins = mutation({
//   args: {
//     vins: v.array(v.object({ id: v.string(), vin: v.optional(v.string()) })),
//   },
//   handler: async (ctx, args) => {
//     for (const vin of args.vins) {
//       const existing = await ctx.db
//         .query("autos")
//         .withIndex("by_string_id", (q) => q.eq("id", vin.id))
//         .first();
//       if (!existing) continue;
//       await ctx.db.patch(existing._id, { vin: vin.vin });
//     }
//   },
// });

// export const deleteOld = mutation({
//   args: {},
//   handler: async (ctx) => {
//     const oldListings = await ctx.db
//       .query("autos")
//       .withIndex("by_updated_at", (q) =>
//         q.lt("updated_at", Date.now() - 7 * 24 * 60 * 60 * 1000)
//       )
//       .take(100);
//     const howMany = oldListings.length;
//     for (const listing of oldListings) {
//       const images = await ctx.db
//         .query("auto_images")
//         .withIndex("by_auto", (q) => q.eq("autoId", listing._id))
//         .collect();
//       for (const image of images) {
//         await ctx.db.delete(image._id);
//       }
//       await ctx.db.delete(listing._id);
//     }
//     return howMany;
//   },
// });

// export const getAutosByPriceAndTech = query({
//   args: {
//     paginationOpts: paginationOptsValidator,
//     priceFrom: v.optional(v.number()),
//     priceTo: v.optional(v.number()),
//     techDate: v.optional(v.string()),
//   },
//   handler: async (ctx, args) => {
//     const priceTo = args.priceTo ?? 2000;
//     const priceFrom = args.priceFrom
//       ? args.priceFrom > priceTo
//         ? priceTo
//         : args.priceFrom
//       : 0;
//     const techDate = args.techDate;

//     const paginationOpts = args.paginationOpts;
//     const result = await ctx.db
//       .query("autos")
//       .withIndex("by_price_and_tech", (q) =>
//         q.gte("price", priceFrom).lte("price", priceTo)
//       )
//       .paginate(paginationOpts);

//     const pageWithImages = await Promise.all(
//       result.page.map(async (auto) => {
//         const images = await ctx.db
//           .query("auto_images")
//           .withIndex("by_auto", (q) => q.eq("autoId", auto._id))
//           .collect();

//         return {
//           ...auto,
//           images: images.map((image) => image.url),
//         };
//       })
//     );

//     return {
//       ...result,
//       page: pageWithImages,
//     };
//   },
// });
