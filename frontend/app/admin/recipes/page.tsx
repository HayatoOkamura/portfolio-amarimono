/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { backendUrl } from "@/app/utils/apiUtils";
import styles from "./recipe.module.scss";
import Image from "next/image";
import useRecipeStore from "../../stores/recipeStore";
import useIngredientStore from "../../stores/ingredientStore";
import useGenreStore from "../../stores/genreStore";
import { v4 as uuidv4 } from "uuid";
import { Ingredient, Instruction } from "@/app/types";
import RegistrationForm from "@/app/components/ui/RegistrationForm/RecipeRegistration";
import CookingTimeSlider from "@/app/components/ui/RegistarSlider/CookingTime/CookingTime";
import CostEstimateSlider from "@/app/components/ui/RegistarSlider/CostEstimate/CostEstimate";
import { useRecipes } from "@/app/hooks/recipes";
import { useIngredients } from "@/app/hooks/ingredients";

const AdminRecipes = () => {
  const { editRecipe, deleteRecipe } = useRecipeStore();
  const { data: recipes, isLoading } = useRecipes();
  const { data: ingredients = [] } = useIngredients();
  const { recipeGenres, fetchRecipeGenres, error } = useGenreStore();
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // fetchRecipes();
    fetchRecipeGenres();
  }, []);

  const handleDeleteRecipe = async (id: string) => {
    if (confirm("Are you sure you want to delete this recipe?")) {
      await deleteRecipe(id);
      // fetchRecipes();
    }
  };

  const getIngredientName = (id: number) => {
    const ingredient = ingredients.find((ingredient) => ingredient.id === id);
    return ingredient ? ingredient.name : "Unknown Ingredient";
  };

  const updateIngredientQuantity = (ingredientId: number, change: number) => {
    setEditingRecipe((prev: any) => {
      if (!prev) return prev;

      const updatedIngredients = prev.ingredients.map((ingredient: any) =>
        ingredient.id === ingredientId
          ? {
              ...ingredient,
              quantity: Math.max(0, ingredient.quantity + change),
            }
          : ingredient
      );

      return { ...prev, ingredients: updatedIngredients };
    });
  };

  const openEditModal = (recipe: any) => {
    setEditingRecipe({
      ...recipe,
      ingredients: recipe.ingredients.map((ing: Ingredient) => ({
        id: ing.id,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
      instructions: recipe.instructions.map((step: Instruction) => ({
        stepNumber: step.stepNumber,
        description: step.description,
        image: step.imageUrl,
      })),
    });
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingRecipe(null);
  };

  const handleChange = (field: string, value: any) => {
    setEditingRecipe((prev: any) => ({ ...prev, [field]: value }));
  };

  const saveEditedRecipe = async () => {
    if (editingRecipe) {
      const formData = new FormData();
      formData.append("name", editingRecipe.name);
      formData.append("cookingTime", editingRecipe.cookingTime.toString());
      formData.append("costEstimate", editingRecipe.costEstimate);
      formData.append("summary", editingRecipe.summary);
      formData.append("catchphrase", editingRecipe.catchphrase);
      formData.append("nutrition", JSON.stringify(editingRecipe.nutrition));
      formData.append("faq", JSON.stringify(editingRecipe.faq));
      formData.append("genre", editingRecipe.genre.id.toString());
      // 具材情報を追加
      formData.append("ingredients", JSON.stringify(editingRecipe.ingredients));

      // 手順情報を追加
      formData.append(
        "instructions",
        JSON.stringify(editingRecipe.instructions)
      );

      if (editingRecipe.imageUrl instanceof File) {
        formData.append("image", editingRecipe.imageUrl);
      }

      await editRecipe(editingRecipe.id, formData);
      // await fetchRecipes();
      closeEditModal();
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-3xl font-bold mb-6 text-center">Recipe List</h2>

      <RegistrationForm isAdmin={true} />

      <ul className="grid grid-cols-3 gap-3">
        {Array.isArray(recipes) &&
          recipes.map((recipe) => (
            <li key={recipe.id} className="p-6 rounded-lg shadow">
              <h4 className="text-xl font-bold mb-2">{recipe.name}</h4>
              {Array.isArray(recipe.instructions) &&
                recipe.instructions.map((step: Instruction) => (
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
                        ? `${backendUrl}/uploads/${recipe.imageUrl}`
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

              <p>Cooking Time: {recipe.cookingTime} minutes</p>
              <p>Cost: {recipe.costEstimate}</p>
              <p>Summary: {recipe.summary}</p>
              <p>Catchphrase: {recipe.catchphrase}</p>
              <div>
                <p>Calories: {recipe.nutrition?.calories} kcal</p>
                <p>Carbohydrates: {recipe.nutrition?.carbohydrates} g</p>
                <p>Fat: {recipe.nutrition?.fat} g</p>
                <p>Protein: {recipe.nutrition?.protein} g</p>
                <p>Sugar: {recipe.nutrition?.sugar} g</p>
                <p>Salt: {recipe.nutrition?.salt} g</p>
              </div>

              <h5 className="font-semibold mt-4">Ingredients:</h5>
              <ul>
                {Array.isArray(recipe.ingredients) &&
                  recipe.ingredients.map((ingredient: Ingredient, index: number) => {
                    return (
                      <li key={index}>
                        <p>
                          {getIngredientName(ingredient.id)} -{" "}
                          {ingredient.quantity}
                        </p>
                        <span>
                          {ingredient.unit ? ingredient.unit.name : "No unit"}
                        </span>
                      </li>
                    );
                  })}
              </ul>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                onClick={() => openEditModal(recipe)}
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteRecipe(recipe.id)}
                className="bg-red-500 text-white px-4 py-2 rounded mt-4"
              >
                Delete Recipe
              </button>
            </li>
          ))}
      </ul>

      {isModalOpen && editingRecipe && (
        <div className={styles.modal_block}>
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Edit Recipe</h2>
            {/* 名前 */}
            <input
              type="text"
              value={editingRecipe.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="border p-2 w-full mb-2 rounded"
            />
            {/* ジャンル */}
            <select
              value={editingRecipe.genre?.id || ""}
              onChange={(e) =>
                handleChange(
                  "genre",
                  recipeGenres.find((g) => g.id === parseInt(e.target.value))
                )
              }
              className="border p-2 w-full mb-2 rounded"
            >
              {recipeGenres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
            {/* 手順の編集 */}
            {editingRecipe.instructions.map(
              (instruction: Instruction, index: number) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <span className="font-bold">Step {index + 1}:</span>
                  <input
                    type="text"
                    value={instruction.description}
                    onChange={(e) => {
                      const updatedInstructions =
                        editingRecipe.instructions.map((instr: Instruction) =>
                          instr.id === instruction.id
                            ? { ...instr, description: e.target.value }
                            : instr
                        );
                      setEditingRecipe({
                        ...editingRecipe,
                        instructions: updatedInstructions,
                      });
                    }}
                    className="border p-2 rounded flex-grow"
                  />
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => {
                      const filteredInstructions = editingRecipe.instructions
                        .filter(
                          (instr: Instruction) =>
                            Number(instr.stepNumber) !==
                            Number(instruction.stepNumber)
                        )
                        .map((instr: Instruction, i: number) => ({
                          ...instr,
                          stepNumber: i + 1,
                        }));

                      setEditingRecipe({
                        ...editingRecipe,
                        instructions: filteredInstructions,
                      });
                    }}
                  >
                    Delete
                  </button>
                </div>
              )
            )}
            {/* 手順の追加 */}
            <button
              className="bg-green-500 text-white px-4 py-2 rounded w-full mb-2"
              onClick={() =>
                setEditingRecipe({
                  ...editingRecipe,
                  instructions: [
                    ...editingRecipe.instructions,
                    {
                      id: uuidv4(),
                      stepNumber: editingRecipe.instructions.length + 1,
                      description: "",
                    },
                  ],
                })
              }
            >
              Add Step
            </button>
            {/* 具材の編集 */}
            <h3 className="text-lg font-semibold mt-2">Ingredients</h3>
            {Array.isArray(editingRecipe.ingredients) &&
              editingRecipe.ingredients.map((ingredient: Ingredient) => {
                return (
                  <div key={ingredient.id} className="flex items-center mb-2">
                    <span className="mr-2 font-medium">{ingredient.name}</span>
                    <button
                      onClick={() =>
                        updateIngredientQuantity(
                          ingredient.id,
                          ingredient.unit.step
                        )
                      }
                      className="bg-green-500 text-white px-2 py-1 rounded ml-2"
                    >
                      増加
                    </button>
                    <span className="mx-4">{ingredient.quantity}</span>
                    <button
                      onClick={() =>
                        updateIngredientQuantity(
                          ingredient.id,
                          -ingredient.unit.step
                        )
                      }
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      減少
                    </button>
                    <span className="ml-2">{ingredient.unit.name}</span>
                  </div>
                );
              })}

            <h3>Cooking Time</h3>
            <CookingTimeSlider
              cookingTime={editingRecipe?.cookingTime || 0} // 初期値を設定
              setCookingTime={(time) => handleChange("cookingTime", time)}
            />

            <h3>Cost Estimate</h3>
            <CostEstimateSlider
              costEstimate={editingRecipe?.costEstimate || 0} // 初期値を設定
              setCostEstimate={(estimate) =>
                handleChange("costEstimate", estimate)
              }
            />

            <h3>summary</h3>
            <textarea
              placeholder="Summary"
              value={editingRecipe?.summary || ""}
              onChange={(e) => handleChange("summary", e.target.value)}
              className="border p-2 w-full mb-2 rounded"
            />

            <h3>catchphrase</h3>
            <textarea
              placeholder="Catchphrase"
              value={editingRecipe?.catchphrase || ""}
              onChange={(e) => handleChange("catchphrase", e.target.value)}
              className="border p-2 w-full mb-2 rounded"
            />

            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">栄養素</th>
                  <th className="border p-2">値 (g, mg, kcal)</th>
                </tr>
              </thead>
              <tbody>
                {["calories", "protein", "fat", "carbs", "fiber", "sugar"].map(
                  (key) => (
                    <tr key={key}>
                      <td className="border p-2">{key}</td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={editingRecipe?.nutrition?.[key] || ""}
                          onChange={(e) =>
                            handleChange("nutrition", {
                              ...editingRecipe.nutrition,
                              [key]: Number(e.target.value),
                            })
                          }
                          className="w-full p-2 border rounded"
                        />
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {/* 画像の変更 */}
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : null;
                if (file) {
                  setEditingRecipe({ ...editingRecipe, imageUrl: file });
                }
              }}
              className="border p-2 w-full mb-2 rounded"
            />
            {/* 保存・キャンセルボタン */}
            <button
              className="bg-green-500 text-white px-4 py-2 rounded w-full"
              onClick={saveEditedRecipe}
            >
              Save
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded w-full mt-2"
              onClick={closeEditModal}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecipes;
