/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import useRecipeStore from "@/app/stores/recipeStore";
import useIngredientStore from "@/app/stores/ingredientStore";
import useGenreStore from "@/app/stores/genreStore";
import { useUserStore } from "@/app/stores/userStore";
import { Nutrition } from "@/app/types";
import CookingTimeSlider from "@/app/components/ui/RegistarSlider/CookingTime/CookingTime";
import CostEstimateSlider from "@/app/components/ui/RegistarSlider/CostEstimate/CostEstimate";

const RecipeRegistration: React.FC<{ isAdmin?: boolean }> = ({
  isAdmin = false,
}) => {
  const { fetchRecipes, addRecipe, setNewRecipe, newRecipe, resetNewRecipe } =
    useRecipeStore();
  const { ingredients, fetchIngredients } = useIngredientStore();
  const [costEstimate] = useState(0);
  const { recipeGenres, fetchRecipeGenres, error } = useGenreStore();
  const { user } = useUserStore();

  useEffect(() => {
    fetchRecipes();
    fetchIngredients();
    fetchRecipeGenres();
  }, [fetchRecipes, fetchIngredients, fetchRecipeGenres]);
  
  const handleAddRecipe = async () => {
    console.log(newRecipe);
    if (
      !newRecipe.name ||
      !newRecipe.instructions ||
      !newRecipe.image ||
      newRecipe.selectedIngredients.length === 0 ||
      newRecipe.genre === "すべて" ||
      !newRecipe.cookingTime ||
      !newRecipe.costEstimate ||
      !newRecipe.summary ||
      !newRecipe.catchphrase ||
      !newRecipe.nutrition ||
      !newRecipe.faq
    ) {
      alert("Please fill in all fields.");
      return;
    }

    // FormData の作成
    const formData = new FormData();
    formData.append("name", newRecipe.name);
    formData.append("cookingTime", newRecipe.cookingTime.toString());
    formData.append("genre", newRecipe.genre.toString());
    formData.append("costEstimate", newRecipe.costEstimate.toString());
    formData.append("summary", newRecipe.summary);
    formData.append("catchphrase", newRecipe.catchphrase);
    formData.append("nutrition", JSON.stringify(newRecipe.nutrition));
    formData.append("faq", JSON.stringify(newRecipe.faq));
    formData.append("instructions", JSON.stringify(newRecipe.instructions));
    formData.append(
      "ingredients",
      JSON.stringify(newRecipe.selectedIngredients)
    );
    formData.append("image", newRecipe.image);
    formData.append("isPublic", newRecipe.isPublic?.toString() || "false");

    newRecipe.instructions.forEach((step, index) => {
      formData.append(`instruction_image_${index}`, step.image as File);
    });

    // isAdmin が false の場合、userId を追加
    if (!isAdmin && user?.id) {
      formData.append("userId", user.id);
    }

    // FormData の中身を確認
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    await addRecipe(formData);

    resetNewRecipe();
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
          ...step,
          stepNumber: i + 1, // 削除後に stepNumber を再設定
        })),
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6 max-w-lg mx-auto">
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
        onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
        className="border p-2 mb-2 w-full rounded text-gray-700"
      />

      {newRecipe.instructions.map((instruction, index) => (
        <div key={index} className="flex items-center gap-2">
          <textarea
            placeholder={`Step ${instruction.stepNumber}`}
            value={instruction.description}
            onChange={(e) =>
              setNewRecipe({
                ...newRecipe,
                instructions: newRecipe.instructions.map((step, i) =>
                  i === index ? { ...step, description: e.target.value } : step
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
                        image: e.target.files ? e.target.files[0] : null,
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

      <select
        value={newRecipe.genre}
        onChange={(e) =>
          setNewRecipe({
            ...newRecipe,
            genre:
              e.target.value === "すべて" ? "すべて" : Number(e.target.value),
          })
        }
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
                stepNumber: newRecipe.instructions.length + 1,
                description: "",
                image: null,
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
      {/* <button onClick={() => console.log("送信する値:", cookingTime)}>送信</button> */}
      <h2>レシピ登録</h2>
      <CostEstimateSlider
        costEstimate={newRecipe.costEstimate}
        setCostEstimate={(estimate) => {
          setNewRecipe({ ...newRecipe, costEstimate: estimate })
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
        {Object.keys(newRecipe.nutrition).map((key) => (
          <input
            key={key}
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
          />
        ))}
      </div>
      <div>
        <h3>FAQ</h3>
        {newRecipe.faq.map((faq, index) => (
          <div key={index}>
            <input
              type="text"
              placeholder="Question"
              value={faq.question}
              onChange={(e) => {
                setNewRecipe({
                  ...newRecipe,
                  faq: newRecipe.faq.map((item, i) =>
                    i === index ? { ...item, question: e.target.value } : item
                  ),
                });
              }}
            />
            <input
              type="text"
              placeholder="Answer"
              value={faq.answer}
              onChange={(e) => {
                setNewRecipe({
                  ...newRecipe,
                  faq: newRecipe.faq.map((item, i) =>
                    i === index ? { ...item, answer: e.target.value } : item
                  ),
                });
              }}
            />
          </div>
        ))}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files ? e.target.files[0] : null;
          setNewRecipe({
            ...newRecipe,
            image: file, // 画像を newRecipe.image にセット
          });
        }}
        className="border p-2 mb-2 w-full rounded"
      />

      <h3 className="text-lg font-semibold mb-2">Select Ingredients</h3>
      <ul className="mb-4">
        {Array.isArray(ingredients) &&
          ingredients.map((ingredient) => {
            const step = ingredient.unit?.step;
            const quantity =
              newRecipe.selectedIngredients.find(
                (selected) => selected.id === ingredient.id
              )?.quantity || 0;

            return (
              <li key={ingredient.id} className="flex items-center mb-2">
                <span className="mr-2 font-medium">{ingredient.name}</span>
                <button
                  onClick={() => {
                    const updatedIngredients =
                      newRecipe.selectedIngredients.some(
                        (item) => item.id === ingredient.id
                      )
                        ? newRecipe.selectedIngredients.map((item) =>
                            item.id === ingredient.id
                              ? { ...item, quantity: item.quantity + step }
                              : item
                          )
                        : [
                            ...newRecipe.selectedIngredients,
                            {
                              id: ingredient.id,
                              quantity: step,
                              unit: ingredient.unit,
                            },
                          ];

                    setNewRecipe({ selectedIngredients: updatedIngredients });
                  }}
                  className="bg-green-500 text-white px-2 py-1 rounded ml-2"
                >
                  増加
                </button>
                <span className="mx-4">{quantity}</span>
                <button
                  onClick={() => {
                    const updatedIngredients =
                      newRecipe.selectedIngredients.map((item) =>
                        item.id === ingredient.id
                          ? {
                              ...item,
                              quantity: Math.max(0, item.quantity - step),
                            }
                          : item
                      );

                    setNewRecipe({ selectedIngredients: updatedIngredients });
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

      <button
        onClick={handleAddRecipe}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
      >
        Add Recipe
      </button>
    </div>
  );
};

export default RecipeRegistration;
