import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/stores/userStore";
import { backendUrl } from "@/app/utils/api";
import { createClient } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  username?: string;
  profileImage?: string;
  age?: number;
  gender?: string;
  role?: string;
  email_confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthError {
  type: 'EMAIL_IN_USE' | 'REGISTRATION_FAILED' | 'LOGIN_FAILED' | 'RATE_LIMIT' | 'UNKNOWN' | 'EMAIL_NOT_CONFIRMED';
  message: string;
}

// バックエンドのユーザー情報を取得する関数
const fetchUserDetails = async (userId: string) => {
  try {
    const response = await fetch(`${backendUrl}/api/users/${userId}`);
    if (!response.ok) {
      throw new Error("User not found in backend database");
    }
    const data = await response.json();
    console.log("Backend user data:", data);
    
    return {
      username: data.username,
      profileImage: data.profileImage,
      age: data.age,
      gender: data.gender,
      role: data.role || 'user'
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return {};
  }
};

// バックエンドにユーザーを作成する関数
const createBackendUser = async (user: any) => {
  const formData = new FormData();
  formData.append("id", user.id);
  formData.append("email", user.email || "");
  formData.append("username", user.email?.split("@")[0] || "");
  formData.append("age", "0");
  formData.append("gender", "未設定");

  console.log("Sending user data to backend:", {
    id: user.id,
    email: user.email,
    username: user.email?.split("@")[0],
    age: "0",
    gender: "未設定"
  });

  const response = await fetch(`${backendUrl}/api/users`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "バックエンドへのユーザー登録に失敗しました");
  }

  // ユーザー情報を取得
  const userResponse = await fetch(`${backendUrl}/api/users/${user.id}`);
  if (!userResponse.ok) {
    throw new Error("ユーザー情報の取得に失敗しました");
  }

  const userData = await userResponse.json();
  console.log("Received user data from backend:", userData);
  return userData;
};

// エラーを生成する関数
const createAuthError = (type: AuthError['type'], message: string): AuthError => ({
  type,
  message
});

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user: storeUser, setUser: setStoreUser } = useUserStore();

  // ユーザー情報の取得
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = await createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const userData = await response.json();
        
        if (userData) {
          const userDetails = await fetchUserDetails(userData.id);
          const formattedUser: User = {
            ...userData,
            ...userDetails
          };
          setUser(formattedUser);
          setStoreUser(formattedUser);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
        setStoreUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [setStoreUser]);

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      setUser(null);
      setStoreUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    isLoading,
    logout
  };
}

