"use client";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import { cn } from "@heroui/theme";
import { api } from "@repo/convex-db/convex/_generated/api";
import { usePaginatedQuery } from "convex/react";

import {
  Calendar1Icon,
  CalendarSearchIcon,
  ConstructionIcon,
  GaugeIcon,
  HeartIcon,
  MapPinIcon,
  Settings2Icon,
  ShieldCheckIcon,
} from "lucide-react";
import moment from "moment";

export function Listings() {
  const paginatedListings = usePaginatedQuery(
    api.webAutos.listings,
    {},
    { initialNumItems: 20 }
  );
  return (
    <div className="grid gap-10 p-4 col-span-8 lg:col-span-6">
      {paginatedListings.results.map((listing) => {
        const techDate = listing.technical_inspection_year
          ? moment({
              year: listing.technical_inspection_year,
              month: listing.technical_inspection_month,
              day: listing.technical_inspection_day,
            })
          : undefined;
        return (
          <Card
            isBlurred
            className="border-none bg-background/60 dark:bg-default-100/50 max-w-4xl w-full mx-auto"
            shadow="sm"
            key={listing.id}
          >
            <CardBody>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-6 md:gap-4 items-center justify-center">
                <div className="relative col-span-6 md:col-span-4 flex justify-center">
                  {listing.images.length > 0 ? (
                    <Image
                      alt="Album cover"
                      className="object-cover"
                      height={200}
                      width={280}
                      shadow="md"
                      fetchPriority="high"
                      src={listing.images.at(0)}
                    />
                  ) : (
                    <div className="w-[400px] h-[200px] flex items-center justify-center bg-default-100 rounded-xl">
                      No Images
                    </div>
                  )}
                </div>

                <div className="flex flex-col col-span-6 md:col-span-8">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                      <h1 className="font-semibold text-foreground/90">
                        {listing.title}
                      </h1>
                      <Link
                        className="text-default-500 text-xs font-medium uppercase tracking-[0.18em]"
                        href={listing.url}
                        isExternal
                        showAnchorIcon
                      >
                        {listing.source}
                      </Link>
                      <h3 className="text-large font-medium">
                        {new Intl.NumberFormat("lt-LT", {
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 0,
                        }).format(listing.price)}
                      </h3>
                    </div>
                    <Button
                      isIconOnly
                      className="text-primary-700/60 data-hover:bg-foreground/10! -translate-y-2 translate-x-2"
                      radius="full"
                      variant="light"
                    >
                      <HeartIcon />
                    </Button>
                  </div>
                  <div className="grid gap-2 grid-cols-2 text-small mt-3 md:grid-cols-4">
                    <div className="flex gap-2 items-center font-medium">
                      <CalendarSearchIcon
                        className={cn("text-primary shrink-0", {
                          "text-warning": techDate?.isBefore(
                            moment().add(3, "months")
                          ),
                          "text-default": !techDate,
                        })}
                      />
                      <div className="min-w-0">
                        <p
                          className={cn("text-primary-700 truncate", {
                            "text-warning-700":
                              !techDate ||
                              techDate?.isBefore(moment().add(3, "months")),
                            "text-default": !techDate,
                          })}
                        >
                          Technical Inspection
                        </p>
                        <p>
                          {techDate ? techDate.format("YYYY-MM-DD") : "Invalid"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center font-medium">
                      <Calendar1Icon className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-primary-700 truncate">
                          First Registration
                        </p>
                        <p>
                          {moment(
                            `${listing.first_registration_year}-${listing.first_registration_month}`,
                            "YYYY-MM"
                          ).format("YYYY-MM")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center font-medium">
                      <ShieldCheckIcon
                        className={cn("text-primary shrink-0", {
                          "text-warning": listing.insurance === false,
                          "text-default": listing.insurance === undefined,
                        })}
                      />
                      <div className="min-w-0">
                        <p
                          className={cn("text-primary-700 truncate", {
                            "text-warning-700": listing.insurance === false,
                            "text-default": listing.insurance === undefined,
                          })}
                        >
                          Insurance
                        </p>
                        <p>
                          {listing.insurance === true
                            ? "Valid"
                            : listing.insurance === false
                              ? "Invalid"
                              : "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center font-medium">
                      <ConstructionIcon
                        className={cn("text-primary shrink-0", {
                          "text-warning": listing.allowed_to_drive === false,
                          "text-default":
                            listing.allowed_to_drive === undefined,
                        })}
                      />
                      <div className="min-w-0">
                        <p
                          className={cn("text-primary-700 truncate", {
                            "text-warning-700":
                              listing.allowed_to_drive === false,
                            "text-default":
                              listing.allowed_to_drive === undefined,
                          })}
                        >
                          Allowed To Drive
                        </p>
                        <p>
                          {listing.allowed_to_drive === true
                            ? "Valid"
                            : listing.allowed_to_drive === false
                              ? "Invalid"
                              : "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center font-medium">
                      <MapPinIcon
                        className={cn("text-primary shrink-0", {
                          "text-warning": !listing.location,
                        })}
                      />
                      <div className="min-w-0">
                        <p
                          className={cn("text-primary-700 truncate", {
                            "text-warning-500-700": !listing.location,
                          })}
                        >
                          Location
                        </p>
                        <p>{listing.location ? listing.location : "Unknown"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center font-medium">
                      <GaugeIcon className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-primary-700 truncate">Engine</p>
                        <p>{listing.engine}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center font-medium">
                      <Settings2Icon className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-primary-700 truncate">Gearbox</p>
                        <p>
                          {isFinite(Number(listing.gearbox))
                            ? "Mechaninė"
                            : "Automatinė"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center font-medium">
                      <Settings2Icon className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-primary-700 truncate">Fuel Type</p>
                        <p>{listing.fuel_type}</p>
                      </div>
                    </div>
                  </div>

                  {/* <div className="flex w-full items-center justify-center">
                    <Button>More Details</Button>
                  </div> */}
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
