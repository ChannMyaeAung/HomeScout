"use client";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { useSearchParams } from "next/navigation";
import FilterBar from "./FilterBar";
import FiltersFull from "./FiltersFull";
import { useEffect } from "react";
import { cleanParams } from "@/lib/utils";
import { setFilters } from "@/state";
import Map from "./Map";
import Listings from "./Listings";

const SearchPage = () => {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const isFiltersFullOpen = useAppSelector(
    (state) => state.global.isFiltersFullOpen,
  );

  // On initial page load, parse filters from the URL and sync to Redux.
  useEffect(() => {
    // Step 1: Parse all URL params into a plain object
    // searchParams.entries() gives us every [key, value] pair from the URL
    // .reduce() walks thru them and builds up a single filter object "acc"
    // starting from {}.
    const initialFilters = Array.from(searchParams.entries()).reduce(
      (acc: any, [key, value]) => {
        // Step 2: Handle each key's type differently
        // PriceRange=500, 2000 -> "500,2000" in the URL, but we want [500, 2000] in our filter state. (number tuple)
        // squareFeet=,1500 -> ",1500" in the URL, but we want [null, 1500] in our filter state (null means "no min"/"no max"). (null = "no min")
        // coordinates=40.7,-74.0 -> "40.7,-74.0" in the URL, but we want [40.7, -74.0] in our filter state (number array)
        // beds=any -> "any" in the URL, but we want null in our filter state (null means "no selection")
        if (key === "priceRange" || key === "squareFeet") {
          acc[key] = value.split(",").map((v) => (v === "" ? null : Number(v)));
        } else if (key === "coordinates") {
          acc[key] = value.split(",").map(Number);
        } else {
          acc[key] = value === "any" ? null : value;
        }
        return acc;
      },
      {},
    );

    // strips any leftover null/"any" sentinels
    // then the result is dispatched to Redux so the whole page
    // renders with the correct filter state from the URL
    const cleanedFilters = cleanParams(initialFilters);
    dispatch(setFilters(cleanedFilters));
  }, []);

  return (
    <div
      className="w-full mx-auto px-5 flex flex-col py-3"
      style={{
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
      }}
    >
      <FilterBar />

      <div className="flex justify-between flex-1 overflow-hidden gap-3 mb-5">
        <div
          className={`h-full overflow-auto transition-all duration-300 ease-in-out ${isFiltersFullOpen ? "w-3/12 opacity-100 visible" : "w-0 opacity-0 invisible"}`}
        >
          <FiltersFull />
        </div>
        <Map />
        <div className="basis-4/12 overflow-y-auto">
          <Listings />
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
