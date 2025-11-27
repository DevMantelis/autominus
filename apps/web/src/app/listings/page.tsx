import Filter, { FilterMobile } from "./_components/filters";
import { Listings, ListingsSkeleton } from "./_components/listings";
import ListingsStats from "./_components/listingsStats";
import Sort from "./_components/sort";
import { Suspense } from "react";
import { Skeleton } from "@heroui/skeleton";

export default async function Page() {
  return (
    <>
      <ListingsStats />
      <main className="grid gap-5 p-4 max-w-7xl mx-auto">
        <div className="">
          <div className="flex justify-between lg:justify-end">
            <Suspense
              fallback={<Skeleton className="w-20 h-10 rounded-xl lg:hidden" />}
            >
              <FilterMobile />
            </Suspense>
            <Suspense fallback={<Skeleton className="w-20 h-10 rounded-xl" />}>
              <Sort />
            </Suspense>
          </div>
        </div>
        <div className="grid grid-cols-8 gap-4">
          <div className="hidden lg:col-span-2 lg:flex">
            <Suspense
              fallback={<Skeleton className="w-full h-1/2 rounded-xl" />}
            >
              <Filter />
            </Suspense>
          </div>
          <Suspense fallback={<ListingsSkeleton />}>
            <Listings />
          </Suspense>
        </div>
      </main>
    </>
  );
}
