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
 * RecipeClientComponentSP
 *
 * スマートフォン用レシピ一覧と詳細を表示するコンポーネント
 * - レシピの検索・表示
 * - レシピの詳細情報表示
 * - レシピのソート・フィルタリング
 * - アニメーション効果
 */
const RecipeClientComponentSP = () => {
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [borderPosition, setBorderPosition] = useState({ top: 0, left: 0 });
  const [borderSize, setBorderSize] = useState({ width: 0, height: 0 });
  const [containerElement, setContainerElement] =
    useState<HTMLDivElement | null>(null);
  // レイアウトズレ防止用の「古いレシピ」状態
  const [oldRecipe, setOldRecipe] = useState<Recipe | null>(null);
  const [isTextAbsolute, setIsTextAbsolute] = useState(false);

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

    // 1. レイアウトズレ防止の準備
    setOldRecipe(recipe); // 新しいレシピの内容で「古いレシピ」を生成
    setIsTextAbsolute(true); // テキストを絶対配置に

    // 2. アニメーション開始
    setNextRecipe(recipe);
    setIsFadingOut(true);

    updateBorderPosition(recipe.id);

    // 3. アニメーション完了後に状態を更新
    setTimeout(() => {
      setSelectedRecipe(recipe);
      setNextRecipe(null);
      setIsFadingOut(false);
      setOldRecipe(null); // 「古いレシピ」を削除
      setIsTextAbsolute(false); // テキストを相対配置に戻す
    }, 600); // アニメーション時間と同じ
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
      setIsFadingOut(false);
      setOldRecipe(null);
      setIsTextAbsolute(false);
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
      console.log("🔍 PRODUCTION DEBUG - No recipes found (SP):");
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
      <div className={styles.recipes_block__inner}>
        {/* レシピ一覧セクション */}
        {sortedRecipes.length > 0 && (
          <div className={styles.recipes_block__contents}>
          {/* 現在選択中のレシピ表示 */}
          {persistedSelectedRecipe && (
            <div
              className={styles.current_recipe}
              style={{ position: "relative" }}
            >
              {/* 次のレシピ画像（背景） */}
              {nextRecipe && (
                <div
                  key={`next-${nextRecipe?.id}`}
                  className={`${styles.current_recipe__img} ${
                    styles.next_animation
                  } ${isFadingOut ? styles.fade_in : ""}`}
                >
                  <div className={styles.current_recipe__img_inner}>
                    <Image
                      src={
                        `${imageBaseUrl}/${nextRecipe?.imageUrl}` ||
                        "/pic_recipe_default.webp"
                      }
                      alt={nextRecipe?.name || "Recipe Image"}
                      width={300}
                      height={300}
                      priority
                    />
                  </div>
                </div>
              )}

              {/* 現在のレシピ画像（前面） */}
              <div
                key={`current-${persistedSelectedRecipe?.id}`}
                className={`${styles.current_recipe__img} ${styles.current} ${
                  isFadingOut ? styles.fade_out : ""
                }`}
              >
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

              {/* レシピ名とひとこと紹介 */}
              <div
                className={styles.current_recipe__detail}
                style={{ position: "relative" }}
              >
                {/* 古いレシピ（目に見えない、レイアウト固定用） */}
                {oldRecipe && (
                  <div
                    className={`${styles.recipe_name} ${styles.old_recipe}`}
                    style={{
                      opacity: 0,
                      visibility: 'hidden',
                      position: 'relative',
                      height: 'auto'
                    }}
                  >
                    <p className={styles.current_recipe__catchphrase}>
                      {oldRecipe?.catchphrase}
                    </p>
                    <h2 className={styles.current_recipe__title}>
                      {oldRecipe?.name}
                    </h2>
                  </div>
                )}

                {/* 次のレシピのテキスト（背景） */}
                {nextRecipe && (
                  <div
                    className={`${styles.recipe_name} ${styles.next_text} ${
                      isFadingOut ? styles.fade_in_slide_right : ""
                    }`}
                  >
                    <p className={styles.current_recipe__catchphrase}>
                      {nextRecipe?.catchphrase}
                    </p>
                    <h2 className={styles.current_recipe__title}>
                      {nextRecipe?.name}
                    </h2>
                  </div>
                )}

                {/* 現在のレシピのテキスト（前面） */}
                <div
                  className={`${styles.recipe_name} ${styles.current_text} ${
                    isFadingOut ? styles.fade_out_slide_left : ""
                  }`}
                  style={{
                    position: isTextAbsolute ? 'absolute' : 'relative',
                    top: isTextAbsolute ? 0 : 'auto',
                    left: isTextAbsolute ? 0 : 'auto',
                    width: isTextAbsolute ? '100%' : 'auto'
                  }}
                >
                  <p className={styles.current_recipe__catchphrase}>
                    {persistedSelectedRecipe?.catchphrase}
                  </p>
                  <h2 className={styles.current_recipe__title}>
                    {persistedSelectedRecipe?.name}
                  </h2>
                </div>
              </div>
            </div>
          )}

          {/* レシピ詳細セクション */}
          <section className={styles.detail_block}>
            <div className={styles.detail_block__inner}>
              {persistedSelectedRecipe && (
                <div className={styles.detail_block__contents}>
                  {/* ジャンル表示 */}
                  <div style={{ position: "relative" }}>
                    {/* 次のレシピのジャンル（背景） */}
                    {nextRecipe && (
                      <div
                        className={`${styles.recipe_name} ${styles.next_text} ${
                          isFadingOut ? styles.fade_in_slide_right : ""
                        }`}
                      >
                        <p className={styles.detail_block__genre}>
                          {nextRecipe.genre
                            ? nextRecipe.genre.name
                            : "ジャンルなし"}
                        </p>
                      </div>
                    )}

                    {/* 現在のレシピのジャンル（前面） */}
                    <div
                      className={`${styles.recipe_name} ${
                        styles.current_text
                      } ${isFadingOut ? styles.fade_out_slide_left : ""}`}
                    >
                      <p className={styles.detail_block__genre}>
                        {persistedSelectedRecipe.genre
                          ? persistedSelectedRecipe.genre.name
                          : "ジャンルなし"}
                      </p>
                    </div>
                  </div>
                  {/* レビュー表示 */}
                  <div style={{ position: "relative" }}>
                    {/* 次のレシピのレビュー（背景） */}
                    {nextRecipe && (
                      <div
                        className={`${styles.review_block} ${
                          styles.next_text
                        } ${isFadingOut ? styles.fade_in_slide_down : ""}`}
                      >
                        <p className={styles.review_block__average}>
                          {nextRecipe.reviews
                            ? calculateAverageRating(
                                nextRecipe.reviews
                              ).toFixed(1)
                            : "0.0"}{" "}
                          <span>({nextRecipe.reviews?.length ?? 0}件)</span>
                        </p>
                        <div className={styles.review_block__stars}>
                          <StarRating
                            reviews={nextRecipe.reviews}
                            className={styles.align_center}
                          />
                        </div>
                      </div>
                    )}

                    {/* 現在のレシピのレビュー（前面） */}
                    <div
                      className={`${styles.review_block} ${
                        styles.current_text
                      } ${isFadingOut ? styles.fade_out_slide_up : ""}`}
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
                    </div>
                  </div>
                  {/* 詳細情報 */}
                  <div style={{ position: "relative" }}>
                    {/* 次のレシピの詳細（背景） */}
                    {nextRecipe && (
                      <div
                        className={`${styles.detail_block__box} ${
                          styles.next_text
                        } ${isFadingOut ? styles.fade_in_slide_right : ""}`}
                      >
                        {/* 詳細ページへのリンク */}
                        <div className={styles.detail_block__btn}>
                          <Link href={`/recipes/${nextRecipe.id}`}>
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
                              約<span>{nextRecipe.cookingTime}</span>分
                            </p>
                          </div>
                          <div className={styles.units_block__item}>
                            <div className={styles.units_block__title}>
                              <RiMoneyCnyCircleLine />
                              <p>費用目安</p>
                            </div>
                            <p className={styles.units_block__text}>
                              約<span>{nextRecipe.costEstimate}</span>円
                            </p>
                          </div>
                        </div>
                        {/* 栄養情報 */}
                        {nextRecipe?.nutrition && (
                          <>
                            <ul className={styles.nutrition_block}>
                              <li className={styles.nutrition_block__item}>
                                <div className={styles.nutrition_block__title}>
                                  カロリー
                                  <FaFire />
                                </div>
                                <div
                                  className={styles.nutrition_block__contents}
                                >
                                  <div
                                    className={styles.nutrition_block__texts}
                                  >
                                    <p className={styles.nutrition_block__num}>
                                      {nextRecipe.nutrition &&
                                        nextRecipe.nutrition.calories.toFixed(
                                          1
                                        )}
                                      <br />
                                      <span>kcal</span>
                                    </p>
                                  </div>
                                  <div
                                    className={
                                      styles.nutrition_block__pie_chart
                                    }
                                  >
                                    <ResponsivePieChart
                                      key={`${nextRecipe.id}-calories`}
                                      value={
                                        nextRecipe.nutritionPercentage
                                          ? nextRecipe
                                              .nutritionPercentage.calories
                                          : 0
                                      }
                                      type="calories"
                                      disableAnimation={true}
                                    />
                                  </div>
                                </div>
                              </li>
                              <li className={styles.nutrition_block__item}>
                                <p className={styles.nutrition_block__title}>
                                  炭水化物
                                  <BiSolidBowlRice />
                                </p>
                                <div
                                  className={styles.nutrition_block__contents}
                                >
                                  <div
                                    className={styles.nutrition_block__texts}
                                  >
                                    <p className={styles.nutrition_block__num}>
                                      {nextRecipe.nutrition &&
                                        nextRecipe.nutrition.carbohydrates.toFixed(
                                          1
                                        )}
                                      <span>g</span>
                                    </p>
                                  </div>
                                  <div
                                    className={
                                      styles.nutrition_block__pie_chart
                                    }
                                  >
                                    <ResponsivePieChart
                                      key={`${nextRecipe.id}-carbohydrates`}
                                      value={
                                        nextRecipe.nutritionPercentage
                                          ? nextRecipe
                                              .nutritionPercentage.carbohydrates
                                          : 0
                                      }
                                      type="carbohydrates"
                                      disableAnimation={true}
                                    />
                                  </div>
                                </div>
                              </li>
                              <li className={styles.nutrition_block__item}>
                                <p className={styles.nutrition_block__title}>
                                  脂質
                                  <FaTint />
                                </p>
                                <div
                                  className={styles.nutrition_block__contents}
                                >
                                  <div
                                    className={styles.nutrition_block__texts}
                                  >
                                    <p className={styles.nutrition_block__num}>
                                      {nextRecipe.nutrition &&
                                        nextRecipe.nutrition.fat.toFixed(
                                          1
                                        )}
                                      <span>g</span>
                                    </p>
                                  </div>
                                  <div
                                    className={
                                      styles.nutrition_block__pie_chart
                                    }
                                  >
                                    <ResponsivePieChart
                                      key={`${nextRecipe.id}-fat`}
                                      value={
                                        nextRecipe.nutritionPercentage
                                          ? nextRecipe
                                              .nutritionPercentage.fat
                                          : 0
                                      }
                                      type="fat"
                                      disableAnimation={true}
                                    />
                                  </div>
                                </div>
                              </li>
                              <li className={styles.nutrition_block__item}>
                                <p className={styles.nutrition_block__title}>
                                  タンパク質
                                  <GiMeat />
                                </p>
                                <div
                                  className={styles.nutrition_block__contents}
                                >
                                  <div
                                    className={styles.nutrition_block__texts}
                                  >
                                    <p className={styles.nutrition_block__num}>
                                      {nextRecipe.nutrition &&
                                        nextRecipe.nutrition.protein.toFixed(
                                          1
                                        )}
                                      <span>g</span>
                                    </p>
                                  </div>
                                  <div
                                    className={
                                      styles.nutrition_block__pie_chart
                                    }
                                  >
                                    <ResponsivePieChart
                                      key={`${nextRecipe.id}-protein`}
                                      value={
                                        nextRecipe.nutritionPercentage
                                          ? nextRecipe
                                              .nutritionPercentage.protein
                                          : 0
                                      }
                                      type="protein"
                                      disableAnimation={true}
                                    />
                                  </div>
                                </div>
                              </li>
                              <li className={styles.nutrition_block__item}>
                                <p className={styles.nutrition_block__title}>
                                  塩分
                                  <TbSalt />
                                </p>
                                <div
                                  className={styles.nutrition_block__contents}
                                >
                                  <div
                                    className={styles.nutrition_block__texts}
                                  >
                                    <p className={styles.nutrition_block__num}>
                                      {nextRecipe.nutrition &&
                                        nextRecipe.nutrition.salt.toFixed(
                                          1
                                        )}
                                      <span>g</span>
                                    </p>
                                  </div>
                                  <div
                                    className={
                                      styles.nutrition_block__pie_chart
                                    }
                                  >
                                    <ResponsivePieChart
                                      key={`${nextRecipe.id}-salt`}
                                      value={
                                        nextRecipe.nutritionPercentage
                                          ? nextRecipe
                                              .nutritionPercentage.salt
                                          : 0
                                      }
                                      type="salt"
                                      disableAnimation={true}
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
                          <h3 className={styles.ingredients_block__title}>
                            材料
                          </h3>
                          <ul className={styles.ingredients_block__list}>
                            {nextRecipe?.ingredients.map(
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
                                            : Number(
                                                ingredient.quantity
                                              ).toFixed(1)
                                        }`
                                      : `${
                                          Number.isInteger(ingredient.quantity)
                                            ? ingredient.quantity
                                            : Number(ingredient.quantity).toFixed(
                                              1
                                            )
                                      }${ingredient.unit.name}`}
                                  </p>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* 現在のレシピの詳細（前面） */}
                    <div
                      className={`${styles.detail_block__box} ${
                        styles.current_text
                      } ${isFadingOut ? styles.fade_out_slide_left : ""}`}
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
                            約<span>{persistedSelectedRecipe.cookingTime}</span>
                            分
                          </p>
                        </div>
                        <div className={styles.units_block__item}>
                          <div className={styles.units_block__title}>
                            <RiMoneyCnyCircleLine />
                            <p>費用目安</p>
                          </div>
                          <p className={styles.units_block__text}>
                            約
                            <span>{persistedSelectedRecipe.costEstimate}</span>
                            円
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
                                <div
                                  className={styles.nutrition_block__pie_chart}
                                >
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
                                <div
                                  className={styles.nutrition_block__pie_chart}
                                >
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
                                <div
                                  className={styles.nutrition_block__pie_chart}
                                >
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
                                <div
                                  className={styles.nutrition_block__pie_chart}
                                >
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
                                <div
                                  className={styles.nutrition_block__pie_chart}
                                >
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
                        <h3 className={styles.ingredients_block__title}>
                          材料
                        </h3>
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
                                          : Number(ingredient.quantity).toFixed(
                                              1
                                            )
                                      }`
                                    : `${
                                        Number.isInteger(ingredient.quantity)
                                          ? ingredient.quantity
                                          : Number(ingredient.quantity).toFixed(
                                              1
                                            )
                                      }${ingredient.unit.name}`}
                                </p>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
        )}
        {/* レシピリスト */}
        {sortedRecipes.length > 0 ? (
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
                  <Image
                    src={
                      `${imageBaseUrl}/${recipe.imageUrl}` ||
                      "/pic_recipe_default.webp"
                    }
                    alt={recipe.name || "Recipe Image"}
                    width={197}
                    height={197}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.no_recipes_message_container}>
            <p className={styles.no_recipes_message}>
              選択されたジャンルのレシピが<br />見つかりませんでした。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeClientComponentSP;
