// "use client";
import React, { useEffect, useState } from "react";
import styles from "./RecipeClientComponent.module.scss"
import useIngredientStore from "../stores/ingredientStore";
import Loading from "../components/ui/Loading/Loading";
import RecipeCard from "../components/ui/Cards/RecipeCard/RecipeCard";
import { Recipe } from "../types";
import { fetchRecipesAPI } from "../hooks/recipes";

// クライアントコンポーネントでレシピを表示する
const RecipeClientComponent = () => {
  const { ingredients } = useIngredientStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (ingredients.length > 0) {
      fetchRecipesAPI(ingredients)
        .then((fetchedRecipes) => {
          setRecipes(fetchedRecipes);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching recipes:", error);
          setLoading(false);
        });
    }
  }, [ingredients]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={styles.container_block}>
      {recipes.length === 0 ? (
        <p className="text-center text-lg font-semibold text-gray-700 mt-8">
          作れるレシピがありません。
        </p>
      ) : (
        <div className={styles.recipe_list}>
          {recipes.map((recipe) => (
            <div key={recipe.id} className={styles.recipe_list__item}>
              <RecipeCard
                recipe={recipe}
                isFavoritePage={false}
                path="/recipes/"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeClientComponent;
