/* eslint-disable */
"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import useRecipeStore from "@/app/stores/recipeStore";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";

const ListMyRecipe = () => {
  const { user } = useAuth();
  const { recipes, fetchUserRecipes } = useRecipeStore();

  useEffect(() => {
    if (user?.id) {
      fetchUserRecipes(user.id);
    } else {
      return;
    }
  }, [user?.id, fetchUserRecipes]);

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Your Recipes</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {recipes.length > 0 ? (
            recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  ...recipe,
                  ingredients: recipe.ingredients.map((ingredient) => ({
                    ...ingredient,
                    name: ingredient.name,
                    quantity: ingredient.quantity,
                    unit:
                      typeof ingredient.unit === "string"
                        ? { id: 0, name: ingredient.unit }
                        : ingredient.unit,
                  })),
                }}
                isFavoritePage={true}
                path="/recipes/my/"
              />
            ))
          ) : (
            <p>No recipes found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListMyRecipe;
