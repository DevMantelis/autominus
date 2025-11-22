"use client";

import { Divider } from "@heroui/divider";
import Filters from "./filters";
import Sort from "./sort";

export default function Settings() {
  return (
    <div className="flex justify-between items-center">
      <Filters />
      <Sort />
      <Divider />
    </div>
  );
}
