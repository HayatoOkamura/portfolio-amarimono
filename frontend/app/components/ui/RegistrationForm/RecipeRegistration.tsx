/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import useRecipeStore from "@/app/stores/recipeStore";
import useIngredientStore from "@/app/stores/ingredientStore";
import useGenreStore from "@/app/stores/genreStore";
import useUnitStep from "@/app/hooks/useUnitStep";
import {
  Instruction,
  Nutrition,
  FAQ,
  NewRecipeInstructions,
} from "@/app/types";

const RecipeRegistration: React.FC = () => {
  const { fetchRecipes, addRecipe } = useRecipeStore();
  const { ingredients, fetchIngredients } = useIngredientStore();
  const { recipeGenres, fetchRecipeGenres, error } = useGenreStore();
  const getUnitStep = useUnitStep();

  // 初期状態
  const initialNutrition: Nutrition = {
    calories: 0,
    carbohydrates: 0,
    fat: 0,
    protein: 0,
    sugar: 0,
    salt: 0,
  };

  const initialInstructions: NewRecipeInstructions[] = [
    { stepNumber: 1, description: "", image: null },
  ];

  // 追加時のState
  const [newRecipeName, setNewRecipeName] = useState("");
  const [newRecipeInstructions, setNewRecipeInstructions] = useState<
    NewRecipeInstructions[]
  >([{ stepNumber: 1, description: "", image: null }]);
  const [newRecipeImage, setNewRecipeImage] = useState<File | null>(null);
  const [newRecipeGenre, setNewRecipeGenre] = useState<number | string>(
    "すべて"
  );
  const [newRecipeCookingTime, setNewRecipeCookingTime] = useState<number>(0);
  const [newRecipeReviews, setNewRecipeReviews] = useState<number>(0);
  const [newRecipeCostEstimate, setNewRecipeCostEstimate] =
    useState<string>("");
  const [newRecipeSummary, setNewRecipeSummary] = useState<string>("");
  const [newRecipeCatchphrase, setNewRecipeCatchphrase] = useState<string>("");
  const [newRecipeNutrition, setNewRecipeNutrition] = useState<Nutrition>({
    calories: 0,
    carbohydrates: 0,
    fat: 0,
    protein: 0,
    sugar: 0,
    salt: 0,
  });
  const [newRecipeFAQ, setNewRecipeFAQ] = useState([
    { question: "", answer: "" },
  ]);
  const [selectedIngredients, setSelectedIngredients] = useState<
    { id: number; quantity: number }[]
  >([]);

  useEffect(() => {
    fetchRecipes();
    fetchIngredients();
    fetchRecipeGenres();
  }, [fetchRecipes, fetchIngredients, fetchRecipeGenres]);

  const resetForm = () => {
    setNewRecipeName("");
    setNewRecipeInstructions(initialInstructions);
    setNewRecipeImage(null);
    setNewRecipeGenre("すべて");
    setNewRecipeCookingTime(0);
    setNewRecipeReviews(0);
    setNewRecipeCostEstimate("");
    setNewRecipeSummary("");
    setNewRecipeNutrition(initialNutrition);
    setNewRecipeFAQ([{ question: "", answer: "" }]);
    setSelectedIngredients([]);
  };

  const handleAddRecipe = async () => {
    if (
      !newRecipeName ||
      !newRecipeInstructions ||
      !newRecipeImage ||
      selectedIngredients.length === 0 ||
      newRecipeGenre === "すべて" ||
      !newRecipeCookingTime ||
      !newRecipeReviews ||
      !newRecipeCostEstimate ||
      !newRecipeSummary ||
      !newRecipeCatchphrase ||
      !newRecipeNutrition ||
      !newRecipeFAQ
    ) {
      alert("Please fill in all fields.");
      return;
    }

    // FormData の作成
    const formData = new FormData();
    formData.append("name", newRecipeName);
    formData.append("cookingTime", newRecipeCookingTime.toString());
    formData.append("reviews", newRecipeReviews.toString());
    formData.append("genre", newRecipeGenre.toString());
    formData.append("costEstimate", newRecipeCostEstimate);
    formData.append("summary", newRecipeSummary);
    formData.append("catchphrase", newRecipeCatchphrase);
    formData.append("nutrition", JSON.stringify(newRecipeNutrition));
    formData.append("faq", JSON.stringify(newRecipeFAQ));
    formData.append("instructions", JSON.stringify(newRecipeInstructions));
    formData.append("ingredients", JSON.stringify(selectedIngredients));
    formData.append("image", newRecipeImage);

    newRecipeInstructions.forEach((step, index) => {
      formData.append("instructions", JSON.stringify(newRecipeInstructions));
      formData.append(`instruction_image_${index}`, step.image as File);
    });

    // FormData の中身を確認
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    await addRecipe(formData);

    // フォームリセット
    resetForm();
  };

  const handleInstructionChange = (
    index: number,
    description: string,
    image: File | null
  ) => {
    setNewRecipeInstructions((prev) => {
      const updatedInstructions = [...prev];
      updatedInstructions[index].description = description;
      updatedInstructions[index].image = image;
      return updatedInstructions;
    });
  };

  const addInstructionStep = () => {
    setNewRecipeInstructions((prev) => [
      ...prev,
      { stepNumber: prev.length + 1, description: "", image: null },
    ]);
  };

  const handleDeleteInstruction = (index: number) => {
    setNewRecipeInstructions((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((step, i) => ({
          ...step,
          stepNumber: i + 1, // 削除後に stepNumber を再設定
        }))
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6 max-w-lg mx-auto">
      <input
        type="text"
        placeholder="Recipe Name"
        value={newRecipeName}
        onChange={(e) => setNewRecipeName(e.target.value)}
        className="border p-2 mb-2 w-full rounded text-gray-700"
      />

      {newRecipeInstructions.map((instruction, index) => (
        <div key={index} className="flex items-center gap-2">
          <textarea
            placeholder={`Step ${instruction.stepNumber}`}
            value={instruction.description}
            onChange={(e) =>
              handleInstructionChange(index, e.target.value, instruction.image)
            }
            className="border p-2 mb-2 w-full rounded text-gray-700"
          ></textarea>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleInstructionChange(
                index,
                instruction.description,
                e.target.files ? e.target.files[0] : null
              )
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
        value={newRecipeGenre}
        onChange={(e) =>
          setNewRecipeGenre(
            e.target.value === "すべて" ? "すべて" : Number(e.target.value)
          )
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
        onClick={addInstructionStep}
        className="bg-green-500 text-white px-4 py-2 rounded w-full mb-2"
      >
        Add Step
      </button>
      <h3>CookingTime</h3>
      <button
        onClick={() => setNewRecipeCookingTime((prev) => Math.max(0, prev - 1))}
        className="px-2 py-1 bg-gray-300 rounded"
      >
        −
      </button>
      <input
        type="number"
        value={newRecipeCookingTime}
        readOnly // 🔹 キーボード入力禁止
        className="w-12 text-center bg-gray-100 border rounded"
      />
      <button
        onClick={() => setNewRecipeCookingTime((prev) => prev + 1)}
        className="px-2 py-1 bg-gray-300 rounded"
      >
        ＋
      </button>

      <h3>Reviews</h3>
      <button
        onClick={() => setNewRecipeReviews((prev) => Math.max(0, prev - 1))}
        className="px-2 py-1 bg-gray-300 rounded"
      >
        −
      </button>
      <input
        type="number"
        value={newRecipeReviews}
        readOnly // 🔹 キーボード入力禁止
        className="w-12 text-center bg-gray-100 border rounded"
      />
      <button
        onClick={() => setNewRecipeReviews((prev) => prev + 1)}
        className="px-2 py-1 bg-gray-300 rounded"
      >
        ＋
      </button>
      <input
        type="text"
        placeholder="Cost Estimate (例: 1000円以内)"
        value={newRecipeCostEstimate}
        onChange={(e) => setNewRecipeCostEstimate(e.target.value)}
        className="border p-2 mb-2 w-full rounded text-gray-700"
      />

      <textarea
        placeholder="Recipe Summary"
        value={newRecipeSummary}
        onChange={(e) => setNewRecipeSummary(e.target.value)}
        className="border p-2 mb-2 w-full rounded text-gray-700"
      />

      <textarea
        placeholder="Recipe Catchphrase"
        value={newRecipeCatchphrase}
        onChange={(e) => setNewRecipeCatchphrase(e.target.value)}
        className="border p-2 mb-2 w-full rounded text-gray-700"
      />

      <input
        type="number"
        placeholder="Reviews (1-5)"
        value={newRecipeReviews}
        onChange={(e) => setNewRecipeReviews(Number(e.target.value))}
      />
      <div>
        <h3>Nutrition</h3>
        {Object.keys(newRecipeNutrition).map((key) => (
          <input
            key={key}
            type="number"
            placeholder={key}
            value={newRecipeNutrition[key as keyof Nutrition]}
            onChange={(e) =>
              setNewRecipeNutrition({
                ...newRecipeNutrition,
                [key]: Number(e.target.value),
              })
            }
          />
        ))}
      </div>
      <div>
        <h3>FAQ</h3>
        {newRecipeFAQ.map((faq, index) => (
          <div key={index}>
            <input
              type="text"
              placeholder="Question"
              value={faq.question}
              onChange={(e) => {
                const updatedFAQ = [...newRecipeFAQ];
                updatedFAQ[index].question = e.target.value;
                setNewRecipeFAQ(updatedFAQ);
              }}
            />
            <input
              type="text"
              placeholder="Answer"
              value={faq.answer}
              onChange={(e) => {
                const updatedFAQ = [...newRecipeFAQ];
                updatedFAQ[index].answer = e.target.value;
                setNewRecipeFAQ(updatedFAQ);
              }}
            />
          </div>
        ))}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setNewRecipeImage(e.target.files ? e.target.files[0] : null)
        }
        className="border p-2 mb-2 w-full rounded"
      />

      <h3 className="text-lg font-semibold mb-2">Select Ingredients</h3>
      <ul className="mb-4">
        {Array.isArray(ingredients) &&
          ingredients.map((ingredient) => {
            const step = getUnitStep(ingredient.unit?.id || 1);
            const quantity =
              selectedIngredients.find(
                (selected) => selected.id === ingredient.id
              )?.quantity || 0;

            return (
              <li key={ingredient.id} className="flex items-center mb-2">
                <span className="mr-2 font-medium">{ingredient.name}</span>
                <button
                  onClick={() => {
                    setSelectedIngredients((prev) =>
                      prev.some((item) => item.id === ingredient.id)
                        ? prev.map((item) =>
                            item.id === ingredient.id
                              ? { ...item, quantity: item.quantity + step }
                              : item
                          )
                        : [...prev, { id: ingredient.id, quantity: step }]
                    );
                  }}
                  className="bg-green-500 text-white px-2 py-1 rounded ml-2"
                >
                  増加
                </button>
                <span className="mx-4">{quantity}</span>
                <button
                  onClick={() => {
                    setSelectedIngredients((prev) =>
                      prev.map((item) =>
                        item.id === ingredient.id
                          ? {
                              ...item,
                              quantity: Math.max(0, item.quantity - step),
                            }
                          : item
                      )
                    );
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
