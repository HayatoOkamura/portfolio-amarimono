/* eslint-disable */
"use client";

import styles from "./favorite.module.scss";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { backendUrl } from "@/app/utils/apiUtils";
import { useFavorites } from "@/app/hooks/recipes";
import { Recipe } from "@/app/types";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";

const FavoritesPage = () => {
  const { favoriteRecipes, loading } = useFavorites();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    console.log(favoriteRecipes);
  }, [favoriteRecipes]);

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  if (loading) return <p>Loading...</p>;

  if (favoriteRecipes.length > 0) {
    return (
      <div className={styles.container_block}>
        <div className={styles.recipe_list}>
          {favoriteRecipes.map((recipe) => (
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
                  ingredients: recipe.ingredients.map((ingredient) => ({
                    ...ingredient,
                    name: ingredient.name, // nameを解決
                    quantity: ingredient.quantity,
                    unit:
                      typeof ingredient.unit === "string"
                        ? { id: 0, name: ingredient.unit } // unit が string なら仮の id を付与
                        : ingredient.unit, // 既にオブジェクトならそのまま
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
  } else {
    return (
      <div>レシピが見つかりません</div>
    )
  }
};

export default FavoritesPage;
