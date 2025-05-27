import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ミドルウェアが読み込まれたことを確認するためのログ
console.error('Middleware file loaded');

export async function middleware(request: NextRequest) {
  // デバッグ情報の出力
  console.error('=== Middleware Debug Info ===');
  console.error('Request URL:', request.url);
  console.error('Request Path:', request.nextUrl.pathname);
  console.error('All Cookies:', request.cookies.getAll().map(c => `${c.name}=${c.value}`));

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // 認証が必要なパスの場合
  const protectedPaths = ['/admin', '/profile', '/settings']; // 認証が必要なパスを明示的に指定
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));
  
  if (!session && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 管理者ページへのアクセスのみをチェック
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 管理者権限チェックはAPI Routeに委譲
    const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL}/api/auth/role`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });
    if (!checkResponse.ok) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const { role } = await checkResponse.json();
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  console.error('=== Middleware Debug Info End ===');
  return response;
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    '/((?!api/auth/.*|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};