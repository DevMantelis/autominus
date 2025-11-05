import type { Locator, Page } from "@playwright/test";
import {
  getNumberContent,
  getTextContent,
  logger,
  normalizeNumbers,
  normalizeText,
} from "../helpers";
import {
  type PlaywrightCookie,
  listingStatus,
  type ListingPageResult,
  type ScraperSource,
  type initialListingT,
} from "../types";
import { insertAutoValidator } from "@repo/convex-db/convex/types";
import { getVinFromRegitraApi } from ".";
import { logError } from "../error";

const log = logger.child({ source: "autoplius" });

const AUTOPLIUS_BASE_URL =
  "https://autoplius.lt/skelbimai/naudoti-automobiliai";

const AUTOPLIUS_COOKIES: PlaywrightCookie[] = [
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "__cf_bm",
    value:
      "pBPja2.vN.eGUgfCUOmeQo0yHS7ydasUeDpf6BoiCkc-1761922467-1.0.1.1-roC7ai2piN1LZ1TWZ44iJIRinnY75WI79prEizVyAs.6q299KU7QT5ZuzVXgRFmK_sT0pDU9oi0cfIF0Refj9lI7cxorV3sRD4RN8MPCZE8",
    httpOnly: true,
    secure: true,
    session: false,
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "saved_searches",
    value: "6904cda39ef53",
    httpOnly: true,
    secure: true,
    session: false,
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "__gfp_64b",
    value:
      "N57F0.driMtYIaExpkXYOPaWCOAvEIA1e3KAqDdq3Fr.K7|1761922470|2|||8:1:32",
    httpOnly: false,
    secure: false,
    session: false,
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "FCCDCF",
    value:
      "%5Bnull%2Cnull%2Cnull%2C%5B%22CQaJ9gAQaJ9gAEsACCLTCDFgAAAAAAAAABaYAAAUBQD-F2Y2EKFEWCuQUYIYBCugCAAxYhgAA0CBgAAGCQgQAgFJIIkCAEAIEAAEAAAQEgCAABQEBAAAIAAAAAqAACIABgAQCAQQIABAAAAhIAAAAAAEQAAIgEAAAAIIIgBABAAAAQAkDAAAAAAAAECAAAAACAAAAAAAAAAAAAAAEABgIABAAABEAAAAAAAACCQIAAAAAAAAAAAAAAAAAAAAAAEAAA.YAAAAAAAAAA%22%2C%222~~dv.61.89.122.161.184.196.230.314.442.445.494.550.576.827.1029.1033.1046.1047.1051.1097.1126.1166.1301.1342.1415.1725.1765.1942.1958.1987.2068.2072.2074.2107.2213.2219.2223.2224.2328.2331.2387.2416.2501.2567.2568.2575.2657.2686.2778.2869.2878.2908.2920.2963.3005.3023.3100.3126.3219.3234.3235.3253.3309.3731.6931.8931.13731.15731.33931%22%2C%22877B9D30-5645-455C-9832-145668FEF61A%22%5D%2Cnull%2Cnull%2C%5B%5B32%2C%22%5B%5C%2262e8a50e-5a45-40ea-aab9-425759941b0e%5C%22%2C%5B1761922468%2C870000000%5D%5D%22%5D%5D%5D",
    httpOnly: false,
    secure: false,
    session: false,
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "_ga_N5HQZJVPWE",
    value: "GS2.1.s1761922468$o1$g0$t1761922468$j60$l0$h1377426715",
    httpOnly: false,
    secure: false,
    session: false,
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "_ga",
    value: "GA1.1.2056906103.1761922469",
    httpOnly: false,
    secure: false,
    session: false,
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "_hjSession_5359513",
    value:
      "eyJpZCI6ImQ2YjAxMGVkLWZhOGEtNGFlZi04MTYyLTIwMTM0ZTdkZDViNSIsImMiOjE3NjE5MjI0Njg3NjIsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjoxLCJzcCI6MH0=",
    httpOnly: false,
    secure: true,
    session: false,
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "_hjSessionUser_5359513",
    value:
      "eyJpZCI6IjhjNDNkOGI4LWQ0YTctNWFiMi04MzgwLTAwMTc1NjA5NGI5NSIsImNyZWF0ZWQiOjE3NjE5MjI0Njg3NjEsImV4aXN0aW5nIjpmYWxzZX0=",
    httpOnly: false,
    secure: true,
    session: false,
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "_sharedID",
    value: "02a67ba5-5406-44be-827e-16fbfc9acd07",
    httpOnly: false,
    secure: false,
    session: false,
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "_sharedID_cst",
    value: "zix7LPQsHA%3D%3D",
    httpOnly: false,
    secure: false,
    session: false,
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "banners_139",
    value: "eNqzNjc1M9UxNDczMjAwMzQ00dEBACLvA5M=",
    httpOnly: false,
    secure: true,
    session: true,
  },
  {
    domain: ".autoplius.lt",
    path: "/",
    name: "PHPSESSID",
    value: "n10npl8ss21do2164il978sh9v",
    httpOnly: true,
    secure: true,
    session: true,
  },
  {
    domain: "autoplius.lt",
    path: "/",
    name: "stpdOrigin",
    value: '{"origin":"direct"}',
    httpOnly: false,
    secure: false,
    session: false,
  },
];

const AUTOPLIUS_QUERY: Record<string, string> = {
  category_id: "2",
  older_not: "-1",
  sell_price_to: "2000",
  slist: "2717947406",
  order_by: "3",
  order_direction: "DESC",
};

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
  // vin: "div.vin-parameter.js-show-vin",
  // vin_revealed: "div.vin-parameter.js-show-vin.revealed",
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
  log.info({ currentUrl, count: listings.length }, "Found potential listings");
  if (listings.length === 0) {
    const buffer = await page.screenshot();
    throw new Error(
      `Failed to scrape listings, got 0. Base64: ${buffer.toString("base64")}`
    );
  }

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
): Promise<insertAutoValidator | null> {
  log.info({ url: listing.url }, "Scraping listing");

  const description = await getTextContent(page, detailLocators.description);
  const number = await getTextContent(page, detailLocators.number);
  const location = await getTextContent(page, detailLocators.location);

  const autoParams: Pick<
    insertAutoValidator,
    | "first_registration_year"
    | "first_registration_month"
    | "mileage"
    | "engine"
    | "drive_wheels"
    | "fuel_type"
    | "body_type"
    | "doors"
    | "gearbox"
    | "color"
    | "mass"
    | "seats"
    | "defects"
    | "technical_inspection_year"
    | "technical_inspection_month"
    | "co2_emission"
    | "emission_tax"
    | "sdk"
    | "euro_standard"
    | "first_registration_year_country"
    | "wheel_diameter"
    | "climate_control"
  > = {};

  const params = await page.locator(detailLocators.params).all();
  let findVin: string | undefined = undefined;
  for (const param of params) {
    const key = await getTextContent(param, detailLocators.params_label);
    const value = await getTextContent(param, detailLocators.params_value);
    if (!key || !value) continue;

    switch (key) {
      case paramsDescription.first_registration_year: {
        const splitted = value.split("-");
        if (
          !isFinite(Number(splitted.at(0))) ||
          Number(splitted.at(0)).toString().length !== 4
        )
          break;
        autoParams.first_registration_year = Number(splitted.at(0));
        autoParams.first_registration_month = isFinite(Number(splitted.at(1)))
          ? Number(splitted.at(1))
          : 1;

        break;
      }
      case paramsDescription.mileage:
        autoParams.mileage = value;
        break;
      case paramsDescription.engine:
        autoParams.engine = value;
        break;
      case paramsDescription.drive_wheels:
        autoParams.drive_wheels = value;
        break;
      case paramsDescription.fuel_type:
        autoParams.fuel_type = value;
        break;
      case paramsDescription.body_type:
        autoParams.body_type = value;
        break;
      case paramsDescription.doors:
        autoParams.doors = value;
        break;
      case paramsDescription.gearbox:
        autoParams.gearbox = value;
        break;
      case paramsDescription.color:
        autoParams.color = value;
        break;
      case paramsDescription.mass:
        autoParams.mass = value;
        break;
      case paramsDescription.seats:
        autoParams.seats = value;
        break;
      case paramsDescription.defects:
        autoParams.defects = value;
        break;
      case paramsDescription.technical_inspection: {
        const splitted = value.split("-");
        if (
          !isFinite(Number(splitted.at(0))) ||
          Number(splitted.at(0)).toString().length !== 4
        )
          break;
        autoParams.technical_inspection_year = Number(splitted.at(0));
        autoParams.technical_inspection_month = isFinite(Number(splitted.at(1)))
          ? Number(splitted.at(1))
          : 1;

        break;
      }
      case paramsDescription.co2_emission:
        autoParams.co2_emission = value;
        break;
      case paramsDescription.emission_tax:
        autoParams.emission_tax = normalizeNumbers(value);
        break;
      case paramsDescription.vin:
        findVin = await getVin(page);
        break;
      case paramsDescription.sdk:
        autoParams.sdk = await getSdk(page);
        break;
      case paramsDescription.euro_standard:
        autoParams.euro_standard = value;
        break;
      case paramsDescription.first_registration_year_country:
        autoParams.first_registration_year_country = value;
        break;
      case paramsDescription.wheel_diameter:
        autoParams.wheel_diameter = value;
        break;
      case paramsDescription.climate_control:
        autoParams.climate_control = value;
        break;
      default:
        log.debug({ key }, "Unknown parameter");
        break;
    }
  }

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

  let vin: string | undefined;
  if (findVin) vin = await getVinFromExternalPage(page, findVin);
  if (!vin && autoParams.sdk) {
    const sdkResult = await getVinFromRegitraApi(autoParams.sdk);
    vin = sdkResult.vin;
    if (!sdkResult.isSdkValid) autoParams.sdk = undefined;
  }

  const auto: insertAutoValidator = {
    id: listing.id,
    url: listing.url,
    source: "autoplius",
    price: listing.price,
    price_old: listing.price_old,
    description,
    title: listing.title,
    status: listing.status,
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

async function getVin(page: Page) {
  try {
    const vinLocator = page.locator(detailLocators.vin_autoistorija);
    const count = await vinLocator.count();
    if (count === 0) return undefined;
    const vin = await vinLocator.first().getAttribute("href");
    if (vin) return vin;
  } catch (error) {
    await logError("VIN button not found", error);
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
      const detailText = normalizeText(await detail.textContent())?.replaceAll(
        " ",
        ""
      );
      if (detailText?.length === 17) return detailText;
    }
  } catch (error) {
    await logError("Failed to fetch VIN from autoPatikra", error);
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
  // disabled: true,
};
