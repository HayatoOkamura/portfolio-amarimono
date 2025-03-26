/* eslint-disable */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Recipe, NewRecipe } from "../types";
import {
  useAddRecipe,
  useDeleteRecipe,
  useUpdateRecipe,
} from "../hooks/recipes";

export type SortOption = "rating_desc" | "cost_asc" | "time_asc" | "calorie_asc";

interface RecipeStore {
  recipes: Recipe[];
  generatedRecipes: Recipe[];
  error: string;
  newRecipe: NewRecipe;
  sortBy: SortOption;
  setGeneratedRecipes: (recipes: Recipe[]) => void;
  setRecipes: (recipes: Recipe[]) => void;
  clearRecipes: () => void;
  clearGeneratedRecipes: () => void;
  setNewRecipe: (updates: Partial<NewRecipe>) => void;
  resetNewRecipe: () => void;
  addRecipe: (formData: FormData, userId?: string, isPublic?: boolean) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  editRecipe: (id: string, formData: FormData) => Promise<void>;
  setSortBy: (sortBy: SortOption) => void;
  searchType: "ingredients" | "name" | null;
  setSearchType: (type: "ingredients" | "name" | null) => void;
  query: string;
  setQuery: (query: string) => void;
}

const initialNewRecipe: NewRecipe = {
  name: "",
  instructions: [{ stepNumber: 1, description: "", image: null }],
  image: null,
  genre: "すべて",
  cookingTime: 0,
  reviews: [],
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
  faq: [{ question: "", answer: "" }],
  selectedIngredients: [],
  userId: "",
  isPublic: true,
};

const useRecipeStore = create<RecipeStore>()(
  persist(
    (set, get) => ({
      recipes: [],
      generatedRecipes: [],
      error: "",
      newRecipe: initialNewRecipe,
      sortBy: "rating_desc",
      searchType: null,
      setSearchType: (type) => set({ searchType: type }),
      query: "",
      setQuery: (query) => set({ query }),

      setRecipes: (recipes) => set({ recipes }),
      setGeneratedRecipes: (recipes) => set({ generatedRecipes: recipes }),

      setSortBy: (sortBy) => set({ sortBy }),

      clearRecipes: () => set({ recipes: [] }),
      clearGeneratedRecipes: () => set({ generatedRecipes: [] }),

      setNewRecipe: (updates) =>
        set((state) => ({
          newRecipe: { ...state.newRecipe, ...updates },
        })),

      resetNewRecipe: () =>
        set({
          newRecipe: initialNewRecipe,
        }),

      addRecipe: async (formData, userId, isPublic) => {
        try {
          const addRecipeMutation = useAddRecipe();
          await addRecipeMutation.mutateAsync({ formData, userId, isPublic });
          set({ error: "" });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      deleteRecipe: async (id) => {
        try {
          const deleteRecipeMutation = useDeleteRecipe();
          await deleteRecipeMutation.mutateAsync(id);
          set({ error: "" });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      editRecipe: async (id, formData) => {
        try {
          const updateRecipeMutation = useUpdateRecipe();
          await updateRecipeMutation.mutateAsync({ id, formData });
          set({ error: "" });
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
