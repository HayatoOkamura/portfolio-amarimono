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

export const RegistrationForm = ({ isAdmin = false, initialRecipe }: RecipeFormProps) => {
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6 max-w-lg mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {isLoading ? "下書きを読み込み中..." : "下書きは自動保存されます"}
        </div>
        <div className="flex items-center gap-2">
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

      <div className={styles.detail_block}>
        <ImageUploader
          imageUrl={formData.imageUrl}
          image={formData.image}
          onImageChange={(image, imageUrl) =>
            updateFormData({ image, imageUrl })
          }
        />

        <input
          type="text"
          placeholder="Recipe Name"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          className="border p-2 mb-2 w-full rounded text-gray-700"
        />

        <select
          value={formData.genre.id.toString()}
          onChange={(e) => {
            const selectedId = Number(e.target.value);
            if (selectedId > 0) {
              updateFormData({
                genre: {
                  id: selectedId,
                  name: recipeGenres.find((g: Genre) => g.id === selectedId)?.name || "",
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

        <h3>CookingTime</h3>
        <CookingTimeSlider
          cookingTime={formData.cookingTime}
          setCookingTime={(time) => updateFormData({ cookingTime: time })}
        />

        <h2>レシピ登録</h2>
        <CostEstimateSlider
          costEstimate={formData.costEstimate}
          setCostEstimate={(estimate) => {
            updateFormData({ costEstimate: estimate });
          }}
        />

        <textarea
          placeholder="Recipe Summary"
          value={formData.summary}
          onChange={(e) => updateFormData({ summary: e.target.value })}
          className="border p-2 mb-2 w-full rounded text-gray-700"
        />

        <textarea
          placeholder="Recipe Catchphrase"
          value={formData.catchphrase}
          onChange={(e) => updateFormData({ catchphrase: e.target.value })}
          className="border p-2 mb-2 w-full rounded text-gray-700"
        />

        <div>
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
                      value={formData.nutrition[key as keyof typeof formData.nutrition]}
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

        {ingredientsData && (
          <IngredientInput
            ingredients={formData.ingredients}
            availableIngredients={ingredientsData}
            onUpdateIngredients={(ingredients) =>
              updateFormData({ ingredients })
            }
          />
        )}

        <InstructionInput
          instructions={formData.instructions}
          onUpdateInstructions={(instructions) =>
            updateFormData({ instructions })
          }
        />
      </div>

      <div className={styles.btn_block}>
        <div
          className={`${styles.btn_block__item} ${styles["btn_block__item--reset"]}`}
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

        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          {initialRecipe ? "Update Recipe" : "Add Recipe"}
        </button>
      </div>

      {!isAdmin && (
        <div className="mb-4">
          <button
            onClick={() =>
              updateFormData({ isPublic: !formData.isPublic })
            }
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
  );
}; 