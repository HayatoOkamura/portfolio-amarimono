/* eslint-disable */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import styles from "./GenerateRecipe.module.scss";
import { useRouter } from "next/navigation";
import useRecipeStore from "@/app/stores/recipeStore";
import useIngredientStore from "@/app/stores/ingredientStore";
import { fetchRecipesAPI } from "@/app/hooks/useRecipes";

const GenerateRecipe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setRecipes } = useRecipeStore();
  const { setGeneratedRecipes } = useRecipeStore();
  const { ingredients } = useIngredientStore();
  const router = useRouter();

  const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const fetchRecipes = async () => {
    setLoading(true);
    setError("");

    try {
      const filteredIngredients = ingredients
        .filter((ingredient) => ingredient.quantity > 0)
        .map(({ id, quantity }) => ({ id, quantity }));

      const response = await fetchRecipesAPI(filteredIngredients); // 新規関数の使用
      setGeneratedRecipes(response); // レシピを更新

      // レシピをURLのクエリパラメータに追加
      router.push("/recipes");
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
      setRecipes([]);
      setGeneratedRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedIngredients = ingredients.filter(
    (ingredient) => ingredient.quantity > 0
  );

  return (
    <div className={styles.container_block}>
      <div className={styles.container_block__inner}>
        {selectedIngredients.length > 0 && (
          <ul className={styles.ingredients_list}>
            {selectedIngredients.map((ingredient) => (
              <li key={ingredient.id} className={styles.ingredients_list__item}>
                <div className={styles.ingredients_list__image}>
                  <Image
                    fill
                    src={
                      ingredient.imageUrl
                        ? `${backendUrl}/${ingredient.imageUrl}`
                        : "/default-image.jpg"
                    }
                    alt={ingredient.name}
                    unoptimized
                  />
                </div>
                <p className={styles.ingredients_list__name}>
                  {ingredient.name}
                </p>
                -
                <p className={styles.ingredients_list__quantity}>
                  {ingredient.quantity}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.container_block__btn}>
          <button onClick={fetchRecipes}>{loading ? <p>レシピを検索中...</p> : <p>レシピを検索</p> }</button>
        </div>
      </div>
      
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default GenerateRecipe;
