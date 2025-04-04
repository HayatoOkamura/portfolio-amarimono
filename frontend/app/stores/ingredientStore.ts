/* eslint-disable */
import { create } from "zustand";
import { Ingredient, EditIngredient } from "@/app/types/index";
import { persist, createJSONStorage } from "zustand/middleware";
import { backendUrl } from "../utils/apiUtils";

interface IngredientStore {
  ingredients: Ingredient[];
  error: string | null;
  newIngredient: EditIngredient;
  setIngredients: (ingredients: Ingredient[]) => void;
  setError: (error: string | null) => void;
  updateQuantity: (id: number, quantity: number) => void;
  editIngredient: (ingredient: Ingredient) => void;
  setNewIngredient: (ingredient: EditIngredient) => void;
  addIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: number) => void;
  fetchIngredients: () => Promise<void>;
}

const useIngredientStore = create<IngredientStore>()(
  persist(
    (set, get) => ({
      ingredients: [],
      error: null,
      newIngredient: {
        name: "",
        genre: null,
        unit: null,
        imageUrl: null,
        quantity: 0
      } as EditIngredient,
      setIngredients: (ingredients: Ingredient[]) => set({ ingredients }),
      setError: (error: string | null) => set({ error }),
      updateQuantity: (id: number, quantity: number) => {
        set((state) => {
          const newIngredients = state.ingredients.map((ing) =>
            ing.id === id ? { ...ing, quantity } : ing
          );
          return { ingredients: newIngredients };
        });
      },
      editIngredient: (ingredient: Ingredient) => {
        set({ newIngredient: ingredient as EditIngredient });
      },
      setNewIngredient: (ingredient: EditIngredient) => {
        set({ newIngredient: ingredient });
      },
      addIngredient: (ingredient: Ingredient) => {
        set((state) => ({
          ingredients: [...state.ingredients, ingredient]
        }));
      },
      deleteIngredient: (id: number) => {
        set((state) => ({
          ingredients: state.ingredients.filter(ing => ing.id !== id)
        }));
      },
      fetchIngredients: () => {
        // APIリクエストはhooksで行うため、ここでは何もしない
        return Promise.resolve();
      },
    }),
    {
      name: "ingredient-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ingredients: state.ingredients,
      }),
    }
  )
);

export default useIngredientStore;
