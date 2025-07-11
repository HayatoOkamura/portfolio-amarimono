import { RecipeFormData } from "@/app/components/features/RecipeForm/types/recipeForm";

// 画像URLを正規化する関数
const normalizeImageUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  
  // SupabaseのURLから相対パスを抽出
  if (url.startsWith('http')) {
    const match = url.match(/\/storage\/v1\/object\/public\/images\/(.+)/);
    return match ? match[1] : url;
  }
  
  // 相対パスのみを返す
  return url.replace(/^\/uploads\//, '');
};

export const createFormData = (
  recipe: RecipeFormData,
  userId: string | undefined,
  isAdmin: boolean = false,
  isAutoSave: boolean = false
): FormData => {
  const formData = new FormData();

  // 基本情報の追加
  formData.append("nutrition", JSON.stringify(recipe.nutrition));
  formData.append("name", recipe.name);
  formData.append("genre_id", recipe.genre.id.toString());
  formData.append("cooking_time", recipe.cookingTime.toString());
  formData.append("cost_estimate", recipe.costEstimate.toString());
  formData.append("summary", recipe.summary || "");
  formData.append("catchphrase", recipe.catchphrase || "");

  // FAQデータの追加
  if (recipe.faq && recipe.faq.length > 0) {
    formData.append("faq", JSON.stringify(recipe.faq));
  }

  // 手順の処理
  const formattedInstructions = recipe.instructions.map((instruction, index) => {
    const instructionData = {
      stepNumber: index + 1,
      description: instruction.description,
      image_url: instruction.imageURL instanceof File ? null : normalizeImageUrl(instruction.imageURL)
    };

    if (instruction.imageURL instanceof File) {
      formData.append(`instruction_image_${index}`, instruction.imageURL);
    }

    return instructionData;
  });

  formData.append("instructions", JSON.stringify(formattedInstructions));

  // メイン画像の処理
  if (recipe.image instanceof File) {
    formData.append("image", recipe.image);
  } else if (recipe.imageUrl) {
    formData.append("image_url", normalizeImageUrl(recipe.imageUrl) || "");
  }

  // 具材の処理
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    const formattedIngredients = recipe.ingredients.map(ing => ({
      ingredient_id: ing.id,
      quantity_required: ing.quantity,
      unit_id: ing.unitId
    }));
    formData.append("ingredients", JSON.stringify(formattedIngredients));
  } else {
    console.warn('No ingredients provided');
    formData.append("ingredients", JSON.stringify([]));
  }

  // ユーザー情報の追加
  if (userId) {
    formData.append("user_id", userId);
  }

  formData.append("is_public", recipe.isPublic.toString());
  formData.append("is_draft", recipe.isDraft.toString());

  return formData;
}; 