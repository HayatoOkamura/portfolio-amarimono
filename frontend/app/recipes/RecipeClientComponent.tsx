/* eslint-disable */
"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./RecipeClientComponent.module.scss";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
// Store
import useIngredientStore from "../stores/ingredientStore";
import useRecipeStore from "../stores/recipeStore";
import useGenreStore from "../stores/genreStore";
// UI
import Loading from "../components/ui/Loading/Loading";
import RecipeCard from "../components/ui/Cards/RecipeCard/RecipeCard";
import StarRating from "@/app/components/ui/StarRating/StarRating";
import ResponsivePieChart from "../components/ui/PieChart/PieChart";
import { RecipeSort } from "../components/ui/RecipeSort/RecipeSort";
// Hooks
import { fetchRecipesAPI } from "../hooks/recipes";
import { useSortedRecipes, fetchSearchRecipes } from "../hooks/recipes";
// Utils
import { backendUrl } from "@/app/utils/apiUtils";
import { calculateAverageRating } from "@/app/utils/calculateAverageRating";
// Icon
import { IoMdTime } from "react-icons/io";
import { RiMoneyCnyCircleLine } from "react-icons/ri";
// Types
import { Recipe } from "../types";

// クライアントコンポーネントでレシピを表示する
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
    { id: 0, name: "すべて" }, // "すべて" を追加
    ...recipeGenres, // Zustand で管理するジャンルを展開
  ];
  const [nextRecipe, setNextRecipe] = useState<Recipe | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [rotate, setRotate] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [borderPosition, setBorderPosition] = useState({ top: 0, left: 0 });
  const [borderSize, setBorderSize] = useState({ width: 0, height: 0 });
  const [containerElement, setContainerElement] =
    useState<HTMLDivElement | null>(null);

  const handleRecipeClick = (recipe: Recipe) => {
    if (recipe.id === selectedRecipe?.id) return; // 同じレシピなら無視
    setNextRecipe(recipe); // `nextRecipe` を先にセット
    setRotate(90); // アニメーション開始
    setIsFadingOut(true);
  };

  const handleRotateComplete = () => {
    if (nextRecipe) {
      setSelectedRecipe(nextRecipe); // アニメーション完了後に `selectedRecipe` を更新
      setNextRecipe(null); // `nextRecipe` をリセット
      setRotate(0);
      setIsFadingOut(false);
    }
  };

  const filteredRecipes =
    selectedGenre === "すべて"
      ? recipes
      : recipes.filter((ing) => ing.genre.name === selectedGenre);

  const sortedRecipes = useSortedRecipes(filteredRecipes);

  // idを元にIngredientのnameを取得する関数
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
        const { offsetTop, offsetLeft, offsetWidth, offsetHeight } =
          selectedElement;
        setBorderPosition({ top: offsetTop, left: offsetLeft });
        setBorderSize({ width: offsetWidth, height: offsetHeight });
      }
    }
  }, [nextRecipe]);

  useEffect(() => {
    fetchRecipeGenres();
  }, [fetchRecipeGenres]);

  useEffect(() => {
    if (searchType === "ingredients") {
      fetchRecipesAPI(ingredients)
        .then((fetchedRecipes) => {
          setRecipes(fetchedRecipes);
          setSelectedRecipe(fetchedRecipes[0]);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching recipes:", error);
          setLoading(false);
        });
    } else if (searchType === "name") {
      fetchSearchRecipes(query)
        .then((fetchedRecipes) => {
          setRecipes(fetchedRecipes);
          setSelectedRecipe(fetchedRecipes[0]);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching recipes:", error);
          setLoading(false);
        });
    }

    // 検索処理が完了したら searchType をリセット
    return () => setSearchType(null);
  }, [searchType]);

  // ★ recipes が更新された後に、レンダリングが完了してから要素を取得する
  useEffect(() => {
    if (recipes.length > 0) {
      requestAnimationFrame(() => {
        const element = document.querySelector(
          `[data-recipe-id="${recipes[0].id}"]`
        ) as HTMLDivElement | null;

        console.log("取得した要素:", element);

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
  }, [recipes]); // ★ recipes の更新を監視

  useEffect(() => {
    // `containerElement` がセットされた後に borderPosition と borderSize を設定
    if (containerElement) {
      const { offsetTop, offsetLeft, offsetWidth, offsetHeight } =
        containerElement;
      setBorderPosition({ top: offsetTop, left: offsetLeft });
      setBorderSize({ width: offsetWidth, height: offsetHeight });
    }
  }, [containerElement]);

  if (loading) {
    return <Loading />;
  }

  // 平均評価の計算
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
                  <div
                    className={`${styles.current_recipe__img} ${styles["next"]}`}
                  >
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
                {/* レシピ名のフェードアウト & フェードイン */}
                <motion.div
                  className={styles.recipe_name}
                  variants={{
                    hidden: { opacity: 0, x: -50 }, // 左にフェードアウト
                    visible: { opacity: 1, x: 0 }, // 通常状態
                  }}
                  initial={{ opacity: 0, x: 50 }} // 右からスライドして表示
                  animate={isFadingOut ? "hidden" : "visible"}
                  exit="hidden" // 削除時のアニメーション
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
                <RecipeSort />
              </div>
            </div>
            <div className={styles.recipe_list} ref={containerRef}>
              {/* sortedRecipes を表示 */}
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
                      hidden: { opacity: 0, x: -50 }, // 左にフェードアウト
                      visible: { opacity: 1, x: 0 }, // 通常状態
                    }}
                    initial={{ opacity: 0, x: 50 }} // 右からスライドして表示
                    animate={isFadingOut ? "hidden" : "visible"}
                    exit="hidden" // 削除時のアニメーション
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <p className={styles.detail_block__genre}>
                      {selectedRecipe.genre.name}
                    </p>
                  </motion.div>
                  <motion.div
                    className={styles.review_block}
                    variants={{
                      hidden: { opacity: 0, y: -50 }, // 左にフェードアウト
                      visible: { opacity: 1, y: 0 }, // 通常状態
                    }}
                    initial={{ opacity: 0, y: 50 }} // 右からスライドして表示
                    animate={isFadingOut ? "hidden" : "visible"}
                    exit="hidden" // 削除時のアニメーション
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
                      hidden: { opacity: 0, x: -50 }, // 左にフェードアウト
                      visible: { opacity: 1, x: 0 }, // 通常状態
                    }}
                    initial={{ opacity: 0, x: 50 }} // 右からスライドして表示
                    animate={isFadingOut ? "hidden" : "visible"}
                    exit="hidden" // 削除時のアニメーション
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
                    <ul className={styles.nutrition_block}>
                      <li className={styles.nutrition_block__item}>
                        <p className={styles.nutrition_block__title}>
                          カロリー
                        </p>
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
                        <p className={styles.nutrition_block__title}>
                          炭水化物
                        </p>
                        <div className={styles.nutrition_block__contents}>
                          <p className={styles.nutrition_block__num}>
                            {selectedRecipe.nutrition.carbohydrates}
                            <span>g</span>
                          </p>
                          <ResponsivePieChart
                            value={
                              selectedRecipe.nutritionPercentage
                                ? selectedRecipe.nutritionPercentage
                                    .carbohydrates
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
                        <p className={styles.nutrition_block__title}>
                          タンパク質
                        </p>
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
                    {/* 材料リスト */}
                    <div className={styles.ingredients_block}>
                      <h3 className={styles.ingredients_block__title}>材料</h3>
                      <ul className={styles.ingredients_block__list}>
                        {selectedRecipe.ingredients.map((ingredient, idx) => (
                          <li
                            key={idx}
                            className={styles.ingredients_block__item}
                          >
                            <p>{getIngredientName(ingredient.id)}</p>
                            <p>
                              {["大さじ", "小さじ"].includes(
                                ingredient.unit.name
                              )
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
