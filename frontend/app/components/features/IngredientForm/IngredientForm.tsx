import { useState } from "react";
import { EditIngredient } from "@/app/types/index";
import { useTranslateIngredientName } from "@/app/hooks/ingredients";
import usdaApi from "@/app/utils/usdaApi";
import styles from "./IngredientForm.module.scss";

interface IngredientFormProps {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  initialData?: EditIngredient;
  units: { id: number; name: string }[];
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
  const [nameEn, setNameEn] = useState(initialData?.englishName || "");
  const [selectedUnit, setSelectedUnit] = useState(initialData?.unit?.id || "");
  const [selectedGenre, setSelectedGenre] = useState(initialData?.genre?.id || "");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFetchingNutrition, setIsFetchingNutrition] = useState(false);
  const [nutrition, setNutrition] = useState({
    calories: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
    sugar: 0,
    salt: 0
  });

  const translateMutation = useTranslateIngredientName();

  const handleTranslate = async () => {
    if (!name) {
      setError("翻訳する名前を入力してください");
      return;
    }

    setIsTranslating(true);
    setError("");
    setSuccess("");

    try {
      const englishName = await translateMutation.mutateAsync(name);
      setNameEn(englishName);
      setSuccess("翻訳が完了しました");
    } catch (error) {
      console.error("Translation error:", error);
      setError("翻訳中にエラーが発生しました");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFetchNutrition = async () => {
    if (!nameEn) {
      setError("英語名を入力してください");
      return;
    }

    setIsFetchingNutrition(true);
    setError("");
    setSuccess("");

    try {
      console.log("Fetching nutrition data for:", nameEn);
      const fdcId = await usdaApi.searchUSDAFood(nameEn);
      
      if (!fdcId) {
        setError("栄養データが見つかりませんでした");
        return;
      }

      console.log("Found FDC ID:", fdcId);
      const nutritionData = await usdaApi.getNutritionData(fdcId);
      
      if (!nutritionData) {
        setError("栄養データの取得に失敗しました");
        return;
      }

      console.log("Retrieved nutrition data:", nutritionData);
      setNutrition(nutritionData);
      setSuccess("栄養データを取得しました");
    } catch (error) {
      console.error("Error fetching nutrition:", error);
      setError(error instanceof Error ? error.message : "栄養データの取得中にエラーが発生しました");
    } finally {
      setIsFetchingNutrition(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !selectedUnit || !selectedGenre || (!image && !initialData?.imageUrl)) {
      setError("名前、単位、ジャンル、画像はすべて必須です。");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("english_name", nameEn);
    formData.append("unit_id", selectedUnit.toString());
    formData.append("genre_id", selectedGenre.toString());
    formData.append("quantity", "0");

    // 栄養データを追加
    formData.append("nutrition", JSON.stringify(nutrition));

    if (image) {
      formData.append("image", image);
    } else if (initialData?.imageUrl) {
      formData.append("image_url", initialData.imageUrl);
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>
          名前
        </label>
        <div className={styles.nameInput}>
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
            disabled={isTranslating}
            className={styles.translateButton}
          >
            {isTranslating ? "翻訳中..." : "翻訳"}
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="nameEn" className={styles.label}>
          英語名
        </label>
        <div className={styles.nameInput}>
          <input
            id="nameEn"
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className={styles.input}
            placeholder="英語名"
          />
          <button
            type="button"
            onClick={handleFetchNutrition}
            disabled={isFetchingNutrition}
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

      <div className={styles.nutritionSection}>
        <h3>栄養成分</h3>
        <div className={styles.nutritionGrid}>
          <div className={styles.nutritionItem}>
            <label>カロリー (kcal)</label>
            <input
              type="number"
              value={nutrition.calories}
              onChange={(e) => setNutrition(prev => ({ ...prev, calories: Number(e.target.value) }))}
              className={styles.nutritionInput}
            />
          </div>
          <div className={styles.nutritionItem}>
            <label>タンパク質 (g)</label>
            <input
              type="number"
              value={nutrition.protein}
              onChange={(e) => setNutrition(prev => ({ ...prev, protein: Number(e.target.value) }))}
              className={styles.nutritionInput}
            />
          </div>
          <div className={styles.nutritionItem}>
            <label>脂質 (g)</label>
            <input
              type="number"
              value={nutrition.fat}
              onChange={(e) => setNutrition(prev => ({ ...prev, fat: Number(e.target.value) }))}
              className={styles.nutritionInput}
            />
          </div>
          <div className={styles.nutritionItem}>
            <label>炭水化物 (g)</label>
            <input
              type="number"
              value={nutrition.carbohydrates}
              onChange={(e) => setNutrition(prev => ({ ...prev, carbohydrates: Number(e.target.value) }))}
              className={styles.nutritionInput}
            />
          </div>
          <div className={styles.nutritionItem}>
            <label>糖質 (g)</label>
            <input
              type="number"
              value={nutrition.sugar}
              onChange={(e) => setNutrition(prev => ({ ...prev, sugar: Number(e.target.value) }))}
              className={styles.nutritionInput}
            />
          </div>
          <div className={styles.nutritionItem}>
            <label>塩分 (g)</label>
            <input
              type="number"
              value={nutrition.salt}
              onChange={(e) => setNutrition(prev => ({ ...prev, salt: Number(e.target.value) }))}
              className={styles.nutritionInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          キャンセル
        </button>
        <button type="submit" className={styles.submitButton}>
          {initialData ? "更新" : "登録"}
        </button>
      </div>
    </form>
  );
};

export default IngredientForm;