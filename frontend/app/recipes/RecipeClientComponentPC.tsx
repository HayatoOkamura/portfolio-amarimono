/* eslint-disable */
"use client";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./RecipeClientComponent.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
// Store
import useIngredientStore from "../stores/ingredientStore";
import useRecipeStore, { SortOption } from "@/app/stores/recipeStore";
import useGenreStore from "../stores/genreStore";
// UI
import Loading from "../components/ui/Loading/Loading";
import RecipeLoading from "../components/ui/Loading/RecipeLoading";
import RecipeCard from "../components/ui/Cards/RecipeCard/RecipeCard";
import StarRating from "@/app/components/ui/StarRating/StarRating";
import ResponsivePieChart from "../components/ui/PieChart/PieChart";
import { RecipeSort } from "../components/ui/RecipeSort/RecipeSort";
// Hooks
import { useSearchRecipes } from "../hooks/recipes";
import { useSortedRecipes } from "../hooks/recipes";
// Utils
import { imageBaseUrl } from "@/app/utils/api";
import { calculateAverageRating } from "@/app/utils/calculateAverageRating";
// Icon
import { IoMdTime } from "react-icons/io";
import { RiMoneyCnyCircleLine } from "react-icons/ri";
import { FaFire } from "react-icons/fa";
import { BiSolidBowlRice } from "react-icons/bi";
import { FaTint } from "react-icons/fa";
import { GiMeat } from "react-icons/gi";
import { TbSalt } from "react-icons/tb";

// Types
import { Recipe, Ingredient } from "@/app/types/index";
import { motion } from "framer-motion";

/**
 * RecipeClientComponentPC
 *
 * PC用レシピ一覧と詳細を表示するコンポーネント
 * - レシピの検索・表示
 * - レシピの詳細情報表示
 * - レシピのソート・フィルタリング
 * - アニメーション効果
 */
const RecipeClientComponentPC = () => {
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
  const [containerElement, setContainerElement] =
    useState<HTMLDivElement | null>(null);

  const router = useRouter();

  // 検索結果の取得（名前検索のみ）
  const { data: searchResults = [], isLoading: isSearching } = useSearchRecipes(
    query,
    {
      enabled: searchType === "name" && searchExecuted,
      staleTime: process.env.ENVIRONMENT === "development" ? 10000 : 86400000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  // 検索実行時の処理
  useEffect(() => {
    if (searchExecuted) {
      setLoading(false);
    }
  }, [searchExecuted]);

  /**
   * レシピクリック時のハンドラー
   */
  const handleRecipeClick = (recipe: Recipe) => {
    if (recipe.id === persistedSelectedRecipe?.id) return;

    // アニメーション開始
    setNextRecipe(recipe);
    setRotate(90);
    setIsFadingOut(true);

    updateBorderPosition(recipe.id);
  };

  // ボーダー位置の更新関数
  const updateBorderPosition = (recipeId: string) => {
    const element = document.querySelector(
      `[data-recipe-id="${recipeId}"]`
    ) as HTMLDivElement | null;

    if (element && containerRef.current) {
      const container = containerRef.current;
      const elementOffset = {
        left: element.offsetLeft,
        top: element.offsetTop,
      };

      setBorderPosition({
        top: elementOffset.top,
        left: elementOffset.left,
      });
      setBorderSize({
        width: element.offsetWidth,
        height: element.offsetHeight,
      });
    }
  };

  // スクロールイベントの監視
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (persistedSelectedRecipe) {
        updateBorderPosition(persistedSelectedRecipe.id);
      }
    };

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [persistedSelectedRecipe]);

  /**
   * 回転アニメーション完了時のハンドラー
   */
  const handleRotateComplete = () => {
    if (nextRecipe) {
      setSelectedRecipe(nextRecipe);
      setNextRecipe(null);
      setRotate(0);
      setIsFadingOut(false);
    }
  };

  // ジャンルによるフィルタリングとソート
  const filteredRecipes =
    selectedGenre === "すべて"
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
      // 選択されたレシピがない場合はソート済みの最初のレシピを選択
      if (!persistedSelectedRecipe) {
        setSelectedRecipe(sortedRecipes[0]);
      }

      // レンダリング完了後に設定を試みる
      const timer = setTimeout(() => {
        if (persistedSelectedRecipe) {
          updateBorderPosition(persistedSelectedRecipe.id);
        }
        // 念のため、少し遅延させて再試行
        const retryTimer = setTimeout(() => {
          if (persistedSelectedRecipe) {
            updateBorderPosition(persistedSelectedRecipe.id);
          }
        }, 100);
        return () => clearTimeout(retryTimer);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [persistedRecipes, persistedSelectedRecipe, setSelectedRecipe]);

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
    const initializeData = async () => {
      try {
        await fetchRecipeGenres();
        setLoading(false);
      } catch (error) {
        console.error("Error initializing data:", error);
        setLoading(false);
      }
    };
    initializeData();
  }, [fetchRecipeGenres]);

  // ローディング表示の条件分岐
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  // レシピデータが存在し、かつ空の場合のみ「レシピが見つかりませんでした」を表示
  if (persistedRecipes && persistedRecipes.length === 0) {
    // 本番環境でのデバッグ情報を追加
    if (process.env.ENVIRONMENT === 'production') {
      console.log("🔍 PRODUCTION DEBUG - No recipes found:");
      console.log("   📝 persistedRecipes:", persistedRecipes);
      console.log("   📝 persistedRecipes length:", persistedRecipes.length);
      console.log("   📝 searchType:", searchType);
      console.log("   📝 searchExecuted:", searchExecuted);
      console.log("   📝 query:", query);
      console.log("   📝 Environment:", process.env.ENVIRONMENT);
    }

    return (
      <div className={styles.no_recipes_container}>
        <p className={styles.no_recipes_message}>
          レシピが見つかりませんでした。
        </p>
        <button className={styles.back_button} onClick={() => router.push("/")}>
          TOPページに戻る
        </button>
      </div>
    );
  }

  // 検索中のローディング表示
  if (isSearching) {
    return <RecipeLoading progress={0} />;
  }

  const averageRating = persistedSelectedRecipe?.reviews
    ? calculateAverageRating(persistedSelectedRecipe.reviews)
    : 0;

  return (
    <div className={styles.recipes_block}>
      <div className={styles.recipes_block__inner}>
        {/* レシピ一覧セクション */}
        <div className={styles.recipes_block__contents}>
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
          {/* 現在選択中のレシピ表示 */}
          {persistedSelectedRecipe && (
            <div className={styles.current_recipe}>
              {/* レシピ名とひとこと紹介 */}
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
            {sortedRecipes.length > 0 ? (
              <>
                <motion.div
                  className={styles.recipe_list__border}
                  animate={{
                    top: borderPosition.top,
                    left: borderPosition.left,
                    width: borderSize.width,
                    height: borderSize.height,
                  }}
                  transition={{ type: "spring", stiffness: 150, damping: 20 }}
                  style={{ position: "absolute" }}
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
                      style={{ cursor: "pointer" }}
                    >
                      <RecipeCard
                        recipe={recipe}
                        isFavoritePage={false}
                        path="/recipes/"
                      />
                    </div>
                  );
                })}
              </>
            ) : (
              <div className={styles.no_recipes_message_container}>
                <p className={styles.no_recipes_message}>
                  選択されたジャンルのレシピが見つかりませんでした。
                </p>
              </div>
            )}
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
                  className={styles.detail_block__box}
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
                      詳しく見る
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
                        約<span>{persistedSelectedRecipe.costEstimate}</span>円
                      </p>
                    </div>
                  </div>
                  {/* 栄養情報 */}
                  {persistedSelectedRecipe.nutrition && (
                    <>
                      <ul className={styles.nutrition_block}>
                        <li className={styles.nutrition_block__item}>
                          <div className={styles.nutrition_block__title}>
                            カロリー
                            <FaFire />
                          </div>
                          <div className={styles.nutrition_block__contents}>
                            <div className={styles.nutrition_block__texts}>
                              <p className={styles.nutrition_block__num}>
                                {persistedSelectedRecipe.nutrition &&
                                  persistedSelectedRecipe.nutrition.calories.toFixed(
                                    1
                                  )}
                                <br />
                                <span>kcal</span>
                              </p>
                            </div>
                            <div className={styles.nutrition_block__pie_chart}>
                              <ResponsivePieChart
                                key={`${persistedSelectedRecipe.id}-calories`}
                                value={
                                  persistedSelectedRecipe.nutritionPercentage
                                    ? persistedSelectedRecipe
                                        .nutritionPercentage.calories
                                    : 0
                                }
                                type="calories"
                              />
                            </div>
                          </div>
                        </li>
                        <li className={styles.nutrition_block__item}>
                          <p className={styles.nutrition_block__title}>
                            炭水化物
                            <BiSolidBowlRice />
                          </p>
                          <div className={styles.nutrition_block__contents}>
                            <div className={styles.nutrition_block__texts}>
                              <p className={styles.nutrition_block__num}>
                                {persistedSelectedRecipe.nutrition &&
                                  persistedSelectedRecipe.nutrition.carbohydrates.toFixed(
                                    1
                                  )}
                                <span>g</span>
                              </p>
                            </div>
                            <div className={styles.nutrition_block__pie_chart}>
                              <ResponsivePieChart
                                key={`${persistedSelectedRecipe.id}-carbohydrates`}
                                value={
                                  persistedSelectedRecipe.nutritionPercentage
                                    ? persistedSelectedRecipe
                                        .nutritionPercentage.carbohydrates
                                    : 0
                                }
                                type="carbohydrates"
                              />
                            </div>
                          </div>
                        </li>
                        <li className={styles.nutrition_block__item}>
                          <p className={styles.nutrition_block__title}>
                            脂質
                            <FaTint />
                          </p>
                          <div className={styles.nutrition_block__contents}>
                            <div className={styles.nutrition_block__texts}>
                              <p className={styles.nutrition_block__num}>
                                {persistedSelectedRecipe.nutrition &&
                                  persistedSelectedRecipe.nutrition.fat.toFixed(
                                    1
                                  )}
                                <span>g</span>
                              </p>
                            </div>
                            <div className={styles.nutrition_block__pie_chart}>
                              <ResponsivePieChart
                                key={`${persistedSelectedRecipe.id}-fat`}
                                value={
                                  persistedSelectedRecipe.nutritionPercentage
                                    ? persistedSelectedRecipe
                                        .nutritionPercentage.fat
                                    : 0
                                }
                                type="fat"
                              />
                            </div>
                          </div>
                        </li>
                        <li className={styles.nutrition_block__item}>
                          <p className={styles.nutrition_block__title}>
                            タンパク質
                            <GiMeat />
                          </p>
                          <div className={styles.nutrition_block__contents}>
                            <div className={styles.nutrition_block__texts}>
                              <p className={styles.nutrition_block__num}>
                                {persistedSelectedRecipe.nutrition &&
                                  persistedSelectedRecipe.nutrition.protein.toFixed(
                                    1
                                  )}
                                <span>g</span>
                              </p>
                            </div>
                            <div className={styles.nutrition_block__pie_chart}>
                              <ResponsivePieChart
                                key={`${persistedSelectedRecipe.id}-protein`}
                                value={
                                  persistedSelectedRecipe.nutritionPercentage
                                    ? persistedSelectedRecipe
                                        .nutritionPercentage.protein
                                    : 0
                                }
                                type="protein"
                              />
                            </div>
                          </div>
                        </li>
                        <li className={styles.nutrition_block__item}>
                          <p className={styles.nutrition_block__title}>
                            塩分
                            <TbSalt />
                          </p>
                          <div className={styles.nutrition_block__contents}>
                            <div className={styles.nutrition_block__texts}>
                              <p className={styles.nutrition_block__num}>
                                {persistedSelectedRecipe.nutrition &&
                                  persistedSelectedRecipe.nutrition.salt.toFixed(
                                    1
                                  )}
                                <span>g</span>
                              </p>
                            </div>
                            <div className={styles.nutrition_block__pie_chart}>
                              <ResponsivePieChart
                                key={`${persistedSelectedRecipe.id}-salt`}
                                value={
                                  persistedSelectedRecipe.nutritionPercentage
                                    ? persistedSelectedRecipe
                                        .nutritionPercentage.salt
                                    : 0
                                }
                                type="salt"
                              />
                            </div>
                          </div>
                        </li>
                      </ul>
                    </>
                  )}
                  <div className={styles.nutrition_block__disclaimer}>
                    <p>※ 栄養成分値は参考値です。</p>
                    <p>※ 各具材の栄養成分値を基に計算しています。</p>
                    <p>
                      ※ データソース:
                      文部科学省「日本食品標準成分表2020年版（八訂）」
                    </p>
                    <p>
                      ※
                      実際の調理方法や具材の量によって栄養成分値は変動する可能性があります。
                    </p>
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
    </div>
  );
};

export default RecipeClientComponentPC;
