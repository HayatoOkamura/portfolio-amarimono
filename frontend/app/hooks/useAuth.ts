import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/stores/userStore";
import { backendUrl } from "@/app/utils/api";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";

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
const fetchUserDetails = async (userId: string, session: any) => {
  try {
    const response = await fetch(`${backendUrl}/api/users/${userId}`);
    if (!response.ok) {
      if (response.status === 404) {
        // ユーザーが存在しない場合は新規作成
        try {
          const newUser = await createBackendUser({
            id: userId,
            email: session.user.email,
            access_token: session.access_token
          });
          return {
            username: newUser.username || '',
            profileImage: newUser.profileImage || '',
            age: newUser.age || 0,
            gender: newUser.gender || '未設定',
            role: newUser.role || 'user'
          };
        } catch (createError) {
          // ユーザー作成に失敗した場合、既に存在する可能性があるので再度取得を試みる
          const retryResponse = await fetch(`${backendUrl}/api/users/${userId}`);
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return {
              username: retryData.username || '',
              profileImage: retryData.profileImage || '',
              age: retryData.age || 0,
              gender: retryData.gender || '未設定',
              role: retryData.role || 'user'
            };
          }
          // それでも失敗した場合はデフォルト値を返す
          console.error('Error creating and fetching user:', createError);
          return {
            username: '',
            profileImage: '',
            age: 0,
            gender: '未設定',
            role: 'user'
          };
        }
      }
      throw new Error("Failed to fetch user details");
    }
    const data = await response.json();
    
    return {
      username: data.username || '',
      profileImage: data.profile_image || '',
      age: data.age || 0,
      gender: data.gender || '未設定',
      role: data.role || 'user'
    };
  } catch (error) {
    console.error("Error in fetchUserDetails:", error);
    // エラーが発生した場合でも、デフォルト値を返す
    return {
      username: '',
      profileImage: '',
      age: 0,
      gender: '未設定',
      role: 'user'
    };
  }
};

// バックエンドにユーザーを作成する関数
const createBackendUser = async (user: any) => {
  const requestData = {
    id: user.id,
    email: user.email || "",
    age: 0,
    gender: "未設定"
  };

  const response = await fetch(`${backendUrl}/api/users`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.access_token}`
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error creating user:", errorData);
    throw new Error(errorData.error || "バックエンドへのユーザー登録に失敗しました");
  }

  const responseData = await response.json();
  return responseData;
};

// エラーを生成する関数
const createAuthError = (type: AuthError['type'], message: string): AuthError => ({
  type,
  message
});

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  const { user: storeUser, setUser: setStoreUser } = useUserStore();

  // ユーザー情報の取得
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setStoreUser(null);
          setIsLoading(false);
          return;
        }

        // セッションからユーザー情報を取得
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          email_confirmed_at: session.user.email_confirmed_at,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at
        };

        // バックエンドからユーザー詳細情報を取得
        try {
          const userDetails = await fetchUserDetails(userData.id, session);
          
          const formattedUser: User = {
            ...userData,
            ...userDetails,
            profileImage: userDetails.profileImage || null
          };
          setStoreUser(formattedUser);
        } catch (error) {
          // エラーが発生しても基本的なユーザー情報は設定
          setStoreUser(userData);
        }
      } catch (error) {
        console.error('🔍 Error fetching user:', error);
        setStoreUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [setStoreUser]);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // ローカルストレージのクリア
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('user-storage');

      // クッキーのクリア
      document.cookie = 'sb-auth-token=; path=/; max-age=0; secure; samesite=lax';
      
      // 状態のリセット
      setStoreUser(null);
      
      // ログインページへリダイレクト
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const login = async ({ email, password }: { email: string; password: string }): Promise<AuthError | null> => {
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return createAuthError('LOGIN_FAILED', error.message);
      }

      if (!data.session) {
        return createAuthError('LOGIN_FAILED', 'セッションの取得に失敗しました');
      }

      // ユーザー情報をストアに保存
      setStoreUser({
        id: data.user.id,
        email: data.user.email || '',
        email_confirmed_at: data.user.email_confirmed_at,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at
      });
      
      return null;
    } catch (error) {
      return createAuthError('UNKNOWN', 'ログイン中にエラーが発生しました');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async ({ email, password }: { email: string; password: string }): Promise<AuthError | null> => {
    setIsRegistering(true);
    try {
      // Supabaseでのユーザー登録
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return createAuthError('EMAIL_IN_USE', 'このメールアドレスは既に登録されています');
        }
        throw error;
      }

      if (!data.user) {
        throw new Error('ユーザー登録に失敗しました');
      }

      // メール認証ページにリダイレクト
      return null;
    } catch (error) {
      console.error('Registration error:', error);
      return createAuthError('REGISTRATION_FAILED', 'ユーザー登録に失敗しました');
    } finally {
      setIsRegistering(false);
    }
  };

  const signInWithGoogle = async (isLogin: boolean = true) => {
    try {
      console.log('🔍 Starting Google sign in process', { isLogin });
      
      if (isLogin) {
        // ログイン時は直接認証を実行
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
          }
        });

        if (error) {
          console.error('Error during Google sign in:', error);
          return createAuthError('LOGIN_FAILED', error.message);
        }

        if (data?.url) {
          console.log('🔍 Redirecting to:', data.url);
          window.location.href = data.url;
        } else {
          console.error('No redirect URL provided');
          return createAuthError('LOGIN_FAILED', '認証URLの取得に失敗しました');
        }
      } else {
        // 新規登録時はコールバックページを経由
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/callback`,
          }
        });

        if (error) {
          console.error('Error during Google sign in:', error);
          return createAuthError('LOGIN_FAILED', error.message);
        }

        if (data?.url) {
          console.log('🔍 Redirecting to:', data.url);
          window.location.href = data.url;
        } else {
          console.error('No redirect URL provided');
          return createAuthError('LOGIN_FAILED', '認証URLの取得に失敗しました');
        }
      }

      return null;
    } catch (error) {
      console.error('Unexpected error during Google sign in:', error);
      return createAuthError('UNKNOWN', 'Google認証中にエラーが発生しました');
    }
  };

  return {
    user: storeUser,
    isLoading,
    logout,
    login,
    register,
    signInWithGoogle,
    isLoggingIn,
    isRegistering
  };
}

