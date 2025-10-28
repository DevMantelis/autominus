import type { Page } from "@playwright/test";
import type {
  insertAutoArgs,
  updateAutoArgs,
} from "@repo/convex-db/convex/autos";
import type { Infer } from "convex/values";

export type initialListingT = {
  url: string;
  id: string;
  price: number;
  price_old?: number;
  status: (typeof listingStatus)[keyof typeof listingStatus];
  title: string;
};

export const listingStatus = {
  active: "active",
  reserved: "reserved",
  sold: "sold",
} as const;

export type AutoInput = Infer<typeof insertAutoArgs>;
export type UpdateAutoInput = Infer<typeof updateAutoArgs>;

export type PlaywrightCookie = {
  domain: string;
  path: string;
  name: string;
  value: string;
  httpOnly?: boolean;
  secure?: boolean;
  session?: boolean;
};

export interface ListingPageResult {
  listings: initialListingT[];
  nextPageUrl?: string;
}

export interface ScraperSource {
  name: string;
  host: string;
  seeds: string[];
  cookies?: PlaywrightCookie[];
  maxConcurrency?: number;
  disabled?: boolean;
  parseListingPage: (
    page: Page,
    currentUrl: string
  ) => Promise<ListingPageResult>;
  resolveListingUrl: (listing: initialListingT) => string;
  scrapeDetails: (
    page: Page,
    listing: initialListingT
  ) => Promise<AutoInput[number] | null>;
  getVinFromExternalPage?: (
    page: Page,
    url: string
  ) => Promise<string | undefined>;
}

export type Listing = {
  type: "listing";
  result: ListingPageResult;
};

export type Detail = {
  type: "detail";
  result: AutoInput[number] | null;
};

export type QueueTask = Listing | Detail;
