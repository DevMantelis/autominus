import { env } from "../env";
import { ConvexHttpClient } from "convex/browser";
import { createBrowser } from "./browser";
import { gatherSources } from "./sources";
import { Scraper } from "./scraper";
import { logError } from "./error";
import { DB } from "./database";
import { Regitra } from "./regitra";

const convex = new ConvexHttpClient(env.CONVEX_URL);

async function main() {
  const browser = await createBrowser();
  const sources = gatherSources();
  const db = new DB(convex);
  try {
    await Promise.allSettled(
      sources.map(async (source) => {
        const queue = new Scraper(source, db);
        const { listingsToInsert, listingsToUpdate } =
          await queue.start(browser);
        await db.insertAutos(listingsToInsert);
        await db.updateAutos(listingsToUpdate);
      })
    );

    const regitra = new Regitra(db);
    const toUpdate = await regitra.start();
    if (toUpdate) await db.updateRegitraLookup(toUpdate);
  } catch (error) {
    await logError("Failed in main", error, {
      sendToDiscord: true,
    });
  } finally {
    // await browser.close();
  }
}

main().catch(async (error) => {
  await logError("Failed in start.", error, { sendToDiscord: true });
});
