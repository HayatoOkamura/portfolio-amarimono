/* eslint-disable */
"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import useIngredientStore from "@/app/stores/ingredientStore";
import useGenreStore from "@/app/stores/genreStore";
import { RegistrationForm } from "@/app/components/features/RecipeForm/RegistrationForm";
import { useIngredients } from "@/app/hooks/ingredients";
import {
  useUserRecipes,
  useDeleteRecipe,
  useUpdateRecipe,
} from "@/app/hooks/recipes";
import { backendUrl } from "@/app/utils/apiUtils";
import Image from "next/image";
import { useState } from "react";
import { Ingredient, Instruction, Recipe } from "@/app/types/index";
import styles from "./new.module.scss";

const RecipeRegistration: React.FC = () => {
  const { user } = useAuth();
  const { setIngredients } = useIngredientStore();
  const { fetchRecipeGenres, recipeGenres } = useGenreStore();
  const { data: ingredientsData } = useIngredients();
  const { data: recipesData, isLoading } = useUserRecipes(user?.id);
  const deleteRecipeMutation = useDeleteRecipe();
  const updateRecipeMutation = useUpdateRecipe();
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (ingredientsData) {
      setIngredients(ingredientsData);
    }
    fetchRecipeGenres();
  }, [ingredientsData, setIngredients, fetchRecipeGenres]);

  if (!user) return <p>Loading...</p>;

  const handleDeleteRecipe = async (id: string) => {
    if (confirm("Are you sure you want to delete this recipe?")) {
      try {
        await deleteRecipeMutation.mutateAsync(id);
      } catch (err: any) {
        console.error(err.message);
      }
    }
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
      formData.append("ingredients", JSON.stringify(editingRecipe.ingredients));
      formData.append(
        "instructions",
        JSON.stringify(editingRecipe.instructions)
      );

      if (editingRecipe.imageUrl instanceof File) {
        formData.append("image", editingRecipe.imageUrl);
      }

      try {
        await updateRecipeMutation.mutateAsync({
          id: editingRecipe.id,
          formData,
        });
        closeEditModal();
      } catch (err: any) {
        console.error(err.message);
      }
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-3xl font-bold mb-6 text-center">My Recipes</h2>

      <RegistrationForm />

      <ul className="grid grid-cols-3 gap-3 mt-8">
        {Array.isArray(recipesData?.recipes) &&
          recipesData.recipes.map((recipe: Recipe) => (
            <li key={recipe.id} className="p-6 rounded-lg shadow">
              <h4 className="text-xl font-bold mb-2">{recipe.name}</h4>
              {recipe.isDraft && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm mb-2">下書き</span>
              )}
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
                        : "/pic_recipe_default.webp"
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
                  recipe.ingredients.map(
                    (ingredient: Ingredient, index: number) => (
                      <li key={index}>
                        <p>
                          {ingredient.name} - {ingredient.quantity}
                        </p>
                        <span>
                          {ingredient.unit ? ingredient.unit.name : "No unit"}
                        </span>
                      </li>
                    )
                  )}
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
            <input
              type="text"
              value={editingRecipe.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="border p-2 w-full mb-2 rounded"
            />
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
            <button
              className="bg-green-500 text-white px-4 py-2 rounded w-full mb-2"
              onClick={() =>
                setEditingRecipe({
                  ...editingRecipe,
                  instructions: [
                    ...editingRecipe.instructions,
                    {
                      id: editingRecipe.instructions.length + 1,
                      stepNumber: editingRecipe.instructions.length + 1,
                      description: "",
                    },
                  ],
                })
              }
            >
              Add Step
            </button>
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

export default RecipeRegistration;
