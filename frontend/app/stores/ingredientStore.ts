/* eslint-disable */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Ingredient, Genre } from "../types";
import {
  fetchIngredientsService,
  addIngredientService,
  deleteIngredientService,
} from "../hooks/ingredients";

interface IngredientStore {
  ingredients: Ingredient[];
  error: string;
  newIngredient: { name: string; imageUrl: File | null; genre: Genre | null };
  fetchIngredients: () => Promise<void>;
  addIngredient: (name: string, imageUrl: File, genre: Genre) => Promise<void>;
  deleteIngredient: (id: number) => Promise<void>;
  setNewIngredient: (name: string, imageUrl: File | null, genre: Genre | null) => void;
  increaseIngredientQuantity: (id: number) => void;
  decreaseIngredientQuantity: (id: number) => void;
}

const useIngredientStore = create<IngredientStore>()(
  persist(
    (set, get) => ({
      ingredients: [],
      error: "",
      newIngredient: { name: "", imageUrl: null, genre: null },

      fetchIngredients: async () => {
        try {
          const ingredients = await fetchIngredientsService();
          set({ ingredients, error: "" });
        } catch (err) {
          set({ error: "Failed to fetch ingredients" });
        }
      },

      addIngredient: async (name, imageUrl, genre) => {
        try {
          const newIngredient = await addIngredientService(name, imageUrl, genre);
          console.log("newIngredient", newIngredient);
          
          
          set((state) => ({
            ingredients: [...state.ingredients, newIngredient],
            newIngredient: { name: "", imageUrl: null, genre: null },
            error: "",
          }));
          await get().fetchIngredients(); // Ingredient added, update list
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      deleteIngredient: async (id) => {
        try {
          await deleteIngredientService(id);
          set((state) => ({
            ingredients: state.ingredients.filter(
              (ingredient) => ingredient.id !== id
            ),
            error: "",
          }));
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      setNewIngredient: (name, imageUrl, genre) => {
        set({ newIngredient: { name, imageUrl, genre } });
      },

      increaseIngredientQuantity: (id) =>
        set((state) => ({
          ingredients: state.ingredients.map((ingredient) =>
            ingredient.id === id
              ? { ...ingredient, quantity: ingredient.quantity + 1 }
              : ingredient
          ),
        })),

      decreaseIngredientQuantity: (id) =>
        set((state) => ({
          ingredients: state.ingredients.map((ingredient) =>
            ingredient.id === id && ingredient.quantity > 0
              ? { ...ingredient, quantity: ingredient.quantity - 1 }
              : ingredient
          ),
        })),
    }),
    {
      name: "ingredient-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useIngredientStore;
