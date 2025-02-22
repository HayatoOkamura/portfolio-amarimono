/* eslint-disable */
import { create } from "zustand";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";

type UserState = {
  user: any;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  setUser: (user: any) => void;
  signOut: () => Promise<void>;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  
  fetchUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    set({ user: data.user || null, isLoading: false });
  },

  setUser: (user) => set({ user }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
