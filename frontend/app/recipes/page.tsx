/* eslint-disable */

"use client";

import React, { useState, useEffect } from "react";
import styles from "./recipes.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/stores/userStore";
import { backendUrl } from "@/app/utils/apiUtils";
import useRecipeStore from "../stores/recipeStore";
import { usePathname } from "next/navigation";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import Image from "next/image";
import { Recipe } from "../types";
import useIngredientStore from "../stores/ingredientStore";

const RecipesPageContent = () => {
  const router = useRouter();
  const { generatedRecipes, error, clearGeneratedRecipes } = useRecipeStore();
  const { ingredients: ingredientList } = useIngredientStore();
  const pathname = usePathname();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(
    generatedRecipes[0] || null
  );

  // idを元にIngredientのnameを取得する関数
  const getIngredientName = (id: number): string => {
    const ingredient = ingredientList.find((ing) => ing.id === id);
    return ingredient ? ingredient.name : "Unknown Ingredient";
  };

  useEffect(() => {
    if (generatedRecipes.length > 0) {
      setSelectedRecipe(generatedRecipes[0]);
    }
    console.log("セレクト", generatedRecipes);
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
        <div className={styles.current_recipe}>
          <div className={styles.current_recipe__detail}>
            <h2 className={styles.current_recipe__title}>
              {selectedRecipe.name}
            </h2>
            <p className={styles.current_recipe__genre}>
              {selectedRecipe.genre.name}
            </p>
            {/* 材料リスト */}
            <h3 className={styles.current_recipe__ingredients}>材料</h3>
            <ul className={styles.current_recipe__list}>
              {selectedRecipe.ingredients.map((ingredient, idx) => (
                <li key={idx} className={styles.current_recipe__item}>
                  {getIngredientName(ingredient.id)} ({ingredient.quantity}{" "}
                  {ingredient.unit.name})
                </li>
              ))}
            </ul>
            <Link href={`/recipes/${selectedRecipe.id}`}>
              <button>詳しく見る</button>
            </Link>
          </div>
          <div className={styles.current_recipe__img}>
            <Image
              fill
              src={
                `${backendUrl}/uploads/${selectedRecipe.imageUrl}` ||
                "/default-image.jpg"
              }
              alt={selectedRecipe.name}
              unoptimized
            />
          </div>
        </div>
      )}
      <div className={styles.recipe_list}>
        {/* 横並びレシピ一覧 */}
        {generatedRecipes.map((recipe) => (
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
              isFavoritePage={false}
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
