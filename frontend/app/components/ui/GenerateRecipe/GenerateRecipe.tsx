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

interface GenerateRecipeProps {
  onSearch: () => Promise<void>;
}

const GenerateRecipe = ({ onSearch }: GenerateRecipeProps) => {
  const [error, setError] = useState("");
  const [showSeasonings, setShowSeasonings] = useState(false);
  const { setGeneratedRecipes, setSearchType, setSearchExecuted } =
    useRecipeStore();
  const { ingredients, setIngredients, selectedOrder, searchMode } =
    useIngredientStore();
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
        .reduce(
          (acc: { id: number; quantity: number }[], current: Ingredient) => {
            const existingIngredient = acc.find(
              (item) => item.id === current.id
            );
            if (existingIngredient) {
              existingIngredient.quantity += current.quantity;
              return acc;
            }
            return [...acc, { id: current.id, quantity: current.quantity }];
          },
          []
        );

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

  const selectedIngredients = ingredients
    .filter((ingredient: Ingredient) => ingredient.quantity > 0)
    .reduce((acc: Ingredient[], current: Ingredient) => {
      const existingIngredient = acc.find((item) => item.id === current.id);
      if (existingIngredient) {
        existingIngredient.quantity = current.quantity;
        return acc;
      }
      return [...acc, current];
    }, []) as Ingredient[];

  // 選択順序に基づいて具材をソート（新しい順に表示）
  const sortedIngredients = [...selectedIngredients].sort((a, b) => {
    const aIndex = selectedOrder.indexOf(a.id);
    const bIndex = selectedOrder.indexOf(b.id);
    return bIndex - aIndex; // 順序を逆にして新しい順に表示
  });

  // 調味料とスパイスをフィルタリング
  const filteredIngredients = sortedIngredients.filter((ingredient) => {
    if (showSeasonings) return true;
    return !["調味料", "スパイス"].includes(ingredient.genre.name);
  });

  // 調味料とスパイスの具材があるかチェック
  const hasSeasonings = sortedIngredients.some((ingredient) =>
    ["調味料", "スパイス"].includes(ingredient.genre.name)
  );

  // 検索モードに応じたメッセージを取得
  const getSearchModeMessage = () => {
    switch (searchMode) {
      case "exact_with_quantity":
        return "選んだ具材すべてが含まれ、指定した分量も満たすレシピを検索します";
      case "exact_without_quantity":
        return "選んだ具材すべてが含まれるレシピを検索します（分量は問いません）";
      case "partial_with_quantity":
        return "選んだ具材のいずれかが含まれ、分量も満たすレシピを検索します（調味料・スパイスは除外）";
      case "partial_without_quantity":
        return "選んだ具材のいずれかが含まれるレシピを検索します（分量は不問、調味料・スパイスは除外）";
      default:
        return "";
    }
  };

  return (
    <section className={styles.container_block}>
      <div className={styles.container_block__inner}>
        <h2 className={styles.container_block__title}>選択した具材</h2>
        {hasSeasonings && (
          <button
            className={styles.toggle_seasonings}
            onClick={() => setShowSeasonings(!showSeasonings)}
          >
            {showSeasonings
              ? "調味料、スパイスを非表示"
              : "調味料、スパイスを表示"}
          </button>
        )}
        <div className={styles.search_mode_notice}>
          <p>{getSearchModeMessage()}</p>
        </div>
        <div className={styles.container_block__contents}>
          {filteredIngredients.length > 0 && (
            <ul className={styles.ingredients_list}>
              {filteredIngredients.map((ingredient: Ingredient) => (
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
                  {ingredient.unit?.type !== "presence" && (
                    <p className={styles.ingredients_list__quantity}>
                      {Number.isInteger(ingredient.quantity)
                        ? ingredient.quantity
                        : Number(ingredient.quantity).toFixed(1)}
                      {ingredient.unit?.name || ""}
                    </p>
                  )}
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
