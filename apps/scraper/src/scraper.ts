import PQueue from "p-queue";
import type {
  Detail,
  initialListingT,
  Listing,
  QueueTask,
  ScraperSource,
} from "./types";
import { env } from "../env";
import type { Browser, BrowserContext } from "@playwright/test";
import { createPage } from "./browser";
import {
  insertArrayOfAutosValidator,
  updateArrayOfAutosValidator,
} from "@repo/convex-db/convex/types";
import { logError } from "./error";
import { DB } from "./database";

export class Scraper {
  private queue: PQueue;
  private source: ScraperSource;
  //@ts-expect-error Context initiated on start function
  private context: BrowserContext;
  private db: DB;

  private listingsToUpdate: updateArrayOfAutosValidator["autos"] = [];
  private listingsToInsert: insertArrayOfAutosValidator["autos"] = [];

  constructor(source: ScraperSource, db: DB) {
    this.queue = new PQueue({
      concurrency: env.CONCURRENCY,
    });
    this.source = source;
    this.db = db;

    this.initializeQueue();
  }

  async start(browser: Browser) {
    await this.initializeContext(browser);
    void this.source.seeds.map((seed) => {
      this.add(async () => await this.scrapeListing(seed));
    });
    await this.queue.onIdle();
    await this.context.close();
    return {
      listingsToInsert: this.listingsToInsert,
      listingsToUpdate: this.listingsToUpdate,
    };
  }

  async initializeContext(browser: Browser) {
    this.context = await browser.newContext();
    if (this.source.cookies) await this.context.addCookies(this.source.cookies);
  }

  initializeQueue() {
    // this.queue.on("completed", async (result: QueueTask) => {
    //   switch (result.type) {
    //     case "listing":
    //       const toScrape = await this.completedListing(result.result);

    //       // this.listingsToUpdate.push(...toUpdate);

    //       await this.addAll(
    //         toScrape.map(
    //           (listing) => async () => await this.scrapeDetail(listing)
    //         )
    //       );
    //       break;
    //     case "detail":
    //       const detail = await this.completedDetail(result.result);
    //       if (detail) this.listingsToInsert.push(detail);
    //       break;
    //   }
    //   console.log("completed");
    // });
    // this.queue.on("active", async () => {
    //   console.log(`Pending: ${this.queue.pending}, Size: ${this.queue.size}`);
    // });
    this.queue.on("error", (error): void => {
      void logError("Failed in the scraper queue.", error, {
        sendToDiscord: true,
      });
    });
  }

  add(task: () => Promise<QueueTask>) {
    this.queue.add(task).catch(() => {});
  }

  async completedListing(result: Listing["result"]) {
    const listingIds: string[] = result.listings.map((listing) => listing.id);
    const existingIds = await this.db.getExistingIds(listingIds);

    const toScrape: initialListingT[] = [];
    const toUpdate: updateArrayOfAutosValidator["autos"] = [];

    for (const listing of result.listings) {
      const existing = existingIds.find(
        (existing) => existing.external_id === listing.id
      );
      if (!existing) {
        toScrape.push(listing);
        continue;
      }
      if (
        listing.price !== existing.price ||
        listing.status !== existing.status
      ) {
        toUpdate.push({
          id: existing.id,
          price: listing.price,
          price_old: existing.price,
          status: listing.status,
        });
      }
      continue;
    }

    return {
      toScrape,
      toUpdate,
      nextPageUrl: result.nextPageUrl,
    };
  }

  completedDetail(result?: Detail["result"]) {
    if (!result) return;
    return result;
  }

  async scrapeListing(seed: string): Promise<Listing> {
    const page = await createPage(this.context);
    await page.goto(seed, { waitUntil: "domcontentloaded" });
    const result = await this.source.parseListingPage(page, seed);
    await page.close();

    const { toScrape, toUpdate, nextPageUrl } =
      await this.completedListing(result);

    for (const auto of toScrape)
      this.add(async () => await this.scrapeDetail(auto));

    if (nextPageUrl)
      this.add(async () => await this.scrapeListing(nextPageUrl));

    if (toUpdate.length !== 0) this.listingsToUpdate.push(...toUpdate);

    return { type: "listing", result };
  }

  async scrapeDetail(listing: initialListingT): Promise<Detail> {
    const page = await createPage(this.context);
    await page.goto(listing.url, {
      waitUntil: "domcontentloaded",
    });
    const result = await this.source.scrapeDetails(page, listing);
    await page.close();
    const detail = this.completedDetail(result);
    if (detail) this.listingsToInsert.push(detail);
    return { type: "detail", result };
  }
}
