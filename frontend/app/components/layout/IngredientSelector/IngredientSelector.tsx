"use client";

import React, { useState, useEffect } from "react";
import styles from "./IngredientSelector.module.scss";
import useIngredientStore from "@/app/stores/ingredientStore";
import IngredientCard from "../../ui/Cards/IngredientCard/IngredientCard";
import CategoryCard from "../../ui/Cards/CategoryCard/CategoryCard";

const IngredientSelector = () => {
  const {
    ingredients,
    fetchIngredients,
    increaseIngredientQuantity,
    decreaseIngredientQuantity,
  } = useIngredientStore();
  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const genres = [
    "すべて",
    "野菜",
    "果物",
    "肉",
    "魚介類",
    "穀物",
    "乳製品",
    "調味料",
    "その他",
  ];

  const filteredIngredients =
    selectedGenre === "すべて"
      ? ingredients
      : ingredients.filter((ing) => ing.genre === selectedGenre);

  return (
      <div className={styles.container_block}>
        {/* カテゴリカード */}
        <div className={styles.container_block__category}>
          {genres.map((genre) => (
            <CategoryCard
              key={genre}
              genre={genre}
              onClick={() => setSelectedGenre(genre)}
            />
          ))}
        </div>
        {/* 具材一覧 */}
        <div className={styles.container_block__ingredient}>
          {filteredIngredients.map((ingredient) => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              increaseQuantity={increaseIngredientQuantity}
              decreaseQuantity={decreaseIngredientQuantity}
            />
          ))}
        </div>
      </div>
  );
};

export default IngredientSelector;
