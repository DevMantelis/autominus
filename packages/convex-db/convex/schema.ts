import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const autosTable = {
  id: v.string(),
  url: v.string(),
  source: v.string(),
  price: v.number(),
  status: v.union(
    v.literal("active"),
    v.literal("reserved"),
    v.literal("sold")
  ),
  plates: v.array(v.string()),
  images: v.array(v.string()),
  price_old: v.optional(v.number()),
  description: v.optional(v.string()),
  title: v.optional(v.string()),
  mileage: v.optional(v.string()),
  first_registration_year: v.optional(v.number()),
  first_registration_month: v.optional(v.number()),
  body_type: v.optional(v.string()),
  technical_inspection_year: v.optional(v.number()),
  technical_inspection_month: v.optional(v.number()),
  technical_inspection_day: v.optional(v.number()),
  technical_inspection_date: v.optional(v.number()),
  engine: v.optional(v.string()),
  doors: v.optional(v.string()),
  drive_wheels: v.optional(v.string()),
  gearbox: v.optional(v.string()),
  color: v.optional(v.string()),
  defects: v.optional(v.string()),
  mass: v.optional(v.string()),
  seats: v.optional(v.string()),
  fuel_type: v.optional(
    v.array(
      v.union(
        v.literal("Gas"),
        v.literal("Diesel"),
        v.literal("Petrol"),
        v.literal("Electric")
      )
    )
  ),
  location: v.optional(v.string()),
  vin: v.optional(v.string()),
  sdk: v.optional(v.string()),
  co2_emission: v.optional(v.string()),
  emission_tax: v.optional(v.number()),
  euro_standard: v.optional(v.string()),
  first_registration_year_country: v.optional(v.string()),
  wheel_diameter: v.optional(v.string()),
  climate_control: v.optional(v.string()),
  number: v.optional(v.string()),
  allowed_to_drive: v.optional(v.boolean()),
  insurance: v.optional(v.boolean()),
  wanted_by_police: v.optional(v.boolean()),
  needs_regitra_lookup: v.boolean(),
  // timestamps
  updated_at: v.optional(v.number()),
};

export default defineSchema({
  autos: defineTable(autosTable)
    .index("by_price", ["price"])
    .index("by_technical_inspection_date", ["technical_inspection_date"])
    .index("by_updated_at", ["updated_at"])
    .index("by_technical_inspection", [
      "technical_inspection_year",
      "technical_inspection_month",
    ])
    .index("by_external_id", ["id"]) // upsert lookups
    .index("by_regitra_lookup", ["needs_regitra_lookup"])
    .index("by_vin", ["vin", "insurance"])
    .index("by_filtering", [
      "price",
      "technical_inspection_date",
      "insurance",
      "gearbox",
      "fuel_type",
    ]),
  // Indexes for querying and upserting

  // Normalized images table
  //   auto_images: defineTable({
  //     autoId: v.id("autos"),
  //     url: v.string(),
  //   }).index("by_auto", ["autoId"]),
  //   scrapeInfo: defineTable({
  //     listingsCount: v.number(),
  //     stateUpdatedCount: v.number(),
  //   }),
});
