/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import useIngredientStore from "./stores/ingredientStore";
import { fetchRecipesAPI } from "./hooks/useRecipes";

const IngredientSelector = () => {
  const {
    ingredients,
    fetchIngredients,
    increaseIngredientQuantity,
    decreaseIngredientQuantity,
  } = useIngredientStore();

  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const [recipes, setRecipes] = useState<
    { id: number; name: string; instructions: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 初回レンダリング時に具材を取得
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  // ジャンルごとに具材をフィルタリング
  const filteredIngredients =
    selectedGenre === "すべて"
      ? ingredients
      : ingredients.filter((ing) => ing.genre === selectedGenre);

  const fetchRecipes = async () => {
    setLoading(true);
    setError("");

    try {
      const filteredIngredients = ingredients
        .filter((ingredient) => ingredient.quantity > 0)
        .map(({ id, quantity }) => ({ id, quantity }));

      const response = await fetchRecipesAPI(filteredIngredients); // 新規関数の使用
      setRecipes(response); // レシピを更新
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
      setRecipes([]); // エラー時にレシピをクリア
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
    <h1 className="text-2xl font-bold mb-6 text-center">Recipe Generator</h1>

    {/* ジャンル選択 */}
    <div className="mb-6 text-center">
      <select
        value={selectedGenre}
        onChange={(e) => setSelectedGenre(e.target.value)}
        className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
      >
        <option value="すべて">すべて</option>
        <option value="野菜">野菜</option>
        <option value="果物">果物</option>
        <option value="肉">肉</option>
        <option value="魚介類">魚介類</option>
        <option value="穀物">穀物</option>
        <option value="乳製品">乳製品</option>
        <option value="調味料">調味料</option>
        <option value="その他">その他</option>
      </select>
    </div>

    {/* 具材一覧 */}
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredIngredients.map((ing: any, index: number) => (
        <li
          key={index}
          className="bg-white shadow rounded-lg p-10 flex flex-col items-center gap-4"
        >
          <p className="text-gray-400">{ing.genre}</p>
          <img
            src={
              ing.image_url
                ? `${backendUrl}${ing.image_url}`
                : "/default-image.jpg"
            }
            alt={ing.name}
            className="w-full object-cover rounded-full"
          />
          <p className="text-2xl font-semibold text-gray-600">{ing.name}</p>
          <div className="flex items-center gap-4">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              onClick={() => increaseIngredientQuantity(ing.id)}
            >
              +
            </button>
            <p className="text-gray-600">{ing.quantity}</p>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              onClick={() => decreaseIngredientQuantity(ing.id)}
            >
              -
            </button>
          </div>
        </li>
      ))}
    </ul>

    {/* レシピ生成ボタン */}
    <div className="text-center mt-8">
      <button
        onClick={fetchRecipes}
        className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition"
      >
        Generate Recipes
      </button>
    </div>

    {/* レシピの表示 */}
    {loading && <p className="text-center mt-4">Loading recipes...</p>}
    {error && <p className="text-center text-red-500 mt-4">{error}</p>}

    <h2 className="text-xl font-bold mt-8">Recipes</h2>
    {Array.isArray(recipes) && recipes.length > 0 ? (
      <ul className="mt-4">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="mb-4">
            <h3 className="text-lg font-semibold">{recipe.name}</h3>
            <p>{recipe.instructions}</p>
          </li>
        ))}
      </ul>
    ) : (
      !loading && <p className="text-center mt-4">No recipes found</p>
    )}
  </div>
  );
};

export default IngredientSelector;
