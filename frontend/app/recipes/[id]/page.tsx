/* eslint-disable */
"use client";
import styles from "./recipe.detail.module.scss";
import { backendUrl } from "@/app/utils/apiUtils";
import ResponsivePieChart from "@/app/components/ui/PieChart/PieChart";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Recipe } from "@/app/types/index";
import Image from "next/image";
import { fetchRecipeByIdService } from "@/app/hooks/recipes";
import { handleLikeService } from "@/app/hooks/recipes";
import { useUserStore } from "@/app/stores/userStore";
import { calculateAverageRating } from "@/app/utils/calculateAverageRating";
import StarRating from "@/app/components/ui/StarRating/StarRating";
import { IoMdTime } from "react-icons/io";
import { RiMoneyCnyCircleLine } from "react-icons/ri";

const RecipeDetailPage = () => {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewValue, setReviewValue] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const { user } = useUserStore();

  useEffect(() => {
    const id = window.location.pathname.split("/").pop(); // URLからID取得

    if (id) {
      fetchRecipeByIdService(id)
        .then((recipe) => {
          setRecipe(recipe);
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
          const data = await response.json();
          setIsLiked(true);
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkLikeStatus();
  }, [recipe, user]);

  const averageRating = recipe
    ? calculateAverageRating(recipe.reviews || []) // reviewsがundefinedの場合、空の配列を渡す
    : 0;

  const fullStars = Math.floor(averageRating);
  const remainder = averageRating - fullStars;

  const handleLike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!recipe) return;

    handleLikeService(user.id, recipe.id, setIsLiked, setShowLoginModal);
  };

  // レビューを送信する関数
  const handleReviewSubmit = async () => {
    if (!user || !recipe) return;

    const response = await fetch(`${backendUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        recipeId: recipe.id, // レビューがどのレシピに紐づくかを明示する
        rating: reviewValue,
        comment: reviewText,
      }),
    });

    if (response.ok) {
      alert("レビューが送信されました");
    } else {
      alert("レビュー送信に失敗しました");
    }
  };

  if (!recipe) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.recipe_block}>
      <div className={styles.recipe_block__inner}>
        <div className={styles.description_block}>
          <div className={styles.description_block__img}>
            <Image
              fill
              src={recipe.imageUrl ? `${backendUrl}/uploads/${recipe.imageUrl}` : "/default-image.jpg"}
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
                    src={step.imageUrl ? `${backendUrl}/uploads/${step.imageUrl}` : "/default-image.jpg"}
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
              <StarRating
                reviews={recipe.reviews}
                className={styles.align_center}
              />
              <p className={styles.detail_block__text}>
                {averageRating.toFixed(1)}{" "}
                <span>({recipe.reviews?.length ?? 0}件)</span>
              </p>
            </div>
            <div className={styles.detail_block__item}>
              <p className={styles.detail_block__title}><IoMdTime />調理時間</p>
              <p className={styles.detail_block__text}><span>約</span>{recipe.cookingTime}<span>分</span></p>
            </div>
            <div className={styles.detail_block__item}>
              <p className={styles.detail_block__title}><RiMoneyCnyCircleLine />費用目安</p>
              <p className={styles.detail_block__text}>{recipe.costEstimate}<span>円</span><span className={styles["small"]}>前後</span></p>
            </div>
          </div>
          <div className={styles.interaction_block}>
            <div className={`${styles.interaction_block__item} ${styles["interaction_block__item--likes"]}`}>
              <button
                onClick={handleLike}
              >
                {isLiked ? "お気に入り済み" : "お気に入り"}
              </button>
            </div>
            <div className={`${styles.interaction_block__item} ${styles["interaction_block__item--review"]}`}>
              <button
                onClick={() => setShowReviewModal(true)} // レビュー用モーダルを表示
              >
                レビューを投稿
              </button>
            </div>
          </div>
          <p className={styles.info_block__summary}>{recipe.summary}</p>
          <ul className={styles.nutrition_block}>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                カロリー{recipe.nutrition && recipe.nutrition.calories}
              </p>
              <ResponsivePieChart value={recipe.nutritionPercentage ? recipe.nutritionPercentage.calories : 0} type="calories" />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                炭水化物{recipe.nutrition && recipe.nutrition.carbohydrates}
              </p>
              <ResponsivePieChart value={recipe.nutritionPercentage ? recipe.nutritionPercentage.carbohydrates : 0} type="carbohydrates" />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                脂質{recipe.nutrition && recipe.nutrition.fat}
              </p>
              <ResponsivePieChart value={recipe.nutritionPercentage ? recipe.nutritionPercentage.fat : 0} type="fat" />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                タンパク質{recipe.nutrition && recipe.nutrition.protein}
              </p>
              <ResponsivePieChart value={recipe.nutritionPercentage ? recipe.nutritionPercentage.protein : 0} type="protein" />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                塩分{recipe.nutrition && recipe.nutrition.salt}
              </p>
              <ResponsivePieChart value={recipe.nutritionPercentage ? recipe.nutritionPercentage.salt : 0} type="salt" />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                糖分{recipe.nutrition && recipe.nutrition.sugar}
              </p>
              <ResponsivePieChart value={recipe.nutritionPercentage ? recipe.nutritionPercentage.sugar : 0} type="sugar" />
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

      {showReviewModal && (
        <div className={styles.review_modal}>
          <div className={styles.review_modal__inner}>
            <button
              className={styles.review_modal__close}
              onClick={() => setShowReviewModal(false)} // モーダルを閉じる
            >
              ✖
            </button>
            <h2>レビューを投稿</h2>
            <div className={styles.review_modal__stars}>
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  onClick={() => setReviewValue(index + 1)}
                  className={styles.review_modal__star}
                >
                  <span
                    className={
                      reviewValue > index ? styles["yellow"] : styles["gray"]
                    }
                  >
                    ★
                  </span>
                </div>
              ))}
            </div>
            <textarea
              className={styles.review_modal__textarea}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="レビューを入力してください"
            />
            <button
              className={styles.review_modal__submit}
              onClick={handleReviewSubmit}
            >
              送信
            </button>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className={styles.login_modal}>
          <div className={styles.login_modal__inner}>
            <button
              className={styles.login_modal__close}
              onClick={() => setShowLoginModal(false)}
            >
              ✖
            </button>
            <p>ログインしてください</p>
            <button
              className={styles.login_modal__login}
              onClick={() => router.push("/login/")}
            >
              ログイン
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetailPage;
