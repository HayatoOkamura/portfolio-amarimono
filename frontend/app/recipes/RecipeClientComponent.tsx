/* eslint-disable */
"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./RecipeClientComponent.module.scss";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
// Store
import useIngredientStore from "../stores/ingredientStore";
import useRecipeStore, { SortOption } from "../stores/recipeStore";
import useGenreStore from "../stores/genreStore";
// UI
import Loading from "../components/ui/Loading/Loading";
import RecipeCard from "../components/ui/Cards/RecipeCard/RecipeCard";
import StarRating from "@/app/components/ui/StarRating/StarRating";
import ResponsivePieChart from "../components/ui/PieChart/PieChart";
import { RecipeSort } from "../components/ui/RecipeSort/RecipeSort";
// Hooks
import { useFetchRecipesAPI, useSearchRecipes } from "../hooks/recipes";
import { useSortedRecipes } from "../hooks/recipes";
// Utils
import { backendUrl } from "@/app/utils/apiUtils";
import { calculateAverageRating } from "@/app/utils/calculateAverageRating";
// Icon
import { IoMdTime } from "react-icons/io";
import { RiMoneyCnyCircleLine } from "react-icons/ri";
// Types
import { Recipe } from "../types";

const RecipeClientComponent = () => {
  const { ingredients } = useIngredientStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { generatedRecipes, searchType, setSearchType, query } = useRecipeStore();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(
    generatedRecipes[0] || null
  );
  const { recipeGenres, fetchRecipeGenres } = useGenreStore();
  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
  const genres = [
    { id: 0, name: "すべて" },
    ...recipeGenres,
  ];
  const [nextRecipe, setNextRecipe] = useState<Recipe | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [rotate, setRotate] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [borderPosition, setBorderPosition] = useState({ top: 0, left: 0 });
  const [borderSize, setBorderSize] = useState({ width: 0, height: 0 });
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  const { data: fetchedRecipes, isLoading: isFetchingRecipes } = useFetchRecipesAPI(
    ingredients.map((ingredient) => ({ id: ingredient.id, quantity: ingredient.quantity }))
  );
  const { data: searchResults, isLoading: isSearching } = useSearchRecipes(query);

  console.log("fetchedRecipes", fetchedRecipes);
  console.log("selectedRecipe", selectedRecipe);
  console.log("searchResults", searchResults);

  // デバッグ用のログを追加
  console.log('Debug:', {
    searchType,
    query,
    fetchedRecipes,
    searchResults,
    recipes,
    ingredients
  });

  const handleRecipeClick = (recipe: Recipe) => {
    if (recipe.id === selectedRecipe?.id) return;
    setNextRecipe(recipe);
    setRotate(90);
    setIsFadingOut(true);
  };

  const handleRotateComplete = () => {
    if (nextRecipe) {
      setSelectedRecipe(nextRecipe);
      setNextRecipe(null);
      setRotate(0);
      setIsFadingOut(false);
    }
  };

  const filteredRecipes =
    selectedGenre === "すべて"
      ? fetchedRecipes || []
      : (fetchedRecipes || []).filter((recipe: Recipe) => recipe.genre?.name === selectedGenre);

  const sortedRecipes = useSortedRecipes(filteredRecipes);

  const getIngredientName = (id: number): string => {
    const ingredient = ingredients.find((ing) => ing.id === id);
    return ingredient ? ingredient.name : "Unknown Ingredient";
  };

  useEffect(() => {
    if (nextRecipe && containerRef.current) {
      const selectedElement = containerRef.current.querySelector(
        `[data-recipe-id="${nextRecipe.id}"]`
      ) as HTMLDivElement;

      if (nextRecipe) {
        const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = selectedElement;
        setBorderPosition({ top: offsetTop, left: offsetLeft });
        setBorderSize({ width: offsetWidth, height: offsetHeight });
      }
    }
  }, [nextRecipe]);

  useEffect(() => {
    fetchRecipeGenres();
    useRecipeStore.getState().setSortBy("rating_desc");
  }, [fetchRecipeGenres]);

  useEffect(() => {
    // 初期表示時は ingredients で検索
    if (!searchType) {
      setSearchType("ingredients");
      return;
    }

    if (searchType === "ingredients" && fetchedRecipes) {
      console.log('Setting recipes from fetchedRecipes:', fetchedRecipes);
      const sortedRecipes = [...fetchedRecipes].sort((a, b) => {
        const ratingA = calculateAverageRating(a.reviews);
        const ratingB = calculateAverageRating(b.reviews);
        return ratingB - ratingA;
      });
      setRecipes(sortedRecipes);
      setSelectedRecipe(sortedRecipes[0]);
      setLoading(false);
    } else if (searchType === "name" && searchResults) {
      console.log('Setting recipes from searchResults:', searchResults);
      const sortedRecipes = [...searchResults].sort((a, b) => {
        const ratingA = calculateAverageRating(a.reviews);
        const ratingB = calculateAverageRating(b.reviews);
        return ratingB - ratingA;
      });
      setRecipes(sortedRecipes);
      setSelectedRecipe(sortedRecipes[0]);
      setLoading(false);
    }

    return () => setSearchType(null);
  }, [searchType, fetchedRecipes, searchResults]);

  useEffect(() => {
    if (isFetchingRecipes || isSearching) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [isFetchingRecipes, isSearching]);

  useEffect(() => {
    if (recipes.length > 0) {
      requestAnimationFrame(() => {
        const element = document.querySelector(
          `[data-recipe-id="${recipes[0].id}"]`
        ) as HTMLDivElement | null;

        if (element) {
          setBorderPosition({
            top: element.offsetTop,
            left: element.offsetLeft,
          });
          setBorderSize({
            width: element.offsetWidth,
            height: element.offsetHeight,
          });
        }
      });
    }
  }, [recipes]);

  useEffect(() => {
    if (containerElement) {
      const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = containerElement;
      setBorderPosition({ top: offsetTop, left: offsetLeft });
      setBorderSize({ width: offsetWidth, height: offsetHeight });
    }
  }, [containerElement]);

  if (loading) {
    return <Loading />;
  }

  const averageRating = selectedRecipe?.reviews
    ? calculateAverageRating(selectedRecipe.reviews)
    : 0;

  return (
    <div className={styles.recipes_block}>
      {recipes.length === 0 ? (
        <p className="text-center text-lg font-semibold text-gray-700 mt-8">
          作れるレシピがありません。
        </p>
      ) : (
        <div className={styles.recipes_block__inner}>
          <div className={styles.recipes_block__contents}>
            {selectedRecipe && (
              <div className={styles.current_recipe}>
                <motion.div
                  key={selectedRecipe?.id}
                  className={styles.current_recipe__img_wrap}
                  animate={{ rotate }}
                  transition={
                    rotate === 0
                      ? { duration: 0 }
                      : { duration: 0.8, ease: "easeInOut" }
                  }
                  onAnimationComplete={handleRotateComplete}
                >
                  <div className={styles.current_recipe__img}>
                    <div className={styles.current_recipe__img_inner}>
                      <Image
                        fill
                        src={
                          `${backendUrl}/uploads/${selectedRecipe.imageUrl}` ||
                          "/default-image.jpg"
                        }
                        alt={selectedRecipe.name}
                        unoptimized
                      />
                    </div>
                  </div>
                  <div className={`${styles.current_recipe__img} ${styles["next"]}`}>
                    <div className={styles.current_recipe__img_inner}>
                      <Image
                        fill
                        src={
                          nextRecipe
                            ? `${backendUrl}/uploads/${nextRecipe.imageUrl}`
                            : `${backendUrl}/uploads/${selectedRecipe?.imageUrl}` ||
                              "/default-image.jpg"
                        }
                        alt={
                          nextRecipe?.name ||
                          selectedRecipe?.name ||
                          "Recipe Image"
                        }
                        unoptimized
                      />
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className={styles.recipe_name}
                  variants={{
                    hidden: { opacity: 0, x: -50 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  initial={{ opacity: 0, x: 50 }}
                  animate={isFadingOut ? "hidden" : "visible"}
                  exit="hidden"
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <h2 className={styles.current_recipe__title}>
                    {selectedRecipe?.name}
                  </h2>
                </motion.div>
              </div>
            )}
            <div className={styles.sort_block}>
              <div className={styles.sort_block__item}>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                >
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.name}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.sort_block__item}>
                <RecipeSort onSortChange={(sortBy: string) => {
                  useRecipeStore.getState().setSortBy(sortBy as SortOption);
                }} />
              </div>
            </div>
            <div className={styles.recipe_list} ref={containerRef}>
              <motion.div
                className={styles.recipe_list__border}
                animate={{
                  top: borderPosition.top,
                  left: borderPosition.left,
                  width: borderSize.width,
                  height: borderSize.height,
                }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              />
              {sortedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  data-recipe-id={recipe.id}
                  className={styles.recipe_list__item}
                  onClick={() => handleRecipeClick(recipe)}
                >
                  <RecipeCard
                    recipe={recipe}
                    isFavoritePage={false}
                    path="/recipes/"
                  />
                </div>
              ))}
            </div>
          </div>
          <section className={styles.detail_block}>
            <div className={styles.detail_block__inner}>
              {selectedRecipe && (
                <div className={styles.detail_block__contents}>
                  <motion.div
                    className={styles.recipe_name}
                    variants={{
                      hidden: { opacity: 0, x: -50 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    initial={{ opacity: 0, x: 50 }}
                    animate={isFadingOut ? "hidden" : "visible"}
                    exit="hidden"
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <p className={styles.detail_block__genre}>
                      {selectedRecipe.genre ? selectedRecipe.genre.name : "ジャンルなし"}
                    </p>
                  </motion.div>
                  <motion.div
                    className={styles.review_block}
                    variants={{
                      hidden: { opacity: 0, y: -50 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    initial={{ opacity: 0, y: 50 }}
                    animate={isFadingOut ? "hidden" : "visible"}
                    exit="hidden"
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <p className={styles.review_block__average}>
                      {averageRating.toFixed(1)}{" "}
                      <span>({selectedRecipe.reviews?.length ?? 0}件)</span>
                    </p>
                    <StarRating
                      reviews={selectedRecipe.reviews}
                      className={styles.align_center}
                    />
                  </motion.div>
                  <motion.div
                    className={styles.recipe_name}
                    variants={{
                      hidden: { opacity: 0, x: -50 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    initial={{ opacity: 0, x: 50 }}
                    animate={isFadingOut ? "hidden" : "visible"}
                    exit="hidden"
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <div className={styles.detail_block__btn}>
                      <Link href={`/recipes/${selectedRecipe.id}`}>
                        <button>詳しく見る</button>
                      </Link>
                    </div>
                    <div className={styles.units_block}>
                      <div className={styles.units_block__item}>
                        <div className={styles.units_block__title}>
                          <IoMdTime />
                          <p>調理時間</p>
                        </div>
                        <p className={styles.units_block__text}>
                          約<span>{selectedRecipe.cookingTime}</span>分
                        </p>
                      </div>
                      <div className={styles.units_block__item}>
                        <div className={styles.units_block__title}>
                          <RiMoneyCnyCircleLine />
                          <p>費用目安</p>
                        </div>
                        <p className={styles.units_block__text}>
                          約<span>{selectedRecipe.costEstimate}</span>円
                        </p>
                      </div>
                    </div>
                    {selectedRecipe.nutrition && (
                      <ul className={styles.nutrition_block}>
                        <li className={styles.nutrition_block__item}>
                          <p className={styles.nutrition_block__title}>カロリー</p>
                          <div className={styles.nutrition_block__contents}>
                            <p className={styles.nutrition_block__num}>
                              {selectedRecipe.nutrition.calories}
                              <span>kcal</span>
                            </p>
                            <ResponsivePieChart
                              value={
                                selectedRecipe.nutritionPercentage
                                  ? selectedRecipe.nutritionPercentage.calories
                                  : 0
                              }
                            />
                          </div>
                        </li>
                        <li className={styles.nutrition_block__item}>
                          <p className={styles.nutrition_block__title}>炭水化物</p>
                          <div className={styles.nutrition_block__contents}>
                            <p className={styles.nutrition_block__num}>
                              {selectedRecipe.nutrition.carbohydrates}
                              <span>g</span>
                            </p>
                            <ResponsivePieChart
                              value={
                                selectedRecipe.nutritionPercentage
                                  ? selectedRecipe.nutritionPercentage.carbohydrates
                                  : 0
                              }
                            />
                          </div>
                        </li>
                        <li className={styles.nutrition_block__item}>
                          <p className={styles.nutrition_block__title}>脂質</p>
                          <div className={styles.nutrition_block__contents}>
                            <p className={styles.nutrition_block__num}>
                              {selectedRecipe.nutrition.fat}
                              <span>g</span>
                            </p>
                            <ResponsivePieChart
                              value={
                                selectedRecipe.nutritionPercentage
                                  ? selectedRecipe.nutritionPercentage.fat
                                  : 0
                              }
                            />
                          </div>
                        </li>
                        <li className={styles.nutrition_block__item}>
                          <p className={styles.nutrition_block__title}>タンパク質</p>
                          <div className={styles.nutrition_block__contents}>
                            <p className={styles.nutrition_block__num}>
                              {selectedRecipe.nutrition.protein}
                              <span>g</span>
                            </p>
                            <ResponsivePieChart
                              value={
                                selectedRecipe.nutritionPercentage
                                  ? selectedRecipe.nutritionPercentage.protein
                                  : 0
                              }
                            />
                          </div>
                        </li>
                        <li className={styles.nutrition_block__item}>
                          <p className={styles.nutrition_block__title}>塩分</p>
                          <div className={styles.nutrition_block__contents}>
                            <p className={styles.nutrition_block__num}>
                              {selectedRecipe.nutrition.salt}
                              <span>g</span>
                            </p>
                            <ResponsivePieChart
                              value={
                                selectedRecipe.nutritionPercentage
                                  ? selectedRecipe.nutritionPercentage.salt
                                  : 0
                              }
                            />
                          </div>
                        </li>
                        <li className={styles.nutrition_block__item}>
                          <p className={styles.nutrition_block__title}>糖分</p>
                          <div className={styles.nutrition_block__contents}>
                            <p className={styles.nutrition_block__num}>
                              {selectedRecipe.nutrition.sugar}
                              <span>g</span>
                            </p>
                            <ResponsivePieChart
                              value={
                                selectedRecipe.nutritionPercentage
                                  ? selectedRecipe.nutritionPercentage.sugar
                                  : 0
                              }
                            />
                          </div>
                        </li>
                      </ul>
                    )}
                    <div className={styles.ingredients_block}>
                      <h3 className={styles.ingredients_block__title}>材料</h3>
                      <ul className={styles.ingredients_block__list}>
                        {selectedRecipe.ingredients.map((ingredient, idx) => (
                          <li key={idx} className={styles.ingredients_block__item}>
                            <p>{getIngredientName(ingredient.id)}</p>
                            <p>
                              {["大さじ", "小さじ"].includes(ingredient.unit.name)
                                ? `${ingredient.unit.name}${ingredient.quantity}`
                                : `${ingredient.quantity}${ingredient.unit.name}`}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default RecipeClientComponent;
