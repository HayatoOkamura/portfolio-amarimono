/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { backendUrl } from "@/app/utils/apiUtils";
import Image from "next/image";
import { Recipe } from "@/app/types/index";
import { fetchRecipeByIdService } from "@/app/hooks/recipes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDeleteRecipe } from "@/app/hooks/recipes";

const AdminRecipeDetail = () => {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const deleteRecipeMutation = useDeleteRecipe();

  useEffect(() => {
    const id = window.location.pathname.split("/").pop();
    if (id && id !== "recipes") {
      fetchRecipeByIdService(id)
        .then((recipeData) => {
          setRecipe(recipeData);
        })
        .catch((error) => console.error("Error fetching recipe:", error));
    }
  }, []);

  const handleDelete = async () => {
    if (!recipe) return;
    
    if (confirm("Are you sure you want to delete this recipe?")) {
      try {
        await deleteRecipeMutation.mutateAsync(recipe.id);
        router.push("/admin/recipes");
      } catch (error) {
        console.error("Error deleting recipe:", error);
        alert("Failed to delete recipe");
      }
    }
  };

  const handleTogglePublish = async () => {
    if (!recipe) return;
    try {
      const response = await fetch(`${backendUrl}/api/recipes/${recipe.id}/toggle-publish`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic: !recipe.isPublic }),
      });
      if (response.ok) {
        setRecipe({ ...recipe, isPublic: !recipe.isPublic });
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  if (!recipe) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Recipe Details</h2>
        <div className="flex gap-2">
          <Link
            href={`/admin/recipes/${recipe.id}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Edit Recipe
          </Link>
          <button
            onClick={handleTogglePublish}
            className={`px-4 py-2 rounded ${
              recipe.isPublic
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-green-500 hover:bg-green-600"
            } text-white`}
          >
            {recipe.isPublic ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Delete Recipe
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{recipe.name}</h1>
          {recipe.isDraft && (
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm mb-2">下書き</span>
          )}
          <p className="text-gray-600">{recipe.catchphrase}</p>
        </div>

        {recipe.imageUrl && (
          <div className="relative w-full h-64 mb-6">
            <Image
              fill
              src={`${backendUrl}/uploads/${recipe.imageUrl}`}
              alt={recipe.name}
              className="object-cover rounded"
              unoptimized
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold mb-2">Cooking Time</h3>
            <p>{recipe.cookingTime} minutes</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Cost Estimate</h3>
            <p>{recipe.costEstimate} yen</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Summary</h3>
          <p className="text-gray-700">{recipe.summary}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Ingredients</h3>
          <ul className="list-disc list-inside">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>
                {ingredient.name} - {ingredient.quantity} {ingredient.unit.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Instructions</h3>
          <ol className="list-decimal list-inside">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="mb-2">
                {step.description}
                {step.imageUrl && (
                  <div className="relative w-48 h-32 mt-2">
                    <Image
                      fill
                      src={`${backendUrl}/uploads/${step.imageUrl}`}
                      alt={`Step ${step.stepNumber}`}
                      className="object-cover rounded"
                      unoptimized
                    />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Nutrition Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>Calories: {recipe.nutrition?.calories} kcal</p>
              <p>Protein: {recipe.nutrition?.protein}g</p>
              <p>Fat: {recipe.nutrition?.fat}g</p>
            </div>
            <div>
              <p>Carbohydrates: {recipe.nutrition?.carbohydrates}g</p>
              <p>Sugar: {recipe.nutrition?.sugar}g</p>
              <p>Salt: {recipe.nutrition?.salt}g</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRecipeDetail; 