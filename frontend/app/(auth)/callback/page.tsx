"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Loading from "@/app/components/ui/Loading/Loading";
import styles from "./callback.module.scss";

export default function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncAttempted, setSyncAttempted] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // 初期化済みの場合は実行しない
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    const checkAuth = async () => {
      // 既に処理済みの場合は実行しない
      if (isProcessing || syncAttempted) {
        console.log('🔍 Already processed, skipping...');
        return;
      }

      try {
        setIsProcessing(true);
        console.log('🔍 Starting auth check...');

        // URLからパラメータを取得
        const url = new URL(window.location.href);
        const searchParams = new URLSearchParams(url.search);
        const hashParams = new URLSearchParams(url.hash.substring(1));

        const token = hashParams.get('access_token');
        const type = hashParams.get('type');
        const email = searchParams.get('email');

        console.log('🔍 URL:', window.location.href);
        console.log('🔍 Token:', token);
        console.log('🔍 Type:', type);
        console.log('🔍 Email:', email);

        if (!token || !email) {
          setStatus('error');
          setError('認証に必要な情報が不足しています');
          return;
        }

        // クライアントサイドでのみSupabaseクライアントを初期化
        const supabase = createClient(
          process.env.NEXT_PUBLIC_PROD_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY!,
          {
            auth: {
              persistSession: true,
              storageKey: 'sb-auth-token',
              storage: typeof window !== 'undefined' ? {
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
              } : undefined,
            },
          }
        );

        // メール認証の確認
        if (type === 'signup') {
          // セッションの取得
          console.log('🔍 Fetching session...');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          console.log('🔍 Session result:', { session, sessionError });
          
          if (sessionError) {
            console.error('🔍 Session error:', sessionError);
            setStatus('error');
            setError('セッションの取得に失敗しました');
            return;
          }

          if (!session) {
            console.error('🔍 No session found');
            setStatus('error');
            setError('認証セッションが見つかりません');
            return;
          }

          // メール認証状態の確認
          console.log('🔍 Email confirmation status:', session.user.email_confirmed_at);
          if (!session.user.email_confirmed_at) {
            setStatus('error');
            setError('メール認証が完了していません');
            return;
          }

          // セッションを確実に設定
          try {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            });

            if (setSessionError) {
              console.error('🔍 Error setting session:', setSessionError);
              setStatus('error');
              setError('セッションの設定に失敗しました');
              return;
            }

            // ユーザー情報の同期（一度だけ実行）
            if (!syncAttempted) {
              console.log('🔍 Syncing user data...');
              try {
                setSyncAttempted(true);
                const syncResponse = await fetch('/api/auth/sync', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                  },
                });

                console.log('🔍 Sync response status:', syncResponse.status);
                if (!syncResponse.ok) {
                  const errorData = await syncResponse.json();
                  console.error('🔍 Sync error:', errorData);
                  // 404エラーの場合は、ユーザーが既に作成されている可能性があるので成功として扱う
                  if (syncResponse.status === 404) {
                    console.log('🔍 User already exists, proceeding...');
                    setStatus('success');
                    return;
                  }
                  setStatus('error');
                  setError(errorData.error || 'ユーザー情報の同期に失敗しました');
                  return;
                }

                // 成功時は成功状態を設定
                console.log('🔍 Authentication successful');
                setStatus('success');
              } catch (error) {
                console.error('🔍 Sync error:', error);
                setStatus('error');
                setError('ユーザー情報の同期中にエラーが発生しました');
              }
            }
          } catch (error) {
            console.error('🔍 Session setting error:', error);
            setStatus('error');
            setError('セッションの設定中にエラーが発生しました');
          }
        }
      } catch (err) {
        console.error('🔍 Auth check error:', err);
        setStatus('error');
        setError('予期せぬエラーが発生しました');
      } finally {
        setIsProcessing(false);
      }
    };

    checkAuth();
  }, []); // 依存配列を空にして、マウント時に1回だけ実行

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.messageContainer}>
        {status === 'success' ? (
          <>
            <h1>認証に成功しました</h1>
            <p>プロフィール設定ページに移動します</p>
            <div className={styles.buttonContainer}>
              <button onClick={() => router.push('/user/edit?setup=true')} className={styles.button}>
                プロフィール設定へ
              </button>
            </div>
          </>
        ) : (
          <>
            <h1>認証に失敗しました</h1>
            <p>{error}</p>
            <div className={styles.buttonContainer}>
              <button onClick={() => router.push('/login')} className={styles.button}>
                ログインページへ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}