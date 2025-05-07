import { useState } from 'react';
import { searchFoodData, getNutritionData, FoodDataWithKey } from '../utils/foodData';

interface IngredientFormProps {
  onSubmit: (data: {
    name: string;
    amount: number;
    unit: string;
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    salt: number;
  }) => void;
  initialData?: {
    name: string;
    amount: number;
    unit: string;
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    salt: number;
  };
}

export default function IngredientForm({ onSubmit, initialData }: IngredientFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount || 0);
  const [unit, setUnit] = useState(initialData?.unit || 'g');
  const [calories, setCalories] = useState(initialData?.calories || 0);
  const [protein, setProtein] = useState(initialData?.protein || 0);
  const [fat, setFat] = useState(initialData?.fat || 0);
  const [carbohydrates, setCarbohydrates] = useState(initialData?.carbohydrates || 0);
  const [salt, setSalt] = useState(initialData?.salt || 0);
  const [searchResults, setSearchResults] = useState<FoodDataWithKey[]>([]);
  const [selectedFoodKey, setSelectedFoodKey] = useState<string>('');

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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      amount,
      unit,
      calories,
      protein,
      fat,
      carbohydrates,
      salt
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          具材名
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            検索
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2">
            <label htmlFor="foodSelect" className="block text-sm font-medium text-gray-700">
              検索結果から選択
            </label>
            <select
              id="foodSelect"
              value={selectedFoodKey}
              onChange={(e) => handleFoodSelect(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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

      {/* ... existing amount and unit inputs ... */}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="calories" className="block text-sm font-medium text-gray-700">
            カロリー (kcal)
          </label>
          <input
            type="number"
            id="calories"
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="protein" className="block text-sm font-medium text-gray-700">
            タンパク質 (g)
          </label>
          <input
            type="number"
            id="protein"
            value={protein}
            onChange={(e) => setProtein(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="fat" className="block text-sm font-medium text-gray-700">
            脂質 (g)
          </label>
          <input
            type="number"
            id="fat"
            value={fat}
            onChange={(e) => setFat(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="carbohydrates" className="block text-sm font-medium text-gray-700">
            炭水化物 (g)
          </label>
          <input
            type="number"
            id="carbohydrates"
            value={carbohydrates}
            onChange={(e) => setCarbohydrates(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="salt" className="block text-sm font-medium text-gray-700">
            塩分 (g)
          </label>
          <input
            type="number"
            id="salt"
            value={salt}
            onChange={(e) => setSalt(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {initialData ? '更新' : '追加'}
        </button>
      </div>
    </form>
  );
} 