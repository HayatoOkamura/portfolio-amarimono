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

  const { refetch } = useFetchRecipesAPI(
    ingredients.map(ing => ({
      id: ing.id,
      quantity: ing.quantity
    })),
    {
      enabled: false,
      onSuccess: (data: Recipe[]) => {
        console.log('Fetch successful, recipes:', data);
        setProgress(100);
        setSearchType("ingredients");
        setSearchExecuted(true);
        setRecipes(data);
        // 最低3秒間のアニメーション表示を維持
        setTimeout(() => {
          router.push("/recipes");
        }, 3000);
      }
    }
  );

  const handleSearch = async () => {
    if (ingredients.length === 0) {
      alert('具材を選択してください');
      return;
    }
    
    setIsSearching(true);
    setProgress(0);
    console.log('検索開始: 0%');
    
    try {
      const result = await refetch();
      console.log('Refetch result:', result);
      
      if (result.data) {
        console.log('Setting recipes:', result.data);
        setProgress(100);
        setSearchType("ingredients");
        setSearchExecuted(true);
        setRecipes(result.data);
        // 最低3秒間のアニメーション表示を維持
        setTimeout(() => {
          router.push("/recipes");
        }, 3000);
      } else if (result.error) {
        console.error('Fetch error:', result.error);
      }
    } catch (error) {
      console.error('Search error:', error);
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