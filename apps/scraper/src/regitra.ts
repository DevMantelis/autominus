import type { Browser, BrowserContext } from "@playwright/test";
import PQueue from "p-queue";
import { logError } from "./error";
import { env } from "../env";
import type {
  needsRegitraLookup,
  updateFromRegitra,
} from "@repo/convex-db/convex/types";
import { delay, normalizeText } from "./helpers";
import { DB } from "./database";
import type { PlaywrightCookie } from "./types";

export class Regitra {
  private queue: PQueue;
  //@ts-expect-error Context initiated on start function
  private context: BrowserContext;
  private toUpdate: updateFromRegitra["autos"] = [];
  private db: DB;
  private cookies: PlaywrightCookie[] = [
    {
      domain: ".eregitra.lt",
      path: "/",
      name: "__cmpconsent33776",
      value: "CQaW3rAQaW3rAAfXDBLTCDFgAAAAAAAAAAigAAAAAAAA",
      httpOnly: false,
      secure: true,
      session: false,
    },
    {
      domain: "www.eregitra.lt",
      path: "/",
      name: "TS6a100eb4027",
      value:
        "08da0529f9ab20003cf19c7440450e8afc829e8a9363574843981e3e9793f73db1bcad0809443f4d082838bc8b113000b4d41d411e5afd2bec823fc6648b5c4a728f8fd2835019c7b37c876aa1ed770ce24a727048d860d3059d37952528b942",
      httpOnly: false,
      secure: false,
      session: true,
    },
    {
      domain: ".eregitra.lt",
      path: "/",
      name: "__cmpcccu33776",
      value: "aCQaZhtNgAsAUhjKjEhNQpgAkUUFgA",
      httpOnly: false,
      secure: true,
      session: false,
    },
    {
      domain: ".www.eregitra.lt",
      path: "/",
      name: "TS0194d478",
      value:
        "01f0a37145b70d63f8524fc7097aebb50335fe184a3876dbdd27c0cac3f9e2606dc4c88973fb0bcc6cdcc20d84b67bd5ebb2a35ecd",
      httpOnly: false,
      secure: false,
      session: true,
    },
  ];
  constructor(db: DB) {
    this.queue = new PQueue({ concurrency: 3 });
    this.db = db;
  }
  async start(browser: Browser) {
    const autos = await this.db.getAutosForLookup();
    if (!autos || autos.length === 0) return;

    this.context = await browser.newContext();
    await this.context.addCookies(this.cookies);

    for (const auto of autos) {
      const { id, vin, plates } = auto;
      if (!id || plates.length === 0 || !vin) continue;
      this.add(async () => await this.initiateLookup({ id, vin, plates }));
    }
    await this.queue.onIdle();
    await this.context.close();
    return this.toUpdate;
  }
  initializeQueue() {
    // this.queue.on(
    //   "completed",
    //   async (result: Awaited<ReturnType<typeof this.lookUp>>) => {
    //     this.toUpdate.push(result);
    //   }
    // );
    this.queue.on("error", (error): void => {
      void logError("Failed in regitra queue.", error, {
        sendToDiscord: true,
      });
    });
  }
  add(task: () => ReturnType<typeof this.initiateLookup>) {
    this.queue.add(task).catch(() => {});
  }
  async initiateLookup({
    id,
    plates,
    vin,
  }: Omit<needsRegitraLookup[number], "vin"> & {
    vin: string;
  }) {
    const result = await this.lookUp({ id, plates, vin });
    this.toUpdate.push(result);
  }
  async lookUp({
    id,
    plates,
    vin,
  }: Omit<needsRegitraLookup[number], "vin"> & {
    vin: string;
  }): Promise<updateFromRegitra["autos"][number]> {
    const page = await this.context.newPage();
    try {
      await page.goto(env.REGITRA_LOOKUP, {
        waitUntil: "load",
      });
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
        try {
          await page
            .locator(".MuiTableRow-root:has(td):has(th)")
            .first()
            .waitFor({ state: "visible", timeout: 5000 });
        } catch {
          continue;
        }
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
          return { ...data, plates: [plate] };
        }
      }
    } catch (error) {
      const buffer = await page.screenshot({ fullPage: true });
      await logError(
        `Failed in regitra lookup: ${id}, ${vin}, ${plates.join(" ")}. Base64: ${buffer.toString("base64")}`,
        error,
        {
          sendToDiscord: true,
        }
      );
    } finally {
      await page.close();
    }
    return { id, needs_regitra_lookup: false, plates: [] };
  }
}
