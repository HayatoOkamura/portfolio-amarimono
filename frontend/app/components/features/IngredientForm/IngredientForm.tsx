import { useState } from 'react';
import { searchFoodData, getNutritionData, FoodDataWithKey } from '../../../utils/foodData';
import styles from "./IngredientForm.module.scss";
import { useRouter } from "next/navigation";
import { useAddIngredient, useUpdateIngredient } from "@/app/hooks/ingredients";
import { api } from "@/app/utils/api";

interface IngredientFormProps {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  initialData?: {
    name: string;
    unit: string;
    genre_id: string;
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    salt: number;
    image?: File;
  };
  units: { id: number; name: string; step: number }[];
  genres: { id: number; name: string }[];
}

const IngredientForm: React.FC<IngredientFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  units,
  genres,
}: IngredientFormProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [selectedUnit, setSelectedUnit] = useState(initialData?.unit || '');
  const [selectedGenre, setSelectedGenre] = useState(initialData?.genre_id || '');
  const [image, setImage] = useState<File | null>(null);
  const [calories, setCalories] = useState(initialData?.calories || 0);
  const [protein, setProtein] = useState(initialData?.protein || 0);
  const [fat, setFat] = useState(initialData?.fat || 0);
  const [carbohydrates, setCarbohydrates] = useState(initialData?.carbohydrates || 0);
  const [salt, setSalt] = useState(initialData?.salt || 0);
  const [searchResults, setSearchResults] = useState<FoodDataWithKey[]>([]);
  const [selectedFoodKey, setSelectedFoodKey] = useState<string>('');
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const addIngredientMutation = useAddIngredient();
  const updateIngredientMutation = useUpdateIngredient();

  const handleSearch = () => {
    if (!name) return;
    const results = searchFoodData(name);
    console.log('Search results:', results);
    setSearchResults(results);
  };

  const handleFoodSelect = (foodKey: string) => {
    console.log('Selected food key:', foodKey);
    setSelectedFoodKey(foodKey);
    try {
      const foodData = getNutritionData(foodKey);
      console.log('Food data:', foodData);
      setCalories(foodData.calories);
      setProtein(foodData.protein);
      setFat(foodData.fat);
      setCarbohydrates(foodData.carbohydrates);
      setSalt(foodData.salt);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setError("栄養素データの取得に失敗しました");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 必須フィールドのバリデーション
    if (!name) {
      setError("具材名を入力してください");
      return;
    }
    if (!selectedUnit) {
      setError("単位を選択してください");
      return;
    }
    if (!selectedGenre) {
      setError("ジャンルを選択してください");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("genre_id", selectedGenre);
      formData.append("unit_id", selectedUnit);
      
      // 栄養素データをJSON形式で追加
      const nutrition = {
        calories,
        protein,
        fat,
        carbohydrates,
        salt
      };
      formData.append("nutrition", JSON.stringify(nutrition));

      // 画像がある場合は追加
      if (image) {
        formData.append("image", image);
      }

      console.log('Submitting form data:', {
        name,
        genre_id: selectedGenre,
        unit_id: selectedUnit,
        nutrition,
        image: image ? image.name : 'none'
      });

      onSubmit(formData);
    } catch (err) {
      setError("材料の登録に失敗しました");
      console.error('Form submission error:', err);
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
            onClick={handleSearch}
            className={styles.nutritionButton}
          >
            検索
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className={styles.searchResults}>
            <label className={styles.label}>検索結果から選択</label>
            <select
              value={selectedFoodKey}
              onChange={(e) => handleFoodSelect(e.target.value)}
              className={styles.select}
            >
              <option value="">選択してください</option>
              {searchResults.map((food) => (
                <option key={food.key} value={food.key}>
                  {food.name}
                </option>
              ))}
            </select>
          </div>
        )}
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

      <div className={styles.nutritionFields}>
        <div className={styles.field}>
          <label htmlFor="calories" className={styles.label}>
            カロリー (kcal)
          </label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
            className={styles.input}
            placeholder="カロリー (kcal)"
            readOnly={!!selectedFoodKey}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="protein" className={styles.label}>
            タンパク質 (g)
          </label>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(Number(e.target.value))}
            className={styles.input}
            placeholder="タンパク質 (g)"
            readOnly={!!selectedFoodKey}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="fat" className={styles.label}>
            脂質 (g)
          </label>
          <input
            type="number"
            value={fat}
            onChange={(e) => setFat(Number(e.target.value))}
            className={styles.input}
            placeholder="脂質 (g)"
            readOnly={!!selectedFoodKey}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="carbohydrates" className={styles.label}>
            炭水化物 (g)
          </label>
          <input
            type="number"
            value={carbohydrates}
            onChange={(e) => setCarbohydrates(Number(e.target.value))}
            className={styles.input}
            placeholder="炭水化物 (g)"
            readOnly={!!selectedFoodKey}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="salt" className={styles.label}>
            塩分 (g)
          </label>
          <input
            type="number"
            value={salt}
            onChange={(e) => setSalt(Number(e.target.value))}
            className={styles.input}
            placeholder="塩分 (g)"
            readOnly={!!selectedFoodKey}
          />
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