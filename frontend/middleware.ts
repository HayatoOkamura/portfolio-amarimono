import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ミドルウェアが読み込まれたことを確認するためのログ
console.error('Middleware file loaded');

export async function middleware(req: NextRequest) {
  // デバッグ情報の出力
  console.error('=== Middleware Debug Info ===');
  console.error('Request URL:', req.url);
  console.error('Request Path:', req.nextUrl.pathname);
  console.error('All Cookies:', req.cookies.getAll().map(c => `${c.name}=${c.value}`));

  // 管理者ページへのアクセスのみをチェック
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // 管理者権限チェックはAPI Routeに委譲
    const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL}/api/auth/role`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    if (!checkResponse.ok) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const { role } = await checkResponse.json();
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    console.error('=== Middleware Debug Info End ===');
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: ['/admin/:path*'],
};