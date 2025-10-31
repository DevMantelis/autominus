import type { Locator, Page } from "@playwright/test";
import pino from "pino";

export async function getTextContent(locator: Locator | Page, path: string) {
  const loc = locator.locator(path);
  if ((await loc.count()) === 0) return undefined;
  const text = await loc.textContent();
  return normalizeText(text);
}

export async function getNumberContent(locator: Locator | Page, path: string) {
  const loc = locator.locator(path);
  if (!(await loc.isVisible())) return undefined;
  const text = await loc.textContent();
  return normalizeNumbers(text);
}

export function normalizeText(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  return raw
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeNumbers(raw?: string | null): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .replace(/\u00A0/g, "")
    .replace(/[^0-9.,-]/g, "")
    .replace(/,/g, ".");
  const match = cleaned.match(/-?\d+(?:.\d+)?/);
  const number = match ? match[0] : undefined;
  if (!number) return undefined;
  return parseInt(number);
}

export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
