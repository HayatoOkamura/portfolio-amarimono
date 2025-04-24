/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { imageBaseUrl } from "@/app/utils/api";
import Image from "next/image";
import {
  useRecipes,
  useDeleteRecipe,
  useSortedRecipes,
} from "@/app/hooks/recipes";
import { useIngredients } from "@/app/hooks/ingredients";
import useGenreStore from "@/app/stores/genreStore";
import useRecipeStore, { SortOption } from "@/app/stores/recipeStore";
import { Ingredient, Instruction, Recipe } from "@/app/types/index";
import Link from "next/link";
import { calculateAverageRating } from "@/app/utils/calculateAverageRating";
import { RecipeSort } from "@/app/components/ui/RecipeSort/RecipeSort";
import StarRating from "@/app/components/ui/StarRating/StarRating";
import styles from "./recipe.module.scss";
import { LuClipboardPen } from "react-icons/lu";

const AdminRecipes = () => {
  const { data: recipes, isLoading } = useRecipes();
  const { data: ingredients = [] } = useIngredients();
  const { recipeGenres, fetchRecipeGenres } = useGenreStore();
  const deleteRecipeMutation = useDeleteRecipe();
  const { sortBy, setSortBy } = useRecipeStore();
  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchRecipeGenres();
  }, []);

  const handleDeleteRecipe = async (id: string) => {
    if (confirm("Are you sure you want to delete this recipe?")) {
      try {
        await deleteRecipeMutation.mutateAsync(id);
      } catch (err: any) {
        console.error(err.message);
      }
    }
  };

  const getIngredientName = (id: number) => {
    const ingredient = ingredients.find((ingredient) => ingredient.id === id);
    return ingredient ? ingredient.name : "Unknown Ingredient";
  };

  // ジャンルと検索クエリでフィルタリング
  const filteredRecipes = (recipes || []).filter((recipe: Recipe) => {
    const matchesGenre =
      selectedGenre === "すべて" || recipe.genre?.name === selectedGenre;
    const matchesSearch =
      searchQuery === "" ||
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const sortedRecipes = useSortedRecipes(filteredRecipes);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className={styles.recipes_block}>
      <div className={styles.head_block}>
        <div className={styles.head_block__title_box}>
          <h2 className={styles.head_block__title}>レシピ一覧</h2>
          <span className={styles.head_block__sum}>100件</span>
        </div>
        <div className={styles.head_block__btn}>
          <Link href="/admin/recipes/new">レシピを追加</Link>
        </div>
      </div>

      <div className={styles.sort_block}>
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
        <div className={styles.sort_block__box}>
          <div className={styles.sort_block__sort}>
            <RecipeSort
              onSortChange={(sortBy: string) => {
                useRecipeStore.getState().setSortBy(sortBy as SortOption);
              }}
            />
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
      </div>

      <ul className={styles.detail_block}>
        {Array.isArray(sortedRecipes) &&
          sortedRecipes.map((recipe) => (
            <li
              key={recipe.id}
              className={`${styles.detail_block__item} ${
                recipe.isDraft && styles["detail_block__item--draft"]
              }`}
            >
              <div className={styles.detail_block__img}>
                {recipe.isDraft && (
                  <div className={styles.detail_block__draft}>
                    <LuClipboardPen />
                    <p>下書き</p>
                  </div>
                )}
                <Image
                  src={
                    recipe.imageUrl
                      ? `${imageBaseUrl}/uploads/${recipe.imageUrl}`
                      : "/images/common/pic_recipe_default.webp"
                  }
                  alt={recipe.name}
                  className={styles.recipes_block}
                  width={200}
                  height={200}
                />
              </div>
              <div className={styles.detail_block__contents}>
                <p className={styles.detail_block__title}>{recipe.name}</p>
                <div className={styles.review_block}>
                  <StarRating
                    reviews={recipe.reviews}
                    className={styles.review_block__list}
                    size={16}
                  />
                </div>
                <div className={styles.btn_block}>
                  <div
                    className={`${styles.btn_block__item} ${styles["btn_block__item--edit"]}`}
                  >
                    <Link href={`/admin/recipes/${recipe.id}`}>詳細</Link>
                  </div>
                  <div
                    className={`${styles.btn_block__item} ${styles["btn_block__item--delete"]}`}
                  >
                    <button onClick={() => handleDeleteRecipe(recipe.id)}>
                      削除
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default AdminRecipes;
