/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import styles from "./user.module.scss";
import Image from "next/image";
import Link from "next/link";
// import { backendUrl } from "../utils/api";
import { useAuth } from "@/app/hooks/useAuth";
import { useUserLikeCount, useUserRecipeAverageRating, useUser } from "@/app/hooks/user";
import { imageBaseUrl } from "@/app/utils/api";
import { useRecommendedRecipes } from "@/app/hooks/recipes";
import { FaUserCircle } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { FaHeart } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { Recipe } from "@/app/types/index";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import { withAuth } from "@/app/components/auth/withAuth";

interface User {
  id: string;
  email: string;
  username?: string;
  profileImage?: string;
  age?: number;
  gender?: string;
  email_confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}

// ユーザープロフィールコンポーネント
const UserProfile = ({ userId }: { userId: string }) => {
  const { user: userDetails, loading: isUserLoading, error: userError } = useUser(userId);
  const { likeCount, loading: isLikeCountLoading } = useUserLikeCount(userId);
  const { averageRating, loading: isRatingLoading } = useUserRecipeAverageRating(userId);
  const { data: recipes, isLoading: isRecipesLoading } = useRecommendedRecipes(userId);
  const [recipeCount, setRecipeCount] = useState(0);

  useEffect(() => {
    if (recipes) {
      setRecipeCount(recipes.length);
    }
  }, [recipes]);

  const isLoading = isUserLoading || isLikeCountLoading || isRatingLoading || isRecipesLoading;

  useEffect(() => {
    console.log("User data:", userDetails);
  }, [userDetails]);

  if (userError) {
    return <div>ユーザー情報の取得に失敗しました</div>;
  }

  return (
    <PageLoading isLoading={isLoading}>
      <div className={styles.profile_block}>
        <div className={styles.profile_block__head}>
          <div className={styles.profile_block__image}>
            {userDetails?.profileImage ? (
              <Image
                src={`${imageBaseUrl}/${userDetails.profileImage}`}
                alt="User Profile"
                className={styles.user_block__icon_img}
                width={100}
                height={100}
              />
            ) : (
              <FaUserCircle size={100} />
            )}
          </div>
          <div className={styles.profile_block__detail}>
            <h1 className={styles.profile_block__name}>{userDetails?.username || "名前未設定"}</h1>
            <p className={styles.profile_block__email}>{userDetails?.email}</p>
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
                <div className={styles.item_block__num}>{averageRating?.toFixed(1) ?? "0.0"}</div>
                <div className={styles.item_block__text}>レビュー平均</div>
              </div>
            </div>
            <div className={styles.profile_block__btn}>
              <Link href="/user/edit">プロフィールを編集</Link>
            </div>
          </div>
        </div>
        <div className={styles.recommend_block}>
          <h2 className={styles.recommend_block__title}>おすすめレシピ</h2>
          {recipes && recipes.length > 0 ? (
            <div className={styles.recommend_block__inner}>
                <div className={styles.recommend_block__contents}>
                {recipes.map((recipe: Recipe) => (
                  <div key={recipe.id} className={styles.recommend_block__card}>
                    <RecipeCard
                      recipe={recipe}
                      isFavoritePage={false}
                      path="/recipes/"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>おすすめのレシピはありません</div>
          )}
        </div>
      </div>
    </PageLoading>
  );
};

// メインコンポーネント
function UserPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // withAuth HOCがリダイレクトを処理するため
  }

  return <UserProfile userId={user.id} />;
}

export default withAuth(UserPage);
