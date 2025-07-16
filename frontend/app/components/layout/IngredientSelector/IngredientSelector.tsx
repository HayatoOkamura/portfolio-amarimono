"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import SearchModeMenu from "../../ui/SearchModeMenu/SearchModeMenu";
import { useTextSearch } from "@/app/hooks/useTextSearch";
import { ResponsiveWrapper } from "@/app/components/common/ResponsiveWrapper";
import { useScreenSize } from "@/app/hooks/useScreenSize";
import ImagePreloader from "../../ui/ImagePreloader/ImagePreloader";

interface IngredientSelectorProps {
  initialIngredients: Ingredient[];
}

const IngredientSelector = ({
  initialIngredients,
}: IngredientSelectorProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: userDefaults } = useUserIngredientDefaults();
  const { addIngredient, searchMode, setSearchMode } = useIngredientStore();
  const isSmartphone = useScreenSize('sp');

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
  const [searchResults, setSearchResults] = useState<boolean[]>([]);

  // 検索機能の初期化
  const { searchTerm, setSearchTerm, isSearching, executeSearch } =
    useTextSearch({
      useAsync: true,
      debounceMs: 300,
    });

  // 初期設定の反映
  useEffect(() => {
    const applyDefaults = () => {
      if (user && userDefaults) {
        // 認証済みユーザーの場合
        userDefaults.forEach((default_) => {
          const ingredient = ingredients?.find(
            (ing) => ing.id === default_.ingredient_id
          );
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
          if (parts.length === 2) return parts.pop()?.split(";").shift();
          return null;
        };

        const cookieData = getCookie("ingredient_defaults");
        if (cookieData) {
          try {
            const defaultIngredients = JSON.parse(
              decodeURIComponent(cookieData)
            );
            defaultIngredients.forEach(
              (default_: {
                ingredient_id: number;
                default_quantity: number;
              }) => {
                const ingredient = ingredients?.find(
                  (ing) => ing.id === default_.ingredient_id
                );
                if (ingredient) {
                  addIngredient({
                    ...ingredient,
                    quantity: default_.default_quantity,
                  });
                }
              }
            );
          } catch (error) {
            console.error("Error parsing cookie data:", error);
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

      // スマートフォン画面の場合は処理をスキップ
      if (isSmartphone) return;

      const element = document.getElementById("target");
      if (element) {
        const topOffset = element.getBoundingClientRect().top;
        setHeight(`${window.innerHeight - topOffset - 20}px`);
      }
    };

    window.addEventListener("resize", updateHeight);
    updateHeight();

    return () => window.removeEventListener("resize", updateHeight);
  }, [isIngredientsLoading, isGenresLoading, isSmartphone]);

  // 検索実行
  useEffect(() => {
    const performSearch = async () => {
      if (!ingredients) return;

      const ingredientNames = ingredients.map((ing) => ing.name);
      const results = await executeSearch(ingredientNames);
      setSearchResults(results);
    };

    performSearch();
  }, [ingredients, executeSearch]);

  const genres = [{ id: 0, name: "すべて" }, ...ingredientGenres];

  const filteredIngredients = useMemo(() => {
    if (!ingredients) return [];

    return ingredients
      .filter((ingredient, index) => {
        const matchesSearch = searchResults[index] ?? true;
        const matchesGenre =
          selectedGenre === "すべて" || ingredient.genre.name === selectedGenre;
        return matchesSearch && matchesGenre;
      })
      .sort((a, b) => {
        // まずgenre_idでソート
        if (a.genre.id !== b.genre.id) {
          return a.genre.id - b.genre.id;
        }
        // 同じジャンル内ではidでソート
        return a.id - b.id;
      });
  }, [ingredients, searchResults, selectedGenre]);

  if (isIngredientsLoading || isGenresLoading) {
    return (
      <div className={styles.container_block}>
        <Loading />
      </div>
    );
  }

  // 最初の8つの具材の画像URLを取得
  const priorityImageUrls = filteredIngredients
    .slice(0, 8)
    .map(ingredient => ingredient.imageUrl)
    .filter((url): url is string => typeof url === "string");

  return (
    <div className={styles.container_block}>
      {/* 重要な画像のプリロード */}
      <ImagePreloader imageUrls={priorityImageUrls} />
      
      {/* カテゴリカード */}
      <section
        className={styles.category_block}
        data-onboarding="category-filter"
        aria-label="具材カテゴリー選択"
      >
        {/* category_block__titleをスマホ時は非表示 */}
        <ResponsiveWrapper breakpoint="sp" renderBelow={null}>
          <h2 className={styles.category_block__title}>具材カテゴリー</h2>
        </ResponsiveWrapper>
        <div className={styles.category_block__contents} role="tablist" aria-label="具材カテゴリー">
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
      <section className={styles.ingredient_block} aria-label="具材選択">
        <div
          className={styles.ingredient_block__overlay}
          data-onboarding="ingredient-selector"
        ></div>

        <ResponsiveWrapper breakpoint="sp" renderBelow={null}>
          <div className={styles.ingredient_head_block}>
            <div className={styles.ingredient_head_block__contents}>
              <h2 className={styles.ingredient_head_block__title}>具材一覧</h2>
              <p className={styles.ingredient_head_block__note}>
                ※画像はイメージです
              </p>
            </div>
            <ResponsiveWrapper breakpoint="sp" renderBelow={null}>
              
            <div className={styles.ingredient_head_block__button}>
              <SearchModeMenu
                currentMode={searchMode}
                onModeChange={setSearchMode}
                data-onboarding="search-mode-menu"
              />
            </div>
            </ResponsiveWrapper>
          </div>
        </ResponsiveWrapper>

        {/* 検索機能 */}
        <div className={styles.search_block}>
          <input
            type="text"
            placeholder="具材を検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.search_block__input}
            aria-label="具材名で検索"
            aria-describedby={isSearching ? "search-status" : undefined}
          />
          {isSearching && (
            <div className={styles.search_block__loading} id="search-status" aria-live="polite">
              検索中...
            </div>
          )}
        </div>

        <div
          className={styles.ingredient_block__wrapper}
          id="target"
          style={{ height }}
          role="grid"
          aria-label="具材グリッド"
        >
          <div className={styles.ingredient_block__contents}>
            {filteredIngredients.map((ingredient, index) => (
              <IngredientCard
                key={ingredient.id}
                ingredient={{
                  ...ingredient,
                  imageUrl:
                    typeof ingredient.imageUrl === "string"
                      ? ingredient.imageUrl
                      : null,
                }}
                isPriority={index < 8} // 最初の8つの画像を優先読み込み
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default IngredientSelector;
