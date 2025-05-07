"use client";

import React, { useState, useEffect } from "react";
import styles from "./IngredientSelector.module.scss";
import useGenreStore from "@/app/stores/genreStore";
import { useIngredients } from "@/app/hooks/ingredients";
import IngredientCard from "../../ui/Cards/IngredientCard/IngredientCard";
import CategoryCard from "../../ui/Cards/CategoryCard/CategoryCard";
import Loading from "../../ui/Loading/Loading";
import { Ingredient } from "@/app/types/index";

interface IngredientSelectorProps {
  initialIngredients: Ingredient[];
}

const IngredientSelector = ({ initialIngredients }: IngredientSelectorProps) => {
  const { data: ingredients = initialIngredients, isLoading: isIngredientsLoading } = useIngredients({
    initialData: initialIngredients,
    staleTime: process.env.NODE_ENV === 'development' ? 10000 : 86400000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  const { ingredientGenres, fetchIngredientGenres } = useGenreStore();
  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
  const [height, setHeight] = useState("auto");
  const [isGenresLoading, setIsGenresLoading] = useState(true);

  useEffect(() => {
    const loadGenres = async () => {
      setIsGenresLoading(true);
      await fetchIngredientGenres();
      setIsGenresLoading(false);
    };
    loadGenres();
  }, [fetchIngredientGenres]);

  useEffect(() => {
    const updateHeight = () => {
      if (isIngredientsLoading || isGenresLoading) return;

      const element = document.getElementById("target");
      
      if (element) {
        const topOffset = element.getBoundingClientRect().top;
        setHeight(`${window.innerHeight - topOffset}px`);
      }
    };

    window.addEventListener("resize", updateHeight);
    updateHeight();

    return () => window.removeEventListener("resize", updateHeight);
  }, [isIngredientsLoading, isGenresLoading]);

  const genres = [
    { id: 0, name: "すべて" },
    ...ingredientGenres,
  ];

  const filteredIngredients =
    selectedGenre === "すべて"
      ? ingredients
      : ingredients.filter((ing) => ing.genre.name === selectedGenre);

  if (isIngredientsLoading || isGenresLoading) {
    return (
      <div className={styles.container_block}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={styles.container_block}>
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
                ingredient={{
                  ...ingredient,
                  imageUrl: typeof ingredient.imageUrl === 'string' ? ingredient.imageUrl : null
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default IngredientSelector;
