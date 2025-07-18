"use client";

import { useEffect, useState } from "react";
import styles from "./user.module.scss";
import OptimizedImage from "@/app/components/ui/OptimizedImage/OptimizedImage";
import Link from "next/link";
import { useUserLikeCount, useUserRecipeAverageRating } from "@/app/hooks/user";
import { imageBaseUrl } from "@/app/utils/api";
import { useRecommendedRecipes, useUserRecipes } from "@/app/hooks/recipes";
import { FaUserCircle } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { FaHeart } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { Recipe } from "@/app/types/index";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import { withAuth } from "@/app/components/auth/withAuth";
import { useUserStore } from "@/app/stores/userStore";
import { ResponsiveWrapper } from "../components/common/ResponsiveWrapper";

// ユーザープロフィールコンポーネント
const UserProfile = () => {
  const { user } = useUserStore();
  const { likeCount, loading: isLikeCountLoading } = useUserLikeCount(
    user?.id || ""
  );
  const { averageRating, loading: isRatingLoading } =
    useUserRecipeAverageRating(user?.id || "");
  const { data: recipes, isLoading: isRecipesLoading } = useRecommendedRecipes(
    user?.id || ""
  );
  const { data: userRecipes, isLoading: isUserRecipesLoading } = useUserRecipes(
    user?.id || ""
  );
  const [recipeCount, setRecipeCount] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (userRecipes) {
      setRecipeCount(userRecipes.length);
    }
  }, [userRecipes]);

  const isLoading = isLikeCountLoading || isRatingLoading || isRecipesLoading || isUserRecipesLoading;

  const handleImageError = () => {
    console.error("Error loading profile image");
    setImageError(true);
  };

  if (!user) {
    return <div>ユーザー情報の取得に失敗しました</div>;
  }

  return (
    <PageLoading isLoading={isLoading}>
      <div className={styles.profile_block}>
        <div className={styles.profile_block__head}>
          <div className={styles.profile_block__image}>
            {user.profileImage && !imageError ? (
              <OptimizedImage
                src={`${imageBaseUrl}/${user.profileImage}`}
                alt="User Profile"
                width={100}
                height={100}
                onError={handleImageError}
                priority
              />
            ) : (
              <FaUserCircle size={100} />
            )}
          </div>
          <div className={styles.profile_block__detail}>
            <h1 className={styles.profile_block__name}>
              {user.username || "名前未設定"}
            </h1>
            <p className={styles.profile_block__email}>{user.email}</p>
            <ResponsiveWrapper breakpoint="sp" renderBelow={null}>
              <div className={styles.profile_block__list}>
                <div className={styles.item_block}>
                  <div className={styles.item_block__icon}>
                    <ImSpoonKnife />
                  </div>
                  <div className={styles.item_block__num}>{recipeCount}</div>
                  <div className={styles.item_block__text}>レシピ投稿数</div>
                </div>
                <div className={styles.item_block}>
                  <div className={styles.item_block__icon}>
                    <FaHeart />
                  </div>
                  <div className={styles.item_block__num}>{likeCount}</div>
                  <div className={styles.item_block__text}>合計いいね数</div>
                </div>
                <div className={styles.item_block}>
                  <div className={styles.item_block__icon}>
                    <FaStar />
                  </div>
                  <div className={styles.item_block__num}>
                    {averageRating?.toFixed(1) ?? "0.0"}
                  </div>
                  <div className={styles.item_block__text}>レビュー平均</div>
                </div>
              </div>
            </ResponsiveWrapper>
            <div className={styles.profile_block__btn}>
              <Link href="/user/edit">プロフィールを編集</Link>
            </div>
          </div>
        </div>

        <ResponsiveWrapper breakpoint="sp" renderAbove={null}>
          <div className={styles.profile_block__list}>
            <div className={styles.item_block}>
              <div className={styles.item_block__icon}>
                <ImSpoonKnife />
              </div>
              <div className={styles.item_block__num}>{recipeCount}</div>
              <div className={styles.item_block__text}>レシピ投稿数</div>
            </div>
            <div className={styles.item_block}>
              <div className={styles.item_block__icon}>
                <FaHeart />
              </div>
              <div className={styles.item_block__num}>{likeCount}</div>
              <div className={styles.item_block__text}>合計いいね数</div>
            </div>
            <div className={styles.item_block}>
              <div className={styles.item_block__icon}>
                <FaStar />
              </div>
              <div className={styles.item_block__num}>
                {averageRating?.toFixed(1) ?? "0.0"}
              </div>
              <div className={styles.item_block__text}>レビュー平均</div>
            </div>
          </div>
        </ResponsiveWrapper>
        <div className={styles.recommend_block}>
          <h2 className={styles.recommend_block__title}>あなたにおすすめのレシピ</h2>
          {recipes && recipes.length > 0 ? (
            <div className={styles.recommend_block__inner}>
              <div className={styles.recommend_block__contents}>
                {recipes.map((recipe: Recipe) => (
                  <div key={recipe.id} className={styles.recommend_block__card}>
                    <RecipeCard
                      recipe={recipe}
                      isFavoritePage={false}
                      path="/recipes/"
                      isLink={true}
                      href={`/recipes/${recipe.id}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.recommend_block__no_recipe}>
              おすすめのレシピはありません
            </div>
          )}
        </div>
      </div>
    </PageLoading>
  );
};

// メインコンポーネント
function UserProfileClient() {
  return <UserProfile />;
}

export default withAuth(UserProfileClient); 