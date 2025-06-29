import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/app/lib/api/supabase/supabaseClient'

// 動的ルートとして明示的に設定（静的生成を無効化）
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies();
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