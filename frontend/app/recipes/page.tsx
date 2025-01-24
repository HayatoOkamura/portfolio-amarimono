/* eslint-disable */

"use client";

import React, { useState, useEffect } from "react";
import styles from "./recipes.module.scss";
import useRecipeStore from "../stores/recipeStore";
import { usePathname } from "next/navigation";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import Image from "next/image";
import { Recipe } from "../types";
import useIngredientStore from "../stores/ingredientStore";

const RecipesPageContent = () => {
  const { generatedRecipes, error, clearGeneratedRecipes } = useRecipeStore();
  const { ingredients: ingredientList } = useIngredientStore();
  const pathname = usePathname();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(
    generatedRecipes[0] || null
  );
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  // idを元にIngredientのnameを取得する関数
  const getIngredientName = (id: number): string => {
    const ingredient = ingredientList.find((ing) => ing.id === id);
    return ingredient ? ingredient.name : "Unknown Ingredient";
  };

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
    console.log(selectedRecipe);
    
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
              src={
                `${backendUrl}/${selectedRecipe.imageUrl}` ||
                "/default-image.jpg"
              }
              alt={selectedRecipe.name}
              unoptimized
            />
          </div>
          <h2 className={styles.container_block__title}>
            {selectedRecipe.name}
          </h2>
          <p className={styles.container_block__genre}>{selectedRecipe.genre.name}</p>
           {/* 材料リスト */}
        <h3 className={styles.card_block__ingredients}>材料</h3>
        <ul className={styles.card_block__ing_list}>
          {selectedRecipe.ingredients.map((ingredient, idx) => (
            <li key={idx} className={styles.card_block__ing_item}>
              {getIngredientName(ingredient.id)} ({ingredient.quantity} 個)
            </li>
          ))}
        </ul>

        {/* 調理手順 */}
        <h3 className={styles.card_block__step}>調理手順</h3>
        <ol className={styles.card_block__step_list}>
          {selectedRecipe.instructions.map((step, idx) => (
            <li key={idx} className={styles.card_block__step_item}>
              <strong>Step {step.stepNumber}:</strong> {step.description}
            </li>
          ))}
        </ol>
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
            <RecipeCard
              recipe={{
                ...recipe,
                ingredients: recipe.ingredients.map((ingredient) => ({
                  ...ingredient,
                  name: getIngredientName(ingredient.id), // nameを解決
                })),
              }}
            />
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
