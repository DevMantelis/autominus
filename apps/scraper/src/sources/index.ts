import type { Page } from "@playwright/test";
import type { ScraperSource } from "../types";
import { autogidasSource } from "./autogidas";
import { autopliusSource } from "./autoplius";
import { env } from "../../env";
import { delay, getTextContent, normalizeText } from "../helpers";
import { logError } from "../error";
import { solveCaptcha } from "../captcha";
import { regitraInsuranceError, regitraVin } from "../validators";

const sources: ScraperSource[] = [autopliusSource, autogidasSource];

export function gatherSources(): ScraperSource[] {
  return sources.filter((source) => !source.disabled);
}

export async function getVinFromRegitra(
  page: Page,
  sdk: string,
  retryCount: number = 0
): Promise<{ isSdkValid: boolean; vin: string | undefined }> {
  if (sdk.length !== 8 || retryCount < 0)
    return { isSdkValid: false, vin: undefined };
  const errors: {
    notValid: boolean;
    notFound: boolean;
  } = {
    notValid: false,
    notFound: false,
  };
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
      return { isSdkValid: true, vin: value };
    }
  } catch (error) {
    let errorMessage = `Error getting vin from regitra (${sdk})`;
    errors.notValid =
      (await getTextContent(page, "p#ownerDeclCode-helper-text"))
        ?.toLowerCase()
        .includes("neteisingai") || false;
    errors.notFound =
      (await getTextContent(page, "main div.MuiAlert-message"))
        ?.toLowerCase()
        .includes("nerasta") || false;
    if (errors.notValid) {
      errorMessage += ", sdk not valid.";
      retryCount = Infinity;
    } else if (errors.notFound) {
      errorMessage += ", sdk not found.";
      retryCount = Infinity;
    } else if (retryCount === 0) {
      const buffer = await page.screenshot();
      errorMessage += buffer.toString("base64");
    }
    await logError(errorMessage, error);
  }
  if (retryCount < 3) return getVinFromRegitra(page, sdk, retryCount + 1);
  return { isSdkValid: !errors.notFound && !errors.notValid, vin: undefined };
}

export async function getVinFromRegitraApi(
  sdk: string
): Promise<{ isSdkValid: boolean; vin: string | undefined }> {
  let retry = 0;
  while (retry < 3) {
    const token = await solveCaptcha({
      type: "RecaptchaV3TaskProxyless",
      websiteURL:
        "https://www.eregitra.lt/services/vehicle-declaration/info-by-owner-declaration-code-search",
      websiteKey: "6LcQOk8cAAAAAMsa9rDuPic8nHpD_pFBGAUPvb7c",
      minScore: 0.9,
      action: "vehicleSearchByOdCode",
    });
    try {
      if (!token) throw new Error("Failed getting token from captcha.");

      const response = await fetch(
        "https://www.eregitra.lt/clients-self-service-backend/public/vehicle/info-owner-decl-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Host: "www.eregitra.lt",
            Origin: "https://www.eregitra.lt",
          },
          body: JSON.stringify({
            ownerDeclCode: sdk,
            googleRecaptchaToken: token,
          }),
        }
      );
      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const responseJson = await response.json();

      const errorData =
        await regitraInsuranceError.safeParseAsync(responseJson);
      if (errorData.success) {
        if (
          errorData.data.message
            .toLowerCase()
            .includes("actual declaration not found")
        )
          return { isSdkValid: false, vin: undefined };
        if (errorData.data.message.includes("INVALID_RECAPTCHA")) {
          throw new Error(
            `Got invalid captcha to perform vin check. Error: ${errorData.data.message}`
          );
        } else {
          throw new Error(
            `Got unknown error from regitra vin. Error: ${errorData.data.message}`
          );
        }
      }

      const data = await regitraVin.parseAsync(responseJson);
      return {
        isSdkValid: true,
        vin: data.vehicleVin,
      };
    } catch (error) {
      await logError(`Error from regitra vin (Retry: ${retry}/2).`, error, {
        sendToDiscord: true,
      });
      retry++;
    }
  }
  return { isSdkValid: true, vin: undefined };
}

export const isValidSDK = (sdk: string): boolean => {
  let isValid = true;
  if (!/^[AaCcEeFfHhKkMmNnPpRrTt]{8}$/.test(sdk)) {
    isValid = false;
  }
  return isValid;
};

export const isValidVin = (vin: string): boolean => {
  let isValid = true;
  if (!/^[A-Za-z0-9]{17}$/.test(vin)) {
    isValid = false;
  }
  return isValid;
};
