/* eslint-disable */
import { create } from "zustand";

// 管理画面で使用する具材用の型
export interface Ingredient {
  id: number;
  name: string;
  quantity: number;
}

interface IngredientStore {
  ingredients: Ingredient[];
  error: string;
  newIngredient: string;
  fetchIngredients: () => void;
  addIngredient: (name: string) => void;
  setNewIngredient: (name: string) => void;
  increaseIngredientQuantity: (id: number) => void;
  decreaseIngredientQuantity: (id: number) => void;
}

const useIngredientStore = create<IngredientStore>((set, get) => ({
  ingredients: [],
  error: "",
  newIngredient: "",
  fetchIngredients: async () => {
    try {
      const res = await fetch("http://localhost:8080/admin/ingredients");
      const data = await res.json();
      set({ ingredients: data, error: "" });
    } catch {
      set({ error: "Failed to fetch ingredients" });
    }
  },
  addIngredient: async (name) => {
    if (!name.trim()) return;

    try {
      const res = await fetch("http://localhost:8080/admin/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      
      if (res.status === 409) throw new Error("Ingredient already exists");
      
      const ingredient = await res.json();
      set((state) => ({
        ingredients: [...state.ingredients, ingredient],
        newIngredient: "",
        error: "",
      }));
      await get().fetchIngredients();
    } catch (err: any) {
      set({ error: err.message });
    }
  },
  setNewIngredient: (name) => set({ newIngredient: name }),
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
}));

export default useIngredientStore;
