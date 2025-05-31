import { useEffect, useState } from "react";
import { backendUrl, handleApiResponse } from "../utils/api";

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

// 特定のユーザー情報を取得するフック
export const useUser = (userId: string | undefined) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/api/users/${userId}`);
        if (!response.ok) {
          throw new Error("User not found in backend database");
        }
        const data = await response.json();
        if (isMounted) {
          setUser(data);
          setError(null);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        if (isMounted) {
          setError("ユーザー情報の取得に失敗しました");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { user, loading, error };
};

// ユーザーのいいね数を取得するフック
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

// ユーザーのレシピ評価平均を取得するフック
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