import {
  insertArrayOfAutosValidator,
  updateArrayOfAutosValidator,
  type updateFromRegitra,
} from "@repo/convex-db/convex/types";
import { logger } from "./helpers";
import { api } from "@repo/convex-db/convex/_generated/api";
import { logError } from "./error";
import { ConvexHttpClient } from "convex/browser";

export class DB {
  private convex: ConvexHttpClient;
  constructor(convex: ConvexHttpClient) {
    this.convex = convex;
  }
  async insertAutos(listingsToInsert: insertArrayOfAutosValidator["autos"]) {
    if (listingsToInsert.length === 0) return;

    try {
      await this.convex.mutation(api.autos.insertAutos, {
        autos: listingsToInsert,
      });
      logger.info(`Inserted ${listingsToInsert.length} listings.`);
    } catch (error) {
      await logError("Error inserting autos", error, {
        sendToDiscord: true,
      });
    }
  }
  async updateAutos(listingsToUpdate: updateArrayOfAutosValidator["autos"]) {
    if (listingsToUpdate.length === 0) return;

    try {
      await this.convex.mutation(api.autos.updateAutos, {
        autos: listingsToUpdate,
      });
      logger.info(`Updated ${listingsToUpdate.length} listings.`);
    } catch (error) {
      await logError("Failed updating autos", error, { sendToDiscord: true });
    }
  }
  async getAutosForLookup() {
    try {
      return await this.convex.query(api.autos.needsRegitraLookup);
    } catch (error) {
      await logError("Failed to get autos for regitra lookup.", error, {
        sendToDiscord: true,
      });
      return;
    }
  }
  async updateRegitraLookup(toUpdate: updateFromRegitra["autos"]) {
    try {
      await this.convex.mutation(api.autos.updateFromRegitra, {
        autos: toUpdate,
      });
    } catch (error) {
      await logError("Failed updating regitra data.", error, {
        sendToDiscord: true,
      });
    }
  }
  async getExistingIds(listingIds: string[]) {
    try {
      return await this.convex.query(api.autos.getExistingIds, {
        ids: listingIds,
      });
    } catch (error) {
      await logError("Failed to get existing Ids.", error, {
        sendToDiscord: true,
      });
    }
    return [];
  }
}
