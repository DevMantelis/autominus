import type { Locator, Page } from "@playwright/test";
import {
  getNumberContent,
  getTextContent,
  logger,
  normalizeNumbers,
  normalizeText,
} from "../helpers";
import {
  listingStatus,
  type AutoInput,
  type ListingPageResult,
  type ScraperSource,
  type initialListingT,
} from "../types";
import { getPlates } from "../get_plates";

const log = logger.child({ source: "autoplius" });

const AUTOPLIUS_BASE_URL =
  "https://autoplius.lt/skelbimai/naudoti-automobiliai";

const AUTOPLIUS_QUERY: Record<string, string> = {
  category_id: "2",
  older_not: "1",
  sell_price_to: "2000",
  slist: "2696778400",
  order_by: "3",
  order_direction: "DESC",
};

const AUTOPLIUS_COOKIES = [
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "FCCDCF",
    value:
      "%5Bnull%2Cnull%2Cnull%2C%5B%22CQXRZAAQXRZAAEsACBLTB7FgAAAAAEPgABaYAAAUBQD-F2Y2EKFEXCuQUYIYBCugCAAxYhgAA0CBgAAGCQgQAgFJIIkCAEAIEAAEAAAQEgCAABQEBAAAIAAAAAqAACIABgAQCAQQIABAAAAhIAAAAAAEQAAIgEAAAAIIIgBABAAAAQAkDAAAAAAAAECAAAAACAAAAAAAAAAAAAAAEABgIABAAABEAAAAAAAACCQIAAAAAAAAAAAAAAAAAAAAAAEAAA.YAAACFgAAAA%22%2C%222~~dv.61.89.122.184.196.230.314.442.445.494.550.576.827.1029.1033.1046.1047.1051.1097.1126.1166.1301.1342.1415.1725.1765.1942.1958.1987.2068.2072.2074.2107.2213.2219.2223.2224.2328.2331.2387.2416.2501.2567.2568.2575.2657.2686.2778.2869.2878.2908.2920.2963.3005.3023.3100.3126.3219.3234.3235.3253.3309.3731.6931.8931.13731.15731%22%2C%22BBCCBC33-F606-48DF-B3C9-756434BAC3E7%22%5D%5D",
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "receive-cookie-deprecation",
    value: "1",
  },
  {
    domain: ".autoplius.lt",
    httpOnly: true,
    name: "__cf_bm",
    path: "/",
    secure: true,
    value:
      "1FZ4eJm6zGEFq2vDBlslakYYnn7OJerMB59ZsKFMrwQ-1757065171-1.0.1.1-NeNiTmBrqaYV_w3a_9CKJ9JmrUorH5_zweUSnQM_gT7TLlIN4j4j.XcYPTUOoI2ds6OuDq0xb66Mb1t_8xkxsFNOrCNC.J.NMLW3oKGSTyk",
  },
  {
    domain: ".autoplius.lt",
    httpOnly: true,
    name: "ap_messenger_push",
    path: "/",
    secure: true,
    value: "1",
  },
  {
    domain: ".autoplius.lt",
    httpOnly: true,
    name: "visitor_segment",
    path: "/",
    secure: true,
    value: "117",
  },
  {
    domain: ".autoplius.lt",
    httpOnly: true,
    name: "ap_remember_me",
    path: "/",
    secure: true,
    value: "0de03c0f784af4dff40d0358a6fadc74",
  },
  {
    domain: ".autoplius.lt",
    httpOnly: false,
    name: "banners_139",
    path: "/",
    secure: true,
    value: "eNqzNjc1M9UxNDc1NzQwNTQw0tEBACMKA5Q=",
  },
  {
    domain: ".autoplius.lt",
    httpOnly: true,
    name: "PHPSESSID",
    path: "/",
    secure: true,
    value: "14eeb7rkskv8fgt4mqclv4b1r2",
  },
  {
    domain: "autoplius.lt",
    httpOnly: false,
    name: "wide-window",
    path: "/",
    secure: false,
    value: "0",
  },
  {
    domain: ".autoplius.lt",
    httpOnly: false,
    name: "z",
    path: "/",
    secure: true,
    value: "175701838368b9f90f80c63",
  },
] as const;

const listingLocators = {
  listings: ".auto-lists > .announcement-item",
  price: ".pricing-container .announcement-pricing-info > strong",
  price_changed_down: ".pricing-container strong.price-changed-down",
  promo_price: ".pricing-info span.promo-price",
  price_old: ".pricing-container span.strike",
  status_sold: "div.badge-sold",
  status_reserved: "div.badge-reservation",
  title: ".announcement-title",
  next: "a.next[href]",
} as const;

const detailLocators = {
  description: ".announcement-description",
  number: ".seller-phone-number",
  location: ".owner-location",
  first_image: "div.announcement-media-gallery > .thumbnail > img[src]",
  params: "div:not([class]) > .parameter-row",
  params_label: "div.parameter-label",
  params_value: "div.parameter-value",
  media_gallery_thumbnails: "div.media-gallery-thumbnails > .thumbnail",
  media_gallery_items_container:
    "div.media-gallery-items-container > div.photo-container > .photo > img",
  vin: "div.vin-parameter.js-show-vin",
  vin_revealed: "div.vin-parameter.js-show-vin.revealed",
  vin_autoistorija: "a[href*='autoistorija.lt/summary']",
} as const;

const paramsDescription = {
  first_registration_year: "Pirma registracija",
  mileage: "Rida",
  engine: "Variklis",
  drive_wheels: "Varantieji ratai",
  fuel_type: "Kuro tipas",
  body_type: "Kėbulo tipas",
  doors: "Durų skaičius",
  gearbox: "Pavarų dėžė",
  color: "Spalva",
  mass: "Nuosava masė, kg",
  seats: "Sėdimų vietų skaičius",
  defects: "Defektai",
  technical_inspection: "Tech. apžiūra iki",
  co2_emission: "CO₂ emisija, g/km",
  emission_tax: "Taršos mokestis",
  euro_standard: "Euro standartas",
  first_registration_year_country: "Pirmosios registracijos šalis",
  wheel_diameter: "Ratlankių skersmuo",
  climate_control: "Klimato valdymas",
  vin: "Kėbulo numeris (VIN)",
  sdk: "SDK",
} as const;

const autoPatikraLocators = {
  first_button: "a.buy-button",
  second_button: ".js-packet.packet",
  many_details_locator: "div.payment-header-details",
} as const;

function buildSeedUrl(): string {
  const params = new URLSearchParams(AUTOPLIUS_QUERY).toString();
  return `${AUTOPLIUS_BASE_URL}?${params}`;
}

async function extractListingPrice(
  listing: Locator
): Promise<number | undefined> {
  return (
    (await getNumberContent(listing, listingLocators.price)) ||
    (await getNumberContent(listing, listingLocators.price_changed_down)) ||
    (await getNumberContent(listing, listingLocators.promo_price))
  );
}

async function parseListingPage(
  page: Page,
  currentUrl: string
): Promise<ListingPageResult> {
  const listings = await page.locator(listingLocators.listings).all();
  log.info({ currentUrl, count: listings.length }, "Found listings");

  const items: ListingPageResult["listings"] = [];
  for (const listing of listings) {
    const href = await listing.getAttribute("href");
    const id = href?.split("-").pop()?.split(".")[0];
    if (!href || !id) {
      log.debug("Listing without href/id, skipping");
      continue;
    }

    const isAuction = await listing.getByText("Aukcionas").isVisible();
    if (isAuction) {
      log.debug({ href }, "Listing is an auction, skipping");
      continue;
    }

    const price = await extractListingPrice(listing);
    if (!price) {
      log.debug({ href }, "Listing without price, skipping");
      continue;
    }

    const price_old = await getNumberContent(
      listing,
      listingLocators.price_old
    );

    const isSold = await listing
      .locator(listingLocators.status_sold)
      .isVisible();
    const isReserved = await listing
      .locator(listingLocators.status_reserved)
      .isVisible();
    const status = isSold
      ? listingStatus.sold
      : isReserved
        ? listingStatus.reserved
        : listingStatus.active;

    const title = await getTextContent(listing, listingLocators.title);
    if (!title) {
      log.debug({ href }, "Listing without title, skipping");
      continue;
    }

    const absoluteUrl = new URL(href, currentUrl).toString();
    items.push({
      url: absoluteUrl,
      id,
      price,
      price_old: price_old ?? undefined,
      status,
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

  await page.goto(listing.url, {
    waitUntil: "domcontentloaded",
  });

  const description = await getTextContent(page, detailLocators.description);
  const number = await getTextContent(page, detailLocators.number);
  const location = await getTextContent(page, detailLocators.location);

  const auto: AutoInput[number]["auto"] = {
    id: listing.id,
    url: listing.url,
    source: "autoplius",
    price: listing.price,
    price_old: listing.price_old,
    description,
    title: listing.title,
    status: listing.status,
    initial: false,
    number,
    location,
  };

  const params = await page.locator(detailLocators.params).all();
  let findVin: string | undefined = undefined;
  for (const param of params) {
    const key = await getTextContent(param, detailLocators.params_label);
    const value = await getTextContent(param, detailLocators.params_value);
    if (!key || !value) continue;

    switch (key) {
      case paramsDescription.first_registration_year:
        auto.first_registration_year = value;
        break;
      case paramsDescription.mileage:
        auto.mileage = value;
        break;
      case paramsDescription.engine:
        auto.engine = value;
        break;
      case paramsDescription.drive_wheels:
        auto.drive_wheels = value;
        break;
      case paramsDescription.fuel_type:
        auto.fuel_type = value;
        break;
      case paramsDescription.body_type:
        auto.body_type = value;
        break;
      case paramsDescription.doors:
        auto.doors = value;
        break;
      case paramsDescription.gearbox:
        auto.gearbox = value;
        break;
      case paramsDescription.color:
        auto.color = value;
        break;
      case paramsDescription.mass:
        auto.mass = value;
        break;
      case paramsDescription.seats:
        auto.seats = value;
        break;
      case paramsDescription.defects:
        auto.defects = value;
        break;
      case paramsDescription.technical_inspection:
        auto.technical_inspection = value;
        break;
      case paramsDescription.co2_emission:
        auto.co2_emission = value;
        break;
      case paramsDescription.emission_tax:
        auto.emission_tax = normalizeNumbers(value);
        break;
      case paramsDescription.vin:
        findVin = await getVin(page);
        // log.info({ vin: auto.vin }, "VIN fetched");
        break;
      case paramsDescription.sdk:
        auto.sdk = await getSdk(page);
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
      case paramsDescription.climate_control:
        auto.climate_control = value;
        break;
      default:
        log.debug({ key }, "Unknown parameter");
        break;
    }
  }

  // const images: string[] = [];
  const imagesFromLocator = await page
    .locator(".media-gallery-thumbnails > .thumbnail > img[data-src]")
    .all();
  const images: string[] = (
    await Promise.all(
      imagesFromLocator.map(
        async (image) =>
          (await image.getAttribute("data-src"))
            ?.replace("ann_4_", "ann_2_")
            .replace(
              "https://skelbiu-img.dgn.lt/1_19",
              "https://skelbiu-img.dgn.lt/1_18"
            ) ?? ""
      )
    )
  ).filter((image) => image !== "");

  const plates = await getPlates(images);
  auto.plates = plates;

  // External pages processing
  if (findVin) auto.vin = await getVinFromExternalPage(page, findVin);

  log.info({ images: images.length }, "Listing processed");

  return {
    auto,
    images,
  };
}

async function getVin(page: Page) {
  try {
    const vinLocator = page.locator(detailLocators.vin_autoistorija);
    const count = await vinLocator.count();
    if (count === 0) return undefined;
    const vin = await vinLocator.first().getAttribute("href");
    if (vin) return vin;
  } catch (error) {
    log.warn(
      { error: error instanceof Error ? error.message : String(error) },
      "VIN button not found"
    );
  }
  return undefined;
}

async function getSdk(page: Page) {
  const metaDescription = page.locator('meta[name="keywords"]');
  const contents = await metaDescription.getAttribute("content");
  if (!contents) return undefined;

  const sdkCandidate = contents
    .split(",")
    .find((keyword) => keyword.includes("SDK"));
  if (!sdkCandidate) return undefined;

  const normalizedSDK = normalizeText(sdkCandidate.replace("SDK", ""));
  if (
    normalizedSDK &&
    normalizedSDK.length === 8 &&
    !normalizedSDK.toLowerCase().includes("kodas")
  ) {
    return normalizedSDK;
  }
  return undefined;
}

async function getVinFromExternalPage(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const next = await page
      .locator(autoPatikraLocators.first_button)
      .getAttribute("href");
    if (!next) return undefined;

    await page.goto(next, { waitUntil: "domcontentloaded" });

    const next2 = await page
      .locator(autoPatikraLocators.second_button)
      .first()
      .getAttribute("data-url");
    if (!next2) return undefined;

    await page.goto(next2, { waitUntil: "domcontentloaded" });

    const details = await page
      .locator(autoPatikraLocators.many_details_locator)
      .all();
    for (const detail of details) {
      const detailText = normalizeText(await detail.textContent());
      if (detailText?.length === 17) return detailText;
    }
  } catch (error) {
    log.warn(
      { error: error instanceof Error ? error.message : String(error) },
      "Failed to fetch VIN from external page"
    );
  }
  return undefined;
}

export const autopliusSource: ScraperSource = {
  name: "autoplius",
  host: new URL(AUTOPLIUS_BASE_URL).hostname,
  seeds: [buildSeedUrl()],
  cookies: AUTOPLIUS_COOKIES.map((cookie) => ({ ...cookie })),
  parseListingPage,
  resolveListingUrl: (listing) => listing.url,
  scrapeDetails,
  // getVinFromExternalPage,
  // disabled: true,
};
