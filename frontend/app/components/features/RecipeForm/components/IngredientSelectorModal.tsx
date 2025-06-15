import { useState } from 'react';
import { Modal } from '@/app/components/common/Modal/Modal';
import { Ingredient, Unit } from '@/app/types/index';
import styles from './IngredientSelectorModal.module.scss';
import CategoryCard from '@/app/components/ui/Cards/CategoryCard/CategoryCard';
import RecipeCreationIngredientCard from '@/app/components/ui/Cards/RecipeCreationIngredientCard/RecipeCreationIngredientCard';
import { useUnits } from '@/app/hooks/units';

interface IngredientSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  selectedIngredients: { id: number; amount: number; unit?: string }[];
  onSelect: (ingredients: { id: number; amount: number; unit?: string }[]) => void;
}

export const IngredientSelectorModal = ({
  isOpen,
  onClose,
  ingredients,
  selectedIngredients,
  onSelect,
}: IngredientSelectorModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const { data: units } = useUnits();

  // ジャンルの一覧を取得
  const genres = [{ id: 0, name: "すべて" }, ...Array.from(new Set(ingredients.map(ing => ing.genre.id)))
    .map(id => ingredients.find(ing => ing.genre.id === id)?.genre)
    .filter((genre): genre is NonNullable<typeof genre> => genre !== undefined)
    .sort((a, b) => a.id - b.id)];

  // 検索とジャンルでフィルタリング
  const filteredIngredients = ingredients
    .filter((ingredient) => {
      const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === null || ingredient.genre.id === selectedGenre;
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      // まずgenre_idでソート
      if (a.genre.id !== b.genre.id) {
        return a.genre.id - b.genre.id;
      }
      // 同じジャンル内ではidでソート
      return a.id - b.id;
    });

  const handleQuantityChange = (id: number, delta: number) => {
    const ingredient = ingredients.find(ing => ing.id === id);
    if (!ingredient) return;

    const currentAmount = selectedIngredients.find(si => si.id === id)?.amount || 0;
    const newAmount = Math.max(0, currentAmount + delta);

    if (newAmount === 0) {
      // 数量が0になったら具材を削除
      const newSelectedIngredients = selectedIngredients.filter(si => si.id !== id);
      onSelect(newSelectedIngredients);
    } else {
      // 数量を更新または新規追加
      const existingIngredient = selectedIngredients.find(si => si.id === id);
      if (existingIngredient) {
        const newSelectedIngredients = selectedIngredients.map(si =>
          si.id === id ? { ...si, amount: newAmount } : si
        );
        onSelect(newSelectedIngredients);
      } else {
        onSelect([...selectedIngredients, { id, amount: newAmount, unit: ingredient.unit.name }]);
      }
    }
  };

  const handleUnitChange = (ingredientId: number, unit: string, callback?: () => void) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    if (!ingredient) return;

    // 選択された単位の情報を取得
    const selectedUnit = units?.find(u => u.name === unit);
    if (!selectedUnit) return;

    const existingIngredient = selectedIngredients.find(ing => ing.id === ingredientId);
    if (existingIngredient) {
      // 既に選択されている具材の単位を更新し、数量を新しい単位のstep値に設定
      const updatedIngredients = selectedIngredients.map(ing =>
        ing.id === ingredientId ? { ...ing, unit, amount: selectedUnit.step } : ing
      );
      onSelect(updatedIngredients);
    } else {
      // 選択されていない具材の場合、新しい単位のstep値で追加
      onSelect([...selectedIngredients, { id: ingredientId, amount: selectedUnit.step, unit }]);
    }

    // コールバックが存在する場合は実行
    if (callback) {
      callback();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal_block__header}>
        <h2 className={styles.modal_block__header__title}>材料を選択</h2>
        <button onClick={onClose} className={styles.modal_block__header__close}>
          ✕
        </button>
      </div>
      <div className={styles.modal_block__search}>
        <input
          type="text"
          placeholder="材料を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.modal_block__search_input}
        />
        <div className={styles.modal_block__genre}>
          <h2 className={styles.modal_block__genre_title}>カテゴリー</h2>
          <div className={styles.modal_block__genre_content}>
            {genres.map((genre) => (
              <CategoryCard
                key={genre.id}
                genre={genre}
                onClick={() => setSelectedGenre(genre.id === 0 ? null : genre.id)}
                isSelected={selectedGenre === (genre.id === 0 ? null : genre.id)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className={styles.modal_block__ingredients}>
        <h2 className={styles.modal_block__ingredients_title}>材料</h2>
        <div className={styles.modal_block__ingredients_content}>
          {filteredIngredients.map((ingredient) => {
            const isSelected = selectedIngredients.some(si => si.id === ingredient.id);
            const selectedIngredient = selectedIngredients.find(si => si.id === ingredient.id);
            const quantity = selectedIngredient?.amount || 0;
            const selectedUnit = selectedIngredient?.unit || ingredient.unit.name;

            return (
              <RecipeCreationIngredientCard
                key={ingredient.id}
                ingredient={ingredient}
                isSelected={isSelected}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
                onUnitChange={handleUnitChange}
                selectedUnit={selectedUnit}
              />
            );
          })}
        </div>
      </div>
    </Modal>
  );
}; 