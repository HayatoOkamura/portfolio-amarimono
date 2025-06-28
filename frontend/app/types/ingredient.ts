export interface EditIngredient {
  id: number;
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
  };
  gramEquivalent: number;
} 