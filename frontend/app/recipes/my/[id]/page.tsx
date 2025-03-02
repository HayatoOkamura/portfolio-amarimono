/* eslint-disable */
"use client";
import styles from "./recipe.detail.module.scss";
import { backendUrl } from "@/app/utils/apiUtils";
import ResponsivePieChart from "@/app/components/ui/PieChart/PieChart";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Recipe } from "@/app/types";
import Image from "next/image";
import { fetchRecipeByIdService } from "@/app/hooks/recipes";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";

const EditMyRecipe = () => {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [nutritionRatio, setNutritionRatio] = useState<Record<string, number>>(
    {}
  );
  const fullStars = recipe ? Math.floor(recipe.reviews) : 0;
  const remainder = recipe ? recipe.reviews - fullStars : 0;
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const id = window.location.pathname.split("/").pop(); // URLからID取得

    if (id) {
      fetchRecipeByIdService(id)
        .then(({ recipe, nutritionRatio }) => {
          setRecipe(recipe);
          setNutritionRatio(nutritionRatio); // nutritionRatioもセット
        })
        .catch((error) => console.error("Error fetching recipe:", error));
    }
  }, []);

  useEffect(() => {
    if (!recipe || !user) return;

    const checkLikeStatus = async () => {
      try {
        const response = await fetch(
          `${backendUrl}/api/likes/${user.id}/${recipe.id}`
        );
        if (response.ok) {
          setIsLiked(true);
        }
      } catch (error) {
        console.error("Error checking like status", error);
      }
    };

    checkLikeStatus();
  }, [recipe, user]);

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     const { data, error } = await supabase.auth.getUser();
  //     if (!error && data.user) {
  //       setUser(data.user);
  //     }
  //   };

  //   fetchUser();
  // }, []);

  const handleLike = async () => {
    if (!recipe) return;
    try {
      const response = await fetch(
        `${backendUrl}/api/likes/${user.id}/${recipe.id}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsLiked((prev) => !prev);
        alert(data.message); // "Like added" または "Like removed"
      } else {
        console.error("Failed to toggle like");
      }
    } catch (error) {
      console.error("Error toggling like", error);
    }
  };

  if (!recipe) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.recipe_block}>
      <div className={styles.recipe_block__inner}>
        <button onClick={handleLike}>{isLiked ? "♡" : "🩷"}</button>
        <div className={styles.description_block}>
          <div className={styles.description_block__img}>
            <Image
              fill
              src={
                `${backendUrl}/uploads/${recipe.imageUrl}` ||
                "/default-image.jpg"
              }
              alt={recipe.name}
              unoptimized
            />
          </div>
          <ol className={styles.description_block__list}>
            {recipe.instructions.map((step, idx) => (
              <li className={styles.description_block__item} key={idx}>
                <div className={styles.description_block__sub_img}>
                  <Image
                    fill
                    src={
                      `${backendUrl}/uploads/${step.imageUrl}` ||
                      "/default-image.jpg"
                    }
                    alt={recipe.name}
                    unoptimized
                  />
                </div>
                <div className={styles.description_block__contents}>
                  <strong className={styles.description_block__label}>
                    Step {step.stepNumber}:
                  </strong>
                  <p className={styles.description_block__text}>
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.info_block}>
          <p className={styles.info_block__catchphrase}>{recipe.catchphrase}</p>
          <h1 className={styles.info_block__name}>{recipe.name}</h1>
          <div className={styles.detail_block}>
            <div className={styles.detail_block__item}>
              <div className={styles.detail_block__stars}>
                {[...Array(5)].map((_, index) => {
                  return (
                    <div key={index} className={styles.detail_block__star}>
                      ★{/* 完全に黄色の星 */}
                      {index < fullStars && (
                        <span
                          className={`${styles.detail_block__yellow} ${styles.full_star}`}
                        >
                          ★
                        </span>
                      )}
                      {/* 部分的に黄色の星 */}
                      {index === fullStars && remainder > 0 && (
                        <span
                          className={`${styles.detail_block__yellow} ${styles.partial_star}`}
                          style={{
                            clipPath: `inset(0 ${100 - remainder * 100}% 0 0)`,
                          }}
                        >
                          ★
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className={styles.detail_block__text}>
                {recipe.reviews}(<span>10件</span>)
              </p>
            </div>
            <div className={styles.detail_block__item}>
              <p className={styles.detail_block__title}>調理時間</p>
              <p>{recipe.cookingTime}</p>
            </div>
            <div className={styles.detail_block__item}>
              <p className={styles.detail_block__title}>費用目安</p>
              <p>{recipe.costEstimate}</p>
            </div>
          </div>
          <p className={styles.info_block__summary}>{recipe.summary}</p>
          <ul className={styles.nutrition_block}>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                カロリー{recipe.nutrition.calories}
              </p>
              <ResponsivePieChart value={nutritionRatio.calories} />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                炭水化物{recipe.nutrition.carbohydrates}
              </p>
              <ResponsivePieChart value={nutritionRatio.carbohydrates} />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                脂質{recipe.nutrition.fat}
              </p>
              <ResponsivePieChart value={nutritionRatio.fat} />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                タンパク質{recipe.nutrition.protein}
              </p>
              <ResponsivePieChart value={nutritionRatio.protein} />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                塩分{recipe.nutrition.salt}
              </p>
              <ResponsivePieChart value={nutritionRatio.salt} />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                糖分{recipe.nutrition.sugar}
              </p>
              <ResponsivePieChart value={nutritionRatio.sugar} />
            </li>
          </ul>
          <h3 className={styles.info_block__ingredient}>材料【1人分】</h3>
          <ul className={styles.ingredient_block}>
            {recipe.ingredients.map((ingredient, idx) => (
              <li className={styles.ingredient_block__item} key={idx}>
                <p className={styles.ingredient_block__name}>
                  {ingredient.name}
                </p>
                <p className={styles.ingredient_block__quantity}>
                  {ingredient.quantity} {ingredient.unit.name}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EditMyRecipe;
