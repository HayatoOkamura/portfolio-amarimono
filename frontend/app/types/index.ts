export interface Genre {
  id: number;
  name: string;
}

export interface Review {
  id: string;
  recipeId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}


export interface Unit {
  id: number;
  name: string;
  description: string;
  step: number;
}

export interface Ingredient {
  id: number;
  name: string;
  genre: Genre;
  imageUrl?: string | null;
  quantity: number;
  unit: Unit;
}

export interface Instruction {
  id: string;
  stepNumber: number;
  description: string;
  imageUrl?: string;
}

export interface Nutrition {
  calories: number;
  carbohydrates: number;
  fat: number;
  protein: number;
  sugar: number;
  salt: number;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Recipe {
  id: string;
  name: string;
  imageUrl?: string;
  instructions: Instruction[];
  ingredients: Ingredient[];
  genre?: Genre | null;
  cookingTime: number;
  reviews: Review[];
  costEstimate: number;
  summary: string;
  catchphrase: string;
  nutrition: Nutrition | null;
  faq: FAQ[];
  userId?: string;
  nutritionPercentage?: Nutrition | null;
  isPublic?: boolean;
}

export interface NewRecipe {
  name: string;
  instructions: NewRecipeInstructions[];
  image: File | null;
  genre: number | string;
  cookingTime: number;
  reviews: Review[];
  costEstimate: number;
  summary: string;
  catchphrase: string;
  nutrition: Nutrition;
  faq: { question: string; answer: string }[];
  selectedIngredients: { id: number; quantity: number }[];
  userId?: string;
  isPublic?: boolean;
}

export interface NewRecipeInstructions {
  stepNumber: number;
  description: string;
  image: File | null;
}

export interface NewIngredient {
  name: string;
  imageUrl: File | null;
  genre: Genre | null;
  unit: Unit | null;
}

export interface EditIngredient {
  id: number;
  name: string;
  imageUrl: string | null;
  genreId: number | null;
  genre: Genre | null;
  unit: Unit | null;
  quantity: number;
}

export interface EditRecipe {
  id: number;
  name: string;
  imageFile: File | null;
  instructions: Instruction[];
  ingredients: {
    ingredientId: number;
    quantityRequired: number;
  }[];
  genreId: number;
  cookingTime: number;
  reviews: Review[];
  costEstimate: number;
  summary: string;
  nutrition: Nutrition;
  faq: FAQ[];
}

export interface RecipeResponse {
  message: string;
  recipe: Recipe;
}

export interface UserData {
  id: string;
  email: string;
  username?: string;
  profileImage?: File | null;
  age?: number | "" | null;
  gender?: string | null;
};