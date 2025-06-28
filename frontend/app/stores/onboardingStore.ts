import { create } from 'zustand';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (value: boolean) => void;
}

const useOnboardingStore = create<OnboardingState>((set) => {
  // 初期値を設定
  let initialValue = false;
  
  // クライアントサイドでのみlocalStorageにアクセス
  if (typeof window !== 'undefined') {
    try {
      const storedValue = localStorage.getItem('hasSeenOnboarding');
      initialValue = storedValue === 'true';
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }

  return {
    hasSeenOnboarding: initialValue,
    setHasSeenOnboarding: (value) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('hasSeenOnboarding', String(value));
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      }
      set({ hasSeenOnboarding: value });
    },
  };
});

export default useOnboardingStore; 