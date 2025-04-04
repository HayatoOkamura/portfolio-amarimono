/* eslint-disable */
"use client";

import { useEffect, useState, useCallback } from "react";
import { backendUrl } from "@/app/utils/apiUtils";
import useRecipeStore from "@/app/stores/recipeStore";
import useIngredientStore from "@/app/stores/ingredientStore";
import useGenreStore from "@/app/stores/genreStore";
import { useUserStore } from "@/app/stores/userStore";
import {
  Nutrition,
  Instruction,
  NewRecipe,
  NewRecipeInstructions,
  Recipe,
  Unit,
} from "@/app/types/index";
import CookingTimeSlider from "@/app/components/ui/RegistarSlider/CookingTime/CookingTime";
import CostEstimateSlider from "@/app/components/ui/RegistarSlider/CostEstimate/CostEstimate";
import { useIngredients } from "@/app/hooks/ingredients";
import {
  useAddRecipe,
  useDraftRecipe,
  useUpdateRecipe,
} from "@/app/hooks/recipes";
import styles from "./RegistrationForm.module.scss";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";

// バリデーションメッセージの定数
const VALIDATION_MESSAGES = {
  REQUIRED_FIELDS: "Please fill in all fields.",
  MIN_INSTRUCTIONS: "手順は最低1つ必要です。",
  SUCCESS: "レシピが正常に登録されました。",
  ERROR: "レシピの登録に失敗しました。",
} as const;

// 下書き保存時のバリデーション
const validateDraft = (recipe: any) => {
  // 下書きの場合は最小限のバリデーション
  if (!recipe.name?.trim()) {
    throw new Error("レシピ名は必須です。");
  }
};

// レシピ登録時のバリデーション
const validateRecipe = (recipe: any) => {
  // 下書きの場合は最小限のバリデーション
  if (recipe.isDraft) {
    if (!recipe.name?.trim()) {
      throw new Error("レシピ名は必須です。");
    }
    return;
  }

  // 通常のレシピ登録時のバリデーション
  const requiredFields = [
    { field: recipe.name?.trim(), name: "レシピ名" },
    { field: recipe.summary?.trim(), name: "概要" },
    { field: recipe.catchphrase?.trim(), name: "キャッチフレーズ" },
    { field: recipe.genre !== "すべて", name: "ジャンル" },
    { field: recipe.cookingTime > 0, name: "調理時間" },
    { field: recipe.costEstimate > 0, name: "予算" },
    { field: recipe.instructions?.length > 0, name: "手順" },
    { field: recipe.ingredients?.length > 0, name: "具材" },
    // 画像のバリデーションを修正
    { field: recipe.image || recipe.imageUrl, name: "画像" },
  ];

  const missingFields = requiredFields
    .filter(({ field }) => !field)
    .map(({ name }) => name);

  if (missingFields.length > 0) {
    throw new Error(`${missingFields.join(", ")}を入力してください。`);
  }
};

// FormData作成関数
const createFormData = (
  recipe: NewRecipe,
  userId: string,
  isAdmin: boolean = false
): FormData => {
  const formData = new FormData();
  console.log('Creating FormData with recipe:', recipe);
  console.log('Recipe Image:', recipe.image);
  console.log('Recipe Image URL:', recipe.imageUrl);

  formData.append("name", recipe.name);
  formData.append("genre_id", recipe.genre.id.toString());
  formData.append("cooking_time", recipe.cookingTime.toString());
  formData.append("cost_estimate", recipe.costEstimate.toString());
  formData.append("summary", recipe.summary);
  formData.append("catchphrase", recipe.catchphrase);

  // nutritionの値をJSONとして送信
  formData.append(
    "nutrition",
    JSON.stringify({
      calories: recipe.nutrition.calories,
      carbohydrates: recipe.nutrition.carbohydrates,
      fat: recipe.nutrition.fat,
      protein: recipe.nutrition.protein,
      sugar: recipe.nutrition.sugar,
      salt: recipe.nutrition.salt,
    })
  );

  formData.append("is_public", recipe.isPublic.toString());
  formData.append("user_id", userId);
  formData.append("is_admin", isAdmin.toString());
  formData.append("is_draft", recipe.isDraft.toString());

  // idが存在する場合は追加
  if (recipe.id) {
    formData.append("id", recipe.id);
  }

  // 材料の追加
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    const formattedIngredients = recipe.ingredients.map((ing) => ({
      id: ing.id,
      quantity: ing.quantity,
      unit: {
        id: ing.unitId || 1,
      },
    }));
    formData.append("ingredients", JSON.stringify(formattedIngredients));
  }

  // 手順の追加
  if (recipe.instructions && recipe.instructions.length > 0) {
    formData.append("instructions", JSON.stringify(recipe.instructions));
  }

  // FAQの追加
  if (recipe.faq && recipe.faq.length > 0) {
    formData.append("faq", JSON.stringify(recipe.faq));
  }

  // 画像の追加（新しい画像がある場合のみ）
  if (recipe.image instanceof File) {
    console.log('Adding new image file to FormData');
    formData.append("image", recipe.image);
  } else if (recipe.imageUrl) {
    console.log('Adding existing image URL to FormData:', recipe.imageUrl);
    formData.append("image_url", recipe.imageUrl);
  }

  // 手順画像の追加
  if (recipe.instructions && recipe.instructions.length > 0) {
    recipe.instructions.forEach((instruction, index) => {
      if (instruction.imageURL instanceof File) {
        formData.append(`instruction_images[${index}]`, instruction.imageURL);
      } else if (instruction.imageUrl) {
        // 既存の手順画像URLがある場合はそれを送信
        formData.append(`instruction_image_urls[${index}]`, instruction.imageUrl);
      }
    });
  }

  // デバッグ用：FormDataの内容を確認
  for (const [key, value] of formData.entries()) {
    console.log(`FormData Key: ${key}, Value:`, value);
  }

  return formData;
};

const RecipeRegistration: React.FC<{
  isAdmin?: boolean;
  initialRecipe?: NewRecipe;
}> = ({ isAdmin = false, initialRecipe }) => {
  const { setNewRecipe, newRecipe, resetNewRecipe } = useRecipeStore();
  const { ingredients, setIngredients } = useIngredientStore();
  const [costEstimate] = useState(0);
  const { recipeGenres, fetchRecipeGenres, error } = useGenreStore();
  const { user } = useUserStore();
  const { data: ingredientsData } = useIngredients();
  const addRecipeMutation = useAddRecipe();
  const updateRecipeMutation = useUpdateRecipe();
  const { saveDraft, draftRecipe, isLoading } = useDraftRecipe(user?.id, !!initialRecipe);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [showAutoSaveNotification, setShowAutoSaveNotification] =
    useState(false);
  const router = useRouter();
  const isEditing = !!initialRecipe;

  useEffect(() => {
    console.log("Kスネア", newRecipe.imageUrl);
    
  }, [])

  // 初期レシピデータの設定
  useEffect(() => {
    console.log('Initial recipe data:', {
      initialRecipeImageUrl: initialRecipe?.imageUrl,
      currentNewRecipeImageUrl: newRecipe?.imageUrl,
      currentNewRecipeImage: newRecipe?.image
    });

    if (initialRecipe) {
      // 既存のレシピと異なる場合のみ初期化
      if (!newRecipe || newRecipe.id !== initialRecipe.id) {
        const defaultRecipe: NewRecipe = {
          id: initialRecipe.id,
          name: initialRecipe.name || "",
          genre: initialRecipe.genre || { id: 1, name: "すべて" },
          cookingTime: initialRecipe.cookingTime || 0,
          costEstimate: initialRecipe.costEstimate || 0,
          summary: initialRecipe.summary || "",
          catchphrase: initialRecipe.catchphrase || "",
          nutrition: initialRecipe.nutrition || {
            calories: 0,
            carbohydrates: 0,
            fat: 0,
            protein: 0,
            sugar: 0,
            salt: 0,
          },
          ingredients: initialRecipe.ingredients || [],
          instructions: initialRecipe.instructions || [],
          image: undefined,
          imageUrl: initialRecipe.imageUrl,
          isPublic: initialRecipe.isPublic || false,
          isDraft: initialRecipe.isDraft || false,
        };
        setNewRecipe(defaultRecipe);
      }
    }
  }, [initialRecipe, newRecipe, setNewRecipe]);

  // ローカルストレージに保存
  const saveToLocalStorage = (recipeData: any) => {
    try {
      localStorage.setItem(
        "draftRecipe",
        JSON.stringify({
          recipeData,
          lastModifiedAt: new Date().toISOString(),
        })
      );
      return true;
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
      return false;
    }
  };

  // ローカルストレージから読み込み
  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem("draftRecipe");
      if (savedData) {
        const { recipeData } = JSON.parse(savedData);
        return recipeData;
      }
      return null;
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      return null;
    }
  };

  // 手動保存の処理
  const handleManualSave = async () => {
    if (!newRecipe) {
      console.error("newRecipe is undefined");
      alert("レシピデータが正しく初期化されていません。");
      return;
    }

    setSaveStatus("saving");
    try {
      // 下書き用のバリデーション
      validateDraft(newRecipe);
      console.log("🖐️newRecipe", newRecipe);
      console.log("🍎 Nutrition data:", newRecipe.nutrition);

      if (user?.id) {
        // ログイン済みの場合は下書きとしてレシピを保存
        const formData = createFormData(newRecipe, user.id, isAdmin);
        formData.append("isDraft", "true"); // 下書きフラグを追加

        // formDataの内容を確認するためのログ
        console.log("=== FormData Contents ===");
        console.log("isEditing:", isEditing);
        console.log("initialRecipe:", initialRecipe);
        console.log("initialRecipe?.id:", initialRecipe?.id);
        console.log("newRecipe:", newRecipe);
        console.log("newRecipe.id:", newRecipe.id);
        console.log("Nutrition data in formData:", formData.get("nutrition"));

        // formDataの各フィールドの値を確認
        for (const [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }
        console.log("=====================");

        if (isEditing && newRecipe.id) {
          // 編集時は更新処理を実行
          console.log("Updating recipe with ID:", newRecipe.id);
          formData.append("id", newRecipe.id); // idを明示的に追加
          await updateRecipeMutation.mutateAsync({
            id: newRecipe.id,
            formData,
          });
        } else {
          // 新規作成時は追加処理を実行
          console.log("Creating new recipe");
          await addRecipeMutation.mutateAsync({
            formData,
            userId: user.id,
            isPublic: false, // 下書きは非公開
            isDraft: true, // 下書きフラグを追加
          });
        }

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        alert("下書きとして保存しました");
      } else {
        // 未ログインの場合はローカルストレージに保存
        saveToLocalStorage(newRecipe);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        alert("下書きとして保存しました（ローカルストレージ）");
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      alert(
        error instanceof Error ? error.message : "下書きの保存に失敗しました"
      );
      setSaveStatus("idle");
    }
  };

  // 下書きの自動保存
  const debouncedSaveDraft = useCallback(
    debounce((recipeData) => {
      if (user?.id) {
        saveDraft(recipeData);
      } else {
        saveToLocalStorage(recipeData);
      }
      // 自動保存時の通知を表示
      setShowAutoSaveNotification(true);
      setTimeout(() => setShowAutoSaveNotification(false), 2000);
    }, 2000),
    [user?.id, saveDraft]
  );

  // レシピデータが変更されたら下書きを保存
  useEffect(() => {
    console.log('Auto-save check:', {
      isEditing,
      hasNewRecipe: !!newRecipe,
      recipeId: newRecipe?.id,
      initialRecipeId: initialRecipe?.id,
      name: newRecipe.name
    });

    // 編集時は自動保存を行わない
    if (isEditing) {
      console.log('Skipping auto-save: Editing mode');
      return;
    }

    // 新規作成時のみ自動保存
    if (!isEditing && newRecipe) {
      console.log('Proceeding with auto-save for new recipe');
      debouncedSaveDraft(newRecipe);
    }
  }, [newRecipe, debouncedSaveDraft, isEditing, initialRecipe]);

  // レシピデータの更新処理を修正
  const updateRecipeState = useCallback((updates: Partial<NewRecipe>) => {
    if (isEditing) {
      // 編集時は直接状態を更新
      setNewRecipe(updates);
    } else {
      // 新規作成時は自動保存を考慮して更新
      setNewRecipe(updates);
    }
  }, [isEditing, setNewRecipe]);

  // 画像アップロードの処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('Selected Image File:', file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      console.log('Generated Preview URL:', previewUrl);
      updateRecipeState({
        image: file,
        imageUrl: previewUrl,
      });
    }
  };

  // レシピ名の更新処理
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRecipeState({ name: e.target.value });
  };

  // その他の更新処理も同様に修正
  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateRecipeState({
      genre: {
        id: e.target.value === "すべて" ? 1 : Number(e.target.value),
        name: e.target.value === "すべて" ? "すべて" : recipeGenres.find((g) => g.id === Number(e.target.value))?.name || "すべて",
      },
    });
  };

  // 下書きの読み込み
  useEffect(() => {
    console.log('Draft load check:', {
      isEditing,
      hasDraftRecipe: !!draftRecipe?.recipeData,
      isLoading,
      userId: user?.id
    });

    // 編集時は下書きを読み込まない
    if (isEditing) {
      console.log('Skipping draft load: Editing mode');
      return;
    }

    if (user?.id && draftRecipe?.recipeData && !isLoading) {
      console.log('Loading draft from server');
      setNewRecipe(draftRecipe.recipeData);
    } else if (!user?.id) {
      console.log('Loading draft from localStorage');
      const localData = loadFromLocalStorage();
      if (localData) {
        setNewRecipe(localData);
      }
    }
  }, [draftRecipe, isLoading, setNewRecipe, user?.id, isEditing]);

  useEffect(() => {
    if (ingredientsData) {
      setIngredients(ingredientsData);
    }
    fetchRecipeGenres();
  }, [ingredientsData, setIngredients, fetchRecipeGenres]);

  const handleAddRecipe = async () => {
    try {
      // レシピ登録用の完全なバリデーション
      validateRecipe(newRecipe);

      // isDraftを明示的にfalseに設定
      const recipeToSubmit = {
        ...newRecipe,
        isDraft: false
      };

      // FormDataの作成
      const formData = createFormData(recipeToSubmit, user?.id, isAdmin);
      console.log("⚡️⚡️⚡️", recipeToSubmit);
      
      // formDataの内容を確認
      console.log("=== FormData Contents Before Setting is_draft ===");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      console.log("=============================================");

      if (isEditing && newRecipe.id) {
        // 編集時は更新処理を実行
        await updateRecipeMutation.mutateAsync({
          id: newRecipe.id,
          formData,
        });
      } else {
        // 新規作成時は追加処理を実行
        await addRecipeMutation.mutateAsync({
          formData,
          userId: user?.id,
          isPublic: newRecipe.isPublic,
        });
      }

      // 成功時の処理
      resetNewRecipe();
      alert(VALIDATION_MESSAGES.SUCCESS);

      // 管理者ページの場合は/admin/recipesに遷移
      if (isAdmin) {
        router.push("/admin/recipes");
      }
    } catch (error) {
      console.error(VALIDATION_MESSAGES.ERROR, error);
      alert(error instanceof Error ? error.message : VALIDATION_MESSAGES.ERROR);
    }
  };

  const handleDeleteInstruction = (index: number) => {
    if (newRecipe.instructions.length === 1) {
      alert("手順は最低1つ必要です。");
      return;
    }

    setNewRecipe({
      ...newRecipe,
      instructions: newRecipe.instructions
        .filter((_, i) => i !== index)
        .map((step, i) => ({
          step: i + 1,
          description: step.description,
          imageURL: step.imageURL,
        })),
    });
  };

  // コンポーネントのアンマウント時にURLを解放
  useEffect(() => {
    return () => {
      if (newRecipe.imageUrl && newRecipe.imageUrl.startsWith('blob:')) {
        console.log('Revoking Blob URL:', newRecipe.imageUrl);
        URL.revokeObjectURL(newRecipe.imageUrl);
      }
    };
  }, [newRecipe.imageUrl]);

  // 編集モードから離れる時に初期状態を復元
  useEffect(() => {
    return () => {
      if (isEditing && initialRecipe) {
        console.log('Restoring initial recipe state on unmount');
        setNewRecipe({
          ...initialRecipe,
          image: undefined, // 画像ファイルはリセット
          imageUrl: initialRecipe.imageUrl, // 元の画像URLは保持
        });
      }
    };
  }, [isEditing, initialRecipe, setNewRecipe]);

  // レシピデータの変更を監視
  useEffect(() => {
    console.log('Recipe data changed:', {
      imageUrl: newRecipe.imageUrl,
      hasImage: !!newRecipe.image,
      isBlobUrl: newRecipe.imageUrl?.startsWith('blob:')
    });
  }, [newRecipe.imageUrl, newRecipe.image]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6 max-w-lg mx-auto">
      {/* 下書き保存状態の表示 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {isLoading ? "下書きを読み込み中..." : "下書きは自動保存されます"}
        </div>
        <div className="flex items-center gap-2">
          {showAutoSaveNotification && (
            <span className="text-sm text-green-500 animate-fade-in-out">
              保存しました
            </span>
          )}
          <button
            onClick={handleManualSave}
            disabled={saveStatus === "saving"}
            className={`px-4 py-2 rounded ${
              saveStatus === "saving"
                ? "bg-gray-400 cursor-not-allowed"
                : saveStatus === "saved"
                ? "bg-green-500 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {saveStatus === "saving"
              ? "保存中..."
              : saveStatus === "saved"
              ? "保存完了"
              : "下書きを保存"}
          </button>
        </div>
      </div>

      <div className={styles.detail_block}>
        {/* 画像アップロード */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            レシピ画像
          </label>
          <div className="relative">
            {newRecipe.imageUrl ? (
              <div className="relative group">
                <img
                  src={newRecipe.image ? newRecipe.imageUrl : `${backendUrl}/uploads/${newRecipe.imageUrl}`}
                  alt="Current recipe"
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    console.error('Image load error:', {
                      src: e.currentTarget.src,
                      imageUrl: newRecipe.imageUrl,
                      hasImage: !!newRecipe.image
                    });
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    画像を変更
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                      <span>画像をアップロード</span>
                    </label>
                    <p className="pl-1">またはドラッグ＆ドロップ</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* 手順追加 */}
        {newRecipe.instructions.map((instruction, index) => (
          <div key={index} className="flex items-center gap-2">
            <textarea
              placeholder={`Step ${instruction.step}`}
              value={instruction.description}
              onChange={(e) =>
                setNewRecipe({
                  ...newRecipe,
                  instructions: newRecipe.instructions.map((step, i) =>
                    i === index
                      ? { ...step, description: e.target.value }
                      : step
                  ),
                })
              }
              className="border p-2 mb-2 w-full rounded text-gray-700"
            ></textarea>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setNewRecipe({
                  ...newRecipe,
                  instructions: newRecipe.instructions.map((step, i) =>
                    i === index
                      ? {
                          ...step,
                          imageURL: e.target.files
                            ? URL.createObjectURL(e.target.files[0])
                            : undefined,
                        }
                      : step
                  ),
                })
              }
              className="border p-2 mb-2 w-full rounded"
            />
            <button
              onClick={() => handleDeleteInstruction(index)}
              className="bg-red-500 text-white px-2 py-1 rounded"
            >
              削除
            </button>
          </div>
        ))}
      </div>
      <div className={styles.btn_block}>
        {/* レシピ追加/更新ボタン */}
        <button
          onClick={handleAddRecipe}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          {isEditing ? "Update Recipe" : "Add Recipe"}
        </button>
      </div>
      <div className={styles.form_block}></div>
      <div className={styles.ingredient_block}></div>

      {/* 公開・非公開ボタン (管理者ページでは非表示) */}
      {!isAdmin && (
        <div className="mb-4">
          <button
            onClick={() =>
              setNewRecipe({ ...newRecipe, isPublic: !newRecipe.isPublic })
            }
            className={`px-4 py-2 rounded w-full ${
              newRecipe.isPublic
                ? "bg-green-500 text-white"
                : "bg-gray-400 text-black"
            }`}
          >
            {newRecipe.isPublic ? "公開中" : "非公開"}
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Recipe Name"
        value={newRecipe.name}
        onChange={handleNameChange}
        className="border p-2 mb-2 w-full rounded text-gray-700"
      />

      <select
        value={newRecipe.genre.id.toString()}
        onChange={handleGenreChange}
        className="border p-2 mb-2 w-full rounded text-gray-700"
      >
        <option value="すべて">Select Genre</option>
        {recipeGenres.length > 0 &&
          recipeGenres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
      </select>

      <button
        onClick={() =>
          setNewRecipe({
            ...newRecipe,
            instructions: [
              ...newRecipe.instructions,
              {
                step: newRecipe.instructions.length + 1,
                description: "",
                imageURL: undefined,
              },
            ],
          })
        }
        className="bg-green-500 text-white px-4 py-2 rounded w-full mb-2"
      >
        Add Step
      </button>
      <h3>CookingTime</h3>
      <CookingTimeSlider
        cookingTime={newRecipe.cookingTime}
        setCookingTime={(time) =>
          setNewRecipe({ ...newRecipe, cookingTime: time })
        }
      />
      <h2>レシピ登録</h2>
      <CostEstimateSlider
        costEstimate={newRecipe.costEstimate}
        setCostEstimate={(estimate) => {
          setNewRecipe({ ...newRecipe, costEstimate: estimate });
        }}
      />
      <p>
        選択された予算:{" "}
        {costEstimate ? `${costEstimate.toLocaleString()}円以内` : "未選択"}
      </p>

      <textarea
        placeholder="Recipe Summary"
        value={newRecipe.summary}
        onChange={(e) =>
          setNewRecipe({
            ...newRecipe,
            summary: e.target.value,
          })
        }
        className="border p-2 mb-2 w-full rounded text-gray-700"
      />

      <textarea
        placeholder="Recipe Catchphrase"
        value={newRecipe.catchphrase}
        onChange={(e) =>
          setNewRecipe({ ...newRecipe, catchphrase: e.target.value })
        }
        className="border p-2 mb-2 w-full rounded text-gray-700"
      />

      <div>
        <h3>Nutrition</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">栄養素</th>
              <th className="border p-2">値 (g, mg, kcal)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(newRecipe.nutrition).map((key) => (
              <tr key={key}>
                <td className="border p-2">{key}</td>
                <td className="border p-2">
                  <input
                    type="number"
                    placeholder={key}
                    value={newRecipe.nutrition[key as keyof Nutrition]}
                    onChange={(e) =>
                      setNewRecipe({
                        ...newRecipe,
                        nutrition: {
                          ...newRecipe.nutrition,
                          [key]: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2 border rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold mb-2">Select Ingredients</h3>
      <ul className="mb-4">
        {Array.isArray(ingredients) &&
          ingredients.map((ingredient) => {
            const step = ingredient.unit?.step;
            const quantity =
              newRecipe.ingredients.find(
                (selected) => selected.id === ingredient.id
              )?.quantity || 0;

            return (
              <li key={ingredient.id} className="flex items-center mb-2">
                <span className="mr-2 font-medium">{ingredient.name}</span>
                <button
                  onClick={() => {
                    const updatedIngredients = newRecipe.ingredients.some(
                      (item) => item.id === ingredient.id
                    )
                      ? newRecipe.ingredients.map((item) =>
                          item.id === ingredient.id
                            ? { ...item, quantity: item.quantity + step }
                            : item
                        )
                      : [
                          ...newRecipe.ingredients,
                          {
                            id: ingredient.id,
                            quantity: step,
                            unitId: ingredient.unit.id,
                          },
                        ];

                    setNewRecipe({
                      ...newRecipe,
                      ingredients: updatedIngredients,
                    });
                  }}
                  className="bg-green-500 text-white px-2 py-1 rounded ml-2"
                >
                  増加
                </button>
                <span className="mx-4">{quantity}</span>
                <button
                  onClick={() => {
                    const updatedIngredients = newRecipe.ingredients.map(
                      (item) =>
                        item.id === ingredient.id
                          ? {
                              ...item,
                              quantity: Math.max(0, item.quantity - step),
                            }
                          : item
                    );

                    setNewRecipe({
                      ...newRecipe,
                      ingredients: updatedIngredients,
                    });
                  }}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  減少
                </button>
                <span className="ml-2">{ingredient.unit.name}</span>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default RecipeRegistration;
