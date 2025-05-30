import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_PROD_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: 'sb-auth-token',
          storage: {
            getItem: (key: string): string | null => {
              const cookie = cookieStore.get(key)?.value;
              return cookie || null;
            },
            setItem: (key: string, value: string): void => {
              cookieStore.set(key, value, {
                path: '/',
                maxAge: 3600 * 24 * 7,
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
              });
            },
            removeItem: (key: string): void => {
              cookieStore.delete(key);
            },
          },
        },
      }
    );

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(session.user);
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    );
  }
} 