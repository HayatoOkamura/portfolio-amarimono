/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import useRecipeStore from "../../stores/recipeStore";
import useIngredientStore from "../../stores/ingredientStore";
import useGenreStore from "../../stores/genreStore";
import { Genre } from "@/app/types";

const RecipeList = () => {
  const { recipes, fetchRecipes, addRecipe, deleteRecipe } = useRecipeStore();
  const { ingredients, fetchIngredients } = useIngredientStore();
  const { recipeGenres, fetchRecipeGenres, error } = useGenreStore();

  const [newRecipeName, setNewRecipeName] = useState("");
  const [newRecipeInstructions, setNewRecipeInstructions] = useState([
    { step_number: 1, description: "" },
  ]);
  const [newRecipeImage, setNewRecipeImage] = useState<File | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<
    { id: number; quantity: number }[]
  >([]);
  const [newRecipeGenre, setNewRecipeGenre] = useState<number | string>(
    "すべて"
  );
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  useEffect(() => {
    fetchRecipes();
    fetchIngredients();
    fetchRecipeGenres();
  }, [fetchRecipes, fetchIngredients, fetchRecipeGenres]);

  const handleAddRecipe = async () => {
    if (
      !newRecipeName ||
      !newRecipeInstructions ||
      !newRecipeImage ||
      selectedIngredients.length === 0 ||
      newRecipeGenre === "すべて"
    ) {
      alert("Please fill in all fields.");
      return;
    }

    // FormData の作成
    const formData = new FormData();
    formData.append("name", newRecipeName);
    formData.append("instructions", JSON.stringify(newRecipeInstructions));
    formData.append(
      "ingredients",
      JSON.stringify(
        selectedIngredients.map((ingredient) => ({
          ingredient_id: ingredient.id,
          quantity_required: ingredient.quantity,
        }))
      )
    );
    formData.append("genre", newRecipeGenre.toString());
    formData.append("image", newRecipeImage); // ファイルを直接追加

    // FormData の内容を確認
    console.log("FormData 内容:");
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    // サーバーに送信
    await addRecipe(formData);

    // フォームのリセット
    setNewRecipeName("");
    setNewRecipeInstructions([{ step_number: 1, description: "" }]);
    setSelectedIngredients([]);
    setNewRecipeGenre("すべて");
    fetchRecipes();
  };

  const handleDeleteRecipe = async (id: number) => {
    if (confirm("Are you sure you want to delete this recipe?")) {
      await deleteRecipe(id);
      fetchRecipes();
    }
  };

  const handleInstructionChange = (index: number, value: string) => {
    setNewRecipeInstructions((prev) => {
      const updatedInstructions = [...prev];
      updatedInstructions[index].description = value;
      return updatedInstructions;
    });
  };

  const addInstructionStep = () => {
    setNewRecipeInstructions((prev) => [
      ...prev,
      { step_number: prev.length + 1, description: "" },
    ]);
  };

  const handleIngredientQuantityChange = (id: number, quantity: number) => {
    setSelectedIngredients((prev) =>
      prev.some((ingredient) => ingredient.id === id)
        ? prev.map((ingredient) =>
            ingredient.id === id ? { ...ingredient, quantity } : ingredient
          )
        : [...prev, { id, quantity }]
    );
  };

  const getIngredientName = (id: number) => {
    const ingredient = ingredients.find((ingredient) => ingredient.id === id);
    return ingredient ? ingredient.name : "Unknown Ingredient";
  };

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-3xl font-bold mb-6 text-center">Recipe List</h2>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-6 max-w-lg mx-auto">
        <input
          type="text"
          placeholder="Recipe Name"
          value={newRecipeName}
          onChange={(e) => setNewRecipeName(e.target.value)}
          className="border p-2 mb-2 w-full rounded text-gray-700"
        />

        {newRecipeInstructions.map((instruction, index) => (
          <textarea
            key={index}
            placeholder={`Step ${instruction.step_number}`}
            value={instruction.description}
            onChange={(e) => handleInstructionChange(index, e.target.value)}
            className="border p-2 mb-2 w-full rounded text-gray-700"
          ></textarea>
        ))}

        <select
          value={newRecipeGenre}
          onChange={(e) =>
            setNewRecipeGenre(
              e.target.value === "すべて" ? "すべて" : Number(e.target.value)
            )
          }
          className="border p-2 mb-2 w-full rounded text-gray-700"
        >
          <option value="すべて">Select Genre</option>
          {recipeGenres.length > 0 &&
            recipeGenres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
        </select>

        <button
          onClick={addInstructionStep}
          className="bg-green-500 text-white px-4 py-2 rounded w-full mb-2"
        >
          Add Step
        </button>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setNewRecipeImage(e.target.files ? e.target.files[0] : null)
          }
          className="border p-2 mb-2 w-full rounded"
        />

        <h3 className="text-lg font-semibold mb-2">Select Ingredients</h3>
        <ul className="mb-4">
          {Array.isArray(ingredients) &&
            ingredients.map((ingredient) => (
              <li key={ingredient.id} className="flex items-center mb-2">
                <span className="mr-2 font-medium">{ingredient.name}</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  onChange={(e) =>
                    handleIngredientQuantityChange(
                      ingredient.id,
                      Number(e.target.value)
                    )
                  }
                  className="border p-2 w-16 rounded"
                />
              </li>
            ))}
        </ul>

        <button
          onClick={handleAddRecipe}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          Add Recipe
        </button>
      </div>

      <ul className="grid grid-cols-3 gap-3">
        {Array.isArray(recipes) &&
          recipes.map((recipe, index) => (
            <li key={index} className="p-6 rounded-lg shadow">
              <h4 className="text-xl font-bold mb-2">{recipe.name}</h4>
              {Array.isArray(recipe.instructions) &&
                recipe.instructions.map((step) => (
                  <p
                    key={step.stepNumber}
                  >{`Step ${step.stepNumber}: ${step.description}`}</p>
                ))}
              {recipe.imageUrl && (
                <div className="relative block aspect-video">
                  <Image
                    fill
                    src={
                      recipe.imageUrl
                        ? `${backendUrl}/${recipe.imageUrl}`
                        : "/default-image.jpg"
                    }
                    alt={recipe.name}
                    className="w-32 h-32 object-cover rounded mb-2"
                    unoptimized
                  />
                </div>
              )}
              {recipe.genre && recipe.genre.name && (
                <p>Genre: {recipe.genre.name}</p>
              )}

              <h5 className="font-semibold mt-4">Ingredients:</h5>
              <ul>
                {Array.isArray(recipe.ingredients) && recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id}>
                    {getIngredientName(ingredient.id)} - {ingredient.quantity}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleDeleteRecipe(recipe.id)}
                className="bg-red-500 text-white px-4 py-2 rounded mt-4"
              >
                Delete Recipe
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default RecipeList;
