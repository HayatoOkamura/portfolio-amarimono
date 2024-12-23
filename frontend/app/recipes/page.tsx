"use client";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

const RecipesPageContent = () => {
  const searchParams = useSearchParams();
  const recipesParam = searchParams.get("data");
  const recipes = recipesParam
    ? JSON.parse(decodeURIComponent(recipesParam))
    : [];
    

  if (!recipes || recipes.length === 0) {
    return <p>レシピが見つかりませんでした。</p>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>生成されたレシピ</h1>
      {recipes.map((recipe: string, index: number) => (
        <p key={index}>{recipe}</p>
      ))}
    </div>
  );
};

const RecipesPage = () => {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <RecipesPageContent />
    </Suspense>
  );
};

export default RecipesPage;
