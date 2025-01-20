/* eslint-disable */

export async function fetchRecipesAPI(ingredients: { id: number; quantity: number }[]) {
  // 具材が空の場合はリクエストを送信しない
  if (ingredients.length === 0) {
    throw new Error("具材が選択されていません");
  }

  // 送信前にフィールド名を変換
  const transformedIngredients = ingredients.map(({ id, quantity }) => ({
    ingredient_id: id,
    quantity_required: quantity
  }));


  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transformedIngredients),
  });

  console.log("送信前", transformedIngredients);
  

  const responseData = await response.json();
  console.log("取得後", responseData);


  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(responseData)}`);
  }

  // レスポンスデータのフォーマット
  const formattedData = Array.isArray(responseData)
    ? responseData.map((data: any) => ({
      id: data.recipe.id,
      name: data.recipe.name,
      instructions: Array.isArray(data.recipe.instructions)
        ? data.recipe.instructions.map((step: any) => ({
          stepNumber: step.stepNumber,
          description: step.description,
        }))
        : [],
      genre: data.recipe.genre,
      imageUrl: data.recipe.image_url,
      ingredients: Array.isArray(data.ingredients)
        ? data.ingredients.map((ingredient: any) => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: ingredient.quantity
        }))
        : [],
    }))
    : [];

  return formattedData;
}
