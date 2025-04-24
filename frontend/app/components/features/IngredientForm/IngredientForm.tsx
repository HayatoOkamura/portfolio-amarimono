import { useState } from "react";
import { EditIngredient } from "@/app/types/index";
import styles from "./IngredientForm.module.scss";

interface IngredientFormProps {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  initialData?: EditIngredient;
  units: { id: number; name: string }[];
  genres: { id: number; name: string }[];
}

const IngredientForm = ({
  onSubmit,
  onCancel,
  initialData,
  units,
  genres,
}: IngredientFormProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [selectedUnit, setSelectedUnit] = useState(initialData?.unit?.id || "");
  const [selectedGenre, setSelectedGenre] = useState(initialData?.genre?.id || "");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !selectedUnit || !selectedGenre || (!image && !initialData?.imageUrl)) {
      setError("名前、単位、ジャンル、画像はすべて必須です。");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("unit_id", selectedUnit.toString());
    formData.append("genre_id", selectedGenre.toString());
    formData.append("quantity", "0");

    if (image) {
      formData.append("image", image);
    } else if (initialData?.imageUrl) {
      formData.append("image_url", initialData.imageUrl);
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>
          名前
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          placeholder="具材の名前"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="unit" className={styles.label}>
          単位
        </label>
        <select
          id="unit"
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className={styles.select}
        >
          <option value="">単位を選択</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="genre" className={styles.label}>
          ジャンル
        </label>
        <select
          id="genre"
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className={styles.select}
        >
          <option value="">ジャンルを選択</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="image" className={styles.label}>
          画像
        </label>
        <input
          id="image"
          type="file"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className={styles.fileInput}
          accept="image/*"
        />
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          キャンセル
        </button>
        <button type="submit" className={styles.submitButton}>
          {initialData ? "更新" : "登録"}
        </button>
      </div>
    </form>
  );
};

export default IngredientForm; 