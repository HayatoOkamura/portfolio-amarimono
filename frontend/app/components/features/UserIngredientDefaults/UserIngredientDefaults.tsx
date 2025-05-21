import { useState, useEffect } from 'react';
import { useUserIngredientDefaults, useUpdateUserIngredientDefault, useIngredientsByCategory } from '@/app/hooks/ingredients';
import styles from './UserIngredientDefaults.module.scss';
import { Ingredient, Genre } from '@/app/types/index';
import { useGenres } from '@/app/hooks/genres';
import CategoryCard from '@/app/components/ui/Cards/CategoryCard/CategoryCard';
import Loading from '@/app/components/ui/Loading/Loading';
import IngredientCard from '@/app/components/ui/Cards/IngredientCard/IngredientCard';

interface UserIngredientDefault {
  ingredient_id: number;
  default_quantity: number;
}

export const UserIngredientDefaults = () => {
  const [selectedCategory, setSelectedCategory] = useState<number>(0); // デフォルトで「すべて」を選択
  const [height, setHeight] = useState("auto");
  const { data: defaults, isLoading: isLoadingDefaults } = useUserIngredientDefaults();
  const { data: ingredients, isLoading: isLoadingIngredients } = useIngredientsByCategory(selectedCategory);
  const { data: genres, isLoading: isLoadingGenres } = useGenres();
  const { mutate: updateDefault } = useUpdateUserIngredientDefault();

  // 一時的な選択状態を管理
  const [tempSelections, setTempSelections] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    // 初期設定を一時的な選択状態に反映
    if (defaults) {
      const initialSelections = defaults.reduce((acc: { [key: number]: number }, default_: UserIngredientDefault) => {
        acc[default_.ingredient_id] = default_.default_quantity;
        return acc;
      }, {} as { [key: number]: number });
      setTempSelections(initialSelections);
    }
  }, [defaults]);

  useEffect(() => {
    const updateHeight = () => {
      if (isLoadingIngredients || isLoadingGenres) return;

      const element = document.getElementById("ingredient-list");
      if (element) {
        const topOffset = element.getBoundingClientRect().top;
        setHeight(`${window.innerHeight - topOffset - 20}px`);
      }
    };

    window.addEventListener("resize", updateHeight);
    updateHeight();

    return () => window.removeEventListener("resize", updateHeight);
  }, [isLoadingIngredients, isLoadingGenres]);

  const handleQuantityChange = (ingredientId: number, delta: number) => {
    setTempSelections(prev => ({
      ...prev,
      [ingredientId]: Math.max(0, (prev[ingredientId] || 0) + delta)
    }));
  };

  const handleSave = async () => {
    const updates = Object.entries(tempSelections).map(([ingredientId, quantity]) => ({
      ingredient_id: Number(ingredientId),
      default_quantity: quantity
    }));

    await updateDefault(updates);
  };

  if (isLoadingDefaults || isLoadingIngredients || isLoadingGenres) {
    return <div className={styles.container}><Loading /></div>;
  }

  // 「すべて」カテゴリを追加
  const allGenres = [{ id: 0, name: "すべて" }, ...(genres || [])];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>よく使う具材の設定</h1>
      
      <section className={styles.category_block}>
        <h2 className={styles.category_block__title}>具材カテゴリー</h2>
        <div className={styles.category_block__contents}>
          {allGenres.map((genre: Genre) => (
            <CategoryCard
              key={genre.id}
              genre={genre}
              onClick={() => setSelectedCategory(genre.id)}
              isSelected={selectedCategory === genre.id}
            />
          ))}
        </div>
      </section>

      <section className={styles.ingredient_block}>
        <h2 className={styles.ingredient_block__title}>具材一覧</h2>
        <div
          className={styles.ingredient_block__wrapper}
          id="ingredient-list"
          style={{ height }}
        >
          <div className={styles.ingredient_block__contents}>
            {ingredients?.map((ingredient: Ingredient) => {
              if (!ingredient || !ingredient.unit) return null;
              
              const currentQuantity = tempSelections[ingredient.id] || 0;
              const isPresence = ingredient.unit.name === 'presence';
              
              return (
                <IngredientCard
                  key={ingredient.id}
                  ingredient={ingredient}
                  currentQuantity={currentQuantity}
                  isPresence={isPresence}
                  onQuantityChange={handleQuantityChange}
                />
              );
            })}
          </div>
        </div>
      </section>

      <div className={styles.save_block}>
        <button
          className={styles.save_block__button}
          onClick={handleSave}
        >
          設定を保存
        </button>
      </div>
    </div>
  );
}; 