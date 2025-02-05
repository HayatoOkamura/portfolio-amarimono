/* eslint-disable */
"use client";

import useIngredientStore from "../../stores/ingredientStore";
import useGenreStore from "../../stores/genreStore";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AdminIngredients = () => {
  const {
    ingredients,
    error,
    newIngredient,
    fetchIngredients,
    addIngredient,
    deleteIngredient,
    setNewIngredient,
  } = useIngredientStore();

  const {
    ingredientGenres,
    fetchIngredientGenres,
    error: genreError,
  } = useGenreStore();

  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState<number | string>("すべて");
  const [inputError, setInputError] = useState<string>("");
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  // 初回レンダリング時にデータを取得
  useEffect(() => {
    const initializeData = async () => {
      await fetchIngredientGenres();
      fetchIngredients();
      
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    console.log(selectedGenre);
    console.log(ingredients.filter((ing) => ing.genre.name));
    
    
  }, [selectedGenre]);

  // ジャンルごとに具材をフィルタリング
  const filteredIngredients =
    selectedGenre === "すべて"
      ? ingredients
      : ingredients.filter((ing) => ing.genre.id === selectedGenre);

  // 入力を確認してエラーを設定
  const handleAddIngredient = () => {
    if (
      !newIngredient.name ||
      !newIngredient.genre ||
      !newIngredient.imageUrl
    ) {
      setInputError("名前、ジャンル、画像はすべて必須です。");
      return;
    }
    console.log(newIngredient);

    setInputError(""); // エラーをクリア
    if (newIngredient.genre) {
      addIngredient(
        newIngredient.name,
        newIngredient.imageUrl,
        newIngredient.genre
      );
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Ingredients</h1>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      {/* TOPページに戻るボタン */}
      <div className="text-center mb-6">
        <button
          onClick={() => router.push("/")}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition"
        >
          Go to TOP Page
        </button>
      </div>

      {/* ジャンル選択 */}
      <div className="mb-6 text-center">
        <select
          value={selectedGenre}
          onChange={(e) =>
            setSelectedGenre(
              e.target.value === "すべて" ? "すべて" : parseInt(e.target.value)
            )
          }
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        >
          <option value="すべて">すべて</option>
          {ingredientGenres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      <ul className="grid gap-6 grid-cols-3 lg:grid-cols-4">
        {filteredIngredients.map((ing: any, index: number) => (
          <li
            key={index}
            className="bg-white shadow rounded-lg p-5 flex flex-col items-center gap-4"
          >
            <p className="text-gray-400">{ing.genre.name}</p>
            <div className="block relative aspect-video w-full">
              <Image
                fill
                src={
                  ing.imageUrl
                    ? `${backendUrl}/${ing.imageUrl}`
                    : "/default-image.jpg"
                }
                alt={ing.name ? ing.name : ""}
                className="object-cover"
                unoptimized
              />
            </div>
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
            value={newIngredient.genre?.id || ""}
            onChange={(e) =>
              setNewIngredient(
                newIngredient.name,
                newIngredient.imageUrl,
                ingredientGenres.find(
                  (g) => g.id === parseInt(e.target.value)
                ) || null
              )
            }
            className="w-full md:w-1/3 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value="">ジャンルを選択</option>
            {ingredientGenres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
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
            onClick={handleAddIngredient}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Add Ingredient
          </button>
        </div>
        {inputError && <p className="text-red-500 mt-4">{inputError}</p>}
      </div>
    </div>
  );
};

export default AdminIngredients;
