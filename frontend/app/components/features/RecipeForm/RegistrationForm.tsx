import { useEffect } from "react";
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

  useEffect(() => {
    fetchRecipeGenres();
  }, [fetchRecipeGenres]);

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaq = [...(formData.faq || [])];
    if (!updatedFaq[index]) {
      updatedFaq[index] = { question: '', answer: '' };
    }
    updatedFaq[index][field] = value;
    updateFormData({ faq: updatedFaq });
  };

  const addFaq = () => {
    const updatedFaq = [...(formData.faq || []), { question: '', answer: '' }];
    updateFormData({ faq: updatedFaq });
  };

  const removeFaq = (index: number) => {
    const updatedFaq = [...(formData.faq || [])];
    updatedFaq.splice(index, 1);
    updateFormData({ faq: updatedFaq });
  };

  return (
    <div className={styles.container_block}>
      <div className={styles.side_block}>
        <div className={styles.side_block__image}>
          <ImageUploader
            imageUrl={formData.imageUrl}
            image={formData.image}
            onImageChange={(image, imageUrl) =>
              updateFormData({ image, imageUrl })
            }
          />
        </div>
        <section className={styles.instructions_block}>
          <h2>作り方</h2>
          <InstructionInput
            instructions={formData.instructions}
            onUpdateInstructions={(instructions) =>
              updateFormData({ instructions })
            }
          />
        </section>
        <section className={styles.faq_block}>
          <h2>よくある質問</h2>
          {(formData.faq || []).map((faq, index) => (
            <div key={index} className={styles.faq_item}>
              <input
                type="text"
                value={faq.question}
                onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                placeholder="質問を入力"
                className={styles.faq_input}
              />
              <textarea
                value={faq.answer}
                onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                placeholder="回答を入力"
                className={styles.faq_textarea}
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
        </section>
      </div>
      <div className={styles.head_block}>
        <div className={styles.head_block__public}>
          {!isAdmin && (
            <div className="mb-4">
              <button
                onClick={() => updateFormData({ isPublic: !formData.isPublic })}
                className={`px-4 py-2 rounded w-full ${
                  formData.isPublic
                    ? "bg-green-500 text-white"
                    : "bg-gray-400 text-black"
                }`}
              >
                {formData.isPublic ? "公開中" : "非公開"}
              </button>
            </div>
          )}
        </div>
        <div className={styles.head_block__list}>
          <div className={styles.head_block__item}>
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
            >
              {initialRecipe ? "Update Recipe" : "Add Recipe"}
            </button>
          </div>
          <div className={styles.head_block__item}>
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
          <div className={styles.head_block__item}>
            <button
              onClick={handleSaveDraft}
              disabled={isLoading}
              className={`px-4 py-2 rounded ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : saveStatus === "saved"
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {isLoading
                ? "保存中..."
                : saveStatus === "saved"
                ? "保存完了"
                : "下書きを保存"}
            </button>
          </div>
        </div>
      </div>
      <div className={styles.main_block}>
        <div className={styles.detail_block}>
          <div className={styles.detail_block__item}>
            <p className={styles.detail_block__label}>レシピ名</p>
            <input
              type="text"
              placeholder="Recipe Name"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              className="border p-2 mb-2 w-full rounded text-gray-700"
            />
          </div>
          <div className={styles.detail_block__item}>
            <p className={styles.detail_block__label}>キャッチフレーズ</p>
            <textarea
              placeholder="Recipe Catchphrase"
              value={formData.catchphrase}
              onChange={(e) => updateFormData({ catchphrase: e.target.value })}
              className="border p-2 mb-2 w-full rounded text-gray-700"
            />
          </div>
          <div className={styles.detail_block__item}>
            <p className={styles.detail_block__label}>レシピ説明</p>
            <textarea
              placeholder="Recipe Summary"
              value={formData.summary}
              onChange={(e) => updateFormData({ summary: e.target.value })}
              className="border p-2 mb-2 w-full rounded text-gray-700"
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
              className="border p-2 mb-2 w-full rounded text-gray-700"
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
              <CookingTimeSlider
                cookingTime={formData.cookingTime}
                setCookingTime={(time) => updateFormData({ cookingTime: time })}
              />
            </div>
            <div className={styles.detail_block__sub_item}>
              <p className={styles.detail_block__label}>コスト</p>
              <CostEstimateSlider
                costEstimate={formData.costEstimate}
                setCostEstimate={(estimate) => {
                  updateFormData({ costEstimate: estimate });
                }}
              />
            </div>
          </div>
          <div className={styles.detail_block__item}>
            <h3>Nutrition</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">栄養素</th>
                  <th className="border p-2">値 (g, mg, kcal)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(formData.nutrition).map((key) => (
                  <tr key={key}>
                    <td className="border p-2">{key}</td>
                    <td className="border p-2">
                      <input
                        type="number"
                        placeholder={key}
                        value={
                          formData.nutrition[
                            key as keyof typeof formData.nutrition
                          ]
                        }
                        onChange={(e) =>
                          updateFormData({
                            nutrition: {
                              ...formData.nutrition,
                              [key]: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.detail_block__item}></div>
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {isLoading ? "下書きを読み込み中..." : "下書きは自動保存されます"}
        </div>
      </div>

      <div>
        {ingredientsData && (
          <IngredientInput
            ingredients={formData.ingredients}
            availableIngredients={ingredientsData}
            onUpdateIngredients={(ingredients) =>
              updateFormData({ ingredients })
            }
          />
        )}
      </div>
    </div>
  );
};
