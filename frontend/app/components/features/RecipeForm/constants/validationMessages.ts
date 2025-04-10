export const VALIDATION_MESSAGES = {
  REQUIRED_FIELDS: "Please fill in all fields.",
  MIN_INSTRUCTIONS: "手順は最低1つ必要です。",
  SUCCESS: "レシピが正常に登録されました。",
  ERROR: "レシピの登録に失敗しました。",
  DRAFT_SAVED: "下書きとして保存しました",
  DRAFT_SAVED_LOCAL: "下書きとして保存しました（ローカルストレージ）",
  DRAFT_SAVE_ERROR: "下書きの保存に失敗しました",
} as const;

export const validateDraft = (recipe: any) => {
  if (!recipe.name?.trim()) {
    throw new Error("レシピ名は必須です。");
  }
  return true;
};

export const validateRecipe = (recipe: any) => {
  if (recipe.isDraft) {
    if (!recipe.name?.trim()) {
      throw new Error("レシピ名は必須です。");
    }
    return;
  }

  const requiredFields = [
    { field: recipe.name?.trim(), name: "レシピ名" },
    { field: recipe.summary?.trim(), name: "概要" },
    { field: recipe.catchphrase?.trim(), name: "キャッチフレーズ" },
    { field: recipe.genre !== "すべて", name: "ジャンル" },
    { field: recipe.cookingTime > 0, name: "調理時間" },
    { field: recipe.costEstimate > 0, name: "予算" },
    { field: recipe.instructions?.length > 0, name: "手順" },
    { field: recipe.ingredients?.length > 0, name: "具材" },
    { field: recipe.image || recipe.imageUrl, name: "画像" },
  ];

  const missingFields = requiredFields
    .filter(({ field }) => !field)
    .map(({ name }) => name);

  if (missingFields.length > 0) {
    throw new Error(`${missingFields.join(", ")}を入力してください。`);
  }
}; 