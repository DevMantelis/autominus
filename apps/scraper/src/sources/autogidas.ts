import type { Locator, Page } from "@playwright/test";
import { getNumberContent, getTextContent, logger } from "../helpers";
import {
  listingStatus,
  type AutoInput,
  type ListingPageResult,
  type ScraperSource,
  type initialListingT,
} from "../types";
import { getPlates } from "../get_plates";

const log = logger.child({ source: "autogidas" });

const AUTOGIDAS_BASE_URL = "https://autogidas.lt/skelbimai/automobiliai/";
const AUTOGIDAS_LISTING_URL = "https://autogidas.lt/skelbimas";
const AUTOGIDAS_QUERY: Record<string, string> = {
  f_216: "2000",
  f_60: "729",
};

const AUTOGIDAS_COOKIES = [
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "identifier_user",
    value: "25413d890f9d3834cbc362e835fff4aa",
    httpOnly: true,
  },
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "ag_remember_token",
    value: "Bmt6E3i29QpCy8RWRVHTh5EoFisgKJ1KwiVkxM0GwF70GVuTUP46ubxK8ADo",
    httpOnly: true,
  },
  {
    domain: ".autogidas.lt",
    path: "/",
    name: "PHPSESSID",
    value: "7b7c800a5d7c1d40b67159339d38ab66",
    session: true,
  },
] as const;

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
  // vin: ".check-vin",
  // vin_father: '#checkVin[data-checked="true"]',
} as const;

function buildSeedUrl(): string {
  const params = new URLSearchParams(AUTOGIDAS_QUERY).toString();
  return `${AUTOGIDAS_BASE_URL}?${params}`;
}

async function parseListingPage(
  page: Page,
  currentUrl: string
): Promise<ListingPageResult> {
  const listings = await page.locator(listingLocators.listings).all();
  log.info({ currentUrl, count: listings.length }, "Found listings");

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
): Promise<AutoInput[number] | null> {
  log.info({ url: listing.url }, "Scraping listing");

  await page.goto(listing.url, { waitUntil: "domcontentloaded" });

  const description = await getTextContent(page, detailLocators.description);
  const number = await getTextContent(page, detailLocators.number);
  const mileage = await getTextContent(page, detailLocators.mileage);
  const first_registration_year = await getTextContent(
    page,
    detailLocators.first_registration_year
  );
  const fuel_type = await getTextContent(page, detailLocators.fuel_type);
  const gearbox = await getTextContent(page, detailLocators.gearbox);
  const engine = await getTextContent(page, detailLocators.engine);
  const location =
    (await getTextContent(page, detailLocators.location_listing)) ||
    (await getTextContent(page, detailLocators.location_user));

  const auto: AutoInput[number]["auto"] = {
    id: listing.id,
    url: listing.url,
    source: "autogidas",
    price: listing.price,
    description,
    title: listing.title,
    status: listing.status,
    initial: false,
    mileage,
    first_registration_year,
    fuel_type,
    gearbox,
    engine,
    number,
    location,
  };

  const params = await page.locator(detailLocators.params).all();
  for (const param of params) {
    const key = await getTextContent(param, detailLocators.params_label);
    const value = await getTextContent(param, detailLocators.params_value);
    if (!key || !value) continue;

    switch (key) {
      case paramsDescription.technical_inspection:
        auto.technical_inspection = value;
        break;
      case paramsDescription.drive_wheels:
        auto.drive_wheels = value;
        break;
      case paramsDescription.defects:
        auto.defects = value;
        break;
      case paramsDescription.body_type:
        auto.body_type = value;
        break;
      case paramsDescription.color:
        auto.color = value;
        break;
      case paramsDescription.doors:
        auto.doors = value;
        break;
      case paramsDescription.gearbox:
        auto.gearbox = value;
        break;
      case paramsDescription.seats:
        auto.seats = value;
        break;
      case paramsDescription.sdk:
        if (value.length === 8 && !value.toLowerCase().includes("kodas")) {
          auto.sdk = value;
        }
        break;
      case paramsDescription.vin:
        // auto.vin = await getVin(param);
        break;
      case paramsDescription.euro_standard:
        auto.euro_standard = value;
        break;
      case paramsDescription.first_registration_year_country:
        auto.first_registration_year_country = value;
        break;
      case paramsDescription.wheel_diameter:
        auto.wheel_diameter = value;
        break;
      case paramsDescription.co2_emission:
        auto.co2_emission = value;
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

  // log.info({ images: images.length }, "Listing processed");

  const plates = await getPlates(images);
  auto.plates = plates;

  return {
    auto,
    images,
  };
}

async function getVin(locator: Locator) {
  // Vin reveal flow currently disabled due to frequent blocks.
  // Placeholder for future improvements.
  // void locator;
  return undefined;
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
