/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import styles from "./user.module.scss";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/hooks/useAuth";
import { useUserLikeCount, useUserRecipeAverageRating } from "@/app/hooks/user";
import useRecipeStore from "@/app/stores/recipeStore";
import { FaUserCircle } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { FaHeart } from "react-icons/fa";
import { FaStar } from "react-icons/fa";

export default function UserPage() {
  const { user, isLoading } = useAuth();
  const { likeCount, loading: likesLoading } = useUserLikeCount(user?.id);
  const { averageRating, loading: ratingLoading } = useUserRecipeAverageRating(
    user?.id
  );
  const { fetchUserRecipes, recipes } = useRecipeStore();
  const [recipeCount, setRecipeCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchUserRecipes(user.id); // Fetch recipes when the user id is available
    }
  }, [user?.id, fetchUserRecipes]);

  useEffect(() => {
    setRecipeCount(recipes.length);
  }, [recipes]);

  if (isLoading) return <p>Loading...</p>;
  if (!user) return <p>Redirecting to login...</p>;

  console.log(averageRating);

  return (
    <section className={styles.profile_block}>
      <div className={styles.profile_block__head}>
        <div className={styles.profile_block__image}>
          {user.profileImage ? (
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
            {user.username || "ゲスト"}
          </p>
          <p className={styles.profile_block__email}>{user.email}</p>
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
                <p className={styles.item_block__num}>
                  {likesLoading ? "Loading..." : likeCount ?? 0}
                </p>
                <p className={styles.item_block__text}>合計いいね数</p>
              </div>
            </div>
            <div className={styles.item_block}>
              <div className={styles.item_block__icon}>
                <FaStar />
              </div>
              <div className={styles.item_block__texts}>
                <p className={styles.item_block__num}>
                  {ratingLoading
                    ? "Loading..."
                    : averageRating?.toFixed(1) ?? "0.0"}
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
    </section>
  );
}
