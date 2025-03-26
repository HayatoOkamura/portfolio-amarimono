/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import styles from "./user.module.scss";
import Image from "next/image";
import Link from "next/link";
import { backendUrl } from "../utils/apiUtils";
import { useAuth } from "@/app/hooks/useAuth";
import { useUserLikeCount, useUserRecipeAverageRating } from "@/app/hooks/user";
import { useRecommendedRecipes } from "@/app/hooks/recipes";
import { FaUserCircle } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { FaHeart } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { Recipe } from "@/app/types";

export default function UserPage() {
  const { user } = useAuth();
  console.log("UserPage - user:", user);
  console.log("UserPage - user?.id:", user?.id);

  const { likeCount, loading: likesLoading } = useUserLikeCount(user?.id);
  const { averageRating, loading: ratingLoading } = useUserRecipeAverageRating(
    user?.id
  );
  const { data: recommendedRecipes, isLoading: recommendedLoading, isError, error } = useRecommendedRecipes(user?.id);
  
  console.log("UserPage - recommendedRecipes:", recommendedRecipes);
  console.log("UserPage - isLoading:", recommendedLoading);
  console.log("UserPage - isError:", isError);
  console.log("UserPage - error:", error);

  const [recipeCount, setRecipeCount] = useState(0);

  useEffect(() => {
    if (recommendedRecipes) {
      setRecipeCount(recommendedRecipes.length);
    }
  }, [recommendedRecipes]);

  if (!user || recommendedLoading || likesLoading || ratingLoading) {
    return <p>Loading...</p>;
  }

  return (
    <section className={styles.profile_block}>
      <div className={styles.profile_block__head}>
        <div className={styles.profile_block__image}>
          {user && user.profileImage ? (
            <Image
              fill
              src={user.profileImage}
              alt="User Profile"
              className={styles.user_block__icon_img}
              unoptimized
            />
          ) : (
            <FaUserCircle />
          )}
        </div>
        <div className={styles.profile_block__detail}>
          <p className={styles.profile_block__name}>
            {user && user.username || "ゲスト"}
          </p>
          <p className={styles.profile_block__email}>{user && user.email}</p>
          <div className={styles.profile_block__list}>
            <div className={styles.item_block}>
              <div className={styles.item_block__icon}>
                <ImSpoonKnife />
              </div>
              <div className={styles.item_block__texts}>
                <p className={styles.item_block__num}>{recipeCount}</p>
                <p className={styles.item_block__text}>レシピ投稿数</p>
              </div>
            </div>
            <div className={styles.item_block}>
              <div className={styles.item_block__icon}>
                <FaHeart />
              </div>
              <div className={styles.item_block__texts}>
                <p className={styles.item_block__num}>{likeCount}</p>
                <p className={styles.item_block__text}>合計いいね数</p>
              </div>
            </div>
            <div className={styles.item_block}>
              <div className={styles.item_block__icon}>
                <FaStar />
              </div>
              <div className={styles.item_block__texts}>
                <p className={styles.item_block__num}>
                  {averageRating?.toFixed(1) ?? "0.0"}
                </p>
                <p className={styles.item_block__text}>レビュー平均</p>
              </div>
            </div>
          </div>
          <button className={styles.profile_block__btn}>
            <Link href="/user/edit">プロフィールを編集</Link>
          </button>
        </div>
      </div>

      <div className={styles.recommend_block}>
        <h2>おすすめのレシピ</h2>
        {recommendedLoading ? (
          <p>おすすめレシピを読み込み中...</p>
        ) : recommendedRecipes && recommendedRecipes.length === 0 ? (
          <p>おすすめのレシピはありません</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedRecipes?.map((recipe: Recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isFavoritePage={false}
                path="/recipes/"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
