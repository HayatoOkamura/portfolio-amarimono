"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import IngredientSelector from "./components/layout/IngredientSelector/IngredientSelector";
import GenerateRecipe from "./components/ui/GenerateRecipe/GenerateRecipe";
import SearchModeMenu from "./components/ui/SearchModeMenu/SearchModeMenu";
import { Ingredient, Recipe } from "./types/index";
import RecipeLoading from "./components/ui/Loading/RecipeLoading";
import { useFetchRecipesAPI } from "./hooks/recipes";
import useRecipeStore from "./stores/recipeStore";
import useIngredientStore from "./stores/ingredientStore";
import styles from "@/app/styles/HomePage.module.scss";
import { ResponsiveWrapper } from "./components/common/ResponsiveWrapper";

interface HomePageClientProps {
  initialIngredients: Ingredient[];
}

export default function HomePageClient({
  initialIngredients,
}: HomePageClientProps) {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSearchModeModalOpen, setIsSearchModeModalOpen] = useState(false);
  const [isGenerateRecipeModalOpen, setIsGenerateRecipeModalOpen] =
    useState(false);
  const { setSearchType, setSearchExecuted, setRecipes } = useRecipeStore();
  const { ingredients, searchMode, setSearchMode } = useIngredientStore();

  const { refetch, isSuccess, data } = useFetchRecipesAPI(
    ingredients.map((ing) => ({
      id: ing.id,
      quantity: ing.quantity,
    })),
    searchMode,
    {
      enabled: false,
    }
  );

  useEffect(() => {
    if (isSuccess && data && isSearching) {
      setProgress(100);
      setSearchType("ingredients");
      setSearchExecuted(true);
      setRecipes(data);
      setTimeout(() => {
        router.push("/recipes");
      }, 3000);
    }
  }, [
    isSuccess,
    data,
    isSearching,
    setProgress,
    setSearchType,
    setSearchExecuted,
    setRecipes,
    router,
  ]);

  // モーダル開閉時のbodyスクロール制御
  useEffect(() => {
    if (isSearchModeModalOpen || isGenerateRecipeModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSearchModeModalOpen, isGenerateRecipeModalOpen]);

  const handleSearch = async () => {
    if (ingredients.length === 0) {
      toast.error("具材を選択してください");
      return;
    }

    setIsSearching(true);
    setProgress(0);

    try {
      const result = await refetch();

      if (result.isError) {
        console.error("レシピの取得に失敗しました:", result.error);
        toast.error("レシピの取得に失敗しました。もう一度お試しください。");
        setIsSearching(false);
        return;
      }

      if (!result.isSuccess || !result.data) {
        console.error("レシピデータが取得できませんでした");
        toast.error("レシピデータが取得できませんでした。もう一度お試しください。");
        setIsSearching(false);
        return;
      }
    } catch (error) {
      console.error("Search error:", error);
      setIsSearching(false);
    }
  };

  const handleSearchModeChange = (mode: any) => {
    setSearchMode(mode);
  };

  const handleCloseSearchModeModal = () => {
    setIsSearchModeModalOpen(false);
  };

  const handleOpenGenerateRecipeModal = () => {
    setIsGenerateRecipeModalOpen(true);
  };

  const handleCloseGenerateRecipeModal = () => {
    setIsGenerateRecipeModalOpen(false);
  };

  if (isSearching) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100%",
          width: "100%",
          gap: "1rem",
        }}
      >
        <RecipeLoading progress={progress} />
      </div>
    );
  }

  return (
    <>
      <IngredientSelector initialIngredients={initialIngredients} />
      <GenerateRecipe onSearch={handleSearch} />
      <ResponsiveWrapper breakpoint="sp" renderAbove={null}>
        {/* スマホ用のボタン群 */}
        <div className={styles.mobile_button_block}>
          <div className={styles.mobile_button_block__rules}>
            <button
              onClick={() => setIsSearchModeModalOpen(true)}
              aria-expanded={isSearchModeModalOpen}
              aria-haspopup="true"
            >
              レシピ検索条件
            </button>
            <button
              onClick={handleOpenGenerateRecipeModal}
              data-onboarding="settings-button"
            >
              選択した具材
            </button>
          </div>

          <div className={styles.mobile_button_block__search}>
            <button
              onClick={handleSearch}
              data-onboarding="mobile-search-button"
            >
              レシピを検索
            </button>
          </div>
        </div>
        {/* SearchModeMenuのモーダル */}
        <SearchModeMenu
          currentMode={searchMode}
          onModeChange={handleSearchModeChange}
          isModalOpen={isSearchModeModalOpen}
          onCloseModal={handleCloseSearchModeModal}
        />
        {/* GenerateRecipeのモーダル */}
        <GenerateRecipe
          onSearch={handleSearch}
          isModalOpen={isGenerateRecipeModalOpen}
          onCloseModal={handleCloseGenerateRecipeModal}
        />
      </ResponsiveWrapper>
    </>
  );
}
