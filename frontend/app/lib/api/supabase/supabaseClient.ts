import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required Supabase environment variables. Please check your .env.local file.'
  );
}

// クライアントサイドでのみ実行されるようにする
const createSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // サーバーサイドの場合
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  // クライアントサイドの場合
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'sb-qmrjsqeigdkizkrpiahs-auth-token',
      storage: {
        getItem: (key: string): string | null => {
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${key}=`));
          return cookie ? cookie.split('=')[1] : null;
        },
        setItem: (key: string, value: string): void => {
          document.cookie = `${key}=${value}; path=/; max-age=3600; secure; samesite=lax`;
        },
        removeItem: (key: string): void => {
          document.cookie = `${key}=; path=/; max-age=0; secure; samesite=lax`;
        },
      },
    },
  });
};

export const supabase = createSupabaseClient();
