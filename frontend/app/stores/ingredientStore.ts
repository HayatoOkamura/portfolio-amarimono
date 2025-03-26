/* eslint-disable */
import { create } from "zustand";
import { Ingredient, EditIngredient } from "../types";
import { useIngredients, useUpdateIngredientQuantity } from "../hooks/ingredients";

interface IngredientStore {
  ingredients: Ingredient[];
  error: string | null;
  newIngredient: EditIngredient;
  setIngredients: (ingredients: Ingredient[]) => void;
  setError: (error: string | null) => void;
  updateQuantity: (id: number, quantity: number) => void;
  editIngredient: (ingredient: Ingredient) => void;
  setNewIngredient: (ingredient: EditIngredient) => void;
}

const useIngredientStore = create<IngredientStore>()((set, get) => ({
  ingredients: [],
  error: null,
  newIngredient: {} as EditIngredient,
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
}));

export default useIngredientStore;
