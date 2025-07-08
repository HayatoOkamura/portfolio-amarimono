"use client";

import React, { useState, useEffect } from "react";
import styles from "./myrecipe.module.scss";
import { useAuth } from "@/app/hooks/useAuth";
import { useUserRecipes, useSortedRecipes } from "@/app/hooks/recipes";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { Recipe } from "@/app/types/index";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import { withAuth } from "@/app/components/auth/withAuth";
import useGenreStore from "@/app/stores/genreStore";
import useRecipeStore, { SortOption } from "@/app/stores/recipeStore";
import { RecipeSort } from "@/app/components/ui/RecipeSort/RecipeSort";

const ListMyRecipeContent = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useUserRecipes(user?.id);
  const { recipeGenres, fetchRecipeGenres } = useGenreStore();
  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchRecipeGenres();
  }, []);

  const recipes = Array.isArray(data) ? data : [];

  // ジャンルと検索クエリでフィルタリング
  const filteredRecipes = recipes.filter((recipe: Recipe) => {
    const matchesGenre =
      selectedGenre === "すべて" || recipe.genre?.name === selectedGenre;
    const matchesSearch =
      searchQuery === "" ||
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const sortedRecipes = useSortedRecipes(filteredRecipes);

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/user/recipes/${recipeId}`);
  };

  return (
    <PageLoading isLoading={isLoading}>
      <div className={styles.my_recipe_block}>
        <div className={styles.my_recipe_block__inner}>
          <div className={styles.my_recipe_block__header}>
            <h1 className={styles.my_recipe_block__title}>作成したレシピ</h1>
            <p className={styles.my_recipe_block__count}>
              {sortedRecipes.length}
              <span>件</span>
            </p>
          </div>

          <div className={styles.sort_block}>
            <div className={styles.sort_block__box}>
              <div className={styles.sort_block__genre}>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                >
                  <option value="すべて">すべて</option>
                  {recipeGenres.map((genre) => (
                    <option key={genre.id} value={genre.name}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.sort_block__sort}>
                <RecipeSort
                  onSortChange={(sortBy: string) => {
                    useRecipeStore.getState().setSortBy(sortBy as SortOption);
                  }}
                />
              </div>
            </div>

            <div className={styles.sort_block__search}>
              <input
                type="text"
                placeholder="レシピ名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.my_recipe_block__content}>
            {error ? (
              <div>Error: {error.message}</div>
            ) : (
              <div className={styles.my_recipe_block__grid}>
                {sortedRecipes.length > 0 ? (
                  sortedRecipes.map((recipe: Recipe) => (
                    <div
                      key={recipe.id}
                      onClick={() => handleRecipeClick(recipe.id)}
                      className={styles.my_recipe_block__card}
                    >
                      <RecipeCard
                        recipe={recipe}
                        isFavoritePage={false}
                        path="/recipes/"
                        isLink={true}
                        href={`/recipes/${recipe.id}`}
                      />
                    </div>
                  ))
                ) : (
                  <p>No recipes found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLoading>
  );
};

const UserRecipesClient = () => {
  return <ListMyRecipeContent />;
};

export default withAuth(UserRecipesClient); 