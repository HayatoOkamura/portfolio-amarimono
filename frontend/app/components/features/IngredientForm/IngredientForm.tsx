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
    imageUrl?: string | File | null;
    nutrition: {
      calories: number;
      protein: number;
      fat: number;
      carbohydrates: number;
      salt: number;
    };
    quantity?: number;
    gramEquivalent?: number;
  };
  units: { id: number; name: string; step: number }[];
  genres: { id: number; name: string }[];
}

interface NutritionValues {
  calories: string;
  protein: string;
  fat: string;
  carbohydrates: string;
  salt: string;
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
  const [selectedGenre, setSelectedGenre] = useState<string>(initialData?.genre?.id?.toString() || '');
  const [image, setImage] = useState<File | undefined>(undefined);
  const [gramEquivalent, setGramEquivalent] = useState<number>(initialData?.gramEquivalent || 100);
  const [searchResults, setSearchResults] = useState<Array<{ key: string; name: string }>>([]);
  const [selectedFoodKey, setSelectedFoodKey] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState(false);

  // 栄養素の状態をまとめて管理
  const [nutrition, setNutrition] = useState<NutritionValues>({
    calories: initialData?.nutrition?.calories?.toString() || '',
    protein: initialData?.nutrition?.protein?.toString() || '',
    fat: initialData?.nutrition?.fat?.toString() || '',
    carbohydrates: initialData?.nutrition?.carbohydrates?.toString() || '',
    salt: initialData?.nutrition?.salt?.toString() || '',
  });

  const [baseNutrition, setBaseNutrition] = useState<NutritionValues>({
    calories: initialData?.nutrition?.calories?.toString() || '',
    protein: initialData?.nutrition?.protein?.toString() || '',
    fat: initialData?.nutrition?.fat?.toString() || '',
    carbohydrates: initialData?.nutrition?.carbohydrates?.toString() || '',
    salt: initialData?.nutrition?.salt?.toString() || '',
  });

  // 栄養素の入力ハンドラーを統一
  const handleNutritionChange = (field: keyof NutritionValues, value: string) => {
    // 小数点第2位までの数値を許可
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setNutrition(prev => ({ ...prev, [field]: value }));
      setBaseNutrition(prev => ({ ...prev, [field]: value }));
    }
  };

  // フォーカスが外れた時に数値をフォーマット
  const handleNutritionBlur = (field: keyof NutritionValues) => {
    const value = nutrition[field];
    if (value !== "") {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        const formattedValue = num.toFixed(2);
        setNutrition(prev => ({ ...prev, [field]: formattedValue }));
        setBaseNutrition(prev => ({ ...prev, [field]: formattedValue }));
      }
    }
  };

  // 栄養素データの更新を統一
  const updateNutritionData = (foodData: any) => {
    const newNutrition = {
      calories: foodData.calories.toString(),
      protein: foodData.protein.toString(),
      fat: foodData.fat.toString(),
      carbohydrates: foodData.carbohydrates.toString(),
      salt: foodData.salt.toString(),
    };
    setNutrition(newNutrition);
    setBaseNutrition(newNutrition);
  };

  const handleFoodSelect = (foodKey: string) => {
    setSelectedFoodKey(foodKey);
    try {
      const foodData = getNutritionData(foodKey);
      updateNutritionData(foodData);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setError("栄養素データの取得に失敗しました");
    }
  };

  const handleGramEquivalentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setGramEquivalent(newValue);

    // 100gあたりの栄養素値を計算
    const ratio = newValue / 100;
    const newNutrition = Object.entries(baseNutrition).reduce((acc, [key, value]) => {
      const num = Number(value) || 0;
      acc[key as keyof NutritionValues] = (num * ratio).toFixed(2);
      return acc;
    }, {} as NutritionValues);

    setNutrition(newNutrition);
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
    if (!gramEquivalent || gramEquivalent <= 0) {
      setError("100gに相当する量を入力してください");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("genre_id", selectedGenre);
      formData.append("unit_id", selectedUnit);
      formData.append("gram_equivalent", gramEquivalent.toString());
      
      const nutritionData = {
        calories: Number(nutrition.calories) || 0,
        protein: Number(nutrition.protein) || 0,
        fat: Number(nutrition.fat) || 0,
        carbohydrates: Number(nutrition.carbohydrates) || 0,
        salt: Number(nutrition.salt) || 0
      };
      formData.append("nutrition", JSON.stringify(nutritionData));

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
              setSelectedFoodKey(null);
            }}
            className={styles.input}
            placeholder="具材の名前"
          />
          <button
            type="button"
            onClick={() => {
              if (!name) return;
              setIsSearching(true);
              const results = searchFoodData(name);
              setSearchResults(results);
              if (results.length === 0) {
                setError("該当する具材が見つかりませんでした");
              } else {
                setError("");
              }
              setIsSearching(false);
            }}
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
        <label htmlFor="gramEquivalent" className={styles.label}>
          100gに相当する量
        </label>
        <div className={styles.inputGroup}>
          <input
            id="gramEquivalent"
            type="text"
            value={gramEquivalent || ''}
            onChange={handleGramEquivalentChange}
            className={styles.input}
            placeholder="例：卵1個が50gの場合は50"
            inputMode="decimal"
          />
          <button
            type="button"
            className={styles.nutritionButton}
            onClick={() => {
              if (!gramEquivalent) return;
              const ratio = gramEquivalent / 100;
              const newNutrition = Object.entries(baseNutrition).reduce((acc, [key, value]) => {
                const num = Number(value) || 0;
                acc[key as keyof NutritionValues] = (num * ratio).toFixed(2);
                return acc;
              }, {} as NutritionValues);
              setNutrition(newNutrition);
            }}
          >
            換算
          </button>
        </div>
        <p className={styles.helpText}>
          この具材の1単位が何グラムに相当するかを入力してください。<br />
          例：卵1個が50gの場合は50、りんご1個が300gの場合は300
          <br />
          「換算」ボタンを押すと、100gあたりの栄養素値をこの量あたりの値に自動計算します。
        </p>
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

      <div className={styles.imageAndNutritionFields}>
        <div className={styles.field}>
          <label className={styles.label}>画像</label>
          <ImageUploader
            imageUrl={typeof initialData?.imageUrl === 'string' ? initialData.imageUrl : undefined}
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
              type="text"
              value={nutrition.calories}
              onChange={(e) => handleNutritionChange('calories', e.target.value)}
              onBlur={() => handleNutritionBlur('calories')}
              className={styles.input}
              placeholder="0"
              readOnly={!!selectedFoodKey}
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="protein" className={styles.label}>
              タンパク質 (g)
            </label>
            <input
              id="protein"
              type="text"
              value={nutrition.protein}
              onChange={(e) => handleNutritionChange('protein', e.target.value)}
              onBlur={() => handleNutritionBlur('protein')}
              className={styles.input}
              placeholder="0"
              readOnly={!!selectedFoodKey}
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="fat" className={styles.label}>
              脂質 (g)
            </label>
            <input
              id="fat"
              type="text"
              value={nutrition.fat}
              onChange={(e) => handleNutritionChange('fat', e.target.value)}
              onBlur={() => handleNutritionBlur('fat')}
              className={styles.input}
              placeholder="0"
              readOnly={!!selectedFoodKey}
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="carbohydrates" className={styles.label}>
              炭水化物 (g)
            </label>
            <input
              id="carbohydrates"
              type="text"
              value={nutrition.carbohydrates}
              onChange={(e) => handleNutritionChange('carbohydrates', e.target.value)}
              onBlur={() => handleNutritionBlur('carbohydrates')}
              className={styles.input}
              placeholder="0"
              readOnly={!!selectedFoodKey}
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="salt" className={styles.label}>
              塩分 (g)
            </label>
            <input
              id="salt"
              type="text"
              value={nutrition.salt}
              onChange={(e) => handleNutritionChange('salt', e.target.value)}
              onBlur={() => handleNutritionBlur('salt')}
              className={styles.input}
              placeholder="0"
              readOnly={!!selectedFoodKey}
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
            />
          </div>
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