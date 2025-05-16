/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./GenerateRecipe.module.scss";
import { imageBaseUrl } from "@/app/utils/api";
import useRecipeStore from "@/app/stores/recipeStore";
import useIngredientStore from "@/app/stores/ingredientStore";
import { Ingredient } from "@/app/types/index";
import { useIngredients } from "@/app/hooks/ingredients";
import RecipeLoading from "../Loading/RecipeLoading";

interface GenerateRecipeProps {
  onSearch: () => Promise<void>;
}

const GenerateRecipe = ({ onSearch }: GenerateRecipeProps) => {
  const [error, setError] = useState("");
  const { setGeneratedRecipes, setSearchType, setSearchExecuted } =
    useRecipeStore();
  const { ingredients, setIngredients } = useIngredientStore();
  const { data: fetchedIngredients } = useIngredients();

  useEffect(() => {
    if (fetchedIngredients) {
      setIngredients(fetchedIngredients);
    }
  }, [fetchedIngredients, setIngredients]);

  const handleRecipe = async () => {
    try {
      const filteredIngredients = ingredients
        .filter((ingredient: Ingredient) => ingredient.quantity > 0)
        .map(({ id, quantity }: Ingredient) => ({ id, quantity }));

      if (filteredIngredients.length === 0) {
        alert("具材が選択されていません。");
        return;
      }

      setSearchType("ingredients");
      setSearchExecuted(true);

      await onSearch();
    } catch (err: any) {
      setGeneratedRecipes([]);
      setError(err.message);
    }
  };

  const selectedIngredients = ingredients.filter(
    (ingredient: Ingredient) => ingredient.quantity > 0
  ) as Ingredient[];

  return (
    <section className={styles.container_block}>
      <div className={styles.container_block__inner}>
        <h2 className={styles.container_block__title}>選択した具材</h2>
        <div className={styles.container_block__contents}>
          {selectedIngredients.length > 0 && (
            <ul className={styles.ingredients_list}>
              {selectedIngredients.map((ingredient: Ingredient) => (
                <li
                  key={ingredient.id}
                  className={styles.ingredients_list__item}
                >
                  <div className={styles.ingredients_list__image}>
                    <Image
                      src={
                        ingredient.imageUrl
                          ? `${imageBaseUrl}/${ingredient.imageUrl}`
                          : "/pic_recipe_default.webp"
                      }
                      alt={ingredient.name}
                      width={100}
                      height={100}
                    />
                  </div>
                  <p className={styles.ingredients_list__name}>
                    {ingredient.name}
                  </p>
                  <p className={styles.ingredients_list__quantity}>
                    {Number.isInteger(ingredient.quantity)
                      ? ingredient.quantity
                      : Number(ingredient.quantity).toFixed(1)}
                    {ingredient.unit?.name || ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div
          className={styles.container_block__btn}
          data-onboarding="search-button"
        >
          <button onClick={handleRecipe}>レシピを検索</button>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}
    </section>
  );
};

export default GenerateRecipe;
