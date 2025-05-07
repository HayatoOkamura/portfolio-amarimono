/* eslint-disable */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Recipe, NewRecipe } from "../types/index";
import { backendUrl } from "../utils/api";

export type SortOption = "rating_desc" | "cost_asc" | "time_asc" | "calorie_asc";

interface RecipeStore {
  recipes: Recipe[];
  generatedRecipes: Recipe[];
  error: string;
  newRecipe: NewRecipe;
  sortBy: SortOption;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  setRecipes: (recipes: Recipe[]) => void;
  setGeneratedRecipes: (recipes: Recipe[]) => void;
  clearRecipes: () => void;
  clearGeneratedRecipes: () => void;
  setNewRecipe: (updates: Partial<NewRecipe>) => void;
  resetNewRecipe: () => void;
  setError: (error: string) => void;
  setSortBy: (sortBy: SortOption) => void;
  searchType: "ingredients" | "name" | null;
  setSearchType: (type: "ingredients" | "name" | null) => void;
  query: string;
  setQuery: (query: string) => void;
  searchExecuted: boolean;
  setSearchExecuted: (executed: boolean) => void;
  addRecipe: (formData: FormData) => Promise<void>;
}

const initialNewRecipe: NewRecipe = {
  name: "",
  instructions: [{ step: 1, description: "", imageURL: undefined }],
  image: undefined,
  genre: { id: 1, name: "すべて" },
  cookingTime: 0,
  costEstimate: 0,
  summary: "",
  catchphrase: "",
  nutrition: {
    calories: 0,
    carbohydrates: 0,
    fat: 0,
    protein: 0,
    sugar: 0,
    salt: 0,
  },
  ingredients: [],
  isPublic: true,
  isDraft: false,
};

const useRecipeStore = create<RecipeStore>()(
  persist(
    (set, get) => ({
      recipes: [],
      generatedRecipes: [],
      error: "",
      newRecipe: initialNewRecipe,
      sortBy: "rating_desc",
      searchType: "ingredients",
      query: "",
      selectedRecipe: null,
      setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),
      setSearchType: (type) => set({ searchType: type }),
      setQuery: (query) => set({ query }),
      setRecipes: (recipes) => set({ recipes }),
      setGeneratedRecipes: (recipes) => set({ generatedRecipes: recipes }),
      setSortBy: (sortBy) => set({ sortBy }),
      clearRecipes: () => set({ recipes: [] }),
      clearGeneratedRecipes: () => set({ generatedRecipes: [] }),
      setError: (error) => set({ error }),

      setNewRecipe: (updates) =>
        set((state) => ({
          newRecipe: { ...state.newRecipe, ...updates },
        })),

      resetNewRecipe: () =>
        set({
          newRecipe: initialNewRecipe,
        }),

      searchExecuted: false,
      setSearchExecuted: (executed) => set({ searchExecuted: executed }),

      addRecipe: async (formData: FormData) => {
        try {
          const response = await fetch(`${backendUrl}/api/recipes`, {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) throw new Error('Failed to add recipe');
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add recipe' });
        }
      },
    }),
    {
      name: "recipe-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        recipes: state.recipes,
        searchType: null,
        query: "",
        searchExecuted: false,
        selectedRecipe: null,
        generatedRecipes: [],
      }),
    }
  )
);

export default useRecipeStore;
