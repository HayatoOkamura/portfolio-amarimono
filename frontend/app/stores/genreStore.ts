/* eslint-disable */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchRecipeGenres, fetchIngredientGenres } from "../hooks/genre";

interface Genre {
  id: number;
  name: string;
}

interface GenreStore {
  recipeGenres: Genre[];
  ingredientGenres: Genre[];
  error: string;
  fetchRecipeGenres: () => Promise<void>;
  fetchIngredientGenres: () => Promise<void>;
}

const useGenreStore = create<GenreStore>()(
  persist(
    (set) => ({
      recipeGenres: [],
      ingredientGenres: [],
      error: "",

   
      fetchRecipeGenres: async () => {
        try {
          const recipeGenres = await fetchRecipeGenres();
          set({ recipeGenres, error: "" });
        } catch (err: any) {
          set({ error: `Failed to fetch recipe genres: ${err.message}` });
        }
      },
      fetchIngredientGenres: async () => {
        try {
          const ingredientGenres = await fetchIngredientGenres();
          set({ ingredientGenres, error: "" });
        } catch (err: any) {
          set({ error: `Failed to fetch ingredient genres: ${err.message}` });
        }
      },
    }),
    {
      name: "genre-storage", // 永続化設定
    }
  )
);

export default useGenreStore;
