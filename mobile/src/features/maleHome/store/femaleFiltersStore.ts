import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/** Quick filter chips at the top of Male Home. */
export type QuickFilter = 'all' | 'online' | 'new' | 'topRated' | 'favorites';

export type RatingFilter = 'any' | '3plus' | '4plus' | '4_5plus';
export type PriceFilter = 'any' | 'le50' | '51to100' | '100plus';
export type SortBy = 'recent' | 'rating' | 'price' | 'active';

export type FemaleFilters = {
  quick: QuickFilter;
  onlineOnly: boolean;
  ageMin: number;
  ageMax: number;
  rating: RatingFilter;
  price: PriceFilter;
  sortBy: SortBy;
};

const DEFAULTS: FemaleFilters = {
  quick: 'all',
  onlineOnly: false,
  ageMin: 18,
  ageMax: 50,
  rating: 'any',
  price: 'any',
  sortBy: 'recent',
};

type FiltersState = FemaleFilters & {
  setQuick: (q: QuickFilter) => void;
  /** Replaces every field — used by the Filter sheet's "Apply" button. */
  applyAll: (next: FemaleFilters) => void;
  reset: () => void;
  /** Count of non-default filters, for badge on the filter icon. */
  activeCount: () => number;
};

/**
 * Shared filter state for Male Home browse grid + the Filter bottom sheet.
 *
 * Two write paths:
 *   * `setQuick(q)` — single-chip quick selector at the top of Home.
 *   * `applyAll({...})` — full sheet submission, replaces every field.
 *
 * The grid subscribes to the whole state; the chip row only to `quick`.
 */
export const useFemaleFiltersStore = create<FiltersState>()(
  subscribeWithSelector((set, get) => ({
    ...DEFAULTS,

    setQuick: (q): void => set({ quick: q }),

    applyAll: (next): void => set({ ...next }),

    reset: (): void => set({ ...DEFAULTS }),

    activeCount: (): number => {
      const s = get();
      let count = 0;
      if (s.onlineOnly) {
        count += 1;
      }
      if (s.ageMin !== DEFAULTS.ageMin || s.ageMax !== DEFAULTS.ageMax) {
        count += 1;
      }
      if (s.rating !== DEFAULTS.rating) {
        count += 1;
      }
      if (s.price !== DEFAULTS.price) {
        count += 1;
      }
      if (s.sortBy !== DEFAULTS.sortBy) {
        count += 1;
      }
      return count;
    },
  })),
);
