import { create } from "zustand";
import { fetchReviewsByRecipeID } from "@/app/hooks/review"; // APIリクエスト関数
import { Review } from "@/app/types/index";

type ReviewStore = {
  reviews: Review[];
  fetchReviews: (recipeId: string) => Promise<Review[]>;
};

export const useReviewStore = create<ReviewStore>((set) => ({
  reviews: [],
  fetchReviews: async (recipeId) => {
    try {
      const data = await fetchReviewsByRecipeID(recipeId);
      set({ reviews: data });
      return data;
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      return [];
    }
  },
}));
