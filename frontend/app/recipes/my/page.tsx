/* eslint-disable */
"use client";

import React from "react";
import styles from "./myrecipe.module.scss";
import { useAuth } from "@/app/hooks/useAuth";
import { useUserRecipes } from "@/app/hooks/recipes";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { Recipe } from "@/app/types/index";
import { useRouter } from 'next/navigation';
import { PageLoading } from '@/app/components/ui/Loading/PageLoading';

const ListMyRecipe = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useUserRecipes(user?.id);
  const router = useRouter();

  const recipes = Array.isArray(data) ? data : [];

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipes/my/${recipeId}`);
  };

  return (
    <PageLoading isLoading={isLoading}>
      <div className={styles.my_recipe_block}>
        <div className={styles.my_recipe_block__content}>
          <h1 className={styles.my_recipe_block__title}>作成したレシピ</h1>
          {error ? (
            <div>Error: {error.message}</div>
          ) : (
            <div className={styles.my_recipe_block__grid}>
              {recipes.length > 0 ? (
                recipes.map((recipe: Recipe) => (
                  <div key={recipe.id} onClick={() => handleRecipeClick(recipe.id)} className={styles.my_recipe_block__card}>
                    <RecipeCard
                      recipe={recipe}
                      isFavoritePage={false}
                      path="/recipes/"
                    />
                  </div>
                ))
              ) : (
                <p>No recipes found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </PageLoading>
  );
};

export default ListMyRecipe;
