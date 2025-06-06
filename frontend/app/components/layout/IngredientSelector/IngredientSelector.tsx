"use client";

import React, { useState, useEffect } from "react";
import styles from "./IngredientSelector.module.scss";
import useGenreStore from "@/app/stores/genreStore";
import { useIngredients } from "@/app/hooks/ingredients";
import IngredientCard from "../../ui/Cards/SearchIngredientCard/SearchIngredientCard";
import CategoryCard from "../../ui/Cards/CategoryCard/CategoryCard";
import Loading from "../../ui/Loading/Loading";
import { Ingredient } from "@/app/types/index";
import { useRouter } from "next/navigation";
import { useUserIngredientDefaults } from "@/app/hooks/userIngredientDefaults";
import { useAuth } from "@/app/hooks/useAuth";
import useIngredientStore from "@/app/stores/ingredientStore";

interface IngredientSelectorProps {
  initialIngredients: Ingredient[];
  onSearch: () => Promise<void>;
}

const IngredientSelector = ({
  initialIngredients,
  onSearch,
}: IngredientSelectorProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: userDefaults } = useUserIngredientDefaults();
  const { addIngredient } = useIngredientStore();

  const {
    data: ingredients = initialIngredients,
    isLoading: isIngredientsLoading,
  } = useIngredients({
    initialData: initialIngredients,
    staleTime: process.env.ENVIRONMENT === "development" ? 10000 : 86400000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { ingredientGenres, fetchIngredientGenres } = useGenreStore();
  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
  const [height, setHeight] = useState("auto");
  const [isGenresLoading, setIsGenresLoading] = useState(true);

  // 初期設定の反映
  useEffect(() => {
    const applyDefaults = () => {
      if (user && userDefaults) {
        // 認証済みユーザーの場合
        userDefaults.forEach((default_) => {
          const ingredient = ingredients?.find(ing => ing.id === default_.ingredient_id);
          if (ingredient) {
            addIngredient({
              ...ingredient,
              quantity: default_.default_quantity,
            });
          }
        });
      } else {
        // 未認証ユーザーの場合
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        const cookieData = getCookie('ingredient_defaults');
        if (cookieData) {
          try {
            const defaultIngredients = JSON.parse(decodeURIComponent(cookieData));
            defaultIngredients.forEach((default_: { ingredient_id: number; default_quantity: number }) => {
              const ingredient = ingredients?.find(ing => ing.id === default_.ingredient_id);
              if (ingredient) {
                addIngredient({
                  ...ingredient,
                  quantity: default_.default_quantity,
                });
              }
            });
          } catch (error) {
            console.error('Error parsing cookie data:', error);
          }
        }
      }
    };

    if (!isIngredientsLoading && ingredients) {
      applyDefaults();
    }
  }, [user, userDefaults, ingredients, isIngredientsLoading, addIngredient]);

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
        setHeight(`${window.innerHeight - topOffset - 20}px`);
      }
    };

    window.addEventListener("resize", updateHeight);
    updateHeight();

    return () => window.removeEventListener("resize", updateHeight);
  }, [isIngredientsLoading, isGenresLoading]);

  const genres = [{ id: 0, name: "すべて" }, ...ingredientGenres];

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
      {/* カテゴリカード */}
      <section
        className={styles.category_block}
        data-onboarding="category-filter"
      >
        <h2 className={styles.category_block__title}>具材カテゴリー</h2>
        <div className={styles.category_block__contents}>
          {genres.map((genre) => (
            <CategoryCard
              key={genre.id}
              genre={genre}
              onClick={() => setSelectedGenre(genre.name)}
              isSelected={genre.name === selectedGenre}
            />
          ))}
        </div>
      </section>

      {/* 具材一覧 */}
      <section className={styles.ingredient_block}>
        <div
          className={styles.ingredient_block__overlay}
          data-onboarding="ingredient-selector"
        ></div>
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
                  imageUrl:
                    typeof ingredient.imageUrl === "string"
                      ? ingredient.imageUrl
                      : null,
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
