/* eslint-disable */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { fetchUnitsService } from "../hooks/unit";
import { Unit } from "../types";

interface UnitStore {
  units: Unit[];
  error: string;
  fetchUnits: () => Promise<void>;
}

const useUnitStore = create<UnitStore>()(
  persist(
    (set) => ({
      units: [],
      error: "",

      fetchUnits: async () => {
        try {
          const units = await fetchUnitsService();
          set({ units, error: "" });
        } catch (err: any) {
          set({ error: err.message || "Failed to fetch units" });
        }
      },
    }),
    {
      name: "unit-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useUnitStore;
