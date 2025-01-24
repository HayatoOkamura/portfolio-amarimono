/* eslint-disable */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Recipe } from "../types";
import {
  fetchRecipesService,
  addRecipeService,
  deleteRecipeService,
} from "../hooks/recipes";

interface RecipeStore {
  recipes: Recipe[];
  generatedRecipes: Recipe[];
  error: string;
  fetchRecipes: () => Promise<void>;
  setGeneratedRecipes: (recipes: Recipe[]) => void;
  setRecipes: (recipes: Recipe[]) => void;
  clearRecipes: () => void;
  clearGeneratedRecipes: () => void;
  addRecipe: (formData: FormData) => Promise<void>;
  deleteRecipe: (id: number) => Promise<void>;
}

const useRecipeStore = create<RecipeStore>()(
  persist(
    (set) => ({
      recipes: [],
      generatedRecipes: [],
      error: "",

      setRecipes: (recipes) => set({ recipes }),
      setGeneratedRecipes: (recipes) => set({ generatedRecipes: recipes }),

      clearRecipes: () => set({ recipes: [] }),
      clearGeneratedRecipes: () => set({ generatedRecipes: [] }),

      fetchRecipes: async () => {
        try {
          const recipes = await fetchRecipesService();
          
          set({ recipes, error: "" });
        } catch (err) {
          set({ error: "Failed to fetch recipes" });
        }
      },

      addRecipe: async (formData) => {
        
        try {
          const newRecipe = await addRecipeService(formData);
          
          set((state) => ({
            recipes: [...state.recipes, newRecipe],
            error: "",
          }));
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      deleteRecipe: async (id) => {
        try {
          await deleteRecipeService(id);
          set((state) => ({
            recipes: state.recipes.filter((recipe) => recipe.id !== id),
            error: "",
          }));
        } catch (err: any) {
          set({ error: err.message });
        }
      },
    }),
    {
      name: "recipe-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useRecipeStore;
