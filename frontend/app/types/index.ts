import { UUID } from "crypto";

export interface Genre {
  id: number;
  name: string;
}

export interface Unit {
  id: number;
  name: string;
  abbreviation: string;
}

export interface Ingredient {
  id: number;
  name: string;
  genre: Genre;
  imageUrl: string;
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
  id: UUID;
  name: string;
  imageUrl?: string;
  instructions: Instruction[];
  ingredients: Ingredient[];
  genre: Genre;
  cookingTime: number;
  reviews: number;
  costEstimate: string;
  summary: string;
  catchphrase: string;
  nutrition: Nutrition;
  faq: FAQ[];
  userId?: string;
  public?: boolean;
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
  imageUrl: File;
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
  reviews: number;
  costEstimate: string;
  summary: string;
  nutrition: Nutrition;
  faq: FAQ[];
}

export interface RecipeResponse {
  message: string;
  recipe: Recipe;
}
