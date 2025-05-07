const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;
const USDA_API_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

const searchUSDAFood = async (query: string): Promise<number | null> => {
  if (!USDA_API_KEY) {
    throw new Error("USDA API key is not configured");
  }

  try {
    console.log("Searching USDA food database for:", query);
    const response = await fetch(
      `${USDA_API_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=1`
    );

    if (!response.ok) {
      throw new Error(`USDA API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("USDA search response:", data);

    if (data.foods && data.foods.length > 0) {
      return data.foods[0].fdcId;
    }

    return null;
  } catch (error) {
    console.error("Error searching USDA food:", error);
    throw error;
  }
};

const getNutritionData = async (fdcId: number) => {
  if (!USDA_API_KEY) {
    throw new Error("USDA API key is not configured");
  }

  try {
    console.log("Fetching nutrition data for FDC ID:", fdcId);
    const response = await fetch(
      `${USDA_API_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`USDA API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("USDA nutrition data response:", data);

    if (!data.foodNutrients) {
      throw new Error("No nutrition data found");
    }

    const nutritionData = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
      sugar: 0,
      salt: 0
    };

    data.foodNutrients.forEach((nutrient: any) => {
      const nutrientId = nutrient.nutrient.id;
      const amount = nutrient.amount;

      switch (nutrientId) {
        case 1008: // Energy (kcal)
          nutritionData.calories = Math.round(amount);
          break;
        case 1003: // Protein (g)
          nutritionData.protein = Math.round(amount * 10) / 10;
          break;
        case 1004: // Total lipid (fat) (g)
          nutritionData.fat = Math.round(amount * 10) / 10;
          break;
        case 1005: // Carbohydrate, by difference (g)
          nutritionData.carbohydrates = Math.round(amount * 10) / 10;
          break;
        case 2000: // Sugars, Total (g)
          nutritionData.sugar = Math.round(amount * 10) / 10;
          break;
        case 1093: // Sodium, Na (mg)
          // Convert sodium to salt (Na × 2.54 = NaCl)
          nutritionData.salt = Math.round(amount * 2.54 * 10) / 1000;
          break;
      }
    });

    console.log("Processed nutrition data:", nutritionData);
    return nutritionData;
  } catch (error) {
    console.error("Error fetching nutrition data:", error);
    throw error;
  }
};

export default {
  searchUSDAFood,
  getNutritionData
};