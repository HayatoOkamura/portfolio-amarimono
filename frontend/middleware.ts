import { NextResponse, type NextRequest } from 'next/server';

// ミドルウェアが読み込まれたことを確認するためのログ
console.error('Middleware file loaded');

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    '/((?!api/auth/.*|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};