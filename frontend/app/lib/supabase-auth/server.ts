"use server";

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const isDevelopment = process.env.NODE_ENV === 'development'

export async function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              // 開発環境ではlocalhost用の設定
              ...(isDevelopment && {
                domain: 'localhost',
                secure: false,
              }),
              // 本番環境では本番用の設定
              ...(!isDevelopment && {
                domain: process.env.NEXT_PUBLIC_SITE_URL,
                secure: true,
              }),
            })
          } catch (error) {
            // Server Component内でのCookie設定エラーを無視
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              // 開発環境ではlocalhost用の設定
              ...(isDevelopment && {
                domain: 'localhost',
                secure: false,
              }),
              // 本番環境では本番用の設定
              ...(!isDevelopment && {
                domain: process.env.NEXT_PUBLIC_SITE_URL,
                secure: true,
              }),
            })
          } catch (error) {
            // Server Component内でのCookie削除エラーを無視
          }
        }
      }
    }
  )
} 