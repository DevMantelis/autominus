import { env } from "../env";
import { ConvexHttpClient } from "convex/browser";
import { createBrowser } from "./browser";
import { gatherSources } from "./sources";
import { delay, logger, normalizeText } from "./helpers";
import { Queue } from "./queue";
import { api } from "@repo/convex-db/convex/_generated/api";
import {
  insertArrayOfAutosValidator,
  needsRegitraLookup,
  updateArrayOfAutosValidator,
  updateFromRegitra,
} from "@repo/convex-db/convex/types";
import { Browser, BrowserContext } from "@playwright/test";
import PQueue from "p-queue";

const convex = new ConvexHttpClient(env.CONVEX_URL);

async function main() {
  const browser = await createBrowser();
  const sources = gatherSources();

  await Promise.allSettled(
    sources.map(async (source) => {
      const queue = new Queue(source, convex);
      const { listingsToInsert, listingsToUpdate } = await queue.start(browser);
      await insertAutos(listingsToInsert);
      await updateAutos(listingsToUpdate);
    })
  );

  const autosForLookup = await convex.query(api.autos.needsRegitraLookup);
  await regitraLookup(autosForLookup, browser);
  await browser.close();
}

async function insertAutos(
  listingsToInsert: insertArrayOfAutosValidator["autos"]
) {
  if (listingsToInsert.length === 0) return;

  try {
    await convex.mutation(api.autos.insertAutos, {
      autos: listingsToInsert,
    });
    logger.info(`Inserted ${listingsToInsert.length} listings.`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await fetch(env.DISCORD_WEBHOOK_ERRORS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Failed inserting autos:\n ${errorMessage}`,
      }),
    });

    logger.error(
      {
        error: errorMessage,
      },
      "Error inserting autos."
    );
  }
}

async function updateAutos(
  listingsToUpdate: updateArrayOfAutosValidator["autos"]
) {
  if (listingsToUpdate.length === 0) return;

  try {
    await convex.mutation(api.autos.updateAutos, {
      autos: listingsToUpdate,
    });
    logger.info(`Updated ${listingsToUpdate.length} listings.`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      {
        error: errorMessage,
      },
      "Error updating autos."
    );
    await fetch(env.DISCORD_WEBHOOK_ERRORS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Failed updating autos:\n ${errorMessage}`,
      }),
    });
  }
}

async function regitraLookup(autos: needsRegitraLookup, browser: Browser) {
  if (autos.length === 0) return;
  const context = await browser.newContext();
  const queue = new PQueue({ concurrency: 3 });
  queue.on("error", async (error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await fetch(env.DISCORD_WEBHOOK_ERRORS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Failed in the regitra queue:\n ${errorMessage}`,
      }),
    });
  });

  const toUpdate: updateFromRegitra["autos"] = [];
  for (const auto of autos) {
    await scrapeRegitraLookup({ ...auto, context, queue, toUpdate });
  }
  await queue.onIdle();
  try {
    await convex.mutation(api.autos.updateFromRegitra, {
      autos: toUpdate,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await fetch(env.DISCORD_WEBHOOK_ERRORS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Failed updating regitra data:\n ${errorMessage}`,
      }),
    });
  }
}

async function scrapeRegitraLookup({
  id,
  vin,
  plates,
  queue,
  context,
  toUpdate,
}: needsRegitraLookup[number] & {
  queue: PQueue;
  context: BrowserContext;
  toUpdate: updateFromRegitra["autos"];
}) {
  if (!id || plates.length === 0 || !vin) return;
  queue
    .add(async () => {
      const page = await context.newPage();
      await page.goto(env.REGITRA_LOOKUP, { waitUntil: "domcontentloaded" });
      for (const plate of plates) {
        const data: updateFromRegitra["autos"][number] = {
          needs_regitra_lookup: false,
          id,
        };
        await delay(1000);
        await page.locator("input#vin").first().fill("");
        await page.locator("input#vin").first().fill(vin);
        await delay(500);
        await page.locator("input#plateNo").first().fill("");
        await page.locator("input#plateNo").first().fill(plate);
        await delay(500);
        const checkBoxes = await page.getByRole("checkbox").all();
        for (const checkBox of checkBoxes) {
          await checkBox.check();
          await delay(500);
        }
        await page.locator("footer").scrollIntoViewIfNeeded();
        await delay(500);
        await page
          .getByRole("button", { exact: true, name: "Ieškoti" })
          .click();
        await page
          .locator(".MuiTableRow-root:has(td):has(th)")
          .first()
          .waitFor({ state: "visible", timeout: 5000 });
        const tableRows = await page
          .locator(".MuiTableRow-root:has(td):has(th)")
          .all();
        for (const row of tableRows) {
          const label = normalizeText(
            await row.locator("th").textContent()
          )?.toLowerCase();
          const value = normalizeText(
            await row.locator("td").textContent()
          )?.toLowerCase();
          if (!label || !value) continue;

          if (label === "Dalyvavimas viešajame eisme".toLowerCase())
            data.allowed_to_drive = value === "Leidžiamas".toLowerCase();

          if (
            label === "Techninės apžiūros galiojimo pabaigos data".toLowerCase()
          ) {
            const splitted = value.split("-") as [string, string, string];
            data.technical_inspection_year = Number(splitted.at(0));
            data.technical_inspection_month = Number(splitted.at(1));
            data.technical_inspection_day = Number(splitted.at(2));
          }

          if (label === "Draudimas".toLowerCase())
            data.insurance = value === "Galioja".toLowerCase();

          if (label === "Transporto priemonė".toLowerCase())
            data.wanted_by_police = !(value === "Neieškoma".toLowerCase());
        }
        if (
          data.allowed_to_drive !== undefined ||
          data.technical_inspection_year !== undefined ||
          data.insurance !== undefined ||
          data.wanted_by_police !== undefined
        ) {
          toUpdate.push({ ...data, plates: [plate] });
          break;
        }
      }
      if (!toUpdate.find((updated) => updated.id === id))
        toUpdate.push({ id, needs_regitra_lookup: false });

      page.close();
    })
    .catch(() => {});
}

main().catch(async (error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  await fetch(env.DISCORD_WEBHOOK_ERRORS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: `Failed in the regitra queue:\n ${errorMessage}`,
    }),
  });

  logger.error(
    {
      error: errorMessage,
    },
    "Error from main function."
  );
});
