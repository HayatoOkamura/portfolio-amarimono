/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { IoMdInformationCircleOutline } from "react-icons/io";
import toast from "react-hot-toast";
import styles from "./GenerateRecipe.module.scss";
import { imageBaseUrl } from "@/app/utils/api";
import useRecipeStore from "@/app/stores/recipeStore";
import useIngredientStore from "@/app/stores/ingredientStore";
import { Ingredient } from "@/app/types/index";
import { useIngredients } from "@/app/hooks/ingredients";

interface GenerateRecipeProps {
  onSearch: () => Promise<void>;
  isModalOpen?: boolean;
  onCloseModal?: () => void;
}

const GenerateRecipe = ({ onSearch, isModalOpen = false, onCloseModal }: GenerateRecipeProps) => {
  const [error, setError] = useState("");
  const [showSeasonings, setShowSeasonings] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { setGeneratedRecipes, setSearchType, setSearchExecuted } =
    useRecipeStore();
  const { ingredients, setIngredients, selectedOrder, searchMode } =
    useIngredientStore();
  const { data: fetchedIngredients } = useIngredients();

  useEffect(() => {
    if (fetchedIngredients) {
      setIngredients(fetchedIngredients);
    }
  }, [fetchedIngredients, setIngredients]);

  // モーダル開閉時のbodyスクロール制御
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const handleRecipe = async () => {
    try {
      const filteredIngredients = ingredients
        .filter((ingredient: Ingredient) => ingredient.quantity > 0)
        .reduce(
          (acc: { id: number; quantity: number }[], current: Ingredient) => {
            const existingIngredient = acc.find(
              (item) => item.id === current.id
            );
            if (existingIngredient) {
              existingIngredient.quantity += current.quantity;
              return acc;
            }
            return [...acc, { id: current.id, quantity: current.quantity }];
          },
          []
        );

      if (filteredIngredients.length === 0) {
        toast.error("具材が選択されていません。");
        return;
      }

      setSearchType("ingredients");
      setSearchExecuted(true);

      await onSearch();
    } catch (err: any) {
      setGeneratedRecipes([]);
      setError(err.message);
    }
  };

  const selectedIngredients = ingredients
    .filter((ingredient: Ingredient) => ingredient.quantity > 0)
    .reduce((acc: Ingredient[], current: Ingredient) => {
      const existingIngredient = acc.find((item) => item.id === current.id);
      if (existingIngredient) {
        existingIngredient.quantity = current.quantity;
        return acc;
      }
      return [...acc, current];
    }, []) as Ingredient[];

  // 選択順序に基づいて具材をソート（新しい順に表示）
  const sortedIngredients = [...selectedIngredients].sort((a, b) => {
    const aIndex = selectedOrder.indexOf(a.id);
    const bIndex = selectedOrder.indexOf(b.id);
    return bIndex - aIndex; // 順序を逆にして新しい順に表示
  });

  // 調味料とスパイスをフィルタリング
  const filteredIngredients = sortedIngredients.filter((ingredient) => {
    if (showSeasonings) return true;
    return !["調味料", "スパイス"].includes(ingredient.genre.name);
  });

  // 調味料とスパイスの具材があるかチェック
  const hasSeasonings = sortedIngredients.some((ingredient) =>
    ["調味料", "スパイス"].includes(ingredient.genre.name)
  );

  // 検索モードに応じたメッセージを取得
  const getSearchModeMessage = () => {
    switch (searchMode) {
      case "exact_with_quantity":
        return "選んだ具材すべてが含まれ、\n指定した分量も満たすレシピを検索します";
      case "exact_without_quantity":
        return "選んだ具材すべてが含まれる\nレシピを検索します\n（分量は問いません）";
      case "partial_with_quantity":
        return "選んだ具材のいずれかが含まれ、\n分量も満たすレシピを検索します\n（調味料・スパイスは除外）";
      case "partial_without_quantity":
        return "選んだ具材のいずれかが含まれる\nレシピを検索します\n（分量は不問、調味料・スパイスは除外）";
      default:
        return "";
    }
  };

  return (
    <>
      {/* 通常表示（PC用） */}
      <section className={styles.container_block} aria-label="選択した具材の確認">
        <div className={styles.container_block__inner}>
          <div className={styles.container_block__header}>
            <h2 className={styles.container_block__title}>選択した具材</h2>
            <div 
              className={styles.search_mode_notice}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              role="button"
              tabIndex={0}
              aria-label="検索条件の詳細を表示"
              aria-expanded={showTooltip}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowTooltip(!showTooltip);
                }
              }}
            >
              <IoMdInformationCircleOutline />
              {showTooltip && (
                <div 
                  className={styles.search_mode_notice__tooltip}
                  role="tooltip"
                  aria-hidden="true"
                >
                  <p>{getSearchModeMessage()}</p>
                </div>
              )}
            </div>
          </div>
          {hasSeasonings && (
            <button
              className={styles.toggle_seasonings}
              onClick={() => setShowSeasonings(!showSeasonings)}
              aria-expanded={showSeasonings}
              aria-controls="seasonings-list"
            >
              {showSeasonings
                ? "調味料、スパイスを非表示"
                : "調味料、スパイスを表示"}
            </button>
          )}
          <div className={styles.container_block__contents}>
            {filteredIngredients.length > 0 && (
              <ul 
                className={styles.ingredients_list}
                id="seasonings-list"
                aria-label="選択された具材のリスト"
              >
                {filteredIngredients.map((ingredient: Ingredient) => (
                  <li
                    key={ingredient.id}
                    className={styles.ingredients_list__item}
                  >
                    <div className={styles.ingredients_list__image}>
                      <Image
                        src={
                          ingredient.imageUrl
                            ? `${imageBaseUrl}/${ingredient.imageUrl}`
                            : "/pic_recipe_default.webp"
                        }
                        alt={ingredient.name}
                        width={100}
                        height={100}
                        priority={false}
                        loading="lazy"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <p className={styles.ingredients_list__name}>
                      {ingredient.name}
                    </p>
                    {ingredient.unit?.type !== "presence" && (
                      <p className={styles.ingredients_list__quantity}>
                        {Number.isInteger(ingredient.quantity)
                          ? ingredient.quantity
                          : Number(ingredient.quantity).toFixed(1)}
                        {ingredient.unit?.name || ""}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div
            className={styles.container_block__btn}
            data-onboarding="search-button"
          >
            <button 
              onClick={handleRecipe}
              aria-label="選択した具材でレシピを検索"
            >
              レシピを検索
            </button>
          </div>
        </div>

        {error && <p className="text-red-500" role="alert">{error}</p>}
      </section>

      {/* モーダル表示（スマホ用） - 常にレンダリング */}
      <div 
        className={`${styles.modal_overlay} ${isModalOpen ? styles["is-open"] : ""}`}
        onClick={onCloseModal}
        aria-hidden="true"
      />
      <div 
        className={`${styles.modal_content} ${isModalOpen ? styles["is-open"] : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div className={styles.modal_content__header}>
          <div className={styles.modal_content__header__title}>
            <h2 id="modal-title">選択した具材</h2>
            <div 
              className={styles.search_mode_notice}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              role="button"
              tabIndex={0}
              aria-label="検索条件の詳細を表示"
              aria-expanded={showTooltip}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowTooltip(!showTooltip);
                }
              }}
            >
              <IoMdInformationCircleOutline />
              {showTooltip && (
                <div 
                  className={styles.search_mode_notice__tooltip}
                  role="tooltip"
                  aria-hidden="true"
                >
                  <p>{getSearchModeMessage()}</p>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={onCloseModal}
            aria-label="モーダルを閉じる"
          >
            ×
          </button>
        </div>
        <div className={styles.modal_content__body} id="modal-description">
          {hasSeasonings && (
            <button
              className={styles.toggle_seasonings}
              onClick={() => setShowSeasonings(!showSeasonings)}
              aria-expanded={showSeasonings}
              aria-controls="modal-seasonings-list"
            >
              {showSeasonings
                ? "調味料、スパイスを非表示"
                : "調味料、スパイスを表示"}
            </button>
          )}
          {filteredIngredients.length > 0 && (
            <ul 
              className={styles.ingredients_list}
              id="modal-seasonings-list"
              aria-label="選択された具材のリスト"
            >
              {filteredIngredients.map((ingredient: Ingredient) => (
                <li
                  key={ingredient.id}
                  className={styles.ingredients_list__item}
                >
                  <div className={styles.ingredients_list__image}>
                    <Image
                      src={
                        ingredient.imageUrl
                          ? `${imageBaseUrl}/${ingredient.imageUrl}`
                          : "/pic_recipe_default.webp"
                      }
                      alt={ingredient.name}
                      width={100}
                      height={100}
                      priority={false}
                      loading="lazy"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <p className={styles.ingredients_list__name}>
                    {ingredient.name}
                  </p>
                  {ingredient.unit?.type !== "presence" && (
                    <p className={styles.ingredients_list__quantity}>
                      {Number.isInteger(ingredient.quantity)
                        ? ingredient.quantity
                        : Number(ingredient.quantity).toFixed(1)}
                      {ingredient.unit?.name || ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.modal_content__footer}>
          <button 
            onClick={handleRecipe}
            aria-label="選択した具材でレシピを検索"
          >
            レシピを検索
          </button>
        </div>
      </div>
    </>
  );
};

export default GenerateRecipe;
