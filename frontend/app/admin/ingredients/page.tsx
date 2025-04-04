/* eslint-disable */
"use client";

import styles from "./ingredients.module.scss";
import { backendUrl } from "@/app/utils/apiUtils";
import useIngredientStore from "../../stores/ingredientStore";
import useGenreStore from "../../stores/genreStore";
import useUnitStore from "../../stores/unitStore";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditIngredient, Ingredient } from "../../types/index";
import { useDeleteIngredient, useAddIngredient } from "../../hooks/ingredients";

const AdminIngredients = () => {
  const {
    ingredients,
    error,
    newIngredient,
    fetchIngredients,
    editIngredient,
    setNewIngredient,
  } = useIngredientStore();

  const {
    ingredientGenres,
    fetchIngredientGenres,
    error: genreError,
  } = useGenreStore();

  const { units, fetchUnits, error: unitError } = useUnitStore();

  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState<number | string>("すべて");
  const [inputError, setInputError] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingIngredient, setEditingIngredient] = useState<EditIngredient | null>(null);

  const { mutate: deleteIngredient } = useDeleteIngredient();
  const { mutate: addIngredient } = useAddIngredient();

  // 初回レンダリング時にデータを取得
  useEffect(() => {
    const initializeData = async () => {
      await fetchUnits();
      await fetchIngredientGenres();
      fetchIngredients();
    };

    initializeData();
  }, []);

  // ジャンルごとに具材をフィルタリング
  const filteredIngredients =
    selectedGenre === "すべて"
      ? ingredients
      : ingredients.filter((ing) => ing.genre.id === selectedGenre);

  // 入力を確認してエラーを設定
  const handleAddIngredient = () => {
    console.log('New Ingredient:', newIngredient);
    console.log('Image URL type:', typeof newIngredient.imageUrl);
    console.log('Is File:', newIngredient.imageUrl instanceof File);

    if (
      !newIngredient.name ||
      !newIngredient.genre ||
      !newIngredient.imageUrl ||
      !newIngredient.unit
    ) {
      setInputError("名前、ジャンル、画像、単位はすべて必須です。");
      return;
    }

    setInputError(""); // エラーをクリア
    if (newIngredient.genre && newIngredient.unit) {
      const formData = new FormData();
      formData.append("name", newIngredient.name);
      formData.append("genre_id", newIngredient.genre.id.toString());
      formData.append("unit_id", newIngredient.unit.id.toString());
      formData.append("quantity", "0");
      
      // 画像ファイルを追加
      if (newIngredient.imageUrl instanceof File) {
        console.log('Appending file:', newIngredient.imageUrl);
        formData.append("image", newIngredient.imageUrl);
      } else if (typeof newIngredient.imageUrl === 'string') {
        console.log('Appending image URL:', newIngredient.imageUrl);
        formData.append("image_url", newIngredient.imageUrl);
      }

      // FormDataの内容を確認
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      addIngredient(formData, {
        onSuccess: (data) => {
          // 成功したらフォームをリセット
          setNewIngredient({
            id: 0,
            name: "",
            genre: null,
            genreId: null,
            unit: null,
            imageUrl: null,
            quantity: 0
          });
        }
      });
    }
  };

  const openEditModal = (ingredient: EditIngredient) => {
    setEditingIngredient(ingredient);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingIngredient(null);
  };

  const saveEditedIngredient = async () => {
    if (editingIngredient && editingIngredient.genre && editingIngredient.unit) {
      const updatedData: Ingredient = {
        id: editingIngredient.id,
        name: editingIngredient.name,
        genre: editingIngredient.genre,
        unit: editingIngredient.unit,
        quantity: editingIngredient.quantity,
        imageUrl: editingIngredient.imageUrl
      };
  
      await editIngredient(updatedData);
      await fetchIngredients();
      closeEditModal();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Ingredients</h1>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      {/* TOPページに戻るボタン */}
      <div className="text-center mb-6">
        <button
          onClick={() => router.push("/")}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition"
        >
          Go to TOP Page
        </button>
      </div>

      {/* ジャンル選択 */}
      <div className="mb-6 text-center">
        <select
          value={selectedGenre}
          onChange={(e) =>
            setSelectedGenre(
              e.target.value === "すべて" ? "すべて" : parseInt(e.target.value)
            )
          }
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        >
          <option value="すべて">すべて</option>
          {ingredientGenres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      <ul className="grid gap-6 grid-cols-3 lg:grid-cols-4">
        {filteredIngredients.map((ing: any, index: number) => (
          <li
            key={index}
            className="bg-white shadow rounded-lg p-5 flex flex-col items-center gap-4"
          >
            <p className="text-gray-400">{ing.genre.name}</p>
            <div className="block relative aspect-video w-full">
              <Image
                fill
                src={
                  ing.imageUrl
                    ? typeof ing.imageUrl === 'string'
                      ? `${backendUrl}/${ing.imageUrl}`
                      : URL.createObjectURL(ing.imageUrl)
                    : "/pic_recipe_default.webp"
                }
                alt={ing.name ? ing.name : ""}
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="text-2xl font-semibold text-gray-600">{ing.name}</p>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              onClick={() => openEditModal(ing)}
            >
              Edit
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              onClick={() => deleteIngredient(ing.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Add New Ingredient</h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <input
            type="text"
            value={newIngredient.name}
            placeholder="Ingredient Name"
            onChange={(e) =>
              setNewIngredient({
                ...newIngredient,
                name: e.target.value,
                genreId: newIngredient.genre?.id || null,
                genre: newIngredient.genre || null,
                unit: newIngredient.unit || null,
                imageUrl: newIngredient.imageUrl || null,
                quantity: newIngredient.quantity || 0
              })
            }
            className="w-full md:w-1/3 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          {/* Unit 入力欄を追加 */}
          {/* 単位のエラー表示 */}
          {unitError && <p className="text-red-500 mb-4">{unitError}</p>}

          {/* 単位選択 */}
          <select
            value={newIngredient.unit?.id || ""}
            onChange={(e) =>
              setNewIngredient({
                ...newIngredient,
                unit: units.find((unit) => unit.id === parseInt(e.target.value)) || null,
                genreId: newIngredient.genre?.id || null,
                genre: newIngredient.genre || null,
                imageUrl: newIngredient.imageUrl || null,
                quantity: newIngredient.quantity || 0
              })
            }
            className="w-full md:w-1/3 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value="">単位を選択</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
          <select
            value={newIngredient.genre?.id || ""}
            onChange={(e) =>
              setNewIngredient({
                ...newIngredient,
                genre: ingredientGenres.find((g) => g.id === parseInt(e.target.value)) || null,
                genreId: ingredientGenres.find((g) => g.id === parseInt(e.target.value))?.id || null,
                unit: newIngredient.unit || null,
                imageUrl: newIngredient.imageUrl || null,
                quantity: newIngredient.quantity || 0
              })
            }
            className="w-full md:w-1/3 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value="">ジャンルを選択</option>
            {ingredientGenres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files ? e.target.files[0] : null;
              setNewIngredient({
                ...newIngredient,
                imageUrl: file,
                genreId: newIngredient.genre?.id || null,
                genre: newIngredient.genre || null,
                unit: newIngredient.unit || null,
                quantity: newIngredient.quantity || 0
              });
            }}
            className="w-full md:w-1/3 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddIngredient}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Add Ingredient
          </button>
        </div>
        {inputError && <p className="text-red-500 mt-4">{inputError}</p>}
      </div>

      {isModalOpen && editingIngredient && (
        <div className={styles.modal_block}>
          <div className={styles.modal_block__inner}>
            <h2 className={styles.modal_block__title}>Edit Ingredient</h2>

            {/* 名前編集 */}
            <input
              type="text"
              value={editingIngredient.name}
              onChange={(e) =>
                setEditingIngredient({
                  ...editingIngredient,
                  name: e.target.value,
                })
              }
            />

            {/* ジャンル編集 */}
            <select
              value={editingIngredient.genre?.id || ""}
              onChange={(e) =>
                setEditingIngredient({
                  ...editingIngredient,
                  genre:
                    ingredientGenres.find(
                      (g) => g.id === parseInt(e.target.value)
                    ) || editingIngredient.genre,
                })
              }
            >
              {ingredientGenres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>

            {/* 単位編集 */}
            <select
             value={newIngredient.unit?.id || ""}
              onChange={(e) =>
                setEditingIngredient({
                  ...editingIngredient,
                  unit:
                    units.find((u) => u.id === parseInt(e.target.value)) ||
                    editingIngredient.unit,
                })
              }
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>

            {/* 画像編集 */}
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : null;
                if (file) {
                  setEditingIngredient({
                    ...editingIngredient,
                    imageUrl: file,
                    genreId: editingIngredient.genre?.id || null,
                    genre: editingIngredient.genre || null,
                    unit: editingIngredient.unit || null,
                    quantity: editingIngredient.quantity || 0
                  });
                }
              }}
            />

            <button onClick={saveEditedIngredient}>Save</button>
            <button onClick={closeEditModal}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIngredients;
