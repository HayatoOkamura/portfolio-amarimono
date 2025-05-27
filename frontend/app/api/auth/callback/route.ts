import { createClient } from '@/app/lib/supabase-auth/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // ユーザー情報の同期
      const syncResponse = await fetch(`${requestUrl.origin}/api/auth/sync`, {
        method: 'POST',
      })

      if (!syncResponse.ok) {
        console.error('Failed to sync user data')
      }
    }

    // リダイレクト先のURLを環境に応じて設定
    const redirectUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://amarimono.jp'

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process authentication' },
      { status: 500 }
    )
  }
} 