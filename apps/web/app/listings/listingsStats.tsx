import { Chip } from "@heroui/chip";

export default async function ListingsStats() {
  const fromApi = {
    allCount: 100,
    last24Hours: 20,
    // withTech: 80,
    // withoutTech: 20,
    // withInsurance: 10,
    // withPlates: 20,
  };
  return (
    <div className="flex justify-center items-center gap-2 mb-5 flex-wrap sm:gap-5 lg:gap-7">
      <Chip variant="dot" color="primary">
        Listings: {fromApi.allCount}
      </Chip>
      <Chip variant="dot" color="primary">
        Last 24 Hours: {fromApi.last24Hours}
      </Chip>
      {/* <Chip variant="dot" color="primary">
        Without Tech: {fromApi.withoutTech}
      </Chip>
      <Chip variant="dot" color="primary">
        With Insurance: {fromApi.withInsurance}
      </Chip>
      <Chip variant="dot" color="primary">
        With Plates: {fromApi.withPlates}
      </Chip> */}
    </div>
  );
}
