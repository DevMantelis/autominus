"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Modal, ModalContent, useDisclosure } from "@heroui/modal";
import { FilterIcon, XIcon } from "lucide-react";
import { Slider } from "@heroui/slider";
import { useState } from "react";
import { Checkbox, CheckboxGroup } from "@heroui/checkbox";
import { DatePicker } from "@heroui/date-picker";
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { filtersSearchParams } from "./filters-search-params";
import { useQueryStates } from "nuqs";
import _ from "lodash";
import { defaultFilter, type FiltersT } from "@repo/convex-db/convex/types";

// type FiltersT = {
//   priceFrom: number;
//   priceTo: number;
//   technicalInspection: Array<"valid" | "invalid">;
//   technicalInspectionDate: Date | null;
//   insurance: boolean;
//   gearbox: Array<"automatic" | "mechanical">;
//   fuelType: Array<"petrol" | "diesel" | "gas">;
// };

// const defaultFilter: FiltersT = {
//   priceFrom: 50,
//   priceTo: 2000,
//   technicalInspection: ["valid", "invalid"],
//   technicalInspectionDate: null,
//   insurance: false,
//   gearbox: ["automatic", "mechanical"],
//   fuelType: ["petrol", "diesel", "gas"],
// };

export default function Filter({ onClose }: { onClose?: (() => void) | null }) {
  const [params, setSearchParams] = useQueryStates(filtersSearchParams);
  const [filters, setFilters] = useState<FiltersT>({
    priceFrom: params.priceFrom ?? defaultFilter.priceFrom,
    priceTo: params.priceTo ?? defaultFilter.priceTo,
    technicalInspection:
      params.technicalInspection ?? defaultFilter.technicalInspection,
    technicalInspectionDate:
      params.technicalInspectionDate ?? defaultFilter.technicalInspectionDate,
    insurance: params.insurance ?? defaultFilter.insurance,
    gearbox: params.gearbox ?? defaultFilter.gearbox,
    fuelType: params.fuelType ?? defaultFilter.fuelType,
  });

  const appliedFilters = Object.keys(defaultFilter).map((keyRaw) => {
    // Searches for differences between default values and filter values
    // Removes if default values equals filter values for clearier and shorter URL + listing Active filters
    const key = keyRaw as keyof FiltersT;
    const initial = defaultFilter[key];
    const applied = filters[key];
    if (Array.isArray(initial) && Array.isArray(applied)) {
      if (
        initial.length !== applied.length ||
        // @ts-ignore
        initial.some((v) => !applied.includes(v))
      )
        return { [key]: applied };
      return { [key]: null };
    } else if (initial !== applied) return { [key]: applied };
    return { [key]: null };
  });
  // .filter((obj) => {
  //   const keyVals = Object.entries(obj);
  //   return keyVals[0] && keyVals[0][1] !== null;
  // });

  // Joins keys with values into one object instead of array of objects with each of one key
  const result = appliedFilters.reduce((acc, obj) => ({ ...acc, ...obj }), {});

  // const flattened: { key: string; value: string }[] = Object.entries(
  //   result
  // ).flatMap(([key, value]) =>
  //   //@ts-ignore
  //   Array.isArray(value)
  //     ? value.map((v) => ({ key, value: v }))
  //     : [{ key, value }]
  // );

  const applyFilters = () => {
    setSearchParams(result);
    if (typeof onClose === "function") onClose();
  };

  const resetFilters = () => {
    setFilters(defaultFilter);
    setSearchParams(null);
    if (typeof onClose === "function") onClose();
  };

  return (
    <Card classNames={{ base: "w-full h-fit" }}>
      <CardHeader className="font-medium justify-between">
        <h3 className="flex gap-2">
          <FilterIcon className="text-primary-600" /> Filters
        </h3>
        {typeof onClose === "function" && (
          <XIcon size={18} onClick={() => onClose()} />
        )}
      </CardHeader>
      <Divider />
      <CardBody className="gap-3">
        {/* <div className="">
          <p className="text-small font-bold">Active</p>
          <div className="flex flex-wrap justify-center gap-4">
          </div>
        </div>
        <Divider /> */}
        <Slider
          className="max-w-md"
          classNames={{ label: "text-small font-bold" }}
          formatOptions={{ style: "currency", currency: "EUR" }}
          label="Price Range"
          minValue={defaultFilter.priceFrom}
          maxValue={defaultFilter.priceTo}
          value={[filters.priceFrom, filters.priceTo]}
          // showSteps={true}
          marks={[
            {
              value: 50,
              label: "50€",
            },
            {
              value: 500,
              label: "500€",
            },
            {
              value: 1000,
              label: "1000€",
            },
            {
              value: 1500,
              label: "1500€",
            },
            {
              value: 2000,
              label: "2000€",
            },
          ]}
          step={50}
          showTooltip={true}
          tooltipValueFormatOptions={{ style: "currency", currency: "EUR" }}
          onChange={(value) => {
            const values = value as [
              FiltersT["priceFrom"],
              FiltersT["priceTo"],
            ];
            setFilters({
              ...filters,
              priceFrom: values[0],
              priceTo: values[1],
            });
          }}
        />
        <Divider />
        <div className="grid gap-2">
          <CheckboxGroup
            classNames={{
              label: "text-small font-bold text-foregorund",
            }}
            label={"Technical Inspection"}
            value={filters.technicalInspection}
            onValueChange={(value) => {
              const values = value as FiltersT["technicalInspection"];

              if (values.length === 0)
                setFilters({
                  ...filters,
                  technicalInspection: defaultFilter.technicalInspection,
                  technicalInspectionDate:
                    defaultFilter.technicalInspectionDate,
                });
              else if (
                filters.technicalInspectionDate &&
                values.includes("invalid")
              )
                setFilters({
                  ...filters,
                  technicalInspectionDate:
                    defaultFilter.technicalInspectionDate,
                  technicalInspection: values,
                });
              else setFilters({ ...filters, technicalInspection: values });
            }}
          >
            {defaultFilter.technicalInspection.map((tech) => (
              <Checkbox key={tech} value={tech} className="capitalize">
                {tech}
              </Checkbox>
            ))}
          </CheckboxGroup>
          <div className="relative">
            <Divider />
            <p className="absolute -translate-y-1/2 -translate-x-1/2 top-1/2 left-1/2 bg-content1 px-3 font-medium tracking-[0.18em]">
              OR
            </p>
          </div>
          <DatePicker
            classNames={{
              base: "my-2",
              label: "text-small font-bold text-foregorund",
            }}
            label="Technical Inspection From Date"
            labelPlacement="outside"
            variant="bordered"
            showMonthAndYearPickers
            value={
              filters.technicalInspectionDate
                ? parseDate(
                    filters.technicalInspectionDate
                      .toISOString()
                      .split("T")
                      .at(0)!
                  )
                : null
            }
            minValue={today(getLocalTimeZone())}
            onChange={(value) => {
              if (filters.technicalInspection.includes("invalid"))
                setFilters((prev) => {
                  return { ...prev, technicalInspection: ["valid"] };
                });

              setFilters((prev) => {
                return {
                  ...prev,
                  technicalInspectionDate: value
                    ? new Date(value.toString())
                    : null,
                };
              });
            }}
          />
        </div>
        <Divider />
        <CheckboxGroup
          classNames={{
            label: "text-small font-bold text-foregorund",
          }}
          label={"Fuel Types"}
          value={filters.fuelType}
          onValueChange={(value) => {
            const values = value as FiltersT["fuelType"];

            if (values.length === 0)
              setFilters({
                ...filters,
                fuelType: defaultFilter.fuelType,
              });
            else setFilters({ ...filters, fuelType: values });
          }}
        >
          {defaultFilter.fuelType.map((fuel) => (
            <Checkbox key={fuel} value={fuel} className="capitalize">
              {fuel}
            </Checkbox>
          ))}
        </CheckboxGroup>
        <Divider />
        <CheckboxGroup
          classNames={{
            label: "text-small font-bold text-foregorund",
          }}
          label={"Gearbox"}
          value={filters.gearbox}
          onValueChange={(value) => {
            const values = value as FiltersT["gearbox"];

            if (values.length === 0)
              setFilters({
                ...filters,
                gearbox: defaultFilter.gearbox,
              });
            else setFilters({ ...filters, gearbox: values });
          }}
        >
          {defaultFilter.gearbox.map((gearbox) => (
            <Checkbox key={gearbox} value={gearbox} className="capitalize">
              {gearbox}
            </Checkbox>
          ))}
        </CheckboxGroup>
        <Divider />
        <div className="grid gap-1">
          <p className="text-small font-bold text-foregorund">Other</p>
          <Checkbox
            isSelected={filters.insurance}
            onValueChange={(value) =>
              setFilters({ ...filters, insurance: value })
            }
          >
            Insurance
          </Checkbox>
        </div>
      </CardBody>
      <Divider />
      <CardFooter className="justify-end">
        <Button variant="light" color="danger" onPress={resetFilters}>
          Reset
        </Button>
        <Button variant="solid" color="primary" onPress={applyFilters}>
          Apply
        </Button>
      </CardFooter>
    </Card>
  );
}

export function FilterMobile() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <>
      <Button
        onPress={onOpen}
        color="primary"
        variant="flat"
        className="lg:hidden"
      >
        <FilterIcon /> Filters
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>{(onClose) => <Filter onClose={onClose} />}</ModalContent>
      </Modal>
    </>
  );
}
