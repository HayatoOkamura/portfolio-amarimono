/* eslint-disable */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Ingredient, Genre, Unit, NewIngredient, EditIngredient } from "../types";
import {
  fetchIngredientsService,
  addIngredientService,
  deleteIngredientService,
  updateIngredientService,
} from "../hooks/ingredients";

interface IngredientStore {
  ingredients: Ingredient[];
  error: string | null;
  newIngredient: NewIngredient;
  fetchIngredients: () => Promise<void>;
  addIngredient: (name: string, imageUrl: File, genre: Genre, unit: Unit) => Promise<void>;
  deleteIngredient: (id: number) => Promise<void>;
  setNewIngredient: (name: string, imageUrl: File | null, genre: Genre | null, unit: Unit | null) => void;
  editIngredient: (updatedData: EditIngredient) => Promise<void>;
  updateQuantity: (id: number, delta: number) => void;
}

const useIngredientStore = create<IngredientStore>()(
  persist(
    (set, get) => ({
      ingredients: [],
      error: "",
      newIngredient: { name: "", imageUrl: null, genre: null, unit: null },

      editIngredient: async (updatedData: EditIngredient) => { 
        try {
          const updatedIngredient = await updateIngredientService(updatedData.id, updatedData);

          // 更新した具材情報をingredientsリストに反映
          set((state) => ({
            ingredients: state.ingredients.map((ingredient) =>
              ingredient.id === updatedData.id ? { ...ingredient, ...updatedIngredient } : ingredient
            ),
          }));
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      fetchIngredients: async () => {
        try {
          const ingredients = await fetchIngredientsService();
          set({ ingredients, error: "" });
        } catch (err) {
          set({ error: "Failed to fetch ingredients" });
        }
      },

      addIngredient: async (name, imageUrl, genre, unit) => {
        try {
          const newIngredient = await addIngredientService(name, imageUrl, genre, unit);

          set((state) => ({
            ingredients: [...state.ingredients, newIngredient],
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

      setNewIngredient: (name, imageUrl, genre, unit) => {
        set((state) => ({
          newIngredient: {
            ...state.newIngredient,
            name,
            imageUrl,
            genre,
            unit,
          },
        }));
      },

      updateQuantity: (id, delta) =>
        set((state) => ({
          ingredients: state.ingredients.map((ingredient) =>
            ingredient.id === id
              ? {
                ...ingredient,
                quantity: Math.max(ingredient.quantity + delta, 0), // 負の値にならないよう制御
              }
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
