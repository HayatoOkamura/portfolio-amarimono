/* eslint-disable */
import { create } from "zustand";
import { Ingredient, EditIngredient } from "@/app/types/index";
import { persist, createJSONStorage } from "zustand/middleware";
import { backendUrl } from "../utils/api";

interface IngredientStore {
  ingredients: Ingredient[];
  selectedOrder: number[]; // 選択順序を管理する配列
  error: string | null;
  newIngredient: EditIngredient;
  setIngredients: (ingredients: Ingredient[]) => void;
  setError: (error: string | null) => void;
  updateQuantity: (id: number, quantity: number) => void;
  editIngredient: (ingredient: Ingredient) => void;
  setNewIngredient: (ingredient: EditIngredient) => void;
  addIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: number) => void;
  removeIngredient: (id: number) => void;
  fetchIngredients: () => Promise<void>;
}

const useIngredientStore = create<IngredientStore>()(
  persist(
    (set, get) => ({
      ingredients: [],
      selectedOrder: [], // 選択順序を管理する配列
      error: null,
      newIngredient: {
        id: 0,
        name: "",
        genre: { id: 0, name: "" },
        unit: { id: 0, name: "", description: "", step: 1 },
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
        set((state) => {
          const existingIngredient = state.ingredients.find(ing => ing.id === ingredient.id);
          if (existingIngredient) {
            // 既存の具材を更新
            const newIngredients = state.ingredients.map(ing =>
              ing.id === ingredient.id ? { ...ing, quantity: ingredient.quantity } : ing
            );
            return { 
              ingredients: newIngredients,
              selectedOrder: [...state.selectedOrder, ingredient.id] // 選択順序に追加
            };
          } else {
            // 新しい具材を追加
            return { 
              ingredients: [...state.ingredients, ingredient],
              selectedOrder: [...state.selectedOrder, ingredient.id] // 選択順序に追加
            };
          }
        });
      },
      deleteIngredient: (id: number) => {
        set((state) => ({
          ingredients: state.ingredients.filter(ing => ing.id !== id)
        }));
      },
      removeIngredient: (id: number) => {
        set((state) => ({
          ingredients: state.ingredients.filter(ing => ing.id !== id),
          selectedOrder: state.selectedOrder.filter(orderId => orderId !== id) // 選択順序から削除
        }));
      },
      fetchIngredients: () => {
        return Promise.resolve();
      },
    }),
    {
      name: "ingredient-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ingredients: state.ingredients,
        selectedOrder: state.selectedOrder, // 選択順序も永続化
      }),
    }
  )
);

export default useIngredientStore;
