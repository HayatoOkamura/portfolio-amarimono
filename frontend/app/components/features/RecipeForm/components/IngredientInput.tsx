import { RecipeFormData } from "../types/recipeForm";
import styles from "./IngredientInput.module.scss";

interface IngredientInputProps {
  ingredients: RecipeFormData["ingredients"];
  availableIngredients: {
    id: number;
    name: string;
    unit: {
      id: number;
      name: string;
      step: number;
    };
  }[];
  onUpdateIngredients: (ingredients: Array<{
    id: number;
    quantity: number;
    unitId: number;
  }>) => void;
}

export const IngredientInput = ({
  ingredients,
  availableIngredients,
  onUpdateIngredients,
}: IngredientInputProps) => {
  return (
    <div className={styles.ingredient_input_block}>
      <ul className="mb-4">
        {availableIngredients.map((ingredient) => {
          const step = ingredient.unit?.step;
          const quantity =
            ingredients.find((selected) => selected.id === ingredient.id)?.quantity || 0;

          return (
            <li key={ingredient.id} className="flex items-center mb-2">
              <span className="mr-2 font-medium">{ingredient.name}</span>
              <button
                onClick={() => {
                  const updatedIngredients = ingredients.some(
                    (item) => item.id === ingredient.id
                  )
                    ? ingredients.map((item) =>
                        item.id === ingredient.id
                          ? { ...item, quantity: item.quantity + step }
                          : item
                      )
                    : [
                        ...ingredients,
                        {
                          id: ingredient.id,
                          quantity: step,
                          unitId: ingredient.unit.id,
                        },
                      ];

                  onUpdateIngredients(updatedIngredients);
                }}
                className="bg-green-500 text-white px-2 py-1 rounded ml-2"
              >
                増加
              </button>
              <span className="mx-4">{Number.isInteger(quantity) ? quantity : Number(quantity).toFixed(1)}</span>
              <button
                onClick={() => {
                  const updatedIngredients = ingredients.map((item) =>
                    item.id === ingredient.id
                      ? {
                          ...item,
                          quantity: Math.max(0, item.quantity - step),
                        }
                      : item
                  );

                  onUpdateIngredients(updatedIngredients);
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