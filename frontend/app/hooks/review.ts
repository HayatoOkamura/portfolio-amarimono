/* eslint-disable */

import { backendUrl } from "@/app/utils/api";
import { Review } from "@/app/types/index"; // レビューデータの型定義

// Goのレスポンスをキャメルケースに変換する関数
const convertReview = (review: any): Review => ({
  id: review.id,
  recipeId: review.recipeId,
  userId: review.userId,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

// レシピごとのレビューを取得
export const fetchReviewsByRecipeID = async (recipeId: string): Promise<Review[]> => {
  try {
    const response = await fetch(`${backendUrl}/api/reviews/${recipeId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch reviews");
    }
    const data = await response.json();
    console.log("🌀API Response:", data);
    console.log("🌀Response Headers:", Object.fromEntries(response.headers.entries()));
    const convertedReviews = data.map(convertReview);
    console.log("🌀Converted Reviews:", convertedReviews);
    return convertedReviews;
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
export const addReview = async (review: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<Review> => {
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
