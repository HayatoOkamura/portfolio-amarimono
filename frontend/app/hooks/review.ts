/* eslint-disable */

import { backendUrl } from "@/app/utils/apiUtils";
import { Review } from "@/app/types/index"; // レビューデータの型定義

// Goのレスポンスをキャメルケースに変換する関数
const convertReview = (review: any): Review => ({
  id: review.ID,
  recipeId: review.RecipeID,
  userId: review.UserID,
  rating: review.Rating,
  comment: review.Comment,
  createdAt: review.CreatedAt,
  updatedAt: review.UpdatedAt,
});

// レシピごとのレビューを取得
export const fetchReviewsByRecipeID = async (recipeId: string): Promise<Review[]> => {
  try {
    const response = await fetch(`${backendUrl}/api/reviews/${recipeId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch reviews");
    }
    const data = await response.json();
    return data.map(convertReview);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    throw error;
  }
};

// ユーザーごとのレビューを取得
export const fetchReviewsByUserID = async (userId: string): Promise<Review[]> => {
  try {
    const response = await fetch(`${backendUrl}/api/reviews/user/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user reviews");
    }
    const data = await response.json();
    return data.map(convertReview);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    throw error;
  }
};

// 新しいレビューを追加
export const addReview = async (review: Omit<Review, "id" | "created_at" | "updated_at">): Promise<Review> => {
  try {
    const response = await fetch(`${backendUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(review),
    });
    if (!response.ok) {
      throw new Error("Failed to add review");
    }
    const data = await response.json();
    return convertReview(data);
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

// レビューを更新
export const updateReview = async (id: string, updatedReview: Partial<Review>): Promise<Review> => {
  try {
    const response = await fetch(`${backendUrl}/api/reviews/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedReview),
    });
    if (!response.ok) {
      throw new Error("Failed to update review");
    }
    const data = await response.json();
    return convertReview(data);
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
};

// レビューを削除
export const deleteReview = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${backendUrl}/api/reviews/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete review");
    }
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};
