import { useState, useEffect } from 'react';
import { searchFoodData, getNutritionData } from '../../../utils/foodData';
import styles from "./IngredientForm.module.scss";
import { useRouter } from "next/navigation";
import { useAddIngredient, useUpdateIngredient } from "@/app/hooks/ingredients";
import { api } from "@/app/utils/api";
import { ImageUploader } from '../RecipeForm/components/ImageUploader';

interface IngredientFormProps {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  initialData?: {
    id?: number;
    name: string;
    genre: { id: number; name: string };
    unit: { id: number; name: string; description: string; step: number };
    imageUrl?: string;
    nutrition: {
      calories: number;
      protein: number;
      fat: number;
      carbohydrates: number;
      salt: number;
      sugar?: number;
    };
    quantity?: number;
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
  const [selectedUnit, setSelectedUnit] = useState(initialData?.unit?.id?.toString() || '');
  const [selectedGenre, setSelectedGenre] = useState(initialData?.genre?.id?.toString() || '');
  const [image, setImage] = useState<File | undefined>(undefined);
  const [calories, setCalories] = useState(initialData?.nutrition?.calories || 0);
  const [protein, setProtein] = useState(initialData?.nutrition?.protein || 0);
  const [fat, setFat] = useState(initialData?.nutrition?.fat || 0);
  const [carbohydrates, setCarbohydrates] = useState(initialData?.nutrition?.carbohydrates || 0);
  const [salt, setSalt] = useState(initialData?.nutrition?.salt || 0);
  const [searchResults, setSearchResults] = useState<Array<{ key: string; name: string }>>([]);
  const [selectedFoodKey, setSelectedFoodKey] = useState<string>('');
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const router = useRouter();
  const addIngredientMutation = useAddIngredient();
  const updateIngredientMutation = useUpdateIngredient();

  // 初期データの設定
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedUnit(initialData.unit.id.toString());
      setSelectedGenre(initialData.genre.id.toString());
      
      if (initialData.nutrition) {
        setCalories(initialData.nutrition.calories);
        setProtein(initialData.nutrition.protein);
        setFat(initialData.nutrition.fat);
        setCarbohydrates(initialData.nutrition.carbohydrates);
        setSalt(initialData.nutrition.salt);
      }

      const results = searchFoodData(initialData.name);
      setSearchResults(results);
      const exactMatch = results.find(food => food.name === initialData.name);
      if (exactMatch) {
        setSelectedFoodKey(exactMatch.key);
      }
    }
  }, [initialData]);

  const handleSearch = () => {
    if (!name) {
      setError("具材名を入力してください");
      return;
    }
    setIsSearching(true);
    const results = searchFoodData(name);
    setSearchResults(results);
    if (results.length === 0) {
      setError("該当する具材が見つかりませんでした");
    } else {
      setError("");
    }
    setIsSearching(false);
  };

  const handleFoodSelect = (foodKey: string) => {
    setSelectedFoodKey(foodKey);
    try {
      const foodData = getNutritionData(foodKey);
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

  const handleImageChange = (newImage: File) => {
    setImage(newImage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      
      const nutrition = {
        calories,
        protein,
        fat,
        carbohydrates,
        salt
      };
      formData.append("nutrition", JSON.stringify(nutrition));

      if (image) {
        formData.append("image", image);
      }

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
            onChange={(e) => {
              setName(e.target.value);
              setError("");
              setSearchResults([]);
              setSelectedFoodKey("");
            }}
            className={styles.input}
            placeholder="具材の名前"
          />
          <button
            type="button"
            onClick={handleSearch}
            className={styles.nutritionButton}
            disabled={isSearching}
          >
            {isSearching ? "検索中..." : "栄養素を検索"}
          </button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className={styles.searchResults}>
          <label className={styles.label}>
            正確な栄養素データを取得するため、該当する具材を選択してください
          </label>
          <div className={styles.foodList}>
            {searchResults.map((food) => (
              <button
                key={food.key}
                type="button"
                onClick={() => handleFoodSelect(food.key)}
                className={`${styles.foodItem} ${selectedFoodKey === food.key ? styles.selected : ''}`}
              >
                {food.name}
              </button>
            ))}
          </div>
        </div>
      )}

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
        <label className={styles.label}>画像</label>
        <ImageUploader
          imageUrl={initialData?.imageUrl}
          image={image}
          onImageChange={handleImageChange}
        />
      </div>

      <div className={styles.nutritionFields}>
        <div className={styles.field}>
          <label htmlFor="calories" className={styles.label}>
            カロリー (kcal)
          </label>
          <input
            id="calories"
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
            id="protein"
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
            id="fat"
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
            id="carbohydrates"
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
            id="salt"
            type="number"
            value={salt}
            onChange={(e) => setSalt(Number(e.target.value))}
            className={styles.input}
            placeholder="塩分 (g)"
            readOnly={!!selectedFoodKey}
          />
        </div>
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