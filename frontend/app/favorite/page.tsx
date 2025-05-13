/* eslint-disable */
"use client";

import styles from "./favorite.module.scss";
import { useState } from "react";
import { useFavorites } from "@/app/hooks/recipes";
import { Recipe } from "@/app/types/index";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { useAuth } from "@/app/hooks/useAuth";
import { PageLoading } from '@/app/components/ui/Loading/PageLoading';

const FavoritesPage = () => {
  const { user } = useAuth();
  const { data, isLoading } = useFavorites(user?.id || "");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const favoriteRecipes = data || [];

  return (
    <PageLoading isLoading={isLoading}>
      <div className={styles.container_block}>
        <h1 className={styles.container_block__title}>お気に入りレシピ</h1>
        {favoriteRecipes.length > 0 ? (
          <div className={styles.container_block__list}>
            {favoriteRecipes.map((recipe: Recipe) => (
              <div
                key={recipe.id}
                className={`${styles.container_block__item} ${
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
        ) : (
          <div>レシピが見つかりません</div>
        )}
      </div>
    </PageLoading>
  );
};

export default FavoritesPage;
