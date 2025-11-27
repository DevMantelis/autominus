import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";

export default async function ListingsStats() {
  const fromApi = {
    allCount: 0,
    last24Hours: 0,
  };
  return (
    <div className="flex justify-center items-center gap-2 flex-wrap py-8 border-b border-default-100 sm:gap-5 lg:gap-7">
      <Chip variant="dot" color="primary">
        {/* Listings: {fromApi.allCount} */}
        Listings: x
      </Chip>
      <Chip variant="dot" color="primary">
        {/* Last 24 Hours: {fromApi.last24Hours} */}
        Last 24 Hours: x
      </Chip>
    </div>
  );
}
