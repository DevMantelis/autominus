import type { Browser, BrowserContext, Page } from "@playwright/test";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { fullLists, PlaywrightBlocker } from "@ghostery/adblocker-playwright";
import { env } from "../env";

export async function createBrowser(): Promise<Browser> {
  chromium.use(stealthPlugin());
  const browser = await chromium.launch({
    headless: env.HEADLESS,
    args: [
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-default-browser-check",
      "--no-first-run",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--mute-audio",
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gl-drawing-for-tests",
    ],
  });
  return browser;
}

export const blocker = await PlaywrightBlocker.fromLists(fetch, fullLists, {
  enableCompression: true,
});

export async function createPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  await blocker.enableBlockingInPage(page);
  return page;
}
