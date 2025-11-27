import type { Page } from "@playwright/test";
import { getNumberContent, getTextContent, logger } from "../helpers";
import {
  type PlaywrightCookie,
  listingStatus,
  type ListingPageResult,
  type ScraperSource,
  type initialListingT,
} from "../types";
import {
  insertAutoValidator,
  type fuelType,
} from "@repo/convex-db/convex/types";
import { getVinFromRegitra, getVinFromRegitraApi, isValidSDK } from ".";
import moment from "moment";

const log = logger.child({ source: "autogidas" });

const AUTOGIDAS_BASE_URL = "https://autogidas.lt/skelbimai/automobiliai/";
const AUTOGIDAS_LISTING_URL = "https://autogidas.lt/skelbimas";
const AUTOGIDAS_QUERY: Record<string, string> = {
  f_216: "2000",
  f_60: "6315",
  s: "1922084038",
};

const AUTOGIDAS_COOKIES: PlaywrightCookie[] = [
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "OptanonAlertBoxClosed",
    value: "2025-10-31T14:58:33.024Z",
    httpOnly: false,
    secure: true,
    session: false,
  },
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "_fbp",
    value: "fb.1.1761922708401.976207054364557103",
    httpOnly: false,
    secure: false,
    session: false,
  },
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "_pctx",
    value:
      "%7Bu%7DN4IgrgzgpgThIC4B2YA2qA05owMoBcBDfSREQpAeyRCwgEt8oBJAEzIEYOAmAdm%2B4A2AMwBOABzCALNykAGAKzDuckAF8gA",
    httpOnly: false,
    secure: true,
    session: false,
  },
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "_pcid",
    value: "%7B%22browserId%22%3A%22mhezaigqgt45bfzc%22%7D",
    httpOnly: false,
    secure: true,
    session: false,
  },
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "_sharedID",
    value: "9ab8bb6a-f012-442a-91fe-2b36c1801033",
    httpOnly: false,
    secure: false,
    session: false,
  },
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "_sharedID_cst",
    value: "aixuLGMsdQ%3D%3D",
    httpOnly: false,
    secure: false,
    session: false,
  },
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "cX_G",
    value: "cx%3Ajz4lvcu7l69v20jk475xprvpp%3A2hmu6i3lxlkp6",
    httpOnly: false,
    secure: true,
    session: false,
  },
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "cX_P",
    value: "mhezaigqgt45bfzc",
    httpOnly: false,
    secure: true,
    session: false,
  },
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "eupubconsent-v2",
    value:
      "CQaJr7AQaJr7AAcABBLTCCFgAAAAAEPgAChQLstR_G__bWlr-bb3aftkeYxP9_hr7sQxBgbJk24FzLvW7JwXx2E5NAzatqIKmRIAu3TBIQNlHJDURVCgKIgVryDMaEyUoTNKJ6BkiFMRI2NYCFxvm4tjWQCY5vr99lc1mB-N7dr82dzyy6hHn3a5_2S1WJCdIYetDfv8ZBKT-9IEd_x8v4v4_F7pE2-eS1n_pGvp6j9-YnM_dBmxt-bSffzPn__rl_e7X_vd_n37v94XH77v____f_-7___2C7AAJhoVEEZZECAQKBhBAgAUFYQAUCAIAAEgaICAEwYFOQMAF1hMgBACgAGCAEAAIMAAQAACQAIRABQAQCAACAQKAAMACAICABgYAAwAWIgEAAIDoGKYEEAgWACRmVQaYEoACQQEtlQgkAwIK4QhFngEECImCgAABAAKAgAAeCwEJJASsSCALiCaAAAgAACiBAgRSFmAIKgzRaC8CTqMjTAMHzBMkp0GQBMEZGSbEJvwmHikKIUEOQGxSzAHAAAA.YAAACHwAAAAA",
    httpOnly: false,
    secure: true,
    session: false,
  },
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "OptanonConsent",
    value:
      "landingPath=NotLandingPage&datestamp=Fri+Oct+31+2025+16%3A58%3A33+GMT%2B0200+(Eastern+European+Standard+Time)&version=202410.1.0&groups=C0003%3A0%2CC0001%3A1%2CC0004%3A0%2CC0002%3A0%2CV2STACK42%3A0&hosts=&consentId=ffc974df-566c-4f3f-9ff4-e7f35e517f2f&interactionCount=1&isAnonUser=1&intType=6",
    httpOnly: false,
    secure: true,
    session: false,
  },
];

const paramsDescription = {
  technical_inspection: "TA iki",
  drive_wheels: "Varantieji ratai",
  defects: "Defektai",
  body_type: "Kėbulo tipas",
  color: "Spalva",
  doors: "Durų skaičius",
  gearbox: "Pavarų skaičius",
  seats: "Sėdimų vietų skaičius",
  sdk: "Savininko deklaravimo kodas",
  vin: "VIN kodas",
  euro_standard: "Euro standartas",
  first_registration_year_country: "Pirmosios registracijos šalis",
  wheel_diameter: "Ratlankiai",
  co2_emission: "CO2 emisija, g/km",
} as const;

const listingLocators = {
  listings:
    "div.ads-container > article.list-item-new > div.article-item > a.item-link",
  price: ".item-price",
  status_sold: "div.sold-item",
  title: ".item-title",
  next: ".page.page-next",
} as const;

const detailLocators = {
  params: ".view-section > .list-striped > .list-striped-item",
  params_label: ".list-striped-item-title",
  params_value: ".list-striped-item-value",
  description: ".view-description > .view-section-content .show-more-content",
  number: '[onclick*="captureAdPhone"][data-copy]:not([class*=rel])',
  mileage: ".view-main-info > .params > .param-mileage > div > b",
  first_registration_year: ".view-main-info > .params > .param-year > div > b",
  fuel_type: ".view-main-info > .params > .param-fuel-type > div > b",
  gearbox: ".view-main-info > .params > .param-gearbox > div > b",
  engine: ".view-main-info > .params > .param-engine > div > b",
  location_user: ".user-location",
  location_listing: ".sticky-location",
} as const;

function buildSeedUrl(): string {
  const params = new URLSearchParams(AUTOGIDAS_QUERY).toString();
  return `${AUTOGIDAS_BASE_URL}?${params}`;
}

async function parseListingPage(
  page: Page,
  currentUrl: string,
  retry: number = 0
): Promise<ListingPageResult> {
  const listings = await page.locator(listingLocators.listings).all();
  log.info({ currentUrl, count: listings.length }, "Found potential listings");
  if (listings.length === 0) {
    if (retry < 2) return parseListingPage(page, currentUrl, retry + 1);
    else {
      const buffer = await page.screenshot();
      throw new Error(
        `Failed to scrape listings, got 0. Base64: ${buffer.toString("base64")}`
      );
    }
  }

  const items: ListingPageResult["listings"] = [];
  for (const listing of listings) {
    const url = await listing.getAttribute("href");
    const id = url?.split("-").pop()?.split(".")[0];
    if (!url || !id) {
      log.debug("Listing without url or id, skipping");
      continue;
    }

    const price = await getNumberContent(listing, listingLocators.price);
    if (!price) {
      log.debug({ url }, "Listing without price, skipping");
      continue;
    }

    const isSold = await listing
      .locator(listingLocators.status_sold)
      .isVisible();
    const title = await getTextContent(listing, listingLocators.title);
    if (!title) {
      log.debug({ url }, "Listing without title, skipping");
      continue;
    }

    const absoluteUrl = new URL(url, AUTOGIDAS_LISTING_URL).toString();
    items.push({
      url: absoluteUrl,
      id,
      price,
      status: isSold ? listingStatus.sold : listingStatus.active,
      title,
    });
  }

  let nextPageUrl: string | undefined;
  const nextLocator = page.locator(listingLocators.next);
  if ((await nextLocator.count()) > 0) {
    const href = await nextLocator.first().getAttribute("href");
    if (href) {
      nextPageUrl = new URL(href, currentUrl).toString();
    }
  }

  return {
    listings: items,
    nextPageUrl,
  };
}

async function scrapeDetails(
  page: Page,
  listing: initialListingT
): Promise<insertAutoValidator | null> {
  log.info({ url: listing.url }, "Scraping listing");

  const description = await getTextContent(page, detailLocators.description);
  const number = await getTextContent(page, detailLocators.number);
  const mileage = await getTextContent(page, detailLocators.mileage);
  const registration = await getRegistrationYearAndMonth(page);
  const fuel_type = await getTextContent(page, detailLocators.fuel_type);
  const gearbox = await getTextContent(page, detailLocators.gearbox);
  const engine = await getTextContent(page, detailLocators.engine);
  const location =
    (await getTextContent(page, detailLocators.location_listing)) ||
    (await getTextContent(page, detailLocators.location_user));

  const autoParams: Pick<
    insertAutoValidator,
    | "technical_inspection_date"
    | "drive_wheels"
    | "defects"
    | "body_type"
    | "color"
    | "doors"
    | "gearbox"
    | "seats"
    | "sdk"
    | "euro_standard"
    | "first_registration_year_country"
    | "wheel_diameter"
    | "co2_emission"
  > = {};

  const params = await page.locator(detailLocators.params).all();
  for (const param of params) {
    const key = await getTextContent(param, detailLocators.params_label);
    const value = await getTextContent(param, detailLocators.params_value);
    if (!key || !value) continue;

    switch (key) {
      case paramsDescription.technical_inspection: {
        const splitted = value.split("-");
        if (
          !isFinite(Number(splitted.at(0))) ||
          Number(splitted.at(0)).toString().length !== 4
        )
          break;
        const year = Number(splitted.at(0));
        const month = isFinite(Number(splitted.at(1)))
          ? Number(splitted.at(1)) - 1
          : 0;
        autoParams.technical_inspection_date = moment({
          year,
          month,
          day: 1,
        }).valueOf();

        break;
      }
      case paramsDescription.drive_wheels:
        autoParams.drive_wheels = value;
        break;
      case paramsDescription.defects:
        autoParams.defects = value;
        break;
      case paramsDescription.body_type:
        autoParams.body_type = value;
        break;
      case paramsDescription.color:
        autoParams.color = value;
        break;
      case paramsDescription.doors:
        autoParams.doors = value;
        break;
      case paramsDescription.gearbox:
        autoParams.gearbox = value;
        break;
      case paramsDescription.seats:
        autoParams.seats = value;
        break;
      case paramsDescription.sdk:
        if (isValidSDK(value)) {
          autoParams.sdk = value;
        }
        break;
      // case paramsDescription.vin:
      // auto.vin = await getVin(param);
      // break;
      case paramsDescription.euro_standard:
        autoParams.euro_standard = value;
        break;
      case paramsDescription.first_registration_year_country:
        autoParams.first_registration_year_country = value;
        break;
      case paramsDescription.wheel_diameter:
        autoParams.wheel_diameter = value;
        break;
      case paramsDescription.co2_emission:
        autoParams.co2_emission = value;
        break;
      default:
        log.debug({ key }, "Unknown parameter");
        break;
    }
  }

  const allFiles = await page
    .locator("script[type='text/javascript']:not([src])")
    .all();
  const images: string[] = [];

  for (const script of allFiles) {
    const content = await script.textContent();
    if (!content) continue;

    // Regex: gallery.addImage('URL', 'image', ...)
    const matches = [
      ...content.matchAll(/gallery\.addImage\(\s*'([^']+)'\s*,\s*'image'\s*,/g),
    ];
    for (const match of matches) {
      if (!match[1]) continue;
      images.push(match[1]);
    }
  }

  let vin: string | undefined;
  if (autoParams.sdk) {
    const sdkResult = await getVinFromRegitra(page, autoParams.sdk);
    // vin = sdkResult.vin;
    // if (!sdkResult.isSdkValid) autoParams.sdk = undefined;
    if (sdkResult.isSdkValid && !sdkResult.vin) {
      const sdkResult2 = await getVinFromRegitraApi(autoParams.sdk);
      vin = sdkResult2.vin;
      if (!sdkResult2.isSdkValid) autoParams.sdk = undefined;
    } else {
      vin = sdkResult.vin;
      if (!sdkResult.isSdkValid) autoParams.sdk = undefined;
    }
  }

  const fuel: NonNullable<fuelType["fuel_type"]> = [];
  if (fuel_type?.toLowerCase().includes("benzinas")) fuel.push("Petrol");
  if (fuel_type?.toLowerCase().includes("dyzelinas")) fuel.push("Diesel");
  if (fuel_type?.toLowerCase().includes("dujos")) fuel.push("Gas");
  if (fuel_type?.toLowerCase().includes("elektra")) fuel.push("Electric");

  const auto: insertAutoValidator = {
    id: listing.id,
    url: listing.url,
    source: "autogidas",
    price: listing.price,
    description,
    title: listing.title,
    status: listing.status,
    mileage,
    first_registration_year: registration?.first_registration_year,
    first_registration_month: registration?.first_registration_month,
    fuel_type: fuel.length === 0 ? undefined : fuel,
    gearbox,
    engine,
    number,
    location,
    plates: [],
    images,
    vin,
    needs_regitra_lookup: false,
    ...autoParams,
  };

  log.info(
    { url: listing.url, images: images.length, sdk: auto.sdk, vin: auto.vin },
    "Listing processed"
  );

  return auto;
}

async function getRegistrationYearAndMonth(page: Page) {
  const value = await getTextContent(
    page,
    detailLocators.first_registration_year
  );
  if (!value) return;
  const splitted = value.split("-");
  if (
    !isFinite(Number(splitted.at(0))) ||
    Number(splitted.at(0)).toString().length !== 4
  )
    return;
  const first_registration_year = Number(splitted.at(0));
  const first_registration_month = isFinite(Number(splitted.at(1)))
    ? Number(splitted.at(1))
    : 1;
  return { first_registration_year, first_registration_month };
}

export const autogidasSource: ScraperSource = {
  name: "autogidas",
  host: new URL(AUTOGIDAS_BASE_URL).hostname,
  seeds: [buildSeedUrl()],
  cookies: AUTOGIDAS_COOKIES.map((cookie) => ({ ...cookie })),
  parseListingPage,
  resolveListingUrl: (listing) => listing.url,
  scrapeDetails,
  // disabled: true,
};
