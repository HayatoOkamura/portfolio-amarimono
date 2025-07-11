/* eslint-disable */
import { create } from "zustand";
import { Ingredient, EditIngredient } from "@/app/types/index";
import { persist, createJSONStorage } from "zustand/middleware";
import { backendUrl } from "../utils/api";

export type SearchMode = 
  | 'exact_with_quantity'     // 完全一致（数量考慮）
  | 'exact_without_quantity'  // 完全一致（数量無視）
  | 'partial_with_quantity'   // 部分一致（数量考慮）
  | 'partial_without_quantity'; // 部分一致（数量無視）

interface IngredientStore {
  ingredients: Ingredient[];
  selectedOrder: number[]; // 選択順序を管理する配列
  ignoreQuantity: boolean; // 数量を無視するフラグ（後方互換性のため）
  searchMode: SearchMode; // 検索モード
  error: string | null;
  newIngredient: EditIngredient;
  setIngredients: (ingredients: Ingredient[]) => void;
  setError: (error: string | null) => void;
  setIgnoreQuantity: (ignore: boolean) => void;
  setSearchMode: (mode: SearchMode) => void;
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
    (set, get) => {
      return {
        ingredients: [],
        selectedOrder: [], // 選択順序を管理する配列
        ignoreQuantity: false, // 数量を無視するフラグ（後方互換性のため）
        searchMode: 'partial_without_quantity', // デフォルトは部分一致（数量無視）
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
        setIgnoreQuantity: (ignore: boolean) => {
          // 後方互換性のため、ignoreQuantityの変更時にsearchModeも更新
          const newSearchMode: SearchMode = ignore ? 'exact_without_quantity' : 'exact_with_quantity';
          set({ ignoreQuantity: ignore, searchMode: newSearchMode });
        },
        setSearchMode: (mode: SearchMode) => {
          // searchModeの変更時にignoreQuantityも更新（後方互換性のため）
          const ignoreQuantity = mode === 'exact_without_quantity' || mode === 'partial_without_quantity';
          set({ searchMode: mode, ignoreQuantity });
        },
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
      };
    },
    {
      name: "ingredient-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ingredients: state.ingredients,
        selectedOrder: state.selectedOrder, // 選択順序も永続化
        ignoreQuantity: state.ignoreQuantity, // 数量無視フラグも永続化
        searchMode: state.searchMode, // 検索モードも永続化
      }),
    }
  )
);

export default useIngredientStore;
