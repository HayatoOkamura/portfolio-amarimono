"use client";
import React, { Suspense, useEffect } from "react";
import useRecipeStore from "../stores/recipeStore";
import { usePathname } from "next/navigation";

const RecipesPageContent = () => {
  const { recipes, error, clearRecipes } = useRecipeStore();
  const pathname = usePathname();
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

    useEffect(() => {
      // ページ遷移時にrecipesをクリア
      return () => {
        if (pathname !== "/recipes") {
          clearRecipes();
        }
      };
    }, [pathname, clearRecipes]);

  if (error) {
    return <p className="text-red-500 text-center mt-4">エラー: {error}</p>;
  }

  if (!recipes?.length) {
    return <p className="text-center text-lg font-semibold text-gray-700 mt-8">
      作れるレシピがありません。
    </p>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-10 text-gray-800">
        生成されたレシピ
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.isArray(recipes) &&
          recipes.map((recipe, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105"
            >
              <img
                src={
                  recipe.imageUrl
                    ? `${backendUrl}/${recipe.imageUrl}`
                    : "/default-image.jpg"
                }
                alt={recipe.name}
                className="w-full h-60 object-cover"
              />
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  {recipe.name}
                </h2>
                <p className="text-gray-500 mb-4">ジャンル: {recipe.genre}</p>

                {/* 材料リスト */}
                <h3 className="font-semibold text-lg mb-2">材料</h3>
                <ul className="list-disc list-inside mb-4">
                  {Array.isArray(recipe.ingredients) &&
                    recipe.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="text-gray-600">
                        {ingredient.name} ({ingredient.quantity} 個)
                      </li>
                    ))}
                </ul>

                {/* 調理手順 */}
                <h3 className="font-semibold text-lg mb-2">調理手順</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  {Array.isArray(recipe.instructions) &&
                    recipe.instructions.map((step, idx) => (
                      <li key={idx}>
                        <strong>Step {step.stepNumber}:</strong>{" "}
                        {step.description}
                      </li>
                    ))}
                </ol>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

const RecipesPage = () => {
  return (
    <Suspense fallback={<p className="text-center mt-8">読み込み中...</p>}>
      <RecipesPageContent />
    </Suspense>
  );
};

export default RecipesPage;
