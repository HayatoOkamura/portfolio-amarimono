/* eslint-disable */
import { create } from "zustand";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { backendUrl } from "../utils/apiUtils";

type UserState = {
  user: any;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  setUser: (user: any) => void;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
};

export const useUserStore = create<UserState>((set) => ({
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
    await useUserStore.getState().fetchUser(); // fetchUserを呼び出して情報を取得
    alert("ログイン成功！");
  },
}));
