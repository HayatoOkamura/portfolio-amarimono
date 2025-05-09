/* eslint-disable */
"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./RecipeClientComponent.module.scss";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
// Store
import useIngredientStore from "../stores/ingredientStore";
import useRecipeStore, { SortOption } from "@/app/stores/recipeStore";
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
import { imageBaseUrl } from "@/app/utils/api";
import { calculateAverageRating } from "@/app/utils/calculateAverageRating";
// Icon
import { IoMdTime } from "react-icons/io";
import { RiMoneyCnyCircleLine } from "react-icons/ri";
// Types
import { Recipe, Ingredient } from "@/app/types/index";

/**
 * RecipeClientComponent
 * 
 * レシピ一覧と詳細を表示するメインコンポーネント
 * - レシピの検索・表示
 * - レシピの詳細情報表示
 * - レシピのソート・フィルタリング
 * - アニメーション効果
 */
const RecipeClientComponent = () => {
  // 状態管理
  const { ingredients } = useIngredientStore();
  const {
    recipes: persistedRecipes = [],
    selectedRecipe: persistedSelectedRecipe,
    setRecipes,
    setSelectedRecipe,
    searchType,
    query,
    searchExecuted,
  } = useRecipeStore();
  const [loading, setLoading] = useState<boolean>(true);
  const { recipeGenres, fetchRecipeGenres } = useGenreStore();
  const [selectedGenre, setSelectedGenre] = useState<string>("すべて");
  const genres = [{ id: 0, name: "すべて" }, ...(recipeGenres || [])];
  
  // アニメーション関連の状態
  const [nextRecipe, setNextRecipe] = useState<Recipe | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [rotate, setRotate] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [borderPosition, setBorderPosition] = useState({ top: 0, left: 0 });
  const [borderSize, setBorderSize] = useState({ width: 0, height: 0 });
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  const router = useRouter();

  // レシピデータの取得
  const { data: fetchedRecipes = [], isLoading: isFetchingRecipes } = useFetchRecipesAPI(
    ingredients.map((ingredient) => ({
      id: ingredient.id,
      quantity: ingredient.quantity,
    })),
    {
      enabled: searchType === "ingredients" && searchExecuted,
      staleTime: process.env.NODE_ENV === 'development' ? 10000 : 86400000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  );

  // 検索結果の取得
  const { data: searchResults = [], isLoading: isSearching } = useSearchRecipes(query, {
    enabled: searchType === "name" && searchExecuted,
    staleTime: process.env.NODE_ENV === 'development' ? 10000 : 86400000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  /**
   * レシピクリック時のハンドラー
   */
  const handleRecipeClick = (recipe: Recipe) => {
    if (recipe.id === persistedSelectedRecipe?.id) return;
    
    console.log('Recipe Click Start:', {
      currentRecipe: persistedSelectedRecipe,
      nextRecipe: recipe,
      isFadingOut,
      rotate
    });
    
    // アニメーション開始
    setNextRecipe(recipe);
    setRotate(90);
    setIsFadingOut(true);
    
    // ボーダー位置の更新
    const element = document.querySelector(
      `[data-recipe-id="${recipe.id}"]`
    ) as HTMLDivElement | null;

    if (element) {
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        setBorderPosition({
          top: elementRect.top - containerRect.top,
          left: elementRect.left - containerRect.left,
        });
        setBorderSize({
          width: elementRect.width,
          height: elementRect.height,
        });
      }
    }
  };

  /**
   * 回転アニメーション完了時のハンドラー
   */
  const handleRotateComplete = () => {
    console.log('Rotation Complete:', {
      currentRecipe: persistedSelectedRecipe,
      nextRecipe,
      isFadingOut,
      rotate
    });
    
    if (nextRecipe) {
      setSelectedRecipe(nextRecipe);
      setNextRecipe(null);
      setRotate(0);
      setIsFadingOut(false);
    }
  };

  // アニメーション状態の監視
  useEffect(() => {
    console.log('Animation State Changed:', {
      currentRecipe: persistedSelectedRecipe,
      nextRecipe,
      isFadingOut,
      rotate
    });
  }, [persistedSelectedRecipe, nextRecipe, isFadingOut, rotate]);

  // ジャンルによるフィルタリングとソート
  const filteredRecipes = selectedGenre === "すべて"
    ? persistedRecipes || []
    : (persistedRecipes || []).filter(
        (recipe: Recipe) => recipe.genre?.name === selectedGenre
      );

  const sortedRecipes = useSortedRecipes(filteredRecipes);

  /**
   * 材料IDから材料名を取得
   */
  const getIngredientName = (id: number): string => {
    const ingredient = ingredients.find((ing) => ing.id === id);
    return ingredient ? ingredient.name : "Unknown Ingredient";
  };

  // 初期表示時のレシピ選択とボーダー位置の設定
  useEffect(() => {
    if (persistedRecipes.length > 0) {
      // 選択されたレシピがない場合は最初のレシピを選択
      if (!persistedSelectedRecipe) {
        setSelectedRecipe(persistedRecipes[0]);
      }

      // ボーダー位置の設定
      const updateBorderPosition = () => {
        const targetRecipe = persistedSelectedRecipe || persistedRecipes[0];
        const element = document.querySelector(
          `[data-recipe-id="${targetRecipe.id}"]`
        ) as HTMLDivElement | null;

        if (element) {
          const container = containerRef.current;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            setBorderPosition({
              top: elementRect.top - containerRect.top,
              left: elementRect.left - containerRect.left,
            });
            setBorderSize({
              width: elementRect.width,
              height: elementRect.height,
            });
          }
        }
      };

      // レンダリング完了後に設定を試みる
      const timer = setTimeout(() => {
        updateBorderPosition();
        // 念のため、少し遅延させて再試行
        const retryTimer = setTimeout(updateBorderPosition, 100);
        return () => clearTimeout(retryTimer);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [persistedRecipes, persistedSelectedRecipe, setSelectedRecipe]);

  // 具材変更時の処理
  useEffect(() => {
    if (searchType === "ingredients" && fetchedRecipes && fetchedRecipes.length > 0) {
      const sortedRecipes = [...fetchedRecipes].sort((a, b) => {
        const ratingA = calculateAverageRating(a.reviews);
        const ratingB = calculateAverageRating(b.reviews);
        return ratingB - ratingA;
      });

      if (JSON.stringify(sortedRecipes) !== JSON.stringify(persistedRecipes)) {
        // レシピリストを更新
        setRecipes(sortedRecipes);
        // 選択状態をリセット
        setSelectedRecipe(null);
        // 新しいレシピを選択
        setSelectedRecipe(sortedRecipes[0]);
        
        // レンダリング完了後にボーダー位置を設定
        const updateBorderPosition = () => {
          const element = document.querySelector(
            `[data-recipe-id="${sortedRecipes[0].id}"]`
          ) as HTMLDivElement | null;

          if (element) {
            const container = containerRef.current;
            if (container) {
              const containerRect = container.getBoundingClientRect();
              const elementRect = element.getBoundingClientRect();
              
              setBorderPosition({
                top: elementRect.top - containerRect.top,
                left: elementRect.left - containerRect.left,
              });
              setBorderSize({
                width: elementRect.width,
                height: elementRect.height,
              });
            }
          }
        };

        // 複数回のタイマーを設定して確実に要素のサイズを取得
        const timer1 = setTimeout(updateBorderPosition, 100);
        const timer2 = setTimeout(updateBorderPosition, 300);
        const timer3 = setTimeout(updateBorderPosition, 500);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
        };
      }
    }
  }, [searchType, fetchedRecipes, persistedRecipes, setRecipes, setSelectedRecipe]);

  // ページ遷移時のクリーンアップ
  useEffect(() => {
    return () => {
      // ページ遷移時に選択状態をリセット
      setSelectedRecipe(null);
      // アニメーション関連の状態をリセット
      setNextRecipe(null);
      setRotate(0);
      setIsFadingOut(false);
    };
  }, [setSelectedRecipe]);

  // レシピジャンルの取得
  useEffect(() => {
    fetchRecipeGenres();
  }, [fetchRecipeGenres]);

  // ローディング状態の判定
  const isLoading = (searchType === "ingredients" && isFetchingRecipes) || 
                   (searchType === "name" && isSearching);

  const averageRating = persistedSelectedRecipe?.reviews
    ? calculateAverageRating(persistedSelectedRecipe.reviews)
    : 0;

  if (isLoading) {
    return (
      <div className={styles.loading_container}>
        <Loading />
        <p className={styles.loading_text}>レシピを検索中...</p>
      </div>
    );
  }

  return (
    <div className={styles.recipes_block}>
      {persistedRecipes.length === 0 ? (
        <div className={styles.no_recipes_container}>
          <p className={styles.no_recipes_message}>レシピが見つかりませんでした。</p>
          <button
            className={styles.back_button}
            onClick={() => router.push("/")}
          >
            TOPページに戻る
          </button>
        </div>
      ) : (
        <div className={styles.recipes_block__inner}>
          {/* レシピ一覧セクション */}
          <div className={styles.recipes_block__contents}>
            {/* 現在選択中のレシピ表示 */}
            {persistedSelectedRecipe && (
              <div className={styles.current_recipe}>
                <motion.div
                  key={persistedSelectedRecipe?.id}
                  className={styles.current_recipe__img_wrap}
                  animate={{ rotate }}
                  transition={
                    rotate === 0
                      ? { duration: 0 }
                      : { duration: 0.8, ease: "easeInOut" }
                  }
                  onAnimationComplete={handleRotateComplete}
                >
                  {/* 現在のレシピ画像 */}
                  <div className={styles.current_recipe__img}>
                    <div className={styles.current_recipe__img_inner}>
                      <Image
                        src={
                          `${imageBaseUrl}/${persistedSelectedRecipe?.imageUrl}` ||
                          "/pic_recipe_default.webp"
                        }
                        alt={persistedSelectedRecipe?.name || "Recipe Image"}
                        width={300}
                        height={300}
                        priority
                      />
                    </div>
                  </div>
                  {/* 次のレシピ画像 */}
                  <div className={`${styles.current_recipe__img} ${styles["next"]}`}>
                    <div className={styles.current_recipe__img_inner}>
                      <Image
                        src={
                          nextRecipe
                            ? `${imageBaseUrl}/${nextRecipe.imageUrl}`
                            : `${imageBaseUrl}/${persistedSelectedRecipe?.imageUrl}` ||
                              "/pic_recipe_default.webp"
                        }
                        alt={
                          nextRecipe?.name ||
                          persistedSelectedRecipe?.name ||
                          "Recipe Image"
                        }
                        width={300}
                        height={300}
                        priority
                      />
                    </div>
                  </div>
                </motion.div>
                {/* レシピ名とキャッチフレーズ */}
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
                  <p className={styles.current_recipe__catchphrase}>
                    {persistedSelectedRecipe?.catchphrase}
                  </p>
                  <h2 className={styles.current_recipe__title}>
                    {persistedSelectedRecipe?.name}
                  </h2>
                </motion.div>
              </div>
            )}
            {/* ソート・フィルターセクション */}
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
                <RecipeSort
                  onSortChange={(sortBy: string) => {
                    useRecipeStore.getState().setSortBy(sortBy as SortOption);
                  }}
                />
              </div>
            </div>
            {/* レシピリスト */}
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
              {sortedRecipes.map((recipe) => {
                return (
                  <div
                    key={recipe.id}
                    data-recipe-id={recipe.id}
                    className={styles.recipe_list__item}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRecipeClick(recipe);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      isFavoritePage={false}
                      path="/recipes/"
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {/* レシピ詳細セクション */}
          <section className={styles.detail_block}>
            <div className={styles.detail_block__inner}>
              {persistedSelectedRecipe && (
                <div className={styles.detail_block__contents}>
                  {/* ジャンル表示 */}
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
                      {persistedSelectedRecipe.genre
                        ? persistedSelectedRecipe.genre.name
                        : "ジャンルなし"}
                    </p>
                  </motion.div>
                  {/* レビュー表示 */}
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
                      <span>
                        ({persistedSelectedRecipe.reviews?.length ?? 0}件)
                      </span>
                    </p>
                    <div className={styles.review_block__stars}>
                      <StarRating
                        reviews={persistedSelectedRecipe.reviews}
                        className={styles.align_center}
                      />
                    </div>
                  </motion.div>
                  {/* 詳細情報 */}
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
                    {/* 詳細ページへのリンク */}
                    <div className={styles.detail_block__btn}>
                      <Link href={`/recipes/${persistedSelectedRecipe.id}`}>
                        <button>詳しく見る</button>
                      </Link>
                    </div>
                    {/* 調理時間と費用目安 */}
                    <div className={styles.units_block}>
                      <div className={styles.units_block__item}>
                        <div className={styles.units_block__title}>
                          <IoMdTime />
                          <p>調理時間</p>
                        </div>
                        <p className={styles.units_block__text}>
                          約<span>{persistedSelectedRecipe.cookingTime}</span>分
                        </p>
                      </div>
                      <div className={styles.units_block__item}>
                        <div className={styles.units_block__title}>
                          <RiMoneyCnyCircleLine />
                          <p>費用目安</p>
                        </div>
                        <p className={styles.units_block__text}>
                          約<span>{persistedSelectedRecipe.costEstimate}</span>
                          円
                        </p>
                      </div>
                    </div>
                    {/* 栄養情報 */}
                    {persistedSelectedRecipe.nutrition && (
                      <>
                        {(() => {
                          console.log('Nutrition Percentage:', persistedSelectedRecipe.nutritionPercentage);
                          return null;
                        })()}
                        <ul className={styles.nutrition_block}>
                          <li className={styles.nutrition_block__item}>
                            <p className={styles.nutrition_block__title}>
                              カロリー
                            </p>
                            <div className={styles.nutrition_block__contents}>
                              <p className={styles.nutrition_block__num}>
                                {persistedSelectedRecipe.nutrition.calories}
                                <span>kcal</span>
                              </p>
                              <ResponsivePieChart
                                value={
                                  persistedSelectedRecipe.nutritionPercentage
                                    ? persistedSelectedRecipe.nutritionPercentage
                                        .calories
                                    : 0
                                }
                                type="calories"
                              />
                            </div>
                          </li>
                          <li className={styles.nutrition_block__item}>
                            <p className={styles.nutrition_block__title}>
                              炭水化物
                            </p>
                            <div className={styles.nutrition_block__contents}>
                              <p className={styles.nutrition_block__num}>
                                {persistedSelectedRecipe.nutrition.carbohydrates}
                                <span>g</span>
                              </p>
                              <ResponsivePieChart
                                value={
                                  persistedSelectedRecipe.nutritionPercentage
                                    ? persistedSelectedRecipe.nutritionPercentage
                                        .carbohydrates
                                    : 0
                                }
                                type="carbohydrates"
                              />
                            </div>
                          </li>
                          <li className={styles.nutrition_block__item}>
                            <p className={styles.nutrition_block__title}>脂質</p>
                            <div className={styles.nutrition_block__contents}>
                              <p className={styles.nutrition_block__num}>
                                {persistedSelectedRecipe.nutrition.fat}
                                <span>g</span>
                              </p>
                              <ResponsivePieChart
                                value={
                                  persistedSelectedRecipe.nutritionPercentage
                                    ? persistedSelectedRecipe.nutritionPercentage
                                        .fat
                                    : 0
                                }
                                type="fat"
                              />
                            </div>
                          </li>
                          <li className={styles.nutrition_block__item}>
                            <p className={styles.nutrition_block__title}>
                              タンパク質
                            </p>
                            <div className={styles.nutrition_block__contents}>
                              <p className={styles.nutrition_block__num}>
                                {persistedSelectedRecipe.nutrition.protein}
                                <span>g</span>
                              </p>
                              <ResponsivePieChart
                                value={
                                  persistedSelectedRecipe.nutritionPercentage
                                    ? persistedSelectedRecipe.nutritionPercentage
                                        .protein
                                    : 0
                                }
                                type="protein"
                              />
                            </div>
                          </li>
                          <li className={styles.nutrition_block__item}>
                            <p className={styles.nutrition_block__title}>塩分</p>
                            <div className={styles.nutrition_block__contents}>
                              <p className={styles.nutrition_block__num}>
                                {persistedSelectedRecipe.nutrition.salt}
                                <span>g</span>
                              </p>
                              <ResponsivePieChart
                                value={
                                  persistedSelectedRecipe.nutritionPercentage
                                    ? persistedSelectedRecipe.nutritionPercentage
                                        .salt
                                    : 0
                                }
                                type="salt"
                              />
                            </div>
                          </li>
                        </ul>
                      </>
                    )}
                    <div className={styles.nutrition_block__disclaimer}>
                      <p>※ 栄養成分値は参考値です。</p>
                      <p>※ 各具材の栄養成分値を基に計算しています。</p>
                      <p>※ 実際の調理方法や具材の量によって栄養成分値は変動する可能性があります。</p>
                    </div>
                    {/* 材料リスト */}
                    <div className={styles.ingredients_block}>
                      <h3 className={styles.ingredients_block__title}>材料</h3>
                      <ul className={styles.ingredients_block__list}>
                        {persistedSelectedRecipe.ingredients.map(
                          (ingredient: Ingredient, idx: number) => (
                            <li
                              key={idx}
                              className={styles.ingredients_block__item}
                            >
                              <p>{getIngredientName(ingredient.id)}</p>
                              <p>
                                {["大さじ", "小さじ"].includes(
                                  ingredient.unit.name
                                )
                                  ? `${ingredient.unit.name}${
                                      Number.isInteger(ingredient.quantity)
                                        ? ingredient.quantity
                                        : Number(ingredient.quantity).toFixed(1)
                                    }`
                                  : `${
                                      Number.isInteger(ingredient.quantity)
                                        ? ingredient.quantity
                                        : Number(ingredient.quantity).toFixed(1)
                                    }${ingredient.unit.name}`}
                              </p>
                            </li>
                          )
                        )}
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
