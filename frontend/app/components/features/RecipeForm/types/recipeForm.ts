import { Nutrition, Unit, FAQ } from "@/app/types/index";

export interface RecipeFormData {
  id?: string;
  name: string;
  genre: {
    id: number;
    name: string;
  };
  cookingTime: number;
  costEstimate: number;
  summary: string;
  catchphrase: string;
  nutrition: {
    calories: number;
    carbohydrates: number;
    fat: number;
    protein: number;
    sugar: number;
    salt: number;
  };
  ingredients: Array<{
    id: number;
    quantity: number;
    unitId: number;
    englishName: string;
    name: string;
  }>;
  instructions: Array<{
    step: number;
    description: string;
    imageURL?: File | string;
  }>;
  image?: File;
  imageUrl?: string;
  isPublic: boolean;
  isDraft: boolean;
  faq?: FAQ[];
}

export interface RecipeFormProps {
  isAdmin?: boolean;
  initialRecipe?: RecipeFormData;
}

export interface RecipeFormContextType {
  formData: RecipeFormData;
  updateFormData: (updates: Partial<RecipeFormData>) => void;
  resetFormData: () => void;
  handleSubmit: () => Promise<void>;
  handleSaveDraft: () => Promise<void>;
  isLoading: boolean;
  saveStatus: "idle" | "saving" | "saved";
} 