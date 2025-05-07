import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface IngredientFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function IngredientForm({ onSubmit, initialData }: IngredientFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    calories: initialData?.calories || 0,
    protein: initialData?.protein || 0,
    fat: initialData?.fat || 0,
    carbohydrates: initialData?.carbohydrates || 0,
    salt: initialData?.salt || 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchNutrientData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ingredients/nutrients?name=${encodeURIComponent(formData.name)}`);
      if (!response.ok) {
        throw new Error('栄養素データの取得に失敗しました');
      }
      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        calories: data.calories || 0,
        protein: data.protein || 0,
        fat: data.fat || 0,
        carbohydrates: data.carbohydrates || 0,
        salt: data.salt || 0,
      }));
      toast.success('栄養素データを取得しました');
    } catch (error) {
      toast.error('栄養素データの取得に失敗しました');
      console.error('Error fetching nutrient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">具材名</Label>
        <div className="flex gap-2">
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <Button
            type="button"
            onClick={fetchNutrientData}
            disabled={!formData.name || loading}
            className="whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                取得中...
              </>
            ) : (
              '栄養素データ取得'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="calories">カロリー (kcal)</Label>
          <Input
            id="calories"
            name="calories"
            type="number"
            value={formData.calories}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="protein">タンパク質 (g)</Label>
          <Input
            id="protein"
            name="protein"
            type="number"
            step="0.1"
            value={formData.protein}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fat">脂質 (g)</Label>
          <Input
            id="fat"
            name="fat"
            type="number"
            step="0.1"
            value={formData.fat}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carbohydrates">炭水化物 (g)</Label>
          <Input
            id="carbohydrates"
            name="carbohydrates"
            type="number"
            step="0.1"
            value={formData.carbohydrates}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salt">食塩相当量 (g)</Label>
          <Input
            id="salt"
            name="salt"
            type="number"
            step="0.1"
            value={formData.salt}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? '更新' : '登録'}
      </Button>
    </form>
  );
} 