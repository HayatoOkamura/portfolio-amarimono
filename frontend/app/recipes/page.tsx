/* eslint-disable */

"use client";

import React, { useState, useEffect } from "react";
import styles from "./recipes.module.scss";
import useRecipeStore from "../stores/recipeStore";
import { usePathname } from "next/navigation";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import Image from "next/image";
import { Recipe } from "../stores/recipeStore";

const RecipesPageContent = () => {
  const { generatedRecipes, error, clearGeneratedRecipes } = useRecipeStore();
  const pathname = usePathname();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(
    generatedRecipes[0] || null
  );
  const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  
  useEffect(() => {
    if (generatedRecipes.length > 0) {
      setSelectedRecipe(generatedRecipes[0]);
    }
  }, [generatedRecipes]);

  useEffect(() => {
    // ページ遷移時にrecipesをクリア
    return () => {
      if (pathname !== "/recipes") {
        clearGeneratedRecipes();
      }
    };
  }, [pathname, clearGeneratedRecipes]);

  const handleRecipeClick = (recipe: any) => {
    setSelectedRecipe(recipe);
  };

  if (error) {
    return <p className="text-red-500 text-center mt-4">エラー: {error}</p>;
  }

  if (!generatedRecipes?.length) {
    return (
      <p className="text-center text-lg font-semibold text-gray-700 mt-8">
        作れるレシピがありません。
      </p>
    );
  }

  return (
    <div className={styles.container_block}>
      {/* サムネイル表示（現在のレシピ） */}
      {selectedRecipe && (
        <div className={styles.container_block__thumbnail}>
          <div className={styles.container_block__img}>
            <Image
              fill
              src={`${backendUrl}/${selectedRecipe.imageUrl}` || "/default-image.jpg"}
              alt={selectedRecipe.name}
              unoptimized
            />
          </div>
          <h2 className={styles.container_block__title}>{selectedRecipe.name}</h2>
        </div>
      )}

      {/* 横並びレシピ一覧 */}
      <div className={styles.container_block__list}>
        {generatedRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className={`${styles.container_block__item} ${
              selectedRecipe?.id === recipe.id ? styles.active : ""
            }`}
            onClick={() => handleRecipeClick(recipe)}
          >
            <RecipeCard recipe={recipe} />
          </div>
        ))}
      </div>
    </div>
  );
};

const RecipesPage = () => {
  return <RecipesPageContent />;
};

export default RecipesPage;
