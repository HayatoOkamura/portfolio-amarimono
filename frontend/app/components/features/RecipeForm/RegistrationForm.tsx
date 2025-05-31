import { useEffect, useState } from "react";
import { useRecipeForm } from "./hooks/useRecipeForm";
import { ImageUploader } from "./components/ImageUploader";
import { IngredientInput } from "./components/IngredientInput";
import { InstructionInput } from "./components/InstructionInput";
import { RecipeFormProps } from "./types/recipeForm";
import { useIngredients } from "@/app/hooks/ingredients";
import useGenreStore from "@/app/stores/genreStore";
import { Genre } from "@/app/types/index";
import CookingTimeSlider from "@/app/components/ui/RegistarSlider/CookingTime/CookingTime";
import CostEstimateSlider from "@/app/components/ui/RegistarSlider/CostEstimate/CostEstimate";
import styles from "./RegistrationForm.module.scss";
import { ResponsiveWrapper } from "../../common/ResponsiveWrapper";
import { calculateNutrition } from "@/app/utils/nutritionCalculator";
import { IngredientSelectorModal } from './components/IngredientSelectorModal';
import IngredientCard from '@/app/components/ui/Cards/SearchIngredientCard/SearchIngredientCard';
import Image from 'next/image';
import { imageBaseUrl } from '@/app/utils/api';

export const RegistrationForm = ({
  isAdmin = false,
  initialRecipe,
}: RecipeFormProps) => {
  const {
    formData,
    updateFormData,
    resetFormData,
    handleSubmit,
    handleSaveDraft,
    isLoading,
    saveStatus,
  } = useRecipeForm({ isAdmin, initialRecipe });

  const { data: ingredientsData } = useIngredients();
  const { recipeGenres, fetchRecipeGenres } = useGenreStore();

  const [isSp, setIsSp] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);

  // デバッグ用のuseEffect
  useEffect(() => {
    if (process.env.ENVIRONMENT === 'development') {
      console.log('Form Data Updated:', formData);
    }
  }, [formData]);

  useEffect(() => {
    fetchRecipeGenres();
  }, [fetchRecipeGenres]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSp(window.innerWidth <= 769);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const handleFaqChange = (
    index: number,
    field: "question" | "answer",
    value: string
  ) => {
    const updatedFaq = [...(formData.faq || [])];
    if (!updatedFaq[index]) {
      updatedFaq[index] = { question: "", answer: "" };
    }
    updatedFaq[index][field] = value;
    updateFormData({ faq: updatedFaq });
  };

  const addFaq = () => {
    const updatedFaq = [...(formData.faq || []), { question: "", answer: "" }];
    updateFormData({ faq: updatedFaq });
  };

  const removeFaq = (index: number) => {
    const updatedFaq = [...(formData.faq || [])];
    updatedFaq.splice(index, 1);
    updateFormData({ faq: updatedFaq });
  };

  const ingredientsBlock = (
    <div className={styles.ingredients_block}>
      <div className={styles.ingredients_block__title}>材料</div>
      <div className={styles.ingredients_block__list}>
        {ingredientsData && (
          <>
            <button
              type="button"
              onClick={() => setIsIngredientModalOpen(true)}
              className={styles.ingredients_block__button}
            >
              材料を選択
            </button>
            <IngredientSelectorModal
              isOpen={isIngredientModalOpen}
              onClose={() => setIsIngredientModalOpen(false)}
              ingredients={ingredientsData}
              selectedIngredients={formData.ingredients.map(ing => ({
                id: ing.id,
                amount: ing.quantity
              }))}
              onSelect={(ingredients) =>
                updateFormData({
                  ingredients: ingredients.map((ing) => ({
                    id: ing.id,
                    quantity: ing.amount,
                    unitId: ingredientsData.find((i) => i.id === ing.id)?.unit.id || 0,
                    name: ingredientsData.find((i) => i.id === ing.id)?.name || '',
                  })),
                })
              }
            />
            <div className={styles.ingredients_block__selected}>
              {formData.ingredients.map((ingredient) => {
                const ingredientData = ingredientsData.find(
                  (i) => i.id === ingredient.id
                );
                if (!ingredientData) return null;

                const handleQuantityChange = (delta: number) => {
                  const newQuantity = Math.max(0, ingredient.quantity + delta);
                  if (newQuantity === 0) {
                    // 数量が0になったら具材を削除
                    const updatedIngredients = formData.ingredients.filter(
                      (ing) => ing.id !== ingredient.id
                    );
                    updateFormData({ ingredients: updatedIngredients });
                  } else {
                    // 数量を更新
                    const updatedIngredients = formData.ingredients.map((ing) =>
                      ing.id === ingredient.id
                        ? { ...ing, quantity: newQuantity }
                        : ing
                    );
                    updateFormData({ ingredients: updatedIngredients });
                  }
                };

                return (
                  <div key={ingredient.id} className={styles.select_ingredient_block}>
                    <div className={styles.select_ingredient_block__image}>
                      <Image
                        src={
                          ingredientData.imageUrl
                            ? `${imageBaseUrl}/${ingredientData.imageUrl}`
                            : "/pic_recipe_default.webp"
                        }
                        alt={ingredientData.name}
                        width={80}
                        height={80}
                      />
                    </div>
                    <div className={styles.select_ingredient_block__contents}>
                      <div className={styles.select_ingredient_block__info}>
                        <p className={styles.select_ingredient_block__genre}>
                          {ingredientData.genre.name}
                        </p>
                        <p className={styles.select_ingredient_block__name}>
                          {ingredientData.name}
                        </p>
                      </div>
                      <div className={styles.select_ingredient_block__controls}>
                        <button
                          onClick={() => handleQuantityChange(ingredientData.unit.step)}
                          className={`${styles.select_ingredient_block__button} ${styles['select_ingredient_block__button--plus']}`}
                          aria-label={`${ingredientData.name}を増やす`}
                        />
                        <span className={styles.select_ingredient_block__quantity}>
                          {Number.isInteger(ingredient.quantity)
                            ? ingredient.quantity
                            : Number(ingredient.quantity).toFixed(1)}
                          {ingredientData.unit.name}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(-ingredientData.unit.step)}
                          className={`${styles.select_ingredient_block__button} ${styles['select_ingredient_block__button--minus']}`}
                          aria-label={`${ingredientData.name}を減らす`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.container_block}>
      <div className={styles.side_block}>
        <div className={styles.side_block__image}>
          <ImageUploader
            imageUrl={formData.imageUrl}
            image={formData.image}
            onImageChange={(image) => {
              const imageUrl = image ? URL.createObjectURL(image) : "";
              updateFormData({ image, imageUrl });
            }}
          />
        </div>
        <section className={styles.instructions_block}>
          <h2 className={styles.instructions_block__title}>作り方</h2>
          <InstructionInput
            instructions={formData.instructions}
            onUpdateInstructions={(instructions) =>
              updateFormData({ instructions })
            }
          />
        </section>
      </div>
      <div className={styles.main_block}>
        <div className={styles.head_block}>
          <div className={styles.head_block__public}>
            {!isAdmin && (
              <label className={styles.publicCheckbox}>
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={() =>
                    updateFormData({ isPublic: !formData.isPublic })
                  }
                  className={styles.publicCheckbox__input}
                />
                <span className={styles.publicCheckbox__label}>
                  {formData.isPublic ? "公開中" : "非公開"}
                </span>
              </label>
            )}
          </div>
          <div className={styles.head_block__list}>
            <div
              className={`${styles.head_block__item} ${styles["head_block__item--add"]}`}
            >
              <button onClick={handleSubmit}>
                {initialRecipe ? "更新" : "追加"}
              </button>
            </div>
            <div
              className={`${styles.head_block__item} ${styles["head_block__item--save"]}`}
            >
              <button onClick={handleSaveDraft} disabled={isLoading}>
                {isLoading
                  ? "保存中..."
                  : saveStatus === "saved"
                    ? "保存完了"
                    : "保存"}
              </button>
            </div>
            <div
              className={`${styles.head_block__item} ${styles["head_block__item--reset"]}`}
            >
              <button
                onClick={() => {
                  if (confirm("入力した内容を全てリセットしますか？")) {
                    resetFormData();
                  }
                }}
              >
                リセット
              </button>
            </div>
          </div>
        </div>
        <div className={styles.contents_block}>
          <div className={styles.detail_block}>
            <div
              className={`${styles.detail_block__item} ${styles["detail_block__item--head"]}`}
            >
              <p
                className={`${styles.detail_block__label} ${styles["detail_block__label--head"]}`}
              >
                レシピ名
              </p>
              <input
                type="text"
                placeholder="野菜たっぷり！具だくさんカレーライス"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                className={`${styles.detail_block__input} ${styles["detail_block__input--head"]}`}
              />
            </div>
            <div className={styles.detail_block__item}>
              <p className={styles.detail_block__label}>キャッチフレーズ</p>
              <textarea
                placeholder="栄養満点！野菜の甘みが引き立つ、家族みんなが喜ぶ絶品カレー"
                value={formData.catchphrase}
                onChange={(e) =>
                  updateFormData({ catchphrase: e.target.value })
                }
                className={styles.detail_block__input}
              />
            </div>
            <div className={styles.detail_block__item}>
              <p className={styles.detail_block__label}>レシピ説明</p>
              <textarea
                placeholder="にんじん、玉ねぎ、じゃがいもなどの定番野菜に加え、パプリカやズッキーニも入れた、彩り豊かなカレーです。野菜の旨味を活かすため、じっくりと炒めてから煮込むのがポイント。スパイスの香りと野菜の甘みが絶妙に調和した、一度食べたらやみつきになる味わいです。"
                value={formData.summary}
                onChange={(e) => updateFormData({ summary: e.target.value })}
                className={`${styles.detail_block__input} ${styles["detail_block__input--summary"]}`}
              />
            </div>
            <div className={styles.detail_block__item}>
              <p className={styles.detail_block__label}>ジャンル</p>
              <select
                value={formData.genre.id.toString()}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  if (selectedId > 0) {
                    updateFormData({
                      genre: {
                        id: selectedId,
                        name:
                          recipeGenres.find((g: Genre) => g.id === selectedId)
                            ?.name || "",
                      },
                    });
                  }
                }}
                className={styles.detail_block__input}
              >
                <option value="">ジャンルを選択してください</option>
                {recipeGenres.length > 0 &&
                  recipeGenres.map((genre: Genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
              </select>
            </div>
            <div
              className={`${styles.detail_block__item} ${styles["detail_block__item--flex"]}`}
            >
              <div className={styles.detail_block__sub_item}>
                <p className={styles.detail_block__label}>調理時間</p>
                <div className={styles.detail_block__slider}>
                  <CookingTimeSlider
                    cookingTime={formData.cookingTime}
                    setCookingTime={(time) =>
                      updateFormData({ cookingTime: time })
                    }
                  />
                </div>
              </div>
              <div className={styles.detail_block__sub_item}>
                <p className={styles.detail_block__label}>コスト</p>
                <div className={styles.detail_block__slider}>
                  <CostEstimateSlider
                    costEstimate={formData.costEstimate}
                    setCostEstimate={(estimate) => {
                      updateFormData({ costEstimate: estimate });
                    }}
                  />
                </div>
              </div>
            </div>
            <div
              className={`${styles.detail_block__item} ${styles["detail_block__item--nutrition"]}`}
            >
              <p className={styles.detail_block__label}>栄養素</p>
              <table className={styles.detail_block__table}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2"></th>
                    <th className="border p-2">値 (g, mg, kcal)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(formData.nutrition).map((key) => (
                    <tr key={key}>
                      <td className="border p-2">{key}</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          placeholder={key}
                          value={
                            formData.nutrition[
                              key as keyof typeof formData.nutrition
                            ]
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            // 数値と小数点のみを許可
                            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                              updateFormData({
                                nutrition: {
                                  ...formData.nutrition,
                                  [key]: value === "" ? 0 : Number(value),
                                },
                              });
                            }
                          }}
                          className="w-full p-2 border rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                type="button"
                onClick={() => {
                  if (
                    !formData.ingredients ||
                    formData.ingredients.length === 0
                  ) {
                    alert("具材を選択してください");
                    return;
                  }

                  const ingredientsWithNutrition = formData.ingredients.map(
                    (ing) => {
                      const ingredient = ingredientsData?.find(
                        (i) => i.id === ing.id
                      );
                      console.log('Found ingredient:', ingredient);
                      return {
                        id: ing.id,
                        name: ingredient?.name || "",
                        quantity: ing.quantity,
                        unit: ingredient?.unit || {
                          id: 0,
                          name: "g",
                          description: "",
                          step: 1,
                        },
                        nutrition: ingredient?.nutrition || {
                          calories: 0,
                          protein: 0,
                          fat: 0,
                          carbohydrates: 0,
                          salt: 0,
                        },
                      };
                    }
                  );
                  console.log('Ingredients with nutrition:', ingredientsWithNutrition);

                  const nutrition = calculateNutrition(
                    ingredientsWithNutrition
                  );
                  console.log('Calculated Nutrition:', nutrition);
                  console.log('Current Form Data:', formData);
                  updateFormData({
                    nutrition: {
                      ...formData.nutrition,
                      ...nutrition,
                    },
                  });
                  console.log('Updated Form Data:', formData);
                }}
                className={styles.detail_block__calculate}
              >
                具材から栄養素を計算
              </button>
            </div>

            <div className={`${styles.detail_block__item} ${styles["detail_block__item--faq"]}`}>
              <p className={styles.detail_block__label}>よくある質問</p>
              {(formData.faq || []).map((faq, index) => (
                <div key={index} className={styles.detail_block__faq}>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) =>
                      handleFaqChange(index, "question", e.target.value)
                    }
                    placeholder="質問を入力"
                    className={styles.detail_block__input}
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) =>
                      handleFaqChange(index, "answer", e.target.value)
                    }
                    placeholder="回答を入力"
                    className={`${styles.detail_block__input} ${styles["detail_block__input--summary"]}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className={styles.faq_remove_button}
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFaq}
                className={styles.faq_add_button}
              >
                質問を追加
              </button>
            </div>
          </div>
          <ResponsiveWrapper breakpoint="sp" renderBelow={null}>
            {ingredientsBlock}
          </ResponsiveWrapper>
        </div>
      </div>
      <ResponsiveWrapper breakpoint="sp" renderBelow={ingredientsBlock}>
        {null}
      </ResponsiveWrapper>
    </div>
  );
};
