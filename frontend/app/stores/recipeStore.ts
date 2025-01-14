/* eslint-disable */
import { create } from "zustand";

export interface InstructionStep {
  stepNumber: number;
  description: string;
}

export interface Recipe {
  id: number;
  name: string;
  instructions: InstructionStep[];
  imageUrl: string;
  ingredients: { id: number; name: string; quantity: number; }[];
}

interface RecipeStore {
  recipes: Recipe[];
  error: string;
  fetchRecipes: () => Promise<void>;
  addRecipe: (formData: FormData) => Promise<void>;
  deleteRecipe: (id: number) => void;
}

const useRecipeStore = create<RecipeStore>((set) => ({
  recipes: [],
  error: "",

  fetchRecipes: async () => {
    try {
      const res = await fetch("http://localhost:8080/admin/recipes");
      const data = await res.json();

      const formattedData = data.map((recipe: any) => ({
        id: recipe.id,
        name: recipe.name,
        instructions: recipe.instructions.map((step: any) => ({
          stepNumber: step.stepNumber,
          description: step.description
        })),
        imageUrl: recipe.image_url,
        ingredients: recipe.ingredients.map((ingredient: any) => ({
          id: ingredient.ingredient_id,
          quantity: ingredient.quantity_required
        }))
      }));

      console.log(formattedData);


      set({ recipes: formattedData, error: "" });

    } catch {
      set({ error: "Failed to fetch recipes" });
    }
  },

  addRecipe: async (formData) => {
    try {
      console.log("Sending Recipe Data:", Object.fromEntries(formData.entries()));
      const res = await fetch("http://localhost:8080/admin/recipes", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to add recipe");

      const newRecipe = await res.json();
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
      const res = await fetch(`http://localhost:8080/admin/recipes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete recipe");

      set((state) => ({ recipes: state.recipes.filter(recipe => recipe.id !== id), error: "" }));
    } catch (err: any) {
      set({ error: err.message });
    }
  }
}));

export default useRecipeStore;
