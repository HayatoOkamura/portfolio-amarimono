/* eslint-disable */
import { create } from "zustand";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { backendUrl } from "../utils/api";
import { persist } from 'zustand/middleware';

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
      user: undefined,
      isLoading: true,

      fetchUser: async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          set({ user: null, isLoading: false });
          return;
        }
        const userId = data?.user?.id;
        if (userId) {
          // 取得したuser.idを使ってGoのAPIからユーザー詳細を取得
          const response = await fetch(`${backendUrl}/api/users/${userId}`);
          const userDetails = await response.json();

          if (response.ok) {
            // ユーザー情報をzustandストアに保存
            set({ user: { ...data.user, ...userDetails }, isLoading: false });
          } else {
            set({ user: null, isLoading: false });
          }
        }
      },

      setUser: (user) => set({ user }),

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, isLoading: false });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        // Supabaseでログイン処理
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          alert(error.message);
          set({ isLoading: false });
          return;
        }

        // ログイン後にユーザー情報を取得してzustandに保存
        const userId = data?.user?.id;
        if (userId) {
          // 取得したuser.idを使ってGoのAPIからユーザー詳細を取得
          const response = await fetch(`${backendUrl}/api/users/${userId}`);
          const userDetails = await response.json();

          if (response.ok) {
            // ユーザー情報をzustandストアに保存
            set({ user: { ...data.user, ...userDetails }, isLoading: false });
            alert("ログイン成功！");
          } else {
            // バックエンドにユーザーが存在しない場合はログアウト
            await supabase.auth.signOut();
            set({ user: null, isLoading: false });
            alert("ユーザー情報が正しく設定されていません。管理者にお問い合わせください。");
          }
        }
      },
    }),
    {
      name: 'user-storage',
    }
  )
);

export { useUserStore };
