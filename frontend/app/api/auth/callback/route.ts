import { createClient } from '@/app/lib/supabase-auth/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const token = requestUrl.searchParams.get('token')
    const type = requestUrl.searchParams.get('type')

    console.log('🔍 Callback params:', { code, token, type })

    if (!code && !token) {
      return NextResponse.redirect(new URL('/login?error=認証コードがありません', request.url))
    }

    const supabase = await createClient()

    if (token && type === 'signup') {
      // メール認証の場合
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      })

      if (error) {
        console.error('Error verifying OTP:', error)
        return NextResponse.redirect(new URL('/login?error=認証に失敗しました', request.url))
      }
    } else if (code) {
      // OAuth認証の場合
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/login?error=認証に失敗しました', request.url))
      }
    }

    // セッションの取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(new URL('/login?error=セッションの取得に失敗しました', request.url))
    }

    // メール認証状態の確認
    if (!session.user.email_confirmed_at) {
      if (!session.user.email) {
        return NextResponse.redirect(new URL('/login?error=メールアドレスが見つかりません', request.url))
      }
      return NextResponse.redirect(new URL(`/verify-email?email=${encodeURIComponent(session.user.email)}`, request.url))
    }

    // ユーザー情報の同期
    const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!syncResponse.ok) {
      const error = await syncResponse.json()
      console.error('Sync error:', error)
      return NextResponse.redirect(new URL('/login?error=ユーザー情報の同期に失敗しました', request.url))
    }

    // 成功時はプロフィール設定ページにリダイレクト
    return NextResponse.redirect(new URL('/user/edit?setup=true', request.url))
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/login?error=予期せぬエラーが発生しました', request.url))
  }
} 