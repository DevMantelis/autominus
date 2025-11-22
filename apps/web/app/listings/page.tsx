import { Listings } from "./listings";
import { Card, CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import Filters from "./filters";
import Settings from "./settings";
import { preloadQuery } from "convex/nextjs";
import { api } from "@repo/convex-db/convex/_generated/api";

const ListingsSkeleton = () => {
  return (
    <div className="grid gap-5">
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
                          <Skeleton key={x} className="w-16 h-12 rounded-xl" />
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

export default async function Page() {
  return (
    <main className="flex flex-col gap-5">
      <Settings />
      <div className="grid grid-cols-8">
        <div className="hidden lg:col-span-2 lg:flex">
          <Filters />
        </div>
        <Listings />
      </div>
    </main>
  );
}
