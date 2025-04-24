import Image from "next/image";
import { imageBaseUrl } from "@/app/utils/api";
import { EditIngredient } from "@/app/types/index";
import styles from "./IngredientList.module.scss";

interface IngredientListProps {
  ingredients: EditIngredient[];
  onEdit: (ingredient: EditIngredient) => void;
  onDelete: (id: number) => void;
}

const IngredientList = ({
  ingredients,
  onEdit,
  onDelete,
}: IngredientListProps) => {
  return (
    <ul className={styles.ing_block}>
      {ingredients.map((ing) => (
        <li key={ing.id} className={styles.ing_block__item}>
          <p className={styles.ing_block__genre}>{ing.genre.name}</p>
          <div className={styles.ing_block__image}>
            <Image
              src={
                ing.imageUrl
                  ? `${imageBaseUrl}/uploads/${ing.imageUrl}`
                  : "/pic_recipe_default.webp"
              }
              alt={ing.name || ""}
              width={100}
              height={100}
            />
          </div>
          <p className={styles.ing_block__name}>{ing.name}</p>
          <div className={styles.ing_block__actions}>
            <button
              className={`${styles.button} ${styles["button--edit"]}`}
              onClick={() => onEdit(ing)}
            >
              編集
            </button>
            <button
              className={`${styles.button} ${styles["button--delete"]}`}
              onClick={() => onDelete(ing.id)}
            >
              削除
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default IngredientList;
