/* eslint-disable */
import { create } from "zustand";

// 管理画面で使用する具材用の型
export interface Ingredient {
  id: number;
  name: string;
  genre: string;
  imageUrl: string;
  quantity: number;
}

interface IngredientStore {
  ingredients: Ingredient[];
  error: string;
  newIngredient: { name: string; imageUrl: File | null, genre: string };
  fetchIngredients: () => void;
  addIngredient: (name: string, imageUrl: File, genre: string) => void;
  deleteIngredient: (id: number) => void;
  setNewIngredient: (name: string, imageUrl: File | null, genre: string) => void;
  increaseIngredientQuantity: (id: number) => void;
  decreaseIngredientQuantity: (id: number) => void;
}

const useIngredientStore = create<IngredientStore>((set, get) => ({
  ingredients: [],
  error: "",
  newIngredient: { name: "", imageUrl: null, genre: "" },
  fetchIngredients: async () => {
    try {
      const res = await fetch("http://localhost:8080/admin/ingredients");
      const data = await res.json();

      const formattedIngredients = data.map((ingredient: any) => ({
        ...ingredient,
        imageUrl: ingredient.image_url,
      }));

      set({ ingredients: formattedIngredients, error: "" });
    } catch {
      set({ error: "Failed to fetch ingredients" });
    }
  },
  addIngredient: async (name, imageUrl, genre) => {

    if (!name.trim() || !imageUrl || !genre.trim()) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", imageUrl);
    formData.append("genre", genre);

    // FormDataの内容をログに出力
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const res = await fetch("http://localhost:8080/admin/ingredients", {
        method: "POST",
        body: formData,
      });

      if (res.status === 409) throw new Error("Ingredient already exists");
      if (!res.ok) throw new Error("Failed to add ingredient");

      const ingredient = await res.json();
      set((state) => ({
        ingredients: [...state.ingredients, ingredient],
        newIngredient: { name: "", imageUrl: null, genre: "その他" },
        error: "",
      }));
      await get().fetchIngredients(); //具材追加後にリストを更新
    } catch (err: any) {
      set({ error: err.message });
    }
  },
  deleteIngredient: async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/admin/ingredients/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete ingredient");

      set((state) => ({
        ingredients: state.ingredients.filter((ingredient) => ingredient.id !== id),
        error: "",
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },
  setNewIngredient: (name, imageUrl, genre) => set({ newIngredient: { name, imageUrl, genre } }),
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
