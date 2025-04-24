import { useEffect, useState } from "react";
import { backendUrl, handleApiResponse } from "../utils/api";

export const useUserLikeCount = (userId?: string) => {
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchLikeCount = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/users/${userId}/likes`);
        
        const data = await handleApiResponse(res);
        setLikeCount(data.like_count);
      } catch (error) {
        console.error("Error fetching like count:", error);
        setLikeCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLikeCount();
  }, [userId]);

  return { likeCount, loading };
};

export const useUserRecipeAverageRating = (userId?: string) => {
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchAverageRating = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/users/${userId}/reviews`);
        const data = await handleApiResponse(res);
        setAverageRating(data.average_rating);
      } catch (error) {
        console.error("Error fetching average rating:", error);
        setAverageRating(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAverageRating();
  }, [userId]);

  return { averageRating, loading };
};

// ユーザープロフィールを更新
export const updateUserProfile = async (userId: string, formData: FormData) => {
  try {
    const res = await fetch(`${backendUrl}/api/users/${userId}`, {
      method: "PUT",
      body: formData,
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};