/* eslint-disable */
"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import useIngredientStore from "@/app/stores/ingredientStore";
import useGenreStore from "@/app/stores/genreStore";
import RegistrationForm from "@/app/components/ui/RegistrationForm/RecipeRegistration";

const RecipeRegistration: React.FC = () => {
  const { user } = useAuth();
  const { fetchIngredients } = useIngredientStore();
  const { fetchRecipeGenres } = useGenreStore();
  useEffect(() => {
    fetchIngredients();
    fetchRecipeGenres();
  }, [fetchIngredients, fetchRecipeGenres]);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-3xl font-bold mb-6 text-center">Recipe List</h2>

      <RegistrationForm />
    </div>
  );
};

export default RecipeRegistration;
