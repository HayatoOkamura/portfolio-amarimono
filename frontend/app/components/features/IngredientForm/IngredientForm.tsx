import { useState, useEffect } from "react";
import { EditIngredient } from "@/app/types/index";
import styles from "./IngredientForm.module.scss";
import { useRouter } from "next/navigation";
import usdaApi from "@/app/utils/usdaApi";
import { useAddIngredient, useUpdateIngredient } from "@/app/hooks/ingredients";
import { api } from "@/app/utils/api";

interface IngredientFormProps {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  initialData?: EditIngredient;
  units: { id: number; name: string; step: number }[];
  genres: { id: number; name: string }[];
}

const IngredientForm = ({
  onSubmit,
  onCancel,
  initialData,
  units,
  genres,
}: IngredientFormProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [englishName, setEnglishName] = useState(initialData?.englishName || "");
  const [selectedUnit, setSelectedUnit] = useState(initialData?.unit?.id || "");
  const [selectedGenre, setSelectedGenre] = useState(initialData?.genre?.id || "");
  const [image, setImage] = useState<File | null>(null);
  const [nutrition, setNutrition] = useState({
    calories: initialData?.nutrition?.calories || 0,
    carbohydrates: initialData?.nutrition?.carbohydrates || 0,
    fat: initialData?.nutrition?.fat || 0,
    protein: initialData?.nutrition?.protein || 0,
    sugar: initialData?.nutrition?.sugar || 0,
    salt: initialData?.nutrition?.salt || 0,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFetchingNutrition, setIsFetchingNutrition] = useState(false);
  const router = useRouter();
  const addIngredientMutation = useAddIngredient();
  const updateIngredientMutation = useUpdateIngredient();

  const handleTranslate = async () => {
    if (!name) {
      setError("材料名を入力してください");
      return;
    }

    setIsTranslating(true);
    setError("");

    try {
      const response = await api.get(`/admin/ingredients/translate`, {
        params: { name }
      });
      
      setEnglishName(response.data.englishName);
    } catch (err) {
      setError("翻訳に失敗しました");
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFetchNutrition = async () => {
    if (!englishName) {
      setError("英語名を入力してください");
      return;
    }

    setIsFetchingNutrition(true);
    setError("");

    try {
      const fdcId = await usdaApi.searchUSDAFood(englishName);
      if (!fdcId) {
        throw new Error("栄養データが見つかりませんでした");
      }

      const nutritionData = await usdaApi.getNutritionData(fdcId);
      if (!nutritionData) {
        throw new Error("栄養データの取得に失敗しました");
      }

      const updatedNutrition = {
        calories: nutritionData.calories,
        carbohydrates: nutritionData.carbohydrates,
        fat: nutritionData.fat,
        protein: nutritionData.protein,
        sugar: nutritionData.sugar,
        salt: nutritionData.salt
      };

      setNutrition(updatedNutrition);
    } catch (err) {
      setError("栄養データの取得に失敗しました");
      console.error(err);
    } finally {
      setIsFetchingNutrition(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedUnit || !selectedGenre) {
      setError("必須項目を入力してください");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("english_name", englishName);
      formData.append("unit_id", selectedUnit.toString());
      formData.append("genre_id", selectedGenre.toString());
      formData.append("nutrition", JSON.stringify(nutrition));

      if (image) {
        formData.append("image", image);
      }

      onSubmit(formData);
    } catch (err) {
      setError("材料の登録に失敗しました");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>
          名前
        </label>
        <div className={styles.inputGroup}>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            placeholder="具材の名前"
          />
          <button
            type="button"
            onClick={handleTranslate}
            disabled={isTranslating || !name}
            className={styles.translateButton}
          >
            {isTranslating ? "翻訳中..." : "翻訳"}
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="englishName" className={styles.label}>
          英語名
        </label>
        <div className={styles.inputGroup}>
          <input
            id="englishName"
            type="text"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
            className={styles.input}
            placeholder="English name"
          />
          <button
            type="button"
            onClick={handleFetchNutrition}
            disabled={isFetchingNutrition || !englishName}
            className={styles.nutritionButton}
          >
            {isFetchingNutrition ? "取得中..." : "栄養データ取得"}
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="unit" className={styles.label}>
          単位
        </label>
        <select
          id="unit"
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className={styles.select}
        >
          <option value="">単位を選択</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="genre" className={styles.label}>
          ジャンル
        </label>
        <select
          id="genre"
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className={styles.select}
        >
          <option value="">ジャンルを選択</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>栄養成分</label>
        <div className={styles.nutritionGrid}>
          <div className={styles.nutritionItem}>
            <label>カロリー (kcal)</label>
            <input
              type="number"
              value={nutrition.calories}
              onChange={(e) => setNutrition({ ...nutrition, calories: Number(e.target.value) })}
              step="0.1"
            />
          </div>
          <div className={styles.nutritionItem}>
            <label>炭水化物 (g)</label>
            <input
              type="number"
              value={nutrition.carbohydrates}
              onChange={(e) => setNutrition({ ...nutrition, carbohydrates: Number(e.target.value) })}
              step="0.1"
            />
          </div>
          <div className={styles.nutritionItem}>
            <label>脂質 (g)</label>
            <input
              type="number"
              value={nutrition.fat}
              onChange={(e) => setNutrition({ ...nutrition, fat: Number(e.target.value) })}
              step="0.1"
            />
          </div>
          <div className={styles.nutritionItem}>
            <label>タンパク質 (g)</label>
            <input
              type="number"
              value={nutrition.protein}
              onChange={(e) => setNutrition({ ...nutrition, protein: Number(e.target.value) })}
              step="0.1"
            />
          </div>
          <div className={styles.nutritionItem}>
            <label>糖質 (g)</label>
            <input
              type="number"
              value={nutrition.sugar}
              onChange={(e) => setNutrition({ ...nutrition, sugar: Number(e.target.value) })}
              step="0.1"
            />
          </div>
          <div className={styles.nutritionItem}>
            <label>塩分 (g)</label>
            <input
              type="number"
              value={nutrition.salt}
              onChange={(e) => setNutrition({ ...nutrition, salt: Number(e.target.value) })}
              step="0.1"
            />
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="image" className={styles.label}>
          画像
        </label>
        <input
          id="image"
          type="file"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className={styles.fileInput}
          accept="image/*"
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={isSubmitting}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? "登録中..." : "登録"}
        </button>
      </div>
    </form>
  );
};

export default IngredientForm; 