"use client";

import React, { useState, useEffect } from "react";
import styles from "./IngredientSelector.module.scss";
import useIngredientStore from "@/app/stores/ingredientStore";
import useGenreStore from "@/app/stores/genreStore";
import IngredientCard from "../../ui/Cards/IngredientCard/IngredientCard";
import CategoryCard from "../../ui/Cards/CategoryCard/CategoryCard";

const IngredientSelector = () => {
  const { ingredients, fetchIngredients, updateQuantity } =
    useIngredientStore();

  const { ingredientGenres, fetchIngredientGenres } = useGenreStore();
  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
  const [height, setHeight] = useState("auto");

  useEffect(() => {
    fetchIngredients();
    fetchIngredientGenres();
  }, [fetchIngredients, fetchIngredientGenres]);

  useEffect(() => {
    const updateHeight = () => {
      const element = document.getElementById("target");
      console.log(element);
      
      if (element) {
        const topOffset = element.getBoundingClientRect().top;
        setHeight(`${window.innerHeight - topOffset}px`);
      }
    };

    window.addEventListener("resize", updateHeight);
    updateHeight(); // 初回設定

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const genres = [
    { id: 0, name: "すべて" }, // "すべて" を追加
    ...ingredientGenres, // Zustand で管理するジャンルを展開
  ];

  const filteredIngredients =
    selectedGenre === "すべて"
      ? ingredients
      : ingredients.filter((ing) => ing.genre.name === selectedGenre);

  return (
    <div className={styles.container_block}>
      {/* カテゴリカード */}

      <section className={styles.category_block}>
        <h2 className={styles.category_block__title}>具材カテゴリー</h2>
        <div className={styles.category_block__contents}>
          {genres.map((genre) => (
            <CategoryCard
              key={genre.id}
              genre={genre}
              onClick={() => setSelectedGenre(genre.name)}
            />
          ))}
        </div>
      </section>
      {/* 具材一覧 */}
      <section className={styles.ingredient_block}>
        <h2 className={styles.ingredient_block__title}>具材一覧</h2>
        <div
          className={styles.ingredient_block__wrapper}
          id="target"
          style={{ height }}
        >
          <div className={styles.ingredient_block__contents}>
            {filteredIngredients.map((ingredient) => (
              <IngredientCard
                key={ingredient.id}
                ingredient={ingredient}
                updateQuantity={updateQuantity}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default IngredientSelector;
