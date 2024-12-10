/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import useIngredientStore from "./stores/ingredientStore";
import { fetchRecipesAPI } from "./hooks/useRecipes";

const IngredientSelector = () => {
  const {
    ingredients,
    fetchIngredients,
    increaseIngredientQuantity,
    decreaseIngredientQuantity
  } = useIngredientStore();

  // 初回レンダリング時に具材を取得
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const [recipes, setRecipes] = useState<
    { id: number; name: string; instructions: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRecipes = async () => {
    setLoading(true);
    setError("");

    try {
      const filteredIngredients = ingredients
        .filter((ingredient) => ingredient.quantity > 0)
        .map(({ id, quantity }) => ({ id, quantity }));

      const response = await fetchRecipesAPI(filteredIngredients); // 新規関数の使用
      setRecipes(response); // レシピを更新
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
      setRecipes([]); // エラー時にレシピをクリア
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Ingredients</h2>
      <div>
        {ingredients.map((ingredient) => (
          <div key={ingredient.id} style={{ marginBottom: "10px" }}>
            <span>
              {ingredient.name}: {ingredient.quantity}
            </span>
            <button
              style={{ marginLeft: "10px" }}
              onClick={() => increaseIngredientQuantity(ingredient.id)}
            >
              +
            </button>
            <button
              style={{ marginLeft: "5px" }}
              onClick={() => decreaseIngredientQuantity(ingredient.id)}
            >
              -
            </button>
          </div>
        ))}
      </div>

      <button onClick={fetchRecipes} style={{ marginTop: "20px" }}>
        Generate Recipes
      </button>

      {loading && <p>Loading recipes...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Recipes</h2>
      {recipes.length > 0 ? (
        <ul>
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <h3>{recipe.name}</h3>
              <p>{recipe.instructions}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No recipes found</p>
      )}
    </div>
  );
};

export default IngredientSelector;
