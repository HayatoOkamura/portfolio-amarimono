/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import styles from "./user.module.scss";
import Image from "next/image";
import Link from "next/link";
import { backendUrl } from "../utils/api";
import { useAuth } from "@/app/hooks/useAuth";
import { useUserLikeCount, useUserRecipeAverageRating } from "@/app/hooks/user";
import { imageBaseUrl } from "@/app/utils/api";
import { useRecommendedRecipes } from "@/app/hooks/recipes";
import { FaUserCircle } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { FaHeart } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { Recipe } from "@/app/types/index";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";

// ユーザープロフィールコンポーネント
const UserProfile = ({ user }: { user: any }) => {
  const { likeCount, loading: isLikeCountLoading } = useUserLikeCount(user.id);
  const { averageRating, loading: isRatingLoading } = useUserRecipeAverageRating(user.id);
  const { data: recipes, isLoading: isRecipesLoading } = useRecommendedRecipes(user.id);
  const [recipeCount, setRecipeCount] = useState(0);

  useEffect(() => {
    if (recipes) {
      setRecipeCount(recipes.length);
    }
  }, [recipes]);

  const isLoading = isLikeCountLoading || isRatingLoading || isRecipesLoading;

  return (
    <PageLoading isLoading={isLoading}>
      <div className={styles.profile_block}>
        <div className={styles.profile_block__head}>
          <div className={styles.profile_block__image}>
            {user.profileImage ? (
              <Image
                src={user.profileImage}
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
            <h1 className={styles.profile_block__name}>{user.username || "名前未設定"}</h1>
            <p className={styles.profile_block__email}>{user.email}</p>
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

// ログインモーダルコンポーネント
const LoginModal = ({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) => {
  return (
    <div className={styles.login_modal}>
      <div className={styles.login_modal__inner}>
        <button
          className={styles.login_modal__close}
          onClick={onClose}
        >
          <span></span>
          <span></span>
        </button>
        <h2 className={styles.login_modal__title}>ログインしてください</h2>
        <button
          className={styles.login_modal__login}
          onClick={onLogin}
        >
          ログイン
        </button>
      </div>
    </div>
  );
};

// メインコンポーネント
export default function UserPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const router = useRouter();

  return (
    <PageLoading isLoading={isAuthLoading}>
      {!user ? (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => router.push('/login')}
        />
      ) : (
        <UserProfile user={user} />
      )}
    </PageLoading>
  );
}
