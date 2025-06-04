import { createClient } from '@supabase/supabase-js';

// 本番環境用の設定を使用
const supabaseUrl = process.env.NEXT_PUBLIC_PROD_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required Supabase environment variables. Please check your .env.local file.'
  );
}

// クッキー操作のヘルパー関数
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=lax`;
};

const removeCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure;samesite=lax`;
};

// クライアントサイドでのみ実行されるようにする
const createSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // サーバーサイドの場合
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
    });
  }

  // クライアントサイドの場合
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-auth-token',
      storage: {
        getItem: (key: string): string | null => {
          try {
            return getCookie(key);
          } catch (error) {
            console.error('Error getting cookie:', error);
            return null;
          }
        },
        setItem: (key: string, value: string): void => {
          try {
            setCookie(key, value);
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        removeItem: (key: string): void => {
          try {
            removeCookie(key);
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      },
    },
  });
};

export const supabase = createSupabaseClient();
