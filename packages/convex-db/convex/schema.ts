import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  autos: defineTable({
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
    first_registration_year: v.optional(v.string()),
    body_type: v.optional(v.string()),
    technical_inspection_year: v.optional(v.number()),
    technical_inspection_month: v.optional(v.number()),
    engine: v.optional(v.string()),
    doors: v.optional(v.string()),
    drive_wheels: v.optional(v.string()),
    gearbox: v.optional(v.string()),
    color: v.optional(v.string()),
    defects: v.optional(v.string()),
    mass: v.optional(v.string()),
    seats: v.optional(v.string()),
    fuel_type: v.optional(v.string()),
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
    // timestamps
    updated_at: v.number(),
  })
    .index("by_updated_at", ["updated_at"])
    .index("by_technical_inspection", [
      "technical_inspection_year",
      "technical_inspection_month",
    ])
    .index("by_external_id", ["id"]), // upsert lookups
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
