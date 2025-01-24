"use client";

import React, { useState, useEffect } from "react";
import styles from "./IngredientSelector.module.scss";
import useIngredientStore from "@/app/stores/ingredientStore";
import useGenreStore from "@/app/stores/genreStore";
import IngredientCard from "../../ui/Cards/IngredientCard/IngredientCard";
import CategoryCard from "../../ui/Cards/CategoryCard/CategoryCard";

const IngredientSelector = () => {
  const {
    ingredients,
    fetchIngredients,
    increaseIngredientQuantity,
    decreaseIngredientQuantity,
  } = useIngredientStore();

  const { ingredientGenres, fetchIngredientGenres } = useGenreStore();
  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");

  useEffect(() => {
    fetchIngredients();
    fetchIngredientGenres();
  }, [fetchIngredients, fetchIngredientGenres]);

  const genres = [
    { id: 0, name: "すべて" }, // "すべて" を追加
    ...ingredientGenres,      // Zustand で管理するジャンルを展開
  ];

  const filteredIngredients =
    selectedGenre === "すべて"
      ? ingredients
      : ingredients.filter((ing) => ing.genre.name === selectedGenre);

  return (
    <div className={styles.container_block}>
      {/* カテゴリカード */}
      <div className={styles.container_block__category}>
        {genres.map((genre) => (
          <CategoryCard
            key={genre.id}
            genre={genre.name}
            onClick={() => setSelectedGenre(genre.name)}
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
