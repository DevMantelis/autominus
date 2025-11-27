"use client";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import { Skeleton } from "@heroui/skeleton";
import { cn } from "@heroui/theme";
import { api } from "@repo/convex-db/convex/_generated/api";
import { usePaginatedQuery, UsePaginatedQueryReturnType } from "convex/react";

import {
  Calendar1Icon,
  CalendarSearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ConstructionIcon,
  GaugeIcon,
  HeartIcon,
  MapPinIcon,
  Settings2Icon,
  ShieldCheckIcon,
} from "lucide-react";
import moment from "moment";
import { useQueryStates } from "nuqs";
import { filtersSearchParams } from "./filters-search-params";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { useState } from "react";

type Listing = UsePaginatedQueryReturnType<
  typeof api.webAutos.listings
>["results"][number];

export const ListingsSkeleton = () => {
  return (
    <div className="grid gap-10 p-4 col-span-8 lg:col-span-6">
      {Array.from({ length: 5 }, (i, x) => {
        return (
          <Card
            key={x}
            className="border-none bg-background/60 dark:bg-default-100/50 max-w-4xl w-full mx-auto"
          >
            <CardBody>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-6 md:gap-4 items-center justify-center">
                <div className="relative col-span-6 md:col-span-4 flex justify-center">
                  <Skeleton className="w-[400px] h-[200px] rounded-xl" />
                </div>
                <div className="flex flex-col col-span-6 md:col-span-8">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="w-48 h-5 rounded-xl" />
                    <Skeleton className="w-24 h-5 rounded-xl" />
                    <Skeleton className="w-16 h-5 rounded-xl" />
                    <div className="grid gap-2 grid-cols-2 mt-3 md:grid-cols-4">
                      {Array.from({ length: 8 }, (i, x) => {
                        return (
                          <Skeleton key={x} className="w-4/5 h-12 rounded-xl" />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};

const THUMBS_PER_PAGE = 5;

function Listing(listing: Listing) {
  const {
    isOpen: isImageViewOpen,
    onOpen: onImageViewOpen,
    onOpenChange: onImageViewChange,
  } = useDisclosure();

  const images = listing.images ?? [];
  if (!images.length) return null;

  const techDate = listing.technical_inspection_date
    ? moment(listing.technical_inspection_date)
    : undefined;

  return (
    <>
      <Card
        isBlurred
        className="border-none bg-background/60 dark:bg-default-100/50"
        shadow="sm"
      >
        <Modal
          isOpen={isImageViewOpen}
          onOpenChange={onImageViewChange}
          size="full"
          placement="center"
          backdrop="transparent"
          hideCloseButton
        >
          <ModalContent>
            {(onClose) => (
              <>
                {/* <ModalBody className="flex flex-col gap-4 overflow-auto items-center justify-center">
                  <div className="flex justify-center items-center shrink-0">
                    <Image
                      className="max-w-full max-h-[85vh] object-contain"
                      src={images[selectedIndex]}
                      alt={`Image ${selectedIndex + 1}`}
                    />
                  </div>
                  <div className="mt-4 relative flex items-center">
                    <button
                      type="button"
                      onClick={handlePrevThumbPage}
                      disabled={!canGoLeft}
                      className={`mr-2 flex items-center justify-center h-10 w-10 rounded-full bg-black/40 disabled:opacity-30 disabled:cursor-default`}
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-white" />
                    </button>

                    <div className="flex gap-2 flex-1 justify-center">
                      {visibleThumbs.map((src, idx) => {
                        const actualIndex = thumbStart + idx;
                        const isActive = actualIndex === selectedIndex;
                        return (
                          <button
                            key={src + actualIndex}
                            type="button"
                            onClick={() => handleThumbClick(actualIndex)}
                            className={cn(
                              `relative shrink-0 h-20 w-20 rounded-md overflow-hidden border border-default-200`,
                              {
                                "border-blue-500 ring-2 ring-blue-500":
                                  isActive,
                              }
                            )}
                          >
                            <Image
                              src={src}
                              alt={`Thumbnail ${actualIndex + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleNextThumbPage}
                      disabled={!canGoRight}
                      className={`
                  ml-2 flex items-center justify-center
                  h-10 w-10 rounded-full
                  bg-black/40
                  disabled:opacity-30 disabled:cursor-default
                `}
                    >
                      <ChevronRightIcon className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </ModalBody> */}
              </>
            )}
          </ModalContent>
        </Modal>
        <CardBody>
          <div className="grid grid-cols-6 items-center justify-center md:grid-cols-12 gap-6 md:gap-4">
            <div className="relative col-span-6 md:col-span-4 flex justify-center overflow-hidden">
              {listing.images.length > 0 ? (
                <Image
                  alt="Album cover"
                  className="object-cover"
                  height={200}
                  width={400}
                  shadow="md"
                  fetchPriority="high"
                  src={listing.images.at(0)}
                  fallbackSrc={"https://i.imgur.com/PhY65RW.png"}
                  // onClick={onImageViewOpen}
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
                    {listing.plates.length > 0 && (
                      <span className="ml-1">
                        - {listing.plates.join(", ")}
                      </span>
                    )}
                  </h1>
                  <div>
                    <Link
                      className="text-default-500 text-xs font-medium uppercase tracking-[0.18em]"
                      href={listing.url}
                      isExternal
                      showAnchorIcon
                    >
                      {listing.source}
                    </Link>
                    <span className="ml-1 text-small text-default-400 lowercase">
                      - {moment(listing._creationTime).fromNow()}
                    </span>
                  </div>
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
                    <p
                      className={cn("", {
                        "text-default font-semibold": techDate === undefined,
                      })}
                    >
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
                        "text-default font-bold":
                          listing.insurance === undefined,
                      })}
                    >
                      Insurance
                    </p>
                    <p
                      className={cn("", {
                        "text-default font-semibold":
                          listing.insurance === undefined,
                      })}
                    >
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
                      "text-default": listing.allowed_to_drive === undefined,
                    })}
                  />
                  <div className="min-w-0">
                    <p
                      className={cn("text-primary-700 truncate", {
                        "text-warning-700": listing.allowed_to_drive === false,
                        "text-default font-bold":
                          listing.allowed_to_drive === undefined,
                      })}
                    >
                      Allowed To Drive
                    </p>
                    <p
                      className={cn("", {
                        "text-default font-semibold":
                          listing.allowed_to_drive === undefined,
                      })}
                    >
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
                    <p>
                      {listing.fuel_type
                        ? listing.fuel_type.join(", ")
                        : "Unknown"}
                    </p>
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
    </>
  );
}

export function Listings() {
  const [params] = useQueryStates(filtersSearchParams);
  const [viewImage, setViewImage] = useState(false);

  const paginatedListings = usePaginatedQuery(
    api.webAutos.listings,
    {
      ...params,
      technicalInspectionDate: params.technicalInspectionDate
        ? params.technicalInspectionDate.toISOString().split("T").at(0)!
        : null,
    },
    { initialNumItems: 20 }
  );

  if (
    paginatedListings.isLoading &&
    paginatedListings.status === "LoadingFirstPage"
  )
    return <ListingsSkeleton />;

  return (
    <div className="grid gap-10 col-span-8 lg:col-span-6">
      {paginatedListings.results.map((listing) => {
        return <Listing {...listing} key={listing.id} />;
      })}
      {paginatedListings.isLoading &&
        paginatedListings.status === "LoadingMore" && <ListingsSkeleton />}
    </div>
  );
}
