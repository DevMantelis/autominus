import type { Page } from "@playwright/test";
import type { ScraperSource } from "../types";
import { autogidasSource } from "./autogidas";
import { autopliusSource } from "./autoplius";
import { env } from "../../env";
import { delay, normalizeText } from "../helpers";
import { logError } from "../error";

const sources: ScraperSource[] = [autopliusSource, autogidasSource];

export function gatherSources(): ScraperSource[] {
  return sources.filter((source) => !source.disabled);
}

export async function getVinFromRegitra(
  page: Page,
  sdk: string,
  retryCount: number
): Promise<string | undefined> {
  if (sdk.length !== 8 || retryCount < 0) return undefined;
  try {
    await page.goto(env.REGITRA_FIND_VIN, { waitUntil: "load" });
    await delay(1000);
    await page.locator("input#ownerDeclCode").fill(sdk);
    await delay(2000);
    await page.locator("footer").scrollIntoViewIfNeeded();
    await delay(500);
    await page.getByRole("button", { exact: true, name: "Ieškoti" }).click();
    await page
      .locator(".MuiTableRow-root:has(td):has(th)")
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
    const tableRows = await page
      .locator(".MuiTableRow-root:has(td):has(th)")
      .all();
    await delay(5000);
    for (const row of tableRows) {
      const label = normalizeText(
        await row.locator("th").textContent()
      )?.toLowerCase();
      const value = normalizeText(await row.locator("td").textContent());
      if (label !== "Identifikavimo numeris".toLowerCase()) continue;
      return value;
    }
  } catch (error) {
    let errorMessage = `Error getting vin from regitra (${sdk})`;
    try {
      const wrongSDK = normalizeText(
        await page.locator("p#ownerDeclCode-helper-text").textContent()
      )?.toLowerCase();
      if (wrongSDK?.includes("neteisingai")) errorMessage += ", sdk not valid.";
    } finally {
      const buffer = await page.screenshot();
      await logError(
        errorMessage + ` Base64: ${buffer.toString("base64")}`,
        error
      );
      retryCount = Infinity;
    }
    if (retryCount < 3) return getVinFromRegitra(page, sdk, retryCount + 1);
  }
  return undefined;
}
