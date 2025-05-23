import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/stores/userStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { backendUrl } from "@/app/utils/api";
import { sendVerificationEmail } from "@/app/lib/api/resend/emailService";

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
  username?: string;
  profileImage?: string;
  age?: number;
  gender?: string;
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
  formData.append("age", "");
  formData.append("gender", "");

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

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error("セッションの取得に失敗しました");
        }

        if (!session) {
          console.log("No active session");
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("User error:", userError);
          throw new Error("ユーザー情報の取得に失敗しました");
        }

        if (!user) {
          console.log("No user found");
          return;
        }

        // 認証ページの場合はバックエンドユーザー情報の取得をスキップ
        const isAuthPage = window.location.pathname.startsWith('/login') || 
                          window.location.pathname.startsWith('/verify-email') ||
                          window.location.pathname.startsWith('/callback');
        
        if (isAuthPage) {
          console.log("Skipping backend user fetch on auth page");
          return;
        }

        // バックエンドのユーザー情報を取得
        try {
          const response = await fetch(`${backendUrl}/api/users/${user.id}`);
          if (!response.ok) {
            // 404エラーの場合は、ユーザーがまだ作成されていない可能性がある
            if (response.status === 404) {
              console.log("Backend user not found, this might be normal for new users");
              return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const userData = await response.json();
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch user details:", error);
          // バックエンドのエラーは致命的ではないので、エラーを投げない
        }
      } catch (error) {
        console.error("Session check error:", error);
        throw error;
      }
    };

    checkSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === 'SIGNED_IN' && session?.user) {
        // メール認証が完了しているかチェック
        if (!session.user.email_confirmed_at) {
          console.log("Email not confirmed on sign in, signing out...");
          await supabase.auth.signOut();
          setUser(null);
          router.push("/verify-email");
          return;
        }

        // バックエンドからユーザー情報を取得
        const response = await fetch(`${backendUrl}/api/users/${session.user.id}`);
        if (!response.ok) {
          throw new Error("ユーザー情報の取得に失敗しました");
        }
        const userData = await response.json();
        setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out");
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const login = async ({ email, password }: { email: string; password: string }) => {
    try {
      setIsLoggingIn(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          throw { type: 'EMAIL_NOT_CONFIRMED', message: "メール認証が完了していません" } as AuthError;
        }
        throw { type: 'LOGIN_FAILED', message: error.message } as AuthError;
      }

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        throw { type: 'EMAIL_NOT_CONFIRMED', message: "メール認証が完了していません" } as AuthError;
      }

      return null;
    } catch (error) {
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async ({ email, password }: { email: string; password: string }) => {
    try {
      setIsRegistering(true);
      console.log("Starting registration process...");
      console.log("Email:", email);

      // メールアドレスの形式をチェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw { type: 'REGISTRATION_FAILED', message: "メールアドレスの形式が正しくありません" } as AuthError;
      }

      console.log("Calling supabase.auth.signUp...");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Registration error:", error);
        if (error.message.includes("User already registered")) {
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

      // Resendを使用して認証メールを送信
      const verificationLink = `${window.location.origin}/callback?token=${data.session?.access_token}`;
      await sendVerificationEmail(email, verificationLink);

      console.log("Registration successful, redirecting to verify-email page...");
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
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const createUserAfterVerification = async (user: any) => {
    try {
      // まずバックエンドユーザーが存在するか確認
      try {
        const response = await fetch(`${backendUrl}/api/users/${user.id}`);
        if (response.ok) {
          // ユーザーが既に存在する場合はその情報を取得
          const userData = await response.json();
          setUser(userData);
          return;
        }
      } catch (error) {
        console.error("Error checking existing user:", error);
      }

      // バックエンドユーザーが存在しない場合は作成
      const formData = new FormData();
      formData.append("id", user.id);
      formData.append("email", user.email || "");
      formData.append("username", user.email?.split("@")[0] || "");
      formData.append("age", "");
      formData.append("gender", "");

      const createResponse = await fetch(`${backendUrl}/api/users`, {
        method: "POST",
        body: formData,
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "バックエンドへのユーザー登録に失敗しました");
      }

      const userData = await createResponse.json();
      setUser(userData);
    } catch (error) {
      console.error("User creation after verification error:", error);
      // エラーを投げずに、ユーザーにプロフィール設定を促す
      router.push("/user/edit?setup=true&error=creation_failed");
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

