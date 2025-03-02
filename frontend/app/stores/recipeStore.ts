/* eslint-disable */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Recipe, NewRecipe } from "../types";
import {
  fetchRecipesService,
  addRecipeService,
  deleteRecipeService,
  updateRecipeService,
  fetchUserRecipes,
} from "../hooks/recipes";

interface RecipeStore {
  recipes: Recipe[];
  generatedRecipes: Recipe[];
  error: string;
  newRecipe: NewRecipe;
  fetchRecipes: () => Promise<void>;
  fetchUserRecipes: (token: string) => Promise<void>;
  setGeneratedRecipes: (recipes: Recipe[]) => void;
  setRecipes: (recipes: Recipe[]) => void;
  clearRecipes: () => void;
  clearGeneratedRecipes: () => void;
  setNewRecipe: (updates: Partial<NewRecipe>) => void;
  resetNewRecipe: () => void;
  addRecipe: (formData: FormData, userId?: string, isPublic?: boolean) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  editRecipe: (id: string, formData: FormData) => Promise<void>;
}

const initialNewRecipe: NewRecipe = {
  name: "",
  instructions: [{ stepNumber: 1, description: "", image: null }],
  image: null,
  genre: "すべて",
  cookingTime: 0,
  reviews: 0,
  costEstimate: "",
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

      setRecipes: (recipes) => set({ recipes }),
      setGeneratedRecipes: (recipes) => set({ generatedRecipes: recipes }),

      clearRecipes: () => set({ recipes: [] }),
      clearGeneratedRecipes: () => set({ generatedRecipes: [] }),

      setNewRecipe: (updates) =>
        set((state) => ({
          newRecipe: { ...state.newRecipe, ...updates },
        })),

      resetNewRecipe: () =>
        set({
          newRecipe: {
            name: "",
            instructions: [{ stepNumber: 1, description: "", image: null }],
            image: null,
            genre: "すべて",
            cookingTime: 0,
            reviews: 0,
            costEstimate: "",
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
          },
        }),

      fetchRecipes: async () => {
        try {
          const recipes = await fetchRecipesService();

          set({ recipes, error: "" });
        } catch (err) {
          set({ error: "Failed to fetch recipes" });
        }
      },

      fetchUserRecipes: async (userId) => {
        try {
          const data = await fetchUserRecipes(userId);
          
          set({ recipes: data.recipes, error: "" });
        } catch (err) {
          set({ error: "Failed to fetch user recipes" });
        }
      },

      addRecipe: async (formData, userId, isPublic) => {
        try {
          if (userId) {
            formData.append("user_id", userId);
          }
          if (isPublic !== undefined) {
            formData.append("public", isPublic.toString());
          }
          const newRecipe = await addRecipeService(formData);
          console.log("取得したレシピ", { newRecipe, userId, isPublic });

          if (!newRecipe || !newRecipe.id || !newRecipe.name) {
            throw new Error("Invalid recipe data received");
          }

          set((state) => {
            return {
              recipes: [...state.recipes, newRecipe],
              error: "",
            }
          });
          await get().fetchRecipes();
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

      editRecipe: async (id, formData) => {
        try {
          const updatedRecipe = await updateRecipeService(id, formData);
          set((state) => ({
            recipes: state.recipes.map((recipe) =>
              recipe.id === id ? updatedRecipe : recipe
            ),
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
