import PQueue from "p-queue";
import {
  Detail,
  initialListingT,
  Listing,
  QueueTask,
  ScraperSource,
} from "./types";
import { env } from "../env";
import { Browser, BrowserContext } from "@playwright/test";
import { createPage } from "./browser";
import { Id } from "@repo/convex-db/convex/_generated/dataModel";
import {
  insertArrayOfAutosValidator,
  updateArrayOfAutosValidator,
} from "@repo/convex-db/convex/types";
import { api } from "@repo/convex-db/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { logger } from "./helpers";

const log = logger.child({ module: "Queue" });

export class Queue {
  private queue: PQueue;
  private source: ScraperSource;
  private convex: ConvexHttpClient;
  private context: BrowserContext;

  private listingsToUpdate: updateArrayOfAutosValidator["autos"] = [];
  private listingsToInsert: insertArrayOfAutosValidator["autos"] = [];

  constructor(source: ScraperSource, convex: ConvexHttpClient) {
    this.queue = new PQueue({
      concurrency: env.CONCURRENCY,
    });
    this.source = source;
    this.convex = convex;

    this.initializeQueue();
  }

  async initializeContext(browser: Browser) {
    this.context = await browser.newContext();
    if (this.source.cookies) await this.context.addCookies(this.source.cookies);
  }

  async initializeQueue() {
    //   this.queue.on("completed", async (result: QueueTask) => {
    //     switch (result.type) {
    //       case "listing":
    //         //   await this.completedListing(result.result);
    //         console.log("Listing completed");
    //         break;
    //       case "detail":
    //         console.log("Detail completed");
    //         //   await this.completedDetail(result.result);
    //         break;
    //     }
    //   });
    // this.queue.on("active", async () => {
    //   console.log(`Pending: ${this.queue.pending}, Size: ${this.queue.size}`);
    // });
    this.queue.on("error", async (error) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await fetch(env.DISCORD_WEBHOOK_ERRORS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `Failed in the queue:\n ${errorMessage}`,
        }),
      });
    });
  }

  async start(browser: Browser) {
    await this.initializeContext(browser);
    this.source.seeds.map((seed) => this.addListing(seed));
    await this.queue.onIdle();
    await this.context.close();
    return {
      listingsToInsert: this.listingsToInsert,
      listingsToUpdate: this.listingsToUpdate,
    };
  }

  add(task: () => Promise<QueueTask>) {
    this.queue.add(task).catch(() => {});
  }

  addListing(seed: string) {
    this.add(async () => await this.scrapeListing(seed));
  }
  addDetail(listing: initialListingT) {
    this.add(async () => await this.scrapeDetail(listing));
  }

  async completedListing(
    result: Listing["result"]
  ): Promise<updateArrayOfAutosValidator["autos"]> {
    const listingIds: string[] = result.listings.map((listing) => listing.id);
    const existingIds = await this.convex.query(api.autos.getExistingIds, {
      ids: listingIds,
    });
    // if (result.nextPageUrl) {
    //   this.add(
    //     async (): Promise<Listing> =>
    //       await this.scrapeListing(result.nextPageUrl!)
    //   );
    // }
    return result.listings
      .map((listing) => {
        const existing = existingIds.find(
          (existing) => existing.external_id === listing.id
        );
        if (!existing) {
          this.add(
            async (): Promise<Detail> => await this.scrapeDetail(listing)
          );
          return;
        }
        if (
          listing.price !== existing.price ||
          listing.status !== existing.status
        ) {
          return {
            id: existing.id as Id<"autos">,
            price: listing.price,
            price_old: existing.price,
            status: listing.status,
          };
        }
        return;
      })
      .filter(
        (listing) => listing !== undefined
      ) as updateArrayOfAutosValidator["autos"];
  }

  async completedDetail(result?: Detail["result"]) {
    if (!result) return;
    return result;
  }

  async scrapeListing(seed: string): Promise<Listing> {
    const page = await createPage(this.context);
    await page.goto(seed, { waitUntil: "domcontentloaded" });
    const result = await this.source.parseListingPage(page, seed);
    await page.close();
    this.listingsToUpdate.push(...(await this.completedListing(result)));
    return { type: "listing", result };
  }

  async scrapeDetail(listing: initialListingT): Promise<Detail> {
    const page = await createPage(this.context);
    await page.goto(listing.url, {
      waitUntil: "domcontentloaded",
    });
    const result = await this.source.scrapeDetails(page, listing);
    await page.close();
    const completedDetail = await this.completedDetail(result);
    if (completedDetail) {
      this.listingsToInsert.push(completedDetail);
    }
    return { type: "detail", result };
  }
}
