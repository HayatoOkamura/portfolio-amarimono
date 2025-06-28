"use client";
import React from "react";
import { ResponsiveWrapper } from "../../common/ResponsiveWrapper";
import RecipeDetailSP from "./RecipeDetailSP";
import RecipeDetailPC from "./RecipeDetailPC";
import { Recipe } from "@/app/types/index";

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

/**
 * RecipeDetail
 *
 * レシピ詳細を表示するメインコンポーネント
 * - スマートフォンとPCで表示を切り替え
 * - レシピの詳細情報表示
 * - レビュー機能
 * - お気に入り機能
 */
const RecipeDetail = (props: RecipeDetailProps) => {
  return (
    <ResponsiveWrapper 
      breakpoint="sp"
      renderBelow={<RecipeDetailSP {...props} />}
      renderAbove={<RecipeDetailPC {...props} />}
    >
      <RecipeDetailPC {...props} />
    </ResponsiveWrapper>
  );
};

export default RecipeDetail;
