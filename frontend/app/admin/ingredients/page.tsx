/* eslint-disable */
"use client";

import useIngredientStore from "../../stores/ingredientStore"
import { useEffect } from "react";

const IngredientsPage = () => {
  const {
    ingredients,
    error,
    newIngredient,
    fetchIngredients,
    addIngredient,
    setNewIngredient,
  } = useIngredientStore();

  // 初回レンダリング時に具材を取得
  useEffect(() => {
    fetchIngredients();
  }, []);

  return (
    <div>
      <h1>Ingredients</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {ingredients.map((ing: any, index: number) => (
          <li key={index}>{ing.name}</li>
        ))}
      </ul>
      <input
        type="text"
        value={newIngredient}
        style={{color: "#000"}}
        onChange={(e) => setNewIngredient(e.target.value)}
      />
      <button onClick={() => addIngredient(newIngredient)}>Add Ingredient</button>
    </div>
  );
};

export default IngredientsPage;
