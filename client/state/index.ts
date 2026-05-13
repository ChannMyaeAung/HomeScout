import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FiltersState {
  location: string;
  beds: string;
  baths: string;
  propertyType: string;
  amenities: string[];
  availableFrom: string;
  priceRange: [number, number] | [null, null];
  squareFeet: [number, number] | [null, null];
  coordinates: [number, number];
}

interface initialStateTypes {
  filters: FiltersState;
  isFiltersFullOpen: boolean;
  viewMode: "grid" | "list";
}

export const initialState: initialStateTypes = {
  isFiltersFullOpen: false,
  filters: {
    location: "Los Angeles",
    beds: "any",
    baths: "any",
    propertyType: "any",
    amenities: [],
    availableFrom: "any",
    priceRange: [null, null],
    squareFeet: [null, null],
    // Default map center Los Angeles
    coordinates: [-118.25, 34.05],
  },
  viewMode: "grid",
};

// createSlice bundles initialState + reducer functions into one unit.
// It auto-generates an action creator for each reducer so we don't write them by hand.
export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    // Partial<FiltersState> lets callers update only the fields that changed
    // without having to re-send the entire filters object.
    setFilters: (state, action: PayloadAction<Partial<FiltersState>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    toggleFiltersFullOpen: (state) => {
      state.isFiltersFullOpen = !state.isFiltersFullOpen;
    },
    setViewMode: (state, action: PayloadAction<"grid" | "list">) => {
      state.viewMode = action.payload;
    },
  },
});

// createSlice generates action creator functions alongside the reducer logic.
// These are what components call: dispatch(setFilters({ beds: "2" }))
export const { setFilters, toggleFiltersFullOpen, setViewMode } =
  globalSlice.actions;

// The combined reducer function registered in the store, not used directly in components.
export default globalSlice.reducer;
