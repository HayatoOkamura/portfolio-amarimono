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
  type: 'presence' | 'quantity';
}

export interface Ingredient {
  id: number;
  name: string;
  genre: Genre;
  imageUrl: string | null;
  quantity: number;
  unit: Unit;
  nutrition: Nutrition;
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
  nutritionPercentage?: {
    calories: number;
    carbohydrates: number;
    fat: number;
    protein: number;
    salt: number;
  } | null;
  isPublic?: boolean;
  isDraft?: boolean;
}

export interface NewRecipe {
  id?: string;
  name: string;
  cookingTime: number;
  costEstimate: number;
  summary: string;
  catchphrase: string;
  genre: { id: number; name: string };
  nutrition: {
    calories: number;
    carbohydrates: number;
    fat: number;
    protein: number;
    salt: number;
  };
  ingredients: {
    id: number;
    quantity: number;
    unitId: number;
  }[];
  instructions: {
    step: number;
    description: string;
    imageURL?: string | File;
    imageUrl?: string;
  }[];
  image?: File;
  imageUrl?: string;
  isPublic: boolean;
  isDraft: boolean;
  faq?: { question: string; answer: string }[];
}

export interface NewRecipeInstructions {
  step: number;
  description: string;
  imageURL?: string;
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
  genre: {
    id: number;
    name: string;
  };
  unit: {
    id: number;
    name: string;
    description: string;
    step: number;
  };
  imageUrl: string | File | null;
  quantity: number;
  nutrition: {
    calories: number;
    carbohydrates: number;
    fat: number;
    protein: number;
    salt: number;
  };
}

export interface EditRecipe {
  id: number;
  name: string;
  imageFile: File | null;
  instructions: Instruction[];
  ingredients: {
    ingredientId: number;
    quantity_required: number;
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