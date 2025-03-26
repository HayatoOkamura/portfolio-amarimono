/* eslint-disable */
"use client";

import styles from "./favorite.module.scss";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { backendUrl } from "@/app/utils/apiUtils";
import { useFavorites } from "@/app/hooks/recipes";
import { Recipe, Ingredient } from "@/app/types";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { useAuth } from "@/app/hooks/useAuth";

const FavoritesPage = () => {
  const { user } = useAuth();
  const { data, isLoading } = useFavorites(user?.id || "");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    console.log(data);
  }, [data]);

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  if (isLoading) return <p>Loading...</p>;

  const favoriteRecipes = data || [];

  if (favoriteRecipes.length > 0)
    return (
      <div className={styles.container_block}>
        <div className={styles.recipe_list}>
          {favoriteRecipes.map((recipe: Recipe) => (
            <div
              key={recipe.id}
              className={`${styles.recipe_list__item} ${
                selectedRecipe?.id === recipe.id ? styles.active : ""
              }`}
              onClick={() => handleRecipeClick(recipe)}
            >
              <RecipeCard
                recipe={{
                  ...recipe,
                  ingredients: recipe.ingredients.map((ingredient: Ingredient) => ({
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
                path="/recipes/"
              />
            </div>
          ))}
        </div>
      </div>
    );
  else {
    return (
      <div>レシピが見つかりません</div>
    )
  }
};

export default FavoritesPage;
