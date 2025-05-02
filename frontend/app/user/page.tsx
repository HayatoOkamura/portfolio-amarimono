/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import styles from "./user.module.scss";
import Image from "next/image";
import Link from "next/link";
import { backendUrl } from "../utils/api";
import { useAuth } from "@/app/hooks/useAuth";
import { useUserLikeCount, useUserRecipeAverageRating } from "@/app/hooks/user";
import { useRecommendedRecipes } from "@/app/hooks/recipes";
import { FaUserCircle } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { FaHeart } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import RecipeCard from "@/app/components/ui/Cards/RecipeCard/RecipeCard";
import { Recipe } from "@/app/types/index";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";

// ユーザープロフィールコンポーネント
const UserProfile = ({ user }: { user: any }) => {
  const { likeCount } = useUserLikeCount(user.id);
  const { averageRating } = useUserRecipeAverageRating(user.id);
  const { data: recipes, isLoading: isRecipesLoading } = useRecommendedRecipes(user.id);
  const [recipeCount, setRecipeCount] = useState(0);

  useEffect(() => {
    if (recipes) {
      setRecipeCount(recipes.length);
    }
  }, [recipes]);

  return (
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
            <FaUserCircle />
          )}
        </div>
        <div className={styles.profile_block__detail}>
          <h1 className={styles.profile_block__name}>{user.username || "ゲスト"}</h1>
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
        <h2>おすすめレシピ</h2>
        {isRecipesLoading ? (
          <div>Loading...</div>
        ) : recipes && recipes.length > 0 ? (
          <div className={styles.grid}>
            {recipes.map((recipe: Recipe) => (
              <div key={recipe.id} className={styles.card_block}>
                <div className={styles.card_block__img}>
                  <Image
                    src={recipe.imageUrl || '/images/default-recipe.jpg'}
                    alt={recipe.name}
                    width={300}
                    height={200}
                  />
                </div>
                <h3 className={styles.card_block__name}>{recipe.name}</h3>
                <p className={styles.card_block__genre}>{recipe.genre?.name || '未分類'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div>おすすめのレシピはありません</div>
        )}
      </div>
    </div>
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

  // ローディング中の表示を改善
  if (isAuthLoading) {
    console.log('UserPage: Loading state');
    return <div className={styles.loading}>Loading...</div>;
  }

  // ユーザーが存在しない場合の処理を改善
  if (!user) {
    console.log('UserPage: No user, showing login modal');
    return (
      <LoginModal
        onClose={() => setShowLoginModal(false)}
        onLogin={() => router.push('/login')}
      />
    );
  }
  return <UserProfile user={user} />;
}
