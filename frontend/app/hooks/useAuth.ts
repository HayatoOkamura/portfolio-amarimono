import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/stores/userStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { backendUrl } from "@/app/utils/api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  profileImage?: string;
  age?: number;
  gender?: string;
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
  const response = await fetch(`${backendUrl}/api/users/${userId}`);
  if (!response.ok) {
    throw new Error("User not found in backend database");
  }
  return response.json();
};

// バックエンドにユーザーを作成する関数
const createBackendUser = async (user: any) => {
  const formData = new FormData();
  formData.append("id", user.id);
  formData.append("email", user.email || "");
  formData.append("username", user.email?.split("@")[0] || "");
  formData.append("age", "0");
  formData.append("gender", "未設定");

  const response = await fetch(`${backendUrl}/api/users`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "バックエンドへのユーザー登録に失敗しました");
  }

  return response.json();
};

// エラーを生成する関数
const createAuthError = (type: AuthError['type'], message: string): AuthError => ({
  type,
  message
});

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  const { user: storeUser, setUser: setStoreUser } = useUserStore();

  // 初期セッション確認（初回のみ）
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (session) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (!isMounted) return;

          if (authUser) {
            const userData: User = {
              id: authUser.id,
              email: authUser.email || '',
              created_at: authUser.created_at,
              updated_at: authUser.updated_at
            };
            setUser(userData);
            setStoreUser(userData);
          }
        } else {
          setUser(null);
          setStoreUser(null);
        }
      } catch (error) {
        console.error('useAuth: Error checking session', error);
        if (isMounted) {
          setUser(null);
          setStoreUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // 認証状態の変更を監視（ログアウト時のみ）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setStoreUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setStoreUser]);

  // storeUserの変更を監視
  useEffect(() => {
    if (storeUser !== user) {
      setUser(storeUser);
    }
  }, [storeUser]);

  const login = async ({ email, password }: { email: string; password: string }) => {
    try {
      setIsLoggingIn(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          const authError = { type: 'EMAIL_NOT_CONFIRMED', message: "メール認証が完了していません。認証ページに移動します..." } as AuthError;
          await new Promise(resolve => setTimeout(resolve, 1500));
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return Promise.reject(authError);
        }
        throw { type: 'LOGIN_FAILED', message: error.message } as AuthError;
      }

      if (!data.user?.email_confirmed_at) {
        const authError = { type: 'EMAIL_NOT_CONFIRMED', message: "メール認証が完了していません。認証ページに移動します..." } as AuthError;
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return Promise.reject(authError);
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("useAuth: Error getting user data:", userError);
        throw { type: 'LOGIN_FAILED', message: userError.message } as AuthError;
      }
      if (user) {
        // User型の変換
        const formattedUser: User = {
          id: user.id,
          email: user.email || '',
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          updated_at: user.updated_at
        };
        setUser(formattedUser);
        setStoreUser(formattedUser);
      }

      return null;
    } catch (error) {
      if (error instanceof Error) {
        throw { type: 'UNKNOWN', message: error.message } as AuthError;
      }
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async ({ email, password }: { email: string; password: string }) => {
    try {
      setIsRegistering(true);

      // メールアドレスの形式をチェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw { type: 'REGISTRATION_FAILED', message: "メールアドレスの形式が正しくありません" } as AuthError;
      }

      // 新規登録処理
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (error) {
        console.error("Registration error:", error);
        console.log("Error details:", {
          message: error.message,
          status: error.status,
          name: error.name
        });

        if (error.message.includes("already registered") || 
            error.message.includes("already exists") || 
            error.message.includes("already in use")) {
          throw { type: 'EMAIL_IN_USE', message: "このメールアドレスは既に登録されています" } as AuthError;
        } else if (error.message.includes("rate limit")) {
          throw { type: 'RATE_LIMIT', message: "送信制限に達しました。しばらく待ってから再度お試しください" } as AuthError;
        } else if (error.message.includes("email")) {
          throw { type: 'REGISTRATION_FAILED', message: "メールアドレスが無効です" } as AuthError;
        } else {
          throw { type: 'REGISTRATION_FAILED', message: error.message } as AuthError;
        }
      }

      if (!data.user) {
        throw { type: 'REGISTRATION_FAILED', message: "ユーザー登録に失敗しました" } as AuthError;
      }

      // identitiesを使用して既存ユーザーをチェック
      const identities = data.user.identities;
      console.log("User identities:", identities);

      if (identities?.length === 0) {
        throw { type: 'EMAIL_IN_USE', message: "このメールアドレスは既に登録されています" } as AuthError;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      return null;
    } catch (error) {
      console.error("Registration process error:", error);
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setStoreUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const createUserAfterVerification = async (user: any) => {
    try {
      if (!user?.id) {
        console.error("Invalid user data:", user);
        throw new Error("ユーザーIDが存在しません");
      }

      // 既に作成済みかチェック
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingUser) {
        console.log("User already exists in backend:", existingUser);
        return existingUser;
      }

      // バックエンドにユーザーを作成
      const userData = await createBackendUser(user);
      
      if (!userData) {
        throw new Error("ユーザー情報の作成に失敗しました");
      }

      // ユーザー情報を更新
      const formattedUser: User = {
        id: user.id,
        email: user.email || '',
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        ...userData
      };

      setUser(formattedUser);
      setStoreUser(formattedUser);

      return userData;
    } catch (error) {
      console.error("ユーザー作成エラー:", error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    isLoggingIn,
    isRegistering,
    login,
    register,
    logout,
    setUser,
    createUserAfterVerification,
  };
}

