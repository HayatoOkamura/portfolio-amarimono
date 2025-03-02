import { create } from "zustand";

type LoadingState = {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  loadingType: "spinner" | "dots" | "bars";
  setLoadingType: (type: "spinner" | "dots" | "bars") => void;
};

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  loadingType: "spinner",
  setLoadingType: (type) => set({ loadingType: type }),
}));
