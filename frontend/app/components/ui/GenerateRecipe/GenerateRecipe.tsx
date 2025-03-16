/* eslint-disable */
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./GenerateRecipe.module.scss";
import { backendUrl } from "@/app/utils/apiUtils";
import { useRouter } from "next/navigation";
import useRecipeStore from "@/app/stores/recipeStore";
import useIngredientStore from "@/app/stores/ingredientStore";

const GenerateRecipe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setRecipes } = useRecipeStore();
  const { setGeneratedRecipes, setSearchType } = useRecipeStore();
  const { ingredients } = useIngredientStore();
  const router = useRouter();

  const handleRecipe = async () => {
    setLoading(true);
    
    try {
      const filteredIngredients = ingredients
        .filter((ingredient) => ingredient.quantity > 0)
        .map(({ id, quantity }) => ({ id, quantity }));

      if (filteredIngredients.length === 0) {
        alert("具材が選択されていません。");
        return; // 処理を中断
      }

      setSearchType("ingredients"); 
      router.push("/recipes");
    } catch (err: any) {
      setRecipes([]);
      setGeneratedRecipes([]);
      setLoading(false);
    }
  };

  const selectedIngredients = ingredients.filter(
    (ingredient) => ingredient.quantity > 0
  );

  return (
    <section className={styles.container_block}>
      <div className={styles.container_block__inner}>
        <h2 className={styles.container_block__title}>選択した具材</h2>
        <div className={styles.container_block__contents}>
          {selectedIngredients.length > 0 && (
            <ul className={styles.ingredients_list}>
              {selectedIngredients.map((ingredient: any) => (
                <li
                  key={ingredient.id}
                  className={styles.ingredients_list__item}
                >
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
                  <p className={styles.ingredients_list__quantity}>
                    {ingredient.quantity}
                    {ingredient.unit.name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.container_block__btn}>
          <button onClick={handleRecipe}>
            {loading ? <p>レシピを検索中...</p> : <p>レシピを検索</p>}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}
    </section>
  );
};

export default GenerateRecipe;
