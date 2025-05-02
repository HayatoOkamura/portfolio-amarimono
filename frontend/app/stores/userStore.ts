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
      user: null,
      isLoading: true,

      fetchUser: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.getUser();
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
        await supabase.auth.signOut();
        set({ user: null, isLoading: false });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Supabaseでログイン処理
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });

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
