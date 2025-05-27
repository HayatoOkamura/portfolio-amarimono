import { useState } from 'react';
import { Modal } from '@/app/components/common/Modal/Modal';
import { Ingredient } from '@/app/types/index';
import styles from './IngredientSelectorModal.module.scss';
import Image from 'next/image';
import { imageBaseUrl } from '@/app/utils/api';

interface IngredientSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  selectedIngredients: { id: number; amount: number }[];
  onSelect: (ingredients: { id: number; amount: number }[]) => void;
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

  // ジャンルの一覧を取得
  const genres = Array.from(new Set(ingredients.map(ing => ing.genre.id)))
    .map(id => ingredients.find(ing => ing.genre.id === id)?.genre)
    .filter((genre): genre is NonNullable<typeof genre> => genre !== undefined);

  // 検索とジャンルでフィルタリング
  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === null || ingredient.genre.id === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const handleIngredientSelect = (ingredient: Ingredient) => {
    const isSelected = selectedIngredients.some((si) => si.id === ingredient.id);
    let newSelectedIngredients;

    if (isSelected) {
      newSelectedIngredients = selectedIngredients.filter(
        (si) => si.id !== ingredient.id
      );
    } else {
      // presenceタイプの材料の場合は数量を1に固定
      const initialAmount = ingredient.unit.type === 'presence' ? 1 : 1;
      newSelectedIngredients = [
        ...selectedIngredients,
        { id: ingredient.id, amount: initialAmount },
      ];
    }

    onSelect(newSelectedIngredients);
  };

  const handleAmountChange = (id: number, amount: number) => {
    const ingredient = ingredients.find(ing => ing.id === id);
    if (!ingredient) return;

    // presenceタイプの材料の場合は数量調整を無効
    if (ingredient.unit.type === 'presence') return;

    if (amount === 0) {
      // 数量が0になったら具材を削除
      const newSelectedIngredients = selectedIngredients.filter(
        (si) => si.id !== id
      );
      onSelect(newSelectedIngredients);
    } else {
      // 数量を更新
      const newSelectedIngredients = selectedIngredients.map((si) =>
        si.id === id ? { ...si, amount } : si
      );
      onSelect(newSelectedIngredients);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal__header}>
        <h2 className={styles.modal__header__title}>材料を選択</h2>
        <button onClick={onClose} className={styles.modal__header__close}>
          ✕
        </button>
      </div>
      <div className={styles.modal__search}>
        <input
          type="text"
          placeholder="材料を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.modal__search__input}
        />
        <div className={styles.modal__genre}>
          <button
            className={`${styles.modal__genre__button} ${selectedGenre === null ? styles['modal__genre__button--active'] : ''}`}
            onClick={() => setSelectedGenre(null)}
          >
            すべて
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              className={`${styles.modal__genre__button} ${selectedGenre === genre.id ? styles['modal__genre__button--active'] : ''}`}
              onClick={() => setSelectedGenre(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.modal__list}>
        {filteredIngredients.map((ingredient) => {
          const isSelected = selectedIngredients.some(
            (si) => si.id === ingredient.id
          );
          const selectedIngredient = selectedIngredients.find(
            (si) => si.id === ingredient.id
          );

          return (
            <div
              key={ingredient.id}
              className={`${styles.modal_ingredient} ${
                isSelected ? styles['modal_ingredient--selected'] : ''
              }`}
              onClick={() => handleIngredientSelect(ingredient)}
            >
              <div className={styles.modal_ingredient__image}>
                <Image
                  src={
                    ingredient.imageUrl
                      ? `${imageBaseUrl}/${ingredient.imageUrl}`
                      : "/pic_recipe_default.webp"
                  }
                  alt={ingredient.name}
                  width={80}
                  height={80}
                />
              </div>
              <div className={styles.modal_ingredient__info}>
                <span className={styles.modal_ingredient__name}>{ingredient.name}</span>
              </div>
              {isSelected && (
                <div className={styles.modal_ingredient__controls}>
                  {ingredient.unit.type !== 'presence' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAmountChange(ingredient.id, (selectedIngredient?.amount || 0) + ingredient.unit.step);
                        }}
                        className={`${styles.modal_ingredient__button} ${styles['modal_ingredient__button--plus']}`}
                        aria-label={`${ingredient.name}を増やす`}
                      />
                      <span className={styles.modal_ingredient__quantity}>
                        {Number.isInteger(selectedIngredient?.amount)
                          ? selectedIngredient?.amount
                          : Number(selectedIngredient?.amount).toFixed(1)}
                        {ingredient.unit.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAmountChange(ingredient.id, Math.max(0, (selectedIngredient?.amount || 0) - ingredient.unit.step));
                        }}
                        className={`${styles.modal_ingredient__button} ${styles['modal_ingredient__button--minus']}`}
                        aria-label={`${ingredient.name}を減らす`}
                      />
                    </>
                  )}
                  {ingredient.unit.type === 'presence' && (
                    <span className={styles.modal_ingredient__quantity}>
                      {ingredient.unit.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}; 