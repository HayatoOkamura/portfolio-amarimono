/* eslint-disable */
import { create } from "zustand";
import { createClient } from "@supabase/supabase-js";
import { backendUrl } from "../utils/api";
import { persist } from 'zustand/middleware';

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

type UserState = {
  user: any;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  setUser: (user: any) => void;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
};

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,

      fetchUser: async () => {
        set({ isLoading: true });
        const { data, error } = await prodSupabase.auth.getUser();
        if (error) {
          set({ user: null, isLoading: false });
          return;
        }
        const userId = data?.user?.id;
        if (userId) {
          try {
            // 取得したuser.idを使ってGoのAPIからユーザー詳細を取得
            const response = await fetch(`${backendUrl}/api/users/${userId}`);
            if (!response.ok) {
              throw new Error("Failed to fetch user details");
            }
            const userDetails = await response.json();
            // ユーザー情報をzustandストアに保存
            set({ user: { ...data.user, ...userDetails }, isLoading: false });
          } catch (error) {
            console.error("Error fetching user details:", error);
            set({ user: null, isLoading: false });
          }
        } else {
          set({ user: null, isLoading: false });
        }
      },

      setUser: (user) => set({ user, isLoading: false }),

      signOut: async () => {
        set({ isLoading: true });
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
          set({ user: null, isLoading: false });
        } catch (error) {
          console.error('SignOut error:', error);
        set({ user: null, isLoading: false });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Supabaseでログイン処理
          const { data, error } = await prodSupabase.auth.signInWithPassword({ email, password });

          if (error) {
            alert(error.message);
            set({ user: null, isLoading: false });
            return;
          }

          // ログイン後にユーザー情報を取得してzustandに保存
          const userId = data?.user?.id;
          if (userId) {
            const response = await fetch(`${backendUrl}/api/users/${userId}`);
            if (!response.ok) {
              throw new Error("Failed to fetch user details");
            }
            const userDetails = await response.json();
            set({ user: { ...data.user, ...userDetails }, isLoading: false });
          }
        } catch (error) {
          console.error("Login error:", error);
          set({ user: null, isLoading: false });
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

export { useUserStore };
