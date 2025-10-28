import PQueue from "p-queue";
import { env } from "../env";
import { ConvexHttpClient } from "convex/browser";
import { createBrowser, createPage } from "./browser";
import { gatherSources } from "./sources";
import { logger } from "./helpers";
import { Listing, type QueueTask } from "./types";
import { api } from "@repo/convex-db/api";

const log = logger.child({ name: "scrape" });

async function main() {
  const convex = new ConvexHttpClient(env.CONVEX_URL);
  const browser = await createBrowser();

  const sources = gatherSources();
  if (sources.length === 0) {
    log.error("No sources found");
    return;
  }

  //   for (const source of sources) {
  //     const queue = new PQueue({
  //       concurrency: source.maxConcurrency ?? env.CONCURRENCY,
  //     });
  //     const context = await browser.newContext();
  //     if (source.cookies) await context.addCookies(source.cookies);

  //     for (const seed of source.seeds) {
  //       queue
  //         .add(async () => {
  //           const page = await context.newPage();
  //           await blocker.enableBlockingInPage(page);
  //           const result = await source.parseListingPage(page, seed);

  //           for (const listing of result.listings) {
  //             const url = source.resolveListingUrl(listing);
  //             const details = await source.scrapeDetails(page, listing);
  //           }

  //           if (result.nextPageUrl) {
  //             queue.add(async () => {
  //               return await source.parseListingPage(page, result.nextPageUrl!);
  //             });
  //           }
  //           return result;
  //         })
  //         .catch((error) => {
  //           log.error(error);
  //         });
  //     }
  //     await queue.onIdle();
  //     await browser.close();
  //   }

  sources.map(async (source) => {
    const queue = new PQueue({
      concurrency: source.maxConcurrency ?? env.CONCURRENCY,
    });
    queue.on("completed", (result: QueueTask) => {
      switch (result.type) {
        case "listing":
          const existingIds = convex.query(api);
          result.result.listings.map((listing) => {});
          break;
        case "detail":
          break;
      }
    });
    const context = await browser.newContext();
    if (source.cookies) await context.addCookies(source.cookies);
    source.seeds.map(async (seed) => {
      queue.add(async () => {
        const page = await createPage(context);
        const result = await source.parseListingPage(page, seed);
        await page.close();
        return { type: "listing", result } as Listing;
      });
    });
  });
}
