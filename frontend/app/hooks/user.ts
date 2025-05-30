import { useEffect, useState } from "react";
import { backendUrl, handleApiResponse } from "../utils/api";
import { createClient } from "@supabase/supabase-js";
import { useUserStore } from "@/app/stores/userStore";

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_PROD_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY!
);

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

// ユーザー情報を取得するフック
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
    // ユーザーストアから現在のユーザー情報を取得
    const { user: currentUser } = useUserStore.getState();
    
    if (!currentUser?.email) {
      throw new Error("User email not found in store");
    }

    // FormDataからJSONデータを作成
    const userData = {
      id: userId,
      email: currentUser.email, // ストアから取得したメールアドレスを使用
      username: formData.get('username') || '',
      age: formData.get('age') ? Number(formData.get('age')) : null,
      gender: formData.get('gender') || '',
      profile_image: formData.get('profile_image') ? String(formData.get('profile_image')) : null
    };

    const res = await fetch(`${backendUrl}/api/users/${userId}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    return await handleApiResponse(res);
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};