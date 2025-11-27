"use client";
import { Button } from "@heroui/button";
import { ArrowDownWideNarrowIcon, MoveRightIcon } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { useQueryStates } from "nuqs";
import { filtersSearchParams } from "./filters-search-params";

export const SortOptions = [
  {
    key: "new_to_old",
    textValue: "New To Old",
    text: (
      <>
        New <MoveRightIcon size={16} /> Old
      </>
    ),
  },
  {
    key: "price_high_to_low",
    textValue: "Price: High To Low",
    text: (
      <>
        Price: High <MoveRightIcon size={16} /> Low
      </>
    ),
  },
  {
    key: "price_low_to_high",
    textValue: "Price: Low To High",
    text: (
      <>
        Price: Low <MoveRightIcon size={16} /> High
      </>
    ),
  },
  {
    key: "tech_long_to_short",
    textValue: "Tech: Long To Short",
    text: (
      <>
        Tech: Long <MoveRightIcon size={16} /> Short
      </>
    ),
  },
  {
    key: "tech_short_to_long",
    textValue: "Tech: Short To Long",
    text: (
      <>
        Tech: Short <MoveRightIcon size={16} /> Long
      </>
    ),
  },
] as const;

export default function Sort() {
  const [{ sort }, setSearchParams] = useQueryStates(filtersSearchParams);

  const current = sort
    ? SortOptions.find((option) => option.key === sort)!
    : SortOptions[0];

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button color="primary" variant="flat" className="capitalize">
          <ArrowDownWideNarrowIcon />
          {current.textValue}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Single selection example"
        selectedKeys={new Set([current.key])}
        selectionMode="single"
        variant="flat"
        onAction={(key) => {
          const value = key as (typeof SortOptions)[number]["key"];
          if (value === SortOptions[0].key) setSearchParams({ sort: null });
          else setSearchParams({ sort: value });
        }}
      >
        {SortOptions.map((option) => (
          <DropdownItem
            key={option.key}
            classNames={{ title: "flex gap-2 items-center" }}
            textValue={option.textValue}
          >
            {option.text}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
