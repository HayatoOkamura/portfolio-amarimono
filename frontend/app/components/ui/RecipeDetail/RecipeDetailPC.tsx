import styles from "./RecipeDetail.module.scss";
import { imageBaseUrl } from "@/app/utils/api";
import ResponsivePieChart from "@/app/components/ui/PieChart/PieChart";
import { Recipe, Review } from "@/app/types/index";
import Image from "next/image";
import { IoMdTime } from "react-icons/io";
import { RiMoneyCnyCircleLine } from "react-icons/ri";
import { FaHeart } from "react-icons/fa";
import { MdOutlineRateReview } from "react-icons/md";
import { memo, useEffect, useState } from "react";

import StarRating from "@/app/components/ui/StarRating/StarRating";
import { calculateAverageRating } from "@/app/utils/calculateAverageRating";
import { FaStar } from "react-icons/fa";
import { FaFire } from "react-icons/fa";
import { BiSolidBowlRice } from "react-icons/bi";
import { FaTint } from "react-icons/fa";
import { GiMeat } from "react-icons/gi";
import { TbSalt } from "react-icons/tb";
import LoginModal from "@/app/components/ui/LoginModal/LoginModal";
import { fetchReviewsByRecipeID } from "@/app/hooks/review";

const PRESENCE_UNITS = ["適量", "少々", "ひとつまみ"] as const;

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
  userId?: string;
  setShowLoginModal: (show: boolean) => void;
}

const RecipeDetailPC = memo(
  ({
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
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);

    useEffect(() => {
      const loadReviews = async () => {
        console.log("🌀loadReviews");
        setIsLoadingReviews(true);
        try {
          const fetchedReviews = await fetchReviewsByRecipeID(recipe.id);
          console.log("🌀fetchedReviews", fetchedReviews);
          // ratingが高い順にソートし、最大4件を取得
          const sortedReviews = fetchedReviews
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 4);
          setReviews(sortedReviews);
        } catch (error) {
          console.error("Error loading reviews:", error);
        } finally {
          setIsLoadingReviews(false);
        }
      };

      loadReviews();
    }, [recipe.id]);

    return (
      <div
        className={`${styles.recipe_block} ${
          isAdmin ? styles["recipe_block--admin"] : ""
        }`}
      >
        <div className={styles.recipe_block__inner}>
          <div className={styles.recipe_block__contents}>
            <div className={styles.description_block}>
              <div className={styles.description_block__img}>
                <Image
                  src={
                    recipe.imageUrl
                      ? `${imageBaseUrl}/${recipe.imageUrl}`
                      : "/pic_recipe_default.webp"
                  }
                  alt={recipe.name}
                  width={500}
                  height={500}
                  priority
                />
              </div>
              <section className={styles.instruction_block}>
                <div className={styles.instruction_block__head}>
                  <h2 className={styles.instruction_block__title}>作り方</h2>
                  <p className={styles.instruction_block__note}>※画像はイメージです</p>
                </div>
                <ol className={styles.instruction_block__list}>
                  {recipe.instructions.map((step, idx) => (
                    <li className={styles.instruction_block__item} key={idx}>
                      {step.imageUrl && (
                        <div className={styles.instruction_block__sub_img}>
                          <Image
                            src={
                              step.imageUrl
                                ? `${imageBaseUrl}/${step.imageUrl}`
                                : "/pic_recipe_default.webp"
                            }
                            alt={recipe.name}
                            width={100}
                            height={100}
                          />
                        </div>
                      )}
                      <div className={styles.instruction_block__contents}>
                        <strong className={styles.instruction_block__label}>
                          {step.stepNumber}
                        </strong>
                        <p className={styles.instruction_block__text}>
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
            <div className={styles.info_block}>
              {isAdmin && (
                <div className={styles.admin_actions}>
                  <button
                    onClick={onEdit}
                    className={`${styles.admin_actions__button} ${styles["admin_actions__button--edit"]}`}
                  >
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
              <p className={styles.info_block__catchphrase}>
                {recipe.catchphrase}
              </p>
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
                    className={`${styles.interaction_block__item} ${
                      styles["interaction_block__item--likes"]
                    } ${
                      isLiked ? styles["interaction_block__item--is-liked"] : ""
                    }`}
                  >
                    <button onClick={onLike}>
                      <span>
                        <FaHeart />
                      </span>
                      {isLiked ? "お気に入り済み" : "お気に入り"}
                    </button>
                  </div>
                  <div
                    className={`${styles.interaction_block__item} ${styles["interaction_block__item--review"]}`}
                  >
                    <button onClick={onReview}>
                      <span>
                        <MdOutlineRateReview />
                      </span>
                      レビューを投稿
                    </button>
                  </div>
                </div>
              )}
              <p className={styles.info_block__summary}>{recipe.summary}</p>
              <ul className={styles.nutrition_block}>
                <li className={styles.nutrition_block__item}>
                  <div className={styles.nutrition_block__texts}>
                    <p className={styles.nutrition_block__title}><span>
                      <FaFire />カロリー
                    </span></p>
                    <p className={styles.nutrition_block__num}>
                      {recipe.nutrition && recipe.nutrition.calories.toFixed(1)}
                      <span>kcal</span>
                    </p>
                  </div>
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
                  <div className={styles.nutrition_block__texts}>
                    <p className={styles.nutrition_block__title}><span>
                      <BiSolidBowlRice />炭水化物
                    </span></p>
                    <p className={styles.nutrition_block__num}>
                      {recipe.nutrition && recipe.nutrition.carbohydrates.toFixed(1)}
                      <span>g</span>
                    </p>
                  </div>
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
                  <div className={styles.nutrition_block__texts}>
                    <p className={styles.nutrition_block__title}><span>
                      <FaTint />脂質
                    </span></p>
                    <p className={styles.nutrition_block__num}>
                      {recipe.nutrition && recipe.nutrition.fat.toFixed(1)}
                      <span>g</span>
                    </p>
                  </div>
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
                  <div className={styles.nutrition_block__texts}>
                    <p className={styles.nutrition_block__title}><span>
                      <GiMeat />タンパク質
                    </span></p>
                    <p className={styles.nutrition_block__num}>
                      {recipe.nutrition && recipe.nutrition.protein.toFixed(1)}
                      <span>g</span>
                    </p>
                  </div>
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
                  <div className={styles.nutrition_block__texts}>
                    <p className={styles.nutrition_block__title}><span>
                      <TbSalt />塩分
                    </span></p>
                    <p className={styles.nutrition_block__num}>
                      {recipe.nutrition && recipe.nutrition.salt.toFixed(1)}
                      <span>g</span>
                    </p>
                  </div>
                  <ResponsivePieChart
                    value={
                      recipe.nutritionPercentage
                        ? recipe.nutritionPercentage.salt
                        : 0
                    }
                    type="salt"
                  />
                </li>
              </ul>
              <div className={styles.nutrition_block__disclaimer}>
                <p>※ 栄養成分値は参考値です。</p>
                <p>※ 各具材の栄養成分値を基に計算しています。</p>
                <p>※ データソース: 文部科学省「日本食品標準成分表2020年版（八訂）」</p>
                <p>※ 実際の調理方法や具材の量によって栄養成分値は変動する可能性があります。</p>
              </div>
              <section className={styles.ingredient_block}>
                <h3 className={styles.ingredient_block__title}>
                  材料【1人分】
                </h3>
                <ul className={styles.ingredient_block__list}>
                  {recipe.ingredients.map((ingredient, idx) => (
                    <li className={styles.ingredient_block__item} key={idx}>
                      <p className={styles.ingredient_block__name}>
                        {ingredient.name}
                      </p>
                      <p className={styles.ingredient_block__quantity}>
                        {PRESENCE_UNITS.includes(ingredient.unit.name as typeof PRESENCE_UNITS[number])
                          ? ingredient.unit.name
                          : ingredient.unit.name === "大さじ" || ingredient.unit.name === "小さじ"
                            ? `${ingredient.unit.name}${Number.isInteger(ingredient.quantity)
                                ? ingredient.quantity
                                : Number(ingredient.quantity).toFixed(1)}`
                            : `${Number.isInteger(ingredient.quantity)
                                ? ingredient.quantity
                                : Number(ingredient.quantity).toFixed(1)}${ingredient.unit.name}`}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
          {recipe.faq && recipe.faq.length > 0 && (
            <section className={styles.faq_block}>
              <h3 className={styles.faq_block__title}>よくある質問</h3>
              <ul className={styles.faq_block__list}>
                {recipe.faq.map((faq, idx) => (
                  <li className={styles.faq_block__item} key={idx}>
                    <h4 className={styles.faq_block__question}>
                      <span>Q</span>{faq.question}
                    </h4>
                    <p className={styles.faq_block__answer}><span>A</span>{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={styles.review_block}>
            <h3 className={styles.review_block__title}>レビュー</h3>
            {isLoadingReviews ? (
              <div className={styles.review_block__empty}>読み込み中...</div>
            ) : reviews.length > 0 ? (
              <ul className={styles.review_block__list}>
                {reviews.map((review) => (
                  <li className={styles.review_block__item} key={review.id}>
                    <div className={styles.review_block__header}>
                      <div className={styles.review_block__rating}>
                        <StarRating
                          reviews={[{ rating: review.rating }]}
                          size={16}
                        />
                        <span className={styles.review_block__rating_text}>
                          {review.rating}.0
                        </span>
                      </div>
                      <span className={styles.review_block__date}>
                        {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    {review.comment && (
                      <p className={styles.review_block__comment}>
                        {review.comment}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.review_block__empty}>
                まだレビューがありません
              </div>
            )}
          </section>
        </div>

        {showReviewModal && (
          <div className={styles.review_modal}>
            <div className={styles.review_modal__inner}>
              <button
                className={styles.review_modal__close}
                onClick={onCloseReviewModal}
              >
                <span></span>
                <span></span>
              </button>
              <h2 className={styles.review_modal__title}>レビューを投稿</h2>
              <div className={styles.review_modal__stars}>
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    onClick={() => onReviewValueChange?.(index + 1)}
                    className={styles.review_modal__star}
                  >
                    <FaStar className={styles.gray} />
                    {index < reviewValue && (
                      <span className={styles.yellow}>
                        <FaStar />
                      </span>
                    )}
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

        {showLoginModal && onLogin && (
          <LoginModal
            onLogin={onLogin}
            onClose={onCloseLoginModal}
          />
        )}
      </div>
    );
  }
);

RecipeDetailPC.displayName = 'RecipeDetailPC';

export default RecipeDetailPC; 