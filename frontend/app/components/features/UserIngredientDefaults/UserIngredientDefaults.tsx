import { useState, useEffect, useRef } from 'react';
import { useUserIngredientDefaults, useUpdateUserIngredientDefaults } from '@/app/hooks/userIngredientDefaults';
import { useIngredients } from '@/app/hooks/ingredients';
import styles from './UserIngredientDefaults.module.scss';
import { Ingredient, Genre } from '@/app/types/index';
import { useGenres } from '@/app/hooks/genres';
import CategoryCard from '@/app/components/ui/Cards/CategoryCard/CategoryCard';
import Loading from '@/app/components/ui/Loading/Loading';
import SearchIngredientCard from '@/app/components/ui/Cards/SearchIngredientCard/SearchIngredientCard';
import useIngredientStore from '@/app/stores/ingredientStore';
import toast from 'react-hot-toast';

interface UserIngredientDefault {
  ingredient_id: number;
  default_quantity: number;
}

export const UserIngredientDefaults = () => {
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const { data: defaults, isLoading: isLoadingDefaults } = useUserIngredientDefaults();
  const { data: ingredients, isLoading: isLoadingIngredients } = useIngredients({
    staleTime: process.env.ENVIRONMENT === "development" ? 10000 : 86400000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const { data: genres, isLoading: isLoadingGenres } = useGenres();
  const { mutate: updateDefaults } = useUpdateUserIngredientDefaults();
  const { ingredients: selectedIngredients, addIngredient, removeIngredient } = useIngredientStore();
  const isInitialMount = useRef(true);

  // デバッグ用のログ
  useEffect(() => {
    console.log('Selected Category:', selectedCategory);
    console.log('Ingredients:', ingredients);
    console.log('Loading States:', {
      isLoadingDefaults,
      isLoadingIngredients,
      isLoadingGenres
    });
  }, [selectedCategory, ingredients, isLoadingDefaults, isLoadingIngredients, isLoadingGenres]);

  // 初期設定の反映
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const applyDefaults = () => {
      if (defaults) {
        defaults.forEach((default_) => {
          const ingredient = ingredients?.find(ing => ing.id === default_.ingredient_id);
          if (ingredient) {
            addIngredient({
              ...ingredient,
              quantity: default_.default_quantity,
            });
          }
        });
      }
    };

    if (!isLoadingDefaults && !isLoadingIngredients && ingredients) {
      applyDefaults();
    }
  }, [defaults, ingredients, isLoadingDefaults, isLoadingIngredients, addIngredient]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updates = selectedIngredients.map(ingredient => ({
        ingredient_id: ingredient.id,
        default_quantity: ingredient.quantity
      }));

      await updateDefaults(updates);
      toast.success('具材の初期設定を保存しました');
    } catch (error) {
      console.error('Error saving ingredient defaults:', error);
      toast.error('具材の初期設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading表示の条件を修正
  if (isLoadingDefaults || isLoadingGenres) {
    return <div className={styles.container}><Loading /></div>;
  }

  const allGenres = [{ id: 0, name: "すべて" }, ...(genres || [])];

  // フィルタリングロジックのデバッグ
  console.log('Filtering ingredients for category:', selectedCategory);
  const filteredIngredients = selectedCategory === 0
    ? ingredients
    : ingredients?.filter((ing) => {
        console.log('Checking ingredient:', ing.name, 'Genre ID:', ing.genre.id, 'Selected Category:', selectedCategory);
        return ing.genre.id === selectedCategory;
      });

  console.log('Filtered Ingredients:', filteredIngredients);

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
        <div className={styles.ingredient_block__wrapper}>
          <div className={styles.ingredient_block__contents}>
            {filteredIngredients?.map((ingredient: Ingredient) => (
              <SearchIngredientCard
                key={ingredient.id}
                ingredient={ingredient}
              />
            ))}
          </div>
        </div>
      </section>

      <div className={styles.save_block}>
        {isSaving ? (
          <div className={styles.loading_container}>
            <Loading />
          </div>
        ) : (
          <button
            className={styles.save_block__button}
            onClick={handleSave}
          >
            設定を保存
          </button>
        )}
      </div>
    </div>
  );
}; 