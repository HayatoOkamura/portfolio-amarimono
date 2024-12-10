export interface Ingredient {
  id: number;
  name: string;
  quantity?: number;
}

export interface Recipe {
  id: number;
  name: string;
  instructions: string;
  quantity?: number;
}

/**
 * Fetch recipes based on the selected ingredients.
 *
 * @param ingredients - List of selected ingredients with their quantities
 * @returns A promise resolving to a list of recipes
 * @throws Error if the request fails or the server responds with an error
 */
export async function fetchRecipes(ingredients: Ingredient[]): Promise<Recipe[]> {
  try {
    const response = await fetch("/api/recipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ingredients),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data: Recipe[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }
}
