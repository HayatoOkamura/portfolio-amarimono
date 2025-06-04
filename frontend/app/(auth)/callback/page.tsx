"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/app/components/ui/Loading/Loading";
import styles from "./callback.module.scss";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { useUserStore } from "@/app/stores/userStore";

// デバッグログ用の関数
const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// トークンの保存関数
const saveTokens = (session: any) => {
  debugLog('Saving tokens', { 
    hasProviderToken: !!session?.provider_token,
    hasRefreshToken: !!session?.provider_refresh_token 
  });
  
  if (session) {
    const { provider_token, provider_refresh_token } = session;
    // セキュアなストレージに保存
    document.cookie = `provider_token=${provider_token}; HttpOnly; Secure; SameSite=Lax`;
    document.cookie = `provider_refresh_token=${provider_refresh_token}; HttpOnly; Secure; SameSite=Lax`;
  }
};

// セッションの更新関数
const refreshSession = async () => {
  debugLog('Attempting to refresh session');
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) {
    debugLog('Error refreshing session', { error });
    return null;
  }

  if (data?.session) {
    debugLog('Session refreshed successfully');
    saveTokens(data.session);
    return data.session;
  }
  
  debugLog('No session after refresh');
  return null;
};

export default function Callback() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string>("");
  const isCheckingRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const { setUser } = useUserStore();

  useEffect(() => {
    const checkAuth = async () => {
      debugLog('Callback page mounted');
      debugLog('Current URL', { url: window.location.href });

      if (isCheckingRef.current || hasCompletedRef.current) {
        debugLog('Already checking or completed');
        return;
      }
      
      try {
        isCheckingRef.current = true;
        debugLog('Starting auth check');

        // セッションの確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        debugLog('Session check result', {
          hasSession: !!session,
          hasError: !!sessionError,
          error: sessionError?.message,
          userId: session?.user?.id,
          email: session?.user?.email
        });

        if (sessionError || !session) {
          debugLog('No valid session found', { error: sessionError });
          router.push('/login');
          return;
        }

        await processSession(session);
      } catch (err) {
        debugLog('Auth check error', { 
          error: err instanceof Error ? {
            message: err.message,
            name: err.name,
            stack: err.stack
          } : err
        });
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
      } finally {
        isCheckingRef.current = false;
      }
    };

    const processSession = async (session: any) => {
      // メール認証状態の確認
      debugLog('Checking email confirmation', {
        email: session.user.email,
        confirmedAt: session.user.email_confirmed_at
      });

      if (!session.user.email_confirmed_at) {
        if (!session.user.email) {
          debugLog('No email found in session');
          throw new Error("メールアドレスが見つかりません");
        }
        debugLog('Redirecting to email verification');
        router.push(
          `/verify-email?email=${encodeURIComponent(session.user.email)}`
        );
        return;
      }

      // ユーザー情報の同期
      debugLog('Starting user data sync');
      const syncResponse = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      debugLog('Sync response', {
        status: syncResponse.status,
        ok: syncResponse.ok
      });

      if (!syncResponse.ok) {
        const syncError = await syncResponse.json();
        debugLog('Sync error', { error: syncError });
        throw new Error(
          syncError.error || "ユーザー情報の同期に失敗しました"
        );
      }

      // ユーザー情報をストアに保存
      const userData = await syncResponse.json();
      debugLog('User data received', { 
        userId: userData.id,
        hasEmail: !!userData.email
      });

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        email_confirmed_at: session.user.email_confirmed_at,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at,
        ...userData
      });

      hasCompletedRef.current = true;
      setStatus("success");
      debugLog('Auth flow completed successfully');
    };

    checkAuth();
  }, [router, setUser]);

  const handleProfileRedirect = () => {
    router.push("/user/edit");
  };

  if (status === "loading") {
    return (
      <div className={styles.container}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.messageContainer}>
        {status === "success" ? (
          <>
            <p>認証に成功しました</p>
            <div className={styles.buttonContainer}>
              <button onClick={handleProfileRedirect} className={styles.button}>
                プロフィール設定へ
              </button>
            </div>
          </>
        ) : (
          <>
            <h1>認証に失敗しました</h1>
            <p>{error}</p>
            <div className={styles.buttonContainer}>
              <button
                onClick={() => router.push("/login")}
                className={styles.button}
              >
                ログインページへ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
