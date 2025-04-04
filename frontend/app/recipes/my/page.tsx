/* eslint-disable */
"use client";

import React from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useUserRecipes } from "@/app/hooks/recipes";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { Recipe } from "@/app/types/index";

const ListMyRecipe = () => {
  const { user } = useAuth();
  const { data, isLoading } = useUserRecipes(user?.id);

  if (!user || isLoading) return <p>Loading...</p>;

  const recipes = data?.recipes || [];

  return (
    <div>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Your Recipes</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {recipes.length > 0 ? (
            recipes.map((recipe: Recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  ...recipe,
                  ingredients: recipe.ingredients.map((ingredient) => ({
                    ...ingredient,
                    name: ingredient.name,
                    quantity: ingredient.quantity,
                    unit: {
                      id: ingredient.unit.id,
                      name: ingredient.unit.name,
                      description: ingredient.unit.description || '',
                      step: ingredient.unit.step || 1
                    }
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
