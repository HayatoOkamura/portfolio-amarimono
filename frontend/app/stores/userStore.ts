/* eslint-disable */
import { create } from "zustand";
import { persist } from 'zustand/middleware';

type UserState = {
  user: any;
  isLoading: boolean;
  setUser: (user: any) => void;
};

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,

      setUser: (user) => set({ user, isLoading: false }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

export { useUserStore };
