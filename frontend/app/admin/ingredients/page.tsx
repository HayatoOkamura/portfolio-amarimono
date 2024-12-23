/* eslint-disable */
"use client";

import useIngredientStore from "../../stores/ingredientStore";
import { useEffect, useState } from "react";

const IngredientsPage = () => {
  const {
    ingredients,
    error,
    newIngredient,
    fetchIngredients,
    addIngredient,
    deleteIngredient,
    setNewIngredient,
  } = useIngredientStore();

  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  // 初回レンダリング時に具材を取得
  useEffect(() => {
    fetchIngredients();
  }, []);

  // ジャンルごとに具材をフィルタリング
  const filteredIngredients = selectedGenre === "すべて" 
    ? ingredients 
    : ingredients.filter(ing => ing.genre === selectedGenre);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Ingredients</h1>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

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

      <ul className="grid gap-6 grid-cols-3 lg:grid-cols-4">
        {filteredIngredients.map((ing: any, index: number) => (
          <li
            key={index}
            className="bg-white shadow rounded-lg p-5 flex flex-col items-center gap-4"
          >
            <p className="text-gray-400">
              {ing.genre}
            </p>
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
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              onClick={() => deleteIngredient(ing.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Add New Ingredient</h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <input
            type="text"
            value={newIngredient.name}
            placeholder="Ingredient Name"
            onChange={(e) =>
              setNewIngredient(
                e.target.value,
                newIngredient.imageUrl,
                newIngredient.genre
              )
            }
            className="w-full md:w-1/3 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <select
            value={newIngredient.genre}
            onChange={(e) =>
              setNewIngredient(
                newIngredient.name,
                newIngredient.imageUrl,
                e.target.value
              )
            }
            className="w-full md:w-1/3 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value="野菜">野菜</option>
            <option value="果物">果物</option>
            <option value="肉">肉</option>
            <option value="魚介類">魚介類</option>
            <option value="穀物">穀物</option>
            <option value="乳製品">乳製品</option>
            <option value="調味料">調味料</option>
            <option value="その他">その他</option>
          </select>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files ? e.target.files[0] : null;
              setNewIngredient(newIngredient.name, file, newIngredient.genre);
            }}
            className="w-full md:w-1/3 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              if (newIngredient.imageUrl) {
                addIngredient(
                  newIngredient.name,
                  newIngredient.imageUrl,
                  newIngredient.genre
                );
              } else {
                console.error("No image file selected.");
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Add Ingredient
          </button>
        </div>
      </div>
    </div>
  );
};

export default IngredientsPage;
