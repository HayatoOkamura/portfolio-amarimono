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

// 認証用の本番環境のクライアントを作成
const prodSupabase = createClient(
  process.env.NEXT_PUBLIC_PROD_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      storageKey: 'sb-auth-token',
      storage: typeof window !== 'undefined' ? {
        getItem: (key: string): string | null => {
          try {
            const cookie = document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${key}=`));
            return cookie ? cookie.split('=')[1] : null;
          } catch (error) {
            console.error('Error getting cookie:', error);
            return null;
          }
        },
        setItem: (key: string, value: string): void => {
          try {
            document.cookie = `${key}=${value}; path=/; max-age=3600; secure; samesite=lax`;
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        removeItem: (key: string): void => {
          try {
            document.cookie = `${key}=; path=/; max-age=0; secure; samesite=lax`;
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      } : undefined,
    },
  }
);

// バックエンドのユーザー情報を取得する関数
const fetchUserDetails = async (userId: string, session: any) => {
  try {
    const response = await fetch(`${backendUrl}/api/users/${userId}`);
    if (!response.ok) {
      if (response.status === 404) {
        // ユーザーが存在しない場合は新規作成
        console.log('User not found, creating new user...');
        try {
          const newUser = await createBackendUser({
            id: userId,
            email: session.user.email,
            access_token: session.access_token
          });
          console.log('New user created:', newUser);
          return {
            username: newUser.username || '',
            profileImage: newUser.profileImage || '',
            age: newUser.age || 0,
            gender: newUser.gender || '未設定',
            role: newUser.role || 'user'
          };
        } catch (createError) {
          // ユーザー作成に失敗した場合、既に存在する可能性があるので再度取得を試みる
          console.log('Error creating user, attempting to fetch again...');
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
    console.log("Backend user data:", data);
    
    return {
      username: data.username || '',
      profileImage: data.profileImage || '',
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

  console.log("Sending user data to backend:", requestData);

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
  console.log("Received user data from backend:", responseData);
  return responseData;
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

  // ユーザー情報の取得
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await prodSupabase.auth.getSession();
        
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
          try {
            const userDetails = await fetchUserDetails(userData.id, session);
            const formattedUser: User = {
              ...userData,
              ...userDetails
            };
            setUser(formattedUser);
            setStoreUser(formattedUser);
          } catch (error) {
            console.error('Error in fetchUserDetails:', error);
            // エラーが発生した場合でも、ユーザー情報を設定
            const formattedUser: User = {
              ...userData,
              username: '',
              profileImage: '',
              age: 0,
              gender: '未設定',
              role: 'user'
            };
            setUser(formattedUser);
            setStoreUser(formattedUser);
          }
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
      // Supabaseのログアウト
      const { error } = await prodSupabase.auth.signOut();
      if (error) throw error;

      // ローカルストレージのクリア
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('user-storage');

      // クッキーのクリア
      document.cookie = 'sb-auth-token=; path=/; max-age=0; secure; samesite=lax';
      
      // 状態のリセット
      setUser(null);
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
      const { error } = await prodSupabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return createAuthError('LOGIN_FAILED', error.message);
      }
      
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
      const { data, error } = await prodSupabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback?email=${encodeURIComponent(email)}`,
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
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      return null;
    } catch (error) {
      console.error('Registration error:', error);
      return createAuthError('REGISTRATION_FAILED', 'ユーザー登録に失敗しました');
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    user,
    isLoading,
    logout,
    login,
    register,
    isLoggingIn,
    isRegistering
  };
}

