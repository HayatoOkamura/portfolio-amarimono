import { supabase } from '@/app/lib/api/supabase/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    // バックエンドAPIで管理者権限を確認
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/role`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ isAdmin: false }, { status: 403 });
    }

    const { role } = await response.json();
    return NextResponse.json({ isAdmin: role === 'admin' });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
} 