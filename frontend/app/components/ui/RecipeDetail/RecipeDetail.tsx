import styles from "./RecipeDetail.module.scss";
import { backendUrl } from "@/app/utils/apiUtils";
import ResponsivePieChart from "@/app/components/ui/PieChart/PieChart";
import { Recipe } from "@/app/types/index";
import Image from "next/image";
import { IoMdTime } from "react-icons/io";
import { RiMoneyCnyCircleLine } from "react-icons/ri";
import StarRating from "@/app/components/ui/StarRating/StarRating";
import { calculateAverageRating } from "@/app/utils/calculateAverageRating";

interface RecipeDetailProps {
  recipe: Recipe;
  isAdmin?: boolean;
  onEdit?: () => void;
  onPublish?: () => void;
  onDelete?: () => void;
  onLike?: () => void;
  onReview?: () => void;
  isLiked?: boolean;
  showLoginModal?: boolean;
  showReviewModal?: boolean;
  reviewValue?: number;
  reviewText?: string;
  onReviewSubmit?: () => void;
  onReviewTextChange?: (text: string) => void;
  onReviewValueChange?: (value: number) => void;
  onCloseReviewModal?: () => void;
  onCloseLoginModal?: () => void;
  onLogin?: () => void;
}

const RecipeDetail = ({
  recipe,
  isAdmin = false,
  onEdit,
  onPublish,
  onDelete,
  onLike,
  onReview,
  isLiked,
  showLoginModal,
  showReviewModal,
  reviewValue = 0,
  reviewText = "",
  onReviewSubmit,
  onReviewTextChange,
  onReviewValueChange,
  onCloseReviewModal,
  onCloseLoginModal,
  onLogin,
}: RecipeDetailProps) => {
  const averageRating = calculateAverageRating(recipe.reviews || []);

  return (
    <div
      className={`${styles.recipe_block} ${
        isAdmin ? styles["recipe_block--admin"] : ""
      }`}
    >
      <div className={styles.recipe_block__inner}>
        <div className={styles.description_block}>
          <div className={styles.description_block__img}>
            <Image
              fill
              src={
                recipe.imageUrl
                  ? `${backendUrl}/uploads/${recipe.imageUrl}`
                  : "/pic_recipe_default.webp"
              }
              alt={recipe.name}
              unoptimized
            />
          </div>
          <ol className={styles.description_block__list}>
            {recipe.instructions.map((step, idx) => (
              <li className={styles.description_block__item} key={idx}>
                {step.imageUrl && (
                  <div className={styles.description_block__sub_img}>
                    <Image
                      fill
                      src={
                        step.imageUrl
                          ? `${backendUrl}/uploads/${step.imageUrl}`
                          : "/pic_recipe_default.webp"
                      }
                      alt={recipe.name}
                      unoptimized
                    />
                  </div>
                )}

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
          {isAdmin && (
            <div className={styles.admin_actions}>
              <button onClick={onEdit} className={`${styles.admin_actions__button} ${styles["admin_actions__button--edit"]}`}>
                編集
              </button>
              <button
                onClick={onPublish}
                className={`${styles.admin_actions__button} ${
                  recipe.isPublic
                    ? styles["admin_actions__button--unpublish"]
                    : styles["admin_actions__button--publish"]
                }`}
              >
                {recipe.isPublic ? "非公開にする" : "公開する"}
              </button>
              <button
                onClick={onDelete}
                className={`${styles.admin_actions__button} ${styles["admin_actions__button--delete"]}`}
              >
                削除
              </button>
            </div>
          )}
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
              <p className={styles.detail_block__title}>
                <IoMdTime />
                調理時間
              </p>
              <p className={styles.detail_block__text}>
                <span>約</span>
                {recipe.cookingTime}
                <span>分</span>
              </p>
            </div>
            <div className={styles.detail_block__item}>
              <p className={styles.detail_block__title}>
                <RiMoneyCnyCircleLine />
                費用目安
              </p>
              <p className={styles.detail_block__text}>
                {recipe.costEstimate}
                <span>円</span>
                <span className={styles["small"]}>前後</span>
              </p>
            </div>
          </div>
          {!isAdmin && (
            <div className={styles.interaction_block}>
              <div
                className={`${styles.interaction_block__item} ${styles["interaction_block__item--likes"]}`}
              >
                <button onClick={onLike}>
                  {isLiked ? "お気に入り済み" : "お気に入り"}
                </button>
              </div>
              <div
                className={`${styles.interaction_block__item} ${styles["interaction_block__item--review"]}`}
              >
                <button onClick={onReview}>レビューを投稿</button>
              </div>
            </div>
          )}
          <p className={styles.info_block__summary}>{recipe.summary}</p>
          <ul className={styles.nutrition_block}>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                カロリー{recipe.nutrition && recipe.nutrition.calories}
              </p>
              <ResponsivePieChart
                value={
                  recipe.nutritionPercentage
                    ? recipe.nutritionPercentage.calories
                    : 0
                }
                type="calories"
              />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                炭水化物{recipe.nutrition && recipe.nutrition.carbohydrates}
              </p>
              <ResponsivePieChart
                value={
                  recipe.nutritionPercentage
                    ? recipe.nutritionPercentage.carbohydrates
                    : 0
                }
                type="carbohydrates"
              />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                脂質{recipe.nutrition && recipe.nutrition.fat}
              </p>
              <ResponsivePieChart
                value={
                  recipe.nutritionPercentage
                    ? recipe.nutritionPercentage.fat
                    : 0
                }
                type="fat"
              />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                タンパク質{recipe.nutrition && recipe.nutrition.protein}
              </p>
              <ResponsivePieChart
                value={
                  recipe.nutritionPercentage
                    ? recipe.nutritionPercentage.protein
                    : 0
                }
                type="protein"
              />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                塩分{recipe.nutrition && recipe.nutrition.salt}
              </p>
              <ResponsivePieChart
                value={
                  recipe.nutritionPercentage
                    ? recipe.nutritionPercentage.salt
                    : 0
                }
                type="salt"
              />
            </li>
            <li className={styles.nutrition_block__item}>
              <p className={styles.nutrition_block__title}>
                糖分{recipe.nutrition && recipe.nutrition.sugar}
              </p>
              <ResponsivePieChart
                value={
                  recipe.nutritionPercentage
                    ? recipe.nutritionPercentage.sugar
                    : 0
                }
                type="sugar"
              />
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
              onClick={onCloseReviewModal}
            >
              ✖
            </button>
            <h2>レビューを投稿</h2>
            <div className={styles.review_modal__stars}>
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  onClick={() => onReviewValueChange?.(index + 1)}
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
              onChange={(e) => onReviewTextChange?.(e.target.value)}
              placeholder="レビューを入力してください"
            />
            <button
              className={styles.review_modal__submit}
              onClick={onReviewSubmit}
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
              onClick={onCloseLoginModal}
            >
              ✖
            </button>
            <p>ログインしてください</p>
            <button className={styles.login_modal__login} onClick={onLogin}>
              ログイン
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;
