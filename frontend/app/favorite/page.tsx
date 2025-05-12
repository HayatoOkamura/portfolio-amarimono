/* eslint-disable */
"use client";

import styles from "./favorite.module.scss";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { backendUrl } from "@/app/utils/api";
import { useFavorites } from "@/app/hooks/recipes";
import { Recipe, Ingredient } from "@/app/types/index";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { useAuth } from "@/app/hooks/useAuth";

const FavoritesPage = () => {
  const { user } = useAuth();
  const { data, isLoading } = useFavorites(user?.id || "");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const favoriteRecipes = data || [];


  if (favoriteRecipes.length > 0)
    return (
      <div className={styles.container_block}>
        <h1 className={styles.container_block__title}>お気に入りレシピ</h1>
        <div className={styles.container_block__list}>
          {favoriteRecipes.map((recipe: Recipe) => (
            <div
              key={recipe.id}
              className={`${styles.recipe_list__item} ${
                selectedRecipe?.id === recipe.id ? styles.active : ""
              }`}
              onClick={() => handleRecipeClick(recipe)}
            >
              <RecipeCard
                recipe={recipe}
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
