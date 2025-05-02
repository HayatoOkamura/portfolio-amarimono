import { useEffect, useState } from "react";
import { backendUrl, handleApiResponse } from "../utils/api";

export const useUserLikeCount = (userId: string | undefined) => {
  const [likeCount, setLikeCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchLikeCount = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${backendUrl}/api/users/${userId}/likes`);
        const data = await handleApiResponse(res);
        if (isMounted) {
          setLikeCount(data.like_count);
        }
      } catch (error) {
        console.error("Error fetching like count:", error);
        if (isMounted) {
          setLikeCount(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLikeCount();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { likeCount, loading };
};

export const useUserRecipeAverageRating = (userId: string | undefined) => {
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAverageRating = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${backendUrl}/api/users/${userId}/reviews`);
        const data = await handleApiResponse(res);
        if (isMounted) {
          setAverageRating(data.average_rating);
        }
      } catch (error) {
        console.error("Error fetching average rating:", error);
        if (isMounted) {
          setAverageRating(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAverageRating();

    return () => {
      isMounted = false;
    };
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