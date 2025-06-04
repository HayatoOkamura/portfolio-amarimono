"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import IngredientSelector from "./components/layout/IngredientSelector/IngredientSelector";
import GenerateRecipe from "./components/ui/GenerateRecipe/GenerateRecipe";
import { Ingredient, Recipe } from "./types/index";
import RecipeLoading from "./components/ui/Loading/RecipeLoading";
import { useFetchRecipesAPI } from "./hooks/recipes";
import useRecipeStore from "./stores/recipeStore";
import useIngredientStore from "./stores/ingredientStore";

interface HomePageClientProps {
  initialIngredients: Ingredient[];
}

export default function HomePageClient({ initialIngredients }: HomePageClientProps) {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const { setSearchType, setSearchExecuted, setRecipes } = useRecipeStore();
  const { ingredients } = useIngredientStore();

  const { refetch, isSuccess, data } = useFetchRecipesAPI(
    ingredients.map(ing => ({
      id: ing.id,
      quantity: ing.quantity
    })),
    {
      enabled: true
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
  }, [isSuccess, data, isSearching, setProgress, setSearchType, setSearchExecuted, setRecipes, router]);

  const handleSearch = async () => {
    if (ingredients.length === 0) {
      alert('具材を選択してください');
      return;
    }
    
    setIsSearching(true);
    setProgress(0);
    
      try {
      const result = await refetch();
      
      if (result.isError) {
        console.error('レシピの取得に失敗しました:', result.error);
        alert('レシピの取得に失敗しました。もう一度お試しください。');
        setIsSearching(false);
        return;
      }

      if (!result.isSuccess || !result.data) {
        console.error('レシピデータが取得できませんでした');
        alert('レシピデータが取得できませんでした。もう一度お試しください。');
        setIsSearching(false);
        return;
      }

    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };

  if (isSearching) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100%',
        width: '100%',
        gap: '1rem'
      }}>
        <RecipeLoading progress={progress} />
      </div>
    );
  }

  return (
    <>
      <IngredientSelector 
        initialIngredients={initialIngredients} 
        onSearch={handleSearch}
      />
      <GenerateRecipe onSearch={handleSearch} />
    </>
  );
} 