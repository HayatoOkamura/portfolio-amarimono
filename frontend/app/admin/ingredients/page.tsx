"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditIngredient } from "@/app/types/index";
import useIngredientStore from "@/app/stores/ingredientStore";
import useGenreStore from "@/app/stores/genreStore";
import useUnitStore from "@/app/stores/unitStore";
import { useDeleteIngredient, useAddIngredient, useUpdateIngredient, useIngredients } from "@/app/hooks/ingredients";
import IngredientList from "@/app/components/features/IngredientList/IngredientList";
import IngredientForm from "@/app/components/features/IngredientForm/IngredientForm";
import styles from "./ingredients.module.scss";

const AdminIngredients = () => {
  const {
    ingredients,
    error,
    fetchIngredients,
    editIngredient,
  } = useIngredientStore();

  const {
    ingredientGenres,
    fetchIngredientGenres,
  } = useGenreStore();

  const { units, fetchUnits } = useUnitStore();

  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState<number | string>("すべて");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingIngredient, setEditingIngredient] = useState<EditIngredient | undefined>(undefined);

  const { mutate: deleteIngredient } = useDeleteIngredient();
  const { mutate: addIngredient } = useAddIngredient();
  const { mutate: updateIngredient } = useUpdateIngredient();

  const { data: ingredientsData, refetch: refetchIngredients } = useIngredients();

  useEffect(() => {
    const initializeData = async () => {
      await fetchUnits();
      await fetchIngredientGenres();
      await refetchIngredients();
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (ingredientsData) {
      useIngredientStore.getState().setIngredients(ingredientsData);
    }
  }, [ingredientsData]);

  const filteredIngredients =
    selectedGenre === "すべて"
      ? ingredients
      : ingredients.filter((ing) => ing.genre.id === selectedGenre);

  const handleAddIngredient = (formData: FormData) => {
    addIngredient(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        fetchIngredients();
      },
    });
  };

  const handleEditIngredient = (formData: FormData) => {
    if (editingIngredient) {
      const unit = units.find((u) => u.id === parseInt(formData.get("unit_id") as string));
      const genre = ingredientGenres.find((g) => g.id === parseInt(formData.get("genre_id") as string));
      
      if (!unit || !genre) return;
      
      const image = formData.get("image") as File;
      const imageUrl = image ? image : (editingIngredient.imageUrl as string) || null;

      const updatedIngredient = {
        ...editingIngredient,
        name: formData.get("name") as string,
        unit,
        genre,
        imageUrl,
        nutrition: formData.get("nutrition") ? JSON.parse(formData.get("nutrition") as string) : undefined,
      };

      console.log('Updating ingredient with data:', updatedIngredient);

      updateIngredient({
        id: editingIngredient.id,
        data: updatedIngredient
      }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingIngredient(undefined);
          fetchIngredients();
        }
      });
    }
  };

  const openEditModal = (ingredient: EditIngredient) => {
    setEditingIngredient(ingredient);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIngredient(undefined);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>具材管理</h1>
        <button
          onClick={() => router.push("/")}
          className={styles.backButton}
        >
          トップページに戻る
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.controls}>
        <select
          value={selectedGenre}
          onChange={(e) =>
            setSelectedGenre(
              e.target.value === "すべて" ? "すべて" : parseInt(e.target.value)
            )
          }
          className={styles.genreSelect}
        >
          <option value="すべて">すべて</option>
          {ingredientGenres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.addButton}
        >
          具材を追加
        </button>
      </div>

      <IngredientList
        ingredients={filteredIngredients}
        onEdit={openEditModal}
        onDelete={deleteIngredient}
      />

      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              {editingIngredient ? "具材を編集" : "具材を追加"}
            </h2>
            <IngredientForm
              onSubmit={editingIngredient ? handleEditIngredient : handleAddIngredient}
              onCancel={closeModal}
              initialData={editingIngredient}
              units={units}
              genres={ingredientGenres}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIngredients;
