"use client";

import styles from "./favorite.module.scss";
import { useState, useEffect } from "react";
import { useFavorites, useSortedRecipes } from "@/app/hooks/recipes";
import { Recipe } from "@/app/types/index";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { useAuth } from "@/app/hooks/useAuth";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import LoginModal from "@/app/components/ui/LoginModal/LoginModal";
import { useRouter } from "next/navigation";
import useGenreStore from "@/app/stores/genreStore";
import useRecipeStore, { SortOption } from "@/app/stores/recipeStore";
import { RecipeSort } from "@/app/components/ui/RecipeSort/RecipeSort";

const FavoritesPage = () => {
  const { user } = useAuth();
  const { data, isLoading } = useFavorites(user?.id || "");
  const { recipeGenres, fetchRecipeGenres } = useGenreStore();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetchRecipeGenres();
  }, []);

  if (!user) {
    return <LoginModal onLogin={() => router.push("/login")} />;
  }

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const favoriteRecipes = data || [];

  // ジャンルと検索クエリでフィルタリング
  const filteredRecipes = favoriteRecipes.filter((recipe: Recipe) => {
    const matchesGenre =
      selectedGenre === "すべて" || recipe.genre?.name === selectedGenre;
    const matchesSearch =
      searchQuery === "" ||
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const sortedRecipes = useSortedRecipes(filteredRecipes);

  return (
    <PageLoading isLoading={isLoading}>
      <div className={styles.container_block}>
        <div className={styles.container_block__header}>
          <h1 className={styles.container_block__title}>お気に入りレシピ</h1>
          <p className={styles.container_block__count}>
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

        {sortedRecipes.length > 0 ? (
          <div className={styles.container_block__list}>
            {sortedRecipes.map((recipe: Recipe) => (
              <div
                key={recipe.id}
                className={`${styles.container_block__item} ${
                  selectedRecipe?.id === recipe.id ? styles.active : ""
                }`}
                onClick={() => handleRecipeClick(recipe)}
              >
                <RecipeCard
                  recipe={recipe}
                  isFavoritePage={true}
                  path="/recipes/"
                  isLink={true}
                  href={`/recipes/${recipe.id}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.container_block__no_recipes}>
            お気に入りのレシピが見つかりません
          </p>
        )}
      </div>
    </PageLoading>
  );
};

export default FavoritesPage; 