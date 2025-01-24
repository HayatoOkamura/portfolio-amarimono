export interface Genre {
  id: number;
  name: string;
}

export interface Ingredient {
  id: number;
  name: string;
  genre: Genre;
  imageUrl: string;
  quantity: number;
}

export interface Instruction {
  stepNumber: number;
  description: string;
}

export interface Recipe {
  id: number;
  name: string;
  imageUrl?: string;
  instructions: Instruction[];
  ingredients: {
    id: number;
    quantity: number;
  }[];
  genre: Genre;
}
